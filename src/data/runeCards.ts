/**
 * Bridge between the pure rune catalogue (`runes.ts`) and the upgrade-card
 * system (`upgrades.ts`). Builds one `UpgradeCard` per `RuneDef`, tagged
 * with the new `'rune'` rarity and a `grant_rune` effect payload.
 *
 * Kept separate from `runes.ts` so the pure data module has no dependency
 * on the card shape — tests driving condition / effect behaviour do not
 * pull the whole card layer. Live card-pool inclusion is release-gated in
 * `upgrades.ts` until runtime systems consume the rune effect bag.
 */

import type { UpgradeCard } from './upgrades';
import { RUNES, type RuneDef } from './runes';

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

/** One `UpgradeCard` per `RuneDef`, deterministic order (id-sorted). */
export function buildRuneCards(): UpgradeCard[] {
  return Object.values(RUNES)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(toUpgradeCard);
}
