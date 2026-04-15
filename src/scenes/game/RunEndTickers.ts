/**
 * Three wall-clock (raw delta) tickers that fire overlay transitions near
 * the end of a run. Kept on raw time because `RUN_END` pauses physics /
 * sets timeScale to 0 — scaled timers would never fire, and
 * `scene.time.delayedCall` respects timeScale.
 *
 * - `victoryDefer` — the Taxman died but a LEVEL_UP modal is active;
 *   hold the victory ceremony until the modal closes.
 * - `deathResultOverlay` — death-screen fade-in before the GameOver scene.
 * - `victoryResultOverlay` — victory-screen fade-in before the GameOver scene.
 */
export class RunEndTickers {
  private victoryDeferMs = 0;
  private onVictoryDefer: (() => void) | null = null;

  private deathResultRemainingMs: number | null = null;
  private deathResultCallback: (() => void) | null = null;

  private victoryResultRemainingMs: number | null = null;
  private victoryResultCallback: (() => void) | null = null;

  tick(rawDelta: number): void {
    this.tickVictoryDefer(rawDelta);
    this.tickDeathResultOverlay(rawDelta);
    this.tickVictoryResultOverlay(rawDelta);
  }

  /** Schedule a victory-defer fire `ms` from now. Overwrites any pending defer. */
  armVictoryDefer(ms: number, onFire: () => void): void {
    this.victoryDeferMs = ms;
    this.onVictoryDefer = onFire;
  }

  armDeathResultOverlay(ms: number | null, cb: (() => void) | null): void {
    this.deathResultRemainingMs = ms;
    this.deathResultCallback = cb;
  }

  armVictoryResultOverlay(ms: number | null, cb: (() => void) | null): void {
    this.victoryResultRemainingMs = ms;
    this.victoryResultCallback = cb;
  }

  reset(): void {
    this.victoryDeferMs = 0;
    this.onVictoryDefer = null;
    this.deathResultRemainingMs = null;
    this.deathResultCallback = null;
    this.victoryResultRemainingMs = null;
    this.victoryResultCallback = null;
  }

  private tickVictoryDefer(rawDelta: number): void {
    if (this.victoryDeferMs <= 0) return;
    this.victoryDeferMs -= rawDelta;
    if (this.victoryDeferMs <= 0) {
      this.victoryDeferMs = 0;
      const cb = this.onVictoryDefer;
      this.onVictoryDefer = null;
      cb?.();
    }
  }

  private tickDeathResultOverlay(rawDelta: number): void {
    if (this.deathResultRemainingMs === null || this.deathResultCallback === null) return;
    this.deathResultRemainingMs -= rawDelta;
    if (this.deathResultRemainingMs <= 0) {
      const cb = this.deathResultCallback;
      this.deathResultRemainingMs = null;
      this.deathResultCallback = null;
      cb();
    }
  }

  private tickVictoryResultOverlay(rawDelta: number): void {
    if (this.victoryResultRemainingMs === null || this.victoryResultCallback === null) return;
    this.victoryResultRemainingMs -= rawDelta;
    if (this.victoryResultRemainingMs <= 0) {
      const cb = this.victoryResultCallback;
      this.victoryResultRemainingMs = null;
      this.victoryResultCallback = null;
      cb();
    }
  }
}
