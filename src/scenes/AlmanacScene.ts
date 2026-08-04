import * as Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { textStyle } from '../ui/typography';
import { createBackButton } from './createBackButton';
import { addSceneFadeIn, addAmberHeaderWash, addSceneBackdrop } from './sceneFade';
import { sceneHeaderTextStyle, sceneSubtitleTextStyle } from './sceneHeaderStyle';
import { stopAmbientWindOnShutdown } from './stopAmbientWindOnShutdown';
import {
  ALMANAC_TAB_KEYS,
  DEFAULT_ALMANAC_TAB,
  almanacTabLabelKey,
  cycleAlmanacTab,
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
import { closeExpanded, createExpandState, toggleExpanded, type ExpandState } from './almanac/expandState';
import { resolveAlmanacEnterToggle, resolveAlmanacEsc } from './almanac/keyboardNav';
import { bumpAlmanacVisit, flushBeastieKills, loadSave } from '../utils/save';
import { SaveManager } from '../core/SaveManager';
import {
  resolveSceneReturnTarget,
  type SceneReturnData,
  type SceneReturnTarget,
} from './returnTarget';
import { createDomFocusLayer, type DomFocusLayer } from '../ui/domFocusLayer';
import { GamepadMenuNav, type GamepadMenuEntry } from '../utils/GamepadMenuNav';
import { buildAlmanacDomFocusActions } from './almanacDomFocusActions';

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
  private returnTo: SceneReturnTarget = 'MainMenu';
  private gamepadNav: GamepadMenuNav | null = null;
  private domFocusLayer: DomFocusLayer | null = null;
  private almanacTabHitRects: Phaser.GameObjects.Rectangle[] = [];
  private almanacBodyNavRect: Phaser.GameObjects.Rectangle | null = null;
  private almanacBackRect: Phaser.GameObjects.Rectangle | null = null;
  private almanacLayoutWidth = 800;
  private almanacLayoutHeight = 600;
  private almanacLayoutUiScale = 1;
  private activeRehearsal: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'Almanac' });
  }

  init(data?: SceneReturnData): void {
    this.returnTo = resolveSceneReturnTarget(data?.returnTo);
    this.activeTab = DEFAULT_ALMANAC_TAB;
    this.activeBookHandle?.destroy();
    this.activeBookHandle = null;
    for (const o of this.tabObjects) o.destroy();
    this.tabObjects = [];
    for (const o of this.bodyObjects) o.destroy();
    this.bodyObjects = [];
    this.gamepadNav?.destroy();
    this.gamepadNav = null;
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
    this.almanacTabHitRects = [];
    this.almanacBodyNavRect = null;
    this.almanacBackRect = null;
  }

  create(): void {
    const { width, height } = this.scale;
    const { uiScale, highContrastUi } = getSettingsManager().load();
    this.almanacLayoutWidth = width;
    this.almanacLayoutHeight = height;
    this.almanacLayoutUiScale = uiScale;

    // Flush any pending kill buffer so the Beasties book reads the
    // freshest counts even if the player alt-tabbed mid-run into the
    // Almanac. No-op between runs (buffer is empty).
    flushBeastieKills();
    bumpAlmanacVisit();

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

    // ── Back button + keyboard navigation ──
    const backBtn = createBackButton(this, {
      x: width / 2, y: height - 32, width: 200, height: 38,
      label: t('ui.almanac.back'), fontSize: '15px', uiScale,
    });
    this.almanacBackRect = backBtn;
    backBtn.on('pointerdown', () => this.almanacGoBack());

    // Esc is overloaded via resolveAlmanacEsc: if an entry is expanded
    // on the active tab, close it; otherwise exit. Lets keyboard users
    // escape a deep read without leaving the Almanac entirely.
    this.input.keyboard?.on('keydown-ESC', this.almanacEscKeyHandler);

    // Tab / Shift+Tab + Left / Right cycle the active book. Capture TAB
    // so the browser doesn't yank focus out of the canvas on press.
    this.input.keyboard?.addCapture('TAB');
    this.input.keyboard?.on('keydown-TAB', this.almanacTabKeyHandler);
    this.input.keyboard?.on('keydown-LEFT', this.almanacArrowLeft);
    this.input.keyboard?.on('keydown-RIGHT', this.almanacArrowRight);

    // Enter toggles the active book's expansion — collapses the open
    // panel, or opens the first entry when nothing is open. Keeps the
    // keyboard contract coherent without a full focused-cell model.
    this.input.keyboard?.on('keydown-ENTER', this.almanacEnterKeyHandler);

    this.events.once('shutdown', () => {
      this.gamepadNav?.destroy();
      this.gamepadNav = null;
      this.domFocusLayer?.destroy();
      this.domFocusLayer = null;
      this.input.keyboard?.off('keydown-ESC', this.almanacEscKeyHandler);
      this.input.keyboard?.off('keydown-TAB', this.almanacTabKeyHandler);
      this.input.keyboard?.off('keydown-LEFT', this.almanacArrowLeft);
      this.input.keyboard?.off('keydown-RIGHT', this.almanacArrowRight);
      this.input.keyboard?.off('keydown-ENTER', this.almanacEnterKeyHandler);
    });

    this.rebuildAlmanacT407Nav();

    stopAmbientWindOnShutdown(this);
  }

  /**
   * First-entry-in-book-order key for the current tab. Delegates to
   * each book's pure VM builder so "first" matches the order the
   * renderer draws. Returns null when the book is empty (a fresh save
   * pre-retroactive-seed Weys/Finds etc. can exhibit this).
   */
  private firstEntryKeyForActiveTab(): string | null {
    const log = loadSave().discoveryLog;
    switch (this.activeTab) {
      case 'beasties': return buildBeastiesEntries(log)[0]?.key ?? null;
      case 'weys':     return buildWeysEntries(log)[0]?.key ?? null;
      case 'finds':    return buildFindsEntries(log, new SaveManager().load().oldDroverRevealedCount, loadSave().fieldNotesLifetime ?? 0)[0]?.key ?? null;
      case 'banter':   return buildBanterEntries(log)[0]?.key ?? null;
    }
  }

  private almanacGoBack = (): void => {
    audio.playClick();
    this.scene.start(this.returnTo);
  };

  private almanacEscKeyHandler = (): void => {
    if (resolveAlmanacEsc(this.activeTab, this.expandStates) === 'close-expanded') {
      this.expandStates[this.activeTab] = closeExpanded(this.expandStates[this.activeTab]);
      this.renderActiveBook(this.almanacLayoutWidth, this.almanacLayoutHeight, this.almanacLayoutUiScale);
      return;
    }
    this.almanacGoBack();
  };

  private almanacCycleTab = (direction: 'next' | 'prev'): void => {
    audio.playClick();
    this.activeTab = cycleAlmanacTab(this.activeTab, direction);
    this.renderTabBar(this.almanacLayoutWidth, this.almanacLayoutUiScale);
    this.renderActiveBook(this.almanacLayoutWidth, this.almanacLayoutHeight, this.almanacLayoutUiScale);
  };

  private almanacTabKeyHandler = (event: KeyboardEvent): void => {
    this.almanacCycleTab(event.shiftKey ? 'prev' : 'next');
  };

  private almanacArrowLeft = (): void => {
    this.almanacCycleTab('prev');
  };

  private almanacArrowRight = (): void => {
    this.almanacCycleTab('next');
  };

  private almanacPerformEnterToggle = (): void => {
    const firstKey = this.firstEntryKeyForActiveTab();
    const action = resolveAlmanacEnterToggle(firstKey, this.expandStates[this.activeTab]);
    if (action.action === 'none') return;
    audio.playClick();
    this.expandStates[this.activeTab] =
      action.action === 'collapse'
        ? closeExpanded(this.expandStates[this.activeTab])
        : toggleExpanded(this.expandStates[this.activeTab], action.key!);
    this.renderActiveBook(this.almanacLayoutWidth, this.almanacLayoutHeight, this.almanacLayoutUiScale);
  };

  private almanacEnterKeyHandler = (): void => {
    this.almanacPerformEnterToggle();
  };

  /**
   * T407 — gamepad rects + DOM focus mirror. Does **not** use
   * `bindHubMenuKeyboardNav`: ArrowLeft/ArrowRight are reserved for tab
   * cycling (see `almanac/keyboardNav.ts`).
   */
  private rebuildAlmanacT407Nav(): void {
    this.gamepadNav?.destroy();
    this.gamepadNav = null;
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;

    const entries: GamepadMenuEntry[] = [];
    for (let i = 0; i < ALMANAC_TAB_KEYS.length; i++) {
      const tabKey = ALMANAC_TAB_KEYS[i]!;
      const rect = this.almanacTabHitRects[i];
      if (!rect?.active) continue;
      entries.push({
        rect,
        activate: () => {
          if (this.activeTab === tabKey) return;
          audio.playClick();
          this.activeTab = tabKey;
          this.renderTabBar(this.almanacLayoutWidth, this.almanacLayoutUiScale);
          this.renderActiveBook(this.almanacLayoutWidth, this.almanacLayoutHeight, this.almanacLayoutUiScale);
        },
      });
    }

    if (this.almanacBodyNavRect?.active) {
      entries.push({
        rect: this.almanacBodyNavRect,
        activate: () => this.almanacPerformEnterToggle(),
      });
    }

    if (this.almanacBackRect?.active) {
      entries.push({
        rect: this.almanacBackRect,
        activate: () => this.almanacGoBack(),
      });
    }

    if (entries.length === 0) return;

    const tabs = ALMANAC_TAB_KEYS.map((k) => ({ key: k, label: t(almanacTabLabelKey(k)) }));

    this.domFocusLayer = createDomFocusLayer({
      id: 'whs-almanac-focus-layer',
      label: t('ui.almanac.title'),
      description: t('ui.almanac.subtitle'),
      role: 'group',
      actions: buildAlmanacDomFocusActions({
        tabs,
        bookPanelLabel: t('ui.almanac.subtitle'),
        onSelectTab: (sel) => {
          if (this.activeTab === sel) return;
          audio.playClick();
          this.activeTab = sel;
          this.renderTabBar(this.almanacLayoutWidth, this.almanacLayoutUiScale);
          this.renderActiveBook(this.almanacLayoutWidth, this.almanacLayoutHeight, this.almanacLayoutUiScale);
        },
        onBookPanel: () => this.almanacPerformEnterToggle(),
        onBack: () => this.almanacGoBack(),
      }),
      initialFocusIndex: 0,
      onFocusIndexChange: (index) => {
        this.gamepadNav?.syncExternalIndex(index);
      },
    });

    this.gamepadNav = new GamepadMenuNav(this, entries, {
      onHighlightChange: (i) => this.domFocusLayer?.setFocusedIndex(i),
    });
    this.domFocusLayer.setFocusedIndex(this.gamepadNav.getIndex());
  }

  private renderTabBar(width: number, uiScale: number): void {
    for (const o of this.tabObjects) o.destroy();
    this.tabObjects = [];
    this.almanacTabHitRects = [];

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
        this.renderActiveBook(
          this.almanacLayoutWidth,
          this.almanacLayoutHeight,
          this.almanacLayoutUiScale,
        );
      });
      this.tabObjects.push(rect);
      this.almanacTabHitRects.push(rect);

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
    this.almanacBodyNavRect = null;

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

    this.almanacBodyNavRect = this.add
      .rectangle(
        viewport.x + viewport.width / 2,
        viewport.y + viewport.height / 2,
        viewport.width,
        viewport.height,
        0x000000,
        0,
      )
      .setDepth(-8);
    this.bodyObjects.push(this.almanacBodyNavRect);

    if (this.activeTab === 'beasties') {
      const entries = buildBeastiesEntries(loadSave().discoveryLog);
      const tab: AlmanacTabKey = 'beasties';
      this.activeBookHandle = renderBeastiesBook(this, viewport, entries, uiScale, {
        expandedKey: this.expandStates[tab].expandedKey,
        onToggle: (key) => {
          this.expandStates[tab] = toggleExpanded(this.expandStates[tab], key);
          this.renderActiveBook(
            this.almanacLayoutWidth,
            this.almanacLayoutHeight,
            this.almanacLayoutUiScale,
          );
        },
      });
      this.rebuildAlmanacT407Nav();
      return;
    }

    if (this.activeTab === 'weys') {
      const entries = buildWeysEntries(loadSave().discoveryLog);
      const tab: AlmanacTabKey = 'weys';
      this.activeBookHandle = renderWeysBook(this, viewport, entries, uiScale, {
        expandedKey: this.expandStates[tab].expandedKey,
        onToggle: (key) => {
          this.expandStates[tab] = toggleExpanded(this.expandStates[tab], key);
          this.renderActiveBook(
            this.almanacLayoutWidth,
            this.almanacLayoutHeight,
            this.almanacLayoutUiScale,
          );
        },
      });
      this.rebuildAlmanacT407Nav();
      return;
    }

    if (this.activeTab === 'finds') {
      const mainSave = loadSave();
      const entries = buildFindsEntries(
        mainSave.discoveryLog,
        new SaveManager().load().oldDroverRevealedCount,
        mainSave.fieldNotesLifetime ?? 0,
      );
      const tab: AlmanacTabKey = 'finds';
      this.activeBookHandle = renderFindsBook(this, viewport, entries, uiScale, {
        expandedKey: this.expandStates[tab].expandedKey,
        onToggle: (key) => {
          this.expandStates[tab] = toggleExpanded(this.expandStates[tab], key);
          this.renderActiveBook(
            this.almanacLayoutWidth,
            this.almanacLayoutHeight,
            this.almanacLayoutUiScale,
          );
        },
      });
      this.rebuildAlmanacT407Nav();
      return;
    }

    if (this.activeTab === 'banter') {
      const entries = buildBanterEntries(loadSave().discoveryLog);
      const tab: AlmanacTabKey = 'banter';
      this.activeBookHandle = renderBanterBook(this, viewport, entries, uiScale, {
        expandedKey: this.expandStates[tab].expandedKey,
        onToggle: (key) => {
          this.expandStates[tab] = toggleExpanded(this.expandStates[tab], key);
          this.renderActiveBook(
            this.almanacLayoutWidth,
            this.almanacLayoutHeight,
            this.almanacLayoutUiScale,
          );
        },
        onHearAgain: (key) => this.rehearseBanterLine(key),
      });
      this.rebuildAlmanacT407Nav();
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
    this.rebuildAlmanacT407Nav();
  }

  /**
   * C1 M4 Task 21 — local rehearsal of a heard banter line. The Almanac
   * scene is decoupled from the in-game `BanterSystem` instance (lives
   * in GameScene), so Hear Again renders directly to a short-lived
   * toast on this scene. User-initiated, so it bypasses rate-limit /
   * frequency gates by design — the player clicked, they deserve the
   * line.
   */
  private rehearseBanterLine(key: string): void {
    if (this.activeRehearsal) {
      this.activeRehearsal.destroy();
      this.activeRehearsal = null;
    }
    const resolved = t(key);
    if (resolved === key) return; // no translation — stay silent per BanterSystem contract
    const { width, height } = this.scale;
    const { uiScale } = getSettingsManager().load();
    const toast = this.add
      .text(width / 2, height - 72, resolved,
        textStyle('label', { color: COLORS_CSS.WHISKY_GOLD, align: 'center' }))
      .setOrigin(0.5, 1)
      .setScale(uiScale)
      .setAlpha(0);
    this.activeRehearsal = toast;
    this.tweens.add({
      targets: toast, alpha: 1, duration: 180, ease: 'Sine.easeOut',
    });
    this.time.delayedCall(2400, () => {
      if (!toast.scene) return;
      this.tweens.add({
        targets: toast, alpha: 0, duration: 280, ease: 'Sine.easeIn',
        onComplete: () => {
          if (this.activeRehearsal === toast) this.activeRehearsal = null;
          toast.destroy();
        },
      });
    });
  }
}
