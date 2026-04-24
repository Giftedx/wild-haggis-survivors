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
import { GRAN_FRAME_COUNT, GRAN_TEXTURE_KEYS } from '../art/sprites/croft/gran';
import { HEARTH_FRAME_COUNT, HEARTH_TEXTURE_KEYS } from '../art/sprites/croft/hearth';
import { CroftAmbientLoop } from './croft/CroftMusic';
import { route, type CroftActionKey } from './croft/CroftInteractionRouter';
import { createGameButton } from '../ui/gameButton';
import { audio } from '../systems/AudioSystem';
import { SaveManager } from '../core/SaveManager';
import { loadSave } from '../utils/save';
import { computeAllTrophies } from './croft/CroftTrophies';
import { drawMantelpieceTrophies } from '../art/sprites/croft/mantelpiece';
import { drawPhotoWall } from '../art/sprites/croft/photoWall';

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
  private granSprite: Phaser.GameObjects.Sprite | null = null;
  private knittingTimer: Phaser.Time.TimerEvent | null = null;
  private knittingFrame = 0;
  private hearthSprite: Phaser.GameObjects.Sprite | null = null;
  private hearthTimer: Phaser.Time.TimerEvent | null = null;
  private hearthFrame = 0;
  private ambient: CroftAmbientLoop | null = null;
  private mantelGfx: Phaser.GameObjects.Graphics | null = null;
  private photoWallGfx: Phaser.GameObjects.Graphics | null = null;

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
    this.granSprite?.destroy();
    this.granSprite = null;
    this.knittingTimer?.remove(false);
    this.knittingTimer = null;
    this.knittingFrame = 0;
    this.hearthSprite?.destroy();
    this.hearthSprite = null;
    this.hearthTimer?.remove(false);
    this.hearthTimer = null;
    this.hearthFrame = 0;
    this.mantelGfx?.destroy();
    this.mantelGfx = null;
    this.photoWallGfx?.destroy();
    this.photoWallGfx = null;

    const { width } = this.scale;
    const { uiScale, highContrastUi } = getSettingsManager().load();
    const layout = layoutCroft({ uiScale, width: this.scale.width, height: this.scale.height });

    addSceneBackdrop(this);
    addAmberHeaderWash(this);

    this.drawComposition(layout, highContrastUi);
    this.drawMantelpiece(layout);
    this.drawPhotoWall(layout);
    this.drawHearth(layout);
    this.drawGran(layout);
    this.drawHeader(width);
    this.drawActions();
    this.drawBack();

    // Keyboard ESC returns to Menu.
    this.input.keyboard?.on('keydown-ESC', () => this.exitToMenu());

    // Warm pibroch-soft bed starts quiet and fades in.
    this.ambient = new CroftAmbientLoop();
    this.ambient.start();
    this.events.once('shutdown', () => this.ambient?.stop());

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
      // Real drawers now own these elements — skip placeholders.
      if (key === 'gran' || key === 'hearth' || key === 'mantelpiece' || key === 'photoWall') continue;
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

  /**
   * Draw the mantelpiece shelf with one trophy slot per canonical
   * boss (see CroftTrophies.TROPHY_BOSS_KEYS). Trophy art tier is
   * resolved from the current save — kills / cursed wins promote
   * the slot to 'first' / 'tenth' / 'cursed' variants.
   */
  private drawMantelpiece(layout: CroftLayout): void {
    const save = loadSave();
    const trophies = computeAllTrophies(save);
    const gfx = this.add.graphics();
    drawMantelpieceTrophies(gfx, trophies, layout.mantelpiece);
    this.mantelGfx = gfx;
  }

  /**
   * Draw the photo wall — one polaroid per canonical Moor Road route.
   * Visited routes (present in `firstRouteVisits`) show full colour;
   * unvisited sit as sepia placeholders waiting to be earned.
   */
  private drawPhotoWall(layout: CroftLayout): void {
    const save = loadSave();
    const gfx = this.add.graphics();
    drawPhotoWall(gfx, layout.photoWall, save.firstRouteVisits);
    this.photoWallGfx = gfx;
  }

  /**
   * Display the hearth sprite and tick its 4-frame flicker at ~8 fps.
   */
  private drawHearth(layout: CroftLayout): void {
    const sprite = this.add
      .sprite(layout.hearth.x, layout.hearth.y, HEARTH_TEXTURE_KEYS[0])
      .setOrigin(0.5, 0.5)
      .setScale(layout.spriteScale * 1.4);
    this.hearthSprite = sprite;
    this.hearthTimer = this.time.addEvent({
      delay: 125,
      loop: true,
      callback: () => {
        this.hearthFrame = (this.hearthFrame + 1) % HEARTH_FRAME_COUNT;
        sprite.setTexture(HEARTH_TEXTURE_KEYS[this.hearthFrame]);
      },
    });
  }

  /**
   * Display Gran at her layout anchor and tick through her 3 knitting
   * frames at ~4 fps. Frame swap uses `scene.time.addEvent` so it
   * participates in the scene pause/resume lifecycle cleanly.
   */
  private drawGran(layout: CroftLayout): void {
    const sprite = this.add
      .sprite(layout.gran.x, layout.gran.y, GRAN_TEXTURE_KEYS[0])
      .setOrigin(0.5, 0.6)
      .setScale(layout.spriteScale * 2);
    this.granSprite = sprite;
    this.knittingTimer = this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        this.knittingFrame = (this.knittingFrame + 1) % GRAN_FRAME_COUNT;
        sprite.setTexture(GRAN_TEXTURE_KEYS[this.knittingFrame]);
      },
    });
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

  /**
   * Right-column action buttons. Order top-to-bottom:
   *   Start Run (primary) → Shop → Album → Wireless. Each button
   *   routes through CroftInteractionRouter so sub-view vs. leaving
   *   semantics are a single source of truth. "Start Run" additionally
   *   clears the active-run slot before transitioning (same commit
   *   behaviour that MenuScene's PLAY button used to carry).
   */
  private drawActions(): void {
    const { width, height } = this.scale;
    const x = width - 88;
    const baseY = Math.max(120, height * 0.36);
    const gapY = 52;
    const actions: ReadonlyArray<{ key: CroftActionKey; i18n: string; tier: 'primary' | 'secondary' }> = [
      { key: 'start_run', i18n: 'ui.croft.actions.start_run', tier: 'primary' },
      { key: 'shop', i18n: 'ui.croft.actions.shop', tier: 'secondary' },
      { key: 'chronicle', i18n: 'ui.croft.actions.chronicle', tier: 'secondary' },
      { key: 'settings', i18n: 'ui.croft.actions.settings', tier: 'secondary' },
    ];

    actions.forEach((action, idx) => {
      const { rect, label } = createGameButton(this, {
        x,
        y: baseY + gapY * idx,
        width: 160,
        height: 40,
        label: t(action.i18n),
        tier: action.tier,
      });
      rect.on('pointerdown', () => this.handleAction(action.key));
      this.placeholders.push(rect, label);
    });
  }

  private handleAction(key: CroftActionKey): void {
    if (this.transitioning) return;
    audio.playClick();
    const r = route(key);
    // Start Run is the one action that commits — wipe any suspended
    // run so the Curse picker opens on a fresh slate (matches the
    // contract that used to live on MenuScene's PLAY button).
    if (key === 'start_run') {
      try { new SaveManager().clearActiveRun(); } catch { /* best-effort */ }
    }
    this.transitioning = true;
    startSceneFadeOut(this, SCENE_FADE_OUT_MS, () => {
      this.scene.start(r.target);
    });
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
