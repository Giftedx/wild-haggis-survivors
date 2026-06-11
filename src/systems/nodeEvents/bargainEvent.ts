/**
 * Bargain event — HP for a boon.
 *
 * Pure resolver computes the HP cost from `hpCostRatio × maxHp` and
 * rolls an offer from the node's offerPool. Scene UI shows the trade,
 * player accepts or refuses, scene applies HP damage + grants the boon
 * on accept; refusal still counts as a visit (node marks visited).
 */
import type { NodeDef } from '../../data/nodeTypes';
import type { RNG } from '../../utils/rng';
import {
  readNumber,
  readStringArray,
  type BargainOfferKind,
  type BargainSpec,
} from './types';

const DEFAULT_HP_COST_RATIO = 0.15;
const DEFAULT_OFFER_POOL: readonly string[] = ['rare_relic'];

export function resolveBargainEvent(
  node: NodeDef,
  rng: RNG,
  maxHp: number,
): BargainSpec {
  if (node.type !== 'bargain') {
    throw new Error(`resolveBargainEvent: node ${node.key} is not a bargain (got ${node.type})`);
  }
  const ratio = readNumber(node.data, 'hpCostRatio', DEFAULT_HP_COST_RATIO);
  const hpCost = Math.max(1, Math.floor(maxHp * ratio));
  const pool = readStringArray(node.data, 'offerPool');
  const offerKey = pool.length > 0 ? rng.pick(pool) : rng.pick(DEFAULT_OFFER_POOL);
  return {
    hpCost,
    offerKind: classifyOffer(offerKey),
    offerKey,
  };
}

function classifyOffer(key: string): BargainOfferKind {
  if (key === 'rare_relic' || key === 'relic') return 'relic';
  if (key === 'weapon_upgrade_token') return 'weapon_upgrade_token';
  return 'buff_run';
}
