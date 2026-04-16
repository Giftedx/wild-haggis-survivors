/**
 * RunActState — plain data holder for the per-run act state introduced by
 * W2 (Moor Road). Tracks the current act, when it started, and the history
 * of picker choices the player has made this run. Mirrors the RunScoreState
 * pattern — public fields, simple mutators, one `reset()`.
 */
import type { RoutePick } from '../../data/routes';

export class RunActState {
  /** Current act (1, 2, or 3). 3 ends at the victory bell — no picker fires. */
  currentAct: 1 | 2 | 3 = 1;
  /** Game-time seconds at which the current act started. 0 at run start. */
  actStartTimeSec = 0;
  /** Ordered picker history this run — one entry per picker resolved. */
  pickerHistory: RoutePick[] = [];

  /** Zero every field back to a fresh-run state. */
  reset(): void {
    this.currentAct = 1;
    this.actStartTimeSec = 0;
    this.pickerHistory = [];
  }
}
