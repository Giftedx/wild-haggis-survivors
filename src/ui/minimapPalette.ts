/**
 * Pure palette + helpers for the corner-of-screen Minimap.
 *
 * Splits into two parts:
 *  - resolveMinimapPalette(highContrast) — background/border colours
 *    that swap under the high-contrast accessibility toggle. The
 *    rest of the palette (boss / elite / chest / player / viewport
 *    / edge-warn) is fixed and exposed as named constants.
 *  - resolveMinimapEdgeWarn(...) — pure "how red is the warn outline"
 *    helper. Returns {active, alpha}. Active is true when the player
 *    is within BOUNDARY_MARGIN of the edge; alpha ramps from 0.25 at
 *    the threshold up to 0.75 at the edge.
 *
 * Extracting these out of Minimap.update() keeps the render code
 * focused on drawing and the palette / geometry invariants testable
 * without a Phaser scene.
 */

export interface MinimapPalette {
  bgAlpha: number;
  borderColor: number;
}

export function resolveMinimapPalette(highContrast: boolean): MinimapPalette {
  if (highContrast) {
    return { bgAlpha: 0.7, borderColor: 0x8fb4ff };
  }
  return { bgAlpha: 0.55, borderColor: 0x6a7390 };
}

/** Boss diamond fill. */
export const MINIMAP_BOSS_FILL = 0xdd4444;
/** Elite outer ring fill (muted dark gold). */
export const MINIMAP_ELITE_RING_FILL = 0x332200;
/** Fallback elite inner dot when the affix has no indicator tint. */
export const MINIMAP_ELITE_INNER_FALLBACK = 0xffdd44;
/** Regular enemy dot. */
export const MINIMAP_ENEMY_FILL = 0xcc4444;
export const MINIMAP_ENEMY_ALPHA = 0.55;
/** Player direction triangle. */
export const MINIMAP_PLAYER_FILL = 0x44dd44;
/** Chest outline (black box under the chest tile). */
export const MINIMAP_CHEST_OUTLINE = 0x000000;
export const MINIMAP_CHEST_OUTLINE_ALPHA = 0.9;
/** Chest fill — golden chests vs standard. */
export const MINIMAP_CHEST_GOLDEN = 0xffcc44;
export const MINIMAP_CHEST_NORMAL = 0x66ccff;
/** Camera viewport rectangle (faint white). */
export const MINIMAP_VIEWPORT_STROKE = 0xffffff;
export const MINIMAP_VIEWPORT_ALPHA = 0.3;
/** Edge-warn rectangle (red, only when player is very close to wall). */
export const MINIMAP_WARN_STROKE = 0xff4444;
/** How close (px) to the world edge triggers the warn rectangle. */
export const MINIMAP_WARN_BOUNDARY_MARGIN = 200;
/** Min + max alpha on the warn rectangle as the player approaches the edge. */
export const MINIMAP_WARN_MIN_ALPHA = 0.25;
export const MINIMAP_WARN_MAX_ALPHA = 0.75;

export interface MinimapEdgeWarn {
  /** True when the player is within MINIMAP_WARN_BOUNDARY_MARGIN of any edge. */
  active: boolean;
  /** Alpha in [MINIMAP_WARN_MIN_ALPHA, MINIMAP_WARN_MAX_ALPHA] — 0 when !active. */
  alpha: number;
}

export function resolveMinimapEdgeWarn(
  playerX: number,
  playerY: number,
  worldWidth: number,
  worldHeight: number,
): MinimapEdgeWarn {
  const distToEdge = Math.min(
    playerX,
    playerY,
    worldWidth - playerX,
    worldHeight - playerY,
  );
  if (distToEdge >= MINIMAP_WARN_BOUNDARY_MARGIN) {
    return { active: false, alpha: 0 };
  }
  const t = 1 - distToEdge / MINIMAP_WARN_BOUNDARY_MARGIN;
  const alpha = MINIMAP_WARN_MIN_ALPHA + (MINIMAP_WARN_MAX_ALPHA - MINIMAP_WARN_MIN_ALPHA) * t;
  return { active: true, alpha };
}
