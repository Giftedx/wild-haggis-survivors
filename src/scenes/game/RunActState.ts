/**
 * RunActState — plain data holder for the per-run act state introduced by
 * W2 (Moor Road). Tracks the current act, when it started, and the history
 * of picker choices the player has made this run. Mirrors the RunScoreState
 * pattern — public fields, simple mutators, one `reset()`.
 *
 * M1 extension: also holds the generated per-act node map + cursor + the
 * append-only log of resolved node outcomes. The map reference is assigned
 * at act start; `NodeMapSystem` owns read/write of `visited`.
 */
import type { RoutePick } from '../../data/routes';
import type { NodeOutcome } from '../../data/nodeTypes';
import type { NodeMapState } from '../../systems/NodeMapSystem';

export class RunActState {
  /** Current act (1, 2, or 3). 3 ends at the victory bell — no picker fires. */
  currentAct: 1 | 2 | 3 = 1;
  /** Game-time seconds at which the current act started. 0 at run start. */
  actStartTimeSec = 0;
  /** Ordered picker history this run — one entry per picker resolved. */
  pickerHistory: RoutePick[] = [];

  /** Generated node map for the current act. Null until an act's path is rolled. */
  currentActNodeMap: NodeMapState | null = null;
  /** Cursor into `currentActNodeMap.nodes`. Reset per-act. */
  currentNodeIndex = 0;
  /** Ordered log of every resolved node outcome this run (all acts). */
  nodeOutcomes: NodeOutcome[] = [];

  /** Transition to a new act. Caller supplies the game-time at which the act started. */
  advanceToAct(act: 1 | 2 | 3, gameTimeSec: number): void {
    if (act !== 1 && act !== 2 && act !== 3) {
      throw new Error(`RunActState.advanceToAct: act must be 1, 2, or 3 (got ${act})`);
    }
    this.currentAct = act;
    this.actStartTimeSec = gameTimeSec;
  }

  /** Append a resolved picker result to the history. */
  recordPick(pick: RoutePick): void {
    this.pickerHistory.push(pick);
  }

  /** Append a resolved node outcome to the log. */
  recordNodeOutcome(outcome: NodeOutcome): void {
    this.nodeOutcomes.push(outcome);
  }

  /** Zero every field back to a fresh-run state. */
  reset(): void {
    this.currentAct = 1;
    this.actStartTimeSec = 0;
    this.pickerHistory = [];
    this.currentActNodeMap = null;
    this.currentNodeIndex = 0;
    this.nodeOutcomes = [];
  }
}
