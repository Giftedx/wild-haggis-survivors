/**
 * Ironmoor confirmation modal — extracted from SettingsScene as part of
 * the Phase 5 settings drain. Renders a centered scrim + warning panel
 * with No / Yes buttons, wires keyboard (Escape/N cancels, Enter/Y
 * confirms), and tears down all overlay objects on close.
 *
 * Pure presentation helper: caller passes the live uiScale +
 * highContrastUi values plus the `proceed` callback that fires on
 * confirm. The helper owns the lifecycle of the modal (cleanup array +
 * `closed` flag) so a double-click can't double-fire `proceed`.
 *
 * Replay determinism: pure UI; no RNG / no scene-time reads. Safe to
 * extract without touching ReplayRecorder regression.
 */
import * as Phaser from 'phaser';
import { audio } from '../../systems/AudioSystem';
import { t } from '../../core/i18n';
import { createGameButton } from '../../ui/gameButton';
import {
  resolveSettingsPalette,
  SETTINGS_TROUGH_STROKE,
} from '../settingsPalette';

export interface PromptIronmoorConfirmDeps {
  scene: Phaser.Scene;
  uiScale: number;
  highContrastUi: boolean;
  proceed: () => void;
}

export function promptIronmoorConfirm(deps: PromptIronmoorConfirmDeps): void {
  const { scene, uiScale, highContrastUi, proceed } = deps;
  const { width, height } = scene.scale;
  const DEPTH_BASE = 100;
  const palette = resolveSettingsPalette(highContrastUi);

  const scrim = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x000000, 0.72)
    .setDepth(DEPTH_BASE)
    .setInteractive();

  const narrow = width < 600;
  const panelW = Math.min(width - (narrow ? 40 : 80), 520);
  const panelH = narrow ? 280 : 280;
  const panel = scene.add
    .rectangle(width / 2, height / 2, panelW, panelH, 0x1a1420, 1)
    .setStrokeStyle(2, palette.sectionAccent, 1)
    .setDepth(DEPTH_BASE + 1);

  const title = scene.add
    .text(width / 2, height / 2 - panelH / 2 + 36, t('ui.settings.ironmoor_confirm_title'), {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: palette.sectionColor,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScale(uiScale)
    .setDepth(DEPTH_BASE + 2);

  const body = scene.add
    .text(width / 2, height / 2 - 10, t('ui.settings.ironmoor_confirm_body'), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: palette.labelColor,
      align: 'center',
      wordWrap: { width: (panelW - 48) / Math.max(1, uiScale) },
      lineSpacing: 2,
    })
    .setOrigin(0.5)
    .setScale(uiScale)
    .setDepth(DEPTH_BASE + 2);

  const btnY = height / 2 + panelH / 2 - 44;
  const btnGap = narrow ? 16 : 40;
  const btnW = narrow ? Math.floor((panelW - 48 - btnGap) / 2) : 180;
  const btnOffset = btnW / 2 + btnGap / 2;
  const { rect: noBtn, label: noLabel } = createGameButton(scene, {
    x: width / 2 - btnOffset, y: btnY, width: btnW, height: 40,
    label: t('ui.settings.ironmoor_confirm_no'),
    tier: 'tertiary', fontSize: narrow ? '13px' : '15px', uiScale,
  });
  noBtn.setStrokeStyle(2, SETTINGS_TROUGH_STROKE, 0.9).setDepth(DEPTH_BASE + 2);
  noLabel.setDepth(DEPTH_BASE + 3);

  const { rect: yesBtn, label: yesLabel } = createGameButton(scene, {
    x: width / 2 + btnOffset, y: btnY, width: btnW, height: 40,
    label: t('ui.settings.ironmoor_confirm_yes'),
    tier: 'primary', fontSize: narrow ? '13px' : '15px', uiScale,
    fillOverride: 0x3a2218, hoverOverride: 0x4a2a20,
    textColorOverride: highContrastUi ? palette.sectionColor : palette.titleColor,
  });
  yesBtn.setStrokeStyle(2, palette.dangerAccent, 0.9).setDepth(DEPTH_BASE + 2);
  yesLabel.setDepth(DEPTH_BASE + 3);

  const cleanup: Phaser.GameObjects.GameObject[] = [
    scrim, panel, title, body, noBtn, noLabel, yesBtn, yesLabel,
  ];
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    scene.input.keyboard?.off('keydown', onKey);
    for (const go of cleanup) go.destroy();
  };

  const onYes = () => {
    if (closed) return;
    audio.playClick();
    close();
    proceed();
  };
  const onNo = () => {
    if (closed) return;
    audio.playClick();
    close();
  };

  // Factory already wired hover-fill and click sound for both buttons.
  noBtn.on('pointerdown', onNo);
  noLabel.setInteractive({ useHandCursor: true }).on('pointerdown', onNo);

  yesBtn.on('pointerdown', onYes);
  yesLabel.setInteractive({ useHandCursor: true }).on('pointerdown', onYes);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      onNo();
    } else if (e.key === 'Enter' || e.key === 'y' || e.key === 'Y') {
      e.preventDefault();
      onYes();
    }
  };
  scene.input.keyboard?.on('keydown', onKey);
}
