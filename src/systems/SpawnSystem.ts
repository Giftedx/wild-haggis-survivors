import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { ENEMIES, GAME } from '../config';
import { getAvailableEnemyTypes, getSpawnWeight, EnemyConfig, BOSSES, BossConfig } from '../data/enemies';
import { audio } from './AudioSystem';

/**
 * SpawnSystem — manages enemy object pool, wave spawning, and boss spawns.
 */
export class SpawnSystem {
  private pool: Phaser.GameObjects.Group;
  private scene: Phaser.Scene;
  private spawnTimer: number = 0;
  private gameTimeSec: number = 0;
  private spawnInterval: number = 1.5;
  private burstSize: number = 2;

  /** Track which bosses have already spawned */
  private spawnedBossKeys: Set<string> = new Set();
  /** Cached boss-active flag — avoids iterating 400 enemies per frame */
  private bossActive: boolean = false;
  private bossCheckFrame: number = -1;

  /** Emits 'bossWarning' and 'bossKilled' events */
  readonly events = new Phaser.Events.EventEmitter();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.pool = scene.add.group({
      classType: Enemy,
      maxSize: ENEMIES.MAX_ACTIVE,
      runChildUpdate: false,
    });

    for (let i = 0; i < 100; i++) {
      this.pool.add(new Enemy(scene, 0, 0));
    }
  }

  update(delta: number, playerX: number, playerY: number): void {
    this.gameTimeSec += delta / 1000;
    this.spawnTimer += delta / 1000;

    this.updateDifficulty();
    this.checkBossSpawns(playerX, playerY);

    if (this.spawnTimer >= this.spawnInterval) {
      // Carry over small overshoots for accurate rate, but cap to prevent
      // burst-spawning after lag spikes
      this.spawnTimer = Math.min(this.spawnTimer - this.spawnInterval, this.spawnInterval);
      this.spawnBurst(playerX, playerY);
    }

    const active = this.pool.getChildren() as Enemy[];
    for (let i = 0; i < active.length; i++) {
      if (active[i].active) active[i].chaseTarget(playerX, playerY, delta);
    }
  }

  // ── Boss spawning ──

  private checkBossSpawns(playerX: number, playerY: number): void {
    for (const boss of BOSSES) {
      if (this.spawnedBossKeys.has(boss.key)) continue;
      if (this.gameTimeSec >= boss.spawnTimeSec) {
        this.spawnedBossKeys.add(boss.key);
        this.spawnBoss(boss, playerX, playerY);
      }
    }
  }

  private spawnBoss(boss: BossConfig, _playerX: number, _playerY: number): void {
    // Show warning banner
    this.showBossWarning(boss.warningText);

    // Spawn after the warning fades — use CURRENT player position, not the
    // stale coordinates from 1.5 seconds ago when the warning started
    this.scene.time.delayedCall(1500, () => {
      const gameScene = this.scene as any;
      const player = gameScene.getPlayer?.();
      const currentX = player?.x ?? _playerX;
      const currentY = player?.y ?? _playerY;
      const camera = this.scene.cameras.main;
      const pos = this.getSpawnPosition(camera, currentX, currentY);

      let enemy = this.pool.getFirstDead(false) as Enemy | null;
      if (!enemy) {
        if (this.pool.countActive(true) >= ENEMIES.MAX_ACTIVE) return;
        enemy = new Enemy(this.scene, 0, 0);
        this.pool.add(enemy);
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

      // Pass gameTimeSec=0 so boss HP isn't double-scaled — BOSSES data
      // already defines HP balanced for each boss's spawn time.
      enemy.spawn(pos.x, pos.y, bossAsConfig, 0);
      enemy.setScale(boss.scale);
      enemy.setBaseTint(0xff4444);
      enemy.markAsBoss();
      this.bossActive = true;

      // Dramatic entrance — camera zoom pulse + shake
      const cam = this.scene.cameras.main;
      cam.shake(400, 0.015);

      // Brief zoom-in then back out
      const originalZoom = cam.zoom;
      this.scene.tweens.add({
        targets: cam,
        zoom: originalZoom * 1.15,
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeOut',
      });

      // Dark vignette flash
      const { width, height } = this.scene.scale;
      const vig = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3)
        .setScrollFactor(0).setDepth(45);
      this.scene.tweens.add({
        targets: vig, alpha: 0, duration: 800,
        onComplete: () => vig.destroy(),
      });
    });
  }

  private showBossWarning(text: string): void {
    audio.playBossWarning();
    const { width, height } = this.scene.scale;

    const bg = this.scene.add.rectangle(width / 2, height / 2, width, 60, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(150);
    const label = this.scene.add.text(width / 2, height / 2, text, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);

    // Flash and fade
    this.scene.tweens.add({
      targets: [bg, label],
      alpha: { from: 0, to: 1 },
      duration: 300,
      yoyo: true,
      hold: 900,
      onComplete: () => { bg.destroy(); label.destroy(); },
    });
  }

  // ── Regular spawning ──

  private updateDifficulty(): void {
    this.spawnInterval = Math.max(0.3, 1.5 - this.gameTimeSec * 0.002);
    this.burstSize = Math.min(15, Math.floor(2 + Math.log2(1 + this.gameTimeSec / 30)));
  }

  private spawnBurst(playerX: number, playerY: number): void {
    const availableTypes = getAvailableEnemyTypes(this.gameTimeSec);
    if (availableTypes.length === 0) return;

    const camera = this.scene.cameras.main;

    for (let i = 0; i < this.burstSize; i++) {
      const config = this.pickWeightedEnemy(availableTypes);
      const pos = this.getSpawnPosition(camera, playerX, playerY);

      const count = config.packSize || 1;
      for (let j = 0; j < count; j++) {
        let enemy = this.pool.getFirstDead(false) as Enemy | null;
        if (!enemy) {
          if (this.pool.countActive(true) >= ENEMIES.MAX_ACTIVE) continue;
          enemy = new Enemy(this.scene, 0, 0);
          this.pool.add(enemy);
        }
        const scatter = j > 0 ? Phaser.Math.Between(-30, 30) : 0;
        enemy.spawn(pos.x + scatter, pos.y + scatter, config, this.gameTimeSec);

        // Elite chance: 10% after 2 minutes, not on hazards or swarm packs
        if (this.gameTimeSec > 120 && config.behavior !== 'hazard' &&
            config.packSize <= 1 && Math.random() < 0.10) {
          enemy.markAsElite();
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
    const halfW = camera.width / (2 * camera.zoom);
    const halfH = camera.height / (2 * camera.zoom);

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

  isBossActive(): boolean {
    const frame = Math.floor(this.gameTimeSec * 60);
    if (frame === this.bossCheckFrame) return this.bossActive;
    this.bossCheckFrame = frame;
    if (!this.bossActive) return false;
    const active = this.pool.getChildren() as Enemy[];
    let found = false;
    for (let i = 0; i < active.length; i++) {
      if (active[i].active && (active[i] as Enemy).isBoss()) { found = true; break; }
    }
    this.bossActive = found;
    return this.bossActive;
  }
}
