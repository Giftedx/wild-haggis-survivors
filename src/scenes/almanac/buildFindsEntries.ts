/**
 * C1 Highland Almanac — Book 3 (Finds) view-model builder.
 *
 * Aggregates every acquirable thing the player can stumble across into
 * one ordered entry list. Categories: weapons, weapon evolutions,
 * passives, permanent shop upgrades, and Reliquary curios. Pure — no
 * Phaser, no i18n, no save reads. `FindsBook.ts` adds Phaser scaffolding.
 *
 * Ordering (within the page): category section in the order weapons →
 * evolutions → passives → permanents → relics, then registry order
 * inside each section. The page reads as a roughly chronological tour
 * of "what the player will encounter" — weapons appear first because
 * they're handed out from level 2 onward; relics last because they're
 * a mid-run rare event.
 */

import type { DiscoveryLog, FirstSeenAt } from '../../systems/DiscoveryLog';
import { WEAPON_DEFS } from '../../data/weapons';
import { PASSIVE_CARDS } from '../../data/upgrades';
import { EVOLUTION_RECIPES } from '../../core/BalanceConfig';
import { PERMANENT_UPGRADES } from '../../data/permanentUpgrades';
import { RELIQUARY_CURIOS } from '../../scenes/game/reliquary';

export type FindCategory = 'weapon' | 'evolution' | 'passive' | 'permanent' | 'relic';

export interface FindEntryVM {
  readonly key: string;
  readonly category: FindCategory;
  readonly nameKey: string;
  readonly descKey: string;
  readonly acquired: boolean;
  readonly acquireCount: number;
  readonly firstAcquiredAt: FirstSeenAt | null;
}

const CATEGORY_ORDER: readonly FindCategory[] = [
  'weapon',
  'evolution',
  'passive',
  'permanent',
  'relic',
];

export function buildFindsEntries(log: DiscoveryLog): FindEntryVM[] {
  const out: FindEntryVM[] = [];
  for (const cat of CATEGORY_ORDER) {
    out.push(...collectCategory(cat, log));
  }
  return out;
}

function collectCategory(category: FindCategory, log: DiscoveryLog): FindEntryVM[] {
  switch (category) {
    case 'weapon':
      return Object.values(WEAPON_DEFS).map((w) =>
        toEntry(w.key, 'weapon', w.nameKey, w.descriptionKey, log),
      );
    case 'evolution':
      return EVOLUTION_RECIPES.map((r) =>
        toEntry(r.evolvedWeapon, 'evolution', r.nameKey, r.descriptionKey, log),
      );
    case 'passive':
      return PASSIVE_CARDS
        .map((card) => {
          if (card.effect.type !== 'add_passive') return null;
          return toEntry(card.effect.passiveKey, 'passive', card.name, card.description, log);
        })
        .filter((e): e is FindEntryVM => e !== null);
    case 'permanent':
      return PERMANENT_UPGRADES.map((u) =>
        toEntry(u.key, 'permanent', u.nameKey, u.descriptionKey, log),
      );
    case 'relic':
      return RELIQUARY_CURIOS.map((c) =>
        toEntry(c.id, 'relic', c.titleKey, c.descKey, log),
      );
  }
}

function toEntry(
  key: string,
  category: FindCategory,
  nameKey: string,
  descKey: string,
  log: DiscoveryLog,
): FindEntryVM {
  const entry = log.findsAcquired[key];
  return {
    key,
    category,
    nameKey,
    descKey,
    acquired: entry !== undefined,
    acquireCount: entry?.acquireCount ?? 0,
    firstAcquiredAt: entry?.firstAcquiredAt ?? null,
  };
}

/**
 * Summary stats for the Finds-tab header pill ("N of M acquired").
 * Pure wrapper around the entry list so the header stays in sync with
 * the body grid.
 */
export function findsDiscoverySummary(entries: readonly FindEntryVM[]): {
  acquired: number;
  total: number;
} {
  let acquired = 0;
  for (const e of entries) if (e.acquired) acquired++;
  return { acquired, total: entries.length };
}
