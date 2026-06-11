/**
 * Elite event — force-spawn a specific elite at the node, guaranteed
 * relic drop on kill.
 *
 * Pure resolver normalises the NodeDef's elite data; scene passes
 * `enemyKey` to `SpawnSystem.forceSpawn` with `{ elite: true }` and
 * registers a one-shot "on kill → call RelicSystem.rollDrop('elite',
 * …) forced to true".
 */
import type { NodeDef } from '../../data/nodeTypes';
import { readNumber, type EliteEncounterSpec, type EliteMultipliers } from './types';

const DEFAULT_ELITE_MUL: EliteMultipliers = { hp: 3, speed: 1.3, xp: 3 };
const DEFAULT_ENEMY_KEY = 'haggis_hunter';

export function resolveEliteEvent(node: NodeDef): EliteEncounterSpec {
  if (node.type !== 'elite') {
    throw new Error(`resolveEliteEvent: node ${node.key} is not an elite (got ${node.type})`);
  }
  const enemyRaw = node.data.enemyKey;
  const enemyKey = typeof enemyRaw === 'string' && enemyRaw ? enemyRaw : DEFAULT_ENEMY_KEY;

  const mulRaw = node.data.eliteMul as Readonly<Record<string, unknown>> | undefined;
  const eliteMul: EliteMultipliers =
    mulRaw && typeof mulRaw === 'object'
      ? {
          hp: readNumber(mulRaw, 'hp', DEFAULT_ELITE_MUL.hp),
          speed: readNumber(mulRaw, 'speed', DEFAULT_ELITE_MUL.speed),
          xp: readNumber(mulRaw, 'xp', DEFAULT_ELITE_MUL.xp),
        }
      : { ...DEFAULT_ELITE_MUL };

  const guaranteedRelic = node.data.guaranteedRelic !== false;

  return { enemyKey, eliteMul, guaranteedRelic };
}
