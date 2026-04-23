import * as Phaser from 'phaser';
import { XPGem } from '../entities/XPGem';
import { XP } from '../config';
import { audio } from './AudioSystem';
import { BALANCE } from '../core/BalanceConfig';
import { ISceneContext } from '../core/ISceneContext';
import { xpRequiredForLevel } from './xpCurve';

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
  /**
   * W2 Moor Road: multiplier applied to gem `value` at spawn time.
   * `stand_yer_ground` route sets 2 for 30s; reset to 1 on run reset.
   */
  private dropValueMultiplier: number = 1;

  /**
   * Post-cap echo cards — XP accumulated past MAX_LEVEL. When this buffer
   * crosses XP.ECHO_XP_THRESHOLD, an echo card draw is queued. Each XP
   * also still converts to overflow gold (both paid, intentional).
   */
  private postCapEchoBuffer: number = 0;
  private pendingEchoes: number = 0;
  private echoInProgress: boolean = false;

  /** Event emitter for level-up and post-cap echoReady. */
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
    this.dropValueMultiplier = 1;
    this.postCapEchoBuffer = 0;
    this.pendingEchoes = 0;
    this.echoInProgress = false;

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
      try { g.destroy(); } catch { /* ignore */ }
    }
    try { this.gemPool.clear(true, true); } catch { /* ignore */ }
  }

  /** Lightweight gem positions for dev auto-battler steering (no Phaser deps in consumer). */
  getGemPositionsForAutoBattle(): Array<{ x: number; y: number; active: boolean }> {
    return (this.gemPool.getChildren() as XPGem[]).map((g) => ({
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

    const scaled = Math.max(1, Math.round(value * this.dropValueMultiplier));
    gem.drop(x, y, scaled);
    this.events.emit('gemSpawned', x, y, scaled);
  }

  /**
   * W2 Moor Road: set the gem drop-value multiplier. Clamped to
   * [0.25, 5]. Caller is responsible for scheduling the reset.
   */
  setDropValueMultiplier(mult: number): void {
    this.dropValueMultiplier = Math.min(5, Math.max(0.25, mult));
  }

  /** Update magnet behavior and check collection.
   *  hpFraction: when < 0.15, pickup radius triples (XP magnet pulse) */
  update(playerX: number, playerY: number, pickupRadius: number, hpFraction: number = 1): void {
    // XP magnet pulse: triple pickup radius at critical HP
    if (hpFraction > 0 && hpFraction < BALANCE.xp.criticalHpMagnetThreshold) {
      pickupRadius *= BALANCE.xp.criticalHpMagnetMultiplier;
    }
    const gems = this.gemPool.getChildren() as XPGem[];
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

    if (this.currentLevel >= XP.MAX_LEVEL) {
      const gold = Math.max(1, Math.floor(value * XP.OVERFLOW_XP_TO_GOLD_RATIO));
      this.scene.grantXpOverflowGold?.(gold);
      this.scene.getSFXManager().tryPlay('xp_pickup', () => audio.playXPCollectImmediate());
      this.accumulateEcho(value);
      return;
    }

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

  /**
   * Accumulate post-cap XP into the echo buffer. When the buffer crosses
   * the threshold, an echo pick is queued. Emits `echoReady` at most once
   * per accumulation (extras stay queued for `processNextEcho`).
   */
  private accumulateEcho(xpValue: number): void {
    if (xpValue <= 0) return;
    this.postCapEchoBuffer += xpValue;
    while (this.postCapEchoBuffer >= XP.ECHO_XP_THRESHOLD) {
      this.postCapEchoBuffer -= XP.ECHO_XP_THRESHOLD;
      this.pendingEchoes++;
    }
    // Don't interrupt a level-up pick. Echoes only fire in the standalone
    // post-cap phase; during the lvl-30 transition the game should settle
    // before introducing the new card family.
    if (!this.echoInProgress && !this.levelUpInProgress && this.pendingEchoes > 0) {
      this.echoInProgress = true;
      this.pendingEchoes--;
      this.events.emit('echoReady');
    }
  }

  /** Called by GameScene after the player picks an echo card. */
  processNextEcho(): void {
    if (this.pendingEchoes > 0) {
      this.pendingEchoes--;
      this.events.emit('echoReady');
    } else {
      this.echoInProgress = false;
    }
  }

  hasPendingEchoes(): boolean {
    return this.pendingEchoes > 0;
  }

  /**
   * True while an echo card is currently being presented (on-screen + picking).
   * Turns false only after processNextEcho drains the queue. Callers should
   * check this (not hasPendingEchoes) to decide when to release the pause
   * token — a fresh echo may have been emitted synchronously during the
   * previous processNextEcho call.
   */
  isEchoInProgress(): boolean {
    return this.echoInProgress;
  }

  /** For tests + dev tools — expose the current buffer. */
  getPostCapEchoBuffer(): number {
    return this.postCapEchoBuffer;
  }

  /** Exponential XP curve */
  private calcXpRequired(level: number): number {
    return xpRequiredForLevel(level);
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
    const need = this.xpToNextLevel;
    if (need <= 0) return 1;
    return Math.min(1, this.currentXP / need);
  }
  getGemGroup(): Phaser.GameObjects.Group { return this.gemPool; }

  /**
   * Scripted XP (moor moments, etc.) — no gem spawn; respects XP multiplier
   * and the level-up queue the same way gem collection does.
   */
  grantBonusXp(amount: number): void {
    if (amount <= 0) return;
    const mul = this.scene.getPlayer()?.getXpMultiplier() ?? 1;
    const value = Math.ceil(amount * mul);
    if (this.currentLevel >= XP.MAX_LEVEL) {
      const gold = Math.max(1, Math.floor(value * XP.OVERFLOW_XP_TO_GOLD_RATIO));
      this.scene.grantXpOverflowGold?.(gold);
      this.scene.getSFXManager().tryPlay('xp_pickup', () => audio.playXPCollectImmediate());
      this.accumulateEcho(value);
      return;
    }
    this.currentXP += value;
    this.scene.getSFXManager().tryPlay('xp_pickup', () => audio.playXPCollectImmediate());

    while (this.currentXP >= this.xpToNextLevel && this.currentLevel < XP.MAX_LEVEL) {
      this.currentXP -= this.xpToNextLevel;
      this.currentLevel++;
      this.xpToNextLevel = this.calcXpRequired(this.currentLevel + 1);
      this.pendingLevelUps.push(this.currentLevel);
    }

    if (!this.levelUpInProgress && this.pendingLevelUps.length > 0) {
      this.levelUpInProgress = true;
      const next = this.pendingLevelUps.shift()!;
      this.events.emit('levelup', next);
    }
  }
}
