/**
 * Tiny viewport-class util. Phaser scale uses RESIZE so canvas matches the
 * window — scenes branch on the live width to pick mobile / tablet / desktop
 * layouts. `uiScale` is a separate user preference (0.8–1.4) for comfort;
 * viewport class is for hardware constraint.
 *
 * Pure module — no Phaser imports — so vitest under node-env can call it.
 */

export type ViewportClass = 'mobile' | 'tablet' | 'desktop';

/** Width below which mobile layouts kick in. iPhone 13 portrait = 390. */
export const MOBILE_BREAKPOINT = 600;
/** Width below which tablet (single-column desktop) layouts kick in. */
export const TABLET_BREAKPOINT = 1024;

export function getViewportClass(width: number): ViewportClass {
  if (width < MOBILE_BREAKPOINT) return 'mobile';
  if (width < TABLET_BREAKPOINT) return 'tablet';
  return 'desktop';
}

export function isMobileViewport(width: number): boolean {
  return width < MOBILE_BREAKPOINT;
}

export function isTabletViewport(width: number): boolean {
  return width < TABLET_BREAKPOINT;
}
