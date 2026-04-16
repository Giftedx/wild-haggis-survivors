import Phaser from 'phaser';
import type { SettingsManager } from '../core/SettingsManager';
import { getSettingsManager } from '../core/SettingsManager';
import { tryCameraShake } from '../utils/cameraShake';
import { Enemy } from '../entities/Enemy';
import { ENEMIES, GAME } from '../config';
import { getEnemyConfigsByKeys, getSpawnWeight, EnemyConfig, ENEMY_TYPES, BOSSES, BossConfig } from '../data/enemies';
import { BALANCE, getActiveWaveTimelineEntry } from '../core/BalanceConfig';
import { audio } from './AudioSystem';
import { ISceneContext } from '../core/ISceneContext';
import { getCameraViewport } from '../ui/cameraViewport';
import { t } from '../core/i18n';
import { BIOMES } from '../data/biomes';
import { computePostBellMultipliers, NEUTRAL_POST_BELL, type PostBellMultipliers } from '../core/PostBellEscalation';
import { ELITE_AFFIXES, pickEliteAffixId } from '../data/eliteAffixes';

/** First matching reason wins — see `getSpawnStallReason()`. Boss lifecycle is orthogonal to wave stalls. */
export type SpawnStallReason =
  | 'PAUSED'
  | 'POOL_SATURATED'
  | 'INTERVAL_WAIT'
  | 'NO_TYPES_AVAILABLE'
  | 'RUN_FINALE';

/**
 * SpawnSystem — manages enemy object pool, wave spawning, and boss spawns.
 */
export class SpawnSystem {
  private pool: Phaser.GameObjects.Group;
  private scene: Phaser.Scene & ISceneContext;
  private spawnTimer: number = 0;
  private gameTimeSec: number = 0;
  private spawnInterval: number = 1.5;
  private burstSize: number = 2;
  /**
   * Per-run spawn cadence multiplier. 1.0 = default cadence (wave timeline
   * values untouched). <1.0 = faster spawns (used by the "Restless Spirits"
   * curse). Applied at every point where `spawnInterval` is refreshed from
   * the wave timeline — GameScene writes this once at run start.
   */
  private spawnIntervalMult: number = 1.0;
  /**
   * Per-run elite roll multiplier (W2 Moor Road). 1.0 = untouched.
   * Applied on top of base ELITE_SPAWN_CHANCE + killPressure nudge.
   * `up_the_brae` route sets this to 1.5 for act 2.
   */
  private eliteWeightMultiplier: number = 1.0;
  /**
   * Per-run enemy HP multiplier (W2 Moor Road). 1.0 = untouched.
   * `buckie_pitstop` sets 1.10 after the 15s pause.
   */
  private enemyHpMultiplier: number = 1.0;
  /**
   * Wall-clock ms epoch at which the `pauseSpawnsFor` hold ends.
   * 0 = not paused. Used by `spawnBurst` to no-op regular spawns
   * for the duration without touching token infrastructure.
   */
  private spawnsPausedUntilRealMs: number = 0;
  /** Current segment from `WAVE_TIMELINE` — refreshed each update from `gameTimeSec`. */
  private directorEnemyKeys: string[] = [];
  /** Cached segment reference — avoids re-spreading enemyKeys when segment hasn't changed. */
  private lastWaveSeg: ReturnType<typeof getActiveWaveTimelineEntry> | null = null;

  /** Track which bosses have already spawned */
  private spawnedBossKeys: Set<string> = new Set();
  /** Boss intro scheduled (warning + timer) — avoids duplicate banners; key moves to spawnedBossKeys only after the entity spawns. */
  private bossSpawnScheduled: Set<string> = new Set();
  /** Cached boss-active flag — avoids iterating 400 enemies per frame */
  private bossActive: boolean = false;
  /** One-shot: run reached `RUN_WIN_TIME_SEC` — timeline bursts off, finale boss queued. */
  private runWinFinaleStarted: boolean = false;
  /** 0–1 — rises on kills, decays over time; nudges elite spawn chance. */
  private killPressure: number = 0;
  /** When true, `spawnBurst` is a no-op (final boss phase). */
  private regularSpawnsDisabled: boolean = false;
  /** Set when a boss is ready to spawn but physics is paused (level-up / manual pause).
   *  The next unpaused update() tick will flush and clear it. */
  private pendingBossSpawn: (() => void) | null = null;
  private bossCheckFrame: number = -1;

  /** Active boss warning / intro VFX objects — cleaned up on destroy to prevent stale tween callbacks. */
  private activeBossVfx: Phaser.GameObjects.GameObject[] = [];

  /** Emits 'bossWarning' and 'bossKilled' events */
  readonly events = new Phaser.Events.EventEmitter();
  private readonly settings: SettingsManager;

  constructor(scene: Phaser.Scene & ISceneContext) {
    this.scene = scene;
    this.settings = getSettingsManager();

    this.pool = scene.add.group({
      classType: Enemy,
      maxSize: ENEMIES.MAX_ACTIVE,
      runChildUpdate: false,
    });

    for (let i = 0; i < 100; i++) {
      this.pool.add(new Enemy(scene, 0, 0));
    }

    const init = getActiveWaveTimelineEntry(this.gameTimeSec);
    this.spawnInterval = init.intervalSec * this.spawnIntervalMult;
    this.burstSize = init.burstSize;
    this.directorEnemyKeys = [...init.enemyKeys];
    this.lastWaveSeg = init;
  }

  /**
   * Install a run-scoped spawn cadence multiplier. Call once after
   * construction, before the first update tick — the stored value is read
   * every time `spawnInterval` is refreshed from the wave timeline.
   */
  setSpawnIntervalMult(mult: number): void {
    this.spawnIntervalMult = Math.max(0.1, mult);
    // Re-apply immediately so the very first segment uses the multiplier.
    const seg = this.lastWaveSeg ?? getActiveWaveTimelineEntry(this.gameTimeSec);
    this.spawnInterval = seg.intervalSec * this.spawnIntervalMult;
  }

  /**
   * W2 Moor Road: multiply base elite roll chance. `up_the_brae` route
   * sets 1.5 for act 2; reset to 1 on new run via resetRunState().
   * Clamped to [0.1, 5] so a bad delta can't totally mute or saturate.
   */
  setEliteWeightMultiplier(mult: number): void {
    this.eliteWeightMultiplier = Phaser.Math.Clamp(mult, 0.1, 5);
  }

  /**
   * W2 Moor Road: scale enemy HP at spawn time (stacks on top of the
   * standard post-Bell multiplier). `buckie_pitstop` sets 1.10.
   * Clamped to [0.25, 3].
   */
  setEnemyHpMultiplier(mult: number): void {
    this.enemyHpMultiplier = Phaser.Math.Clamp(mult, 0.25, 3);
  }

  /**
   * W2 Moor Road: suppress regular spawn bursts for `ms` wall-clock
   * milliseconds. Used by `buckie_pitstop` to give the player 15s of
   * peace before resuming. Boss timeline is untouched.
   */
  pauseSpawnsFor(ms: number): void {
    this.spawnsPausedUntilRealMs = Date.now() + Math.max(0, ms);
  }

  /**
   * W2 Moor Road: bypass the director and spawn a single enemy by key
   * at the usual off-screen spawn position. Used by route onResume
   * bodies (e.g. `through_the_kirkyard` drops an elite haggis_hunter
   * the moment the run resumes from the picker).
   *
   * No-ops if the enemy key is unknown or the pool is saturated.
   */
  forceSpawn(enemyKey: string, opts?: { elite?: boolean }): void {
    const config = ENEMY_TYPES[enemyKey];
    if (!config) return;
    const enemy = Enemy.acquireFromPool(this.pool, this.scene);
    if (!enemy) return;
    const player = this.scene.getPlayer();
    const pos = this.getSpawnPosition(this.scene.cameras.main, player.x, player.y);
    enemy.spawn(pos.x, pos.y, config, this.gameTimeSec);
    if (opts?.elite) {
      enemy.markAsElite();
      const rng = this.scene.getRunRng();
      const affix = pickEliteAffixId(config.behavior, rng);
      if (affix) enemy.applyEliteAffix(affix);
    }
  }

  private getUiViewport(): { x: number; y: number; width: number; height: number } {
    const { x, y, width, height } = getCameraViewport(this.scene);
    return { x, y, width, height };
  }

  /** Reset run-scoped spawn state and deactivate pooled enemies. */
  resetRunState(): void {
    this.spawnTimer = 0;
    this.gameTimeSec = 0;
    const init = getActiveWaveTimelineEntry(0);
    this.spawnInterval = init.intervalSec * this.spawnIntervalMult;
    this.burstSize = init.burstSize;
    this.directorEnemyKeys = [...init.enemyKeys];
    this.lastWaveSeg = init;
    this.spawnedBossKeys.clear();
    this.bossSpawnScheduled.clear();
    this.bossActive = false;
    this.pendingBossSpawn = null;
    this.bossCheckFrame = -1;
    this.runWinFinaleStarted = false;
    this.regularSpawnsDisabled = false;
    this.killPressure = 0;
    this.eliteWeightMultiplier = 1.0;
    this.enemyHpMultiplier = 1.0;
    this.spawnsPausedUntilRealMs = 0;
    this.events.removeAllListeners();

    if (this.activeBossVfx) {
      for (const obj of this.activeBossVfx) {
        this.scene.tweens.killTweensOf(obj);
        obj.destroy();
      }
      this.activeBossVfx = [];
    }

    this.scene.tweens.killTweensOf(this.scene.cameras.main);

    const enemies = this.pool.children.entries as Enemy[];
    for (const e of enemies) {
      if (e.active) {
        try { e.destroy(); } catch { /* ignore */ }
        e.active = false;
        e.visible = false;
      }
    }
  }

  destroy(): void {
    this.resetRunState();
    try { this.pool.clear(true, true); } catch { /* ignore */ }
  }

  update(delta: number, playerX: number, playerY: number): void {
    this.gameTimeSec += delta / 1000;
    this.spawnTimer += delta / 1000;
    const ds = delta / 1000;
    this.killPressure *= Math.exp(-ds * BALANCE.director.killPressureDecayPerSec);

    // Flush a deferred boss spawn once physics is running again.
    // scene.time.delayedCall still fires during the level-up modal (physics
    // pause), but we don't want a boss to materialize and bossActive to flip
    // while the player is picking cards. The callback sets this closure
    // which we run here on the next unpaused tick.
    if (this.pendingBossSpawn && !this.scene.getTimeManager().isGameplayPaused()) {
      const fn = this.pendingBossSpawn;
      this.pendingBossSpawn = null;
      fn();
    }

    if (!this.runWinFinaleStarted && this.gameTimeSec >= BALANCE.run.RUN_WIN_TIME_SEC) {
      this.beginRunWinFinale(playerX, playerY);
    }

    this.syncWaveDirectorFromTimeline();
    this.checkBossSpawns(playerX, playerY);

    if (this.spawnTimer >= this.spawnInterval) {
      // Carry over small overshoots for accurate rate, but cap to prevent
      // burst-spawning after lag spikes
      this.spawnTimer = Math.min(this.spawnTimer - this.spawnInterval, this.spawnInterval);
      this.spawnBurst(playerX, playerY);
    }

    if (!this.scene.getTimeManager().isGameplayPaused()) {
      const active = this.pool.children.entries as Enemy[];
      for (let i = 0; i < active.length; i++) {
        if (active[i].active) active[i].chaseTarget(playerX, playerY, delta);
      }
    }
  }

  // ── Boss spawning ──

  private checkBossSpawns(playerX: number, playerY: number): void {
    for (const boss of BOSSES) {
      if (this.spawnedBossKeys.has(boss.key)) continue;
      if (this.gameTimeSec < boss.spawnTimeSec) continue;
      if (this.bossSpawnScheduled.has(boss.key)) continue;
      this.bossSpawnScheduled.add(boss.key);
      this.spawnBoss(boss, playerX, playerY);
    }
  }

  private spawnBoss(boss: BossConfig, _playerX: number, _playerY: number): void {
    // Show warning banner
    const warning = t(boss.warningKey);
    this.showBossWarning(warning);
    this.scene.caption?.(`boss_${boss.key}`, warning, '#ff6644');
    // A beat of Glesga nerves right as the screen shakes. Pass the boss
    // key so the engine picks from the authored per-boss pool when one
    // exists — Gordon, Taxman etc. each get their own warning voice.
    this.scene.requestBanter?.('boss_warn', boss.key);

    // The actual spawn work — captured so we can defer it if physics is
    // paused (e.g. level-up modal open) when the 1500ms warning finishes.
    const doSpawn = () => {
      // Idempotency guard: stale/duplicate callbacks must never spawn another
      // instance once this boss key has already been materialized.
      if (this.spawnedBossKeys.has(boss.key)) {
        return;
      }
      const player = this.scene.getPlayer();
      const currentX = player?.x ?? _playerX;
      const currentY = player?.y ?? _playerY;
      const camera = this.scene.cameras.main;
      const pos = this.getSpawnPosition(camera, currentX, currentY);

      const enemy = Enemy.acquireFromPool(this.pool, this.scene);
      if (!enemy) {
        // Pool saturated — retry next unpaused tick (do not consume spawnedBossKeys).
        this.pendingBossSpawn = doSpawn;
        return;
      }

      // Bosses use the chase EnemyConfig shape
      const bossAsConfig: EnemyConfig = {
        key: boss.key,
        texture: boss.texture,
        speed: boss.speed,
        hp: boss.hp,
        damage: boss.damage,
        xpValue: boss.xpValue,
        appearsAt: 0,
        behavior: 'chase',
        packSize: 1,
      };

      // Scale boss HP with game time — keeps bosses challenging as player
      // power grows. +0.2% per second after minute 5: a boss at minute 5
      // has 1.0× HP, minute 10 → 1.6×, minute 15 → 2.2×.
      const timeScale = 1 + Math.max(0, (this.gameTimeSec - 300) * 0.002);
      if (timeScale > 1) {
        bossAsConfig.hp = Math.ceil(boss.hp * timeScale);
      }

      // Pass gameTimeSec=0 so regular HP_SCALE_PER_MINUTE isn't applied
      // on top — the time scaling above is the boss-specific formula.
      enemy.spawn(pos.x, pos.y, bossAsConfig, 0);
      // setBaseDisplayScale updates the anchor the idle bob wobbles around,
      // so bosses actually breathe now instead of being frozen at base scale.
      enemy.setBaseDisplayScale(boss.scale);
      enemy.setBaseTint(0xff4444);
      enemy.markAsBoss();
      this.bossActive = true;
      this.spawnedBossKeys.add(boss.key);

      // Dramatic entrance — camera zoom pulse + shake
      const cam = this.scene.cameras.main;
      tryCameraShake(cam, 400, 0.015, this.settings);

      // Brief zoom-in then back out
      const originalZoom = cam.zoom;
      this.scene.tweens.add({
        targets: cam,
        zoom: originalZoom * 1.15,
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeOut',
      });

      // Dark vignette flash — position in camera-viewport coordinates so
      // it centers inside the visible area even when cameras.main.zoom > 1.
      const { x: vx, y: vy, width: vw, height: vh } = this.getUiViewport();
      const vig = this.scene.add.rectangle(vx + vw / 2, vy + vh / 2, vw, vh, 0x000000, 0.3)
        .setScrollFactor(0).setDepth(45);
      (this.activeBossVfx ??= []).push(vig);
      this.scene.tweens.add({
        targets: vig, alpha: 0, duration: 800,
        onComplete: () => {
          vig.destroy();
          if (this.activeBossVfx) this.activeBossVfx = this.activeBossVfx.filter(o => o !== vig);
        },
      });
    };

    // Spawn after the warning fades — use CURRENT player position, not the
    // stale coordinates from 1.5 seconds ago when the warning started.
    // Raw timer lives outside physics/timeScale; if the player is paused
    // mid-level-up, defer the spawn work to the next unpaused update() tick.
    //
    // Stale-run guard: if the run restarts between schedule and fire, the
    // `spawnedBossKeys` Set reference changes. Compare before calling
    // doSpawn so a cross-run callback can't double-spawn a boss.
    const runRef = this.spawnedBossKeys;
    this.scene.getUpdateTickers().addOnce('raw', BALANCE.bossWarning.spawnDelayMs, () => {
      if (this.spawnedBossKeys !== runRef) return;
      if (this.scene.getTimeManager().isGameplayPaused()) {
        this.pendingBossSpawn = doSpawn;
      } else {
        doSpawn();
      }
    });
  }

  private showBossWarning(text: string): void {
    audio.playBossWarning();
    const { x, y, width, height } = this.getUiViewport();
    const settings = this.settings.load();
    // Accessibility: scale font by uiScale, swap palette when high-contrast.
    // Boss warning is a Soul-critical moment — kindness applies here too.
    const baseFontPx = 36;
    const scaledFontPx = Math.round(baseFontPx * settings.uiScale);
    const labelColor = settings.highContrastUi ? '#ffd8d8' : '#ff6644';
    const strokeThickness = settings.highContrastUi ? 6 : 5;

    // Center the warning banner within the VISIBLE camera viewport.
    const cx = x + width / 2;
    const cy = y + height / 2;

    // ── Dramatic entrance worthy of a boss ──
    // Screen-edge vignette darkening (danger is here)
    const vignette = this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0)
      .setScrollFactor(0).setDepth(149);
    // Dark banner background with red-tinted edges
    const bg = this.scene.add.rectangle(cx, cy, width, 80, 0x0a0000, 0)
      .setScrollFactor(0).setDepth(150);
    // Pulsing red glow line above and below the banner
    const glowTop = this.scene.add.rectangle(cx, cy - 40, width, 2, 0xff4422, 0)
      .setScrollFactor(0).setDepth(150);
    const glowBot = this.scene.add.rectangle(cx, cy + 40, width, 2, 0xff4422, 0)
      .setScrollFactor(0).setDepth(150);
    const label = this.scene.add.text(cx, cy, text, {
      fontFamily: 'monospace',
      fontSize: `${scaledFontPx}px`,
      color: labelColor,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151).setAlpha(0);

    const allTargets = [vignette, bg, glowTop, glowBot, label];
    (this.activeBossVfx ??= []).push(...allTargets);

    // Vignette darkens the edges
    this.scene.tweens.add({
      targets: vignette, alpha: 0.3, duration: 200,
    });
    // Banner slams in (fast, hard)
    this.scene.tweens.add({
      targets: bg, alpha: 0.8, duration: 150,
    });
    // Text scales from large to normal (impact feel)
    label.setScale(1.3);
    this.scene.tweens.add({
      targets: label, alpha: 1, scale: 1, duration: 250, ease: 'Back.easeOut',
    });
    // Red glow lines pulse
    this.scene.tweens.add({
      targets: [glowTop, glowBot], alpha: 0.8, duration: 200,
    });
    this.scene.tweens.add({
      targets: [glowTop, glowBot],
      alpha: { from: 0.8, to: 0.3 },
      duration: 400,
      delay: 200,
      yoyo: true,
      repeat: 1,
    });

    // Hold, then fade everything out
    this.scene.tweens.add({
      targets: allTargets,
      alpha: 0,
      delay: BALANCE.bossWarning.fadeOutDelayMs,
      duration: BALANCE.bossWarning.fadeOutDurationMs,
      onComplete: () => {
        allTargets.forEach(t => t.destroy());
        if (this.activeBossVfx) this.activeBossVfx = this.activeBossVfx.filter(o => !(allTargets as Phaser.GameObjects.GameObject[]).includes(o));
      },
    });
  }

  // ── Regular spawning ──

  private syncWaveDirectorFromTimeline(): void {
    const seg = getActiveWaveTimelineEntry(this.gameTimeSec);
    if (seg === this.lastWaveSeg) return;
    this.lastWaveSeg = seg;
    this.spawnInterval = seg.intervalSec * this.spawnIntervalMult;
    this.burstSize = seg.burstSize;
    this.directorEnemyKeys = [...seg.enemyKeys];
  }

  private getDirectorEnemyConfigs(): EnemyConfig[] {
    return getEnemyConfigsByKeys(this.directorEnemyKeys);
  }

  private beginRunWinFinale(playerX: number, playerY: number): void {
    if (this.runWinFinaleStarted) return;
    this.runWinFinaleStarted = true;
    this.regularSpawnsDisabled = true;

    for (const b of BOSSES) {
      if (b.key !== BALANCE.run.FINAL_BOSS_KEY) {
        this.spawnedBossKeys.add(b.key);
      }
    }

    this.clearNonBossEnemiesForFinale();

    const finalBoss = BOSSES.find(b => b.key === BALANCE.run.FINAL_BOSS_KEY);
    if (!finalBoss) return;
    if (this.spawnedBossKeys.has(BALANCE.run.FINAL_BOSS_KEY)) return;

    this.bossSpawnScheduled.add(BALANCE.run.FINAL_BOSS_KEY);
    this.spawnBoss(finalBoss, playerX, playerY);
  }

  /** Removes active non-boss enemies without kill XP (screen wipe for finale). */
  private clearNonBossEnemiesForFinale(): void {
    const enemies = this.pool.children.entries as Enemy[];
    for (const e of enemies) {
      if (!e.active) continue;
      if (e.isBoss()) continue;
      e.forceKill();
    }
  }

  private spawnBurst(playerX: number, playerY: number): void {
    if (this.regularSpawnsDisabled) return;
    if (this.spawnsPausedUntilRealMs > Date.now()) return;
    const availableTypes = this.getDirectorEnemyConfigs();
    if (availableTypes.length === 0) return;

    const camera = this.scene.cameras.main;

    for (let i = 0; i < this.burstSize; i++) {
      const config = this.pickWeightedEnemy(availableTypes);
      const pos = this.getSpawnPosition(camera, playerX, playerY);

      const count = config.packSize || 1;
      const rng = this.scene.getRunRng();
      for (let j = 0; j < count; j++) {
        const enemy = Enemy.acquireFromPool(this.pool, this.scene);
        if (!enemy) continue;
        // Pack scatter is a visual feel detail, but it's tied to enemy spawn
        // position which affects gameplay (aggro distances). Seed it.
        const scatter = j > 0 ? rng.int(-30, 30) : 0;
        enemy.spawn(pos.x + scatter, pos.y + scatter, config, this.gameTimeSec);

        // Post-Bell escalation — applied after spawn so it stacks on top of
        // the standard time-based HP scale instead of replacing it.
        const pb = this.getPostBellMultipliers();
        if (pb.enemyHpMul !== 1 || pb.enemySpeedMul !== 1) {
          enemy.applyPostBellScaling(pb.enemyHpMul, pb.enemySpeedMul);
        }
        // W2 Moor Road: run-scoped HP multiplier (buckie_pitstop +10%).
        if (this.enemyHpMultiplier !== 1) {
          enemy.applyPostBellScaling(this.enemyHpMultiplier, 1);
        }

        // Elite chance — base from BalanceConfig + kill-pressure nudge (decays).
        // eliteWeightMultiplier is applied last so W2 route picks can tilt
        // without losing the kill-pressure feel.
        const eliteChance = Math.min(
          0.24,
          (BALANCE.enemy.ELITE_SPAWN_CHANCE +
            this.killPressure * BALANCE.director.killPressureEliteBonusMax) *
            this.eliteWeightMultiplier,
        );
        if (this.gameTimeSec > BALANCE.enemy.ELITE_UNLOCK_SEC
            && config.behavior !== 'hazard'
            && config.packSize <= 1
            && rng.bool(eliteChance)) {
          enemy.markAsElite();
          const affix = pickEliteAffixId(config.behavior, rng);
          if (affix) enemy.applyEliteAffix(affix);
          const flashTint = affix ? ELITE_AFFIXES[affix].indicatorTint : 0xffdd44;
          const flash = this.scene.getStatusFxPool().acquireArc(pos.x + scatter, pos.y + scatter, 15, flashTint, 0.55);
          this.scene.tweens.add({
            targets: flash, scale: 2, alpha: 0, duration: 400,
            onComplete: () => { flash.setVisible(false); },
          });
        }
      }
    }
  }

  private getSpawnPosition(
    camera: Phaser.Cameras.Scene2D.Camera,
    playerX: number,
    playerY: number
  ): { x: number; y: number } {
    const buffer = ENEMIES.SPAWN_BUFFER;
    const z = Math.max(0.001, camera.zoom);
    const halfW = camera.width / (2 * z);
    const halfH = camera.height / (2 * z);

    const left = playerX - halfW - buffer;
    const right = playerX + halfW + buffer;
    const top = playerY - halfH - buffer;
    const bottom = playerY + halfH + buffer;

    // Spawn edge + position via seeded RNG — enemies appear from the same
    // compass directions at the same moments for a given seed, which is the
    // bulk of what makes a run "replayable" in the Balatro sense.
    const rng = this.scene.getRunRng();
    const edge = rng.int(0, 3);
    let x: number, y: number;

    switch (edge) {
      case 0: x = rng.float(left, right); y = top; break;
      case 1: x = rng.float(left, right); y = bottom; break;
      case 2: x = left; y = rng.float(top, bottom); break;
      default: x = right; y = rng.float(top, bottom); break;
    }

    x = Phaser.Math.Clamp(x, 0, GAME.WORLD_WIDTH);
    y = Phaser.Math.Clamp(y, 0, GAME.WORLD_HEIGHT);

    // If clamping pushed the position inside the visible area (player near world edge),
    // push it to the nearest world edge so enemies don't pop in on-screen
    const inViewX = Math.abs(x - playerX) < halfW;
    const inViewY = Math.abs(y - playerY) < halfH;
    if (inViewX && inViewY) {
      // Snap to the nearest world edge
      const distToLeft = x;
      const distToRight = GAME.WORLD_WIDTH - x;
      const distToTop = y;
      const distToBottom = GAME.WORLD_HEIGHT - y;
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      if (minDist === distToLeft) x = 0;
      else if (minDist === distToRight) x = GAME.WORLD_WIDTH;
      else if (minDist === distToTop) y = 0;
      else y = GAME.WORLD_HEIGHT;
    }

    return { x, y };
  }

  /** Pick an enemy type weighted by game time — newer enemies spawn more often.
   *  Biome modifiers (from the player's current region) multiply the base weights. */
  private pickWeightedEnemy(types: EnemyConfig[]): EnemyConfig {
    const biomeMods = this.getBiomeWeightMods();
    let totalWeight = 0;
    for (const t of types) {
      totalWeight += getSpawnWeight(t, this.gameTimeSec) * (biomeMods[t.key] ?? 1);
    }

    // Seeded so the same wave composition appears for a given seed.
    let roll = this.scene.getRunRng().next() * totalWeight;
    for (const t of types) {
      roll -= getSpawnWeight(t, this.gameTimeSec) * (biomeMods[t.key] ?? 1);
      if (roll <= 0) return t;
    }
    return types[types.length - 1];
  }

  /** Biome-driven spawn weight multipliers for the player's current biome.
   *  Returns an empty object when no biome is active (e.g., during tests). */
  private getBiomeWeightMods(): Readonly<Record<string, number>> {
    const id = this.scene.getCurrentBiomeId?.();
    if (!id) return {};
    return BIOMES[id].spawnWeightMods;
  }

  /** Post-Bell escalation multipliers, or neutral when the run hasn't crossed
   *  the Bell yet / the scene doesn't expose the hook (e.g., unit tests). */
  private getPostBellMultipliers(): PostBellMultipliers {
    const sec = this.scene.getSecondsPastBell?.();
    if (sec === undefined || sec <= 0) return NEUTRAL_POST_BELL;
    return computePostBellMultipliers(sec);
  }

  getEnemyGroup(): Phaser.GameObjects.Group { return this.pool; }
  getActiveCount(): number { return this.pool.countActive(true); }
  getGameTimeSec(): number { return this.gameTimeSec; }
  getSpawnTimerSec(): number { return this.spawnTimer; }
  getSpawnIntervalSec(): number { return this.spawnInterval; }
  getBurstSize(): number { return this.burstSize; }
  getSpawnedBossCount(): number { return this.spawnedBossKeys.size; }
  getBossScheduledCount(): number { return this.bossSpawnScheduled.size; }

  isBossActive(): boolean {
    const frame = Math.floor(this.gameTimeSec * 60);
    if (frame === this.bossCheckFrame) return this.bossActive;
    this.bossCheckFrame = frame;
    if (!this.bossActive) return false;
    const active = this.pool.children.entries as Enemy[];
    let found = false;
    for (let i = 0; i < active.length; i++) {
      if (active[i].active && (active[i] as Enemy).isBoss()) { found = true; break; }
    }
    this.bossActive = found;
    return this.bossActive;
  }

  /**
   * Why regular spawn bursts are not executing *right now* (telemetry).
   * Priority: PAUSED → RUN_FINALE → POOL_SATURATED → INTERVAL_WAIT → NO_TYPES_AVAILABLE.
   * Boss intro / active boss do not gate regular waves — omit from this signal.
   * Returns null when the director would fire a burst on the next evaluation (timer satisfied, types exist, pool has capacity).
   */
  getSpawnStallReason(): SpawnStallReason | null {
    const tm = this.scene.getTimeManager();
    if (tm.isGameplayPaused()) return 'PAUSED';
    if (this.regularSpawnsDisabled) return 'RUN_FINALE';
    if (this.pool.countActive(true) >= ENEMIES.MAX_ACTIVE) return 'POOL_SATURATED';
    if (this.spawnTimer < this.spawnInterval) return 'INTERVAL_WAIT';
    if (this.getDirectorEnemyConfigs().length === 0) return 'NO_TYPES_AVAILABLE';
    return null;
  }

  /**
   * Dev tooling: snap the run clock and refresh the wave director (no boss bookkeeping).
   * Use `applyResumeTime` when restoring a saved run.
   */
  timeTravelToSeconds(sec: number): void {
    this.gameTimeSec = Math.max(0, sec);
    this.syncWaveDirectorFromTimeline();
    this.spawnTimer = Math.min(this.spawnTimer, this.spawnInterval);
  }

  /**
   * Mid-run resume: clock + director + suppress boss intros that are already in the past.
   */
  applyResumeTime(sec: number, spawnedBossKeys?: string[]): void {
    this.gameTimeSec = Math.max(0, sec);
    this.syncWaveDirectorFromTimeline();
    this.spawnTimer = 0;
    this.spawnedBossKeys.clear();
    this.bossSpawnScheduled.clear();
    if (spawnedBossKeys !== undefined) {
      const validBossKeys = new Set(BOSSES.map((b) => b.key));
      for (const key of spawnedBossKeys) {
        if (validBossKeys.has(key)) this.spawnedBossKeys.add(key);
      }
    } else {
      for (const b of BOSSES) {
        if (b.spawnTimeSec <= sec) this.spawnedBossKeys.add(b.key);
      }
    }
    if (sec >= BALANCE.run.RUN_WIN_TIME_SEC) {
      this.runWinFinaleStarted = true;
      this.regularSpawnsDisabled = true;
      for (const b of BOSSES) {
        if (b.key !== BALANCE.run.FINAL_BOSS_KEY) {
          this.spawnedBossKeys.add(b.key);
        }
      }
    }
  }

  getSpawnedBossKeys(): string[] {
    return [...this.spawnedBossKeys];
  }

  /** Called when the player scores a kill — feeds short-lived elite pressure. */
  noteKillPressure(): void {
    this.killPressure = Math.min(1, this.killPressure + BALANCE.director.killPressurePerKill);
  }
}
