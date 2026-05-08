/**
 * GameOverFocusController — owns the action-row focus state for the run
 * result screen. Encapsulates the action entry list, the focused index,
 * the keyboard / gamepad shortcut handlers, and the per-frame edge state
 * for gamepad navigation.
 *
 * Extracted from GameOverScene as part of the Phase 5 scene drain. The
 * controller is constructed once per scene instance and reset on scene
 * reuse. Apply-styles reads the live DOM focus layer via a deps callback
 * so the controller stays decoupled from the layer's own lifecycle
 * (the layer is built/torn-down independently in installDomFocusLayer).
 *
 * No replay determinism dependency — the GameOverScene runs after a run
 * finishes, never inside a replayed game loop.
 */
import type * as Phaser from 'phaser';
import type { DomFocusLayer } from '../../ui/domFocusLayer';
import {
  firstEnabledModalFocusIndex,
  moveModalFocusIndex,
  type ModalFocusEntry,
} from '../../ui/modalFocus';

export interface GameOverActionFocusEntry extends ModalFocusEntry {
  readonly rect: Phaser.GameObjects.Rectangle;
  readonly onActivate: () => void;
  /** Snapshot of the rect's idle stroke (HC tier border or none) so applyStyles can restore it on de-focus. */
  readonly idleStroke: { width: number; color: number; alpha: number };
}

export interface GameOverFocusControllerDeps {
  scene: Phaser.Scene;
  /** Live accessor — controller doesn't own the layer's lifecycle. */
  getDomFocusLayer: () => DomFocusLayer | null;
}

export class GameOverFocusController {
  private actions: GameOverActionFocusEntry[] = [];
  private focusedIndex = -1;
  private keyHandler?: (e: KeyboardEvent) => void;
  private gamepadHandler: (() => void) | null = null;
  private prevPadBack = false;
  private prevPadForward = false;
  private prevPadConfirm = false;

  constructor(private readonly deps: GameOverFocusControllerDeps) {}

  reset(): void {
    this.actions = [];
    this.focusedIndex = -1;
    this.prevPadBack = this.prevPadForward = this.prevPadConfirm = false;
  }

  addAction(entry: GameOverActionFocusEntry): void {
    this.actions.push(entry);
  }

  getActions(): readonly GameOverActionFocusEntry[] {
    return this.actions;
  }

  getAction(index: number): GameOverActionFocusEntry | undefined {
    return this.actions[index];
  }

  getFocusedIndex(): number {
    return this.focusedIndex;
  }

  setFocusedIndex(index: number): void {
    this.focusedIndex = index;
    this.applyStyles();
  }

  /** Seed the initial focused index from the first enabled action. */
  seedFocusFromActions(): void {
    this.focusedIndex = firstEnabledModalFocusIndex(this.actions);
    this.applyStyles();
  }

  move(direction: -1 | 1): void {
    this.focusedIndex = moveModalFocusIndex(this.actions, this.focusedIndex, direction);
    this.applyStyles();
  }

  activate(): void {
    const entry = this.actions[this.focusedIndex];
    if (!entry || entry.disabled) return;
    entry.onActivate();
  }

  applyStyles(): void {
    for (let i = 0; i < this.actions.length; i++) {
      const entry = this.actions[i]!;
      if (i === this.focusedIndex) {
        entry.rect.setStrokeStyle(3, 0xffe080, 1);
      } else if (entry.idleStroke.width > 0) {
        entry.rect.setStrokeStyle(
          entry.idleStroke.width,
          entry.idleStroke.color,
          entry.idleStroke.alpha,
        );
      } else {
        entry.rect.setStrokeStyle();
      }
    }
    // T407 — keep the DOM focus mirror lockstep with the visible Phaser
    // cursor so assistive tech announces the same action the sighted
    // player sees. Layer's setFocusedIndex is a no-op when the index is
    // already current, so we don't need a guard against re-entry.
    const layer = this.deps.getDomFocusLayer();
    if (layer && this.focusedIndex >= 0) layer.setFocusedIndex(this.focusedIndex);
  }

  installKeyboard(): void {
    const keyboard = this.deps.scene.input.keyboard;
    if (!keyboard) return;
    this.keyHandler = (e: KeyboardEvent) => {
      const digit = parseInt(e.key, 10);
      if (Number.isFinite(digit) && digit >= 1 && digit <= this.actions.length) {
        const entry = this.actions[digit - 1];
        if (entry && !entry.disabled) {
          e.preventDefault();
          this.focusedIndex = digit - 1;
          this.applyStyles();
          entry.onActivate();
        }
        return;
      }
      if (
        e.key === 'ArrowLeft' || e.key === 'ArrowUp'
        || (e.key === 'Tab' && e.shiftKey)
      ) {
        e.preventDefault();
        this.move(-1);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Tab') {
        e.preventDefault();
        this.move(1);
        return;
      }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      this.activate();
    };
    keyboard.on('keydown', this.keyHandler);
  }

  uninstallKeyboard(): void {
    if (!this.keyHandler) return;
    this.deps.scene.input.keyboard?.off('keydown', this.keyHandler);
    this.keyHandler = undefined;
  }

  installGamepad(): void {
    this.uninstallGamepad();
    this.gamepadHandler = () => {
      const pad = this.deps.scene.input.gamepad?.pad1;
      if (!pad?.connected) {
        this.prevPadBack = this.prevPadForward = this.prevPadConfirm = false;
        return;
      }
      const back = pad.left || pad.up || pad.leftStick.x < -0.5 || pad.leftStick.y < -0.5;
      const forward = pad.right || pad.down || pad.leftStick.x > 0.5 || pad.leftStick.y > 0.5;
      const confirm = pad.buttons[0]?.pressed === true || pad.buttons[9]?.pressed === true;
      if (back && !this.prevPadBack) this.move(-1);
      if (forward && !this.prevPadForward) this.move(1);
      if (confirm && !this.prevPadConfirm) this.activate();
      this.prevPadBack = back;
      this.prevPadForward = forward;
      this.prevPadConfirm = confirm;
    };
    this.deps.scene.events.on('update', this.gamepadHandler);
  }

  uninstallGamepad(): void {
    if (!this.gamepadHandler) return;
    this.deps.scene.events.off('update', this.gamepadHandler);
    this.gamepadHandler = null;
  }

  dispose(): void {
    this.uninstallKeyboard();
    this.uninstallGamepad();
  }
}
