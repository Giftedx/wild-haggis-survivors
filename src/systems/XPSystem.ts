import Phaser from 'phaser';
import { XPGem } from '../entities/XPGem';
import { XP } from '../config';
import { audio } from './AudioSystem';
import { BALANCE } from '../core/BalanceConfig';

/**
 * XPSystem — manages XP gem pool, collection, and level-up triggers.
 *
 * When XP bar fills, emits a 'levelup' event that the scene listens to
 * for pausing and showing upgrade cards.
 */
export class XPSystem {
  private scene: Phaser.Scene;
  private gemPool: Phaser.GameObjects.Group;

  private currentXP: number = 0;
  private currentLevel: number = 1;
  private xpToNextLevel: number;

  /** Event emitter for level-up */
  readonly events = new Phaser.Events.EventEmitter();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.xpToNextLevel = this.calcXpRequired(2);

    // Create gem pool
    this.gemPool = scene.add.group({
      classType: XPGem,
      maxSize: BALANCE.xp.gemPoolMax,
      runChildUpdate: false,
    });

    // Pre-populate
    for (let i = 0; i < BALANCE.xp.gemPrewarm; i++) {
      this.gemPool.add(new XPGem(scene));
    }
  }

  /** Reset all run-scoped XP state (used by destroy and cross-run invariants). */
  resetRunState(): void {
    this.currentXP = 0;
    this.currentLevel = 1;
    this.xpToNextLevel = this.calcXpRequired(2);
    this.pendingLevelUps = [];
    this.levelUpInProgress = false;

    // Deactivate all gems so no orphaned pickups bleed into the next run.
    const gems = this.gemPool.getChildren() as XPGem[];
    for (const g of gems) {
      if (g.active) g.collect();
    }

    this.events.removeAllListeners();
  }

  destroy(): void {
    this.resetRunState();
    const gems = this.gemPool.getChildren() as XPGem[];
    for (const g of gems) {
      try { (g as any).destroy?.(); } catch { /* ignore */ }
    }
    try { (this.gemPool as any).clear?.(true, true); } catch { /* ignore */ }
  }

  /** Spawn a gem at a position (called when an enemy dies) */
  spawnGem(x: number, y: number, value: number): void {
    // Don't spawn gems after max level — they'd be meaningless clutter
    if (this.currentLevel >= XP.MAX_LEVEL) return;

    let gem = this.gemPool.getFirstDead(false) as XPGem | null;

    if (!gem) {
      if (this.gemPool.getLength() >= BALANCE.xp.gemPoolMax) return;
      gem = new XPGem(this.scene);
      this.gemPool.add(gem);
    }

    gem.drop(x, y, value);
  }

  /** Update magnet behavior and check collection.
   *  hpFraction: when < 0.15, pickup radius triples (XP magnet pulse) */
  update(playerX: number, playerY: number, pickupRadius: number, hpFraction: number = 1): void {
    // XP magnet pulse: triple pickup radius at critical HP
    if (hpFraction > 0 && hpFraction < BALANCE.xp.criticalHpMagnetThreshold) {
      pickupRadius *= BALANCE.xp.criticalHpMagnetMultiplier;
    }
    const gems = this.gemPool.getChildren() as XPGem[];
    for (const gem of gems) {
      if (!gem.active) continue;

      gem.updateMagnet(playerX, playerY, pickupRadius);

      // Check if close enough to collect
      const dist = Phaser.Math.Distance.Between(gem.x, gem.y, playerX, playerY);
      if (dist < BALANCE.xp.collectDistancePx) {
        this.collectGem(gem);
      }
    }
  }

  /** Queue of pending level-ups (emitted one at a time to avoid clobbering the UI) */
  private pendingLevelUps: number[] = [];
  private levelUpInProgress: boolean = false;

  private collectGem(gem: XPGem): void {
    const value = gem.collect();
    this.currentXP += value;
    audio.playXPCollect();

    // Queue all pending level-ups
    while (this.currentXP >= this.xpToNextLevel && this.currentLevel < XP.MAX_LEVEL) {
      this.currentXP -= this.xpToNextLevel;
      this.currentLevel++;
      this.xpToNextLevel = this.calcXpRequired(this.currentLevel + 1);
      this.pendingLevelUps.push(this.currentLevel);
    }

    // Only emit if no level-up is currently in progress (prevents double-fire from same frame)
    if (!this.levelUpInProgress && this.pendingLevelUps.length > 0) {
      this.levelUpInProgress = true;
      const next = this.pendingLevelUps.shift()!;
      this.events.emit('levelup', next);
    }
  }

  /** Called by GameScene after the player picks an upgrade card */
  processNextLevelUp(): void {
    if (this.pendingLevelUps.length > 0) {
      const next = this.pendingLevelUps.shift()!;
      this.events.emit('levelup', next);
    } else {
      this.levelUpInProgress = false;
    }
  }

  hasPendingLevelUps(): boolean {
    return this.pendingLevelUps.length > 0;
  }

  /** Exponential XP curve */
  private calcXpRequired(level: number): number {
    return Math.ceil(XP.BASE_REQUIREMENT * Math.pow(XP.SCALING_FACTOR, level - 2));
  }

  /** Vacuum all gems toward the player instantly (called on level-up) */
  vacuumAllGems(): void {
    const gems = this.gemPool.getChildren() as XPGem[];
    for (const gem of gems) {
      if (gem.active) {
        gem.forceCollect();
      }
    }
  }

  getCurrentXP(): number { return this.currentXP; }
  getXPToNext(): number { return this.xpToNextLevel; }
  getLevel(): number { return this.currentLevel; }
  getXPFraction(): number {
    if (this.currentLevel >= XP.MAX_LEVEL) return 1; // Full bar at max level
    return Math.min(1, this.currentXP / this.xpToNextLevel);
  }
  getGemGroup(): Phaser.GameObjects.Group { return this.gemPool; }
}
