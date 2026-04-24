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
