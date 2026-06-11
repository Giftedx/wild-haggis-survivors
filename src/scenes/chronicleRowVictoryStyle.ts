/**
 * Pure 2-state style resolver for a ChronicleScene run row.
 *
 * Each historical run reads as either a win (taxman felled — bold
 * warm gold, '✦ WIN' pill) or a fall (died before the final — quiet
 * slate-blue, 'FELL' pill). The badge text, badge colour, main-line
 * colour, and main-line font-style all shift together, and the
 * scene used to re-declare those four bindings in-place. Pulling
 * them into one resolver keeps the two outcomes visually coherent.
 *
 * Badge labels stay in English (they read almost like icons here),
 * matching the existing i18n stance for these one-word markers.
 */

export type ChronicleRowFontStyle = 'bold' | 'normal';

export interface ChronicleRowVictoryStyle {
  badgeLabel: string;
  badgeColor: string;
  mainColor: string;
  mainFontStyle: ChronicleRowFontStyle;
}

export const CHRONICLE_WIN_BADGE = '✦ WIN';
export const CHRONICLE_LOSS_BADGE = 'FELL';

export function resolveChronicleRowVictoryStyle(isVictory: boolean): ChronicleRowVictoryStyle {
  if (isVictory) {
    return {
      badgeLabel: CHRONICLE_WIN_BADGE,
      badgeColor: '#f7d27a',
      mainColor: '#f5e1a6',
      mainFontStyle: 'bold',
    };
  }
  return {
    badgeLabel: CHRONICLE_LOSS_BADGE,
    badgeColor: '#9aa4bb',
    mainColor: '#d6dde7',
    mainFontStyle: 'normal',
  };
}
