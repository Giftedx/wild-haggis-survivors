/**
 * Rest event — partial heal + a free reroll token.
 *
 * Pure resolver just reads the NodeDef defaults; scene applies heal +
 * reroll + plays the hearth animation on trigger.
 */
import type { NodeDef } from '../../data/nodeTypes';
import { readNumber, type RestSpec } from './types';

const DEFAULT_HEAL_RATIO = 0.3;
const DEFAULT_REROLL_TOKENS = 1;

export function resolveRestEvent(node: NodeDef): RestSpec {
  if (node.type !== 'rest') {
    throw new Error(`resolveRestEvent: node ${node.key} is not a rest (got ${node.type})`);
  }
  const healRatio = Math.max(0, Math.min(1, readNumber(node.data, 'healRatio', DEFAULT_HEAL_RATIO)));
  const rerollTokens = Math.max(0, Math.floor(readNumber(node.data, 'rerollTokens', DEFAULT_REROLL_TOKENS)));
  return { healRatio, rerollTokens };
}
