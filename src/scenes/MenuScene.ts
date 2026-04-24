import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import { applyAudioFromUserSettings } from '../core/applyAudioFromSettings';
import { getSettingsManager } from '../core/SettingsManager';
import { SaveData, loadSave, writeSave, progressSnapshotFromSave } from '../utils/save';
import { audio } from '../systems/AudioSystem';
import { t } from '../core/i18n';
import { GamepadMenuNav, type GamepadMenuEntry } from '../utils/GamepadMenuNav';
import {
  DEFAULT_VARIANT_KEY,
  VARIANTS,
  VariantKey,
  formatVariantModifierSummary,
  getVariantByKey,
  getVariantUnlockProgress,
  isVariantUnlocked,
} from '../data/variants';
import { computeVariantRunStats } from '../ui/chronicleAggregates';
import { formatMenuStatsStrip } from './menuStatsStrip';
import { resolveLoadoutBadgeStyle, formatVariantRequirementLine } from './loadoutBadge';
import {
  resolveVariantPanelStroke,
  resolveVariantNameColor,
  resolveVariantTallyColor,
} from './variantPanelStyle';
import { computeMenuLayout } from './menuLayout';
import { startSceneFadeOut, addSceneBackdrop, SCENE_FADE_OUT_MS } from './sceneFade';
import { TWEEN_INFINITE_BREATHE } from '../utils/tweenPresets';
import { attachButtonHoverFill } from '../ui/buttonHover';
import { createGameButton } from '../ui/gameButton';
import { createGameToggle } from '../ui/gameToggle';
import { textStyle } from '../ui/typography';
import { installSeasonalEventBanner, type SeasonalBannerHandle } from '../ui/SeasonalEventBanner';

/**
 * MenuScene — main menu with variant loadout selection.
 */
export class MenuScene extends Phaser.Scene {
  private transitioning = false;
  private carouselIndex = 0;
  private selectedVariantKey: VariantKey = DEFAULT_VARIANT_KEY;
  private saveData!: SaveData;
  private variantPanelElements: Phaser.GameObjects.GameObject[] = [];
  private mascot: Phaser.GameObjects.Sprite | null = null;
  private loadoutBanner: Phaser.GameObjects.Text | null = null;
  private uiScale = 1;
  private highContrastUi = false;
  private gamepadNav: GamepadMenuNav | null = null;
  private playHit!: Phaser.GameObjects.Rectangle;
  private upgradesHit!: Phaser.GameObjects.Rectangle;
  private sfxHit!: Phaser.GameObjects.Rectangle;
  private musicHit!: Phaser.GameObjects.Rectangle;
  private sfxToggleFire!: () => void;
  private musicToggleFire!: () => void;
  private carouselLeftHit: Phaser.GameObjects.Rectangle | null = null;
  private carouselRightHit: Phaser.GameObjects.Rectangle | null = null;
  private variantSelectHit: Phaser.GameObjects.Rectangle | null = null;
  private floatingDots: Phaser.GameObjects.Arc[] = [];
  private seasonalBanner: SeasonalBannerHandle | null = null;

  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    this.transitioning = false;
    this.clearVariantPanel();
    this.saveData = loadSave();
    this.selectedVariantKey = this.saveData.selectedVariant;
    this.carouselIndex = Math.max(0, VARIANTS.findIndex((variant) => variant.key === this.selectedVariantKey));
    const prefs = getSettingsManager().load();
    this.uiScale = prefs.uiScale;
    this.highContrastUi = prefs.highContrastUi;

    const { width, height } = this.scale;
    const layout = this.getMenuLayout(height);

    addSceneBackdrop(this);
    this.add
      .rectangle(width / 2, 106, width - 64, 184, COLORS.PANEL, this.highContrastUi ? 0.78 : 0.58)
      .setStrokeStyle(2, this.highContrastUi ? 0x4e6ea2 : 0x263655, 0.9);
    this.add
      .rectangle(width / 2, layout.panelY, width - 40, layout.panelHeight + 18, COLORS.PANEL, 0.92)
      .setStrokeStyle(2, 0x31476e, 0.95);

    this.floatingDots = [];
    for (let i = 0; i < 24; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(30, width - 30),
        Phaser.Math.Between(24, 260),
        Phaser.Math.Between(2, 5),
        COLORS.HEATHER,
        Phaser.Math.FloatBetween(0.04, 0.12)
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - Phaser.Math.Between(18, 40),
        alpha: 0,
        duration: Phaser.Math.Between(2600, 5200),
        repeat: -1,
        yoyo: true,
      });
      this.floatingDots.push(dot);
    }

    this.mascot = this.add
      .sprite(width / 2, 82, getVariantByKey(this.selectedVariantKey).textureKey)
      .setScale(3.15);
    this.tweens.add({
      targets: this.mascot,
      y: this.mascot.y + 8,
      duration: 1200,
      ...TWEEN_INFINITE_BREATHE,
    });
    this.tweens.add({
      targets: this.mascot,
      angle: { from: -5, to: 5 },
      duration: 1900,
      ...TWEEN_INFINITE_BREATHE,
    });

    const title = this.add
      .text(width / 2, 150, t('ui.menu.title'),
        textStyle('display', { color: COLORS_CSS.WHISKY_GOLD, align: 'center' }),
      )
      .setOrigin(0.5)
      .setAlpha(0);
    title.setScale(this.uiScale);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 146,
      duration: 700,
      ease: 'Power2',
    });

    const subtitle = this.add
      .text(width / 2, 214, t('ui.loadout.subtitle'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: COLORS_CSS.TEXT_SECONDARY,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    subtitle.setScale(this.uiScale);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 500, delay: 260 });

    this.loadoutBanner = this.add
      .text(width / 2, 246, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: COLORS_CSS.TEXT_PRIMARY,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.loadoutBanner.setScale(this.uiScale);
    this.tweens.add({ targets: this.loadoutBanner, alpha: 1, duration: 400, delay: 420 });
    this.updateLoadoutBanner();

    const statsLabel = this.saveData.totalRuns > 0
      ? formatMenuStatsStrip({
          bestTime: this.saveData.bestTime,
          bestKills: this.saveData.bestKills,
          bestCombo: this.saveData.bestCombo,
          totalRuns: this.saveData.totalRuns,
          victories: this.saveData.victories,
          gold: this.saveData.gold,
          viewWidth: width,
        })
      : t('ui.loadout.stats_hint');
    const statsText = this.add
      .text(width / 2, 274, statsLabel, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: COLORS_CSS.TEXT_SECONDARY,
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    statsText.setScale(this.uiScale);
    this.tweens.add({ targets: statsText, alpha: 1, duration: 450, delay: 520 });

    this.playHit = this.createButton(width / 2 - 128, layout.buttonY, 220, 54, t('ui.loadout.play'), COLORS.SCOTTISH_BLUE, () => {
      audio.playClick();
      // H1 T7 — primary button now routes to Gran's Croft; the
      // actual run-start commit (clearActiveRun + Curse picker) moves
      // into CroftScene's own "Start Run" action (T8).
      this.fadeToScene('Croft');
    }, 560);

    this.upgradesHit = this.createButton(width / 2 + 128, layout.buttonY, 220, 54, t('ui.loadout.upgrades'), 0x3a4357, () => {
      audio.playClick();
      this.fadeToScene('Shop');
    }, 660, 'secondary');

    applyAudioFromUserSettings(prefs);
    const sfxOn = prefs.sfxVolume > 0.001;
    const musicOn = prefs.musicVolume > 0.001;

    const sfxT = this.createToggle(104, height - 26, 'ui.loadout.sfx_toggle', sfxOn, (on) => {
      getSettingsManager().update((st) => ({ ...st, sfxVolume: on ? 1 : 0 }));
      applyAudioFromUserSettings(getSettingsManager().load());
    }, 760);
    this.sfxHit = sfxT.hit;
    this.sfxToggleFire = sfxT.fire;

    const musicT = this.createToggle(218, height - 26, 'ui.loadout.music_toggle', musicOn, (on) => {
      getSettingsManager().update((st) => ({ ...st, musicVolume: on ? 1 : 0 }));
      applyAudioFromUserSettings(getSettingsManager().load());
    }, 820);
    this.musicHit = musicT.hit;
    this.musicToggleFire = musicT.fire;

    const enemyTextures = ['tourist', 'chef', 'midge', 'highland_cow', 'eagle', 'sheep'];
    for (let i = 0; i < 7; i++) {
      const tex = enemyTextures[i % enemyTextures.length];
      const ey = Phaser.Math.Between(layout.ambientEnemyMinY, height - 18);
      const sprite = this.add.sprite(-30, ey, tex).setAlpha(0.08).setScale(1.45);
      this.tweens.add({
        targets: sprite,
        x: width + 30,
        duration: Phaser.Math.Between(7600, 12400),
        delay: i * 900,
        repeat: -1,
        onRepeat: () => {
          sprite.setY(Phaser.Math.Between(layout.ambientEnemyMinY, height - 18));
        },
      });
    }

    this.renderVariantCarousel();

    // Ambient moor wind — cozy between storms
    audio.startAmbientWind();

    // E1 M4 T22 — seasonal banner on the main menu. Helper is a no-op
    // outside event windows + when `disableSeasonalEvents` is on.
    this.seasonalBanner?.destroy();
    this.seasonalBanner = installSeasonalEventBanner(this);

    this.events.once('shutdown', () => {
      audio.stopAmbientWind();
      this.gamepadNav?.destroy();
      this.gamepadNav = null;
      this.seasonalBanner?.destroy();
      this.seasonalBanner = null;
      for (const dot of this.floatingDots) {
        try { this.tweens.killTweensOf(dot); } catch { /* ignore */ }
      }
      this.floatingDots.length = 0;
    });

    this.add
      .text(width - 10, height - 10, `v${__APP_VERSION__}`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#44506a',
      })
      .setOrigin(1, 1);
  }

  private renderVariantCarousel(): void {
    this.clearVariantPanel();

    const { width, height } = this.scale;
    const layout = this.getMenuLayout(height);
    const panelX = width / 2;
    const panelY = layout.panelY;
    const panelWidth = 680;
    const panelHeight = layout.panelHeight;
    const variant = VARIANTS[this.carouselIndex];
    // V2 followup — structural typing masks the SaveData long-field ↔
    // VariantProgressSnapshot short-field mismatch; pass a properly-
    // keyed snapshot so unlock progress above a 1-run threshold reads
    // correctly.
    const variantProgress = progressSnapshotFromSave(this.saveData);
    const unlocked = isVariantUnlocked(variant, variantProgress);
    const selected = this.selectedVariantKey === variant.key;
    const unlockProgress = getVariantUnlockProgress(variant, variantProgress);
    const infoX = panelX - 92;
    // Vertical offsets scale with uiScale so the scaled variant rows
    // (name 24px → 34px, flavor 13px → 18px wrap, modifier 13px, progress
    // 12px, tally 11px) keep their row-to-row gaps and stay inside the
    // scaled panelHeight. Without this the rows collapse into each other
    // at 1.4x (flavor bottom crashes into modifier top).
    const vy = (base: number) => Math.round(base * this.uiScale);

    const panel = this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, COLORS.PANEL, 0.95)
      .setStrokeStyle(2, resolveVariantPanelStroke(unlocked), 1);
    this.variantPanelElements.push(panel);

    const header = this.add.text(panelX - panelWidth / 2 + 18, panelY - vy(68), t('ui.loadout.variant_loadout'), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#9bb6eb',
      fontStyle: 'bold',
      letterSpacing: 1,
    });
    const pageText = this.add
      .text(panelX + panelWidth / 2 - 18, panelY - vy(68), `${this.carouselIndex + 1} / ${VARIANTS.length}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8097c2',
      })
      .setOrigin(1, 0);
    this.variantPanelElements.push(header, pageText);

    this.carouselLeftHit = this.createCarouselButton(panelX - panelWidth / 2 + 34, panelY, '<', () => {
      audio.playClick();
      this.carouselIndex = (this.carouselIndex - 1 + VARIANTS.length) % VARIANTS.length;
      this.renderVariantCarousel();
    });

    this.carouselRightHit = this.createCarouselButton(panelX + panelWidth / 2 - 34, panelY, '>', () => {
      audio.playClick();
      this.carouselIndex = (this.carouselIndex + 1) % VARIANTS.length;
      this.renderVariantCarousel();
    });

    const previewFrame = this.add
      .rectangle(panelX - 238, panelY + vy(8), 118, 112, 0x16213a, 0.95)
      .setStrokeStyle(1, unlocked ? 0x406099 : 0x374157, 1);
    const preview = this.add
      .sprite(previewFrame.x, previewFrame.y - 2, variant.textureKey)
      .setScale(3.05)
      .setAlpha(unlocked ? 1 : 0.42);
    this.variantPanelElements.push(previewFrame, preview);

    const nameText = this.add.text(infoX, panelY - vy(42), t(variant.nameKey), {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: resolveVariantNameColor(unlocked),
      fontStyle: 'bold',
    });
    // Wrap instead of truncating — all 5 flavors currently exceed 42 chars,
    // and any locale whose strings are longer would be cropped mid-word.
    // The ~300px wrap width gives room for 2 lines on the widest flavor.
    const flavorText = this.add.text(infoX, panelY - vy(18), t(variant.flavorKey), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#95a8ca',
      wordWrap: { width: 300 },
    });
    const modifierText = this.add.text(infoX, panelY + vy(18), formatVariantModifierSummary(variant), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: COLORS_CSS.TEXT_BRIGHT,
      wordWrap: { width: 300 },
      lineSpacing: 3,
    });
    const requirementLine = formatVariantRequirementLine(unlocked, unlockProgress);
    const progressLine = this.add.text(
      infoX,
      panelY + vy(46),
      requirementLine.text,
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: requirementLine.color,
      }
    );
    this.variantPanelElements.push(nameText, flavorText, modifierText, progressLine);

    // Lifetime tally for unlocked variants — drawn from the recent
    // runHistory window. Silent on locked tiles (the unlock progress
    // bar already owns the right-of-modifier slot for them) and on
    // unlocked tiles with zero recorded runs (fresh unlocks).
    if (unlocked) {
      const variantStats = computeVariantRunStats(this.saveData.runHistory ?? [], variant.key);
      if (variantStats.runs > 0) {
        const tallyText = this.add.text(
          infoX,
          panelY + vy(76),
          t('ui.loadout.variant_tally', {
            wins: variantStats.wins,
            runs: variantStats.runs,
          }),
          {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: resolveVariantTallyColor(variantStats.wins),
            fontStyle: 'italic',
          },
        );
        this.variantPanelElements.push(tallyText);
      }
    }

    const barX = infoX;
    const barY = panelY + vy(66);
    const barWidth = 286;
    const progressBg = this.add.rectangle(barX, barY, barWidth, 8, 0x202839, 1).setOrigin(0, 0.5);
    const progressFill = this.add
      .rectangle(
        barX + 1,
        barY,
        Math.max(0, (barWidth - 2) * (unlocked ? 1 : unlockProgress?.ratio ?? 0)),
        6,
        unlocked ? 0x51b36d : COLORS.WHISKY_GOLD,
        1
      )
      .setOrigin(0, 0.5);
    const progressBorder = this.add.rectangle(barX + barWidth / 2, barY, barWidth, 8, 0, 0).setStrokeStyle(1, 0x46536f, 1);
    this.variantPanelElements.push(progressBg, progressFill, progressBorder);

    this.variantSelectHit = null;
    const badgeStyle = resolveLoadoutBadgeStyle(selected, unlocked);
    const badge = this.add
      .rectangle(panelX + 235, panelY - vy(6), 126, 38, badgeStyle.fillColor, 1)
      .setStrokeStyle(1, badgeStyle.strokeColor, 1);
    const badgeLabel = this.add
      .text(badge.x, badge.y, badgeStyle.labelText, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: badgeStyle.labelColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.variantPanelElements.push(badge, badgeLabel);

    const statusNote = this.add
      .text(badge.x, panelY + vy(30), badgeStyle.statusText, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#aab4c7',
        align: 'center',
        wordWrap: { width: 170 },
      })
      .setOrigin(0.5);
    this.variantPanelElements.push(statusNote);

    if (unlocked && !selected) {
      this.variantSelectHit = badge;
      badge.setInteractive({ useHandCursor: true });
      attachButtonHoverFill(badge, COLORS.SCOTTISH_BLUE, 0x0077dd);
      badge.on('pointerdown', () => {
        audio.playClick();
        this.selectVariant(variant.key);
      });
    }

    this.refreshGamepadNav();
  }

  private createCarouselButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Rectangle {
    const { rect: button, label: text } = createGameButton(this, {
      x, y, width: 38, height: 38, label,
      tier: 'tertiary', fontSize: '22px', uiScale: this.uiScale,
    });
    button.setScale(this.uiScale);
    // Shift text up 1px for visual alignment of < / > glyphs
    text.setY(y - Math.round(1 * this.uiScale));
    button.on('pointerdown', onClick);

    this.variantPanelElements.push(button, text);
    return button;
  }

  private refreshGamepadNav(): void {
    this.gamepadNav?.destroy();
    this.gamepadNav = null;

    const entries: GamepadMenuEntry[] = [];
    const push = (rect: Phaser.GameObjects.Rectangle | null, activate: () => void) => {
      if (rect?.active) entries.push({ rect, activate });
    };

    push(this.playHit, () => {
      audio.playClick();
      // H1 T7 — gamepad-Activate on primary button matches pointer behaviour:
      // route to the croft hub, defer run-start commit to CroftScene.
      this.fadeToScene('Croft');
    });
    push(this.upgradesHit, () => {
      audio.playClick();
      this.fadeToScene('Shop');
    });
    push(this.carouselLeftHit, () => {
      audio.playClick();
      this.carouselIndex = (this.carouselIndex - 1 + VARIANTS.length) % VARIANTS.length;
      this.renderVariantCarousel();
    });
    push(this.carouselRightHit, () => {
      audio.playClick();
      this.carouselIndex = (this.carouselIndex + 1) % VARIANTS.length;
      this.renderVariantCarousel();
    });
    push(this.variantSelectHit, () => {
      const v = VARIANTS[this.carouselIndex];
      if (!v || !isVariantUnlocked(v, progressSnapshotFromSave(this.saveData)) || this.selectedVariantKey === v.key) return;
      audio.playClick();
      this.selectVariant(v.key);
    });
    push(this.sfxHit, () => this.sfxToggleFire());
    push(this.musicHit, () => this.musicToggleFire());

    this.gamepadNav = new GamepadMenuNav(this, entries);
  }

  private selectVariant(key: VariantKey): void {
    if (!this.saveData.unlockedVariants.includes(key)) return;

    this.saveData.selectedVariant = key;
    this.commitSave();
    this.selectedVariantKey = this.saveData.selectedVariant;
    this.mascot?.setTexture(getVariantByKey(this.selectedVariantKey).textureKey);
    this.updateLoadoutBanner();
    this.renderVariantCarousel();
  }

  private commitSave(): void {
    this.saveData = writeSave(this.saveData);
    this.selectedVariantKey = this.saveData.selectedVariant;
  }

  private updateLoadoutBanner(): void {
    if (!this.loadoutBanner) return;
    const variant = getVariantByKey(this.selectedVariantKey);
    this.loadoutBanner.setText(t('ui.loadout.current_loadout', { name: t(variant.nameKey).toUpperCase() }));
  }

  private getMenuLayout(height: number) {
    return computeMenuLayout(height, this.uiScale);
  }

  private clearVariantPanel(): void {
    for (const element of this.variantPanelElements) {
      element.destroy();
    }
    this.variantPanelElements = [];
  }

  private fadeToScene(key: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    startSceneFadeOut(this, SCENE_FADE_OUT_MS, () => this.scene.start(key));
  }

  private createToggle(
    x: number,
    y: number,
    labelKey: string,
    initialState: boolean,
    onChange: (on: boolean) => void,
    delay: number
  ): { hit: Phaser.GameObjects.Rectangle; fire: () => void } {
    // Derive a short human label from the i18n key — strip the ": {state}" template.
    const rawLabel = t(labelKey, { state: '' }).replace(/:\s*$/, '').trim();

    const result = createGameToggle(this, {
      x,
      y,
      label: rawLabel,
      initialValue: initialState,
      onChange,
    });

    result.container.setAlpha(0).setScale(this.uiScale);
    this.tweens.add({ targets: result.container, alpha: 1, delay, duration: 320 });

    // Transparent hit rect for GamepadMenuNav (same size as before).
    const hit = this.add.rectangle(x, y, 230, 34, 0x000000, 0).setStrokeStyle(0);

    // fire() toggles the value programmatically (gamepad confirm path).
    let on = initialState;
    const fire = () => {
      on = !on;
      result.setValue(on);
      onChange(on);
    };

    return { hit, fire };
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number,
    onClick: () => void,
    delay: number,
    tier: import('../ui/gameButton').ButtonTier = 'primary',
  ): Phaser.GameObjects.Rectangle {
    const { rect: bg, label: text } = createGameButton(this, {
      x, y: y + 24, width, height, label, tier,
      fillOverride: color === COLORS.SCOTTISH_BLUE ? undefined : color,
      fontSize: '26px', uiScale: this.uiScale,
    });
    bg.setAlpha(0);
    text.setAlpha(0);
    bg.setScale(this.uiScale);
    text.setScale(this.uiScale);

    this.tweens.add({
      targets: [bg, text],
      alpha: 1,
      y,
      delay,
      duration: 420,
      ease: 'Power2',
    });

    bg.on('pointerdown', onClick);
    return bg;
  }
}
