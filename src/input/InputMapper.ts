import * as Phaser from 'phaser';
import { ACTION_KEYS, type ActionKey } from '../core/actions';
import { getSettingsManager } from '../core/SettingsManager';
import { codeToPhaserKeyCode } from './keyCodeMap';

/**
 * A1 M3 — scene-scoped polling layer over `ActionKey`-bound keys.
 *
 * Reads the current `keyBindings` from `SettingsManager` at construct
 * time + on every `refresh()`; builds Phaser `Key` objects per slot so
 * existing polling sites stay fast (no per-frame settings read). Call
 * `refresh()` after a rebind so the new key binding takes effect on
 * the next tick — the caller owns when that happens (usually a
 * SettingsInputScene persist-and-apply path).
 *
 * The scene's keyboard plugin owns Phaser.Key lifecycle: when the
 * scene shuts down, Phaser destroys the keys automatically.
 */
export class InputMapper {
  private primary = new Map<ActionKey, Phaser.Input.Keyboard.Key>();
  private secondary = new Map<ActionKey, Phaser.Input.Keyboard.Key>();

  constructor(private scene: Phaser.Scene) {
    this.refresh();
  }

  refresh(): void {
    this.primary.clear();
    this.secondary.clear();
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    const { keyBindings } = getSettingsManager().load();
    for (const action of ACTION_KEYS) {
      const b = keyBindings[action];
      const primaryCode = codeToPhaserKeyCode(b.primary);
      if (primaryCode != null) {
        this.primary.set(action, kb.addKey(primaryCode));
      }
      if (b.secondary) {
        const secondaryCode = codeToPhaserKeyCode(b.secondary);
        if (secondaryCode != null) {
          this.secondary.set(action, kb.addKey(secondaryCode));
        }
      }
    }
  }

  isDown(action: ActionKey): boolean {
    return (this.primary.get(action)?.isDown ?? false)
      || (this.secondary.get(action)?.isDown ?? false);
  }

  justDown(action: ActionKey): boolean {
    const p = this.primary.get(action);
    if (p && Phaser.Input.Keyboard.JustDown(p)) return true;
    const s = this.secondary.get(action);
    if (s && Phaser.Input.Keyboard.JustDown(s)) return true;
    return false;
  }
}
