/**
 * Pure layout maths for the loadout (MenuScene) layout.
 *
 * Three points depend on viewport height:
 *   - buttonY:         main action row y-centre, clamped into
 *                      [304, 342] so the buttons don't drift when
 *                      the viewport is very tall.
 *   - panelY:          variant panel y-centre; hugs the buttons
 *                      with a fixed offset, clamped so it never
 *                      pushes off the bottom.
 *   - panelHeight:     144px at uiScale 1; grows with uiScale so the
 *                      scaled variant rows (name / flavor / modifier /
 *                      progress / tally) still fit inside the panel
 *                      at comfort-scale settings.
 *   - ambientEnemyMinY: top boundary for the ambient moor enemy
 *                      drift so they don't encroach on the panel.
 */

/** Proportion of viewport height used to seed buttonY (before clamping). */
export const MENU_BUTTON_Y_FRACTION = 0.49;
/** Clamp bounds for the main action row y-centre. */
export const MENU_BUTTON_Y_MIN = 304;
export const MENU_BUTTON_Y_MAX = 342;
/** Vertical offset from buttonY to panelY (at uiScale 1). */
export const MENU_PANEL_Y_OFFSET = 122;
/** Clamp lower bound on panelY (same as MENU_BUTTON_Y + offset for small viewports). */
export const MENU_PANEL_Y_MIN = 412;
/** Fixed panel height — design target at uiScale 1. */
export const MENU_PANEL_HEIGHT = 144;
/** Extra padding below the panel bottom where ambient enemies stay out. */
const MENU_AMBIENT_ENEMY_PANEL_PAD = 26;

import { clamp } from '../utils/math';

export interface MenuLayout {
  buttonY: number;
  panelY: number;
  panelHeight: number;
  ambientEnemyMinY: number;
}

/**
 * `uiScale` (default 1) scales both the panel height and the gap from
 * buttons to panel so scaled text doesn't collide with the button row
 * above or overflow the panel floor below. buttonY itself is clamped
 * down when uiScale > 1 so the scaled 54px button doesn't crowd the
 * scaled panel from above.
 */
export function computeMenuLayout(height: number, uiScale: number = 1): MenuLayout {
  const scale = Math.max(0.5, uiScale);
  const scaleOver = Math.max(0, scale - 1);
  // At uiScale > 1 the clamp window shifts down: the scaled 54px button
  // rect (76px at 1.4x) needs to sit lower so its TOP doesn't crash into
  // the stats strip at y=274 (ends ~284 scaled), while its BOTTOM stays
  // clear of the scaled variant panel below. Compressing both ends of
  // the clamp window pins the buttons into the narrow safe band.
  const buttonYMin = Math.round(MENU_BUTTON_Y_MIN + scaleOver * 65);
  const buttonYMax = Math.round(MENU_BUTTON_Y_MAX - scaleOver * 30);
  const buttonY = clamp(height * MENU_BUTTON_Y_FRACTION, buttonYMin, Math.max(buttonYMin, buttonYMax));
  const panelHeight = Math.round(MENU_PANEL_HEIGHT * scale);
  const panelOffset = Math.round(MENU_PANEL_Y_OFFSET * scale);
  const panelMinY = Math.round(MENU_PANEL_Y_MIN + scaleOver * (MENU_PANEL_HEIGHT / 2));
  const panelY = clamp(
    buttonY + panelOffset,
    panelMinY,
    Math.max(panelMinY, height - panelOffset),
  );
  const ambientEnemyMinY = Math.floor(panelY + panelHeight / 2 + MENU_AMBIENT_ENEMY_PANEL_PAD);
  return { buttonY, panelY, panelHeight, ambientEnemyMinY };
}
