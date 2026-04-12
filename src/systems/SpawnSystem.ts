import Phaser from 'phaser';
import type { SettingsManager } from '../core/SettingsManager';
import { getSettingsManager } from '../core/SettingsManager';
import { tryCameraShake } from '../utils/cameraShake';
import { Enemy } from '../entities/Enemy';
import { ENEMIES, GAME } from '../config';
import { getEnemyConfigsByKeys, getSpawnWeight, EnemyConfig, BOSSES, BossConfig } from '../data/enemies';
import { BALANCE, getActiveWaveTimelineEntry } from '../core/BalanceConfig';
import { audio } from './AudioSystem';
import { ISceneContext } from '../core/ISceneContext';
import { getCameraViewport } from '../ui/cameraViewport';
import { t } from '../core/i18n';

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
  /** When true, `spawnBurst` is a no-op (final boss phase). */
  private regularSpawnsDisabled: boolean = false;
  /** Set when a boss is ready to spawn but physics is paused (level-up / manual pause).
   *  The next unpaused update() tick will flush and clear it. */
  private pendingBossSpawn: (() => void) | null = null;
  private bossCheckFrame: number = -1;

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
    this.spawnInterval = init.intervalSec;
    this.burstSize = init.burstSize;
    this.directorEnemyKeys = [...init.enemyKeys];
    this.lastWaveSeg = init;
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
    this.spawnInterval = init.intervalSec;
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
    this.events.removeAllListeners();

    const enemies = this.pool.children.entries as Enemy[];
    for (const e of enemies) {
      if (e.active) {
        try { (e as any).destroy?.(); } catch { /* ignore */ }
        // Best-effort deactivate for pool implementations
        (e as any).active = false;
        (e as any).visible = false;
      }
    }
  }

  destroy(): void {
    this.resetRunState();
    try { (this.pool as any).clear?.(true, true); } catch { /* ignore */ }
  }

  update(delta: number, playerX: number, playerY: number): void {
    this.gameTimeSec += delta / 1000;
    this.spawnTimer += delta / 1000;

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

    const active = this.pool.children.entries as Enemy[];
    for (let i = 0; i < active.length; i++) {
      if (active[i].active) active[i].chaseTarget(playerX, playerY, delta);
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
    this.showBossWarning(t(boss.warningKey));

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
      this.scene.tweens.add({
        targets: vig, alpha: 0, duration: 800,
        onComplete: () => vig.destroy(),
      });
    };

    // Spawn after the warning fades — use CURRENT player position, not the
    // stale coordinates from 1.5 seconds ago when the warning started.
    // Raw timer lives outside physics/timeScale; if the player is paused
    // mid-level-up, defer the spawn work to the next unpaused update() tick.
    this.scene.getUpdateTickers().addOnce('raw', 1500, () => {
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
      delay: 1200,
      duration: 400,
      onComplete: () => allTargets.forEach(t => t.destroy()),
    });
  }

  // ── Regular spawning ──

  private syncWaveDirectorFromTimeline(): void {
    const seg = getActiveWaveTimelineEntry(this.gameTimeSec);
    if (seg === this.lastWaveSeg) return;
    this.lastWaveSeg = seg;
    this.spawnInterval = seg.intervalSec;
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
    const availableTypes = this.getDirectorEnemyConfigs();
    if (availableTypes.length === 0) return;

    const camera = this.scene.cameras.main;

    for (let i = 0; i < this.burstSize; i++) {
      const config = this.pickWeightedEnemy(availableTypes);
      const pos = this.getSpawnPosition(camera, playerX, playerY);

      const count = config.packSize || 1;
      for (let j = 0; j < count; j++) {
        const enemy = Enemy.acquireFromPool(this.pool, this.scene);
        if (!enemy) continue;
        const scatter = j > 0 ? Phaser.Math.Between(-30, 30) : 0;
        enemy.spawn(pos.x + scatter, pos.y + scatter, config, this.gameTimeSec);

        // Elite chance: BALANCE.enemy.ELITE_SPAWN_CHANCE after ELITE_UNLOCK_SEC,
        // never on hazards or swarm packs. Tuning lives in BalanceConfig so
        // the gameplay feel matches what the HUD advertises.
        if (this.gameTimeSec > BALANCE.enemy.ELITE_UNLOCK_SEC
            && config.behavior !== 'hazard'
            && config.packSize <= 1
            && Math.random() < BALANCE.enemy.ELITE_SPAWN_CHANCE) {
          enemy.markAsElite();
          // Golden flash at spawn position to warn player
          const flash = this.scene.getStatusFxPool().acquireArc(pos.x + scatter, pos.y + scatter, 15, 0xffdd44, 0.5);
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

    const edge = Phaser.Math.Between(0, 3);
    let x: number, y: number;

    switch (edge) {
      case 0: x = Phaser.Math.FloatBetween(left, right); y = top; break;
      case 1: x = Phaser.Math.FloatBetween(left, right); y = bottom; break;
      case 2: x = left; y = Phaser.Math.FloatBetween(top, bottom); break;
      default: x = right; y = Phaser.Math.FloatBetween(top, bottom); break;
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

  /** Pick an enemy type weighted by game time — newer enemies spawn more often */
  private pickWeightedEnemy(types: EnemyConfig[]): EnemyConfig {
    let totalWeight = 0;
    for (const t of types) {
      totalWeight += getSpawnWeight(t, this.gameTimeSec);
    }

    let roll = Math.random() * totalWeight;
    for (const t of types) {
      roll -= getSpawnWeight(t, this.gameTimeSec);
      if (roll <= 0) return t;
    }
    return types[types.length - 1];
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
}
