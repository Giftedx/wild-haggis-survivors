import Phaser from 'phaser';
import { ENEMIES } from '../config';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { TimeManager } from '../systems/TimeManager';

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

  constructor(scene: Phaser.Scene, deps: DebugOverlayDeps) {
    this.scene = scene;
    this.deps = deps;

    const { width } = scene.scale;
    const d = 220;

    this.bg = scene.add.rectangle(8, 8, Math.min(420, width - 16), 158, 0x000000, 0.65)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(d)
      .setVisible(false);

    this.text = scene.add.text(14, 12, '', {
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
  update(_rawDeltaMs: number): void {
    if (!this.visible) return;

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

    const saturated = enemiesActive >= ENEMIES.MAX_ACTIVE || enemiesTotal >= ENEMIES.MAX_ACTIVE;
    const stall = spawnSystem.getSpawnStallReason();
    const stallLabel = stall === null ? 'OK' : stall;

    this.text.setText([
      `Enemies: ${enemiesActive}/${ENEMIES.MAX_ACTIVE}  (pool: ${enemiesTotal}) ${saturated ? 'MAXED' : ''}`,
      `Projectiles: ${projActive}  (pool: ${projTotal})`,
      `Spawn: t=${spawnT.toFixed(2)}s / i=${spawnI.toFixed(2)}s  burst=${spawnSystem.getBurstSize()}`,
      `Status: [${stallLabel}]`,
      `Boss: active=${bossActive}  spawned=${bossSpawned}  scheduled=${bossScheduled}`,
      `Time: paused=${paused}  scale=${timeScale.toFixed(2)}  tokens=[${tokens.join(', ')}]`,
    ].join('\n'));
  }
}

