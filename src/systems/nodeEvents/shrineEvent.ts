/**
 * Shrine event — 3 buff candidates, 60s duration.
 *
 * Pure resolver rolls 3 unique keys from the NodeDef's buffPool.
 * Caller opens UI, player picks one, scene applies the chosen buff
 * for `durationMs` and marks the node visited.
 */
import type { NodeDef } from '../../data/nodeTypes';
import type { RNG } from '../../utils/rng';
import {
  readNumber,
  readStringArray,
  type ShrineBuffCandidate,
  type ShrineSpec,
} from './types';

const DEFAULT_DURATION_MS = 60_000;
const CANDIDATE_COUNT = 3;

export function resolveShrineEvent(node: NodeDef, rng: RNG): ShrineSpec {
  if (node.type !== 'shrine') {
    throw new Error(`resolveShrineEvent: node ${node.key} is not a shrine (got ${node.type})`);
  }
  const pool = readStringArray(node.data, 'buffPool');
  const picked = pickUnique(pool, CANDIDATE_COUNT, rng);
  const candidates: ShrineBuffCandidate[] = picked.map((key) => ({ key }));
  return {
    candidates,
    durationMs: readNumber(node.data, 'durationMs', DEFAULT_DURATION_MS),
  };
}

function pickUnique(pool: readonly string[], count: number, rng: RNG): string[] {
  if (pool.length <= count) return [...pool];
  const remaining = [...pool];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = rng.int(0, remaining.length - 1);
    out.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return out;
}
