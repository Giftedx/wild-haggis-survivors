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

export type FindCategory = 'weapon' | 'evolution' | 'passive' | 'permanent' | 'relic' | 'lore' | 'foundation';

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
  'lore',
  'foundation',
];

const OLD_DROVER_SLOTS = 25;

/** Lifetime field-note counts at which each Foundation field-guide page
 *  unlocks. Exported for the collect-time banter tag picker
 *  (`src/scenes/game/fieldNoteCollectTag.ts`) so the "a fresh page just
 *  unlocked" beat can never drift from the Almanac's own unlock maths. */
export const FOUNDATION_THRESHOLDS = [1, 3, 7, 12, 20, 30, 50, 75, 90, 105, 120, 135, 150, 165] as const;

export function buildFindsEntries(
  log: DiscoveryLog,
  oldDroverRevealedCount = 0,
  fieldNotesLifetime = 0,
): FindEntryVM[] {
  const out: FindEntryVM[] = [];
  for (const cat of CATEGORY_ORDER) {
    out.push(...collectCategory(cat, log, oldDroverRevealedCount, fieldNotesLifetime));
  }
  return out;
}

function collectCategory(
  category: FindCategory,
  log: DiscoveryLog,
  oldDroverRevealedCount: number,
  fieldNotesLifetime: number,
): FindEntryVM[] {
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
    case 'lore':
      return [...buildOldDroverEntries(oldDroverRevealedCount), buildMakersNoteEntry()];
    case 'foundation':
      return buildFoundationEntries(fieldNotesLifetime);
  }
}

/**
 * DESIGN_IDEAS §13 — the Celtic-pattern credit. A single always-
 * acquired colophon at the tail of the lore book naming the visual
 * traditions the game's art borrows from (Pictish stones, insular
 * knotwork, the Mackintosh rose). Deliberately unadvertised — no
 * unlock beat, no toast; it is simply there for the player who reads
 * to the end of the shelf, the way a colophon should be.
 */
function buildMakersNoteEntry(): FindEntryVM {
  return {
    key: 'makers_note',
    category: 'lore',
    nameKey: 'ui.almanac.makersNote.title',
    descKey: 'ui.almanac.makersNote.body',
    acquired: true,
    acquireCount: 1,
    firstAcquiredAt: null,
  };
}

/**
 * T11 — The Moor Remembers: Old Drover reveal arc.
 *
 * Emits 25 flat `FindEntryVM` lore entries (old_drover_01 → old_drover_25).
 * Each entry is acquired once its slot number is within the revealed count
 * (cairn interactions increment the count in SaveManager). The nameKey and
 * descKey both point at the same i18n leaf so the expanded panel shows the
 * grandfather whisper text as both title and body.
 *
 * Rendering of locked entries follows the existing unknown-find silhouette
 * path in buildFindDetail — no special-casing needed in FindsBook.
 */
function buildOldDroverEntries(oldDroverRevealedCount: number): FindEntryVM[] {
  return Array.from({ length: OLD_DROVER_SLOTS }, (_, i) => {
    const slot = i + 1;
    const padded = String(slot).padStart(2, '0');
    const i18nKey = `ui.cairn.grandfather.${padded}`;
    const revealed = slot <= oldDroverRevealedCount;
    return {
      key: `old_drover_${padded}`,
      category: 'lore' as const,
      nameKey: i18nKey,
      descKey: i18nKey,
      acquired: revealed,
      acquireCount: revealed ? 1 : 0,
      firstAcquiredAt: null,
    };
  });
}

/**
 * Field Notes v2 (DESIGN_IDEAS §11) — Haggis Wildlife Foundation lore arc.
 *
 * Emits 14 flat `FindEntryVM` foundation entries. Each entry unlocks once
 * `fieldNotesLifetime` reaches the corresponding threshold in
 * `FOUNDATION_THRESHOLDS`. The nameKey and descKey both point at the same
 * i18n leaf — the expanded panel shows the pompous faux-naturalist text as
 * both title and body (same pattern as the Old Drover arc).
 */
function buildFoundationEntries(fieldNotesLifetime: number): FindEntryVM[] {
  return FOUNDATION_THRESHOLDS.map((threshold, i) => {
    const slot = i + 1;
    const padded = String(slot).padStart(2, '0');
    const i18nKey = `ui.almanac.foundation.${padded}`;
    const acquired = fieldNotesLifetime >= threshold;
    return {
      key: `foundation_${padded}`,
      category: 'foundation' as const,
      nameKey: i18nKey,
      descKey: i18nKey,
      acquired,
      acquireCount: acquired ? 1 : 0,
      firstAcquiredAt: null,
    };
  });
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
