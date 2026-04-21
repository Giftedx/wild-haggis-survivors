/**
 * Route card factory for ActIntermissionScene.
 *
 * Each card is a panel (COLORS.PANEL_SURFACE background) with a warm-gold
 * stroke that brightens on hover, a heading, body description, and a corner
 * shortcut badge. The stroke-based hover is managed internally so the scene
 * doesn't re-implement the POINTER_OVER / POINTER_OUT pair each time.
 *
 * Returns the background rectangle (to wire pointerdown) and a destroy
 * function that tears down all game objects.
 */
import type Phaser from 'phaser';
import type { RouteDef } from '../data/routes';
import { resolveActIntermissionCardStyle } from '../scenes/actIntermissionCardStyle';
import { COLORS, COLORS_CSS } from '../config';
import { textStyle } from './typography';
import { t } from '../core/i18n';

export interface RouteCardOpts {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  route: RouteDef;
  /** 1-based shortcut digit shown in the top-left corner badge. */
  shortcut: number;
  /** UI scale (from settings) — applied to text and wrap widths. Defaults to 1. */
  uiScale?: number;
  /** Called when the card is clicked. */
  onSelect: (route: RouteDef) => void;
}

export interface RouteCardResult {
  /** The background rectangle — interactive, can receive additional listeners. */
  bg: Phaser.GameObjects.Rectangle;
  /** Tears down all Phaser game objects created for this card. */
  destroy: () => void;
}

/**
 * Create a route card with standard panel styling, stroke-based hover, and
 * click-through to the provided callback.
 */
export function createRouteCard(opts: RouteCardOpts): RouteCardResult {
  const { scene, x, y, width: w, height: h, route, shortcut, onSelect } = opts;
  const uiScale = opts.uiScale ?? 1;
  const scaleDiv = Math.max(1, uiScale);
  const cardStyle = resolveActIntermissionCardStyle();

  const bg = scene.add
    .rectangle(x, y, w, h, COLORS.PANEL_SURFACE, 0.98)
    .setStrokeStyle(cardStyle.idle.thickness, cardStyle.idle.color)
    .setInteractive({ useHandCursor: true });

  const heading = scene.add
    .text(x, y - h / 2 + Math.round(24 * uiScale), t(route.labelKey),
      textStyle('heading', { color: COLORS_CSS.TOAST_GOLD, wordWrap: { width: (w - 24) / scaleDiv }, align: 'center' }),
    )
    .setOrigin(0.5, 0)
    .setScale(uiScale);

  const body = scene.add
    .text(x, y, t(route.descKey),
      textStyle('label', { color: COLORS_CSS.COOL_GREY, wordWrap: { width: (w - 24) / scaleDiv }, align: 'center' }),
    )
    .setOrigin(0.5)
    .setScale(uiScale);

  const badge = scene.add
    .text(x - w / 2 + Math.round(12 * uiScale), y - h / 2 + Math.round(10 * uiScale), `${shortcut}`,
      textStyle('label', { color: COLORS_CSS.HINT }),
    )
    .setOrigin(0, 0)
    .setScale(uiScale);

  bg.on('pointerover',  () => bg.setStrokeStyle(cardStyle.hover.thickness, cardStyle.hover.color));
  bg.on('pointerout',   () => bg.setStrokeStyle(cardStyle.idle.thickness,  cardStyle.idle.color));
  bg.on('pointerdown',  () => onSelect(route));

  function destroy(): void {
    bg.destroy();
    heading.destroy();
    body.destroy();
    badge.destroy();
  }

  return { bg, destroy };
}
