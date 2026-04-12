export class ScaledTimer {
  private remainingMs = 0;

  start(durationMs: number): void {
    this.remainingMs = Math.max(0, durationMs);
  }

  stop(): void {
    this.remainingMs = 0;
  }

  isActive(): boolean {
    return this.remainingMs > 0;
  }

  /** Advance the timer by deltaMs, scaled by timeScale (0 freezes).
   *  Negative or non-finite deltas are ignored so a corrupted frame never
   *  causes a countdown to tick backward into an arbitrarily-large future. */
  tick(deltaMs: number, timeScale: number): void {
    if (this.remainingMs <= 0) return;
    if (timeScale <= 0) return;
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    const scaled = deltaMs * timeScale;
    this.remainingMs = Math.max(0, this.remainingMs - scaled);
  }

  getRemainingMs(): number {
    return this.remainingMs;
  }
}
