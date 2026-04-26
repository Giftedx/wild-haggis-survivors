/**
 * T401 — node-visit lifecycle helpers extracted from GameScene.
 *
 * `finalizeNodeVisit` and `peekReplayChoiceFor` were ~50 LOC of branchy
 * scene-state coordination buried in the GameScene class. They aren't
 * Phaser-shaped — every dependency is plain JS state — so lifting them
 * here lets the caller stay narrow + the helper stay unit-testable
 * without booting a scene.
 *
 * Wire contract:
 *  - `markVisitedAndAdvance` records the outcome on `runActState`,
 *    notifies the replay recorder + consumes any matching playback
 *    outcome, then walks `currentNodeIndex` past contiguously visited
 *    nodes (a passive node finalizing in the middle of a chain shouldn't
 *    leave the cursor on its slot).
 *  - `peekReplayChoiceFor` returns the recorded reward key when in
 *    playback mode AND the next outcome matches; logs + returns null
 *    on mismatch (live prompt opens) so the live path doesn't silently
 *    diverge from the recorded run.
 *
 * Dependencies use narrow interface types so the helper does not import
 * `NodeMapSystem` or `SpawnSystem` (both Phaser-flavoured) — see test
 * file for fakes that satisfy each interface in <10 lines.
 */
import type { NodeOutcome } from '../../data/nodeTypes';
import type { RunActState } from './RunActState';
import type { ReplayRecorder } from '../../replay/ReplayRecorder';
import type { ReplayInput } from '../../replay/ReplayInput';

/** Minimal contract for the per-frame node visit ledger. */
export interface NodeVisitMarker {
  markVisited(index: number): void;
}

/** Minimal contract for the wall-clock source GameScene threads through. */
export interface NodeVisitClock {
  getGameTimeSec(): number;
}

export interface NodeVisitDeps {
  nodeMap: NodeVisitMarker;
  runActState: RunActState;
  replayRecorder: ReplayRecorder | null;
  replayInput: ReplayInput | null;
  clock: NodeVisitClock;
}

/**
 * Mark a node as visited and propagate the outcome through every system
 * that needs to know. Mutates: `nodeMap.markVisited`, `runActState`
 * (records outcome + advances `currentNodeIndex`), `replayRecorder`
 * (pushes outcome), `replayInput` (consumes outcome if it matches).
 *
 * Pure-by-shape: every side effect is on an injected dep.
 */
export function finalizeNodeVisit(
  deps: NodeVisitDeps,
  index: number,
  nodeKey: string,
  chosenRewardKey?: string,
): void {
  deps.nodeMap.markVisited(index);
  const outcome: NodeOutcome = {
    nodeKey,
    ...(chosenRewardKey ? { chosenRewardKey } : {}),
    visitedAtGameTimeSec: deps.clock.getGameTimeSec(),
  };
  deps.runActState.recordNodeOutcome(outcome);
  deps.replayRecorder?.pushNodeOutcome(outcome);
  // M1 F5 — playback consumes the matching recorded outcome so the
  // cursor stays aligned with node-trigger order. Passive finalizes
  // and early-outs ('empty_pool' / 'no_stock') consume too, so the
  // next interactive node sees its own outcome.
  if (deps.replayInput) {
    const next = deps.replayInput.peekNextNodeOutcome();
    if (next && next.nodeKey === nodeKey) {
      deps.replayInput.consumeNodeOutcome();
    }
  }
  const map = deps.runActState.currentActNodeMap;
  if (!map) return;
  while (
    deps.runActState.currentNodeIndex < map.nodes.length
    && map.visited[deps.runActState.currentNodeIndex]
  ) {
    deps.runActState.currentNodeIndex++;
  }
}

/**
 * M1 F5 — peek at the next recorded outcome and return its
 * `chosenRewardKey` when it matches `nodeKey`, else `null`.
 *
 * Returns `null` outside playback or when the queue is empty. On a key
 * mismatch logs a `console.warn` and returns `null` so the live prompt
 * opens — the operator sees that the recording diverged without the
 * scene crashing.
 */
export function peekReplayChoiceFor(
  replayInput: ReplayInput | null,
  nodeKey: string,
): string | null {
  if (!replayInput) return null;
  const outcome = replayInput.peekNextNodeOutcome();
  if (!outcome) return null;
  if (outcome.nodeKey !== nodeKey) {
    console.warn(
      `[replay] node-outcome mismatch: expected ${outcome.nodeKey}, got ${nodeKey} — opening live prompt`,
    );
    return null;
  }
  return outcome.chosenRewardKey ?? null;
}
