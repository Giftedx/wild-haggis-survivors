/**
 * W27 Friend Challenges panel — inline overlay shown from MainMenuScene
 * when the player has received one or more challenge URLs.
 *
 * Layout:
 *   ┌── dark overlay ──────────────────────────────────────────────────┐
 *   │  FRIEND CHALLENGES                                 [✕ close]     │
 *   │  ─────────────────────────────────────────────────────────────   │
 *   │  Classic · Heavy Legs · beat 12:34          [Beaten ✓]          │
 *   │  Moor Runner                · outlast 8:45  [Try it →]          │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Clicking a row's action button starts the run. Clicking the overlay bg
 * or the close button dismisses the panel without starting a run.
 *
 * Pure scene code — no Phaser imports at the top level (imported lazily
 * via the `scene` argument). Panel objects are tracked in `objects` so
 * `dismiss()` can destroy them cleanly.
 */
import * as Phaser from 'phaser';
import { t } from '../../core/i18n';
import { getVariantByKey } from '../../data/variants';
import { getCurseByKey } from '../../data/curses';
import { formatClockTime } from '../../utils/formatClockTime';
import { audio } from '../../systems/AudioSystem';
import { isChallengeBeaten } from '../../utils/save/friendChallenges';
import type { FriendChallengeRecord } from '../../utils/save/friendChallenges';
import type { SaveManager } from '../../core/SaveManager';

export interface FriendChallengesPanelOpts {
  scene: Phaser.Scene;
  centerX: number;
  centerY: number;
  panelW: number;
  panelH: number;
  depth: number;
  uiScale: number;
  saveManager: SaveManager;
  onStartChallenge: (record: FriendChallengeRecord) => void;
}

const PANEL_BG = 0x1a1a2e;
const PANEL_STROKE = 0x6b4e27;
const TITLE_COLOR = '#e8c060';
const LABEL_COLOR = '#d4c8a8';
const BEATEN_COLOR = '#9de6a8';
const PENDING_COLOR = '#e8c060';
const CLOSE_COLOR = '#a08060';
const ROW_BG = 0x2a2a40;
const ROW_BG_HOVER = 0x3a3a55;
const ROW_H = 50;
const ROW_GAP = 8;

export function showFriendChallengesPanel(opts: FriendChallengesPanelOpts): () => void {
  const { scene, centerX, centerY, panelW, panelH, depth, uiScale, saveManager, onStartChallenge } = opts;
  const objects: Phaser.GameObjects.GameObject[] = [];

  const dismiss = (): void => {
    for (const obj of objects) {
      if (obj.scene) obj.destroy();
    }
    objects.length = 0;
  };

  // Dark overlay — full viewport, click to dismiss.
  const overlay = scene.add
    .rectangle(centerX, centerY, panelW + 80, panelH + 80, 0x000000, 0.65)
    .setDepth(depth)
    .setInteractive();
  overlay.on('pointerdown', dismiss);
  objects.push(overlay);

  // Panel background.
  const panel = scene.add
    .rectangle(centerX, centerY, panelW, panelH, PANEL_BG, 0.97)
    .setDepth(depth + 1)
    .setStrokeStyle(1.5, PANEL_STROKE, 0.9);
  objects.push(panel);

  const panelLeft = centerX - panelW / 2 + 16;
  const panelTop = centerY - panelH / 2 + 14;

  // Title.
  const title = scene.add
    .text(panelLeft, panelTop, t('ui.menu.challenges_panel_title'), {
      fontFamily: 'monospace',
      fontSize: `${Math.round(15 * uiScale)}px`,
      color: TITLE_COLOR,
      fontStyle: 'bold',
    })
    .setDepth(depth + 2);
  objects.push(title);

  // Close button (top-right corner).
  const closeTxt = scene.add
    .text(centerX + panelW / 2 - 16, panelTop, t('ui.menu.challenges_close'), {
      fontFamily: 'monospace',
      fontSize: `${Math.round(13 * uiScale)}px`,
      color: CLOSE_COLOR,
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 2);
  closeTxt.on('pointerdown', dismiss);
  objects.push(closeTxt);

  // Divider line.
  const divider = scene.add
    .rectangle(centerX, panelTop + 24, panelW - 24, 1, 0x6b4e27, 0.5)
    .setDepth(depth + 2);
  objects.push(divider);

  const challenges = saveManager.getFriendChallenges();

  if (challenges.length === 0) {
    const emptyTxt = scene.add
      .text(centerX, centerY, t('ui.menu.challenges_none'), {
        fontFamily: 'monospace',
        fontSize: `${Math.round(13 * uiScale)}px`,
        color: LABEL_COLOR,
        align: 'center',
        wordWrap: { width: panelW - 40 },
      })
      .setOrigin(0.5)
      .setDepth(depth + 2);
    objects.push(emptyTxt);
    return dismiss;
  }

  // Challenge rows — newest first.
  const listTop = panelTop + 34;
  const maxVisible = Math.floor((panelH - 50) / (ROW_H + ROW_GAP));
  const visible = [...challenges].reverse().slice(0, maxVisible);

  for (let i = 0; i < visible.length; i++) {
    const record = visible[i];
    const rowY = listTop + i * (ROW_H + ROW_GAP);
    const rowCx = centerX;

    const beaten = isChallengeBeaten(record);
    const rowBg = scene.add
      .rectangle(rowCx, rowY + ROW_H / 2, panelW - 24, ROW_H, ROW_BG, 0.9)
      .setDepth(depth + 2);
    objects.push(rowBg);

    // Variant + optional curse label.
    const variantDef = getVariantByKey(record.variantKey as Parameters<typeof getVariantByKey>[0]);
    const curseDef = record.curseKey ? getCurseByKey(record.curseKey) : null;
    const nameLabel = curseDef
      ? `${t(variantDef.nameKey)} · ${t(curseDef.nameKey)}`
      : t(variantDef.nameKey);
    const nameTxt = scene.add
      .text(panelLeft + 8, rowY + 8, nameLabel, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(12 * uiScale)}px`,
        color: LABEL_COLOR,
      })
      .setDepth(depth + 3);
    objects.push(nameTxt);

    // Target line.
    const targetKey = record.targetOutcome === 'victory' ? 'ui.menu.challenges_beat' : 'ui.menu.challenges_outlast';
    const targetLine = t(targetKey, { time: formatClockTime(record.targetTimeSec) });
    const attemptNote = record.attempts.length > 0
      ? `  ·  ${t('ui.menu.challenges_attempts', { n: record.attempts.length })}`
      : '';
    const targetTxt = scene.add
      .text(panelLeft + 8, rowY + 26, targetLine + attemptNote, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(11 * uiScale)}px`,
        color: beaten ? BEATEN_COLOR : '#a09080',
      })
      .setDepth(depth + 3);
    objects.push(targetTxt);

    // Status / action button (right side).
    const statusLabel = beaten ? t('ui.menu.challenges_beaten') : t('ui.menu.challenges_pending');
    const statusColor = beaten ? BEATEN_COLOR : PENDING_COLOR;
    const statusTxt = scene.add
      .text(centerX + panelW / 2 - 24, rowY + ROW_H / 2, statusLabel, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(12 * uiScale)}px`,
        color: statusColor,
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 3);
    objects.push(statusTxt);

    // Row is interactive — clicking anywhere starts the challenge.
    rowBg.setInteractive({ useHandCursor: true });
    const startChallenge = (): void => {
      audio.playClick();
      dismiss();
      onStartChallenge(record);
    };
    rowBg.on('pointerover', () => rowBg.setFillStyle(ROW_BG_HOVER, 0.9));
    rowBg.on('pointerout', () => rowBg.setFillStyle(ROW_BG, 0.9));
    rowBg.on('pointerdown', startChallenge);
    statusTxt.on('pointerdown', startChallenge);
  }

  return dismiss;
}
