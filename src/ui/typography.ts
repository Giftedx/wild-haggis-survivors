/**
 * Typography scale — single source of truth for every text style in
 * the game. Seven roles from `display` (48px scene titles) down to
 * `small` (11px metadata) plus `subtitle` (13px italic).
 *
 * Usage:
 *   scene.add.text(x, y, 'Hello', textStyle('title', { color: COLORS_CSS.WHISKY_GOLD }));
 */

export type FontRole =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'small'
  | 'subtitle';

export interface FontScaleEntry {
  size: string;
  weight: 'bold' | 'italic';
  strokeThickness: number;
}

export const FONT_SCALE: Readonly<Record<FontRole, FontScaleEntry>> = {
  display:  { size: '48px', weight: 'bold',   strokeThickness: 7 },
  title:    { size: '30px', weight: 'bold',   strokeThickness: 4 },
  heading:  { size: '22px', weight: 'bold',   strokeThickness: 3 },
  body:     { size: '16px', weight: 'bold',   strokeThickness: 2 },
  label:    { size: '13px', weight: 'bold',   strokeThickness: 2 },
  small:    { size: '11px', weight: 'bold',   strokeThickness: 2 },
  subtitle: { size: '13px', weight: 'italic', strokeThickness: 0 },
};

export interface TextStyleOpts {
  color?: string;
  align?: string;
  wordWrap?: { width: number };
  /** Override the scale's default font size. */
  fontSize?: string;
}

export interface GameTextStyle {
  fontFamily: 'monospace';
  fontSize: string;
  color: string;
  fontStyle: 'bold' | 'italic';
  stroke: string;
  strokeThickness: number;
  align?: string;
  wordWrap?: { width: number };
}

/**
 * Build a Phaser-compatible text style object from a typography role.
 */
export function textStyle(
  role: FontRole,
  opts?: TextStyleOpts,
): GameTextStyle {
  const entry = FONT_SCALE[role];
  const style: GameTextStyle = {
    fontFamily: 'monospace',
    fontSize: opts?.fontSize ?? entry.size,
    color: opts?.color ?? '#ffffff',
    fontStyle: entry.weight === 'italic' ? 'italic' : 'bold',
    stroke: entry.strokeThickness > 0 ? '#000' : '',
    strokeThickness: entry.strokeThickness,
  };
  if (opts?.align) style.align = opts.align;
  if (opts?.wordWrap) style.wordWrap = opts.wordWrap;
  return style;
}
