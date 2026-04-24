/**
 * C1 Highland Almanac — expanded detail view-model for one Wey.
 *
 * Pure — converts a `WeyEntryVM` into the strings/i18n keys the expanded
 * panel draws. Tests pin the unpicked-route silhouette (no leak of
 * description text on routes the player has never walked) and the
 * pluralised pick-count copy.
 */

import type { WeyEntryVM } from './buildWeysEntries';

export interface WeyDetailVM {
  readonly titleKey: string;
  readonly titleFallback: string;
  readonly picked: boolean;
  readonly descKey: string;
  readonly descFallback: string;
  readonly pickCountText: string | null;
  readonly firstPickedText: string | null;
}

const UNKNOWN_TITLE = 'Untrod road';
const UNKNOWN_DESC = 'Not yet walked. The moor keeps the path quiet till ye choose it.';

export function buildWeyDetail(entry: WeyEntryVM): WeyDetailVM {
  if (!entry.picked) {
    return {
      titleKey: 'ui.almanac.wey_unknown_title',
      titleFallback: UNKNOWN_TITLE,
      picked: false,
      descKey: 'ui.almanac.wey_unknown_lore',
      descFallback: UNKNOWN_DESC,
      pickCountText: null,
      firstPickedText: null,
    };
  }

  return {
    titleKey: entry.labelKey,
    titleFallback: entry.key,
    picked: true,
    descKey: entry.descKey,
    descFallback: '',
    pickCountText: formatPickCount(entry.pickCount),
    firstPickedText: entry.firstPickedAt
      ? formatFirstPicked(entry.firstPickedAt.timestamp)
      : null,
  };
}

function formatPickCount(count: number): string | null {
  if (count <= 0) return null;
  const noun = count === 1 ? 'walk' : 'walks';
  return `${count} ${noun} on the slate`;
}

function formatFirstPicked(timestamp: number): string {
  try {
    return `First walked ${new Date(timestamp).toLocaleDateString()}`;
  } catch {
    return `First walked ${new Date(timestamp).toISOString().slice(0, 10)}`;
  }
}
