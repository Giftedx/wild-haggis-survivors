/**
 * NodeMapUI — thin Phaser adapter for the Moor Road node-map HUD widget.
 *
 * Geometry + palette live in `nodeMapUiLayout.ts` (unit-tested); this
 * class just translates a layout into Phaser draw calls. Corner-anchored
 * top-right, scales with the live `uiScale` setting, hides when no map
 * is set (between acts).
 */

import * as Phaser from 'phaser';
import { COLORS } from '../config';
import { getSettingsManager } from '../core/SettingsManager';
import { t } from '../core/i18n';
import type { NodeMapState } from '../systems/NodeMapSystem';
import {
  NODE_ICON_CURRENT_STROKE,
  NODE_ICON_DEFAULT_STROKE,
  NODE_ICON_FILL,
  NODE_ICON_VISITED_ALPHA,
  computeNodeMapBarLayout,
  nodeMapProgressPosition,
} from './nodeMapUiLayout';

const MARGIN_X = 14;
const MARGIN_Y = 14;
const DEPTH = 48;

export class NodeMapUI {
  private readonly scene: Phaser.Scene;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.bg = scene.add
      .rectangle(0, 0, 1, 1, 0x0a0a10, 0.65)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x2a2a32, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setVisible(false);

    this.gfx = scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setVisible(false);

    this.label = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d4a017',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2)
      .setVisible(false);
  }

  /**
   * Redraw the widget. Pass `null` to hide (between acts / during boss).
   */
  update(map: NodeMapState | null, currentIndex: number): void {
    if (!map || map.nodes.length === 0) {
      this.setVisible(false);
      return;
    }

    const { uiScale } = getSettingsManager().load();
    const width = this.scene.scale.width;
    const anchorX = width - MARGIN_X;
    const anchorY = MARGIN_Y;

    const layout = computeNodeMapBarLayout(map, currentIndex, {
      anchorX,
      anchorY,
      uiScale,
      expanded: true,
    });

    this.bg
      .setPosition(layout.bgX, layout.bgY)
      .setDisplaySize(layout.bgW, layout.bgH)
      .setVisible(true);

    const progress = nodeMapProgressPosition(currentIndex, map.nodes.length);
    this.label
      .setPosition(layout.labelCx, layout.labelCy)
      .setText(
        t('nodes.ui.progress', {
          act: String(map.act),
          current: String(progress.current),
          total: String(progress.total),
        }),
      )
      .setFontSize(Math.round(12 * uiScale))
      .setVisible(true);

    this.gfx.clear();
    this.gfx.setVisible(true);
    for (const icon of layout.icons) {
      const fill = NODE_ICON_FILL[icon.type];
      const alpha = icon.visited ? NODE_ICON_VISITED_ALPHA : 1;
      this.gfx.fillStyle(fill, alpha);
      this.gfx.fillRect(icon.cx - icon.size / 2, icon.cy - icon.size / 2, icon.size, icon.size);

      const strokeColor = icon.current ? NODE_ICON_CURRENT_STROKE : NODE_ICON_DEFAULT_STROKE;
      const strokeAlpha = icon.current ? 1 : 0.7;
      this.gfx.lineStyle(icon.current ? 2 : 1, strokeColor, strokeAlpha);
      this.gfx.strokeRect(icon.cx - icon.size / 2, icon.cy - icon.size / 2, icon.size, icon.size);
    }
  }

  setVisible(visible: boolean): void {
    this.bg.setVisible(visible);
    this.gfx.setVisible(visible);
    this.label.setVisible(visible);
  }

  destroy(): void {
    this.bg.destroy();
    this.gfx.destroy();
    this.label.destroy();
  }
}

// Silences an "unused import" complaint when the module is pulled in by
// tests that only use the layout helper — the COLORS constant is held
// here so future extensions (per-palette label colour) have an anchor.
void COLORS;
