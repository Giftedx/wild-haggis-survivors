/**
 * Wee Trader event — roll a mid-run merchant's stock.
 *
 * Pure resolver generates a 3-item offer mixing a relic-placeholder + a
 * passive-placeholder + a reroll token, priced in gold. Scene UI shows
 * the offer and accepts gold in exchange for the item.
 *
 * Note: resolver produces *placeholders* for relic/passive keys; the
 * scene is responsible for swapping in a real RelicKey (via RelicSystem
 * .rollDrop) or a passive item-key when the player accepts. This keeps
 * the resolver headless (no cross-system imports).
 */
import type { NodeDef } from '../../data/nodeTypes';
import type { RNG } from '../../utils/rng';
import { readNumber, type TraderSpec, type TraderStockItem } from './types';

const DEFAULT_STOCK_ROLL = 3;

const RELIC_PRICE_RANGE = [80, 160] as const;
const PASSIVE_PRICE_RANGE = [50, 110] as const;
const REROLL_PRICE_RANGE = [30, 60] as const;

export function resolveWeeTraderEvent(node: NodeDef, rng: RNG): TraderSpec {
  if (node.type !== 'wee_trader') {
    throw new Error(`resolveWeeTraderEvent: node ${node.key} is not a wee_trader (got ${node.type})`);
  }
  const stockSize = Math.max(1, Math.floor(readNumber(node.data, 'stockRoll', DEFAULT_STOCK_ROLL)));
  const items: TraderStockItem[] = [];
  // Fixed composition for the first three slots so every trader offers
  // at least one of each category; extra slots beyond 3 roll their kind.
  const kinds: TraderStockItem['kind'][] = ['relic', 'passive', 'reroll'];
  for (let i = 0; i < stockSize; i++) {
    const kind = i < kinds.length ? kinds[i] : rng.pick(kinds);
    const [min, max] =
      kind === 'relic'
        ? RELIC_PRICE_RANGE
        : kind === 'passive'
          ? PASSIVE_PRICE_RANGE
          : REROLL_PRICE_RANGE;
    items.push({ kind, key: `${kind}:placeholder`, priceGold: rng.int(min, max) });
  }
  return { items };
}
