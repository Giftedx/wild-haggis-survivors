import * as Phaser from 'phaser';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { COLORS, COLORS_CSS, UI } from '../config';
import { UpgradeCard, RARITY_COLORS } from '../data/upgrades';
import { getCameraViewport } from './cameraViewport';
import { getSettingsManager } from '../core/SettingsManager';
import { resolveCardRarityGlowStyle } from './cardRarityGlowStyle';
import { computeUpgradeCardLayout } from './upgradeCardLayout';
import { numberToCssColor } from '../utils/colorFormat';
import { TWEEN_INFINITE_BREATHE } from '../utils/tweenPresets';
import { legendaryTrailSpec, resolveRarityPillPulseSpec } from './upgradeCardCelebration';
import { createDomFocusLayer, type DomFocusLayer } from './domFocusLayer';
import { buildUpgradeCardsDomFocusActions } from './upgradeCardsDomFocusActions';
import { bindHubMenuKeyboardNav } from './hubMenuKeyboardNav';
import { GamepadMenuNav, type GamepadMenuEntry } from '../utils/GamepadMenuNav';

/**
 * UpgradeCards — renders 3 selectable upgrade cards on level-up.
 *
 * Elements are added directly to the scene with scrollFactor(0) — NOT
 * in a Container — because Phaser's input system doesn't correctly
 * transform pointer coordinates for interactive objects inside
 * scrollFactor(0) containers when the camera has scrolled.
 *
 * Accessibility: reads uiScale + highContrastUi at show-time so each
 * level-up picks up the current setting (players can open Settings
 * mid-run and re-open the level-up overlay with the new scale). Font
 * sizes scale by uiScale so players on a 1.4x comfort setting actually
 * see bigger level-up text; card dimensions stay fixed so 3-4 cards
 * still fit across the screen.
 *
 * T407 — `GamepadMenuNav` + `bindHubMenuKeyboardNav` mirror the DOM focus
 * layer (ghost hit rects appended after card chrome so layout unit tests
 * stay stable). Digit keys 1–n route through the hub handler so they
 * cannot double-fire alongside a legacy listener.
 */
export class UpgradeCardsUI {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];
  private pendingHandles: import('../utils/UpdateTickers').TickerHandle[] = [];
  private tickers: import('../utils/UpdateTickers').UpdateTickers;
  private onSelect: (card: UpgradeCard) => void;
  private onReroll: (() => void) | null = null;
  private rerollsLeft: number = 0;
  private uiScale: number = 1;
  private highContrastUi: boolean = false;
  /** Active haggis variant key — used to pick variant-specific card icons (kilt tartan). */
  private variantKey: string = 'classic';
  /** Subscription to scene shutdown — guarantees listener cleanup even if hide() never fires. */
  private shutdownSub?: () => void;
  /**
   * T407 — visually hidden DOM mirror for level-up (cards + optional reroll).
   * Sister pattern to ShopScene / MetaShopScene / CurseScene.
   */
  private domFocusLayer: DomFocusLayer | null = null;
  private gamepadNav: GamepadMenuNav | null = null;
  private hubKeyboardUnbind?: () => void;
  /** Card centre positions for legendary trail + DOM parity (set each `show()`). */
  private lastPickCenters: Array<{ x: number; y: number }> = [];

  constructor(scene: Phaser.Scene, onSelect: (card: UpgradeCard) => void, tickers: import('../utils/UpdateTickers').UpdateTickers) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.tickers = tickers;
    // T302 — defensive net: if the scene tears down with the picker
    // open, free DOM + gamepad + hub listeners so they can't fire into a
    // destroyed UI on the next scene boot. Skipped when the test stub
    // scene doesn't expose `events` (existing layout tests pass a
    // minimal mock).
    if (this.scene.events && typeof this.scene.events.once === 'function') {
      const shutdownHandler = () => {
        this.uninstallUpgradeDomFocusLayer();
      };
      this.scene.events.once('shutdown', shutdownHandler);
      this.shutdownSub = () => this.scene.events?.off?.('shutdown', shutdownHandler);
    }
  }

  /** Set the active variant key so kilt card icons match the run's tartan. */
  setVariantKey(key: string): void {
    this.variantKey = key;
  }

  /** Resolve a font size in CSS px from a base px, rounded for crisp bitmap text. */
  private fs(basePx: number): string {
    return `${Math.max(1, Math.round(basePx * this.uiScale))}px`;
  }

  private getUiViewport(): { x: number; y: number; width: number; height: number } {
    const { x, y, width, height } = getCameraViewport(this.scene);
    return { x, y, width, height };
  }

  /** Set the reroll callback and grant one reroll per level-up */
  setRerollCallback(cb: () => void): void {
    this.onReroll = cb;
  }

  /** Grant rerolls (called each time a level-up screen opens) */
  grantReroll(): void {
    this.rerollsLeft = 1;
  }

  show(
    cards: UpgradeCard[],
    level: number,
    opts?: { bannerTitle?: string; bannerSubtitle?: string; hideReroll?: boolean }
  ): void {
    this.hide();
    if (cards.length === 0) return;

    // Refresh comfort settings at each open — players can toggle uiScale or
    // high-contrast mid-run from the pause menu.
    const settings = getSettingsManager().load();
    this.uiScale = settings.uiScale;
    this.highContrastUi = settings.highContrastUi;

    const titleColor = this.highContrastUi ? '#ffe066' : COLORS_CSS.WHISKY_GOLD;
    const titleHover = this.highContrastUi ? '#fff1a6' : '#ffcc44';
    const subtitleColor = this.highContrastUi ? '#d8dfe8' : '#aaaaaa';

    const { x: left, y: top, width, height } = this.getUiViewport();
    const depth = 200;
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // Dark overlay — high opacity to fully hide the green terrain behind
    // Interactive to block joystick/other input from activating through it
    const overlay = this.scene.add.rectangle(centerX, centerY, width, height, COLORS.OVERLAY_DIM, UI.OVERLAY_ALPHA)
      .setScrollFactor(0).setDepth(depth).setInteractive();
    this.elements.push(overlay);

    const titleStr = opts?.bannerTitle ?? t('ui.upgradeCards.level_title', { level });
    const subtitleStr = opts?.bannerSubtitle ?? t('ui.upgradeCards.choose_upgrade');

    // Title — scaled font size and warmer HC palette. Y-offsets scale too
    // so a 1.4x title still has breathing room below it.
    const titleY = top + Math.round(55 * this.uiScale);
    const title = this.scene.add.text(centerX, titleY, titleStr, {
      fontFamily: 'monospace', fontSize: this.fs(40), color: titleColor,
      fontStyle: 'bold', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(title);

    const subtitleY = top + Math.round(100 * this.uiScale);
    const subtitle = this.scene.add.text(centerX, subtitleY, subtitleStr, {
      fontFamily: 'monospace', fontSize: this.fs(18), color: subtitleColor,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(subtitle);

    const rerollEligible = this.rerollsLeft > 0 && this.onReroll !== null && !opts?.hideReroll;
    const rerollY = top + height - Math.round(48 * this.uiScale);

    const triggerReroll = (): void => {
      if (this.rerollsLeft <= 0) return;
      audio.playClick();
      this.rerollsLeft--;
      this.hide();
      this.onReroll!();
    };

    // Reroll button
    if (rerollEligible) {
      const rerollBtn = this.scene.add.text(centerX, rerollY, t('ui.upgradeCards.reroll', { count: this.rerollsLeft }), {
        fontFamily: 'monospace', fontSize: this.fs(18), color: titleColor,
        fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
        backgroundColor: '#2a2a3a', padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3)
        .setInteractive({ useHandCursor: true });
      this.elements.push(rerollBtn);

      rerollBtn.on('pointerover', () => rerollBtn.setColor(titleHover));
      rerollBtn.on('pointerout', () => rerollBtn.setColor(titleColor));
      rerollBtn.on('pointerdown', () => {
        if (this.rerollsLeft > 0) {
          triggerReroll();
        }
      });
    }

    // Card layout — responsive maths extracted to upgradeCardLayout.ts.
    const { cardW, cardH, gap, startX, cardY } = computeUpgradeCardLayout({
      left, top, width, height, cardCount: cards.length,
    });

    this.lastPickCenters = cards.map((_, i) => ({
      x: startX + i * (cardW + gap),
      y: cardY,
    }));

    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap);

      // Stagger animation — raw tickers (UI continues during gameplay pause)
      const handle = this.tickers.addOnce('raw', i * 120, () => {
        audio.playCardReveal(i);
        this.createCard(x, cardY, cardW, cardH, card, depth + 2, i);
      });
      this.pendingHandles.push(handle);
    });

    const navRing = 4;
    const navEntries: GamepadMenuEntry[] = [];
    for (let i = 0; i < cards.length; i++) {
      const x = startX + i * (cardW + gap);
      const ghost = this.scene.add
        .rectangle(x, cardY, cardW + navRing * 2, cardH + navRing * 2, 0x000000, 0.0001)
        .setStrokeStyle(0)
        .setScrollFactor(0)
        .setDepth(depth + 15);
      this.elements.push(ghost);
      const idx = i;
      navEntries.push({
        rect: ghost,
        activate: () => this.commitCardPick(cards[idx]!, idx),
      });
    }
    if (rerollEligible) {
      const ghost = this.scene.add
        .rectangle(centerX, rerollY, 260, 48, 0x000000, 0.0001)
        .setStrokeStyle(0)
        .setScrollFactor(0)
        .setDepth(depth + 15);
      this.elements.push(ghost);
      navEntries.push({ rect: ghost, activate: () => triggerReroll() });
    }

    this.installUpgradeDomFocusLayer(cards, opts, titleStr, subtitleStr, navEntries);

    if (typeof globalThis !== 'undefined') {
      const win = globalThis as unknown as { AUTO_BATTLE?: boolean };
      if (win.AUTO_BATTLE && cards.length > 0) {
        const first = cards[0];
        const maxStaggerMs = (cards.length - 1) * 120;
        const autoPickHandle = this.tickers.addOnce('raw', maxStaggerMs + 100, () => {
          this.commitCardPick(first, 0);
        });
        this.pendingHandles.push(autoPickHandle);
      }
    }
  }

  private uninstallUpgradeDomFocusLayer(): void {
    this.hubKeyboardUnbind?.();
    this.hubKeyboardUnbind = undefined;
    this.gamepadNav?.destroy();
    this.gamepadNav = null;
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
  }

  private installUpgradeDomFocusLayer(
    cards: UpgradeCard[],
    opts: { bannerTitle?: string; bannerSubtitle?: string; hideReroll?: boolean } | undefined,
    titleStr: string,
    subtitleStr: string,
    navEntries: GamepadMenuEntry[],
  ): void {
    this.uninstallUpgradeDomFocusLayer();
    const rerollVisible = this.rerollsLeft > 0 && this.onReroll !== null && !opts?.hideReroll;
    const rerollLabel = rerollVisible
      ? t('ui.upgradeCards.reroll', { count: this.rerollsLeft })
      : '';
    const rerollCb = this.onReroll;
    this.domFocusLayer = createDomFocusLayer({
      id: 'whs-levelup-focus-layer',
      label: titleStr,
      description: subtitleStr,
      role: 'dialog',
      actions: buildUpgradeCardsDomFocusActions({
        cards,
        rerollVisible,
        rerollLabel,
        onPickIndex: (idx) => {
          const card = cards[idx];
          if (!card) return;
          this.commitCardPick(card, idx);
        },
        onReroll:
          rerollVisible && rerollCb
            ? () => {
              if (this.rerollsLeft <= 0) return;
              audio.playClick();
              this.rerollsLeft--;
              this.hide();
              rerollCb();
            }
            : null,
      }),
      initialFocusIndex: 0,
      onFocusIndexChange: (index) => {
        this.gamepadNav?.syncExternalIndex(index);
      },
    });

    const entries = navEntries.filter((e) => e.rect.active);
    this.gamepadNav = new GamepadMenuNav(this.scene, entries, {
      onHighlightChange: (i) => {
        this.domFocusLayer?.setFocusedIndex(i);
      },
    });
    this.domFocusLayer?.setFocusedIndex(this.gamepadNav.getIndex());
    this.hubKeyboardUnbind = bindHubMenuKeyboardNav(this.scene, () => this.gamepadNav);
  }

  /**
   * Shared pick path for pointer, gamepad confirm, hub keyboard, DOM, and digit keys.
   */
  private commitCardPick(card: UpgradeCard, cardIndex: number): void {
    const origin = this.lastPickCenters[cardIndex];
    if (card.rarity === 'legendary' && origin) {
      audio.playLegendarySelect();
      this.spawnLegendaryTrail(origin.x, origin.y);
    } else if (card.effect.type === 'add_passive') {
      audio.playBoonSelect();
    } else {
      audio.playLevelUp();
    }
    this.hide();
    this.onSelect(card);
  }

  private createCard(
    x: number, y: number, w: number, h: number,
    card: UpgradeCard, depth: number, cardIndex: number,
  ): void {
    const borderColor = RARITY_COLORS[card.rarity];

    // Card background — the interactive hit area
    const bg = this.scene.add.rectangle(x, y, w, h, COLORS.BG_DARK)
      .setStrokeStyle(3, borderColor)
      .setScrollFactor(0)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });
    this.elements.push(bg);

    // Rarity glow — animated for legendary, static for rare + low-rarity
    const glowStyle = resolveCardRarityGlowStyle(card.rarity, borderColor);
    const glow = this.scene.add.rectangle(
      x, y, w + glowStyle.padExpand, h + glowStyle.padExpand,
      glowStyle.color, glowStyle.alpha,
    )
      .setScrollFactor(0).setDepth(depth - 1);
    this.elements.push(glow);

    if (card.rarity === 'legendary') {
      // Pulsing golden glow
      this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.1, to: 0.35 },
        scale: { from: 1, to: 1.03 },
        duration: 600,
        ...TWEEN_INFINITE_BREATHE,
      });

      // Sparkle particles around the card
      for (let s = 0; s < 4; s++) {
        const sx = x + Phaser.Math.Between(-w / 2, w / 2);
        const sy = y + Phaser.Math.Between(-h / 2, h / 2);
        const sparkle = this.scene.add.circle(sx, sy, 2, 0xffdd44, 0)
          .setScrollFactor(0).setDepth(depth + 2);
        this.elements.push(sparkle);

        this.scene.tweens.add({
          targets: sparkle,
          alpha: { from: 0, to: 0.8 },
          scale: { from: 0.5, to: 1.5 },
          y: sy - 15,
          duration: 800 + s * 200,
          delay: s * 120,
          yoyo: true,
          repeat: -1,
        });
      }
    }

    // Resolve variant-specific icon for the kilt card (tartan matches active variant).
    const iconKey = card.icon === 'ucard_kilt'
      ? `ucard_kilt_${this.variantKey}`
      : card.icon;

    if (this.scene.textures && !this.scene.textures.exists(iconKey)) {
      throw new Error(`Missing upgrade card icon texture: ${iconKey} (${card.id})`);
    }

    // Rarity frame backing — wooden card with rivets + grain. Drawn FIRST
    // (depth + 1) so the icon renders ON TOP. Pre-fix the frame was added
    // after the icon at the same depth, meaning the frame's opaque inset
    // face hid the icon entirely (player saw an empty rivet-bordered
    // rectangle). Mythic + rune share the legendary frame (no dedicated
    // art baked yet). Skipped when the texture isn't in the cache (test
    // scenes mock a single-icon texture set).
    const frameKeyByRarity: Record<string, string> = {
      common: 'ui_card_frame_common',
      uncommon: 'ui_card_frame_uncommon',
      rare: 'ui_card_frame_rare',
      legendary: 'ui_card_frame_legendary',
      mythic: 'ui_card_frame_mythic',
      rune: 'ui_card_frame_rune',
    };
    const frameKey = frameKeyByRarity[card.rarity] ?? 'ui_card_frame_common';
    let frame: Phaser.GameObjects.Sprite | undefined;
    if (this.scene.textures && this.scene.textures.exists(frameKey)) {
      frame = this.scene.add.sprite(x, y - 72, frameKey)
        .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1)
        .setScale(1.6);
      this.elements.push(frame);
    }

    // Card icon — leave headroom for title + body + footer (rarity strip).
    // Depth + 2 so it sits above the frame backing.
    const icon = this.scene.add.sprite(x, y - 72, iconKey)
      .setScale(1.4).setScrollFactor(0).setDepth(depth + 2);
    this.elements.push(icon);

    // Name — fontSize scales with uiScale so a 1.4x comfort setting
    // actually enlarges card text instead of leaving it tiny. Shrink once
    // to 14px if the base 17px wraps to 3+ lines so long i18n names never
    // bleed down into the description area.
    const descColor = this.highContrastUi ? '#d8dfe8' : '#bbbbbb';
    const nameMaxH = 44 * Math.max(1, this.uiScale);
    let name = this.scene.add.text(x, y - 28, t(card.name), {
      fontFamily: 'monospace', fontSize: this.fs(17), color: '#e8d4a0',
      fontStyle: 'bold', align: 'center', wordWrap: { width: w - 20 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    if (name.height > nameMaxH) {
      name.destroy();
      name = this.scene.add.text(x, y - 28, t(card.name), {
        fontFamily: 'monospace', fontSize: this.fs(14), color: '#e8d4a0',
        fontStyle: 'bold', align: 'center', wordWrap: { width: w - 20 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    }
    this.elements.push(name);

    // Description — shrink font if needed so body text never sits on the rarity pill.
    const rarityPillY = y + h / 2 - 14;
    const descTop = y + 4;
    const maxDescH = Math.max(36, rarityPillY - 14 - descTop);
    const descStr = t(card.description);
    let descFontPx = 14;
    let desc: Phaser.GameObjects.Text | undefined;
    while (descFontPx >= 11) {
      const candidate = this.scene.add.text(x, descTop, descStr, {
        fontFamily: 'monospace',
        fontSize: this.fs(descFontPx),
        color: descColor,
        align: 'center',
        lineSpacing: 3,
        wordWrap: { width: w - 22 },
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(depth + 1);
      if (candidate.height <= maxDescH) {
        desc = candidate;
        break;
      }
      candidate.destroy();
      descFontPx -= 1;
    }
    if (!desc) {
      desc = this.scene.add.text(x, descTop, descStr, {
        fontFamily: 'monospace',
        fontSize: this.fs(11),
        color: descColor,
        align: 'center',
        lineSpacing: 2,
        wordWrap: { width: w - 22 },
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(depth + 1);
      if (desc.height > maxDescH) {
        desc.setCrop(0, 0, desc.width, maxDescH);
      }
    }
    this.elements.push(desc);

    // Rarity pill — width from measured text (i18n-safe), not char count × fixed pitch.
    const rarityText = t(`ui.common.rarity.${card.rarity}`);
    const rarityLabel = this.scene.add.text(x, rarityPillY, rarityText, {
      fontFamily: 'monospace', fontSize: this.fs(11), fontStyle: 'bold',
      color: numberToCssColor(borderColor),
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);
    const pillW = Math.max(rarityLabel.width + 20, 72);
    const pillH = 22;
    const rarityPillBg = this.scene.add.rectangle(x, rarityPillY, pillW, pillH, borderColor, 0.25)
      .setScrollFactor(0).setDepth(depth + 1)
      .setStrokeStyle(1, borderColor, 0.6);
    this.elements.push(rarityPillBg);
    this.elements.push(rarityLabel);

    // Slow breathing pulse on the rarity pill for top-tier cards.
    // resolveRarityPillPulseSpec returns null for non-legendary — no pulse
    // means no tween, no teardown work.
    const pulseSpec = resolveRarityPillPulseSpec(card.rarity);
    if (pulseSpec) {
      this.scene.tweens.add({
        targets: rarityPillBg,
        alpha: { from: pulseSpec.alphaFrom, to: pulseSpec.alphaTo },
        duration: pulseSpec.duration,
        ...TWEEN_INFINITE_BREATHE,
      });
    }

    // Hover — scale up card chrome; description stays unscaled so fitted body text
    // does not re-overlap the footer after hover.
    const cardElements: { setScale(x: number, y: number): void; scaleX: number; scaleY: number }[] =
      [bg, icon, name, rarityLabel, rarityPillBg];
    if (frame) cardElements.push(frame);
    bg.on('pointerover', () => {
      bg.setFillStyle(0x2a2244);
      for (const el of cardElements) {
        el.setScale(el.scaleX * 1.05, el.scaleY * 1.05);
      }
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.BG_DARK);
      // Reset scales — must match the values set at creation (icon is 1.4,
      // frame backing is 1.6, everything else is 1). Using the wrong baseline
      // permanently shrinks/expands chrome after hover.
      icon.setScale(1.4);
      name.setScale(1);
      rarityLabel.setScale(1);
      rarityPillBg.setScale(1);
      bg.setScale(1);
      if (frame) frame.setScale(1.6);
    });

    // Click to select — legendary picks fire a quick spark trail toward
    // the HUD XP bar before teardown, so the level-up moment doesn't
    // just vanish. Spawn the trail directly on the scene (not into
    // `this.elements`) so hide() doesn't kill mid-flight particles.
    bg.on('pointerdown', () => {
      this.commitCardPick(card, cardIndex);
    });
  }

  /** Fires a short spark trail from the picked card toward the HUD XP bar. */
  private spawnLegendaryTrail(cardX: number, cardY: number): void {
    const { x: vx, y: vy, width: vw, height: vh } = this.getUiViewport();
    const target = { x: vx + vw / 2, y: vy + vh - 11 };
    const specs = legendaryTrailSpec(
      { x: cardX, y: cardY },
      target,
      8,
      getSettingsManager().load().reduceParticles === true,
    );
    for (const s of specs) {
      const spark = this.scene.add.circle(s.startX, s.startY, s.radius, 0xffdd44, 0)
        .setScrollFactor(0)
        .setDepth(220);
      this.scene.tweens.add({
        targets: spark,
        x: s.endX,
        y: s.endY,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.4 },
        duration: s.duration,
        delay: s.delay,
        ease: 'Sine.easeIn',
        onComplete: () => spark.destroy(),
      });
    }
  }

  hide(): void {
    this.uninstallUpgradeDomFocusLayer();
    for (const h of this.pendingHandles) h.cancel();
    this.pendingHandles = [];
    this.lastPickCenters = [];

    for (const el of this.elements) {
      this.scene.tweens.killTweensOf(el);
      if ('removeAllListeners' in el) {
        (el as Phaser.GameObjects.GameObject).removeAllListeners();
      }
      el.destroy();
    }
    this.elements = [];
  }

  /** Test / explicit-teardown helper — releases the shutdown subscription. */
  destroy(): void {
    this.uninstallUpgradeDomFocusLayer();
    this.shutdownSub?.();
    this.shutdownSub = undefined;
  }
}
