/**
 * C1 Highland Almanac — expanded detail view-model for one Beastie.
 *
 * Pure — converts a `BeastieEntryVM` into the strings/i18n keys the
 * expanded panel draws. Tests lock the silhouette policy (unseen
 * entries never leak the real name or timing cue) and the pluralised
 * kill-count copy.
 *
 * i18n lookups — the panel calls `t()` at render time with the keys
 * returned here. Fallback text is returned inline so the panel
 * stays readable even before the C2 lore-pass authors the per-beastie
 * lore leaves (`beastie.<key>.lore`).
 */

import type { BeastieEntryVM } from './buildBeastiesEntries';

export interface BeastieDetailVM {
  readonly titleText: string;
  readonly isSilhouette: boolean;
  readonly loreKey: string;
  readonly loreFallback: string;
  readonly whereFoundText: string | null;
  readonly killCountText: string | null;
  readonly firstSeenText: string | null;
}

/** Generic fallback lore for beasties whose flavour leaf hasn't shipped yet. */
const GENERIC_LORE =
  'A wee beastie o\' the moor. The herd remembers its tracks, though the page is still bein written.';

const UNKNOWN_LORE = 'Not yet encountered. The moor keeps its secrets.';

export function buildBeastieDetail(entry: BeastieEntryVM): BeastieDetailVM {
  if (!entry.seen) {
    return {
      titleText: '???',
      isSilhouette: true,
      loreKey: 'ui.almanac.beastie_unknown_lore',
      loreFallback: UNKNOWN_LORE,
      whereFoundText: null,
      killCountText: null,
      firstSeenText: null,
    };
  }

  return {
    titleText: entry.displayName,
    isSilhouette: false,
    loreKey: `beastie.${entry.key}.lore`,
    loreFallback: GENERIC_LORE,
    whereFoundText: formatWhereFound(entry.appearsAt),
    killCountText: formatKillCount(entry.killCount),
    firstSeenText: entry.firstSeenAt
      ? formatFirstSeen(entry.firstSeenAt.timestamp)
      : null,
  };
}

function formatWhereFound(appearsAtSec: number): string {
  if (appearsAtSec <= 0) return 'From the off';
  // Round to the nearest minute for human-readable copy — the wave
  // timeline uses 30-second ticks but "Minute 12" reads cleaner than
  // "11:30" on a flavour panel.
  const minute = Math.ceil(appearsAtSec / 60);
  return `Minute ${minute}`;
}

function formatKillCount(count: number): string | null {
  if (count <= 0) return null;
  const noun = count === 1 ? 'cull' : 'culls';
  return `${count} ${noun} on the slate`;
}

function formatFirstSeen(timestamp: number): string {
  // Localised short date — falls back to ISO if Intl is unavailable
  // (node test env sometimes trims the locale subset).
  try {
    return `First seen ${new Date(timestamp).toLocaleDateString()}`;
  } catch {
    return `First seen ${new Date(timestamp).toISOString().slice(0, 10)}`;
  }
}
