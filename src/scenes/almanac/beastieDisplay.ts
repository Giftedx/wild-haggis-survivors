/**
 * C1 Highland Almanac — Book 1 silhouette display state.
 *
 * Pure mapper that decides how each beastie sprite is drawn: full
 * colour + real name when seen, dark-tinted silhouette + "???" when
 * not. Keeping this separate from BeastiesBook.ts means the grid
 * renderer can stay layout-focused and this file owns the spoiler
 * policy (§2 "silhouette... enough to tease, not enough to identify").
 */

/**
 * Silhouette tint — a very dark indigo rather than pure black. Pure
 * `0x000000` tends to black out anti-aliased edges at low alpha and
 * breaks silhouette definition. This tone sits just above the
 * unseen cell bg (`0x0e1524`) so the sprite shape still reads.
 */
export const SILHOUETTE_TINT = 0x1a2236;

/**
 * Silhouette alpha — dim enough that the sprite reads as "unknown"
 * but opaque enough the outline is still legible. Picked above
 * 0.25 so the shape is recognisable enough to tease; below 1 so
 * it's never mistaken for a seen entry.
 */
export const SILHOUETTE_ALPHA = 0.55;

/** Display name shown over an unseen beastie — spec §2 "???" tease. */
export const SILHOUETTE_NAME = '???';

export interface BeastieDisplay {
  readonly tint: number | null;
  readonly alpha: number;
  readonly displayName: string;
  readonly isSilhouette: boolean;
}

/**
 * Decide how to render an entry's sprite + name. Tests pin the
 * tint / alpha / name choices so a future change (e.g. true outline
 * shader from F1) has to be intentional.
 */
export function resolveBeastieDisplay(entry: {
  readonly seen: boolean;
  readonly displayName: string;
}): BeastieDisplay {
  if (entry.seen) {
    return {
      tint: null,
      alpha: 1,
      displayName: entry.displayName,
      isSilhouette: false,
    };
  }
  return {
    tint: SILHOUETTE_TINT,
    alpha: SILHOUETTE_ALPHA,
    displayName: SILHOUETTE_NAME,
    isSilhouette: true,
  };
}
