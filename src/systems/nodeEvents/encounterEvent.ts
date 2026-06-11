/**
 * Encounter event — scripted wave-pulse at a node position.
 *
 * Pure resolver: reads the NodeDef's enemyMix + durationMs, applies
 * sane defaults, returns a spec the scene passes to SpawnSystem.
 */
import type { NodeDef } from '../../data/nodeTypes';
import { readNumber, type EncounterEnemyMix, type EncounterSpec } from './types';

const DEFAULT_DURATION_MS = 75_000;

export function resolveEncounterEvent(node: NodeDef): EncounterSpec {
  if (node.type !== 'encounter') {
    throw new Error(`resolveEncounterEvent: node ${node.key} is not an encounter (got ${node.type})`);
  }
  const rawMix = (node.data.enemyMix as unknown) ?? [];
  const mix: EncounterEnemyMix[] = [];
  if (Array.isArray(rawMix)) {
    for (const entry of rawMix) {
      if (entry && typeof entry === 'object') {
        const e = entry as Record<string, unknown>;
        if (typeof e.key === 'string' && typeof e.count === 'number' && e.count > 0) {
          mix.push({ key: e.key, count: Math.floor(e.count) });
        }
      }
    }
  }
  return {
    enemyMix: mix,
    durationMs: readNumber(node.data, 'durationMs', DEFAULT_DURATION_MS),
  };
}
