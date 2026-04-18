/**
 * Dev-only hotkeys for Phase 0 iteration loop. Registered in GameScene
 * regardless of flag state — the gate fires at KEY PRESS time, not
 * registration time. That way setting `globalThis.DEV_HOTKEYS = true`
 * from devtools mid-run actually enables the keys.
 *
 * Hotkeys (Phase 0):
 *   T — toggle tam_o_shanter on/off
 *   K — capture haggis sprite screenshot, downloaded to user's browser
 *   I / W / H — force animation state (idle / walking / hurt)
 *   ESC — clear animation state override
 *   C — toggle Combinations preview scene
 */

import type { Player } from '../../entities/Player';

/**
 * Read from globalThis every call so runtime flag changes work. Previous
 * version cached the value at module load, which made setting the flag
 * after boot a no-op.
 */
export function isDevHotkeysEnabled(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    (globalThis as unknown as { DEV_HOTKEYS?: boolean }).DEV_HOTKEYS === true
  );
}

export interface DebugHotkeyHooks {
  getPlayer(): Player;
  getScene(): Phaser.Scene;
}

export function registerDebugHotkeys(
  scene: Phaser.Scene,
  hooks: DebugHotkeyHooks,
): void {
  const kb = scene.input.keyboard;
  if (!kb) return;

  // Every handler gates at fire time on the live flag so runtime
  // toggling (devtools `globalThis.DEV_HOTKEYS = true`) works without
  // a scene restart.

  kb.on('keydown-T', () => {
    if (!isDevHotkeysEnabled()) return;
    const p = hooks.getPlayer();
    const has = (p as unknown as { ownedAccessories: Array<{ id: string }> })
      .ownedAccessories.some((a) => a.id === 'tam_o_shanter');
    if (has) p.unequipAccessory('tam_o_shanter');
    else p.equipAccessory('tam_o_shanter');
  });

  kb.on('keydown-K', () => {
    if (!isDevHotkeysEnabled()) return;
    captureHaggisScreenshot(scene, hooks.getPlayer());
  });

  kb.on('keydown-I', () => {
    if (!isDevHotkeysEnabled()) return;
    hooks.getPlayer().overrideAnimationState('idle');
  });
  kb.on('keydown-W', () => {
    if (!isDevHotkeysEnabled()) return;
    hooks.getPlayer().overrideAnimationState('walking');
  });
  kb.on('keydown-H', () => {
    if (!isDevHotkeysEnabled()) return;
    hooks.getPlayer().overrideAnimationState('hurt');
  });
  kb.on('keydown-ESC', () => {
    if (!isDevHotkeysEnabled()) return;
    hooks.getPlayer().overrideAnimationState(null);
  });

  kb.on('keydown-C', () => {
    if (!isDevHotkeysEnabled()) return;
    const s = hooks.getScene();
    s.scene.pause('Game');
    s.scene.launch('CombinationsPreview');
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
