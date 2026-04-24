/**
 * Hidden event — faint cairn revealed on player proximity.
 *
 * Pure resolver picks between 'relic' (primary reward) and
 * 'lore_fragment' (consolation when a relic would duplicate). Scene is
 * responsible for calling `RelicSystem.rollDrop('hidden_node', rng)`
 * when the resolver returns 'relic'; if that returns null (all relics
 * already held), scene can fall through to lore_fragment.
 */
import type { NodeDef } from '../../data/nodeTypes';
import type { RNG } from '../../utils/rng';
import { readStringArray, type HiddenRewardKind, type HiddenSpec } from './types';

const LORE_FALLBACK: HiddenRewardKind = 'lore_fragment';

export function resolveHiddenEvent(node: NodeDef, rng: RNG): HiddenSpec {
  if (node.type !== 'hidden') {
    throw new Error(`resolveHiddenEvent: node ${node.key} is not a hidden (got ${node.type})`);
  }
  const pool = readStringArray(node.data, 'rewardPool');
  if (pool.length === 0) {
    return { kind: LORE_FALLBACK };
  }
  const pick = rng.pick(pool);
  if (pick === 'rare_relic') return { kind: 'relic' };
  return { kind: 'lore_fragment', rewardKey: pick };
}
