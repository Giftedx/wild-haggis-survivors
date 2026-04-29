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
 * Live biome IDs are `bog | loch | pine | heather` (`src/data/biomes.ts`).
 * Conditions baked into the rune catalogue at U1 M1 reference future
 * biomes (`fog`, `cold`, `coastal`, `urban`) and a time-of-day axis
 * (`dusk`) that the live game does not yet expose.
 *
 * Until those systems land, runes carrying these keys would be
 * permanent dead picks — a player could equip them and never see the
 * effect fire. Filter them out of the card-pool bridge so the pool
 * only offers runes whose conditions can actually transition.
 *
 * The catalogue itself stays intact (run-history / Almanac references
 * remain stable). Once a missing biome / time-of-day axis ships, the
 * relevant key drops off this list and the rune comes back online
 * with no data churn.
 */
const UNGROUNDED_CONDITION_KEYS: ReadonlySet<RuneConditionKey> = new Set([
  // No live biome 'urban' — Edinburgh/Glasgow biomes future work.
  'biome_urban',
  // 'biome_dusk' graduated 2026-04-28 (B5 Phase 0). GameScene now
  // populates timeOfDayKey via computeTimeOfDayKey, so gloaming_rune
  // fires in the 15-22min window of every run.
  // 'biome_coastal' graduated 2026-04-29 (B5 Phase 1a).
  // 'biome_fog' graduated 2026-04-30 (B5 Phase 1b).
  // 'biome_cold' graduated 2026-04-30 (B5 Phase 2) — dedicated
  // 'frost' biome shipped. The condition evaluator wires
  // biomeKey === 'cold' || === 'frost' for forward-compat.
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
