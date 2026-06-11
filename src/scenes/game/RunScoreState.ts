/**
 * RunScoreState — single data object for the per-run counters that
 * used to live as 9 scattered fields on GameScene. Collapsing them
 * lets the systems that read/mutate them (EnemyKillHandler,
 * RunPersistenceBridge, RunExitComposer) take one hook —
 * `getRunScore()` — instead of 6–14 getters/setters each.
 *
 * Fields are public by design; this is a plain data holder, not an
 * API boundary. Convenience mutators are provided for the common
 * cases (increment / add / mark) because they compose more cleanly
 * at call sites than `runScore.x++`.
 */

export class RunScoreState {
  /** Total enemy kills this run (includes bosses + elites). */
  killCount = 0;
  /** Boss kills this run. Subset of killCount. */
  bossKillCount = 0;
  /** Gold earned from boss defeats (scales with boss xpValue × 2). */
  bossGoldEarned = 0;
  /** Gold earned from regular kills + pickups + milestone rewards. */
  coinGoldEarned = 0;
  /**
   * Gold spent mid-run (W2 node trader purchases).
   * Monotonic: accumulates across a run, reset only at run start.
   * Run-end gold reward subtracts this so mid-run spends don't double-count.
   */
  coinGoldSpent = 0;
  /** Latched true after the first kill of the run (fires `first_blood` banter once). */
  firstKillSeen = false;
  /** Count of elite kills inside the current back-to-back chain window. */
  eliteChainCount = 0;
  /** Game-time of the last qualifying elite kill; null when no chain is active. */
  eliteChainLastGameSec: number | null = null;
  /** True while the victory-sequence timer is queued. Gates duplicate run-end triggers. */
  victoryPending = false;
  /** Monotonic generation counter — invalidates stale victory-delay callbacks on scene restart. */
  victoryDelayGen = 0;

  /**
   * Optional notifier fired immediately after `incrementKillCount`
   * bumps the counter. Wired from `GameScene` to drive the W71 Phase 2
   * mantle-tier transitions. Intentionally a single callback (not an
   * event emitter) — only one consumer expected.
   */
  onKillsChanged?: (kills: number) => void;

  /** Zero every counter back to a fresh-run state. */
  reset(): void {
    this.killCount = 0;
    this.bossKillCount = 0;
    this.bossGoldEarned = 0;
    this.coinGoldEarned = 0;
    this.coinGoldSpent = 0;
    this.firstKillSeen = false;
    this.eliteChainCount = 0;
    this.eliteChainLastGameSec = null;
    this.victoryPending = false;
    this.victoryDelayGen = 0;
    this.goldGainMultiplier = 1;
  }

  incrementKillCount(): void {
    this.killCount++;
    this.onKillsChanged?.(this.killCount);
  }

  incrementBossKillCount(): void {
    this.bossKillCount++;
  }

  /**
   * U1 M4 — gold-gain multiplier folded at deposit time. Used by the
   * Edinburgh Rune (`gold_mult`) so every coin source — kill drops,
   * milestones, elite chains, boss gold, XP overflow — composes the
   * rune bonus once. GameScene refreshes this each frame via
   * `setGoldGainMultiplier` so transitions in/out of the rune's
   * condition are felt immediately.
   *
   * Identity (1) by default; clamped to >= 0 so a buggy negative mult
   * can't subtract gold the player legitimately earned.
   */
  private goldGainMultiplier = 1;

  setGoldGainMultiplier(mul: number): void {
    this.goldGainMultiplier = Math.max(0, Number.isFinite(mul) ? mul : 1);
  }

  addCoinGold(n: number): void {
    if (n <= 0) {
      this.coinGoldEarned += n;
      return;
    }
    if (this.goldGainMultiplier === 1) {
      this.coinGoldEarned += n;
      return;
    }
    // Round up so a 1.25x mul on small drops still feels rewarding.
    this.coinGoldEarned += Math.max(1, Math.ceil(n * this.goldGainMultiplier));
  }

  addBossGold(n: number): void {
    this.bossGoldEarned += n;
  }

  /**
   * Current spendable gold = earned (coin + boss) minus spent.
   * Guarded to never report negative even if a save blob is corrupt.
   */
  getGoldBalance(): number {
    return Math.max(0, this.coinGoldEarned + this.bossGoldEarned - this.coinGoldSpent);
  }

  /**
   * Attempt to spend `n` gold. Returns true and increments `coinGoldSpent`
   * when the balance covers it; returns false (no-op) otherwise. Callers
   * should treat `false` as "transaction refused" and leave the reward
   * un-applied.
   */
  spendCoinGold(n: number): boolean {
    if (n <= 0) return false;
    if (this.getGoldBalance() < n) return false;
    this.coinGoldSpent += n;
    return true;
  }

  markFirstKillSeen(): void {
    this.firstKillSeen = true;
  }

  /** Advance the victory-delay generation and return the new value. */
  nextVictoryDelayGen(): number {
    return ++this.victoryDelayGen;
  }
}
