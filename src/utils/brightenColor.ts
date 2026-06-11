import * as Phaser from 'phaser';

/**
 * Brighten a Phaser 0xRRGGBB colour number by `percent` points
 * (matches `Phaser.Display.Color.lighten(n)`). The inline
 * `Phaser.Display.Color.ValueToColor(x).lighten(n).color` chain
 * appeared across a handful of hover handlers — this wraps it so
 * the intent reads at a glance and the percent is a plain number.
 *
 * Lives apart from `colorFormat.ts` because this module imports
 * Phaser (which eagerly touches `window`) and the sibling is kept
 * Phaser-free so its tests can run under vitest's default node env.
 */
export function brightenColor(color: number, percent: number): number {
  return Phaser.Display.Color.ValueToColor(color).lighten(percent).color;
}
