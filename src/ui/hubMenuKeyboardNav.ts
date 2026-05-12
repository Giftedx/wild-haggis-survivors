import type * as Phaser from 'phaser';
import type { GamepadMenuNav } from '../utils/GamepadMenuNav';

export interface HubMenuKeyboardNavOptions {
  /** When true, key events are ignored (e.g. scene mid-fade). */
  readonly isBlocked?: () => boolean;
}

/**
 * T407 — shared vertical-hub keyboard contract for scenes using `GamepadMenuNav`:
 * arrows, Tab, Enter/Space, digit jump 1–n (same as pause overlay).
 */
export function bindHubMenuKeyboardNav(
  scene: Phaser.Scene,
  getNav: () => GamepadMenuNav | null,
  options?: HubMenuKeyboardNavOptions,
): () => void {
  const handler = (e: KeyboardEvent) => {
    if (options?.isBlocked?.()) return;
    const nav = getNav();
    if (!nav || nav.getEntryCount() === 0) return;
    const n = nav.getEntryCount();
    const digit = parseInt(e.key, 10);
    if (Number.isFinite(digit) && digit >= 1 && digit <= n) {
      e.preventDefault();
      nav.activateIndex(digit - 1);
      return;
    }
    if (
      e.key === 'ArrowLeft' || e.key === 'ArrowUp'
      || (e.key === 'Tab' && e.shiftKey)
    ) {
      e.preventDefault();
      nav.step(-1);
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Tab') {
      e.preventDefault();
      nav.step(1);
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    nav.activateCurrent();
  };
  scene.input.keyboard?.on('keydown', handler);
  return () => {
    scene.input.keyboard?.off('keydown', handler);
  };
}
