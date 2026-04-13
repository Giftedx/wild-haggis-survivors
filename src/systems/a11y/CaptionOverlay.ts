/**
 * CaptionOverlay — Phaser-side renderer for the CaptionManager.
 *
 * Positioned near the bottom of the screen in HUD space (scrollFactor 0).
 * Renders up to N text lines with a soft dark backdrop, each fading out
 * over the last 400ms of its lifetime. No layout gymnastics — each line
 * is vertically offset, oldest on top so new captions don't shove the
 * player's current read off screen mid-sentence.
 */
import Phaser from 'phaser';
import { CaptionManager } from './CaptionManager';
import { getSettingsManager } from '../../core/SettingsManager';
import { getCameraViewport } from '../../ui/cameraViewport';
import {
  CAPTION_FADE_OUT_MS,
  captionFadeAlpha,
  captionStackYOffset,
} from './captionOverlayLayout';

const BACKDROP_COLOR = 0x0a0a12;
const BACKDROP_ALPHA = 0.72;
const DEFAULT_TINT = '#f4e8c8';
const DEPTH = 95; // above HUD (80–90 range), below pause overlays (500+)
const LINE_SPACING = 30;
const BASE_FONT_PX = 18;
const BOTTOM_INSET = 96; // pixels above bottom edge of the viewport

interface LineView {
  backdrop: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

export class CaptionOverlay {
  private scene: Phaser.Scene;
  private manager: CaptionManager;
  private pool: LineView[] = [];

  constructor(scene: Phaser.Scene, manager: CaptionManager, poolSize: number = 4) {
    this.scene = scene;
    this.manager = manager;
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(this.createLine());
    }
  }

  /** Called each update from the owning scene. `deltaMs` in raw ms. */
  update(deltaMs: number): void {
    // Captions keep ticking even when gameplay is paused — a boss warning
    // landing just before a pause shouldn't vanish mid-fade.
    this.manager.update(deltaMs);

    const captions = this.manager.getActive();
    const enabled = getSettingsManager().load().captionsEnabled;

    const { x: vx, y: vy, width: vw, height: vh } = getCameraViewport(this.scene);
    const baseY = vy + vh - BOTTOM_INSET;
    const centerX = vx + vw / 2;

    for (let i = 0; i < this.pool.length; i++) {
      const line = this.pool[i];
      const cap = enabled ? captions[i] : undefined;
      if (!cap) {
        line.backdrop.setVisible(false);
        line.text.setVisible(false);
        continue;
      }

      const alpha = captionFadeAlpha(cap.remainingMs, CAPTION_FADE_OUT_MS);

      line.text.setText(cap.message);
      line.text.setColor(cap.tint ?? DEFAULT_TINT);
      line.text.setFontSize(`${BASE_FONT_PX}px`);
      const paddedWidth = line.text.width + 24;
      const paddedHeight = line.text.height + 10;

      const yOffset = captionStackYOffset(i, captions.length, LINE_SPACING);
      const ly = baseY + yOffset;

      line.backdrop.setPosition(centerX, ly);
      line.backdrop.setSize(paddedWidth, paddedHeight);
      line.backdrop.setAlpha(BACKDROP_ALPHA * alpha);
      line.backdrop.setVisible(true);

      line.text.setPosition(centerX, ly);
      line.text.setAlpha(alpha);
      line.text.setVisible(true);
    }
  }

  destroy(): void {
    for (const l of this.pool) {
      l.backdrop.destroy();
      l.text.destroy();
    }
    this.pool = [];
  }

  private createLine(): LineView {
    const backdrop = this.scene.add
      .rectangle(0, 0, 200, 28, BACKDROP_COLOR, BACKDROP_ALPHA)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setVisible(false)
      .setStrokeStyle(1, 0x2a2a38, 0.6);
    const text = this.scene.add
      .text(0, 0, '', {
        fontSize: `${BASE_FONT_PX}px`,
        color: DEFAULT_TINT,
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setVisible(false);
    return { backdrop, text };
  }
}
