import * as Phaser from 'phaser';
import { textStyle } from '../typography';
import type { HudWidgetContext } from './hudWidget';

/**
 * DPS counter — dev/observability HUD element. Hidden in normal play
 * so the bottom-left edge stays clean (the pause menu already shows
 * DPS in the run-stats column). Re-enable with `?devDps=1` in the URL
 * or by setting `window.__SHOW_HUD_DPS = true` before scene.start.
 */
export function buildDpsReadout(ctx: HudWidgetContext): Phaser.GameObjects.Text {
  const { scene, depth: d, viewport } = ctx;
  const { height } = viewport;
  const text = ctx.addEl(
    scene.add.text(12, height - 26, '', textStyle('body', { color: '#8a7a6a' }))
      .setScrollFactor(0).setDepth(d),
  ) as Phaser.GameObjects.Text;
  if (!shouldShowDps()) text.setVisible(false);
  return text;
}

function shouldShowDps(): boolean {
  try {
    const w = window as unknown as { __SHOW_HUD_DPS?: boolean };
    if (w.__SHOW_HUD_DPS === true) return true;
    const params = new URLSearchParams(window.location?.search ?? '');
    return params.get('devDps') === '1';
  } catch {
    return false;
  }
}
