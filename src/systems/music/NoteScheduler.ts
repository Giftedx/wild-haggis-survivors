/**
 * Lookahead note scheduler — replaces setTimeout/setInterval with
 * the Web Audio spec's recommended pattern.
 *
 * Ticked from the game loop. Looks 100ms ahead and schedules notes
 * using audioContext.currentTime for sample-accurate timing.
 */
export class NoteScheduler {
  private readonly SCHEDULE_AHEAD = 0.1;

  private nextMelodyTime: number = 0;
  private nextRhythmTime: number = 0;
  private nextHeartbeatTime: number = 0;

  private melodyCallback: ((time: number) => number) | null = null;
  private rhythmCallback: ((time: number) => number) | null = null;
  private heartbeatCallback: ((time: number) => number) | null = null;

  setMelodyCallback(cb: (time: number) => number): void {
    this.melodyCallback = cb;
  }

  setRhythmCallback(cb: (time: number) => number): void {
    this.rhythmCallback = cb;
  }

  setHeartbeatCallback(cb: (time: number) => number): void {
    this.heartbeatCallback = cb;
  }

  start(now: number): void {
    this.nextMelodyTime = now + 0.3; // short delay, then first note
    this.nextRhythmTime = now;
    this.nextHeartbeatTime = now;
  }

  tick(now: number): void {
    // Clamp to `now` (not `now - 0.1`) so notes missed during tab-background
    // are skipped cleanly rather than scheduled into the past. Oscillators
    // told to start() before ctx.currentTime fire immediately but any gain
    // envelope setValueAtTime at past times is effectively lost — the note
    // plays at zero amplitude. Skipping is the cleaner recovery.
    this.nextMelodyTime = Math.max(this.nextMelodyTime, now);
    this.nextRhythmTime = Math.max(this.nextRhythmTime, now);
    this.nextHeartbeatTime = Math.max(this.nextHeartbeatTime, now);

    const horizon = now + this.SCHEDULE_AHEAD;

    if (this.melodyCallback) {
      while (this.nextMelodyTime < horizon) {
        const interval = this.melodyCallback(this.nextMelodyTime);
        this.nextMelodyTime += Math.max(0.1, interval);
      }
    }

    if (this.rhythmCallback) {
      while (this.nextRhythmTime < horizon) {
        const interval = this.rhythmCallback(this.nextRhythmTime);
        this.nextRhythmTime += Math.max(0.05, interval);
      }
    }

    if (this.heartbeatCallback) {
      while (this.nextHeartbeatTime < horizon) {
        const interval = this.heartbeatCallback(this.nextHeartbeatTime);
        this.nextHeartbeatTime += Math.max(0.1, interval);
      }
    }
  }

  reset(): void {
    this.nextMelodyTime = 0;
    this.nextRhythmTime = 0;
    this.nextHeartbeatTime = 0;
  }
}
