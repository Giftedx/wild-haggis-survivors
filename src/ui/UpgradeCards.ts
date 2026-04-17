import Phaser from 'phaser';
import { t } from '../core/i18n';
import { UpgradeCard, RARITY_COLORS } from '../data/upgrades';
import { getCameraViewport } from './cameraViewport';
import { getSettingsManager } from '../core/SettingsManager';
import { resolveCardRarityGlowStyle } from './cardRarityGlowStyle';
import { computeUpgradeCardLayout } from './upgradeCardLayout';

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
  /** 1/2/3 keyboard shortcut handler — installed in show(), removed in hide(). */
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene, onSelect: (card: UpgradeCard) => void, tickers: import('../utils/UpdateTickers').UpdateTickers) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.tickers = tickers;
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

    const titleColor = this.highContrastUi ? '#ffe066' : '#d4a017';
    const titleHover = this.highContrastUi ? '#fff1a6' : '#ffcc44';
    const subtitleColor = this.highContrastUi ? '#d8dfe8' : '#aaaaaa';

    const { x: left, y: top, width, height } = this.getUiViewport();
    const depth = 200;
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // Dark overlay — high opacity to fully hide the green terrain behind
    // Interactive to block joystick/other input from activating through it
    const overlay = this.scene.add.rectangle(centerX, centerY, width, height, 0x000000, 0.85)
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

    // Reroll button
    if (this.rerollsLeft > 0 && this.onReroll && !opts?.hideReroll) {
      const rerollY = top + height - Math.round(48 * this.uiScale);
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
          this.rerollsLeft--;
          this.hide();
          this.onReroll!();
        }
      });
    }

    // Card layout — responsive maths extracted to upgradeCardLayout.ts.
    const { cardW, cardH, gap, startX, cardY } = computeUpgradeCardLayout({
      left, top, width, height, cardCount: cards.length,
    });

    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap);

      // Stagger animation — raw tickers (UI continues during gameplay pause)
      const handle = this.tickers.addOnce('raw', i * 120, () => {
        this.createCard(x, cardY, cardW, cardH, card, depth + 2);
      });
      this.pendingHandles.push(handle);
    });

    this.installKeyboardShortcuts(cards);

    if (typeof globalThis !== 'undefined') {
      const win = globalThis as unknown as { AUTO_BATTLE?: boolean };
      if (win.AUTO_BATTLE && cards.length > 0) {
        const first = cards[0];
        const maxStaggerMs = (cards.length - 1) * 120;
        const autoPickHandle = this.tickers.addOnce('raw', maxStaggerMs + 100, () => {
          this.hide();
          this.onSelect(first);
        });
        this.pendingHandles.push(autoPickHandle);
      }
    }
  }

  private createCard(
    x: number, y: number, w: number, h: number,
    card: UpgradeCard, depth: number
  ): void {
    const borderColor = RARITY_COLORS[card.rarity];

    // Card background — the interactive hit area
    const bg = this.scene.add.rectangle(x, y, w, h, 0x1a1a2e)
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
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
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
          delay: s * 300,
          yoyo: true,
          repeat: -1,
        });
      }
    }

    if (this.scene.textures && !this.scene.textures.exists(card.icon)) {
      throw new Error(`Missing upgrade card icon texture: ${card.icon} (${card.id})`);
    }

    // Card icon — leave headroom for title + body + footer (rarity strip).
    const icon = this.scene.add.sprite(x, y - 72, card.icon)
      .setScale(1.4).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(icon);

    // Name — fontSize scales with uiScale so a 1.4x comfort setting
    // actually enlarges card text instead of leaving it tiny.
    const descColor = this.highContrastUi ? '#d8dfe8' : '#bbbbbb';
    const name = this.scene.add.text(x, y - 28, t(card.name), {
      fontFamily: 'monospace', fontSize: this.fs(17), color: '#e8d4a0',
      fontStyle: 'bold', align: 'center', wordWrap: { width: w - 20 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
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
    }
    this.elements.push(desc);

    // Rarity pill — width from measured text (i18n-safe), not char count × fixed pitch.
    const rarityText = t(`ui.common.rarity.${card.rarity}`);
    const rarityLabel = this.scene.add.text(x, rarityPillY, rarityText, {
      fontFamily: 'monospace', fontSize: this.fs(11), fontStyle: 'bold',
      color: `#${borderColor.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);
    const pillW = Math.max(rarityLabel.width + 20, 72);
    const pillH = 22;
    const rarityPillBg = this.scene.add.rectangle(x, rarityPillY, pillW, pillH, borderColor, 0.25)
      .setScrollFactor(0).setDepth(depth + 1)
      .setStrokeStyle(1, borderColor, 0.6);
    this.elements.push(rarityPillBg);
    this.elements.push(rarityLabel);

    // Hover — scale up card chrome; description stays unscaled so fitted body text
    // does not re-overlap the footer after hover.
    const cardElements: { setScale(x: number, y: number): void; scaleX: number; scaleY: number }[] =
      [bg, icon, name, rarityLabel, rarityPillBg];
    bg.on('pointerover', () => {
      bg.setFillStyle(0x2a2244);
      for (const el of cardElements) {
        el.setScale(el.scaleX * 1.05, el.scaleY * 1.05);
      }
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x1a1a2e);
      // Reset scales — must match the values set at creation (icon is 1.4,
      // everything else is 1). Using 2 here permanently shrinks the icon
      // every time the player hovers-then-unhovers a card.
      icon.setScale(1.4);
      name.setScale(1);
      rarityLabel.setScale(1);
      rarityPillBg.setScale(1);
      bg.setScale(1);
    });

    // Click to select
    bg.on('pointerdown', () => {
      this.hide();
      this.onSelect(card);
    });
  }

  hide(): void {
    for (const h of this.pendingHandles) h.cancel();
    this.pendingHandles = [];
    this.uninstallKeyboardShortcuts();

    for (const el of this.elements) {
      this.scene.tweens.killTweensOf(el);
      if ('removeAllListeners' in el) {
        (el as Phaser.GameObjects.GameObject).removeAllListeners();
      }
      el.destroy();
    }
    this.elements = [];
  }

  /**
   * 1/2/3 keyboard shortcuts for the level-up card picker — mirrors the
   * ActIntermission picker pattern so keyboard players have one
   * consistent muscle memory. Handler no-ops for pressing a digit beyond
   * the card count (2-card choice can't resolve a "3" press).
   */
  private installKeyboardShortcuts(cards: UpgradeCard[]): void {
    if (typeof window === 'undefined') return;
    this.uninstallKeyboardShortcuts();
    this.keyHandler = (e: KeyboardEvent) => {
      const idx = ({ '1': 0, '2': 1, '3': 2 } as Record<string, number | undefined>)[e.key];
      if (idx === undefined) return;
      const card = cards[idx];
      if (!card) return;
      e.preventDefault();
      this.hide();
      this.onSelect(card);
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  private uninstallKeyboardShortcuts(): void {
    if (!this.keyHandler) return;
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keyHandler);
    }
    this.keyHandler = undefined;
  }
}
