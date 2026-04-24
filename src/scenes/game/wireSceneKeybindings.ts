/**
 * wireSceneKeybindings — register GameScene-level keyboard shortcuts:
 *   - pause : bound via `keyBindings.pause` (default ESC + P)
 *   - F3    : toggle debug overlay
 *   - F9    : save last 15s clip (if captureEnabled)
 *   - F10   : save screenshot (if captureEnabled)
 *
 * Pause listens to the generic `keydown` event and matches the current
 * `SettingsManager.keyBindings.pause` slots against `e.code`, so a
 * rebind takes effect next time the player hits the new key. Dev keys
 * (F3/F9/F10) stay hard-coded — not worth exposing in the rebind UI.
 *
 * Uses SubscriptionBag so disposal is single-call — scene shutdown
 * already destroys the bag with the rest of its subscriptions.
 */
import type Phaser from 'phaser';
import type { SubscriptionBag } from '../../utils/SubscriptionBag';
import type { DebugOverlay } from '../../ui/DebugOverlay';
import { getSettingsManager } from '../../core/SettingsManager';

export interface SceneKeybindingHooks {
  togglePause(): void;
  getDebugOverlay(): DebugOverlay | null;
  saveClipF9(): void;
  saveScreenshotF10(): void;
}

export function wireSceneKeybindings(
  keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null,
  subs: SubscriptionBag,
  hooks: SceneKeybindingHooks,
): void {
  if (!keyboard) return;
  const kb: Phaser.Events.EventEmitter = keyboard;
  subs.listen(kb, 'keydown', (e: KeyboardEvent) => {
    const pause = getSettingsManager().load().keyBindings.pause;
    if (e.code === pause.primary || (pause.secondary && e.code === pause.secondary)) {
      hooks.togglePause();
    }
  });
  subs.listen(kb, 'keydown-F3', () => hooks.getDebugOverlay()?.toggle());
  subs.listen(kb, 'keydown-F9', () => hooks.saveClipF9());
  subs.listen(kb, 'keydown-F10', () => hooks.saveScreenshotF10());
}
