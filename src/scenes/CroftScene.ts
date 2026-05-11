import * as Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { addSceneBackdrop, addAmberHeaderWash, addSceneFadeIn, startSceneFadeOut, SCENE_FADE_OUT_MS } from './sceneFade';
import { sceneHeaderTextStyle, sceneSubtitleTextStyle } from './sceneHeaderStyle';
import { createBackButton } from './createBackButton';
import { getSettingsManager } from '../core/SettingsManager';
import {
  CROFT_SCENE_KEY,
  layoutCroft,
  type CroftLayout,
} from './croft/CroftComposition';
import { GRAN_FRAME_COUNT, GRAN_TEXTURE_KEYS } from '../art/sprites/croft/gran';
import { HEARTH_FRAME_COUNT, HEARTH_TEXTURE_KEYS } from '../art/sprites/croft/hearth';
import { POSTIE_FRAME_COUNT, POSTIE_TEXTURE_KEYS } from '../art/sprites/croft/postie';
import { NEIGHBOUR_FRAME_COUNT, NEIGHBOUR_TEXTURE_KEYS } from '../art/sprites/croft/neighbour';
import { SHEEPDOG_STAND_FRAME_COUNT, SHEEPDOG_STAND_TEXTURE_KEYS } from '../art/sprites/croft/sheepdogStanding';
import { WEANS_TEXTURE_KEY } from '../art/sprites/croft/weans';
import { RETURNING_PAL_TEXTURE_KEY } from '../art/sprites/croft/returningPal';
import { CroftAmbientLoop } from './croft/CroftMusic';
import { route, type CroftActionKey } from './croft/CroftInteractionRouter';
import { startRunTargetForCroft, visibleCroftActions } from './croftProgressiveDisclosure';
import { createGameButton } from '../ui/gameButton';
import { GamepadMenuNav, type GamepadMenuEntry } from '../utils/GamepadMenuNav';
import { audio } from '../systems/AudioSystem';
import { SaveManager } from '../core/SaveManager';
import { loadSave, writeSave } from '../utils/save';
import { computeAllTrophies } from './croft/CroftTrophies';
import { drawMantelpieceTrophies, computeTrophySlotXs } from '../art/sprites/croft/mantelpiece';
import { TROPHY_BOSS_KEYS } from './croft/CroftTrophies';
import { textStyle } from '../ui/typography';
import { drawPhotoWall } from '../art/sprites/croft/photoWall';
import { drawDrove, type DroveSlot } from '../art/sprites/croft/drove';
import { drawCroftActionBoard, drawCroftInterior } from '../art/sprites/croft/interior';
import { drawSeasonalProps } from '../art/sprites/croft/seasonalProps';
import { drawWarmthProps } from '../art/sprites/croft/warmthProps';
import { drawCroftKeepsakes } from '../art/sprites/croft/keepsakes';
import {
  beastiesDiscoverySummary,
  buildBeastiesEntries,
} from './almanac/buildBeastiesEntries';
import { getActiveSeasonalEventKey } from '../systems/SeasonalEventManager';
import { installSeasonalEventBanner, type SeasonalBannerHandle } from '../ui/SeasonalEventBanner';
import { returnTargetData } from './returnTarget';
import { buildLivingWorldTracks, livingWorldTracksSummary } from './croft/livingWorldTracks';
import {
  buildCompanionPickerRows,
  resolveNextSelection,
  type CompanionPickerRow,
} from './croft/companionPicker';
import { setSelectedCompanion } from '../utils/save/bumpers';

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
  /**
   * Wild Living World Phase 2 — picker panel container, tracked so
   * the click-to-pick redraw destroys ONLY the picker and rebuilds
   * it (vs. wiping the whole scene's placeholder list).
   */
  private companionPickerContainer: Phaser.GameObjects.Container | null = null;
  private granSprite: Phaser.GameObjects.Sprite | null = null;
  private knittingTimer: Phaser.Time.TimerEvent | null = null;
  private knittingFrame = 0;
  private hearthSprite: Phaser.GameObjects.Sprite | null = null;
  private hearthTimer: Phaser.Time.TimerEvent | null = null;
  private hearthFrame = 0;
  private postieSprite: Phaser.GameObjects.Sprite | null = null;
  private postieTimer: Phaser.Time.TimerEvent | null = null;
  private postieFrame = 0;
  private neighbourSprite: Phaser.GameObjects.Sprite | null = null;
  private neighbourTimer: Phaser.Time.TimerEvent | null = null;
  private neighbourFrame = 0;
  private sheepdogSprite: Phaser.GameObjects.Sprite | null = null;
  private sheepdogTimer: Phaser.Time.TimerEvent | null = null;
  private sheepdogFrame = 0;
  private ambient: CroftAmbientLoop | null = null;
  private interiorGfx: Phaser.GameObjects.Graphics | null = null;
  private actionBoardGfx: Phaser.GameObjects.Graphics | null = null;
  private mantelGfx: Phaser.GameObjects.Graphics | null = null;
  private photoWallGfx: Phaser.GameObjects.Graphics | null = null;
  private droveGfx: Phaser.GameObjects.Graphics | null = null;
  private droveSlots: DroveSlot[] = [];
  private droveHits: Phaser.GameObjects.Rectangle[] = [];
  private warmthPropsGfx: Phaser.GameObjects.Graphics | null = null;
  private keepsakePropsGfx: Phaser.GameObjects.Graphics | null = null;
  private seasonalPropsGfx: Phaser.GameObjects.Graphics | null = null;
  private seasonalBanner: SeasonalBannerHandle | null = null;
  private bookshelfHit: Phaser.GameObjects.Rectangle | null = null;
  private gamepadNav: GamepadMenuNav | null = null;
  private actionEntries: Array<{ key: CroftActionKey; rect: Phaser.GameObjects.Rectangle }> = [];
  private trophyHits: Phaser.GameObjects.Rectangle[] = [];
  private granBubble: Phaser.GameObjects.Container | null = null;
  private granBubbleTimer: Phaser.Time.TimerEvent | null = null;

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
    // Wild Living World Phase 2 — companion picker is tracked
    // separately from `placeholders` (click-to-redraw owns its
    // lifetime). Destroy here so a reused scene instance starts
    // with a clean ref before `drawCompanionPicker` reassigns.
    this.companionPickerContainer?.destroy();
    this.companionPickerContainer = null;
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
    this.postieSprite?.destroy();
    this.postieSprite = null;
    this.postieTimer?.remove(false);
    this.postieTimer = null;
    this.postieFrame = 0;
    this.neighbourSprite?.destroy();
    this.neighbourSprite = null;
    this.neighbourTimer?.remove(false);
    this.neighbourTimer = null;
    this.neighbourFrame = 0;
    this.sheepdogSprite?.destroy();
    this.sheepdogSprite = null;
    this.sheepdogTimer?.remove(false);
    this.sheepdogTimer = null;
    this.sheepdogFrame = 0;
    this.mantelGfx?.destroy();
    this.mantelGfx = null;
    this.photoWallGfx?.destroy();
    this.photoWallGfx = null;
    this.droveGfx?.destroy();
    this.droveGfx = null;
    this.droveSlots = [];
    this.droveHits.forEach((r) => r.destroy());
    this.droveHits = [];
    this.warmthPropsGfx?.destroy();
    this.warmthPropsGfx = null;
    this.keepsakePropsGfx?.destroy();
    this.keepsakePropsGfx = null;
    this.seasonalPropsGfx?.destroy();
    this.seasonalPropsGfx = null;
    this.seasonalBanner?.destroy();
    this.seasonalBanner = null;
    this.bookshelfHit?.destroy();
    this.bookshelfHit = null;
    this.gamepadNav?.destroy();
    this.gamepadNav = null;
    this.actionEntries = [];
    this.trophyHits.forEach((r) => r.destroy());
    this.trophyHits = [];
    this.granBubble?.destroy();
    this.granBubble = null;
    this.granBubbleTimer?.remove(false);
    this.granBubbleTimer = null;
    // T405 belt-and-braces — the shutdown handler stops `ambient` on
    // scene exit, but pairing the cleanup here too means a `start('Croft')`
    // call that races the prior shutdown still hands a fresh field to
    // the new `CroftAmbientLoop` rather than overwriting a live one.
    this.ambient?.stop();
    this.ambient = null;
    this.interiorGfx?.destroy();
    this.interiorGfx = null;
    this.actionBoardGfx?.destroy();
    this.actionBoardGfx = null;

    const { width } = this.scale;
    const { uiScale, highContrastUi } = getSettingsManager().load();
    const layout = layoutCroft({ uiScale, width: this.scale.width, height: this.scale.height });

    addSceneBackdrop(this);
    addAmberHeaderWash(this);

    const isMobileCroft = this.scale.width < 600;
    this.drawInterior(layout, { includePhotoWall: !isMobileCroft });
    this.drawComposition(layout, highContrastUi);
    this.drawMantelpiece(layout);
    // P1.7 — below 600 px the right-edge action button column overlaps the
    // photo wall (buttons run from width-168 to width-8; wall sits at
    // 0.62w..0.82w, which maps to 242-320 on a 390 viewport). Hide the
    // decorative wall on mobile so the buttons read cleanly. Polaroids are
    // ambient flavor — desktop / tablet keep them.
    if (!isMobileCroft) this.drawPhotoWall(layout);
    this.drawDroveWindow(layout);
    this.drawHearth(layout);
    this.drawGran(layout);
    this.drawVisitors(layout);
    this.drawWarmth(layout);
    this.drawKeepsakes(layout, { includeWallKeepsakes: !isMobileCroft });
    this.drawSeasonal(layout);
    this.drawBookshelfHit(layout);
    this.drawHeader(width);
    this.drawActions();
    this.drawLivingWorldPanel(layout);
    this.drawCompanionPicker(layout);
    this.drawBack();
    // E1 M4 T22 — seasonal banner appears only when an event window
    // is live; the helper itself handles the no-op path.
    this.seasonalBanner = installSeasonalEventBanner(this);

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
   * draw order whose proper sprite hasn't shipped yet. Pre-fix the
   * placeholders were drawn at alphaFill 0.22 / stroke 0.6 — they
   * read as "broken UI rectangles" in the audit (top-left blue square,
   * lower purple/grey rects). Now drawn at the lowest legible alpha
   * so they read as decorative props rather than missing assets.
   * High-contrast still gets a stronger draw so the scene's
   * affordances stay perceivable.
   */
  private drawComposition(_layout: CroftLayout, _highContrast: boolean): void {
    // The full Croft interior now owns the room silhouette and contrast.
    // This hook remains so older smoke tests and call order stay stable.
  }

  private drawInterior(layout: CroftLayout, opts: { includePhotoWall: boolean }): void {
    const gfx = this.add.graphics();
    gfx.setDepth(0);
    drawCroftInterior(gfx, layout, opts);
    this.interiorGfx = gfx;
  }

  /**
   * Draw the mantelpiece shelf with one trophy slot per canonical
   * boss (see CroftTrophies.TROPHY_BOSS_KEYS). Trophy art tier is
   * resolved from the current save — kills / cursed wins promote
   * the slot to 'first' / 'tenth' / 'cursed' variants.
   *
   * Each slot gets an invisible interactive hit rectangle on top so
   * clicking a trophy fires a Gran-voice quip (T17).
   */
  private drawMantelpiece(layout: CroftLayout): void {
    const save = loadSave();
    const trophies = computeAllTrophies(save);
    const gfx = this.add.graphics();
    gfx.setDepth(24);
    drawMantelpieceTrophies(gfx, trophies, layout.mantelpiece);
    this.mantelGfx = gfx;

    const shelf = layout.mantelpiece;
    const xs = computeTrophySlotXs(shelf.x, shelf.w, TROPHY_BOSS_KEYS.length);
    const hitY = shelf.y - 10;
    const hitW = Math.max(20, shelf.w / (TROPHY_BOSS_KEYS.length + 1));
    const hitH = Math.max(28, shelf.h + 24);
    TROPHY_BOSS_KEYS.forEach((bossKey, idx) => {
      const hit = this.add
        .rectangle(xs[idx], hitY, hitW, hitH, 0x000000, 0)
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.onTrophyClicked(bossKey, layout));
      this.trophyHits.push(hit);
    });
  }

  /**
   * Pick a Gran trophy-quip line for the clicked boss (`empty` if no
   * trophy yet) and surface it in a small speech bubble near her.
   * The bubble auto-fades after a few seconds; subsequent clicks cut
   * the current bubble short so rapid clicking doesn't stack.
   */
  private onTrophyClicked(bossKey: string, layout: CroftLayout): void {
    const save = loadSave();
    const killed = (save.bossKillCounts[bossKey] ?? 0) > 0;
    const tag = killed ? bossKey : 'empty';
    const line = this.pickTrophyQuipLine(tag);
    audio.playClick();
    this.showGranBubble(line, layout);
  }

  private pickTrophyQuipLine(tag: string): string {
    // Two lines per tag — random pick. Miss-keyed tags silently fall
    // through to the 'empty' bucket so future boss additions are
    // harmless until lines are authored.
    const chosen = Math.random() < 0.5 ? 'a' : 'b';
    const key = `ui.croft.trophy_quip.${tag}.${chosen}`;
    const line = t(key);
    if (line === key) {
      // Unresolved — fall back to empty.a.
      return t('ui.croft.trophy_quip.empty.a');
    }
    return line;
  }

  private showGranBubble(line: string, layout: CroftLayout): void {
    this.granBubble?.destroy();
    this.granBubble = null;
    this.granBubbleTimer?.remove(false);
    this.granBubbleTimer = null;

    // Anchor above Gran's head, nudged right so the bubble doesn't
    // obscure her face.
    const anchorX = layout.gran.x + 28;
    const anchorY = layout.gran.y - 44;
    const maxWidth = 260;

    const text = this.add.text(0, 0, `"${line}"`, textStyle('body', {
      color: COLORS_CSS.INK,
      wordWrap: { width: maxWidth - 16 },
      align: 'left',
    })).setOrigin(0, 0);

    const { width: tw, height: th } = text;
    const padX = 8;
    const padY = 6;
    const bubbleW = Math.min(maxWidth, tw + padX * 2);
    const bubbleH = th + padY * 2;

    // Rounded paper-coloured bubble.
    const bg = this.add.graphics();
    bg.fillStyle(0xfaf2d8, 0.96);
    bg.fillRoundedRect(0, 0, bubbleW, bubbleH, 6);
    bg.lineStyle(1.2, 0x5a4028, 0.9);
    bg.strokeRoundedRect(0, 0, bubbleW, bubbleH, 6);
    // Tail pointing down toward Gran.
    bg.fillStyle(0xfaf2d8, 0.96);
    bg.fillTriangle(bubbleW / 3, bubbleH - 1, bubbleW / 3 + 14, bubbleH + 8, bubbleW / 3 + 18, bubbleH - 1);
    bg.lineStyle(1.2, 0x5a4028, 0.9);
    bg.strokeTriangle(bubbleW / 3, bubbleH - 1, bubbleW / 3 + 14, bubbleH + 8, bubbleW / 3 + 18, bubbleH - 1);

    text.setPosition(padX, padY);

    const container = this.add.container(anchorX, anchorY - bubbleH, [bg, text]);
    container.setDepth(90);
    container.setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 140 });

    this.granBubble = container;
    this.granBubbleTimer = this.time.delayedCall(3500, () => {
      if (!this.granBubble) return;
      this.tweens.add({
        targets: this.granBubble,
        alpha: 0,
        duration: 240,
        onComplete: () => {
          this.granBubble?.destroy();
          this.granBubble = null;
        },
      });
    });
  }

  /**
   * Draw the photo wall — one polaroid per canonical Moor Road route.
   * Visited routes (present in `firstRouteVisits`) show full colour;
   * unvisited sit as sepia placeholders waiting to be earned.
   */
  private drawPhotoWall(layout: CroftLayout): void {
    const save = loadSave();
    const gfx = this.add.graphics();
    gfx.setDepth(25);
    drawPhotoWall(gfx, layout.photoWall, save.firstRouteVisits);
    this.photoWallGfx = gfx;
  }

  /**
   * Draw the drove silhouettes along the window sill — one per
   * variant, unlocked variants in full palette + the selected
   * variant wearing a whisky-gold accent ring. Clicking a silhouette
   * is wired in T20.
   */
  private drawDroveWindow(layout: CroftLayout): void {
    const save = loadSave();
    const gfx = this.add.graphics();
    gfx.setDepth(26);
    this.droveSlots = drawDrove(gfx, layout.drove, save.unlockedVariants, save.selectedVariant);
    this.droveGfx = gfx;

    // Unlocked silhouettes are clickable — selects for next run.
    // Locked ones get a hit area that fires a "locked" quip so the
    // player learns the variant exists without seeing its palette.
    this.droveHits = this.droveSlots.map((slot) => {
      const hit = this.add
        .rectangle(slot.x + slot.w / 2, slot.y, slot.w + 2, slot.h + 6, 0x000000, 0)
        .setInteractive({ useHandCursor: slot.unlocked });
      hit.on('pointerdown', () => this.onDroveSlotClicked(slot, layout));
      return hit;
    });
  }

  /**
   * Click handler for a drove silhouette. Unlocked variants replace
   * `save.selectedVariant` for the next run; the scene re-renders so
   * the accent ring moves immediately. Locked variants play the click
   * sound but take no save action (a fuller locked-flavour reveal
   * lands with M3 a11y polish).
   */
  private onDroveSlotClicked(slot: DroveSlot, layout: CroftLayout): void {
    audio.playClick();
    if (!slot.unlocked) return;
    const current = loadSave();
    if (current.selectedVariant === slot.variant.key) return;
    writeSave({ ...current, selectedVariant: slot.variant.key });
    // Redraw the drove so the gold accent ring jumps to the newly
    // picked silhouette without a full scene restart.
    this.droveGfx?.destroy();
    this.droveHits.forEach((h) => h.destroy());
    this.droveHits = [];
    this.droveSlots = [];
    this.drawDroveWindow(layout);
  }

  /**
   * Display the hearth sprite and tick its 4-frame flicker at ~8 fps.
   */
  private drawHearth(layout: CroftLayout): void {
    const sprite = this.add
      .sprite(layout.hearth.x, layout.hearth.y, HEARTH_TEXTURE_KEYS[0])
      .setOrigin(0.5, 0.5)
      .setScale(layout.spriteScale * 1.4)
      .setDepth(34);
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
      .setScale(layout.spriteScale * 2)
      .setDepth(46);
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

  /**
   * Render the croft visitors — postie at the doorway, neighbour-wifie
   * by the window, weans on the rug, sheepdog standing by Gran, and a
   * returning pal beside the bookshelf. Three of them are 2-frame
   * idle animations (postie / neighbour / sheepdog) following the same
   * `time.addEvent` swap pattern as Gran's knitting; weans + returning
   * pal are single-frame still images.
   *
   * Decoration-only: no input handlers, no interaction. Each sprite
   * addition is texture-exists guarded so test stubs that don't seed
   * the visitor textures don't crash. Animated visitors (postie /
   * neighbour / sheepdog) use dedicated sprite + timer fields that
   * `create()`'s reset block wipes on scene reuse — matches Gran's
   * pattern. Single-frame visitors (weans / returningPal) ride on the
   * `placeholders` cleanup array. Visitors render at a depth slightly
   * behind Gran (38) so she still reads as the focal point.
   */
  private drawVisitors(layout: CroftLayout): void {
    const VISITOR_DEPTH = 40;

    // Postie at the doorway — 2-frame breath wobble. Cleanup handled
    // by dedicated postieSprite/postieTimer fields (matches Gran pattern).
    if (this.textures.exists(POSTIE_TEXTURE_KEYS[0])) {
      const sprite = this.add
        .sprite(layout.postie.x, layout.postie.y, POSTIE_TEXTURE_KEYS[0])
        .setOrigin(0.5, 0.85)
        .setScale(layout.spriteScale * 1.4)
        .setDepth(VISITOR_DEPTH);
      this.postieSprite = sprite;
      this.postieTimer = this.time.addEvent({
        delay: 600,
        loop: true,
        callback: () => {
          this.postieFrame = (this.postieFrame + 1) % POSTIE_FRAME_COUNT;
          sprite.setTexture(POSTIE_TEXTURE_KEYS[this.postieFrame]);
        },
      });
    }

    // Neighbour-wifie near the window — 2-frame head-tilt + basket sway.
    if (this.textures.exists(NEIGHBOUR_TEXTURE_KEYS[0])) {
      const sprite = this.add
        .sprite(layout.neighbour.x, layout.neighbour.y, NEIGHBOUR_TEXTURE_KEYS[0])
        .setOrigin(0.5, 0.85)
        .setScale(layout.spriteScale * 1.4)
        .setDepth(VISITOR_DEPTH);
      this.neighbourSprite = sprite;
      this.neighbourTimer = this.time.addEvent({
        delay: 620,
        loop: true,
        callback: () => {
          this.neighbourFrame = (this.neighbourFrame + 1) % NEIGHBOUR_FRAME_COUNT;
          sprite.setTexture(NEIGHBOUR_TEXTURE_KEYS[this.neighbourFrame]);
        },
      });
    }

    // Standing sheepdog right of Gran — 2-frame ear-flick + tail-wag.
    if (this.textures.exists(SHEEPDOG_STAND_TEXTURE_KEYS[0])) {
      const sprite = this.add
        .sprite(layout.sheepdog.x, layout.sheepdog.y, SHEEPDOG_STAND_TEXTURE_KEYS[0])
        .setOrigin(0.5, 0.9)
        .setScale(layout.spriteScale * 1.4)
        .setDepth(VISITOR_DEPTH);
      this.sheepdogSprite = sprite;
      this.sheepdogTimer = this.time.addEvent({
        delay: 580,
        loop: true,
        callback: () => {
          this.sheepdogFrame = (this.sheepdogFrame + 1) % SHEEPDOG_STAND_FRAME_COUNT;
          sprite.setTexture(SHEEPDOG_STAND_TEXTURE_KEYS[this.sheepdogFrame]);
        },
      });
    }

    // Weans on the rug — single-frame still image, slightly larger so
    // the duo reads at the same scale as the lone NPCs.
    if (this.textures.exists(WEANS_TEXTURE_KEY)) {
      const weans = this.add
        .image(layout.weans.x, layout.weans.y, WEANS_TEXTURE_KEY)
        .setOrigin(0.5, 0.9)
        .setScale(layout.spriteScale * 1.3)
        .setDepth(45);
      this.placeholders.push(weans);
    }

    // Returning pal beside the bookshelf — single-frame still image.
    if (this.textures.exists(RETURNING_PAL_TEXTURE_KEY)) {
      const pal = this.add
        .image(layout.returningPal.x, layout.returningPal.y, RETURNING_PAL_TEXTURE_KEY)
        .setOrigin(0.5, 0.85)
        .setScale(layout.spriteScale * 1.3)
        .setDepth(VISITOR_DEPTH);
      this.placeholders.push(pal);
    }
  }

  /**
   * Always-on lived-in props. Seasonal props still layer above this
   * when active, so Burns Night can feel special without the off-season
   * croft going bare.
   */
  private drawWarmth(layout: CroftLayout): void {
    const gfx = this.add.graphics();
    gfx.setDepth(44);
    drawWarmthProps(gfx, layout);
    this.warmthPropsGfx = gfx;
  }

  /**
   * Second layer of lived-in props: books, bowls, rain, boots, and small
   * keepsakes that make the Croft feel tended rather than staged.
   */
  private drawKeepsakes(layout: CroftLayout, opts: { includeWallKeepsakes?: boolean } = {}): void {
    const gfx = this.add.graphics();
    gfx.setDepth(44.5);
    drawCroftKeepsakes(gfx, layout, opts);
    this.keepsakePropsGfx = gfx;
  }

  /**
   * If a seasonal event window is active (E1 framework), paint the
   * event's props on top of the composition. Burns Night is the only
   * event shipping props today; the drawer is a no-op for null /
   * unknown keys so future events land safely once authored.
   */
  private drawSeasonal(layout: CroftLayout): void {
    const disabled = getSettingsManager().load().disableSeasonalEvents;
    const key = getActiveSeasonalEventKey(new Date(), disabled);
    if (!key) return;
    const gfx = this.add.graphics();
    gfx.setDepth(45); // Above composition, below the Gran-bubble overlay (50).
    drawSeasonalProps(gfx, key, layout);
    this.seasonalPropsGfx = gfx;
  }

  /**
   * Bookshelf is a diegetic entry point to the Highland Almanac (C1).
   * Click fades to the Almanac scene and preserves Croft as the parent
   * hub so the back button returns the player to Gran instead of kicking
   * them out to the front menu.
   *
   * T404 — also paints a small "{seen}/{total}" beasties progress chip
   * just below the bookshelf hit so the player sees their Almanac
   * progress at a glance without entering the book. Hidden when no
   * beasties are seen (chip would only nag).
   */
  private drawBookshelfHit(layout: CroftLayout): void {
    const isMobileCroft = this.scale.width < 600;
    const hitW = isMobileCroft ? 64 : 88;
    const hitH = isMobileCroft ? 104 : 136;
    const hit = this.add
      .rectangle(layout.bookshelf.x, layout.bookshelf.y - hitH * 0.08, hitW, hitH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      if (this.transitioning) return;
      audio.playClick();
      this.transitioning = true;
      startSceneFadeOut(this, SCENE_FADE_OUT_MS, () =>
        this.scene.start('Almanac', returnTargetData('Croft')),
      );
    });
    this.bookshelfHit = hit;

    const summary = beastiesDiscoverySummary(buildBeastiesEntries(loadSave().discoveryLog));
    if (summary.seen > 0) {
      const chip = this.add
        .text(
          layout.bookshelf.x,
          layout.bookshelf.y + hitH * 0.44,
          t('ui.croft.almanac_chip', { seen: summary.seen, total: summary.total }),
          textStyle('subtitle', { color: COLORS_CSS.WHISKY_GOLD, align: 'center' }),
        )
        .setOrigin(0.5, 0)
        .setAlpha(0.9)
        .setDepth(58);
      this.placeholders.push(chip);
    }
  }

  /**
   * Wild Living World Initiative — first Croft-facing stub surface.
   *
   * This is intentionally read-only and runtime-derived: no schema bump,
   * no unlock persistence yet. It gives the player a persistent home for
   * the new systems by naming the shipped tracks and status, while the
   * pure builder (`livingWorldTracks.ts`) stays ready for real unlock
   * data in a later slice.
   */
  private drawLivingWorldPanel(layout: CroftLayout): void {
    const narrow = this.scale.width < 600;
    const tracks = buildLivingWorldTracks();
    const summary = livingWorldTracksSummary(tracks);
    const x = narrow ? this.scale.width * 0.5 : Math.max(168, layout.windowView.x + layout.windowView.w * 0.44);
    const y = narrow ? this.scale.height - 148 : Math.min(this.scale.height - 118, layout.rug.y + layout.rug.h * 0.34);
    const w = narrow ? Math.min(this.scale.width - 24, 340) : 330;
    const h = narrow ? 118 : 136;

    const panel = this.add.container(x, y).setDepth(74);
    const bg = this.add
      .rectangle(0, 0, w, h, 0x1f1712, 0.72)
      .setStrokeStyle(2, 0xd6a650, 0.78)
      .setOrigin(0.5);
    const title = this.add
      .text(
        -w / 2 + 12,
        -h / 2 + 10,
        t('ui.croft.livingWorld.panel_title'),
        textStyle('label', { color: COLORS_CSS.WHISKY_GOLD, align: 'left' }),
      )
      .setOrigin(0, 0);
    const subtitle = this.add
      .text(
        -w / 2 + 12,
        -h / 2 + 30,
        t('ui.croft.livingWorld.panel_subtitle'),
        textStyle('small', { color: COLORS_CSS.WARM_TAN, align: 'left' }),
      )
      .setOrigin(0, 0)
      .setAlpha(0.92);
    const liveChip = this.add
      .text(
        w / 2 - 12,
        -h / 2 + 10,
        `${summary.shipped}/${summary.total}`,
        textStyle('small', { color: COLORS_CSS.WHISKY_GOLD, align: 'right' }),
      )
      .setOrigin(1, 0);
    panel.add([bg, title, subtitle, liveChip]);

    const visibleTracks = narrow ? tracks.slice(0, 3) : tracks.slice(0, 4);
    visibleTracks.forEach((entry, i) => {
      const rowY = -h / 2 + 56 + i * 18;
      const statusKey = entry.status === 'shipped'
        ? 'status_shipped'
        : entry.status === 'introduced'
          ? 'status_introduced'
          : 'status_planned';
      const label = this.add
        .text(
          -w / 2 + 14,
          rowY,
          t(entry.displayNameKey),
          textStyle('small', { color: COLORS_CSS.WHITE, align: 'left' }),
        )
        .setOrigin(0, 0)
        .setAlpha(0.96);
      const status = this.add
        .text(
          w / 2 - 14,
          rowY,
          t(`ui.croft.livingWorld.${statusKey}`),
          textStyle('small', {
            color: entry.status === 'shipped' ? COLORS_CSS.WHISKY_GOLD : COLORS_CSS.DUSTY_TAN,
            align: 'right',
          }),
        )
        .setOrigin(1, 0)
        .setAlpha(entry.status === 'shipped' ? 0.95 : 0.78);
      panel.add([label, status]);
    });

    this.placeholders.push(panel);
  }

  /**
   * Wild Living World Phase 2 — Croft companion picker panel.
   *
   * Reads the persisted unlock + selection bag (`livingWorldUnlocks`)
   * through `loadSave()`, renders one tap-able row per `CompanionKey`
   * plus a "go alone" opt-out row, and writes the new pick back via
   * `setSelectedCompanion` when the player taps a row. The next run
   * picks up the new selection through the run-start whistle path in
   * GameScene (`livingWorldUnlocks.selectedCompanion` is read in
   * `initSystems`).
   *
   * Visual contract:
   *   - locked rows render greyed; clicks are ignored even if the
   *     hit-area covers them (defense-in-depth — `companionPicker.ts`
   *     also rejects them in pure logic).
   *   - selected row gets the `WHISKY_GOLD` accent + a tiny pip.
   *   - opt-out row always renders (not gated on any unlock); clicking
   *     it sets the selection to `null`.
   */
  private drawCompanionPicker(layout: CroftLayout): void {
    const save = loadSave();
    const rows = buildCompanionPickerRows({
      unlockedCompanions: save.livingWorldUnlocks.unlockedCompanions,
      selectedCompanion: save.livingWorldUnlocks.selectedCompanion,
    });

    // Sit the picker to the LEFT of the Living Moor panel so they
    // share the lower-right corner without overlap. Narrow viewports
    // collapse below the Living Moor panel.
    const narrow = this.scale.width < 600;
    const w = narrow ? Math.min(this.scale.width - 24, 280) : 240;
    const h = narrow ? 124 : 156;
    const x = narrow ? this.scale.width * 0.5 : Math.max(40, layout.windowView.x + layout.windowView.w * 0.12);
    const y = narrow
      ? this.scale.height - 24
      : Math.min(this.scale.height - 116, layout.rug.y + layout.rug.h * 0.34);

    const panel = this.add.container(x, y).setDepth(74);
    this.companionPickerContainer = panel;
    const bg = this.add
      .rectangle(0, 0, w, h, 0x1f1712, 0.78)
      .setStrokeStyle(2, 0xd6a650, 0.78)
      .setOrigin(0.5);
    const title = this.add
      .text(-w / 2 + 12, -h / 2 + 10, t('ui.croft.livingWorld.picker.title'),
        textStyle('label', { color: COLORS_CSS.WHISKY_GOLD, align: 'left' }))
      .setOrigin(0, 0);
    panel.add([bg, title]);

    // Row stack — companion rows + opt-out at the bottom.
    rows.forEach((row, i) => {
      const rowY = -h / 2 + 38 + i * 22;
      const isSelected = row.selected;
      // Locked companion rows render in a dimmed colour so the panel
      // legibly communicates which slots are still locked. Opt-out
      // and unlocked rows use the normal palette.
      const baseColor = this.companionPickerRowColor(row);
      const label = this.add
        .text(-w / 2 + 16, rowY, t(row.displayNameKey),
          textStyle('small', {
            color: baseColor,
            align: 'left',
          }))
        .setOrigin(0, 0)
        .setAlpha(this.companionPickerRowAlpha(row));
      panel.add(label);

      // Selection pip — a small gold square next to the active row.
      if (isSelected) {
        const pip = this.add
          .rectangle(-w / 2 + 8, rowY + 6, 4, 4, 0xd6a650, 0.95)
          .setOrigin(0.5);
        panel.add(pip);
      }

      // Hit-area covers the row but only fires when the row is
      // pickable. We attach a rectangle as an invisible hit zone
      // rather than making the text interactive so non-clickable
      // rows still surface their label without confusing pointer
      // cursors.
      if (this.companionPickerRowClickable(row)) {
        const hit = this.add
          .rectangle(0, rowY + 6, w - 24, 18, 0x000000, 0)
          .setOrigin(0.5, 0.5)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          this.handleCompanionPickerClick(i);
        });
        panel.add(hit);
      }
    });

    // Picker container is NOT pushed to `placeholders` — its lifetime
    // is owned by `companionPickerContainer` so a click-to-redraw
    // cycle never strands a destroyed reference in the scene-wide
    // placeholder list. Scene `create()` destroys it directly.
  }

  /** Pure-data colour helper so unit tests can grow it later if needed. */
  private companionPickerRowColor(row: CompanionPickerRow): string {
    if (row.kind === 'opt_out') return COLORS_CSS.WARM_TAN;
    if (row.selected) return COLORS_CSS.WHISKY_GOLD;
    return row.unlocked ? COLORS_CSS.WHITE : COLORS_CSS.DUSTY_TAN;
  }

  private companionPickerRowAlpha(row: CompanionPickerRow): number {
    if (row.kind === 'opt_out') return 0.92;
    if (row.selected) return 0.97;
    return row.unlocked ? 0.92 : 0.55;
  }

  private companionPickerRowClickable(row: CompanionPickerRow): boolean {
    return row.kind === 'opt_out' || row.unlocked;
  }

  /**
   * Persist the player's pick and refresh the panel. We track the
   * panel container directly (`companionPickerContainer`) so the
   * redraw destroys only that surface, not the whole scene's
   * `placeholders` list (header / actions / drove / etc.).
   */
  private handleCompanionPickerClick(clickedIndex: number): void {
    const save = loadSave();
    const rows = buildCompanionPickerRows({
      unlockedCompanions: save.livingWorldUnlocks.unlockedCompanions,
      selectedCompanion: save.livingWorldUnlocks.selectedCompanion,
    });
    const next = resolveNextSelection(rows, clickedIndex, save.livingWorldUnlocks.selectedCompanion);
    if (next === save.livingWorldUnlocks.selectedCompanion) return;
    setSelectedCompanion(next);
    audio.playClick();
    if (this.companionPickerContainer) {
      this.companionPickerContainer.destroy();
      this.companionPickerContainer = null;
    }
    const { uiScale } = getSettingsManager().load();
    this.drawCompanionPicker(
      layoutCroft({ uiScale, width: this.scale.width, height: this.scale.height }),
    );
  }

  private drawHeader(width: number): void {
    const title = this.add
      .text(width / 2, 50, t('ui.croft.title'), sceneHeaderTextStyle(COLORS_CSS.WHISKY_GOLD))
      .setOrigin(0.5)
      .setDepth(82);
    const subtitle = this.add
      .text(width / 2, 90, t('ui.croft.subtitle'), sceneSubtitleTextStyle(COLORS_CSS.WARM_TAN, width))
      .setOrigin(0.5)
      .setDepth(82);
    const greet = this.add
      .text(width / 2, 118, t('ui.croft.gran_greet'), sceneSubtitleTextStyle(COLORS_CSS.DUSTY_TAN, width))
      .setOrigin(0.5)
      .setDepth(82);
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
    const allActions: ReadonlyArray<{ key: CroftActionKey; i18n: string; tier: 'primary' | 'secondary' }> = [
      { key: 'start_run', i18n: 'ui.croft.actions.start_run', tier: 'primary' },
      { key: 'shop', i18n: 'ui.croft.actions.shop', tier: 'secondary' },
      { key: 'chronicle', i18n: 'ui.croft.actions.chronicle', tier: 'secondary' },
      { key: 'settings', i18n: 'ui.croft.actions.settings', tier: 'secondary' },
    ];
    const visible = new Set(visibleCroftActions(loadSave()));
    const actions = allActions.filter((action) => visible.has(action.key));
    const actionLayout = this.resolveActionLayout(actions.length);
    this.drawActionBacking(actionLayout.board);

    actions.forEach((action, idx) => {
      const { rect, label } = createGameButton(this, {
        x: actionLayout.x,
        y: actionLayout.baseY + actionLayout.gapY * idx,
        width: actionLayout.buttonW,
        height: actionLayout.buttonH,
        label: t(action.i18n),
        tier: action.tier,
        ...(actionLayout.fontSize ? { fontSize: actionLayout.fontSize } : {}),
      });
      rect.setDepth(82);
      label.setDepth(83);
      rect.on('pointerdown', () => this.handleAction(action.key));
      this.placeholders.push(rect, label);
      this.actionEntries.push({ key: action.key, rect });
    });

    // H1 M3 T23 — gamepad + keyboard nav over the action column. D-pad
    // / left-stick cycles through entries; Enter / A activates the
    // focused one. Pointer clicks still work in parallel.
    const navEntries: GamepadMenuEntry[] = this.actionEntries.map((e) => ({
      rect: e.rect,
      activate: () => this.handleAction(e.key),
    }));
    this.gamepadNav = new GamepadMenuNav(this, navEntries);

    // Keyboard shortcut: Enter activates Start Run (the primary action).
    // GamepadMenuNav drives gamepad navigation separately — its entries
    // share the same activate() closures so both input paths route to
    // `handleAction`. Arrow-key keyboard nav is a future polish pass.
    this.input.keyboard?.on('keydown-ENTER', () => {
      const first = this.actionEntries[0];
      if (first) this.handleAction(first.key);
    });
  }

  private resolveActionLayout(actionCount: number): {
    x: number;
    baseY: number;
    gapY: number;
    buttonW: number;
    buttonH: number;
    fontSize?: string;
    board: { x: number; y: number; w: number; h: number };
  } {
    const { width, height } = this.scale;
    const isMobileCroft = width < 600;
    const buttonW = isMobileCroft ? Math.min(226, width - 56) : 160;
    const buttonH = isMobileCroft ? 42 : 40;
    const gapY = isMobileCroft ? 48 : 52;
    const count = Math.max(1, actionCount);
    const totalSpan = buttonH + gapY * (count - 1);
    const x = isMobileCroft ? width / 2 : width - 88;
    const baseY = isMobileCroft
      ? Math.max(height * 0.69, height - 86 - totalSpan + buttonH / 2)
      : Math.max(176, height * 0.34);
    const boardW = buttonW + (isMobileCroft ? 24 : 28);
    const boardH = totalSpan + (isMobileCroft ? 30 : 34);
    return {
      x,
      baseY,
      gapY,
      buttonW,
      buttonH,
      fontSize: isMobileCroft ? '16px' : undefined,
      board: {
        x: x - boardW / 2,
        y: baseY - buttonH / 2 - (isMobileCroft ? 14 : 16),
        w: boardW,
        h: boardH,
      },
    };
  }

  private drawActionBacking(bounds: { x: number; y: number; w: number; h: number }): void {
    const gfx = this.add.graphics();
    gfx.setDepth(81);
    drawCroftActionBoard(gfx, bounds);
    this.actionBoardGfx = gfx;
  }

  private handleAction(key: CroftActionKey): void {
    if (this.transitioning) return;
    audio.playClick();
    const target = key === 'start_run' ? startRunTargetForCroft(loadSave()) : route(key).target;
    const leavesCroft = key === 'start_run' ? true : route(key).leavesCroft;
    // Start Run is the one action that commits — wipe any suspended
    // run first. Fresh saves skip the curse picker entirely; returning
    // saves still route through it on a clean slate.
    if (key === 'start_run') {
      try { new SaveManager().clearActiveRun(); } catch { /* best-effort */ }
    }
    this.transitioning = true;
    startSceneFadeOut(this, SCENE_FADE_OUT_MS, () => {
      this.scene.start(target, leavesCroft ? undefined : returnTargetData('Croft'));
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
