import type Phaser from 'phaser';
import { t } from '../core/i18n';
import { createGameButton } from './gameButton';

export interface PhotosensitivityWarningSplashOptions {
  /** Fires once when the player dismisses the splash. */
  onDismiss: () => void;
  /** Optional scale for the overlay content. Defaults to 1. */
  uiScale?: number;
  /** Optional depth floor for the overlay. Defaults to 10000. */
  depth?: number;
}

export interface PhotosensitivityWarningSplashHandle {
  /** Manually tear the splash down (e.g. scene shutdown). */
  destroy: () => void;
  /** True until the player (or caller) dismisses the splash. */
  isActive: () => boolean;
}

/**
 * A1 M5 — first-launch photosensitivity warning overlay.
 *
 * Visual posture: full-screen scrim + centered panel, Hearth-warm
 * palette (amber stroke on deep ink) rather than the sterile PSA
 * aesthetic. Copy stays direct but warm. The "I understand" button is
 * the only dismissal path — no press-anywhere-to-skip, no auto-dismiss
 * timer: the whole point is a deliberate acknowledgement.
 *
 * Keyboard: Enter / Space / Escape all dismiss (Escape included so
 * someone hitting the universal "close" key gets the same flag-flip —
 * failing to dismiss and then reloading would stuck-loop the splash).
 * Gamepad: A / Start dismiss.
 *
 * The function is scene-agnostic: it adds Phaser objects to the scene
 * display list at a high depth and returns a handle to tear them
 * down. It does NOT write to SettingsManager — the caller persists
 * the dismissal in the `onDismiss` callback so the caller can choose
 * whether to flip the flag (production path) or skip the write (test
 * path) without special-casing the overlay.
 */
export function showPhotosensitivityWarningSplash(
  scene: Phaser.Scene,
  opts: PhotosensitivityWarningSplashOptions,
): PhotosensitivityWarningSplashHandle {
  const { width, height } = scene.scale;
  const uiScale = opts.uiScale ?? 1;
  const baseDepth = opts.depth ?? 10000;

  let dismissed = false;
  const cleanup: Phaser.GameObjects.GameObject[] = [];

  // Scrim — full-screen interactive blocker so pointerdown inside the
  // splash can't leak into underlying scenes (BootScene's dawn painting
  // runs beneath us).
  const scrim = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x05050a, 0.88)
    .setDepth(baseDepth)
    .setInteractive();
  cleanup.push(scrim);

  // Panel — warm ink with amber stroke. Geometry derived so it
  // scales with uiScale and never overflows the viewport.
  const panelW = Math.min(width - 64, Math.round(520 * uiScale));
  const panelH = Math.min(height - 96, Math.round(330 * uiScale));
  const panel = scene.add
    .rectangle(width / 2, height / 2, panelW, panelH, 0x14100d, 1)
    .setStrokeStyle(2, 0xd8a050, 0.9)
    .setDepth(baseDepth + 1);
  cleanup.push(panel);

  const topY = height / 2 - panelH / 2 + 34;

  const title = scene.add
    .text(width / 2, topY, t('ui.photosensitivity.title'), {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#f2c47a',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScale(uiScale)
    .setDepth(baseDepth + 2);
  cleanup.push(title);

  const body = scene.add
    .text(width / 2, height / 2 - 16, t('ui.photosensitivity.body'), {
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
    .text(width / 2, height / 2 + panelH / 2 - 84, t('ui.photosensitivity.hint'), {
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
    label: t('ui.photosensitivity.dismiss'),
    tier: 'primary',
    fontSize: '15px',
    uiScale,
    fillOverride: 0x3a2418,
    hoverOverride: 0x4a2e1c,
    textColorOverride: '#f2c47a',
  });
  btn.setDepth(baseDepth + 2).setStrokeStyle(2, 0xd8a050, 0.9);
  btnLabel.setDepth(baseDepth + 3);
  cleanup.push(btn, btnLabel);

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    // Tear the listeners down before the user-supplied callback so a
    // callback that restarts the scene doesn't double-fire us.
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

  // Gamepad: A (button 0) or Start (button 9) dismiss. Poll on scene
  // update so we don't need our own RAF loop. Seed `prevPadA` from the
  // CURRENT pressed state, not false: on a fresh save the cultural splash
  // mounts the instant this one is dismissed, and the gamepad poll reads
  // level state (not edges), so a button still held from dismissing the
  // previous splash would read as a fresh press here and skip this splash on
  // the next frame. Seeding true means only a release-then-press dismisses —
  // each splash demands its own deliberate input.
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

  const handle: PhotosensitivityWarningSplashHandle = {
    destroy: () => {
      scene.events.off('update', tickPad);
      dismiss();
    },
    isActive: () => !dismissed,
  };

  // Safety net: if the scene is torn down while the splash is still
  // visible, wipe our listeners so we don't leak into the next scene.
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
