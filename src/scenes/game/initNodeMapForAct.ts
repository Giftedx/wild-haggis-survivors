/**
 * initNodeMapForAct — rolls (or restores) the per-act node-map for Moor
 * Road and pushes it into the runtime systems.
 *
 * Extracted from GameScene to keep the scene class lean. Behaviour is
 * preserved one-for-one:
 *
 *   1. Honour the one-shot `suppressNextNodeMapRoll` flag — when the
 *      resume hydrate has just rebuilt the rolled map from the IRunState
 *      snapshot, reuse it instead of re-rolling. The flag clears after
 *      a single hit so subsequent act-3 stretch transitions still roll
 *      fresh banks. The flag is cleared in BOTH branches (suppressed +
 *      not-matching) so a stale flag never persists past one call.
 *   2. Pick the act bank — `getAct3Bank(stretch)` for act 3, otherwise
 *      `getActBank(act)`.
 *   3. Branch the run RNG, generate the node path, place node positions
 *      with a 1000-unit separation inside a 40-unit world margin.
 *   4. Build the state via `buildNodeMapState`, write it into runActState,
 *      reset `currentNodeIndex` to 0, push into both `nodeMapSystem` and
 *      `nodeMarkerSystem`.
 *
 * Phaser-import-free except for the scene typed as `Phaser.Scene` for
 * `nodeMarkerSystem.setMap(scene, state)`. Sibling pattern is the
 * Option A getter/setter dep bag — see `nodeMapLifecycle.ts`.
 */
import type Phaser from 'phaser';
import { GAME } from '../../config';
import {
  type NodeMapSystem,
  buildNodeMapState,
  generateNodePath,
  placeNodes,
} from '../../systems/NodeMapSystem';
import type { NodeMarkerSystem } from '../../systems/NodeMarkerSystem';
import { getActBank, getAct3Bank, type Act3Stretch } from '../../data/nodeBanks';
import type { RunActState } from './RunActState';
import type { RNG } from '../../utils/rng';

/**
 * Inputs to {@link initNodeMapForAct}. Getter/setter pattern lets the
 * helper read live state from GameScene without holding a direct ref to
 * the scene class — keeps the helper testable and the scene
 * encapsulation honest.
 */
export interface InitNodeMapForActDeps {
  /** Phaser scene the marker system anchors against. */
  scene: Phaser.Scene;
  /** Read the one-shot resume flag. */
  getSuppressNextNodeMapRoll: () => boolean;
  /** Clear (or set) the one-shot flag. Called with `false` in both branches. */
  setSuppressNextNodeMapRoll: (v: boolean) => void;
  /** Run-act state — read for the previously-restored map, written with the
   *  newly-rolled map and reset `currentNodeIndex`. */
  runActState: RunActState;
  /** System container that holds the active node-map. */
  nodeMapSystem: NodeMapSystem;
  /** Renders the node markers in world-space; signature is `(scene, state)`. */
  nodeMarkerSystem: NodeMarkerSystem;
  /** Run-scoped seeded RNG — branched twice (path + placement). */
  runRng: RNG;
  /** Player position used as the placement origin. */
  player: { x: number; y: number };
}

/**
 * Roll (or restore) the node-map for the given act/stretch and push it
 * into the runtime systems. Side-effect-only — returns void.
 */
export function initNodeMapForAct(
  deps: InitNodeMapForActDeps,
  act: 1 | 2 | 3,
  stretch: Act3Stretch = 1,
): void {
  // T101 — when the resume hydrate just rebuilt the rolled map from
  // the IRunState snapshot, reuse it instead of re-rolling. The flag
  // is one-shot so later act-3 stretch transitions still roll fresh
  // banks normally.
  if (deps.getSuppressNextNodeMapRoll()) {
    deps.setSuppressNextNodeMapRoll(false);
    const restored = deps.runActState.currentActNodeMap;
    if (restored && restored.act === act && restored.nodes.length > 0) {
      deps.nodeMapSystem.setMap(restored);
      deps.nodeMarkerSystem.setMap(deps.scene, restored);
      return;
    }
  }
  const bank = act === 3 ? getAct3Bank(stretch) : getActBank(act);
  const rng = deps.runRng.branch();
  const nodes = generateNodePath(bank, act, rng);
  const origin = { x: deps.player.x, y: deps.player.y };
  const positions = placeNodes(nodes.length, origin, rng.branch(), {
    separation: 1000,
    worldBounds: {
      minX: 40,
      minY: 40,
      maxX: GAME.WORLD_WIDTH - 40,
      maxY: GAME.WORLD_HEIGHT - 40,
    },
  });
  const state = buildNodeMapState(act, nodes, positions);
  deps.runActState.currentActNodeMap = state;
  deps.runActState.currentNodeIndex = 0;
  deps.nodeMapSystem.setMap(state);
  deps.nodeMarkerSystem.setMap(deps.scene, state);
}
