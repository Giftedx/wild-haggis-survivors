/**
 * NodeMapSystem — per-run moor-road node-path generation + placement.
 *
 * This file currently exposes the *pure* generation and placement
 * helpers. The class shell (scene tick, proximity detection, event
 * routing) lands in M2 once `RunActState` carries node-map state and
 * the UI widget consumes the path.
 *
 * Determinism is the contract: given the same bank + act + RNG seed,
 * `generateNodePath` + `placeNodes` must produce byte-identical output.
 * The replay-v3 blob (M4) records node outcomes, not the path itself —
 * the path reconstructs from the run seed alone.
 */
import type { NodeDef } from '../data/nodeTypes';
import type { RNG } from '../utils/rng';

export type Act = 1 | 2 | 3;

export interface WorldBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Snapshot of a generated per-act node path plus its in-run visit state.
 * Immutable fields (act, nodes, worldPositions) are frozen at generation
 * time; `visited` mutates as the player clears nodes. `NodeMapSystem`
 * owns reads/writes; `RunActState` holds the reference.
 */
export interface NodeMapState {
  readonly act: Act;
  readonly nodes: readonly NodeDef[];
  readonly worldPositions: readonly Position[];
  visited: boolean[];
}

/** Build a fresh NodeMapState from generated nodes + positions. */
export function buildNodeMapState(
  act: Act,
  nodes: readonly NodeDef[],
  worldPositions: readonly Position[],
): NodeMapState {
  if (nodes.length !== worldPositions.length) {
    throw new Error(
      `buildNodeMapState: nodes.length (${nodes.length}) !== worldPositions.length (${worldPositions.length})`,
    );
  }
  return {
    act,
    nodes,
    worldPositions,
    visited: new Array(nodes.length).fill(false),
  };
}

// ----------------------------------------------------------------------------
// Path generation
// ----------------------------------------------------------------------------

interface GenerateOpts {
  /** Fix the node count. Default: rng.int(3, 5). */
  readonly nodeCount?: number;
}

/**
 * Roll a 3–5 node path from `bank` filtered to `act`, honouring:
 *   • ≥1 encounter (guaranteed first slot)
 *   • ≤1 elite
 *   • bargain and rest are mutually exclusive per path
 *   • no duplicate node keys within a path
 *
 * Selection is weighted by `NodeDef.weightInBank`. Deterministic for a
 * given RNG seed.
 */
export function generateNodePath(
  bank: readonly NodeDef[],
  act: Act,
  rng: RNG,
  opts: GenerateOpts = {},
): NodeDef[] {
  if (bank.length === 0) {
    throw new Error('generateNodePath: bank is empty');
  }

  const eligible = bank.filter((n) => n.actAffinity.includes(act));
  const encounters = eligible.filter((n) => n.type === 'encounter');
  if (encounters.length === 0) {
    throw new Error(`generateNodePath: no encounter nodes eligible for act ${act}`);
  }

  const count = opts.nodeCount ?? rng.int(3, 5);
  const picks: NodeDef[] = [];
  const pool: NodeDef[] = [...eligible];

  // Reserve slot 0 for a weighted encounter pick so the ≥1 encounter
  // constraint is structural, not luck-dependent.
  const firstEncounter = rng.weighted(encounters, (n) => n.weightInBank);
  picks.push(firstEncounter);
  removeFromPool(pool, firstEncounter);

  let elitePicked = false;
  let mutexTaken: 'bargain' | 'rest' | null = null;

  while (picks.length < count && pool.length > 0) {
    const filtered = pool.filter((n) => {
      if (n.type === 'elite' && elitePicked) return false;
      if (n.type === 'bargain' && mutexTaken === 'rest') return false;
      if (n.type === 'rest' && mutexTaken === 'bargain') return false;
      return true;
    });
    if (filtered.length === 0) break;

    const pick = rng.weighted(filtered, (n) => n.weightInBank);
    picks.push(pick);
    removeFromPool(pool, pick);

    if (pick.type === 'elite') elitePicked = true;
    if (pick.type === 'bargain') mutexTaken = 'bargain';
    if (pick.type === 'rest') mutexTaken = 'rest';
  }

  return picks;
}

function removeFromPool(pool: NodeDef[], node: NodeDef): void {
  const idx = pool.findIndex((n) => n.key === node.key);
  if (idx >= 0) pool.splice(idx, 1);
}

// ----------------------------------------------------------------------------
// Placement
// ----------------------------------------------------------------------------

interface PlaceOpts {
  /** Target edge-to-edge distance between adjacent nodes. Default 1000. */
  readonly separation?: number;
  /** Optional world clamp so nodes never spawn off-map. */
  readonly worldBounds?: WorldBounds;
}

const DEFAULT_SEPARATION = 1000;
const PLACEMENT_JITTER = 100;

/**
 * Lay out `count` node positions starting from `origin`, each separated
 * from the previous by roughly `separation` pixels at a random angle.
 * Deterministic given the RNG seed; walks like a heather trail rather
 * than a grid so the path reads as organic.
 *
 * If `worldBounds` is supplied, positions clamp to the rect — long-
 * separation placements may pile up at a corner, but they stay playable.
 */
export function placeNodes(
  count: number,
  origin: Position,
  rng: RNG,
  opts: PlaceOpts = {},
): Position[] {
  const separation = opts.separation ?? DEFAULT_SEPARATION;
  const positions: Position[] = [];
  let current: Position = { x: origin.x, y: origin.y };
  for (let i = 0; i < count; i++) {
    const angle = rng.float(0, Math.PI * 2);
    const dist = separation + rng.float(-PLACEMENT_JITTER, PLACEMENT_JITTER);
    let next: Position = {
      x: current.x + Math.cos(angle) * dist,
      y: current.y + Math.sin(angle) * dist,
    };
    if (opts.worldBounds) {
      next = clampPosition(next, opts.worldBounds);
    }
    positions.push(next);
    current = next;
  }
  return positions;
}

export function clampPosition(pos: Position, bounds: WorldBounds): Position {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, pos.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, pos.y)),
  };
}

// ----------------------------------------------------------------------------
// Proximity
// ----------------------------------------------------------------------------

/** Default radius in which the player "reaches" a node and triggers it. */
export const NODE_TRIGGER_RADIUS_PX = 80;

export interface NearestNodeResult {
  readonly index: number;
  readonly distance: number;
}

/**
 * Find the nearest un-visited node within `triggerRadius` of `playerPos`.
 * Returns `null` if no eligible node is in range. Pure — no scene coupling.
 *
 * Ties broken by index order (first un-visited wins) so the path reads in
 * sequence even if two nodes happen to cluster within jitter range.
 */
export function findTriggerableNode(
  state: NodeMapState,
  playerPos: Position,
  triggerRadius: number = NODE_TRIGGER_RADIUS_PX,
): NearestNodeResult | null {
  const r2 = triggerRadius * triggerRadius;
  let best: NearestNodeResult | null = null;
  for (let i = 0; i < state.nodes.length; i++) {
    if (state.visited[i]) continue;
    const pos = state.worldPositions[i];
    const dx = pos.x - playerPos.x;
    const dy = pos.y - playerPos.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > r2) continue;
    if (best === null || d2 < best.distance * best.distance) {
      best = { index: i, distance: Math.sqrt(d2) };
    }
  }
  return best;
}

/**
 * Pointer from `playerPos` toward the next un-visited node. Returns null
 * when every node has been visited. Angle in radians, `[-π, π]`.
 */
export function directionToNextNode(
  state: NodeMapState,
  playerPos: Position,
): { angle: number; distance: number; targetIndex: number } | null {
  const nextIndex = state.visited.findIndex((v) => !v);
  if (nextIndex < 0) return null;
  const target = state.worldPositions[nextIndex];
  const dx = target.x - playerPos.x;
  const dy = target.y - playerPos.y;
  return {
    angle: Math.atan2(dy, dx),
    distance: Math.sqrt(dx * dx + dy * dy),
    targetIndex: nextIndex,
  };
}

// ----------------------------------------------------------------------------
// System class — per-run orchestrator
// ----------------------------------------------------------------------------

export type NodeTriggerListener = (index: number, state: NodeMapState) => void;

/**
 * NodeMapSystem — holds the active map for the current act and fires a
 * listener when the player walks within trigger range of an un-visited
 * node. Scene owns the active state; this class stays headless so unit
 * tests drive it without Phaser.
 *
 * Lifecycle per act:
 *   1. `setMap(state)` at act start — typically right after `RunActState.
 *      advanceToAct` + `NodeMapSystem` generator output
 *   2. Scene calls `tick(playerPos)` each frame
 *   3. On trigger, listener fires, scene resolves the event, scene calls
 *      `markVisited(index, outcome)` when the event completes
 */
export class NodeMapSystem {
  private state: NodeMapState | null = null;
  private listener: NodeTriggerListener | null = null;
  private triggerRadius: number = NODE_TRIGGER_RADIUS_PX;

  setMap(state: NodeMapState | null): void {
    this.state = state;
  }

  getMap(): NodeMapState | null {
    return this.state;
  }

  setTriggerListener(listener: NodeTriggerListener | null): void {
    this.listener = listener;
  }

  setTriggerRadius(px: number): void {
    this.triggerRadius = px;
  }

  /** Called each frame with the player's world position. Fires listener on entry. */
  tick(playerPos: Position): void {
    if (!this.state || !this.listener) return;
    const hit = findTriggerableNode(this.state, playerPos, this.triggerRadius);
    if (hit === null) return;
    this.listener(hit.index, this.state);
  }

  /** Marks the node at `index` as visited — callers pair this with a NodeOutcome log entry. */
  markVisited(index: number): void {
    if (!this.state) return;
    if (index < 0 || index >= this.state.visited.length) return;
    this.state.visited[index] = true;
  }

  reset(): void {
    this.state = null;
    this.listener = null;
    this.triggerRadius = NODE_TRIGGER_RADIUS_PX;
  }
}
