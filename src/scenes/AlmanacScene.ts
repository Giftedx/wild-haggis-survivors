import * as Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { textStyle } from '../ui/typography';
import { createBackButton } from './createBackButton';
import { addSceneFadeIn, addAmberHeaderWash, addSceneBackdrop } from './sceneFade';
import { sceneHeaderTextStyle, sceneSubtitleTextStyle } from './sceneHeaderStyle';
import { clickToScene } from './clickToScene';
import { stopAmbientWindOnShutdown } from './stopAmbientWindOnShutdown';
import {
  ALMANAC_TAB_KEYS,
  DEFAULT_ALMANAC_TAB,
  almanacTabLabelKey,
  type AlmanacTabKey,
} from './almanac/tabNavigation';
import { buildBeastiesEntries } from './almanac/buildBeastiesEntries';
import { renderBeastiesBook, type BeastiesBookHandle } from './almanac/BeastiesBook';
import { buildWeysEntries } from './almanac/buildWeysEntries';
import { renderWeysBook, type WeysBookHandle } from './almanac/WeysBook';
import { buildFindsEntries } from './almanac/buildFindsEntries';
import { renderFindsBook, type FindsBookHandle } from './almanac/FindsBook';
import { buildBanterEntries } from './almanac/buildBanterEntries';
import { renderBanterBook, type BanterBookHandle } from './almanac/BanterBook';
import { createExpandState, toggleExpanded, type ExpandState } from './almanac/expandState';
import { flushBeastieKills, loadSave } from '../utils/save';

const TAB_ACTIVE_BG = 0x3a2e12;
const TAB_IDLE_BG = 0x11182a;
const TAB_ACTIVE_STROKE = 0xb48a2a;
const TAB_IDLE_STROKE = 0x2a3550;

/**
 * C1 Highland Almanac — four-book discovery-log surface.
 *
 * Tab bar across the top (Beasties / Weys / Finds / Banter); clicking
 * a tab swaps the body panel out. Each book is a renderer module under
 * `src/scenes/almanac/` that owns its own layout. This file is the
 * thin controller: it holds the active-tab state and delegates body
 * rendering via `renderActiveBook`.
 *
 * Non-goals: progress gating (every tab is visible from run 1),
 * spoiler reveals (handled per-book via silhouettes), and
 * read-position memory across sessions — the scene always opens on
 * the Beasties book per spec §6 "flagship page first".
 */
export class AlmanacScene extends Phaser.Scene {
  private activeTab: AlmanacTabKey = DEFAULT_ALMANAC_TAB;
  private bodyObjects: Phaser.GameObjects.GameObject[] = [];
  private tabObjects: Phaser.GameObjects.GameObject[] = [];
  private activeBookHandle:
    | BeastiesBookHandle
    | WeysBookHandle
    | FindsBookHandle
    | BanterBookHandle
    | null = null;
  /**
   * Per-book expand state. Keyed by tab so flipping between Beasties
   * and a future Weys book doesn't collapse an open entry you were
   * reading; switching back keeps your place.
   */
  private expandStates: Record<AlmanacTabKey, ExpandState> = {
    beasties: createExpandState(),
    weys: createExpandState(),
    finds: createExpandState(),
    banter: createExpandState(),
  };

  constructor() {
    super({ key: 'Almanac' });
  }

  create(): void {
    const { width, height } = this.scale;
    const { uiScale, highContrastUi } = getSettingsManager().load();

    // Flush any pending kill buffer so the Beasties book reads the
    // freshest counts even if the player alt-tabbed mid-run into the
    // Almanac. No-op between runs (buffer is empty).
    flushBeastieKills();

    addSceneBackdrop(this);
    addAmberHeaderWash(this);
    audio.startAmbientWind();
    addSceneFadeIn(this);

    // ── Header ──
    this.add
      .text(width / 2, 36, t('ui.almanac.title'),
        sceneHeaderTextStyle(highContrastUi ? '#ffe08a' : COLORS_CSS.WHISKY_GOLD))
      .setOrigin(0.5)
      .setScale(uiScale);

    this.add
      .text(width / 2, 70, t('ui.almanac.subtitle'),
        sceneSubtitleTextStyle(COLORS_CSS.TEXT_SUBTITLE, width))
      .setOrigin(0.5)
      .setScale(uiScale);

    // ── Tab bar ──
    this.renderTabBar(width, uiScale);

    // ── Active book body ──
    this.renderActiveBook(width, height, uiScale);

    // ── Back button + ESC ──
    const backBtn = createBackButton(this, {
      x: width / 2, y: height - 32, width: 200, height: 38,
      label: t('ui.almanac.back'), fontSize: '15px', uiScale,
    });
    const goBack = clickToScene(this, 'MainMenu');
    backBtn.on('pointerdown', goBack);
    this.input.keyboard?.on('keydown-ESC', goBack);

    stopAmbientWindOnShutdown(this);
  }

  private renderTabBar(width: number, uiScale: number): void {
    for (const o of this.tabObjects) o.destroy();
    this.tabObjects = [];

    const tabCount = ALMANAC_TAB_KEYS.length;
    const barY = 108;
    const barHeight = 32;
    const gutter = 8;
    const horizontalMargin = 40;
    const tabWidth = (width - horizontalMargin * 2 - gutter * (tabCount - 1)) / tabCount;

    ALMANAC_TAB_KEYS.forEach((key, i) => {
      const cx = horizontalMargin + tabWidth / 2 + i * (tabWidth + gutter);
      const isActive = key === this.activeTab;
      const rect = this.add
        .rectangle(cx, barY, tabWidth, barHeight, isActive ? TAB_ACTIVE_BG : TAB_IDLE_BG, 0.9)
        .setStrokeStyle(isActive ? 2 : 1, isActive ? TAB_ACTIVE_STROKE : TAB_IDLE_STROKE, 1)
        .setInteractive({ useHandCursor: true });
      rect.on('pointerdown', () => {
        if (this.activeTab === key) return;
        audio.playClick();
        this.activeTab = key;
        this.renderTabBar(width, uiScale);
        this.renderActiveBook(width, this.scale.height, uiScale);
      });
      this.tabObjects.push(rect);

      const label = this.add
        .text(cx, barY, t(almanacTabLabelKey(key)),
          textStyle('label', {
            color: isActive ? COLORS_CSS.WHISKY_GOLD : COLORS_CSS.TEXT_SUBTITLE,
          }))
        .setOrigin(0.5)
        .setScale(uiScale);
      this.tabObjects.push(label);
    });
  }

  /**
   * Body renderer — each tab dispatches to a renderer module. For M2
   * only Beasties is wired; the other three surfaces render the
   * "coming soon" placeholder so the tab bar stays interactive without
   * silently swapping to blank.
   */
  private renderActiveBook(width: number, height: number, uiScale: number): void {
    this.activeBookHandle?.destroy();
    this.activeBookHandle = null;
    for (const o of this.bodyObjects) o.destroy();
    this.bodyObjects = [];

    const bodyTop = 140;
    const bodyBottom = height - 72;
    const bodyHeight = Math.max(1, bodyBottom - bodyTop);
    const bodyMargin = 24;
    const viewport = {
      x: bodyMargin,
      y: bodyTop,
      width: width - bodyMargin * 2,
      height: bodyHeight,
    };

    if (this.activeTab === 'beasties') {
      const entries = buildBeastiesEntries(loadSave().discoveryLog);
      const tab: AlmanacTabKey = 'beasties';
      this.activeBookHandle = renderBeastiesBook(this, viewport, entries, uiScale, {
        expandedKey: this.expandStates[tab].expandedKey,
        onToggle: (key) => {
          this.expandStates[tab] = toggleExpanded(this.expandStates[tab], key);
          this.renderActiveBook(width, this.scale.height, uiScale);
        },
      });
      return;
    }

    if (this.activeTab === 'weys') {
      const entries = buildWeysEntries(loadSave().discoveryLog);
      const tab: AlmanacTabKey = 'weys';
      this.activeBookHandle = renderWeysBook(this, viewport, entries, uiScale, {
        expandedKey: this.expandStates[tab].expandedKey,
        onToggle: (key) => {
          this.expandStates[tab] = toggleExpanded(this.expandStates[tab], key);
          this.renderActiveBook(width, this.scale.height, uiScale);
        },
      });
      return;
    }

    if (this.activeTab === 'finds') {
      const entries = buildFindsEntries(loadSave().discoveryLog);
      const tab: AlmanacTabKey = 'finds';
      this.activeBookHandle = renderFindsBook(this, viewport, entries, uiScale, {
        expandedKey: this.expandStates[tab].expandedKey,
        onToggle: (key) => {
          this.expandStates[tab] = toggleExpanded(this.expandStates[tab], key);
          this.renderActiveBook(width, this.scale.height, uiScale);
        },
      });
      return;
    }

    if (this.activeTab === 'banter') {
      const entries = buildBanterEntries(loadSave().discoveryLog);
      const tab: AlmanacTabKey = 'banter';
      this.activeBookHandle = renderBanterBook(this, viewport, entries, uiScale, {
        expandedKey: this.expandStates[tab].expandedKey,
        onToggle: (key) => {
          this.expandStates[tab] = toggleExpanded(this.expandStates[tab], key);
          this.renderActiveBook(width, this.scale.height, uiScale);
        },
      });
      return;
    }

    // Unreachable — all four tabs are wired. Defensive placeholder in
    // case a future tab key is added to `ALMANAC_TAB_KEYS` without a
    // renderer.
    const placeholder = this.add
      .text(width / 2, bodyTop + bodyHeight / 2, t('ui.almanac.coming_soon'), {
        ...textStyle('body', { color: COLORS_CSS.TEXT_MUTED, align: 'center' }),
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setScale(uiScale);
    this.bodyObjects.push(placeholder);
  }
}
