/**
 * Pure palette for the MainMenu "foot strip" — three bottom-of-
 * screen text lines that recede visually so the landing art reads
 * first: the short bests strip, the history/win-rate summary, and
 * the credit / build line in the corner.
 *
 * High-contrast mode bumps every colour up one luminance step and
 * also adds a dark stroke to the credit text (it sits on top of the
 * parallax mountain peaks, which are much lighter in HC). The stats
 * lines ride on the dimmed lower half of the screen and don't need
 * the stroke.
 */

export interface MenuFooterStroke {
  color: string;
  thickness: number;
}

export interface MenuFooterPalette {
  /** Bests strip ("⏱ 3:42 • 💀 420 • …"). */
  statsStrip: string;
  /** History summary ("last 10 runs: 4W/6L, trend ↑"). */
  historyStrip: string;
  /** Credit + version lines in the corner. */
  creditText: string;
  /** Only present in high-contrast mode (credit sits on the mountain silhouette). */
  creditStroke: MenuFooterStroke | null;
}

export function resolveMenuFooterPalette(highContrastUi: boolean): MenuFooterPalette {
  if (highContrastUi) {
    return {
      statsStrip: '#6a7894',
      historyStrip: '#5a6888',
      creditText: '#5a6888',
      creditStroke: { color: '#0a0c10', thickness: 3 },
    };
  }
  return {
    statsStrip: '#556280',
    historyStrip: '#4a5c78',
    creditText: '#445572',
    creditStroke: null,
  };
}
