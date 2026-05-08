import * as Phaser from 'phaser';
import { textStyle } from '../typography';
import { computeMinTapHitArea } from '../../utils/touchTargets';
import type { HudWidgetContext } from './hudWidget';

/**
 * Pause button — right-anchored top edge.
 *
 * W95 — explicit ≥44pt hit area so the bare "| |" glyphs (≈18×24px)
 * hit the iOS HIG / Android Material minimum tap target on phones.
 *
 * Caller wires pointerdown / pointerover / pointerout handlers after
 * construction since `onPause` is mutable (set later via `setOnPause`).
 */
export function buildPauseButton(ctx: HudWidgetContext): Phaser.GameObjects.Text {
  const { scene, depth: d, viewport } = ctx;
  const { width } = viewport;
  const text = ctx.addEl(
    scene.add.text(width - 12, 40, '| |', textStyle('heading', { fontSize: '24px', color: '#b8a88a' }))
      .setOrigin(1, 0).setScrollFactor(0).setDepth(d + 1),
  ) as Phaser.GameObjects.Text;
  const hit = computeMinTapHitArea(text.width, text.height, { x: 1, y: 0 });
  text.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(hit.x, hit.y, hit.width, hit.height),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  } as Phaser.Types.Input.InputConfiguration);
  return text;
}
