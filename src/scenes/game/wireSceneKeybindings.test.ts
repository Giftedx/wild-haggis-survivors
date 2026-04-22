import { describe, expect, it, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type Phaser from 'phaser';
import { wireSceneKeybindings } from './wireSceneKeybindings';
import { SubscriptionBag } from '../../utils/SubscriptionBag';

/**
 * Importing Phaser touches `window` at module eval, which breaks the
 * node-env vitest runner (see CLAUDE.md gotcha). Phaser's KeyboardPlugin
 * extends Events.EventEmitter, which is eventemitter3 — so we stand up a
 * plain eventemitter3 and cast through `unknown` for the call.
 */
type FakeKeyboard = EventEmitter & { dummy?: never };

/**
 * wireSceneKeybindings: ESC / P → pause; F3 → debug overlay; F10 → screenshot.
 * Goes through SubscriptionBag so a single bag.dispose() clears them
 * all on scene shutdown.
 */
describe('wireSceneKeybindings', () => {
  it('registers no handlers when keyboard is null', () => {
    const subs = new SubscriptionBag();
    const togglePause = vi.fn();
    const getDebugOverlay = vi.fn(() => null);
    const saveScreenshotF10 = vi.fn();
    wireSceneKeybindings(null, subs, { togglePause, getDebugOverlay, saveScreenshotF10 });
    // dispose is a no-op because nothing was registered
    subs.dispose();
    expect(togglePause).not.toHaveBeenCalled();
  });

  it('ESC and P both trigger togglePause', () => {
    const keyboard = new EventEmitter() as FakeKeyboard;
    const subs = new SubscriptionBag();
    const togglePause = vi.fn();
    const getDebugOverlay = vi.fn(() => null);
    const saveScreenshotF10 = vi.fn();
    wireSceneKeybindings(keyboard as unknown as Phaser.Input.Keyboard.KeyboardPlugin, subs, { togglePause, getDebugOverlay, saveScreenshotF10 });

    keyboard.emit('keydown-ESC');
    expect(togglePause).toHaveBeenCalledTimes(1);
    keyboard.emit('keydown-P');
    expect(togglePause).toHaveBeenCalledTimes(2);
  });

  it('F3 toggles the debug overlay when present, no-op when null', () => {
    const keyboard = new EventEmitter() as FakeKeyboard;
    const subs = new SubscriptionBag();
    const toggle = vi.fn();
    const overlay = { toggle };
    let overlayRef: typeof overlay | null = null;
    const getDebugOverlay = () => overlayRef as never;

    wireSceneKeybindings(keyboard as unknown as Phaser.Input.Keyboard.KeyboardPlugin, subs, { togglePause: vi.fn(), getDebugOverlay, saveScreenshotF10: vi.fn() });

    // Overlay absent → toggle not called
    keyboard.emit('keydown-F3');
    expect(toggle).not.toHaveBeenCalled();

    // Overlay available → F3 toggles it
    overlayRef = overlay;
    keyboard.emit('keydown-F3');
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('subs.dispose() removes every key binding', () => {
    const keyboard = new EventEmitter() as FakeKeyboard;
    const subs = new SubscriptionBag();
    const togglePause = vi.fn();
    const toggle = vi.fn();
    wireSceneKeybindings(keyboard as unknown as Phaser.Input.Keyboard.KeyboardPlugin, subs, {
      togglePause,
      getDebugOverlay: () => ({ toggle } as never),
      saveScreenshotF10: vi.fn(),
    });
    subs.dispose();
    keyboard.emit('keydown-ESC');
    keyboard.emit('keydown-P');
    keyboard.emit('keydown-F3');
    expect(togglePause).not.toHaveBeenCalled();
    expect(toggle).not.toHaveBeenCalled();
  });
});
