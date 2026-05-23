import * as Phaser from 'phaser';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { WEAPON_DEFS, WeaponDef } from '../data/weapons';
import { audio } from './AudioSystem';
import { ISceneContext } from '../core/ISceneContext';
import { BALANCE } from '../core/BalanceConfig';
import { globalEventBus } from '../core/GlobalEventBus';
import { computeLevelScaledWeaponStats } from './weaponLevelScaling';
import { applyWeaponEvolutionStats } from './weaponEvolutionStats';
import { resolveEffectiveCooldownMs } from './effectiveWeaponCooldown';
import { resolveMuzzleFlashColor, resolveWeaponVfxColor } from './muzzleFlashColors';
import { fillCirclePool } from './fillCirclePool';
import { musicEngine } from './music/ProceduralMusicEngine';
import { applyPibrochDamage, isPibrochAligned, PIBROCH_WINDOW_MS } from './music/pibrochAlignment';
import { applyPibrochHammerRhythm, applyWaulkingRhythm } from './music/waulkingRhythm';
import { populateEvolvedKeys } from './evolvedWeaponKeys';
import {
  createDashStrikeState,
  tickDashStrike,
  resetDashStrike,
  type DashStrikeState,
} from '../entities/dashStrikeTrigger';
import {
  STAG_ANTLER_DASH_STRIKE_COOLDOWN_MS,
  MONARCH_CHARGE_DASH_STRIKE_COOLDOWN_MS,
  STAG_ANTLER_DASH_STRIKE_DAMAGE_MUL,
  MONARCH_CHARGE_DASH_STRIKE_DAMAGE_MUL,
  MONARCH_CHARGE_DASH_STRIKE_FREEZE_MS,
  MONARCH_CHARGE_DASH_STRIKE_FREEZE_FRACTION,
} from '../data/weapons';

/** Runtime state for an equipped weapon */
export interface ActiveWeapon {
  config: WeaponDef;
  level: number;
  cooldownRemaining: number;
  damage: number;
  cooldownMs: number;
  projectileCount: number;
  pierce: number;
  aoeRadius: number;
  /** Set when weapon is evolved — changes behavior in fireWeapon */
  evolved: boolean;
  evolutionKey: string;
  /** Phase B Endless — true after Overcharge upgrade (post-bell only). */
  overcharged: boolean;
}

/**
 * WeaponSystem — manages all 6 weapon types with different behaviors.
 *
 * Projectile weapons (thistle_shot, caber_toss, haggis_hurler) use pooled sprites.
 * Area weapons (bagpipe_blast, scotch_mist, nessie_tentacle) directly query enemies.
 */
export class WeaponSystem {
  private scene: Phaser.Scene & ISceneContext;
  private weapons: ActiveWeapon[] = [];
  private projectilePool: Phaser.GameObjects.Group;
  private enemyGroup: Phaser.GameObjects.Group;

  /** Last known player facing angle (radians) — used for directional weapons */
  private playerFacing: number = 0;

  /** DESIGN_IDEAS §5 — live player dash state, snapshotted each
   *  frame by `setPlayerDashState`. Drives the Stag Antler /
   *  Monarch's Charge dash-strike fork in `update`. */
  private playerIsDashing: boolean = false;
  private playerDashFacing: number | null = null;

  /** DESIGN_IDEAS §5 — per-weapon dash-strike state. One entry per
   *  stag-family weapon owned this run (today: stag_antler only —
   *  Monarch's Charge re-uses the same weapon slot when evolved).
   *  Lazily initialised on first dash-strike-eligible weapon to
   *  avoid allocating for every WeaponSystem instance. */
  private dashStrikeStates: Map<string, DashStrikeState> = new Map();

  /** Trail frame counter — spawn trail particles every N frames */
  private trailCounter: number = 0;

  /** Scratch Set holding the keys of currently-evolved weapons — populated
   *  once per trail-spawn tick so each projectile's evolved-flag lookup is
   *  O(1) `.has()` instead of O(weapons) `Array.some` with a per-call
   *  closure allocation. */
  private evolvedKeysScratch: Set<string> = new Set();

  /** Per-frame cache: active enemies sorted by distance to player.
   *  Built lazily on first findClosestEnemy() call per frame. */
  private cachedSortedEnemies: Enemy[] = [];
  private cachedSortedDistSq: number[] = [];
  private enemyCacheFrame: number = -1;
  private cachePlayerX: number = 0;
  private cachePlayerY: number = 0;
  private frameCounter: number = 0;

  /** Pooled VFX circles for weapon visual effects (pulse rings, zones, blasts). */
  private vfxCirclePool: Phaser.GameObjects.Arc[] = [];
  private vfxCircleIdx: number = 0;

  /** Pooled VFX graphics for arc sweep visuals. */
  private vfxGfxPool: Phaser.GameObjects.Graphics[] = [];
  private vfxGfxIdx: number = 0;

  /** Multipliers from player upgrades — set each frame by GameScene */
  private damageMultiplier: number = 1;
  private aoeMultiplier: number = 1;
  private attackSpeedMultiplier: number = 1;
  private critChance: number = 0.10;
  private critDamageMultiplier: number = 2.0;
  private cooldownReduction: number = 0;
  /** Run-scoped curse multiplier. 1.0 identity; >1 slower fire. */
  private curseCooldownMul: number = 1;
  /** Pibroch variant — extra ms added to the base ±80 ms beat window. */
  private pibrochWindowExtensionMs: number = 0;

  /** Emits:
   *  - 'enemyKilled' (x, y, xpValue, key, wasBoss, wasElite, eliteAffixId?)
   *  - 'damageDealt' (x, y, amount, isCrit, weaponKey)
   *  - 'eliteOrBossFinished' ({enemyKey, wasBoss, distancePx}) — only
   *    when the dying enemy was an elite or boss. Drives the Taxman
   *    Grudge Ledger (`src/entities/grudgeLedger.ts`); listener
   *    snapshots the player HP fraction at receipt and records.
   */
  readonly events = new Phaser.Events.EventEmitter();

  /** Set true when GameScene shuts down — stops stale callbacks from touching freed state. */
  private destroyed: boolean = false;
  destroy(): void {
    this.destroyed = true;
    // Clear run-scoped state so pooled objects can't bleed into a new run
    this.events.removeAllListeners();
    this.weapons = [];
    this.trailCounter = 0;
    this.playerFacing = 0;
    this.playerIsDashing = false;
    this.playerDashFacing = null;
    // Reset dash-strike cooldowns + edge memory; a stale cooldown
    // from the prior run must not gate the first dash of a fresh run.
    for (const state of this.dashStrikeStates.values()) resetDashStrike(state);
    this.dashStrikeStates.clear();

    const projectiles = this.projectilePool.getChildren() as Projectile[];
    for (const p of projectiles) {
      if (p.active) {
        try { p.destroy(); } catch { /* ignore */ }
        p.active = false;
        p.visible = false;
      }
    }
    try { this.projectilePool.clear(true, true); } catch { /* ignore */ }

    // Clean up VFX pools
    for (const c of this.vfxCirclePool) {
      this.scene.tweens.killTweensOf(c);
      c.destroy();
    }
    for (const g of this.vfxGfxPool) {
      this.scene.tweens.killTweensOf(g);
      g.destroy();
    }
    this.vfxCirclePool = [];
    this.vfxGfxPool = [];
  }

  constructor(scene: Phaser.Scene & ISceneContext, enemyGroup: Phaser.GameObjects.Group) {
    this.scene = scene;
    this.enemyGroup = enemyGroup;

    // Projectile pool (shared across all projectile-based weapons)
    this.projectilePool = scene.add.group({
      classType: Projectile,
      maxSize: BALANCE.weapons.projectilePoolMax,
      runChildUpdate: false,
    });
    for (let i = 0; i < BALANCE.weapons.projectilePrewarm; i++) {
      this.projectilePool.add(new Projectile(scene));
    }
    // Wire shared FX pool for projectile pop effects
    Projectile.fxPool = scene.getStatusFxPool();

    // Pre-allocate VFX circle pool — 30 covers all weapon visual effects
    // (pulse rings, zones, blasts) with headroom above ~13 max simultaneous.
    fillCirclePool(scene, this.vfxCirclePool, 30, 10, 0xffffff, 0.5, 10);
    // Pre-allocate VFX graphics pool — 5 covers arc sweep visuals
    for (let i = 0; i < 5; i++) {
      const g = scene.add.graphics().setDepth(10).setVisible(false);
      this.vfxGfxPool.push(g);
    }

    // Start with Thistle Shot
    this.addWeapon('thistle_shot');

    // Projectile ↔ enemy collision
    scene.physics.add.overlap(
      this.projectilePool,
      enemyGroup,
      this.onProjectileHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  /** Acquire a pooled VFX circle, resetting it for reuse. O(1) circular indexing. */
  private acquireVfxCircle(x: number, y: number, radius: number, color: number, alpha: number): Phaser.GameObjects.Arc {
    const c = this.vfxCirclePool[this.vfxCircleIdx];
    this.vfxCircleIdx = (this.vfxCircleIdx + 1) % this.vfxCirclePool.length;
    this.scene.tweens.killTweensOf(c);
    c.setPosition(x, y);
    c.setRadius(radius);
    c.setFillStyle(color, alpha);
    c.setAlpha(alpha);
    c.setScale(1);
    c.setVisible(true);
    return c;
  }

  /** Acquire a pooled VFX graphics object, clearing it for reuse. */
  private acquireVfxGraphics(): Phaser.GameObjects.Graphics {
    const g = this.vfxGfxPool[this.vfxGfxIdx];
    this.vfxGfxIdx = (this.vfxGfxIdx + 1) % this.vfxGfxPool.length;
    this.scene.tweens.killTweensOf(g);
    g.clear();
    g.setAlpha(1);
    g.setVisible(true);
    return g;
  }

  addWeapon(key: string): boolean {
    if (this.hasWeapon(key)) return false;
    const def = WEAPON_DEFS[key as import('../data/weapons').WeaponKey];
    if (!def) return false;

    this.weapons.push({
      config: def,
      level: 1,
      cooldownRemaining: 0,
      damage: def.damage,
      cooldownMs: def.cooldownMs,
      projectileCount: def.projectileCount,
      pierce: def.pierce,
      aoeRadius: def.aoeRadius,
      evolved: false,
      evolutionKey: '',
      overcharged: false,
    });
    return true;
  }

  levelUpWeapon(key: string): boolean {
    const w = this.weapons.find(w => w.config.key === key);
    if (!w || w.level >= 5) return false;

    w.level++;
    const scaled = computeLevelScaledWeaponStats(w.config, w.level);
    w.damage = scaled.damage;
    w.cooldownMs = scaled.cooldownMs;
    w.pierce = scaled.pierce;
    w.aoeRadius = scaled.aoeRadius;

    if (w.config.levelScaling.countAt.includes(w.level)) {
      w.projectileCount++;
    }

    return true;
  }

  /**
   * Evolve a weapon in-place: the base slot stays the source weapon key for saves,
   * but combat switches to `evolutionKey` (see fireEvolved). Idempotent — returns
   * false if already evolved or missing.
   */
  evolveWeapon(weaponKey: string, evolutionKey: string): boolean {
    const w = this.weapons.find(w => w.config.key === weaponKey);
    if (!w || w.evolved) return false;

    w.evolved = true;
    w.evolutionKey = evolutionKey;

    // Evolved weapons get a ~3.5× effective-DPS spike — big but not
    // single-slot-wins. Tuning lives in weaponEvolutionStats.ts.
    const boosted = applyWeaponEvolutionStats({
      damage: w.damage,
      cooldownMs: w.cooldownMs,
      projectileCount: w.projectileCount,
      aoeRadius: w.aoeRadius,
      pierce: w.pierce,
    });
    w.damage = boosted.damage;
    w.cooldownMs = boosted.cooldownMs;
    w.projectileCount = boosted.projectileCount;
    w.aoeRadius = boosted.aoeRadius;
    w.pierce = boosted.pierce;

    return true;
  }

  /**
   * Phase B Endless — Overcharge an evolved weapon: +25% damage and +20%
   * area. Post-bell mythic-tier offer. Idempotent — returns false if not
   * found, not evolved yet, or already overcharged.
   */
  applyOvercharge(weaponKey: string): boolean {
    const w = this.weapons.find(w => w.config.key === weaponKey);
    if (!w || !w.evolved || w.overcharged) return false;
    w.overcharged = true;
    w.damage = Math.ceil(w.damage * 1.25);
    w.aoeRadius = Math.ceil(w.aoeRadius * 1.20);
    return true;
  }

  /** Phase B Endless — keys of currently overcharged weapons (for save / UI). */
  getOverchargedKeys(): string[] {
    return this.weapons.filter(w => w.overcharged).map(w => w.config.key);
  }

  /** Update player facing from external source (called by GameScene) */
  setPlayerFacing(angle: number): void {
    this.playerFacing = angle;
  }

  /**
   * DESIGN_IDEAS §5 — snapshot the live player dash state so the
   * Stag Antler dash-strike fork in `update()` can edge-detect on
   * `isDashing` and aim the bonus arc at `dashFacing`. Called each
   * frame by `tickFrameWorld` next to `setPlayerFacing`.
   */
  setPlayerDashState(isDashing: boolean, facing: number | null): void {
    this.playerIsDashing = isDashing;
    this.playerDashFacing = facing;
  }

  /** Update multipliers from player stats (called by GameScene each frame) */
  setMultipliers(damage: number, aoe: number, attackSpeed: number, critChance: number = 0.10, cooldownReduction: number = 0, critDmgMul: number = 2.0): void {
    this.damageMultiplier = damage;
    this.aoeMultiplier = aoe;
    this.attackSpeedMultiplier = attackSpeed;
    this.critChance = critChance;
    this.cooldownReduction = cooldownReduction;
    this.critDamageMultiplier = critDmgMul;
  }

  /** Run-scoped curse modifier — clamps >=0.05 so a bug can't freeze fire. */
  setCurseCooldownMul(mul: number): void {
    this.curseCooldownMul = Math.max(0.05, Number.isFinite(mul) ? mul : 1);
  }

  /** Pibroch variant — widen the beat-alignment window at run start. */
  setPibrochWindowExtensionMs(ms: number): void {
    this.pibrochWindowExtensionMs = Math.max(0, ms);
  }

  getCurseCooldownMul(): number {
    return this.curseCooldownMul;
  }

  /**
   * R1 M3 T20d — per-hit damage modifier. Called inside dealDamageToEnemy
   * with the resolved damage + wall-clock ms + elite flag + enemy velocity
   * dot toward player; return value replaces the damage before it lands.
   * Used for bronze_clasp's first-hit-per-second bonus, highland_torque's
   * +100% elite damage, and (R1 M4.5 P3) fishermens_net's +30% for
   * enemies fleeing the haggis. Null = identity. Cleared on scene restart.
   */
  setHitDamageModifier(
    fn: ((damage: number, nowMs: number, isElite: boolean, velocityDotTowardPlayer: number) => number) | null,
  ): void {
    this.hitDamageModifier = fn;
  }

  private hitDamageModifier:
    | ((damage: number, nowMs: number, isElite: boolean, velocityDotTowardPlayer: number) => number)
    | null = null;

  /**
   * V2 (Cailleach Gauntlet) — on-hit hook for the Stormcrown freeze
   * proc. Fired once per dealDamageToEnemy call AFTER damage is
   * applied but BEFORE the kill-event branch, so a fatal hit still
   * gets to roll the freeze (and a frozen-but-killed enemy reads as
   * the relic doing its work). Caller wires this to
   * `driver.tryStormcrownFreeze(rng, isCrit) ? enemy.applyFreeze(...) : null`.
   */
  setStormcrownOnHitHook(fn: ((enemy: Enemy, isCrit: boolean) => void) | null): void {
    this.stormcrownOnHitHook = fn;
  }
  private stormcrownOnHitHook: ((enemy: Enemy, isCrit: boolean) => void) | null = null;

  update(delta: number, playerX: number, playerY: number): void {
    this.frameCounter++;
    this.cachePlayerX = playerX;
    this.cachePlayerY = playerY;

    // Update active projectiles + spawn trail particles
    this.trailCounter++;
    const spawnTrail = this.trailCounter % BALANCE.weapons.trailEveryNFrames === 0;
    if (spawnTrail) {
      // One sweep over `weapons` populates the scratch Set; the per-projectile
      // loop below then does an O(1) `.has()` to decide trail style. Replaces
      // the prior `Array.some` + closure allocation per projectile.
      populateEvolvedKeys(this.weapons, this.evolvedKeysScratch);
    }
    const projectiles = this.projectilePool.getChildren() as Projectile[];
    for (const proj of projectiles) {
      if (proj.active) {
        proj.update(delta);
        if (spawnTrail) {
          const wKey = proj.getWeaponKey();
          const isEvolved = wKey ? this.evolvedKeysScratch.has(wKey) : false;
          this.events.emit('projectileTrail', proj.x, proj.y, isEvolved, wKey);
        }
      }
    }

    // Tick each weapon. The reset formula below already bakes in
    // attackSpeedMultiplier and cooldownReduction, so the decrement itself
    // is plain delta — multiplying it by attackSpeedMultiplier would
    // compound and make fire rate quadratic in the stat (20% attack speed
    // was actually giving ~44% faster fire).
    for (const weapon of this.weapons) {
      weapon.cooldownRemaining -= delta;
      if (weapon.cooldownRemaining <= 0) {
        // Scale the cooldown reset by all run-scoped multipliers (attack
        // speed, cooldown reduction, curse). resolveEffectiveCooldownMs
        // enforces the absolute floor + the asp-clamp.
        const effectiveCooldown = resolveEffectiveCooldownMs(
          weapon.cooldownMs,
          this.attackSpeedMultiplier,
          this.cooldownReduction,
          this.curseCooldownMul,
        );
        weapon.cooldownRemaining = Math.max(weapon.cooldownRemaining, -effectiveCooldown)
          + effectiveCooldown;
        this.fireWeapon(weapon, playerX, playerY);
        // Only play shoot sound for projectile-type weapons — AoE/trail/sweep have wrong sound
        const b = weapon.config.behavior;
        if (b === 'projectile' || b === 'piercing' || b === 'bouncing') {
          this.scene.getSFXManager().tryPlay('shoot', () => audio.playShootImmediate());
        }
      }
    }

    // DESIGN_IDEAS §5 — Stag Antler dash-strike. Runs AFTER the
    // standard weapon-cooldown pass so a dash-frame can fire both
    // the auto-arc AND the bonus arc, but on the player-input edge,
    // not the cooldown clock. Fully gated by the per-weapon
    // dash-strike cooldown (1500 ms base / 1300 ms evolved); a player
    // with stacked dash charges + a refresh route can't auto-spam the
    // bonus arc, the weapon's own pace caps it.
    for (const weapon of this.weapons) {
      if (!this.weaponSupportsDashStrike(weapon)) continue;
      const state = this.getOrCreateDashStrikeState(weapon.config.key);
      const cooldown = weapon.evolved
        ? MONARCH_CHARGE_DASH_STRIKE_COOLDOWN_MS
        : STAG_ANTLER_DASH_STRIKE_COOLDOWN_MS;
      const result = tickDashStrike(state, {
        isDashing: this.playerIsDashing,
        deltaMs: delta,
        cooldownMsOnFire: cooldown,
      });
      if (!result.shouldFire) continue;
      // Only fire when we have a dash facing — `getDashFacingAngle`
      // returns null only before the first dash of a run, which the
      // rising-edge gate has already excluded. Defensive guard for
      // unit-test stubs that might not seed `lastDashDir`.
      const facing = this.playerDashFacing;
      if (facing === null) continue;
      this.fireDashStrike(weapon, playerX, playerY, facing);
    }
  }

  /** DESIGN_IDEAS §5 — only stag-family weapons (today: stag_antler
   *  base + monarch_charge evolution) opt into the dash-strike fork.
   *  All other weapons fall through; the helper's per-weapon Map
   *  stays empty for them. */
  private weaponSupportsDashStrike(weapon: ActiveWeapon): boolean {
    return weapon.config.key === 'stag_antler';
  }

  private getOrCreateDashStrikeState(key: string): DashStrikeState {
    let state = this.dashStrikeStates.get(key);
    if (!state) {
      state = createDashStrikeState();
      this.dashStrikeStates.set(key, state);
    }
    return state;
  }

  // ── Fire dispatch ──

  /** Compute effective damage with global multiplier + crit roll.
   *  `forceCrit` skips the RNG roll and treats the hit as a guaranteed
   *  crit — used by Sgian Geal evolution (the white-knife twin's edge
   *  is sharp enough that nothing it touches can be glanced). The
   *  forced-crit branch still consumes no RNG, preserving replay
   *  determinism across runs that mix sgian_geal with other weapons. */
  private effectiveDamage(w: ActiveWeapon, forceCrit: boolean = false): { damage: number; isCrit: boolean } {
    const baseDmg = Math.ceil(w.damage * this.damageMultiplier);
    // Crit via seeded RNG — replaying a run with the same seed produces the
    // same crits on the same enemies, which is what makes shared seeds fair.
    const isCrit = forceCrit ? true : this.scene.getRunRng().bool(this.critChance);
    return { damage: isCrit ? Math.ceil(baseDmg * this.critDamageMultiplier) : baseDmg, isCrit };
  }

  /** Compute effective AoE radius with global multiplier.
   *  U1 M4 — Piper Rune (`bagpipes_radius_mult`) folds onto bagpipes
   *  + bagpipe_blast aura/AoE only; other weapons unaffected. */
  private effectiveAoe(w: ActiveWeapon): number {
    const k = w.config.key;
    const piperMul = (k === 'bagpipes' || k === 'bagpipe_blast')
      ? this.bagpipesRadiusMul
      : 1;
    return w.aoeRadius * this.aoeMultiplier * piperMul;
  }

  /** U1 M4 — Piper Rune (bagpipes_radius_mult) write-through.
   *  Cached field; GameScene refreshes via setBagpipesRadiusMul each
   *  frame so a transition picks up immediately (bag-vs-cache rule). */
  private bagpipesRadiusMul: number = 1;
  setBagpipesRadiusMul(mul: number): void {
    this.bagpipesRadiusMul = Math.max(0.1, Number.isFinite(mul) ? mul : 1);
  }

  private fireWeapon(w: ActiveWeapon, px: number, py: number): void {
    // Animation trigger: the haggis pulses forward on any weapon fire.
    // One-shot gating in AnimationController absorbs duplicate emits from
    // multi-weapon frames — the next fire after the beat retriggers.
    this.events.emit('weaponFired');

    // Evolved weapons use dramatically different behavior
    if (w.evolved) {
      this.fireEvolved(w, px, py);
      return;
    }

    switch (w.config.behavior) {
      case 'projectile':
        this.fireProjectile(w, px, py, 'thistle');
        break;
      case 'piercing':
        this.fireProjectile(w, px, py, 'caber');
        break;
      case 'bouncing':
        this.fireBouncing(w, px, py);
        break;
      case 'aoe_pulse':
        this.fireAoePulse(w, px, py);
        break; // AoE has its own visual ring — no muzzle flash needed
      case 'trail':
        this.fireTrail(w, px, py);
        break; // trail weapon doesn't "fire" from origin
      case 'arc_sweep':
        this.fireArcSweep(w, px, py);
        break;
      case 'aura_pulse':
        this.fireAuraPulse(w, px, py);
        break; // aura has its own visual
    }
    const flashColor = resolveMuzzleFlashColor(w.config.behavior);
    if (flashColor !== null) this.spawnMuzzleFlash(px, py, flashColor);
  }

  /** Small muzzle flash at projectile fire point — weapon-coloured spark burst.
   *  Routed through `StatusFxPool` (acquireArc) instead of `scene.add.circle` so
   *  a fast-firing player doesn't churn 30-50 GameObjects/sec through GC. */
  private spawnMuzzleFlash(x: number, y: number, color: number): void {
    const scene = this.scene;
    const pool = scene.getStatusFxPool();
    // Central flash circle — bright, fades fast
    const flash = pool.acquireArc(x, y, 8, color, 0.8);
    flash.setDepth(4);
    scene.tweens.add({
      targets: flash, scale: 2, alpha: 0,
      duration: 180, ease: 'Quad.easeOut',
      onComplete: () => flash.setVisible(false),
    });
    // 4 tiny sparks radiating out
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
      const spark = pool.acquireArc(x, y, 2, color, 0.9);
      spark.setDepth(4);
      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 12,
        y: y + Math.sin(angle) * 12,
        alpha: 0, scale: 0.3,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => spark.setVisible(false),
      });
    }
  }

  private spawnWeaponFlourish(
    x: number,
    y: number,
    key: string,
    opts: {
      scale?: number;
      endScale?: number;
      alpha?: number;
      duration?: number;
      depth?: number;
      rotation?: number;
    } = {},
  ): void {
    if (this.destroyed || !this.scene?.sys?.isActive()) return;
    if (!this.scene.textures.exists(key)) return;

    const scale = opts.scale ?? 0.85;
    const flourish = this.scene.add.image(x, y, key)
      .setDepth(opts.depth ?? 9)
      .setScale(scale)
      .setAlpha(opts.alpha ?? 0.9);
    if (opts.rotation !== undefined) flourish.setRotation(opts.rotation);

    this.scene.tweens.add({
      targets: flourish,
      scale: opts.endScale ?? scale * 1.35,
      alpha: 0,
      duration: opts.duration ?? 320,
      ease: 'Quad.easeOut',
      onComplete: () => flourish.destroy(),
    });
  }

  private spawnProjectileCastFlourish(px: number, py: number, texture: string): void {
    if (texture === 'thistle') {
      this.spawnWeaponFlourish(px, py, 'fx_weapon_thistle_bloom', { scale: 0.72, endScale: 1.1, duration: 260 });
    } else if (texture === 'caber') {
      this.spawnWeaponFlourish(px, py, 'fx_weapon_caber_splinter', { scale: 0.75, endScale: 1.15, duration: 280 });
    } else if (texture === 'haggis_ball') {
      this.spawnWeaponFlourish(px, py, 'fx_weapon_haggis_oat_puff', { scale: 0.7, endScale: 1.05, duration: 300 });
    }
  }

  // ── Projectile-based weapons (Thistle Shot, Caber Toss) ──

  private fireProjectile(w: ActiveWeapon, px: number, py: number, texture: string): void {
    const target = this.findClosestEnemy(px, py, w.config.range);
    if (!target) return;

    const count = w.projectileCount;
    const maxShot = this.maxExtraProjectilesThisFrame(w.config.key, count);
    const spread = maxShot > 1 ? 15 : 0;
    if (maxShot > 0) this.spawnProjectileCastFlourish(px, py, texture);

    for (let i = 0; i < maxShot; i++) {
      const proj = this.getProjectile(texture);
      if (!proj) continue;

      let tx = target.x, ty = target.y;
      if (maxShot > 1) {
        const base = Phaser.Math.Angle.Between(px, py, target.x, target.y);
        const offset = Phaser.Math.DegToRad((i - (maxShot - 1) / 2) * spread);
        tx = px + Math.cos(base + offset) * 500;
        ty = py + Math.sin(base + offset) * 500;
      }

      const { damage, isCrit } = this.effectiveDamage(w);
      proj.fire(px, py, tx, ty, w.config.projectileSpeed, damage, w.pierce, w.config.range, isCrit);
      proj.setWeaponKey(w.config.key);
      proj.setPibrochAligned(this.currentPibrochAligned());
      this.applyProjectileVisual(proj, texture);
      this.spawnProjectileTrail(px, py, texture);
    }
  }

  private spawnProjectileTrail(px: number, py: number, texture: string): void {
    let trailKey: string | null = null;
    if (texture === 'thistle') trailKey = 'fx_trail_thistle';
    else if (texture === 'caber') trailKey = 'fx_trail_caber';
    else if (texture === 'haggis_ball') trailKey = 'fx_trail_haggis';
    if (!trailKey) return;

    // Defensive: skip if the texture wasn't baked (validator should
    // catch any drop, but unit-test stubs that don't seed BootScene
    // textures would otherwise render the magenta missing placeholder).
    if (!this.scene.textures.exists(trailKey)) return;

    const trail = this.scene.add.image(px, py, trailKey);
    trail.setDepth(-1);
    trail.setAlpha(0.85);
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 250,
      onComplete: () => trail.destroy(),
    });
  }

  // ── Bouncing weapon (Jobby Hurler / Shinty Stick) ──

  /**
   * Bouncing-projectile dispatch. Two weapons share this path —
   * Jobby Hurler (the lumpy haggis ball) and Shinty Stick (the wee
   * cork-leather camanachd ball). The texture key is the only fork:
   * everything else (random direction + bouncing physics + run-RNG-
   * less FloatBetween) is identical.
   */
  private fireBouncing(w: ActiveWeapon, px: number, py: number): void {
    const count = this.maxExtraProjectilesThisFrame(w.config.key, w.projectileCount);
    const tex = w.config.key === 'shinty_stick' ? 'shinty_ball' : 'haggis_ball';
    if (count > 0) this.spawnProjectileCastFlourish(px, py, tex);

    for (let i = 0; i < count; i++) {
      const proj = this.getProjectile(tex);
      if (!proj) continue;

      // Fire in a random direction
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const tx = px + Math.cos(angle) * 500;
      const ty = py + Math.sin(angle) * 500;

      const { damage, isCrit } = this.effectiveDamage(w);
      proj.fire(px, py, tx, ty, w.config.projectileSpeed, damage, 0, w.config.range, isCrit);
      proj.setBouncing();
      proj.setWeaponKey(w.config.key);
      proj.setPibrochAligned(this.currentPibrochAligned());
      this.applyProjectileVisual(proj, tex);
      this.spawnProjectileTrail(px, py, tex);
    }
  }

  // ── AoE Pulse (Bagpipe Blast) — damages all enemies in radius ──

  private fireAoePulse(w: ActiveWeapon, px: number, py: number): void {
    const radius = this.effectiveAoe(w);
    const { damage: dmg, isCrit } = this.effectiveDamage(w);

    // Visual pulse ring — pooled
    const ring = this.acquireVfxCircle(px, py, 10, resolveWeaponVfxColor(w.config.behavior), 0.4);
    this.spawnWeaponFlourish(px, py, 'fx_weapon_bagpipe_blast_ring', { scale: 0.85, endScale: 1.8, duration: 340, alpha: 0.78 });
    this.scene.tweens.add({
      targets: ring,
      radius: radius,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.setVisible(false),
    });

    // Damage + knockback all enemies in radius. Squared-distance gate
    // skips sqrt for the (majority of) enemies outside the pulse — only
    // the ones that get hit pay for it, and even then we reuse the same
    // dx/dy as the knockback direction (no atan2 → cos/sin round-trip).
    const radiusSq = radius * radius;
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radiusSq) {
        this.dealDamageToEnemy(enemy, dmg, isCrit, w.config.key);

        // Bagpipe Blast applies brief freeze (slow 50% for 1s)
        enemy.applyFreeze(0.5, 1000);

        // Knockback — uses the impulse system so behaviorChase doesn't wipe it.
        // Divided by mass so tanks resist being pushed.
        if (enemy.active && w.config.knockback > 0) {
          const dist = Math.sqrt(distSq);
          if (dist > 1e-6) {
            const body = enemy.body as Phaser.Physics.Arcade.Body;
            const mass = Math.max(0.05, body.mass);
            const kb = w.config.knockback / mass / dist;
            enemy.applyKnockback(dx * kb, dy * kb, 150);
          }
        }
      }
    }
  }

  // ── Trail (Scotch Mist) — drops a damage zone at the player's position ──

  private fireTrail(w: ActiveWeapon, px: number, py: number): void {
    const radius = this.effectiveAoe(w);
    const weaponKey = w.config.key;

    // Create a fading mist zone — pooled
    const zone = this.acquireVfxCircle(px, py, radius, resolveWeaponVfxColor(w.config.behavior), 0.3);
    const duration = 2000;
    this.spawnWeaponFlourish(px, py, 'fx_weapon_scotch_mist_wisp', { scale: 1, endScale: 1.55, duration: 700, alpha: 0.65, depth: 3 });

    // Damage enemies within the zone over its lifetime.
    // Each tick rolls damage+crit independently — baking a single isCrit at
    // spawn time would lock the entire zone into 2× damage when it rolled
    // crit, producing 4× DPS spikes when two overlapping zones both critted.
    // Cap repeats one short of `duration / interval` so the final tick lands
    // safely before the tween's onComplete cancel races it.
    const intervalMs = 400;
    const damageHandle = this.scene.getUpdateTickers().addInterval(
      'scaled',
      intervalMs,
      () => {
        if (this.scene.getTimeManager().isGameplayPaused()) return;
        const { damage: dmg, isCrit } = this.effectiveDamage(w);
        const enemies = this.enemyGroup.getChildren() as Enemy[];
        const radiusSq = radius * radius;
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          const dx = enemy.x - zone.x;
          const dy = enemy.y - zone.y;
          if (dx * dx + dy * dy <= radiusSq) {
            this.dealDamageToEnemy(enemy, dmg, isCrit, weaponKey);
            // Scotch Mist applies poison (stacking DoT)
            enemy.applyPoison(2, 3000);
          }
        }
      },
      { repeats: Math.max(1, Math.floor(duration / intervalMs) - 1) }
    );

    // Fade out and destroy
    this.scene.tweens.add({
      targets: zone,
      alpha: 0,
      duration: duration,
      onComplete: () => {
        damageHandle.cancel();
        zone.setVisible(false);
      },
    });
  }

  // ── Arc Sweep (Nessie's Tentacle) — damages enemies in a frontal arc ──

  private fireArcSweep(w: ActiveWeapon, px: number, py: number, forceCrit: boolean = false): void {
    const radius = this.effectiveAoe(w);
    const { damage: dmg, isCrit } = this.effectiveDamage(w, forceCrit);
    const halfArc = Phaser.Math.DegToRad(w.config.arcDegrees / 2);

    // If stationary, aim at nearest enemy instead of stale facing angle
    let facing = this.playerFacing;
    const nearest = this.findClosestEnemy(px, py, radius * 1.5);
    if (nearest) {
      facing = Phaser.Math.Angle.Between(px, py, nearest.x, nearest.y);
    }
    // Sgian Dubh + Sgian Geal share the cold-steel flash (claymore_spark
    // texture). The white-knife twin gets a brighter scale + faster
    // duration to read as the ceremonial cut, not the everyday wrist-
    // flick. Stag Antler / Monarch's Charge ride the same flash but at
    // a wider, slower beat (the haggis's HEAD swings, not a wrist) and
    // colour the wedge bone-cream rather than steel. Nessie keeps the
    // murky-green splash; default-default stays claymore for any future
    // arc_sweep weapon.
    const isSgian = w.config.key === 'sgian_dubh';
    const isClaymore = w.config.key === 'claymore';
    const isStag = w.config.key === 'stag_antler';
    const flashKey = isClaymore || isSgian || isStag
      ? 'fx_weapon_claymore_spark'
      : 'fx_weapon_nessie_splash';
    const flashScale = isSgian ? (forceCrit ? 0.65 : 0.5) : isStag ? 0.7 : 0.85;
    const flashEndScale = isSgian ? (forceCrit ? 1.05 : 0.85) : isStag ? 1.15 : 1.35;
    const flashDuration = isSgian ? 200 : isStag ? 240 : 280;
    this.spawnWeaponFlourish(
      px + Math.cos(facing) * 28,
      py + Math.sin(facing) * 28,
      flashKey,
      { scale: flashScale, endScale: flashEndScale, duration: flashDuration, rotation: facing },
    );

    // Visual sweep arc — steel wedge for claymore, bright steel for sgian
    // (white-knife twin glints a touch hotter), bone-cream for stag, murky
    // green for Nessie.
    const gfx = this.acquireVfxGraphics();
    const wedgeColor = isClaymore
      ? 0xc8d8e8
      : isSgian
        ? (forceCrit ? 0xf6f8fa : 0xd8dde4)
        : isStag
          ? 0xd8c8a0
          : 0x226644;
    const wedgeAlpha = isClaymore ? 0.35 : isSgian ? 0.42 : isStag ? 0.4 : 0.4;
    gfx.fillStyle(wedgeColor, wedgeAlpha);
    gfx.slice(
      px, py, radius,
      facing - halfArc,
      facing + halfArc,
      false
    );
    gfx.fillPath();
    if (isClaymore) {
      gfx.lineStyle(2, 0x8899aa, 0.55);
      gfx.beginPath();
      gfx.arc(px, py, radius * 0.92, facing - halfArc, facing + halfArc, false);
      gfx.strokePath();
    }

    this.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 250,
      onComplete: () => { gfx.setVisible(false); gfx.clear(); },
    });

    // Damage enemies within the arc.
    //
    // Replace two atan2s + angle-wrap loops with a dot product. The arc
    // test "is the enemy direction within ±halfArc of facing?" is exactly
    // `dot(enemyDir, facingDir) >= cos(halfArc)` for unit vectors —
    // monotonic in the angle, no branch normalization needed. We pre-bake
    // facing's cos/sin and the arc threshold once per call; per enemy
    // does one sqrt and one dot product.
    const radiusSq = radius * radius;
    const fcos = Math.cos(facing);
    const fsin = Math.sin(facing);
    const arcThresh = Math.cos(halfArc);
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) continue;

      const dist = Math.sqrt(distSq);
      if (dist < 1e-6) continue;
      const nx = dx / dist;
      const ny = dy / dist;
      const dot = nx * fcos + ny * fsin;
      if (dot < arcThresh) continue;

      this.dealDamageToEnemy(enemy, dmg, isCrit, w.config.key);

      // Knockback via impulse system (persistent for 150ms, then behavior resumes).
      // Reuses the same dx/dy: knockback direction == enemy direction.
      if (enemy.active && w.config.knockback > 0) {
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        const mass = Math.max(0.05, body.mass);
        const kb = w.config.knockback / mass;
        enemy.applyKnockback(nx * kb, ny * kb, 150);
      }
    }
  }

  /**
   * DESIGN_IDEAS §5 — Stag Antler / Monarch's Charge bonus arc.
   *
   * Shares the arc_sweep math with `fireArcSweep` but routes
   * through this dedicated path for three reasons: (1) the bonus
   * applies a fat damage multiplier on top of `effectiveDamage`,
   * (2) the facing is FIXED to the player's last dash direction
   * (not the live aim-at-nearest-enemy fallback fireArcSweep uses
   * for the auto-arc — the dash-strike must point where the
   * haggis actually went), and (3) the evolved Monarch's Charge
   * sweeps a full 360° + applies a brief freeze stun, neither of
   * which fits the standard `fireEvolved` signature cleanly.
   *
   * No RNG consumed beyond the standard `effectiveDamage` crit
   * roll, preserving replay determinism.
   */
  private fireDashStrike(
    w: ActiveWeapon,
    px: number,
    py: number,
    facing: number,
  ): void {
    const isMonarch = w.evolved && w.evolutionKey === 'monarch_charge';
    const damageMul = isMonarch
      ? MONARCH_CHARGE_DASH_STRIKE_DAMAGE_MUL
      : STAG_ANTLER_DASH_STRIKE_DAMAGE_MUL;
    const radius = this.effectiveAoe(w);
    const { damage: baseDmg, isCrit } = this.effectiveDamage(w);
    const dmg = Math.ceil(baseDmg * damageMul);
    // Monarch's Charge sweeps the full crown 360° (the king-stag
    // turns through the herd); base form gores the dash arc only.
    const arcDeg = isMonarch ? 360 : Math.max(120, w.config.arcDegrees + 40);
    const halfArc = Phaser.Math.DegToRad(arcDeg / 2);

    // Cast flourish — antler-spread visual at the player's snout,
    // pointed in the dash direction. Reuses the claymore spark texture
    // (cold-steel wedge); the Monarch form gets a hotter scale.
    if (this.scene.textures.exists('fx_weapon_claymore_spark')) {
      this.spawnWeaponFlourish(
        px + Math.cos(facing) * 28,
        py + Math.sin(facing) * 28,
        'fx_weapon_claymore_spark',
        {
          scale: isMonarch ? 1.0 : 0.78,
          endScale: isMonarch ? 1.6 : 1.2,
          duration: isMonarch ? 320 : 240,
          rotation: facing,
        },
      );
    }

    // Visual sweep — bone-cream wedge for stag-antler (the colour of
    // a polished antler tine), bright gold-cream for Monarch (the
    // crown caught in autumn light).
    const gfx = this.acquireVfxGraphics();
    const wedgeColor = isMonarch ? 0xf6e0a0 : 0xd8c8a0;
    const wedgeAlpha = isMonarch ? 0.5 : 0.42;
    gfx.fillStyle(wedgeColor, wedgeAlpha);
    if (isMonarch) {
      gfx.fillCircle(px, py, radius);
    } else {
      gfx.slice(px, py, radius, facing - halfArc, facing + halfArc, false);
      gfx.fillPath();
    }
    this.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 280,
      onComplete: () => { gfx.setVisible(false); gfx.clear(); },
    });

    // Damage enemies within the arc — same dot-product gate as
    // fireArcSweep. Skipped entirely for Monarch (full 360° hits
    // every enemy in radius without the facing test).
    const radiusSq = radius * radius;
    const fcos = Math.cos(facing);
    const fsin = Math.sin(facing);
    const arcThresh = Math.cos(halfArc);
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) continue;

      const dist = Math.sqrt(distSq);
      if (dist < 1e-6) continue;

      if (!isMonarch) {
        const nx = dx / dist;
        const ny = dy / dist;
        const dot = nx * fcos + ny * fsin;
        if (dot < arcThresh) continue;
      }

      this.dealDamageToEnemy(enemy, dmg, isCrit, w.config.key);

      // Knockback uses the dash direction unit vector, not enemy
      // direction — the gore drives enemies AWAY from the haggis
      // along the line of charge, which reads as "lowered head ploughs
      // through" rather than "gentle radial push". Monarch's Charge
      // fans knockback radially since the sweep is full 360°.
      if (enemy.active && w.config.knockback > 0) {
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        const mass = Math.max(0.05, body.mass);
        const kb = (w.config.knockback * (isMonarch ? 1.4 : 1.2)) / mass;
        if (isMonarch) {
          enemy.applyKnockback((dx / dist) * kb, (dy / dist) * kb, 180);
        } else {
          enemy.applyKnockback(fcos * kb, fsin * kb, 180);
        }
      }

      // Monarch's Charge briefly stuns hits — a heavy antler-sweep
      // staggers the wounded enough to read as "the king is here".
      if (enemy.active && isMonarch) {
        enemy.applyFreeze(
          MONARCH_CHARGE_DASH_STRIKE_FREEZE_FRACTION,
          MONARCH_CHARGE_DASH_STRIKE_FREEZE_MS,
        );
      }
    }
  }

  /** Central damage handler — applies damage, emits events */
  // ── Evolved weapon behaviors ──

  private fireEvolved(w: ActiveWeapon, px: number, py: number): void {
    const { damage: dmg, isCrit } = this.effectiveDamage(w);
    const radius = this.effectiveAoe(w);

    switch (w.evolutionKey) {
      case 'thistle_storm':
        this.fireHomingBurst(w, px, py, dmg, 6, isCrit);
        break;
      case 'highland_fling':
        this.fireExpandingRing(px, py, dmg, radius * 2.2, w.config.key, isCrit);
        break;
      case 'highland_games':
        this.fireExplodingProjectile(w, px, py, dmg, isCrit);
        break;
      case 'the_haar':
        this.fireMassiveFog(px, py, dmg, radius * 2, w.config.key, isCrit);
        break;
      case 'haggis_cannon':
        this.fireRapidBounce(w, px, py, dmg, 4, isCrit, 'haggis_ball');
        break;
      case 'shinty_caman':
        // Caman Storm — same rapid bounce dispatch as Jobby Cannon
        // but with the cleaner cork-leather shinty ball texture.
        this.fireRapidBounce(w, px, py, dmg, 4, isCrit, 'shinty_ball');
        break;
      case 'sgian_geal':
        // Sgian Geal — the white-knife twin. Same arc-sweep dispatch
        // as Sgian Dubh but every hit forces a crit. Discards the
        // base-form damage we just rolled and re-rolls inside
        // fireArcSweep with forceCrit=true so the crit-damage math
        // (Math.ceil(baseDmg * critDamageMultiplier)) is computed
        // fresh from the current weapon stats — not the {dmg, isCrit}
        // tuple we destructured above.
        this.fireArcSweep(w, px, py, true);
        break;
      case 'monarch_charge':
        // Monarch's Charge — the king-stag retains the auto baseline
        // (a steady frontal goring on cooldown) and trades the bonus
        // arc for a 360° antler-sweep that stuns. The auto-arc here
        // re-uses the standard arc_sweep dispatch (no special case);
        // the dash-strike branch in `update()` does the heavy lift via
        // `fireDashStrike`, which inspects `w.evolved` to upgrade the
        // bonus to the full crown sweep.
        this.fireArcSweep(w, px, py);
        break;
      case 'nessie_unleashed':
        this.fireFullSweep(px, py, dmg, radius * 1.6, w.config.key, isCrit);
        break;
      case 'william_blade':
        this.fireWilliamBladeWaves(w, px, py, dmg, isCrit);
        break;
      case 'dirk_flurry':
        // Highland Horrors — three simultaneous dirk arcs (center +
        // ±30°). Each arc rolls its own crit so the flurry varies; an
        // enemy caught in overlap takes only the first hit (the inner
        // Set guards re-strike). Inherits Dirk Dance's arc width.
        this.fireDirkFlurry(w, px, py);
        break;
      case 'banshee_wail':
        // Highland Horrors — five hex-bolts seek the FURTHEST living
        // things on the field (Granny's grief carries past the brawl).
        // Distinct from Thistle Storm's closest-first homing.
        this.fireBansheeWail(w, px, py, dmg, isCrit);
        break;
      case 'freedom_blade':
        // Highland Horrors — Wallace's full 360° battle-cry sweep
        // followed by two expanding shockwaves rolling out across
        // the moor (Stirling Bridge in two heartbeats).
        this.fireFreedomBlade(w, px, py, dmg, radius, isCrit);
        break;
      default:
        this.fireProjectile(w, px, py, 'thistle');
        break;
    }
  }

  /** Thistle Storm — 8 projectiles that each seek a different enemy */
  private fireHomingBurst(w: ActiveWeapon, px: number, py: number, dmg: number, count: number, isCrit: boolean = false): void {
    this.ensureEnemyCache();
    const targets = this.cachedSortedEnemies;
    const maxShot = this.maxExtraProjectilesThisFrame(w.config.key, count);
    const targetCount = Math.min(targets.length, maxShot);
    if (maxShot > 0) {
      this.spawnWeaponFlourish(px, py, 'fx_weapon_thistle_storm_bloom', { scale: 0.9, endScale: 1.45, duration: 360 });
    }

    for (let i = 0; i < maxShot; i++) {
      const proj = this.getProjectile('thistle');
      if (!proj) continue;

      // Aim at a specific enemy, or random direction if not enough targets
      let tx: number, ty: number;
      if (i < targetCount) {
        tx = targets[i].x;
        ty = targets[i].y;
      } else {
        const angle = (i / Math.max(1, maxShot)) * Math.PI * 2;
        tx = px + Math.cos(angle) * 400;
        ty = py + Math.sin(angle) * 400;
      }

      proj.fire(px, py, tx, ty, w.config.projectileSpeed * 1.3, dmg, 2, 800, isCrit);
      proj.setWeaponKey(w.config.key);
      proj.setPibrochAligned(this.currentPibrochAligned());
      this.applyProjectileVisual(proj, 'thistle');
      this.spawnProjectileTrail(px, py, 'thistle');
    }
  }

  /** Ceòl Mòr bagpipes — pulse damage + slow in a standing ring. */
  private fireAuraPulse(w: ActiveWeapon, px: number, py: number): void {
    const radius = this.effectiveAoe(w);
    const { damage: dmg, isCrit } = this.effectiveDamage(w);
    const ring = this.acquireVfxCircle(px, py, radius, resolveWeaponVfxColor(w.config.behavior), 0.38);
    this.spawnWeaponFlourish(px, py, 'fx_weapon_bagpipes_drone_knot', { scale: 0.95, endScale: 1.4, duration: 360, alpha: 0.72 });
    this.scene.tweens.add({
      targets: ring,
      alpha: 0.1,
      duration: 280,
      yoyo: true,
      onComplete: () => ring.setVisible(false),
    });

    const radiusSq = radius * radius;
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      if (dx * dx + dy * dy <= radiusSq) {
        this.dealDamageToEnemy(enemy, dmg, isCrit, w.config.key);
        enemy.applyFreeze(0.42, 1400);
      }
    }
  }

  /** William Blade — chained sonic shockwaves from the claymore stance. */
  private fireWilliamBladeWaves(w: ActiveWeapon, px: number, py: number, baseDmg: number, isCrit: boolean = false): void {
    const maxR = this.effectiveAoe(w) * 2.9;
    const waveDmg = Math.ceil(baseDmg * 0.45);
    const weaponKey = w.config.key;
    this.spawnWeaponFlourish(px, py, 'fx_weapon_william_blade_wave', { scale: 0.9, endScale: 1.6, duration: 430, alpha: 0.82 });
    for (let wave = 0; wave < 3; wave++) {
      // Wave 0 at delay 0 fires inside the same `tickScaled` pass that
      // created it, racing with pooled-VFX cleanup timers for adjacent
      // rings. Shift by one interval so the 3 waves fire at 170/340/510 ms
      // on clean frame boundaries.
      this.scene.getUpdateTickers().addOnce('scaled', (wave + 1) * 170, () => {
        if (this.destroyed || !this.scene?.sys?.isActive()) return;
        this.fireExpandingRing(px, py, waveDmg, maxR, weaponKey, isCrit);
      });
    }
  }

  /**
   * Dirk Flurry (Dirk Dance evolution) — three simultaneous tartan-red
   * arcs centred on the aim direction at -30° / 0° / +30°. Each arc
   * rolls its own damage so the flurry varies; enemies caught by
   * multiple arcs only take the first hit (Set-guarded). Pure arc
   * dispatch — no projectiles, no homing — keeps the sister cost
   * profile of arc_sweep.
   */
  private fireDirkFlurry(w: ActiveWeapon, px: number, py: number): void {
    const radius = this.effectiveAoe(w);
    // Aim — nearest-enemy if available, else current facing (matches
    // fireArcSweep's resolution so the centre arc behaves identically
    // to a normal Dirk Dance swing).
    let centerFacing = this.playerFacing;
    const nearest = this.findClosestEnemy(px, py, radius * 1.5);
    if (nearest) {
      centerFacing = Phaser.Math.Angle.Between(px, py, nearest.x, nearest.y);
    }
    const halfArc = Phaser.Math.DegToRad(w.config.arcDegrees / 2);
    const spreadRad = Math.PI / 6; // ±30°
    const weaponKey = w.config.key;

    // Single weapon-fired-event flash (sister to arc_sweep's spark) at
    // the centre arc — the three blades read as one motion, not three.
    this.spawnWeaponFlourish(
      px + Math.cos(centerFacing) * 28,
      py + Math.sin(centerFacing) * 28,
      'fx_weapon_claymore_spark',
      { scale: 0.6, endScale: 1.1, duration: 220, rotation: centerFacing },
    );

    // Pre-roll three independent damage stamps (first-hit-wins, but the
    // crit roll varies per arm — the flurry feels stochastic in play).
    const armRolls: ReadonlyArray<{ damage: number; isCrit: boolean }> = [
      this.effectiveDamage(w),
      this.effectiveDamage(w),
      this.effectiveDamage(w),
    ];
    const offs: ReadonlyArray<number> = [-spreadRad, 0, spreadRad];
    const facings: ReadonlyArray<number> = [
      centerFacing + offs[0],
      centerFacing + offs[1],
      centerFacing + offs[2],
    ];

    // Visual arc wedges — tartan-red dirk colour (matches tartan.ts
    // WEAPON_ACCENTS for dirk_dance). Lower alpha than the base arc
    // sweep since three arcs overlap. Drawn before the damage loop so
    // a stutter on a busy frame still paints the swing.
    for (let i = 0; i < 3; i++) {
      const facing = facings[i];
      const gfx = this.acquireVfxGraphics();
      gfx.fillStyle(0x9a2a2a, 0.32);
      gfx.slice(px, py, radius, facing - halfArc, facing + halfArc, false);
      gfx.fillPath();
      this.scene.tweens.add({
        targets: gfx, alpha: 0, duration: 230,
        onComplete: () => { gfx.setVisible(false); gfx.clear(); },
      });
    }

    // Single pool walk — for each enemy, test all three arcs and apply
    // the first match. Previously this looped the enemies three times
    // (one per arc) for a 3× cost; the single-pass variant matches the
    // "first-hit-wins" semantics of the original Set guard without the
    // Set allocation and without the redundant distance math.
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    const radiusSq = radius * radius;
    const arcThresh = Math.cos(halfArc);
    const fcos0 = Math.cos(facings[0]);
    const fsin0 = Math.sin(facings[0]);
    const fcos1 = Math.cos(facings[1]);
    const fsin1 = Math.sin(facings[1]);
    const fcos2 = Math.cos(facings[2]);
    const fsin2 = Math.sin(facings[2]);

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) continue;
      const dist = Math.sqrt(distSq);
      if (dist < 1e-6) continue;
      const nx = dx / dist;
      const ny = dy / dist;

      // Test arcs in order — first hit wins. Centre arc (i=1) is most
      // likely to land for aimed swings, but we test left/centre/right
      // in catalogue order so the leftmost roll claims the kill when an
      // enemy is on a seam (small but consistent — replay determinism).
      let armIdx = -1;
      if (nx * fcos0 + ny * fsin0 >= arcThresh) armIdx = 0;
      else if (nx * fcos1 + ny * fsin1 >= arcThresh) armIdx = 1;
      else if (nx * fcos2 + ny * fsin2 >= arcThresh) armIdx = 2;
      if (armIdx < 0) continue;

      const roll = armRolls[armIdx];
      this.dealDamageToEnemy(enemy, roll.damage, roll.isCrit, weaponKey);
      if (w.config.knockback > 0) {
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        const mass = Math.max(0.05, body.mass);
        const kb = w.config.knockback / mass;
        enemy.applyKnockback(nx * kb, ny * kb, 150);
      }
    }
  }

  /**
   * Banshee Wail (Granny's Curse evolution) — five hex-bolts seek
   * the FURTHEST living things. Distinct from Thistle Storm which
   * tracks closest-first. The wail carries past the brawl.
   */
  private fireBansheeWail(w: ActiveWeapon, px: number, py: number, dmg: number, isCrit: boolean): void {
    this.ensureEnemyCache();
    const sorted = this.cachedSortedEnemies;
    const count = 5;
    const maxShot = this.maxExtraProjectilesThisFrame(w.config.key, count);
    if (maxShot <= 0) return;

    // Single bloom at the centre so the wail reads as one ritual gesture
    // even when the five bolts spray off in five directions.
    this.spawnWeaponFlourish(px, py, 'fx_weapon_thistle_storm_bloom', {
      scale: 0.95, endScale: 1.5, duration: 360,
    });

    // Pick the furthest N enemies (sorted is closest→furthest, so the
    // tail). For a sparse field where N enemies exist below the cache
    // size, we still fire maxShot bolts; gaps fan out radially.
    const targetCount = Math.min(sorted.length, maxShot);
    for (let i = 0; i < maxShot; i++) {
      const proj = this.getProjectile('thistle');
      if (!proj) continue;

      let tx: number, ty: number;
      if (i < targetCount) {
        // Furthest-first: walk from the tail backwards.
        const target = sorted[sorted.length - 1 - i];
        tx = target.x;
        ty = target.y;
      } else {
        const angle = (i / Math.max(1, maxShot)) * Math.PI * 2;
        tx = px + Math.cos(angle) * 500;
        ty = py + Math.sin(angle) * 500;
      }
      proj.fire(px, py, tx, ty, w.config.projectileSpeed * 1.2, dmg, w.config.pierce + 1, 1000, isCrit);
      proj.setWeaponKey(w.config.key);
      proj.setPibrochAligned(this.currentPibrochAligned());
      this.applyProjectileVisual(proj, 'thistle');
      this.spawnProjectileTrail(px, py, 'thistle');
    }
  }

  /**
   * Freedom Blade (Wallace Sword evolution) — full 360° sweep on the
   * fire-tick followed by two expanding shockwaves at 220 ms / 440 ms.
   * The waves carry 60% of the swing damage (still big — Wallace's
   * base is 50).
   */
  private fireFreedomBlade(w: ActiveWeapon, px: number, py: number, dmg: number, radius: number, isCrit: boolean): void {
    const weaponKey = w.config.key;
    // Immediate 360° sweep — every enemy in radius feels the swing.
    this.fireFullSweep(px, py, dmg, radius, weaponKey, isCrit);

    // Two delayed shockwaves rolling out across the moor.
    const waveDmg = Math.ceil(dmg * 0.6);
    const waveMaxR = radius * 2.4;
    for (let wave = 0; wave < 2; wave++) {
      this.scene.getUpdateTickers().addOnce('scaled', (wave + 1) * 220, () => {
        if (this.destroyed || !this.scene?.sys?.isActive()) return;
        this.fireExpandingRing(px, py, waveDmg, waveMaxR, weaponKey, isCrit);
      });
    }
  }

  /** Highland Fling — massive expanding damage ring */
  private fireExpandingRing(px: number, py: number, dmg: number, maxRadius: number, weaponKey: string, isCrit: boolean = false): void {
    const ring = this.acquireVfxCircle(px, py, 20, 0x4488ff, 0.5);
    let currentRadius = 20;
    const hitEnemies = new Set<Enemy>();
    this.spawnWeaponFlourish(
      px,
      py,
      weaponKey === 'claymore' ? 'fx_weapon_william_blade_wave' : 'fx_weapon_highland_fling_ring',
      { scale: 0.85, endScale: 1.55, duration: 420, alpha: 0.74 },
    );

    const expandHandle = this.scene.getUpdateTickers().addInterval('scaled', 50, () => {
      if (this.destroyed || !this.scene?.sys?.isActive()) return;
      currentRadius += (maxRadius - 20) / 16;
      ring.setRadius(currentRadius);
      ring.setAlpha(Math.max(0, ring.alpha - 0.5 / 16));

      // Damage enemies who just entered the ring — each hit at most once
      // per ring lifetime. The squared-distance gate skips sqrt entirely.
      // (Mid-expansion pool-recycle into a fresh enemy reusing the same JS
      // object will get one frame's worth of immunity from the Set; that's
      // a tiny acceptable miss compared to the previously broken
      // delete-then-add re-hit pattern.)
      if (!this.scene.getTimeManager().isGameplayPaused()) {
        const enemies = this.enemyGroup.getChildren() as Enemy[];
        const currentRadiusSq = currentRadius * currentRadius;
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          if (hitEnemies.has(enemy)) continue;
          const dx = enemy.x - px;
          const dy = enemy.y - py;
          if (dx * dx + dy * dy <= currentRadiusSq) {
            hitEnemies.add(enemy);
            this.dealDamageToEnemy(enemy, dmg, isCrit, weaponKey);
          }
        }
      }
    }, { repeats: 16 });

    this.scene.getUpdateTickers().addOnce('scaled', 850, () => {
      expandHandle.cancel();
      ring.setVisible(false);
    });
  }

  /** Highland Games — piercing caber that explodes on final hit */
  private fireExplodingProjectile(w: ActiveWeapon, px: number, py: number, dmg: number, isCrit: boolean = false): void {
    const target = this.findClosestEnemy(px, py, w.config.range);
    if (!target) return;
    if (this.maxExtraProjectilesThisFrame(w.config.key, 1) < 1) return;

    const proj = this.getProjectile('caber');
    if (!proj) return;
    const weaponKey = w.config.key;
    proj.fire(px, py, target.x, target.y, w.config.projectileSpeed, dmg, w.pierce, w.config.range, isCrit);
    proj.setWeaponKey(weaponKey);
    proj.setPibrochAligned(this.currentPibrochAligned());
    this.applyProjectileVisual(proj, 'caber');
    this.spawnProjectileTrail(px, py, 'caber');

    // Use the safe callback field instead of monkey-patching deactivate
    proj.onDeactivateCallback = () => {
      const ex = proj.x, ey = proj.y;

      // Guard against both scene shutdown AND this WeaponSystem being replaced
      // by a fresh instance after Play Again (scene stays active on restart,
      // but `this` is the old instance — destroyed = true means we shouldn't
      // create new visuals/damage on the live scene).
      if (this.destroyed || !this.scene?.sys?.isActive()) return;

      const blast = this.acquireVfxCircle(ex, ey, 10, 0xff6600, 0.6);
      this.spawnWeaponFlourish(ex, ey, 'fx_weapon_highland_games_burst', { scale: 0.95, endScale: 1.7, duration: 360 });
      this.scene.tweens.add({
        targets: blast, radius: 80, alpha: 0, duration: 300,
        onComplete: () => blast.setVisible(false),
      });

      const enemies = this.enemyGroup.getChildren() as Enemy[];
      const blastRadiusSq = 80 * 80;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - ex;
        const dy = enemy.y - ey;
        if (dx * dx + dy * dy <= blastRadiusSq) {
          this.dealDamageToEnemy(enemy, Math.ceil(dmg * 0.6), isCrit, weaponKey);
        }
      }
    };
  }

  /** The Haar — massive fog zone covering huge area */
  private fireMassiveFog(px: number, py: number, dmg: number, radius: number, weaponKey: string, isCrit: boolean = false): void {
    const zone = this.acquireVfxCircle(px, py, radius, 0x88aacc, 0.25);
    const duration = 2600;
    this.spawnWeaponFlourish(px, py, 'fx_weapon_the_haar_bank', { scale: 1.15, endScale: 1.9, duration: 900, alpha: 0.62, depth: 3 });

    const tickHandle = this.scene.getUpdateTickers().addInterval('scaled', 350, () => {
      if (this.destroyed || !this.scene?.sys?.isActive()) return;
      if (this.scene.getTimeManager().isGameplayPaused()) return;
      const enemies = this.enemyGroup.getChildren() as Enemy[];
      const radiusSq = radius * radius;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - zone.x;
        const dy = enemy.y - zone.y;
        if (dx * dx + dy * dy <= radiusSq) {
          this.dealDamageToEnemy(enemy, dmg, isCrit, weaponKey);
          // Slow enemies in the fog to 50% speed. Duration matches the
          // tick interval + a small overlap so the slow is continuous
          // rather than flickering on and off between ticks.
          enemy.applyFreeze(0.5, 500);
        }
      }
    }, { repeats: Math.floor(duration / 350) });

    this.scene.tweens.add({
      targets: zone, alpha: 0, duration,
      onComplete: () => { tickHandle.cancel(); zone.setVisible(false); },
    });
  }

  /**
   * Jobby Cannon / Caman Storm — rapid burst of bouncing projectiles
   * in all directions. Texture key forks at the call-site:
   * `haggis_ball` for Jobby Cannon, `shinty_ball` for Caman Storm.
   * The `'fx_weapon_haggis_cannon_pop'` flourish only fires when the
   * texture matches — the brown haggis-cannon pop would read wrong
   * over a clean cream-leather shinty ball, so the shinty path skips
   * the muzzle pop and lets the projectile fan speak for itself.
   */
  private fireRapidBounce(w: ActiveWeapon, px: number, py: number, dmg: number, count: number, isCrit: boolean = false, texture: string = 'haggis_ball'): void {
    const maxShot = this.maxExtraProjectilesThisFrame(w.config.key, count);
    const sectors = Math.max(1, maxShot);
    const rng = this.scene.getRunRng();
    if (maxShot > 0 && texture === 'haggis_ball') {
      this.spawnWeaponFlourish(px, py, 'fx_weapon_haggis_cannon_pop', { scale: 0.95, endScale: 1.45, duration: 320 });
    }
    for (let i = 0; i < maxShot; i++) {
      const proj = this.getProjectile(texture);
      if (!proj) continue;
      // Space by actual shots fired — `count` can exceed `maxShot` when the pool caps fire rate.
      // Jitter draws from runRng so the seed reproduces Jobby Cannon trajectories byte-for-byte.
      const angle = (i / sectors) * Math.PI * 2 + rng.float(0, 0.3);
      proj.fire(px, py,
        px + Math.cos(angle) * 500, py + Math.sin(angle) * 500,
        w.config.projectileSpeed * 1.5, dmg, 0, 2000, isCrit
      );
      proj.setBouncing();
      proj.setWeaponKey(w.config.key);
      proj.setPibrochAligned(this.currentPibrochAligned());
      this.applyProjectileVisual(proj, texture);
      this.spawnProjectileTrail(px, py, texture);
    }
  }

  /** Nessie Unleashed — full 360-degree sweep */
  private fireFullSweep(px: number, py: number, dmg: number, radius: number, weaponKey: string, isCrit: boolean = false): void {
    const gfx = this.acquireVfxGraphics();
    gfx.fillStyle(0x226644, 0.35);
    gfx.fillCircle(px, py, radius);
    this.spawnWeaponFlourish(px, py, 'fx_weapon_nessie_unleashed_crest', { scale: 1.05, endScale: 1.75, duration: 430, alpha: 0.76 });

    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 400,
      onComplete: () => { gfx.setVisible(false); gfx.clear(); },
    });

    const enemies = this.enemyGroup.getChildren() as Enemy[];
    const radiusSq = radius * radius;
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radiusSq) {
        this.dealDamageToEnemy(enemy, dmg, isCrit, weaponKey);
        // Knockback via impulse system — same dx/dy supplies the direction,
        // no separate atan2 needed.
        const dist = Math.sqrt(distSq);
        if (dist > 1e-6) {
          const body = enemy.body as Phaser.Physics.Arcade.Body;
          const mass = Math.max(0.05, body.mass);
          const kb = 200 / mass / dist;
          enemy.applyKnockback(dx * kb, dy * kb, 200);
        }
      }
    }
  }

  /**
   * Pibroch Crescendo (DESIGN_IDEAS §1) — true when the live music engine
   * is within ±80 ms of a quarter-note downbeat. Used both as the on-hit
   * fallback for melee/aoe/aura sources and as the on-fire stamp captured
   * by `Projectile.setPibrochAligned()` before flight. Engine-stopped →
   * false (zero-period guard inside `isPibrochAligned`).
   */
  private currentPibrochAligned(): boolean {
    return isPibrochAligned(
      musicEngine.getMsSinceLastQuarterNote(),
      musicEngine.getQuarterNotePeriodMs(),
      PIBROCH_WINDOW_MS + this.pibrochWindowExtensionMs,
    );
  }

  private dealDamageToEnemy(
    enemy: Enemy,
    damage: number,
    isCrit: boolean = false,
    weaponKey: string = 'unknown',
    pibrochAlignedOverride?: boolean,
  ): void {
    // R1 M3 T20d + M4 + M4.5 P3 — per-hit damage modifier runs first so
    // damageDealt + enemy.takeDamage + damage logs all see the same
    // final number. Covers bronze_clasp, highland_torque elite mult,
    // fishermens_net (velocity-aware +30% when fleeing).
    //
    // Pibroch Crescendo bonus is captured at fire-time for projectile
    // weapons (the override) so flight-desync stops punishing rhythm
    // play. Non-projectile sources (melee/aoe/aura/splash) fall back to
    // a live query — for those, hit-time ≈ fire-time anyway.
    const pibrochAligned = pibrochAlignedOverride ?? this.currentPibrochAligned();
    let finalDamage = applyPibrochDamage(damage, pibrochAligned);
    // Wild Living World — Waulking Mallet rhythm bonus stacks on top
    // of the global pibroch sting. The mallet's identity is "the song
    // hits with you", so its aligned multiplier is heavier (+30%)
    // than the shared pibroch sting. Non-aligned hits fall through
    // to baseline damage so muted audio never zeroes the weapon.
    if (weaponKey === 'waulking_mallet') {
      finalDamage = applyWaulkingRhythm(finalDamage, pibrochAligned);
    }
    // Wild Living World Phase 2 — Pibroch Hammer (evolved Waulking
    // Mallet). Heavier aligned multiplier than the base, plus an
    // every-fourth-beat crescendo. Beat index reads from the live
    // music engine; -1 (not-playing path) collapses to baseline
    // multiplier behaviour via the helper's defensive guard.
    if (weaponKey === 'pibroch_hammer') {
      const beatIdx = musicEngine.getQuarterNoteIndex();
      finalDamage = applyPibrochHammerRhythm(finalDamage, pibrochAligned, beatIdx);
    }
    if (pibrochAligned) {
      // Soft grace-note chime; SFXManager 'pibroch_sting' caps at one
      // per ~quarter-note so AOE bursts on a downbeat collapse cleanly.
      audio.playPibrochSting();
    }
    if (this.hitDamageModifier) {
      const body = enemy.body as Phaser.Physics.Arcade.Body | null;
      const vx = body?.velocity?.x ?? 0;
      const vy = body?.velocity?.y ?? 0;
      // dot = enemyVelocity · (playerPos − enemyPos). > 0 toward, < 0 away.
      const velocityDotTowardPlayer =
        vx * (this.cachePlayerX - enemy.x) + vy * (this.cachePlayerY - enemy.y);
      finalDamage = Math.max(
        0,
        Math.ceil(
          this.hitDamageModifier(
            finalDamage,
            this.scene.time.now,
            enemy.isElite(),
            velocityDotTowardPlayer,
          ),
        ),
      );
    } else {
      finalDamage = Math.max(0, Math.ceil(finalDamage));
    }
    this.events.emit('damageDealt', enemy.x, enemy.y, finalDamage, isCrit, weaponKey);
    // V2 — Stormcrown freeze proc fires after damage logs so the
    // visual chain reads consistently (hit → freeze tint), and
    // before takeDamage so a fatal crit still gets to register the
    // proc (the relic's identity is "winter remembers" — applying
    // ice even on a kill is the point).
    if (this.stormcrownOnHitHook) {
      this.stormcrownOnHitHook(enemy, isCrit);
    }
    const wasBoss = enemy.isBoss();
    const wasElite = enemy.isElite();
    const killed = enemy.takeDamage(finalDamage);
    if (killed) {
      this.events.emit(
        'enemyKilled',
        enemy.x,
        enemy.y,
        enemy.getXpValue(),
        enemy.getEnemyKey(),
        wasBoss,
        wasElite,
        wasElite ? enemy.getEliteAffixId() : undefined,
      );
      globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
        enemyKey: enemy.getEnemyKey(),
        xpValue: enemy.getXpValue(),
        wasBoss,
        wasElite,
        eliteAffixId: wasElite ? enemy.getEliteAffixId() : undefined,
      });
      // Taxman Grudge Ledger: fire on elite/boss kills from the
      // weapon-damage path. External death paths (hazard / DoT / drown
      // / `DEBUG.killCurrentBoss`) route through `Enemy.emitKillEvents`
      // which fires its own `eliteOrBossFinished` for the same shape
      // — paths are disjoint (this branch is reached only when
      // `enemy.takeDamage` returns killed=true), so no double-count.
      // Distance is precomputed here because the listener doesn't have
      // cached player coords.
      if (wasBoss || wasElite) {
        const distancePx = Math.hypot(
          enemy.x - this.cachePlayerX,
          enemy.y - this.cachePlayerY,
        );
        this.events.emit('eliteOrBossFinished', {
          enemyKey: enemy.getEnemyKey(),
          wasBoss,
          distancePx,
        });
      }
    }
  }

  // ── Helpers ──

  /** Throttle pool warnings to once per 5 seconds */
  private lastPoolWarnTime: number = 0;

  private countActiveProjectilesForWeapon(weaponKey: string): number {
    const entries = this.projectilePool.getChildren() as Projectile[];
    let n = 0;
    for (let i = 0; i < entries.length; i++) {
      const p = entries[i];
      if (p.active && p.getWeaponKey() === weaponKey) n++;
    }
    return n;
  }

  /** How many more projectiles this weapon may spawn this frame (readability cap). */
  private maxExtraProjectilesThisFrame(weaponKey: string, desired: number): number {
    const cap = BALANCE.weapons.maxSimultaneousProjectilesPerWeapon;
    const cur = this.countActiveProjectilesForWeapon(weaponKey);
    return Math.max(0, Math.min(desired, cap - cur));
  }

  /** Apply spinning/pulsing visual to a freshly fired projectile based on its texture. */
  private applyProjectileVisual(proj: Projectile, texture: string): void {
    const body = proj.body as Phaser.Physics.Arcade.Body;
    if (texture === 'caber') {
      body.setAllowRotation(true);
      body.setAngularVelocity(720);
    } else if (texture === 'thistle') {
      this.scene.tweens.add({
        targets: proj, scaleX: 1.15, scaleY: 1.15,
        duration: 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else if (texture === 'haggis_ball') {
      body.setAllowRotation(true);
      body.setAngularVelocity(540);
    } else if (texture === 'shinty_ball') {
      // Shinty ball spins faster + tighter than the lumpy haggis
      // ball — sells the cork-cored, leather-skinned regulation
      // sphere flying truer through the air.
      body.setAllowRotation(true);
      body.setAngularVelocity(900);
    }
  }

  private getProjectile(texture: string): Projectile | null {
    let proj = this.projectilePool.getFirstDead(false) as Projectile | null;
    if (!proj) {
      if (this.projectilePool.getLength() >= BALANCE.weapons.projectilePoolMax) {
        // Pool exhausted — weapon fires but produces no projectile.
        // Emit event so HUD/JuiceSystem can show feedback.
        this.events.emit('projectileDropped');
        if (import.meta.env.DEV) {
          const now = performance.now();
          if (now - this.lastPoolWarnTime > 5000) {
            this.lastPoolWarnTime = now;
            console.warn(`[WeaponSystem] projectile pool exhausted (${BALANCE.weapons.projectilePoolMax}/${BALANCE.weapons.projectilePoolMax})`);
          }
        }
        return null;
      }
      proj = new Projectile(this.scene);
      this.projectilePool.add(proj);
    }
    // Dev warning when pool is >80% utilized
    if (import.meta.env.DEV) {
      const usage = this.projectilePool.countActive(true);
      if (usage > BALANCE.weapons.projectilePoolMax * 0.8) {
        const now = performance.now();
        if (now - this.lastPoolWarnTime > 5000) {
          this.lastPoolWarnTime = now;
          console.warn(`[WeaponSystem] projectile pool >80%: ${usage}/${BALANCE.weapons.projectilePoolMax}`);
        }
      }
    }
    proj.setTexture(texture);
    return proj;
  }

  /** Build sorted-by-distance cache of active enemies. Called once per update(). */
  private buildEnemyCache(px: number, py: number): void {
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    const sorted = this.cachedSortedEnemies;
    const distSq = this.cachedSortedDistSq;
    let count = 0;

    for (let i = 0, len = enemies.length; i < len; i++) {
      const e = enemies[i];
      if (!e.active) continue;
      const dx = e.x - px, dy = e.y - py;
      sorted[count] = e;
      distSq[count] = dx * dx + dy * dy;
      count++;
    }
    // Truncate stale tail entries
    sorted.length = count;
    distSq.length = count;

    // Insertion sort — nearly sorted in practice (enemies don't teleport),
    // so this beats Array.sort's overhead for typical counts.
    for (let i = 1; i < count; i++) {
      const dSq = distSq[i];
      const enemy = sorted[i];
      let j = i - 1;
      while (j >= 0 && distSq[j] > dSq) {
        distSq[j + 1] = distSq[j];
        sorted[j + 1] = sorted[j];
        j--;
      }
      distSq[j + 1] = dSq;
      sorted[j + 1] = enemy;
    }
  }

  private ensureEnemyCache(): void {
    if (this.enemyCacheFrame === this.frameCounter) return;
    this.enemyCacheFrame = this.frameCounter;
    this.buildEnemyCache(this.cachePlayerX, this.cachePlayerY);
  }

  private findClosestEnemy(_fromX: number, _fromY: number, maxRange: number): Enemy | null {
    this.ensureEnemyCache();
    const maxRangeSq = maxRange * maxRange;
    const sorted = this.cachedSortedEnemies;
    const distSq = this.cachedSortedDistSq;
    for (let i = 0, len = sorted.length; i < len; i++) {
      if (distSq[i] > maxRangeSq) break;
      return sorted[i];
    }
    return null;
  }

  private onProjectileHitEnemy(
    projObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.destroyed || !this.scene?.sys?.isActive()) return;
    const proj = projObj as Projectile;
    const enemy = enemyObj as Enemy;
    if (!proj.active || !enemy.active) return;

    // Check if this hit should be processed (bouncing projectiles track per-enemy hits)
    if (proj.shouldSkipHit(enemy)) return;

    this.dealDamageToEnemy(
      enemy,
      proj.getDamage(),
      proj.isCrit(),
      proj.getWeaponKey() || 'unknown',
      proj.isPibrochAlignedAtFire(),
    );

    // Caber Toss applies burn (3 dps for 3s)
    if (proj.getWeaponKey() === 'caber_toss') {
      enemy.applyBurn(3, 3000);
    }

    proj.onHitEnemy();
  }

  hasWeapon(key: string): boolean {
    return this.weapons.some(w => w.config.key === key);
  }

  /** Replace loadout from a saved run (default starter is restored if list is empty). */
  replaceWeaponsFromRun(
    slots: { key: string; level: number; evolved: boolean; evolutionKey: string }[]
  ): void {
    this.weapons = [];
    for (const s of slots) {
      if (!WEAPON_DEFS[s.key as import('../data/weapons').WeaponKey]) continue;
      if (!this.addWeapon(s.key)) continue;
      for (let lv = 2; lv <= Math.max(1, s.level); lv++) {
        this.levelUpWeapon(s.key);
      }
      if (s.evolved && s.evolutionKey) {
        this.evolveWeapon(s.key, s.evolutionKey);
      }
    }
    if (this.weapons.length === 0) {
      this.addWeapon('thistle_shot');
    }
  }

  getWeapons(): ActiveWeapon[] {
    return this.weapons;
  }

  /**
   * V2 Track 3 — number of currently-held weapons that have fired their
   * evolution (reached evolved form via chest). Read by the run-end
   * recorder to decide the Burns's Wee Beastie unlock.
   */
  getEvolvedWeaponCount(): number {
    return this.weapons.reduce((n, w) => (w.evolved ? n + 1 : n), 0);
  }

  getProjectileGroup(): Phaser.GameObjects.Group {
    return this.projectilePool;
  }
}
