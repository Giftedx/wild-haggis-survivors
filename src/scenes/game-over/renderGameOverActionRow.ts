/**
 * Action button row + DOM focus mirror — extracted from GameOverScene
 * as part of the Phase 5 scene drain. Owns the PLAY AGAIN / GOLD SHOP /
 * TAE GRAN'S geometry math, the three navigation callbacks (start
 * Curse / Shop / Croft + AudioSystem / musicEngine cleanup), the
 * `createResultActionButton` mounts, and the `installDomFocusLayer`
 * mirror used by screen readers + Tab navigation.
 *
 * Pure presentation; no replay determinism dependency. Returns the DOM
 * focus layer so the caller can dispose it from the scene's shutdown
 * handler (single ownership; controller deps reads it lazily).
 */
import type * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../../config';
import { audio } from '../../systems/AudioSystem';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';
import { SaveManager } from '../../core/SaveManager';
import { t } from '../../core/i18n';
import { createDomFocusLayer, type DomFocusLayer } from '../../ui/domFocusLayer';
import type { GameOverPayload } from '../gameOverPayload';
import { buildGameOverDomFocusActions } from '../gameOverDomFocusActions';
import { formatClockTime } from '../gameOverFormatting';
import { createResultActionButton } from './resultPanelBuilders';
import type { GameOverFocusController } from './GameOverFocusController';

export interface RenderGameOverActionRowOpts {
  panelCenterX: number;
  buttonsY: number;
  /** Canvas width — used for action-row gap clamp on narrow viewports. */
  width: number;
  PANEL_W: number;
  compact: boolean;
  uiScale: number;
  payload: GameOverPayload;
  focusController: GameOverFocusController;
}

/**
 * Mounts the action button row (PLAY AGAIN / GOLD SHOP / TAE GRAN'S),
 * wires keyboard + gamepad navigation through the focus controller,
 * and installs the visually-hidden DOM focus mirror so screen readers
 * + Tab users can activate any of the three actions.
 *
 * @returns The DOM focus layer (or `null` if `document` is unavailable
 *          / the payload is missing). Caller is responsible for
 *          calling `.destroy()` on shutdown — the focus controller's
 *          deps reads the layer lazily via the `getDomFocusLayer`
 *          callback rather than owning its lifecycle.
 */
export function renderGameOverActionRow(
  scene: Phaser.Scene,
  opts: RenderGameOverActionRowOpts,
): DomFocusLayer | null {
  const { panelCenterX, buttonsY, width, PANEL_W, compact, uiScale, payload, focusController } = opts;

  // Responsive gap — default design target is ±196 between centre
  // buttons at 800px, but on narrow viewports the left button otherwise
  // clips the canvas edge. Floor keeps the 24px between-button breathing
  // room intact (172 button width + 24 gap = 196 centre-to-centre).
  const actionBtnW = compact ? Math.floor((PANEL_W - 52) / 3) : 172;
  // Compact buttons keep their physical hit targets narrow enough for a
  // three-column mobile row. Clamp the visible label scale so uiScale 1.4
  // does not make PLAY AGAIN / GOLD SHOP / TAE GRAN'S spill into the
  // neighbouring buttons; the DOM focus mirror still exposes full labels.
  const actionButtonUiScale = compact ? Math.min(uiScale, 1) : uiScale;
  const actionSideGap = compact
    ? actionBtnW + 14
    : Math.min(196, Math.max(actionBtnW / 2 + 12, Math.floor((width - actionBtnW - 40) / 2)));
  // Action callbacks shared between the visible Phaser buttons and the
  // T407 DOM focus mirror — single source of truth for activation
  // behaviour so a screen-reader Tab + Enter takes the same path as a
  // pointer click.
  const onPlayAgain = () => {
    audio.playClick();
    musicEngine.stop();
    // Match MenuScene: wipe any lingering suspended-run snapshot before
    // starting a fresh run. GameScene's end-of-run cleanup already clears
    // it, but swallowed storage errors could otherwise resurrect a ghost run.
    try { new SaveManager().clearActiveRun(); } catch { /* ignore */ }
    // T403 — route through Curse picker instead of straight into Game.
    // Lets the player swap curses (or pick A CLEAN RUN) without bouncing
    // through MainMenu — the previous path silently re-launched with no
    // curse, hiding the choice from anyone who cleared a brutal one and
    // wanted a different bargain. The "Rerun seed" link (one row down)
    // still carries the original curse for masochist re-attempts.
    scene.scene.start('Curse');
  };
  const shopLocked = !!payload.noShopAccess;
  const onGoldShop = () => {
    if (shopLocked) return;
    audio.playClick();
    musicEngine.stop();
    scene.scene.start('Shop');
  };
  const onTaeGran = () => {
    audio.playClick();
    musicEngine.stop();
    // H1 T9 — return to Croft hub, not MainMenu.
    scene.scene.start('Croft');
  };

  createResultActionButton(scene, focusController, panelCenterX - actionSideGap, buttonsY, actionBtnW, 42, t('ui.gameOver.play_again'), 'primary', 1240, actionButtonUiScale, onPlayAgain);
  createResultActionButton(
    scene, focusController, panelCenterX, buttonsY, actionBtnW, 42,
    shopLocked ? t('ui.gameOver.upgrades_locked') : t('ui.gameOver.upgrades'),
    'secondary', 1300, actionButtonUiScale, onGoldShop,
    shopLocked
      ? { fillOverride: 0x444444, hoverOverride: 0x444444, textColorOverride: '#888888' }
      : { fillOverride: COLORS.WHISKY_GOLD, hoverOverride: 0xe0b830, textColorOverride: COLORS_CSS.BLACK },
  );
  createResultActionButton(scene, focusController, panelCenterX + actionSideGap, buttonsY, actionBtnW, 42, t('ui.gameOver.menu'), 'secondary', 1360, actionButtonUiScale, onTaeGran);

  focusController.seedFocusFromActions();
  focusController.installKeyboard();
  focusController.installGamepad();
  // T407 — install the DOM-visible focus mirror after all three action
  // buttons exist. Mirrors the Phaser focus state via setFocusedIndex
  // (driven from applyStyles); DOM-side activation routes through
  // the same callbacks the visible buttons use.
  return installDomFocusLayer(payload, focusController, {
    onPlayAgain,
    onGoldShop,
    onTaeGran,
  });
}

/**
 * T407 — mount the visually hidden DOM action mirror. Three buttons
 * (PLAY AGAIN / GOLD SHOP / TAE GRAN'S) reflect the visible row;
 * `aria-label` carries the resolved death/victory title and
 * `aria-describedby` carries a one-line run digest (variant +
 * kills/time/gold). The layer's polite live region announces the
 * focused button as the user navigates.
 */
function installDomFocusLayer(
  payload: GameOverPayload,
  focusController: GameOverFocusController,
  callbacks: {
    onPlayAgain: () => void;
    onGoldShop: () => void;
    onTaeGran: () => void;
  },
): DomFocusLayer | null {
  if (typeof document === 'undefined') return null;
  if (!payload.summary || !payload.runResult) return null;

  const isVictory = payload.isVictory ?? (payload.mode === 'victory');
  const titleKey = isVictory ? 'ui.gameOver.victory_title' : 'ui.gameOver.death_title';
  const summaryDigest = `${payload.variantLabel} · ${t('ui.gameOver.damage_summary', {
    kills: payload.summary.enemiesKilled,
    time: formatClockTime(payload.summary.timeSurvivedSec),
    gold: payload.runResult.goldEarned,
  })}`;

  const actions = buildGameOverDomFocusActions(callbacks);
  return createDomFocusLayer({
    id: 'whs-game-over-focus-layer',
    label: t(titleKey),
    description: summaryDigest,
    role: 'dialog',
    actions,
    initialFocusIndex: Math.max(focusController.getFocusedIndex(), 0),
    onFocusIndexChange: (index) => {
      // Mirror DOM-side focus changes (screen-reader Tab) back into the
      // Phaser-side index so the visible stroke follows assistive-tech
      // navigation. applyStyles → setFocusedIndex on the layer is
      // a no-op when the index is already current, so re-entry is safe.
      const entry = focusController.getAction(index);
      if (!entry || entry.disabled) return;
      focusController.setFocusedIndex(index);
    },
  });
}

