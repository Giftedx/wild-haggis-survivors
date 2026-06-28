/**
 * Bridge between the pure rune catalogue (`runes.ts`) and the upgrade-card
 * system (`upgrades.ts`). Builds one `UpgradeCard` per `RuneDef`, tagged
 * with the new `'rune'` rarity and a `grant_rune` effect payload.
 *
 * Kept separate from `runes.ts` so the pure data module has no dependency
 * on the card shape — tests driving condition / effect behaviour do not
 * pull the whole card layer. Live card-pool inclusion is controlled by
 * `RUNE_CARD_OFFERS_ENABLED` in `upgrades.ts`.
 */

import type { UpgradeCard } from './upgrades';
import { RUNES, type RuneDef, type RuneConditionKey } from './runes';

function toUpgradeCard(rune: RuneDef): UpgradeCard {
  return {
    id: `rune_${rune.id}`,
    name: rune.nameKey,
    description: `runes.${rune.id}.description`,
    rarity: 'rune',
    icon: rune.glyph,
    effect: { type: 'grant_rune', runeId: rune.id },
  };
}

/**
 * U1 M4 T113 — condition keys that currently have no live-state binding.
 *
 * The catalogue can include future-facing rules, but the level-up deck
 * must not offer a rune whose condition can never transition in the
 * running game. Keep this list aligned with `RuneSystemController`'s
 * context builder: when that controller starts feeding a real signal,
 * remove the matching condition here and add a regression test.
 */
const UNGROUNDED_CONDITION_KEYS: ReadonlySet<RuneConditionKey> = new Set([
  'near_cairn',
  'dash_recent_2s',
  'every_nth_kill:10',
  'kill_cascade',
  'three_types_in_5s',
  'crit_on_weakened',
  'pickup_chain_5s',
  'dashed_5s_ago',
  'kill_on_thistle',
  'music_bass_active',
]);

/**
 * True when the rune's condition has at least one possible live trigger
 * in the current build. Exposed for tests + Almanac filters.
 */
export function isRuneConditionGrounded(rune: RuneDef): boolean {
  return !UNGROUNDED_CONDITION_KEYS.has(rune.conditionKey);
}

/**
 * One `UpgradeCard` per *grounded* `RuneDef`, deterministic order
 * (id-sorted). Ungrounded runes are filtered so the card pool never
 * offers a rune the player cannot trigger in this build.
 */
export function buildRuneCards(): UpgradeCard[] {
  return Object.values(RUNES)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .filter(isRuneConditionGrounded)
    .map(toUpgradeCard);
}
