/**
 * W95 Mobile Rework — touch-target helpers.
 *
 * iOS HIG and Android Material both require ≥44pt / 48dp tap targets so
 * fingers can hit them reliably. Phaser text objects often render at
 * 14-24px and ship with hit areas matching the bare glyph extent —
 * fine for desktop hover, far too small for mobile thumbs.
 *
 * `computeMinTapHitArea` is a pure helper that takes a Phaser game
 * object's intrinsic width/height and returns the rectangle needed to
 * meet the platform minimum. Hit areas are centered on the object's
 * origin so the inflation works for setOrigin(0,0) chrome buttons,
 * setOrigin(1,0) right-anchored HUD glyphs, and setOrigin(0.5)
 * centered controls equally.
 *
 * Coordinates are local (object space, not world) so callers can pass
 * the result directly to setInteractive(new Phaser.Geom.Rectangle(...),
 * Phaser.Geom.Rectangle.Contains).
 *
 * Note: this lives in src/utils/ (not src/ui/) because it is framework-
 * agnostic and unit-testable without a Phaser scene.
 */

/** iOS HIG minimum tap target. Used as the default for both platforms. */
export const MIN_TOUCH_TARGET_PX = 44;

export interface TapHitArea {
  /** Local-space top-left x of the hit rectangle, relative to origin. */
  x: number;
  /** Local-space top-left y of the hit rectangle, relative to origin. */
  y: number;
  /** Width of the hit rectangle in local pixels. */
  width: number;
  /** Height of the hit rectangle in local pixels. */
  height: number;
}

/**
 * Compute a hit-area rectangle that covers the source object and
 * extends to at least minSize in each axis. The rectangle is
 * centered on the object — origin-agnostic, since Phaser hit-areas
 * are evaluated in the object's local space which is already
 * post-origin.
 */
export function computeMinTapHitArea(
  srcWidth: number,
  srcHeight: number,
  origin: { x: number; y: number } = { x: 0, y: 0 },
  minSize: number = MIN_TOUCH_TARGET_PX,
): TapHitArea {
  const w = Math.max(srcWidth, minSize);
  const h = Math.max(srcHeight, minSize);
  const dx = (w - srcWidth) * 0.5;
  const dy = (h - srcHeight) * 0.5;
  const x = -origin.x * srcWidth - dx;
  const y = -origin.y * srcHeight - dy;
  return { x, y, width: w, height: h };
}

/**
 * True if a viewport (in CSS pixels) is mobile-sized — used by HUD
 * reflow paths and tests. The 600 cutoff matches the existing
 * isMobileWidth heuristic in src/ui/HUD.ts.
 */
export function isMobileViewportWidth(width: number, threshold: number = 600): boolean {
  return width < threshold;
}

/**
 * Decide whether the running session is a touch-primary device.
 * Heuristic — Phaser itself reads device.input.touch. Used by HUD /
 * settings code paths that need to swap copy ("press X" -> "tap X")
 * or upgrade hit areas. Safe to call in node-env tests (returns false).
 */
export function detectTouchPrimary(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = (window as Window & { navigator?: Navigator }).navigator;
  const maxTouchPoints = nav?.maxTouchPoints ?? 0;
  if (maxTouchPoints > 0) return true;
  return 'ontouchstart' in window;
}
