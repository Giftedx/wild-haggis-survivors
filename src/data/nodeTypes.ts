/**
 * Node types — the seven per-run moor-road node categories (M1).
 *
 * Each act generates a 3–5 node path from a bank (see `nodeBanks.ts`).
 * Weighted rolls + constraint solver in `NodeMapSystem` produce the
 * path; proximity detection in `GameScene` fires the event. Node events
 * live in `src/systems/nodeEvents/*.ts` and read from `NodeDef.data`.
 *
 * Data is `Record<string, unknown>` on purpose: each node-type event
 * reads its own shape. Tighter per-type discriminated unions can land
 * in a later pass once all seven events are implemented.
 */

export const NODE_TYPES = [
  'encounter',
  'shrine',
  'wee_trader',
  'hidden',
  'bargain',
  'rest',
  'elite',
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export interface NodeDef {
  /** Stable identifier — appears in save / replay / analytics. */
  readonly key: string;
  readonly type: NodeType;
  /** i18n key for the node's display name (HUD + prompt). */
  readonly nameKey: string;
  /** i18n key for the interaction prompt (Shrine / Trader / Bargain / Hidden). */
  readonly promptKey?: string;
  /** Relative selection weight inside the per-act bank roll. */
  readonly weightInBank: number;
  /** Acts this node can appear in. */
  readonly actAffinity: readonly (1 | 2 | 3)[];
  /** Type-specific payload (enemy mix for encounter, buff pool for shrine, etc.). */
  readonly data: Readonly<Record<string, unknown>>;
}

export interface NodeOutcome {
  readonly nodeKey: string;
  /** The reward the player picked when the node offered a choice. */
  readonly chosenRewardKey?: string;
  readonly visitedAtGameTimeSec: number;
}

const NODE_TYPE_SET: ReadonlySet<string> = new Set(NODE_TYPES);

export function isNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && NODE_TYPE_SET.has(value);
}
