/**
 * Wee Tale render — single italic prose epitaph closing the run.
 *
 * Sits between the variant / curse chips at the head of the Game
 * Over panel and the weapon-damage / gold / unlock inner panels.
 * The line is picked via the tag-driven `pickWeeTale` from a
 * `WeeTaleContext` built from the payload; seeded determinism
 * comes from a sub-RNG branched off the run seed (so the same run
 * always closes with the same line, even if the scene is destroyed
 * and recreated — e.g. screenshot-back-to-result-screen).
 *
 * The helper resolves boss / source / variant keys to display
 * names through `getEnemyDisplayName` + `formatRunVariantLabel`
 * before substituting into the i18n template, so a template that
 * references `{boss}` reads "Gordon" rather than "gordon".
 *
 * Architectural note: lives in `game-over/` alongside the other
 * row helpers but keeps its Phaser surface minimal — adds one
 * `Phaser.GameObjects.Text` and a fade-in tween. Returns the
 * mounted text object so callers can inspect / dispose if needed
 * (E2E uses this to query the rendered string).
 */
import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { textStyle } from '../../ui/typography';
import type { GameOverPayload } from '../gameOverPayload';
import { buildGameOverWeeTaleLine } from './gameOverWeeTaleLine';

export {
  buildWeeTaleContextFromPayload,
  resolveWeeTaleDisplayNames,
} from './gameOverWeeTaleLine';

export interface RenderGameOverWeeTaleOpts {
  scene: Phaser.Scene;
  payload: GameOverPayload;
  /** Centre X of the Game Over panel. */
  panelCenterX: number;
  /** Y at which to render the italic prose line. */
  centerY: number;
  /** Max width before Phaser wraps the line. */
  maxWidth: number;
  uiScale: number;
  depth: number;
}

/**
 * Render the wee tale onto the scene. Returns the mounted text
 * object (or `null` if the picker produced no matching template —
 * in production the catalogue's `death` / `victory` fallbacks
 * guarantee a match, so `null` only happens on a deliberate test-
 * mode skip).
 */
export function renderGameOverWeeTale(
  opts: RenderGameOverWeeTaleOpts,
): Phaser.GameObjects.Text | null {
  const { scene, payload, panelCenterX, centerY, maxWidth, uiScale, depth } = opts;

  const tale = buildGameOverWeeTaleLine(payload);
  if (tale === null) return null;

  const text = scene.add
    // `subtitle` role is italic by design (FONT_SCALE in
    // `ui/typography.ts`) — no need to override fontStyle.
    .text(panelCenterX, centerY, tale.line, textStyle('subtitle', {
      fontSize: '15px',
      color: COLORS_CSS.DUSTY_TAN,
      align: 'center',
      wordWrap: { width: Math.max(120, Math.floor(maxWidth)) },
    }))
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setScale(uiScale)
    .setData('weeTaleKey', tale.i18nKey);

  scene.tweens.add({ targets: text, alpha: 1, duration: 360, delay: 520 });

  return text;
}
