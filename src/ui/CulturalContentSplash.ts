import type Phaser from 'phaser';
import { t } from '../core/i18n';
import { createGameButton } from './gameButton';

export interface CulturalContentSplashOptions {
  /** Fires once when the player dismisses the splash. */
  onDismiss: () => void;
  /** Optional scale for the overlay content. Defaults to 1. */
  uiScale?: number;
  /** Optional depth floor for the overlay. Defaults to 10000. */
  depth?: number;
}

export interface CulturalContentSplashHandle {
  /** Manually tear the splash down (e.g. scene shutdown). */
  destroy: () => void;
  /** True until the player (or caller) dismisses the splash. */
  isActive: () => boolean;
}

/**
 * 2026-05-10 — first-launch cultural-content notice.
 *
 * Visual posture mirrors PhotosensitivityWarningSplash with a Wild-palette
 * stroke (heather purple instead of amber) so the two splashes are
 * visually distinct when shown back-to-back on a fresh save: amber-on-ink
 * for the safety acknowledgement, heather-on-ink for the cultural one.
 *
 * Copy stays warm + direct: this is a respect-signal to Scots / Doric /
 * Shetlandic / Gaelic speakers that the project knows it's drafting their
 * dialect and inviting feedback. The "Aye, understood" button is the only
 * dismissal — no auto-skip — because the acknowledgement is the point.
 *
 * Keyboard: Enter / Space / Escape dismiss. Gamepad: A / Start dismiss.
 *
 * Scene-agnostic. Adds Phaser objects at high depth and returns a handle.
 * Does NOT write to SettingsManager — caller persists the dismissal in
 * `onDismiss`.
 */
export function showCulturalContentSplash(
  scene: Phaser.Scene,
  opts: CulturalContentSplashOptions,
): CulturalContentSplashHandle {
  const { width, height } = scene.scale;
  const uiScale = opts.uiScale ?? 1;
  const baseDepth = opts.depth ?? 10000;

  let dismissed = false;
  const cleanup: Phaser.GameObjects.GameObject[] = [];

  const scrim = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x05050a, 0.88)
    .setDepth(baseDepth)
    .setInteractive();
  cleanup.push(scrim);

  // Heather-purple stroke distinguishes this from the amber-stroked
  // photosensitivity splash. Wild palette per ART_STYLE_BIBLE.
  const panelW = Math.min(width - 64, Math.round(560 * uiScale));
  const panelH = Math.min(height - 96, Math.round(360 * uiScale));
  const panel = scene.add
    .rectangle(width / 2, height / 2, panelW, panelH, 0x14100d, 1)
    .setStrokeStyle(2, 0x8c7aa0, 0.9)
    .setDepth(baseDepth + 1);
  cleanup.push(panel);

  const topY = height / 2 - panelH / 2 + 34;

  const title = scene.add
    .text(width / 2, topY, t('ui.culturalContent.title'), {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#c9b8e0',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScale(uiScale)
    .setDepth(baseDepth + 2);
  cleanup.push(title);

  const body = scene.add
    .text(width / 2, height / 2 - 16, t('ui.culturalContent.body'), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#e8d8c0',
      align: 'center',
      lineSpacing: 3,
      wordWrap: { width: (panelW - 56) / Math.max(1, uiScale) },
    })
    .setOrigin(0.5)
    .setScale(uiScale)
    .setDepth(baseDepth + 2);
  cleanup.push(body);

  const hint = scene.add
    .text(width / 2, height / 2 + panelH / 2 - 84, t('ui.culturalContent.hint'), {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#a8b8d0',
      fontStyle: 'italic',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScale(uiScale)
    .setDepth(baseDepth + 2);
  cleanup.push(hint);

  const btnY = height / 2 + panelH / 2 - 42;
  const { rect: btn, label: btnLabel } = createGameButton(scene, {
    x: width / 2,
    y: btnY,
    width: 240,
    height: 42,
    label: t('ui.culturalContent.dismiss'),
    tier: 'primary',
    fontSize: '15px',
    uiScale,
    fillOverride: 0x2a223a,
    hoverOverride: 0x3a2c4a,
    textColorOverride: '#c9b8e0',
  });
  btn.setDepth(baseDepth + 2).setStrokeStyle(2, 0x8c7aa0, 0.9);
  btnLabel.setDepth(baseDepth + 3);
  cleanup.push(btn, btnLabel);

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    scene.input.keyboard?.off('keydown', onKey);
    for (const go of cleanup) go.destroy();
    opts.onDismiss();
  };

  btn.on('pointerdown', dismiss);
  btnLabel.setInteractive({ useHandCursor: true }).on('pointerdown', dismiss);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      dismiss();
    }
  };
  scene.input.keyboard?.on('keydown', onKey);

  // Gamepad: A (button 0) or Start (button 9) dismiss. Seed `prevPadA` from
  // the CURRENT pressed state, not false: this splash mounts the instant the
  // photosensitivity splash is dismissed, and the gamepad poll reads level
  // state (not edges), so a button still held from that dismissal would read
  // as a fresh press here and skip the cultural notice on the next frame.
  // Seeding true means only a release-then-press dismisses — the notice
  // demands its own deliberate input. (Sister of PhotosensitivityWarningSplash.)
  const padPressed = (): boolean => {
    const pad = scene.input.gamepad?.pad1;
    if (!pad?.connected) return false;
    return (pad.buttons[0]?.pressed ?? false) || (pad.buttons[9]?.pressed ?? false);
  };
  let prevPadA = padPressed();
  const tickPad = () => {
    if (dismissed) return;
    const pad = scene.input.gamepad?.pad1;
    if (!pad?.connected) {
      prevPadA = false;
      return;
    }
    const pressed = (pad.buttons[0]?.pressed ?? false) || (pad.buttons[9]?.pressed ?? false);
    if (pressed && !prevPadA) dismiss();
    prevPadA = pressed;
  };
  scene.events.on('update', tickPad);

  const handle: CulturalContentSplashHandle = {
    destroy: () => {
      scene.events.off('update', tickPad);
      dismiss();
    },
    isActive: () => !dismissed,
  };

  scene.events.once('shutdown', () => {
    scene.events.off('update', tickPad);
    if (!dismissed) {
      for (const go of cleanup) go.destroy();
      scene.input.keyboard?.off('keydown', onKey);
      dismissed = true;
    }
  });

  return handle;
}
