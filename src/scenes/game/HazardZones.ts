/**
 * HazardZones — spawns and ticks the 4 lava patches + 3 healing circles
 * placed at the start of every run. Lava deals 3 damage per 500ms,
 * healing circles restore 2 HP per 1000ms (both respect curse modifiers
 * via damageTakenMult for lava).
 *
 * Previously 80 lines inline in GameScene (spawnMapZones + tickMapZones
 * + lavaZones/healZones fields). Extracted because the tick loop is
 * self-contained: given a player position and hazard state, it knows
 * what to do.
 */
import * as Phaser from 'phaser';
import { GAME } from '../../config';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import { HAZARD_ZONE_LAVA, HAZARD_ZONE_HEAL, HAZARD_ZONE_SLICK, HAZARD_ZONE_FOG } from './hazardZonePalette';
import {
  spawnLavaOverlay,
  spawnHealOverlay,
  spawnSlickOverlay,
  spawnFogOverlay,
} from './hazardZoneOverlays';
import type { Enemy } from '../../entities/Enemy';
import {
  MEMORY_TRAIL_DURATION_MS,
  MEMORY_TRAIL_RADIUS_PX,
  MEMORY_TRAIL_SLOW_MS,
  MEMORY_TRAIL_SLOW_MUL,
  memoryTrailOverlaps,
  tickMemoryTrailEmit,
} from './memoryTrail';
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import { HAZARD_SOURCE_KEY } from '../../systems/DeathCauseTracker';
import { computeHazardDamage, HEAL_ZONE_HEAL_AMOUNT, LAVA_BASE_DAMAGE } from './hazardDamage';
import { TWEEN_INFINITE_BREATHE } from '../../utils/tweenPresets';
import { computeExtraHealingPlacement, computeHazardPlacements } from './hazardPlacement';
import type { RNG } from '../../utils/rng';
import { isInvincibilityEnabled } from '../../systems/accessibility/AssistMode';
import { isPlayerHazardImmune } from '../../systems/isPlayerHazardImmune';
import { audio } from '../../systems/AudioSystem';

export interface HazardZonesHooks {
  getPlayer(): Player;
  getJuice(): JuiceSystem;
  getDeathCauseTracker(): DeathCauseTracker;
  getSpawnSystem(): SpawnSystem;
  /**
   * Run-scoped seeded RNG. Zone positions are drawn from it so the same
   * seed produces the same hazard layout across runs (foundation for T1
   * deterministic replay + for daily-challenge fairness).
   */
  getRunRng(): RNG;
  isIFrames(): boolean;
  isVictoryPending(): boolean;
  getDamageTakenMult(): number;
  onPlayerKilled(): void;
  /** Lava damage only — for run-wide mechanics that care about HP thresholds. */
  onAfterPlayerDamaged?(hpBefore: number): void;
  /**
   * R1 M3 T20c — damp_tinder relic reduces fire hazard damage by 40%.
   * Returns the potentially-reduced damage; default behaviour is
   * identity. Applied after the generic `damageTakenMult` so stacking
   * with other effects composes predictably (curses first, then relics).
   */
  modifyFireDamageTaken?(baseDamage: number): number;
}

interface Zone {
  x: number;
  y: number;
  r: number;
  tickAccMs: number;
  /**
   * Visual GameObjects (base ellipse + glow ellipse + decorative
   * overlays + ember sprites for lava). Tracked so `reset()` destroys
   * them on scene restart — without this, a death+retry on the same
   * scene instance leaks the prior run's hazard art into the next
   * run's display list. Pre-existing leak for base/glow; new overlay
   * graphics + ember sprites widen the surface.
   */
  visuals: Phaser.GameObjects.GameObject[];
}

/**
 * Temporary slick zone spawned when a buckfast_ned dies. Carries the
 * visuals so `tick` can destroy them when the zone expires, and an
 * `expireAtMs` stamp in game-time so pausing doesn't bleed the timer.
 */
interface SlickZone {
  x: number;
  y: number;
  r: number;
  expireAtMs: number;
  visuals: Phaser.GameObjects.GameObject[];
}

/**
 * Whisky-puddle zone — spawned by the player's Whisky Breath burst at
 * the burst origin. DoT-ticks every active enemy in radius. Distinct
 * shape from `Zone` (player-affecting) and `SlickZone` (terrain
 * effect): puddles damage ENEMIES, not the player. Carries `tickAccMs`
 * for the DoT cadence and `dmgPerTick` so a high-stacks burst can
 * leave a meaner puddle without a separate puddle constant per
 * caller.
 */
interface WhiskyPuddleZone {
  x: number;
  y: number;
  r: number;
  tickAccMs: number;
  dmgPerTick: number;
  expireAtMs: number;
  visuals: Phaser.GameObjects.GameObject[];
}

/** Whisky puddle radius (px) — slightly tighter than the breath
 *  burst itself so the burst clears a wider arc on first hit and
 *  the puddle keeps damaging anything that walks back into the
 *  spilled-fuel patch. */
const WHISKY_PUDDLE_RADIUS_PX = 88;
/** Whisky puddle lifetime (ms) — three seconds of follow-up DoT. */
const WHISKY_PUDDLE_DURATION_MS = 3_000;
/** Whisky puddle DoT cadence — every 500 ms, matching the lava-zone
 *  cadence so combat readability stays consistent across damage
 *  patches. */
const WHISKY_PUDDLE_TICK_MS = 500;
/** Whisky puddle damage per tick — flat 4 base; caller may pass a
 *  scaled value if they want a heavier puddle. */
const WHISKY_PUDDLE_BASE_DMG_PER_TICK = 4;

/** Slick zone radius (px) — tuned so a single spill is avoidable but
 *  punishing if you walk into it while kiting. */
const SLICK_RADIUS_PX = 36;
/** Slick zone lifetime (ms) — long enough to matter in a fight,
 *  short enough to clear before the next ned throw lands. */
const SLICK_DURATION_MS = 5_000;
/** Fog zone radius (px) — wider than slick; fog should feel like
 *  drifting weather rather than a puddle. */
const FOG_RADIUS_PX = 52;
/** Fog zone lifetime (ms) — 7 s is one banter-tick longer than slick
 *  so the two patches have different "smell" even when both fire
 *  from a clustered pack. */
const FOG_DURATION_MS = 7_000;

export class HazardZones {
  private lavaZones: Zone[] = [];
  private healZones: Zone[] = [];
  private slickZones: SlickZone[] = [];
  /** Fog zones share the `SlickZone` shape — same expiry + visuals
   *  fields. Kept as a separate list so the tick loop reads fog-state
   *  against its own radii without branching on a discriminator. */
  private fogZones: SlickZone[] = [];
  /** Memory trail zones — emitted while the player walks through fog,
   *  slow any enemy that crosses them for a short window. Share the
   *  `SlickZone` shape (expiry + visuals) so cleanup paths match. */
  private memoryTrailZones: SlickZone[] = [];
  /** Accumulator driving the memory-trail emit cadence. Reset when the
   *  player leaves fog so re-entry starts a clean cadence. */
  private memoryTrailAccMs: number = 0;
  /** Whisky-puddle DoT zones — spawned by Whisky Breath bursts.
   *  Damages enemies (not the player). Tick cadence is 500 ms; each
   *  tick iterates the live enemy group and applies damage to anything
   *  within radius. Cleaned up on `reset()` and on natural expiry. */
  private whiskyPuddleZones: WhiskyPuddleZone[] = [];

  /**
   * V2 Track 1 — sticky flag set the first time the player's heal-tick
   * check finds them inside a healing circle this run. Reset in
   * `reset()`. Surfaced via `didEnterHealingCircle()` for
   * RunHistoryRecorder to thread into `applyRunSummary`'s Doric Quinie
   * no-heal-run counter.
   */
  private enteredHealingCircle: boolean = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hooks: HazardZonesHooks,
  ) {}

  reset(): void {
    for (const z of this.lavaZones) for (const v of z.visuals) v.destroy();
    this.lavaZones = [];
    for (const z of this.healZones) for (const v of z.visuals) v.destroy();
    this.healZones = [];
    for (const z of this.slickZones) for (const v of z.visuals) v.destroy();
    this.slickZones = [];
    for (const z of this.fogZones) for (const v of z.visuals) v.destroy();
    this.fogZones = [];
    for (const z of this.memoryTrailZones) for (const v of z.visuals) v.destroy();
    this.memoryTrailZones = [];
    this.memoryTrailAccMs = 0;
    for (const z of this.whiskyPuddleZones) for (const v of z.visuals) v.destroy();
    this.whiskyPuddleZones = [];
    this.enteredHealingCircle = false;
  }

  /**
   * V2 Track 1 — true if the player has overlapped any healing circle
   * this run. Sticky; flipped once inside the tick loop, cleared on
   * `reset()`. Read by RunHistoryRecorder.buildContext.
   */
  didEnterHealingCircle(): boolean {
    return this.enteredHealingCircle;
  }

  spawn(): void {
    const W = GAME.WORLD_WIDTH;
    const H = GAME.WORLD_HEIGHT;
    const scene = this.scene;
    const placements = computeHazardPlacements(this.hooks.getRunRng(), W, H);

    for (const z of placements.lava) {
      const lavaBase = scene.add
        .ellipse(z.x, z.y, z.r * 2, z.r * 1.5, HAZARD_ZONE_LAVA.baseColor, HAZARD_ZONE_LAVA.baseAlpha)
        .setDepth(-1);
      const lavaGlow = scene.add
        .ellipse(z.x, z.y, z.r * 1.6, z.r * 1.2, HAZARD_ZONE_LAVA.glowColor, HAZARD_ZONE_LAVA.glowAlpha)
        .setDepth(-1);
      scene.tweens.add({
        targets: lavaGlow,
        alpha: { from: 0.15, to: 0.35 },
        scale: { from: 1, to: 1.1 },
        duration: 1500 + z.tweenJitterMs,
        ...TWEEN_INFINITE_BREATHE,
      });
      // Decorative cracks + ember pinpricks + cooling-edge ring overlay.
      // Lifts the patch from "two stacked ellipses" to "fissured magma".
      const overlayObjects = spawnLavaOverlay(scene, z.x, z.y, z.r);
      this.lavaZones.push({
        x: z.x, y: z.y, r: z.r, tickAccMs: 0,
        visuals: [lavaBase, lavaGlow, ...overlayObjects],
      });
    }

    for (const z of placements.heal) {
      this.addHealingCircle(z.x, z.y, z.r, z.tweenJitterMs);
    }
  }

  /**
   * Drops an additional healing circle at random world coords. Used by
   * W2 route onResume (round_the_loch spawns two extra for act 2).
   * Routed through the run RNG so the route's side-effect reproduces
   * under the same seed.
   */
  spawnHealingCircle(): void {
    const W = GAME.WORLD_WIDTH;
    const H = GAME.WORLD_HEIGHT;
    const p = computeExtraHealingPlacement(this.hooks.getRunRng(), W, H);
    this.addHealingCircle(p.x, p.y, p.r, p.tweenJitterMs);
  }

  /**
   * Spawn a short-lived slick patch at `(x, y)`. Called when a
   * `buckfast_ned` enemy dies — the dropped bottle breaks, leaving a
   * sticky spill that slows the player while they stand on it. Zone
   * auto-expires after {@link SLICK_DURATION_MS}.
   */
  spawnBottleSlick(x: number, y: number): void {
    const scene = this.scene;
    const r = SLICK_RADIUS_PX;
    const gameTimeMs = this.hooks.getSpawnSystem().getGameTimeSec() * 1000;
    const base = scene.add
      .ellipse(x, y, r * 2, r * 1.5, HAZARD_ZONE_SLICK.baseColor, HAZARD_ZONE_SLICK.baseAlpha)
      .setDepth(-1);
    const glow = scene.add
      .ellipse(x, y, r * 1.6, r * 1.2, HAZARD_ZONE_SLICK.glowColor, HAZARD_ZONE_SLICK.glowAlpha)
      .setDepth(-1);
    scene.tweens.add({
      targets: glow,
      alpha: { from: HAZARD_ZONE_SLICK.glowAlpha * 0.4, to: HAZARD_ZONE_SLICK.glowAlpha },
      scale: { from: 0.9, to: 1.05 },
      duration: 700,
      ...TWEEN_INFINITE_BREATHE,
    });
    // Smashed-bottle silhouette + amber glaze trail. Anchors the spill
    // to the dropped Buckfast bottle that just broke.
    const overlayObjects = spawnSlickOverlay(scene, x, y, r);
    this.slickZones.push({
      x, y, r,
      expireAtMs: gameTimeMs + SLICK_DURATION_MS,
      visuals: [base, glow, ...overlayObjects],
    });
  }

  /**
   * Spawn a drifting fog patch at `(x, y)`. Called when a haar_wraith
   * dies — its mist lingers locally. Player's pickup radius halves
   * while overlapping (see `Player.getPickupRadius`); no damage, no
   * slow, so fog is a distinct kind of pressure from slick.
   */
  spawnHaarFog(x: number, y: number): void {
    const scene = this.scene;
    const r = FOG_RADIUS_PX;
    const gameTimeMs = this.hooks.getSpawnSystem().getGameTimeSec() * 1000;
    const base = scene.add
      .ellipse(x, y, r * 2, r * 1.5, HAZARD_ZONE_FOG.baseColor, HAZARD_ZONE_FOG.baseAlpha)
      .setDepth(-1);
    const glow = scene.add
      .ellipse(x, y, r * 1.7, r * 1.3, HAZARD_ZONE_FOG.glowColor, HAZARD_ZONE_FOG.glowAlpha)
      .setDepth(-1);
    scene.tweens.add({
      targets: glow,
      alpha: { from: HAZARD_ZONE_FOG.glowAlpha * 0.4, to: HAZARD_ZONE_FOG.glowAlpha },
      scale: { from: 0.85, to: 1.1 },
      duration: 1_000,
      ...TWEEN_INFINITE_BREATHE,
    });
    // Drifting tendril wisps — three slowly-moving streaks make the
    // patch feel like weather instead of a static puddle.
    const overlayObjects = spawnFogOverlay(scene, x, y, r);
    // Pair with a sustained pale-cyan whoosh so the patch announces
    // itself audibly the same way the visual wisps announce it visually.
    audio.playHaarDrift();
    this.fogZones.push({
      x, y, r,
      expireAtMs: gameTimeMs + FOG_DURATION_MS,
      visuals: [base, glow, ...overlayObjects],
    });
  }

  /**
   * Spawn a whisky-breath burn-puddle at `(x, y)`. Called by the
   * Player's Whisky Breath burst (DESIGN_IDEAS §1, slice 2). Puddle
   * damages every active enemy within `WHISKY_PUDDLE_RADIUS_PX`
   * every `WHISKY_PUDDLE_TICK_MS`, for `WHISKY_PUDDLE_DURATION_MS`.
   *
   * Optional `dmgPerTickOverride` lets the burst's stack-scaled
   * damage carry through to the puddle's DoT — a full-charge breath
   * leaves a meaner residue. Defaults to `WHISKY_PUDDLE_BASE_DMG_PER_TICK`
   * when caller doesn't care.
   *
   * Visual: warm-amber circular base + brighter inner ember ring +
   * subtle pulsing alpha breathe via shared `TWEEN_INFINITE_BREATHE`.
   * Reads as "spilled fuel still burning" against the moor floor.
   */
  spawnWhiskyPuddle(x: number, y: number, dmgPerTickOverride?: number): void {
    const scene = this.scene;
    const r = WHISKY_PUDDLE_RADIUS_PX;
    const gameTimeMs = this.hooks.getSpawnSystem().getGameTimeSec() * 1000;

    // Outer warm-amber base — large soft glow.
    const base = scene.add
      .ellipse(x, y, r * 2, r * 1.5, 0xc8a040, 0.30)
      .setDepth(-1);
    // Mid ember ring — brighter copper-orange.
    const mid = scene.add
      .ellipse(x, y, r * 1.4, r * 1.05, 0xff8a20, 0.45)
      .setDepth(-1);
    // Hot core — small bright cream-amber centre.
    const core = scene.add
      .ellipse(x, y, r * 0.55, r * 0.4, 0xffd070, 0.6)
      .setDepth(-1);

    // Pulse breathing — sells "still burning" without a particle pool.
    scene.tweens.add({
      targets: mid,
      alpha: { from: 0.45 * 0.6, to: 0.45 },
      scale: { from: 0.92, to: 1.05 },
      duration: 600,
      ...TWEEN_INFINITE_BREATHE,
    });
    scene.tweens.add({
      targets: core,
      alpha: { from: 0.6 * 0.5, to: 0.6 },
      scale: { from: 0.85, to: 1.0 },
      duration: 400,
      ...TWEEN_INFINITE_BREATHE,
    });

    this.whiskyPuddleZones.push({
      x, y, r,
      tickAccMs: 0,
      dmgPerTick: Math.max(1, Math.round(dmgPerTickOverride ?? WHISKY_PUDDLE_BASE_DMG_PER_TICK)),
      expireAtMs: gameTimeMs + WHISKY_PUDDLE_DURATION_MS,
      visuals: [base, mid, core],
    });
  }

  /**
   * Drop a single memory-trail wisp at `(x, y)`. Emitted by the tick
   * loop while the player is walking through a fog patch — each wisp
   * slows any enemy that crosses it for a short window.
   */
  private spawnMemoryTrail(x: number, y: number): void {
    const scene = this.scene;
    const r = MEMORY_TRAIL_RADIUS_PX;
    const gameTimeMs = this.hooks.getSpawnSystem().getGameTimeSec() * 1000;
    // Faint teal-white wisp — reads as "vapour left by the haggis" against
    // the warm moor palette. Depth behind entities so it doesn't cloud the
    // player silhouette.
    const glow = scene.add
      .ellipse(x, y, r * 1.4, r * 1.0, 0x88d0e0, 0.22)
      .setDepth(-1);
    const core = scene.add
      .ellipse(x, y, r * 0.9, r * 0.65, 0xe8f6ff, 0.14)
      .setDepth(-1);
    scene.tweens.add({
      targets: [glow, core],
      alpha: 0,
      scale: 0.65,
      duration: MEMORY_TRAIL_DURATION_MS,
      ease: 'Quad.easeOut',
    });
    this.memoryTrailZones.push({
      x, y, r,
      expireAtMs: gameTimeMs + MEMORY_TRAIL_DURATION_MS,
      visuals: [glow, core],
    });
  }

  private addHealingCircle(hx: number, hy: number, hr: number, jitterMs: number): void {
    const scene = this.scene;
    const healBase = scene.add
      .ellipse(hx, hy, hr * 2, hr * 1.5, HAZARD_ZONE_HEAL.baseColor, HAZARD_ZONE_HEAL.baseAlpha)
      .setDepth(-1);
    const healGlow = scene.add
      .ellipse(hx, hy, hr * 1.4, hr * 1.0, HAZARD_ZONE_HEAL.glowColor, HAZARD_ZONE_HEAL.glowAlpha)
      .setDepth(-1);
    scene.tweens.add({
      targets: healGlow,
      alpha: { from: 0.08, to: 0.2 },
      duration: 2000 + jitterMs,
      ...TWEEN_INFINITE_BREATHE,
    });
    // Celtic high-cross + herb sprigs + sparkle motes overlay. Reads as
    // a sacred restorative spot rather than a generic green disc.
    const overlayObjects = spawnHealOverlay(scene, hx, hy, hr);
    this.healZones.push({
      x: hx, y: hy, r: hr, tickAccMs: 0,
      visuals: [healBase, healGlow, ...overlayObjects],
    });
  }

  tick(scaledDelta: number): void {
    if (scaledDelta <= 0) return;

    const player = this.hooks.getPlayer();

    // Lava damage tick every 500ms — squared compare avoids sqrt per zone × tick.
    for (const z of this.lavaZones) {
      z.tickAccMs += scaledDelta;
      const rSq = z.r * z.r;
      while (z.tickAccMs >= 500) {
        z.tickAccMs -= 500;
        if (!player.active || this.hooks.isVictoryPending()) continue;
        // Shared hazard-immunity gate. Pre-2026-04-28 this site inlined
        // four checks across two `if` blocks; HazardsSystem inlined a
        // smaller subset and could drift. `isPlayerHazardImmune` is the
        // canonical predicate both call sites now share. Assist Mode
        // master toggle is checked inside `isInvincibilityEnabled` —
        // returns false when assistMode master is off regardless of
        // sub-flag state.
        if (player.isFloraPlaidActive() || isPlayerHazardImmune(
          this.hooks.isIFrames(),
          player.isDashInvincible(),
          player.isHazardLeaping(),
          isInvincibilityEnabled(),
        )) continue;
        const dx = player.x - z.x;
        const dy = player.y - z.y;
        if (dx * dx + dy * dy < rSq) {
          const afterMult = computeHazardDamage(LAVA_BASE_DAMAGE, this.hooks.getDamageTakenMult());
          const hazardDmg = Math.max(
            1,
            Math.round(this.hooks.modifyFireDamageTaken?.(afterMult) ?? afterMult),
          );
          const hpBefore = player.getHp();
          const dead = player.takeDamage(hazardDmg);
          if (!dead) {
            this.hooks.onAfterPlayerDamaged?.(hpBefore);
          }
          this.hooks.getDeathCauseTracker().recordDamage({
            gameTimeSec: this.hooks.getSpawnSystem().getGameTimeSec(),
            sourceKey: HAZARD_SOURCE_KEY,
            amount: hazardDmg,
            sourceIsBoss: false,
            sourceIsElite: false,
            sourceIsHazard: true,
            hpAfter: player.getHp(),
            maxHpAfter: player.getMaxHp(),
          });
          this.hooks.getJuice().flashRed(80);
          if (dead) this.hooks.onPlayerKilled();
        }
      }
    }

    // Healing tick every 1000ms — same squared-compare elegance.
    for (const z of this.healZones) {
      z.tickAccMs += scaledDelta;
      const rSq = z.r * z.r;

      // Race the Beithir cure (DESIGN_IDEAS §1) — folkloric "running
      // water under a bridge". Fires *immediately* on overlap rather
      // than waiting up to 1 s for the next 1-Hz heal tick; the cure
      // is an edge-driven one-shot, so it runs outside the throttled
      // heal loop. No-op when the player isn't stung. The player's
      // own helper short-circuits a no-overlap re-entry without
      // re-firing the SFX/banter, so it's safe to call every frame
      // while overlapping.
      if (player.active && player.isBeithirStung()) {
        const dx = player.x - z.x;
        const dy = player.y - z.y;
        if (dx * dx + dy * dy < rSq) {
          player.cureBeithirStingFromHeal();
        }
      }

      while (z.tickAccMs >= 1000) {
        z.tickAccMs -= 1000;
        if (!player.active) continue;
        const dx = player.x - z.x;
        const dy = player.y - z.y;
        if (dx * dx + dy * dy < rSq) {
          player.heal(HEAL_ZONE_HEAL_AMOUNT);
          // V2 T1 — sticky per-run flag; Doric Quinie unlock gates on
          // this staying false through a victorious run.
          this.enteredHealingCircle = true;
        }
      }
    }

    // Slick zones — check expiry + whether player overlaps any. Back-to-front
    // iteration so splice() on expire doesn't shift the index under us.
    const nowMs = this.hooks.getSpawnSystem().getGameTimeSec() * 1000;
    let playerInSlick = false;
    for (let i = this.slickZones.length - 1; i >= 0; i--) {
      const z = this.slickZones[i];
      if (nowMs >= z.expireAtMs) {
        for (const v of z.visuals) v.destroy();
        this.slickZones.splice(i, 1);
        continue;
      }
      if (!player.active) continue;
      const dx = player.x - z.x;
      const dy = player.y - z.y;
      if (dx * dx + dy * dy < z.r * z.r) playerInSlick = true;
    }
    player.setInSlick(playerInSlick);

    // Fog zones — same expiry + overlap shape as slick, separate list so
    // the two effects stay independent (e.g. a player kiting through both
    // gets slowed AND magnet-halved, as intended).
    let playerInFog = false;
    for (let i = this.fogZones.length - 1; i >= 0; i--) {
      const z = this.fogZones[i];
      if (nowMs >= z.expireAtMs) {
        for (const v of z.visuals) v.destroy();
        this.fogZones.splice(i, 1);
        continue;
      }
      if (!player.active) continue;
      const dx = player.x - z.x;
      const dy = player.y - z.y;
      if (dx * dx + dy * dy < z.r * z.r) playerInFog = true;
    }
    player.setInFog(playerInFog);

    // Memory trail — emitted while the player is inside a fog patch.
    // Any enemy overlapping a wisp gets a brief Enemy.applyFreeze slow,
    // turning the fog into a defensive kiting lane instead of just a
    // magnet debuff. Hazard enemies ignore freeze internally, so the
    // trail can't cheese deep_fryer-style statics.
    const emit = tickMemoryTrailEmit({
      inFog: playerInFog,
      accMs: this.memoryTrailAccMs,
      scaledDelta,
    });
    this.memoryTrailAccMs = emit.nextAccMs;
    for (let i = 0; i < emit.emitCount; i++) {
      this.spawnMemoryTrail(player.x, player.y);
    }

    if (this.memoryTrailZones.length > 0) {
      const enemies = this.hooks.getSpawnSystem().getEnemyGroup().getChildren() as Enemy[];
      for (let i = this.memoryTrailZones.length - 1; i >= 0; i--) {
        const z = this.memoryTrailZones[i];
        if (nowMs >= z.expireAtMs) {
          for (const v of z.visuals) v.destroy();
          this.memoryTrailZones.splice(i, 1);
          continue;
        }
        for (const e of enemies) {
          if (!e.active) continue;
          if (memoryTrailOverlaps(z.x, z.y, z.r, e.x, e.y)) {
            e.applyFreeze(MEMORY_TRAIL_SLOW_MUL, MEMORY_TRAIL_SLOW_MS);
          }
        }
      }
    }

    // Whisky-puddle DoT zones — damages any enemy within radius every
    // `WHISKY_PUDDLE_TICK_MS`. Distinct from lava (player-affecting):
    // these zones are emitted by the player and damage enemies, so the
    // immunity gate doesn't apply. Expire after `WHISKY_PUDDLE_DURATION_MS`.
    if (this.whiskyPuddleZones.length > 0) {
      const enemies = this.hooks.getSpawnSystem().getEnemyGroup().getChildren() as Enemy[];
      for (let i = this.whiskyPuddleZones.length - 1; i >= 0; i--) {
        const z = this.whiskyPuddleZones[i]!;
        if (nowMs >= z.expireAtMs) {
          for (const v of z.visuals) v.destroy();
          this.whiskyPuddleZones.splice(i, 1);
          continue;
        }
        z.tickAccMs += scaledDelta;
        const rSq = z.r * z.r;
        while (z.tickAccMs >= WHISKY_PUDDLE_TICK_MS) {
          z.tickAccMs -= WHISKY_PUDDLE_TICK_MS;
          for (const e of enemies) {
            if (!e.active) continue;
            const dx = e.x - z.x;
            const dy = e.y - z.y;
            if (dx * dx + dy * dy <= rSq) {
              e.takeDamageWithKillEvents(z.dmgPerTick);
            }
          }
        }
      }
    }
  }
}
