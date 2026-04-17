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
 *   - panelHeight:     fixed 144px — MenuScene's design target.
 *   - ambientEnemyMinY: top boundary for the ambient moor enemy
 *                      drift so they don't encroach on the panel.
 */

/** Proportion of viewport height used to seed buttonY (before clamping). */
export const MENU_BUTTON_Y_FRACTION = 0.49;
/** Clamp bounds for the main action row y-centre. */
export const MENU_BUTTON_Y_MIN = 304;
export const MENU_BUTTON_Y_MAX = 342;
/** Vertical offset from buttonY to panelY. */
export const MENU_PANEL_Y_OFFSET = 122;
/** Clamp lower bound on panelY (same as MENU_BUTTON_Y + offset for small viewports). */
export const MENU_PANEL_Y_MIN = 412;
/** Fixed panel height — design target. */
export const MENU_PANEL_HEIGHT = 144;
/** Extra padding below the panel bottom where ambient enemies stay out. */
export const MENU_AMBIENT_ENEMY_PANEL_PAD = 26;

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

export interface MenuLayout {
  buttonY: number;
  panelY: number;
  panelHeight: number;
  ambientEnemyMinY: number;
}

export function computeMenuLayout(height: number): MenuLayout {
  const buttonY = clamp(height * MENU_BUTTON_Y_FRACTION, MENU_BUTTON_Y_MIN, MENU_BUTTON_Y_MAX);
  const panelY = clamp(
    buttonY + MENU_PANEL_Y_OFFSET,
    MENU_PANEL_Y_MIN,
    Math.max(MENU_PANEL_Y_MIN, height - MENU_PANEL_Y_OFFSET),
  );
  const panelHeight = MENU_PANEL_HEIGHT;
  const ambientEnemyMinY = Math.floor(panelY + panelHeight / 2 + MENU_AMBIENT_ENEMY_PANEL_PAD);
  return { buttonY, panelY, panelHeight, ambientEnemyMinY };
}
