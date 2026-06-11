/**
 * Pure number-to-hex-string converters for Phaser number colours.
 *
 * Phaser fills + strokes use `0xRRGGBB` number form, but Phaser text
 * styles want CSS `'#RRGGBB'` strings. When a caller receives a
 * colour as a number (e.g. from a palette table) and needs to feed
 * it to a `color:` field, this helper produces the CSS form with
 * proper zero-padding.
 *
 * The mask drops any alpha channel accidentally packed into the
 * upper 8 bits (Phaser sometimes stores ARGB), and the padStart
 * keeps short colours like 0xff (pure blue) from rendering as
 * "#ff" (which browsers would reject).
 */

/**
 * Convert a 24-bit Phaser colour number (0xRRGGBB) into a CSS
 * `'#RRGGBB'` string.
 */
export function numberToCssColor(color: number): string {
  return `#${(color & 0xffffff).toString(16).padStart(6, '0')}`;
}

/**
 * Darken a 0xRRGGBB colour by `percent` (0–100). Pure math — no
 * Phaser import, safe for node-env vitest.
 */
export function darkenHex(color: number, percent: number): number {
  const factor = 1 - Math.min(percent, 100) / 100;
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}
