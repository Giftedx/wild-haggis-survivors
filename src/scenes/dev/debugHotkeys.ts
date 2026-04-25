/**
 * Dev-only hotkeys for Phase 0 iteration loop.
 *
 * Two-stage gate (T312):
 *   1. **Registration** — `registerDebugHotkeys` early-returns when
 *      `import.meta.env.DEV` is false AND `globalThis.DEV_HOTKEYS` is
 *      not explicitly true. Production builds therefore install zero
 *      keydown listeners, so a stray keypress can never be intercepted
 *      by dev code in shipped bundles.
 *   2. **Fire** — every handler re-checks `isDevHotkeysEnabled()` at
 *      key-press time so setting `globalThis.DEV_HOTKEYS = true` from
 *      devtools (in DEV builds) toggles the keys without a scene reload.
 *
 * Hotkeys (Phase 0):
 *   T — toggle tam_o_shanter on/off
 *   K — capture haggis sprite screenshot, downloaded to user's browser
 *   I / W / H — force animation state (idle / walking / hurt)
 *   ESC — clear animation state override
 *   C — toggle Combinations preview scene
 *   F9 — export full sprite sheet PNG (every baked texture)
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

/**
 * True in DEV builds OR when the runtime devtools flag is explicitly on.
 * Used as the registration-time gate so production bundles never wire
 * the dev keydown listeners at all.
 */
function shouldRegisterDevHotkeys(): boolean {
  // `import.meta.env.DEV` is replaced by Vite at build time — production
  // bundles see a literal `false` here and tree-shake the entire
  // registration body when paired with the early-return below.
  if (import.meta.env.DEV) return true;
  return isDevHotkeysEnabled();
}

export interface DebugHotkeyHooks {
  getPlayer(): Player;
  getScene(): Phaser.Scene;
}

export function registerDebugHotkeys(
  scene: Phaser.Scene,
  hooks: DebugHotkeyHooks,
): void {
  // T312 — production gate. In a shipped build with no devtools flag
  // override, install zero listeners so a stray keypress can never be
  // routed through dev code. DEV builds always register so the runtime
  // `globalThis.DEV_HOTKEYS = true` flip from devtools works mid-run.
  if (!shouldRegisterDevHotkeys()) return;

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

  kb.on('keydown-F9', () => {
    if (!isDevHotkeysEnabled()) return;
    // Switch to the SpriteExport scene which composites every baked
    // texture into a single PNG and auto-downloads it. Primary way to
    // review all art in one go without editing the URL bar.
    const s = hooks.getScene();
    s.scene.start('SpriteExport');
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
