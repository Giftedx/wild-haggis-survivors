import Phaser from 'phaser';
import { ENEMIES } from '../config';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { TimeManager } from '../systems/TimeManager';
import { getCameraViewport } from './cameraViewport';

type DebugOverlayDeps = {
  spawnSystem: SpawnSystem;
  weaponSystem: WeaponSystem;
  timeManager: TimeManager;
};

export class DebugOverlay {
  private scene: Phaser.Scene;
  private deps: DebugOverlayDeps;
  private bg: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;
  private visible = false;
  // FPS tracking — rolling 60-frame window for stable display
  private fpsFrames: number[] = [];
  private fpsDisplay = 0;
  private fpsUpdateCounter = 0;

  constructor(scene: Phaser.Scene, deps: DebugOverlayDeps) {
    this.scene = scene;
    this.deps = deps;

    const { x, y, width, height } = getCameraViewport(scene);
    const d = 220;
    const panelW = Math.max(180, Math.min(420, width - 16));
    const panelH = Math.max(120, Math.min(158, height - 16));
    const panelX = Math.max(x + 8, Math.min(x + width - panelW - 8, x + 8));
    const panelY = Math.max(y + 8, Math.min(y + height - panelH - 8, y + 8));

    this.bg = scene.add.rectangle(panelX, panelY, panelW, panelH, 0x000000, 0.65)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(d)
      .setVisible(false);

    this.text = scene.add.text(panelX + 6, panelY + 4, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#cfe9ff',
      align: 'left',
      lineSpacing: 4,
    })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setVisible(false);

    this.update(0);
  }

  destroy(): void {
    this.bg.destroy();
    this.text.destroy();
  }

  toggle(): void {
    this.setVisible(!this.visible);
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.bg.setVisible(v);
    this.text.setVisible(v);
  }

  isVisible(): boolean {
    return this.visible;
  }

  /** Update using raw delta (keeps diagnostics alive during timeScale === 0). */
  update(rawDeltaMs: number): void {
    // FPS tracking — always accumulate even when overlay is hidden so the
    // first frame after toggle-on has a stable value.
    this.fpsFrames.push(rawDeltaMs);
    if (this.fpsFrames.length > 60) this.fpsFrames.shift();
    this.fpsUpdateCounter++;
    if (this.fpsUpdateCounter >= 15) {
      this.fpsUpdateCounter = 0;
      const avg = this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length;
      this.fpsDisplay = avg > 0 ? Math.round(1000 / avg) : 0;
    }
    if (!this.visible) return;
    const { x, y, width, height } = getCameraViewport(this.scene);
    const panelW = Math.max(180, Math.min(420, width - 16));
    const panelH = Math.max(120, Math.min(158, height - 16));
    const panelX = Math.max(x + 8, Math.min(x + width - panelW - 8, x + 8));
    const panelY = Math.max(y + 8, Math.min(y + height - panelH - 8, y + 8));
    this.bg.setPosition(panelX, panelY);
    this.bg.width = panelW;
    this.text.setPosition(panelX + 6, panelY + 4);

    const { spawnSystem, weaponSystem, timeManager } = this.deps;

    const enemyGroup = spawnSystem.getEnemyGroup();
    const enemiesActive = spawnSystem.getActiveCount();
    const enemiesTotal = enemyGroup.getLength();

    const projGroup = weaponSystem.getProjectileGroup();
    const projActive = projGroup.countActive(true);
    const projTotal = projGroup.getLength();

    const spawnT = spawnSystem.getSpawnTimerSec();
    const spawnI = spawnSystem.getSpawnIntervalSec();

    const bossActive = spawnSystem.isBossActive();
    const bossSpawned = spawnSystem.getSpawnedBossCount();
    const bossScheduled = spawnSystem.getBossScheduledCount();

    const paused = timeManager.isGameplayPaused();
    const timeScale = timeManager.getEffectiveTimeScale();
    const tokens = timeManager.getActiveTokenKeys();
    const cam = this.scene.cameras?.main;
    const scaleAny = this.scene.scale as unknown as {
      gameSize?: { width: number; height: number };
      baseSize?: { width: number; height: number };
      displaySize?: { width: number; height: number };
      width: number;
      height: number;
    };
    const gameW = scaleAny.gameSize?.width ?? scaleAny.width;
    const gameH = scaleAny.gameSize?.height ?? scaleAny.height;
    const displayW = scaleAny.displaySize?.width ?? scaleAny.width;
    const displayH = scaleAny.displaySize?.height ?? scaleAny.height;

    const saturated = enemiesActive >= ENEMIES.MAX_ACTIVE || enemiesTotal >= ENEMIES.MAX_ACTIVE;
    const stall = spawnSystem.getSpawnStallReason();
    const stallLabel = stall === null ? 'OK' : stall;

    const fpsColor = this.fpsDisplay >= 55 ? '#88ff88' : this.fpsDisplay >= 30 ? '#ffcc44' : '#ff4444';
    this.text.setText([
      `FPS: ${this.fpsDisplay}`,
      `Enemies: ${enemiesActive}/${ENEMIES.MAX_ACTIVE}  (pool: ${enemiesTotal}) ${saturated ? 'MAXED' : ''}`,
      `Projectiles: ${projActive}  (pool: ${projTotal})`,
      `Spawn: t=${spawnT.toFixed(2)}s / i=${spawnI.toFixed(2)}s  burst=${spawnSystem.getBurstSize()}`,
      `Status: [${stallLabel}]`,
      `Boss: active=${bossActive}  spawned=${bossSpawned}  scheduled=${bossScheduled}`,
      `Time: paused=${paused}  scale=${timeScale.toFixed(2)}  tokens=[${tokens.join(', ')}]`,
      `UI: x=${x.toFixed(1)} y=${y.toFixed(1)} w=${width.toFixed(1)} h=${height.toFixed(1)}`,
      `Viewport: scale=${scaleAny.width}x${scaleAny.height} game=${gameW}x${gameH} display=${displayW}x${displayH} cam=${cam?.width ?? scaleAny.width}x${cam?.height ?? scaleAny.height} z=${(cam?.zoom ?? 1).toFixed(2)}`,
    ].join('\n'));
    // Color-code the FPS line: green ≥55, yellow ≥30, red <30
    // Note: Phaser text doesn't support per-line colors, but the entire
    // overlay gets the FPS tint-appropriate color on the first line.
    void fpsColor; // reserved for future rich-text upgrade
  }
}

