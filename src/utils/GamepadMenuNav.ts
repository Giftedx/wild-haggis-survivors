import * as Phaser from 'phaser';

/** Pure step helper for D-pad menus — wraps at bounds; `length === 0` yields 0. */
export function stepGamepadMenuIndex(index: number, length: number, direction: number): number {
  if (length <= 0) return 0;
  if (direction > 0) return (index + 1) % length;
  if (direction < 0) return (index - 1 + length) % length;
  return index;
}

export type GamepadMenuEntry = {
  /** Used for focus highlight */
  rect: Phaser.GameObjects.Rectangle;
  /** Primary action (A / South) */
  activate: () => void;
};

/**
 * D-pad / left-stick navigation + face-button confirm for simple vertical menus.
 */
export class GamepadMenuNav {
  private index = 0;
  private prevUp = false;
  private prevDown = false;
  private prevConfirm = false;
  private repeatAcc = 0;
  private readonly repeatMs = 280;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly entries: GamepadMenuEntry[]
  ) {
    if (entries.length > 0) {
      this.scene.events.on('update', this.onUpdate, this);
      this.applyHighlight();
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.events.off('update', this.onUpdate, this);
    this.clearHighlight();
  }

  private clearHighlight(): void {
    for (const e of this.entries) {
      try {
        e.rect.setStrokeStyle(0);
      } catch {
        /* destroyed */
      }
    }
  }

  private applyHighlight(): void {
    for (let i = 0; i < this.entries.length; i++) {
      const e = this.entries[i];
      // Guard both branches — a destroyed rect from a carousel rebuild throws
      // on setStrokeStyle, not just on the focus path.
      if (!e.rect.active) continue;
      if (i === this.index) {
        e.rect.setStrokeStyle(2, 0xffe066, 1);
      } else {
        e.rect.setStrokeStyle(0);
      }
    }
  }

  private onUpdate(_time: number, delta: number): void {
    if (this.entries.length === 0) return;
    const pad = this.scene.input.gamepad?.pad1;
    if (!pad?.connected) {
      this.prevUp = this.prevDown = this.prevConfirm = false;
      return;
    }

    let up = false;
    let down = false;
    if (pad.up) up = true;
    if (pad.down) down = true;
    const sy = pad.leftStick.y;
    if (sy < -0.45) up = true;
    if (sy > 0.45) down = true;

    const upEdge = up && !this.prevUp;
    const downEdge = down && !this.prevDown;
    this.prevUp = up;
    this.prevDown = down;

    if (upEdge || downEdge) {
      this.repeatAcc = 0;
      const len = this.entries.length;
      if (upEdge) this.index = stepGamepadMenuIndex(this.index, len, -1);
      if (downEdge) this.index = stepGamepadMenuIndex(this.index, len, 1);
      this.applyHighlight();
    } else if (up || down) {
      this.repeatAcc += delta;
      if (this.repeatAcc >= this.repeatMs) {
        this.repeatAcc = 0;
        const len = this.entries.length;
        if (up) this.index = stepGamepadMenuIndex(this.index, len, -1);
        if (down) this.index = stepGamepadMenuIndex(this.index, len, 1);
        this.applyHighlight();
      }
    } else {
      this.repeatAcc = 0;
    }

    const a = pad.buttons[0]?.pressed ?? false;
    const startB = pad.buttons[9]?.pressed ?? false;
    const confirm = a || startB;
    const confirmEdge = confirm && !this.prevConfirm;
    this.prevConfirm = confirm;
    if (confirmEdge) {
      const e = this.entries[this.index];
      if (e?.rect.active) e.activate();
    }
  }
}
