/**
 * wireSceneKeybindings — register GameScene-level keyboard shortcuts:
 *   - ESC / P : toggle pause menu
 *   - F3      : toggle debug overlay
 *   - F10     : save screenshot (if captureEnabled)
 *
 * Uses SubscriptionBag so disposal is single-call — scene shutdown
 * already destroys the bag with the rest of its subscriptions.
 */
import type Phaser from 'phaser';
import type { SubscriptionBag } from '../../utils/SubscriptionBag';
import type { DebugOverlay } from '../../ui/DebugOverlay';

export interface SceneKeybindingHooks {
  togglePause(): void;
  getDebugOverlay(): DebugOverlay | null;
  saveScreenshotF10(): void;
}

export function wireSceneKeybindings(
  keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null,
  subs: SubscriptionBag,
  hooks: SceneKeybindingHooks,
): void {
  if (!keyboard) return;
  // Phaser's KeyboardPlugin extends Events.EventEmitter, which satisfies
  // SubscriptionBag's MinimalEmitter contract. Widen to the concrete base
  // class so TypeScript sees the `on`/`off` surface it expects.
  const kb: Phaser.Events.EventEmitter = keyboard;
  subs.listen(kb, 'keydown-ESC', () => hooks.togglePause());
  subs.listen(kb, 'keydown-P', () => hooks.togglePause());
  subs.listen(kb, 'keydown-F3', () => hooks.getDebugOverlay()?.toggle());
  subs.listen(kb, 'keydown-F10', () => hooks.saveScreenshotF10());
}
