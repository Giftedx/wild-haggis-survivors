/**
 * C1 Highland Almanac — expanded detail view-model for one Find.
 *
 * Pure — converts a `FindEntryVM` into the strings/i18n keys the
 * expanded panel draws. Tests pin the unacquired-find silhouette
 * (no leak of the real name / desc on entries the player has never
 * picked up) and the pluralised acquire-count copy.
 */

import type { FindCategory, FindEntryVM } from './buildFindsEntries';

export interface FindDetailVM {
  readonly titleKey: string;
  readonly titleFallback: string;
  readonly acquired: boolean;
  readonly category: FindCategory;
  readonly categoryLabelKey: string;
  readonly descKey: string;
  readonly descFallback: string;
  readonly acquireCountText: string | null;
  readonly firstAcquiredText: string | null;
}

const UNKNOWN_TITLE = 'Hidden find';
const UNKNOWN_DESC = 'Not yet found. Some treasures only the moor can deliver.';

export function buildFindDetail(entry: FindEntryVM): FindDetailVM {
  if (!entry.acquired) {
    return {
      titleKey: 'ui.almanac.find_unknown_title',
      titleFallback: UNKNOWN_TITLE,
      acquired: false,
      category: entry.category,
      categoryLabelKey: categoryLabelKeyFor(entry.category),
      descKey: 'ui.almanac.find_unknown_lore',
      descFallback: UNKNOWN_DESC,
      acquireCountText: null,
      firstAcquiredText: null,
    };
  }
  return {
    titleKey: entry.nameKey,
    titleFallback: entry.key,
    acquired: true,
    category: entry.category,
    categoryLabelKey: categoryLabelKeyFor(entry.category),
    descKey: entry.descKey,
    descFallback: '',
    acquireCountText: formatAcquireCount(entry.acquireCount),
    firstAcquiredText: entry.firstAcquiredAt && entry.firstAcquiredAt.timestamp > 0
      ? formatFirstAcquired(entry.firstAcquiredAt.timestamp)
      : null,
  };
}

export function categoryLabelKeyFor(category: FindCategory): string {
  return `ui.almanac.find_cat_${category}`;
}

function formatAcquireCount(count: number): string | null {
  if (count <= 0) return null;
  const noun = count === 1 ? 'pick' : 'picks';
  return `${count} ${noun} on the slate`;
}

function formatFirstAcquired(timestamp: number): string {
  try {
    return `First found ${new Date(timestamp).toLocaleDateString()}`;
  } catch {
    return `First found ${new Date(timestamp).toISOString().slice(0, 10)}`;
  }
}
