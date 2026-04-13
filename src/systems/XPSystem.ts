import Phaser from 'phaser';
import { XPGem } from '../entities/XPGem';
import { XP } from '../config';
import { audio } from './AudioSystem';
import { BALANCE } from '../core/BalanceConfig';
import { ISceneContext } from '../core/ISceneContext';

/**
 * XPSystem — manages XP gem pool, collection, and level-up triggers.
 *
 * When XP bar fills, emits a 'levelup' event that the scene listens to
 * for pausing and showing upgrade cards.
 */
export class XPSystem {
  private scene: Phaser.Scene & ISceneContext;
  private gemPool: Phaser.GameObjects.Group;

  private currentXP: number = 0;
  private currentLevel: number = 1;
  private xpToNextLevel: number;

  /** Event emitter for level-up */
  readonly events = new Phaser.Events.EventEmitter();

  constructor(scene: Phaser.Scene & ISceneContext) {
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
    const gems = this.gemPool.children.entries as XPGem[];
    for (const g of gems) {
      if (g.active) g.collect();
    }

    this.events.removeAllListeners();
  }

  destroy(): void {
    this.resetRunState();
    const gems = this.gemPool.children.entries as XPGem[];
    for (const g of gems) {
      try { (g as any).destroy?.(); } catch { /* ignore */ }
    }
    try { (this.gemPool as any).clear?.(true, true); } catch { /* ignore */ }
  }

  /** Lightweight gem positions for dev auto-battler steering (no Phaser deps in consumer). */
  getGemPositionsForAutoBattle(): Array<{ x: number; y: number; active: boolean }> {
    return (this.gemPool.children.entries as XPGem[]).map((g) => ({
      x: g.x,
      y: g.y,
      active: g.active,
    }));
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
    this.events.emit('gemSpawned', x, y, value);
  }

  /** Update magnet behavior and check collection.
   *  hpFraction: when < 0.15, pickup radius triples (XP magnet pulse) */
  update(playerX: number, playerY: number, pickupRadius: number, hpFraction: number = 1): void {
    // XP magnet pulse: triple pickup radius at critical HP
    if (hpFraction > 0 && hpFraction < BALANCE.xp.criticalHpMagnetThreshold) {
      pickupRadius *= BALANCE.xp.criticalHpMagnetMultiplier;
    }
    const gems = this.gemPool.children.entries as XPGem[];
    // Squared-distance gate for the collect ring — sqrt would fire per gem
    // per frame for ~200 gems just to compare against a constant radius.
    const collectDistSq = BALANCE.xp.collectDistancePx * BALANCE.xp.collectDistancePx;
    for (const gem of gems) {
      if (!gem.active) continue;

      gem.updateMagnet(playerX, playerY, pickupRadius);

      const dx = playerX - gem.x;
      const dy = playerY - gem.y;
      if (dx * dx + dy * dy < collectDistSq) {
        this.collectGem(gem);
      }
    }
  }

  /** Queue of pending level-ups (emitted one at a time to avoid clobbering the UI) */
  private pendingLevelUps: number[] = [];
  private levelUpInProgress: boolean = false;

  private collectGem(gem: XPGem): void {
    const rawValue = gem.collect();
    // Heather Bloom biome bumps gem value slightly (1.1×). Integer XP values
    // feel more authored than fractions — round up so players never feel
    // cheated by a truncation.
    const biomeMul = this.scene.getPlayer()?.getBiomeXpMultiplier?.() ?? 1;
    const value = biomeMul === 1 ? rawValue : Math.ceil(rawValue * biomeMul);
    this.currentXP += value;
    this.scene.getSFXManager().tryPlay('xp_pickup', () => audio.playXPCollectImmediate());

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
    const gems = this.gemPool.children.entries as XPGem[];
    for (const gem of gems) {
      if (gem.active) {
        gem.forceCollect();
      }
    }
  }

  /** Restore bar + level without emitting `levelup` (mid-run resume). */
  hydrateRunState(level: number, currentXp: number): void {
    const L = Math.max(1, Math.min(XP.MAX_LEVEL, Math.floor(level)));
    this.currentLevel = L;
    this.currentXP = Math.max(0, Math.floor(currentXp));
    this.pendingLevelUps = [];
    this.levelUpInProgress = false;
    this.xpToNextLevel = L >= XP.MAX_LEVEL ? 1 : this.calcXpRequired(L + 1);
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
