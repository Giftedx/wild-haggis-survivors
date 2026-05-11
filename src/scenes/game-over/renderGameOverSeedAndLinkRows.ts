/**
 * Seed readout + share/postcard/rerun/save-frame/copy-frame/save-clip
 * link rows — extracted from GameOverScene as part of the Phase 5 scene
 * drain. Owns the bottom-of-panel link layout: the seed code line, the
 * postcard / rerun-seed pair (centered when no rerun seed exists), and
 * the conditional capture-tier rows (save frame, copy frame to
 * clipboard, save clip).
 *
 * Pure presentation; no replay determinism dependency. Caller owns the
 * payload accessor so a late-arriving payload (or a payload swapped on
 * scene reuse) is honoured at click time.
 */
import type * as Phaser from 'phaser';
import { getSettingsManager } from '../../core/SettingsManager';
import type { GameScene } from '../GameScene';
import type { GameOverPayload } from '../gameOverPayload';
import { renderGameOverSeedReadout } from './gameOverSeedReadout';
import { renderGameOverPostcardLink } from './gameOverPostcardLink';
import { renderGameOverSaveFrameLink } from './gameOverSaveFrameLink';
import { renderGameOverCopyFrameLink } from './gameOverCopyFrameLink';
import { renderGameOverSaveClipLink } from './gameOverSaveClipLink';
import { renderGameOverRerunSeedLink } from './gameOverRerunSeedLink';
import { renderGameOverShareRunLink } from './gameOverShareRunLink';

/**
 * W27 Phase 4 — feature-detect the modern image clipboard API.
 * Chrome 76+, Firefox 127+, Safari 16.4+ (write). Older browsers
 * fall back to the existing "Save frame" download path.
 */
function isImageClipboardAvailable(): boolean {
  const g = globalThis as unknown as {
    navigator?: { clipboard?: { write?: unknown } };
    ClipboardItem?: unknown;
  };
  return Boolean(g.navigator?.clipboard?.write && g.ClipboardItem);
}

export interface RenderGameOverSeedAndLinkRowsOpts {
  panelCenterX: number;
  panelTop: number;
  PANEL_H: number;
  /** Canvas height — used to clamp link rows above the bottom edge. */
  height: number;
  compact: boolean;
  panelScale: number;
  /** Pre-computed unlock panel centre Y (from renderGameOverInnerPanels). */
  unlockPanelY: number;
  /** Pre-computed unlock panel height. */
  unlockPanelH: number;
  /** Base depth — text renders at depthBase + 3. */
  depthBase: number;
  /** Live payload accessor; re-read at click time so swaps are honoured. */
  getPayload: () => GameOverPayload | null;
  /** Payload — read for seed / rerun / capture decisions at render time. */
  payload: GameOverPayload;
}

/**
 * @returns Y of the action-button row baseline so the caller can mount
 *          the PLAY AGAIN / GOLD SHOP / TAE GRAN'S row at the same Y.
 */
export function renderGameOverSeedAndLinkRows(
  scene: Phaser.Scene,
  opts: RenderGameOverSeedAndLinkRowsOpts,
): { buttonsY: number } {
  const {
    panelCenterX,
    panelTop,
    PANEL_H,
    height,
    compact,
    panelScale,
    unlockPanelY,
    unlockPanelH,
    depthBase: d,
    getPayload,
    payload,
  } = opts;

  // Seed readout — sits just above the action buttons. For daily runs it
  // prefixes "DAILY" and shows the date; for seeded runs just the code.
  // Tapping copies the code to the clipboard so players can share.
  const buttonsY = Math.min(panelTop + PANEL_H - Math.round(22 * panelScale), height - Math.round(32 * panelScale));
  const linkY = Math.min(panelTop + PANEL_H - Math.round(44 * panelScale), height - Math.round(56 * panelScale), buttonsY - Math.round(compact ? 28 : 0));

  if (payload.seedCode) {
    // Clamp seed readout above canvas bottom — default offset assumes a
    // 720px-tall design target, but native 600 clips this by a couple px.
    // At uiScale 1.4 we also anchor it above the scaled unlock panel so
    // the seed code isn't swallowed by the unlock banner.
    const seedY = Math.min(
      Math.max(panelTop + 590, unlockPanelY + unlockPanelH / 2 + Math.round(14 * panelScale)),
      compact ? linkY - Math.round(18 * panelScale) : height - Math.round(42 * panelScale),
    );
    renderGameOverSeedReadout(scene, {
      centerX: panelCenterX,
      y: seedY,
      depth: d + 3,
      code: payload.seedCode,
      isDaily: payload.isDaily === true,
      delay: 1160,
    });
  }

  // Two small text links side-by-side under the seed readout. Postcard
  // saves the frame; rerun starts the exact seed again. Only render
  // rerun when the payload actually carries a numeric seed.
  const hasRerun = typeof payload.runSeed === 'number';
  if (hasRerun) {
    renderGameOverPostcardLink(scene, { centerX: panelCenterX - 100, y: linkY, depth: d + 3, delay: 1180, getPayload });
    renderGameOverRerunSeedLink(scene, { centerX: panelCenterX + 100, y: linkY, depth: d + 3, delay: 1200, getPayload });
    // W82 Share-run link — third in the rerun family. Sits centred on
    // the next row so it doesn't crowd the postcard/rerun pair. Same
    // seed/variant/curse contract as rerun-seed, but writes a deep-link
    // URL to the clipboard instead of restarting the run locally.
    renderGameOverShareRunLink(scene, { centerX: panelCenterX, y: linkY + 16, depth: d + 3, delay: 1210, getPayload });
  } else {
    renderGameOverPostcardLink(scene, { centerX: panelCenterX, y: linkY, depth: d + 3, delay: 1180, getPayload });
  }
  // Save frame link — gated by captureEnabled setting; sits below the
  // share-run link (which already occupies `linkY + 16` when a rerun
  // seed exists). Phase 4 — Copy frame sits beside Save frame when the
  // modern Clipboard API is available (Chrome 76+, FF 127+, Safari
  // 16.4+). Otherwise Save frame keeps the centre slot solo.
  if (getSettingsManager().load().captureEnabled && !compact) {
    // Capture rows shift down by one row when the share-run link is
    // rendered (rerun case); otherwise they keep the historical
    // tight stacking under the postcard.
    const saveFrameLinkY = linkY + (hasRerun ? 32 : 16);
    const hasImageClipboard = isImageClipboardAvailable();
    if (hasImageClipboard) {
      renderGameOverSaveFrameLink(scene, { centerX: panelCenterX - 100, y: saveFrameLinkY, depth: d + 3, delay: 1220, getPayload });
      renderGameOverCopyFrameLink(scene, { centerX: panelCenterX + 100, y: saveFrameLinkY, depth: d + 3, delay: 1230 });
    } else {
      renderGameOverSaveFrameLink(scene, { centerX: panelCenterX, y: saveFrameLinkY, depth: d + 3, delay: 1220, getPayload });
    }
    const gameScene = scene.scene.get('Game') as GameScene | undefined;
    const recorder = gameScene?.getClipRecorder();
    if (recorder?.isAvailable()) {
      renderGameOverSaveClipLink(scene, { centerX: panelCenterX, y: saveFrameLinkY + 16, depth: d + 3, delay: 1240, recorder, getPayload });
    }
  }

  return { buttonsY };
}
