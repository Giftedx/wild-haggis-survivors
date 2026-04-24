import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { addSceneBackdrop, addAmberHeaderWash, addSceneFadeIn, startSceneFadeOut, SCENE_FADE_OUT_MS } from './sceneFade';
import { sceneHeaderTextStyle, sceneSubtitleTextStyle } from './sceneHeaderStyle';
import { createBackButton } from './createBackButton';
import { getSettingsManager } from '../core/SettingsManager';
import {
  CROFT_DRAW_ORDER,
  CROFT_SCENE_KEY,
  layoutCroft,
  type CroftLayout,
} from './croft/CroftComposition';

/**
 * H1 Gran's Croft — persistent between-runs hub that grows with the
 * player's progress (boss trophies, route polaroids, variant drove,
 * seasonal props). M1 ships the scaffold: backdrop, header, Gran
 * placeholder, hearth placeholder, ESC-to-Menu. Later milestones
 * layer in proper procedural sprites (T3/T4) and trophy data (M2).
 *
 * Scene key: 'Croft'. Entered from MenuScene (post-T7) and
 * GameScene run-end (post-T9).
 *
 * Non-goals at this milestone:
 *  - Real trophy state (M2).
 *  - Variant drove silhouettes (M3).
 *  - Seasonal props auto-swap (M3 + E1 coupling).
 */
export class CroftScene extends Phaser.Scene {
  private transitioning = false;
  private placeholders: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: CROFT_SCENE_KEY });
  }

  create(): void {
    // Scene reuse: `scene.start('Croft')` reuses the same instance —
    // wipe transient state so we never carry over from a prior
    // entry (see CLAUDE.md "Scene reuse" gotcha).
    this.transitioning = false;
    this.placeholders.forEach((obj) => obj.destroy());
    this.placeholders = [];

    const { width } = this.scale;
    const { uiScale, highContrastUi } = getSettingsManager().load();
    const layout = layoutCroft({ uiScale, width: this.scale.width, height: this.scale.height });

    addSceneBackdrop(this);
    addAmberHeaderWash(this);

    this.drawComposition(layout, highContrastUi);
    this.drawHeader(width);
    this.drawBack();

    // Keyboard ESC returns to Menu.
    this.input.keyboard?.on('keydown-ESC', () => this.exitToMenu());

    addSceneFadeIn(this, 300);
  }

  /**
   * Paint placeholder rectangles for every element from the layout
   * draw order. T3 replaces `gran` + T4 replaces `hearth` with
   * proper procedural sprite drawers. Remaining placeholders stay
   * until M2/M3 fill them in.
   */
  private drawComposition(layout: CroftLayout, highContrast: boolean): void {
    const alphaFill = highContrast ? 0.4 : 0.22;
    const alphaStroke = highContrast ? 0.9 : 0.6;
    for (const key of CROFT_DRAW_ORDER) {
      const el = layout[key];
      const w = 'w' in el ? el.w : 48 * layout.spriteScale;
      const h = 'h' in el ? el.h : 48 * layout.spriteScale;
      const color = placeholderColor(key);
      const rect = this.add
        .rectangle(el.x, el.y, w, h, color, alphaFill)
        .setStrokeStyle(1, color, alphaStroke);
      this.placeholders.push(rect);
    }
  }

  private drawHeader(width: number): void {
    const title = this.add
      .text(width / 2, 50, t('ui.croft.title'), sceneHeaderTextStyle(COLORS_CSS.WHISKY_GOLD))
      .setOrigin(0.5);
    const subtitle = this.add
      .text(width / 2, 90, t('ui.croft.subtitle'), sceneSubtitleTextStyle(COLORS_CSS.WARM_TAN, width))
      .setOrigin(0.5);
    const greet = this.add
      .text(width / 2, 118, t('ui.croft.gran_greet'), sceneSubtitleTextStyle(COLORS_CSS.DUSTY_TAN, width))
      .setOrigin(0.5);
    this.placeholders.push(title, subtitle, greet);
  }

  private drawBack(): void {
    const { width, height } = this.scale;
    const backRect = createBackButton(this, {
      x: width / 2,
      y: height - 30,
      width: 240,
      height: 36,
      label: t('ui.croft.back'),
      fontSize: '18px',
    });
    backRect.on('pointerdown', () => this.exitToMenu());
    this.placeholders.push(backRect);
  }

  private exitToMenu(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    startSceneFadeOut(this, SCENE_FADE_OUT_MS, () => {
      this.scene.start('Menu');
    });
  }
}

/**
 * Placeholder colour per element so M1 screenshot reviews can see the
 * composition at a glance. Replaced element-by-element as proper
 * sprite drawers ship in later tasks.
 */
function placeholderColor(key: string): number {
  switch (key) {
    case 'gran': return COLORS.WHISKY_GOLD;
    case 'hearth': return COLORS.SPRITE_RED;
    case 'mantelpiece': return COLORS.STONE;
    case 'photoWall': return COLORS.PANEL_SURFACE;
    case 'drove': return COLORS.HEATHER;
    case 'bookshelf': return COLORS.STONE;
    case 'wireless': return COLORS.COMMON;
    case 'windowView': return COLORS.SKY;
    case 'table': return COLORS.STONE;
    case 'rug': return COLORS.HEATHER;
    case 'thistle': return COLORS.HEATHER;
    default: return COLORS.PANEL;
  }
}
