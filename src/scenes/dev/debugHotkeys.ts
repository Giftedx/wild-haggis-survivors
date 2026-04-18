/**
 * Dev-only hotkeys for Phase 0 iteration loop. Registered from
 * GameScene in dev mode only (enabled by setting
 * `globalThis.DEV_HOTKEYS = true` in devtools before starting a run).
 * Not shipped to production builds.
 *
 * Hotkeys (Phase 0):
 *   T — toggle tam_o_shanter on/off
 *   K — capture haggis sprite screenshot, downloaded to user's browser
 *   I / W / H — force animation state (idle / walking / hurt)
 *   ESC — clear animation state override
 *   C — toggle Combinations preview scene
 */

import type { Player } from '../../entities/Player';

const DEV_HOTKEY_FLAG =
  typeof globalThis !== 'undefined' &&
  (globalThis as unknown as { DEV_HOTKEYS?: boolean }).DEV_HOTKEYS === true;

export function isDevHotkeysEnabled(): boolean {
  return DEV_HOTKEY_FLAG;
}

export interface DebugHotkeyHooks {
  getPlayer(): Player;
  getScene(): Phaser.Scene;
}

export function registerDebugHotkeys(
  scene: Phaser.Scene,
  hooks: DebugHotkeyHooks,
): void {
  if (!isDevHotkeysEnabled()) return;
  const kb = scene.input.keyboard;
  if (!kb) return;

  // T — toggle tam_o_shanter
  kb.on('keydown-T', () => {
    const p = hooks.getPlayer();
    const has = (p as unknown as { ownedAccessories: Array<{ id: string }> })
      .ownedAccessories.some((a) => a.id === 'tam_o_shanter');
    if (has) p.unequipAccessory('tam_o_shanter');
    else p.equipAccessory('tam_o_shanter');
  });

  // K — screenshot capture to user's browser downloads
  kb.on('keydown-K', () => {
    captureHaggisScreenshot(scene, hooks.getPlayer());
  });

  // I, W, H — force animation state; ESC clears the override.
  kb.on('keydown-I', () => hooks.getPlayer().overrideAnimationState('idle'));
  kb.on('keydown-W', () => hooks.getPlayer().overrideAnimationState('walking'));
  kb.on('keydown-H', () => hooks.getPlayer().overrideAnimationState('hurt'));
  kb.on('keydown-ESC', () => hooks.getPlayer().overrideAnimationState(null));

  // C — toggle Combinations preview scene
  kb.on('keydown-C', () => {
    const scene = hooks.getScene();
    scene.scene.pause('Game');
    scene.scene.launch('CombinationsPreview');
  });
}

function captureHaggisScreenshot(scene: Phaser.Scene, player: Player): void {
  const rt = scene.add.renderTexture(player.x - 60, player.y - 60, 120, 120);
  rt.setVisible(false);
  rt.draw(player, 60, 60);
  const canvas = (rt as unknown as { canvas?: HTMLCanvasElement }).canvas;
  if (!canvas) {
    rt.destroy();
    return;
  }
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = dataUrl;
  a.download = `haggis-capture-${ts}.png`;
  a.click();
  rt.destroy();
}
