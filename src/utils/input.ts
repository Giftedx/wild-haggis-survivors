import Phaser from 'phaser';
import { SubscriptionBag } from './SubscriptionBag';
import type { IInput } from './iInput';
import { clampVectorLength, gamepadStickToMove, mergeMoveVectors, clampJoystickOrigin, type ViewportSafeInsets } from './inputMath';

function readBodySafeInsets(): ViewportSafeInsets {
  if (typeof document === 'undefined' || !document.body) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  const style = getComputedStyle(document.body);
  const px = (value: string): number => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    top: px(style.paddingTop),
    right: px(style.paddingRight),
    bottom: px(style.paddingBottom),
    left: px(style.paddingLeft),
  };
}

const GAMEPAD_MOVE_DEADZONE = 0.22;

/**
 * Unified input: virtual joystick (touch), gamepad (sticks + D-pad), and WASD / arrows.
 * Movement is merged with max length 1. Dash: Space, gamepad South / RT, right-half tap (touch).
 * Pause: ESC/P handled in GameScene; gamepad Start/Options (`consumeMenuPausePressed`) polled there too.
 */
export class InputManager implements IInput {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> | undefined;
  private spaceKey: Phaser.Input.Keyboard.Key | undefined;

  // Virtual joystick state (mobile)
  private joystickActive = false;
  private joystickPointerId: number = -1;
  private joystickOrigin = { x: 0, y: 0 };
  private joystickCurrent = { x: 0, y: 0 };
  private readonly JOYSTICK_DEAD_ZONE = 15;
  private readonly JOYSTICK_MAX_DIST = 60;

  private joystickBase: Phaser.GameObjects.Arc | null = null;
  private joystickThumb: Phaser.GameObjects.Arc | null = null;

  private isTouchDevice: boolean;
  private subs = new SubscriptionBag();

  private pendingTouchDash = false;
  private prevGamepadDash = false;
  private prevGamepadMenu = false;

  // T1 deterministic replay: per-frame snapshot of the most recent direction +
  // whether dash / menu edges fired this tick. Values are cached here (not
  // re-queried) so the GameScene recorder tap doesn't mutate Phaser state a
  // second time. `dashEdgeThisFrame` / `menuEdgeThisFrame` are cleared by
  // `peekReplayFrame()` after each read.
  private lastDir: { x: number; y: number } = { x: 0, y: 0 };
  private dashEdgeThisFrame = false;
  private menuEdgeThisFrame = false;

  constructor(private scene: Phaser.Scene) {
    this.isTouchDevice = scene.sys.game.device.input.touch;

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    if (this.isTouchDevice) {
      this.setupTouchInput();
    }
  }

  /**
   * True once when Space (JustDown), gamepad South / RT edge, or right-zone tap fires.
   * Call at most once per frame (e.g. start of Player.update).
   */
  consumeDashPressed(): boolean {
    let edge = false;
    if (this.pendingTouchDash) {
      this.pendingTouchDash = false;
      edge = true;
    } else if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      edge = true;
    } else if (this.pollGamepadDashEdge()) {
      edge = true;
    }
    if (edge) this.dashEdgeThisFrame = true;
    return edge;
  }

  /**
   * Edge-detected Start / Options (button 9) — pause menu toggle on consoles / handhelds.
   * Matches common HTML5 gamepad layouts (Xbox Start, PlayStation Options).
   */
  consumeMenuPausePressed(): boolean {
    const pad = this.scene.input.gamepad?.pad1;
    if (!pad?.connected) {
      this.prevGamepadMenu = false;
      return false;
    }
    const menu = pad.buttons[9]?.pressed ?? false;
    const edge = menu && !this.prevGamepadMenu;
    this.prevGamepadMenu = menu;
    if (edge) this.menuEdgeThisFrame = true;
    return edge;
  }

  private pollGamepadDashEdge(): boolean {
    const pad = this.scene.input.gamepad?.pad1;
    if (!pad?.connected) {
      this.prevGamepadDash = false;
      return false;
    }
    const south = pad.buttons[0]?.pressed ?? false;
    const rt = (pad.buttons[7]?.value ?? 0) > 0.35;
    const now = south || rt;
    const edge = now && !this.prevGamepadDash;
    this.prevGamepadDash = now;
    return edge;
  }

  /** Returns a normalized {x, y} direction vector. Zero vector = no input. Length ≤ 1. */
  getDirection(): { x: number; y: number } {
    const out = this.resolveDirection();
    this.lastDir = out;
    return out;
  }

  private resolveDirection(): { x: number; y: number } {
    if (this.joystickActive) {
      return this.getJoystickDirection();
    }

    const kb = this.getKeyboardDirection();
    const gp = this.getGamepadMoveVector();

    if (kb.x === 0 && kb.y === 0) return gp;
    if (gp.x === 0 && gp.y === 0) return kb;
    return mergeMoveVectors(kb, gp, 1);
  }

  /**
   * T1 replay — snapshot the values the player actually saw this tick.
   * Clears the dash / menu edge flags so a second peek in the same frame
   * returns `false` for both. Direction persists; zero-input frames still
   * report the last non-zero direction until the player releases, which
   * matches how `Player.lastMoveDir` is already used for the dash
   * fall-back.
   */
  peekReplayFrame(): { dx: number; dy: number; dash: boolean; menu: boolean } {
    const snap = {
      dx: this.lastDir.x,
      dy: this.lastDir.y,
      dash: this.dashEdgeThisFrame,
      menu: this.menuEdgeThisFrame,
    };
    this.dashEdgeThisFrame = false;
    this.menuEdgeThisFrame = false;
    return snap;
  }

  private getKeyboardDirection(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.cursors) {
      if (this.cursors.left.isDown) x -= 1;
      if (this.cursors.right.isDown) x += 1;
      if (this.cursors.up.isDown) y -= 1;
      if (this.cursors.down.isDown) y += 1;
    }

    if (this.wasd) {
      if (this.wasd.A.isDown) x -= 1;
      if (this.wasd.D.isDown) x += 1;
      if (this.wasd.W.isDown) y -= 1;
      if (this.wasd.S.isDown) y += 1;
    }

    return clampVectorLength(x, y, 1);
  }

  private getGamepadMoveVector(): { x: number; y: number } {
    const pad = this.scene.input.gamepad?.pad1;
    if (!pad?.connected) return { x: 0, y: 0 };

    let lx = pad.leftStick.x;
    let ly = pad.leftStick.y;
    const v = gamepadStickToMove(lx, ly, GAMEPAD_MOVE_DEADZONE);
    if (v.x !== 0 || v.y !== 0) return v;

    // D-pad digital (Phaser mapped) — unit vectors, merged as second pass
    let dx = 0;
    let dy = 0;
    if (pad.left) dx -= 1;
    if (pad.right) dx += 1;
    if (pad.up) dy -= 1;
    if (pad.down) dy += 1;
    const dpad = clampVectorLength(dx, dy, 1);
    if (dpad.x !== 0 || dpad.y !== 0) return dpad;

    // Right stick as look/move fallback (Steam Deck / twin-stick comfort)
    lx = pad.rightStick.x;
    ly = pad.rightStick.y;
    return gamepadStickToMove(lx, ly, GAMEPAD_MOVE_DEADZONE);
  }

  private getJoystickDirection(): { x: number; y: number } {
    const dx = this.joystickCurrent.x - this.joystickOrigin.x;
    const dy = this.joystickCurrent.y - this.joystickOrigin.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.JOYSTICK_DEAD_ZONE) {
      return { x: 0, y: 0 };
    }

    return {
      x: dx / dist,
      y: dy / dist,
    };
  }

  /** One pointerdown listener — dash on the right 40%, joystick on the left 60%. */
  private setupTouchInput(): void {
    const scene = this.scene;

    const ensureVisuals = () => {
      if (this.joystickBase && this.joystickThumb) return;
      this.joystickBase = scene.add
        .circle(0, 0, this.JOYSTICK_MAX_DIST, 0xffffff, 0.15)
        .setScrollFactor(0)
        .setDepth(1000)
        .setVisible(false);

      this.joystickThumb = scene.add
        .circle(0, 0, 20, 0xffffff, 0.4)
        .setScrollFactor(0)
        .setDepth(1001)
        .setVisible(false);
    };

    const onPointerDown = (pointer: Phaser.Input.Pointer) => {
      const hitObjects = scene.input.hitTestPointer(pointer);
      if (hitObjects.some((obj) => obj.input?.enabled)) return;

      if (pointer.x >= scene.scale.width * 0.6) {
        this.pendingTouchDash = true;
        return;
      }

      if (!this.joystickActive && pointer.x < scene.scale.width * 0.6) {
        ensureVisuals();
        this.joystickActive = true;
        this.joystickPointerId = pointer.id;

        const insets = readBodySafeInsets();
        const viewport = { width: scene.scale.width, height: scene.scale.height };
        const clamped = clampJoystickOrigin(
          { x: pointer.x, y: pointer.y },
          viewport,
          insets,
          this.JOYSTICK_MAX_DIST,
        );

        this.joystickOrigin.x = clamped.x;
        this.joystickOrigin.y = clamped.y;
        this.joystickCurrent.x = pointer.x;
        this.joystickCurrent.y = pointer.y;

        if (this.joystickBase && this.joystickThumb) {
          this.joystickBase.setPosition(clamped.x, clamped.y).setVisible(true);
          this.joystickThumb.setPosition(pointer.x, pointer.y).setVisible(true);
        }
      }
    };

    const onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (this.joystickActive && pointer.id === this.joystickPointerId && pointer.isDown) {
        this.joystickCurrent.x = pointer.x;
        this.joystickCurrent.y = pointer.y;

        if (this.joystickThumb) {
          const dx = pointer.x - this.joystickOrigin.x;
          const dy = pointer.y - this.joystickOrigin.y;
          const dist = Math.hypot(dx, dy);
          if (dist > this.JOYSTICK_MAX_DIST) {
            const scale = this.JOYSTICK_MAX_DIST / dist;
            this.joystickThumb.setPosition(
              this.joystickOrigin.x + dx * scale,
              this.joystickOrigin.y + dy * scale
            );
          } else {
            this.joystickThumb.setPosition(pointer.x, pointer.y);
          }
        }
      }
    };

    const onPointerUp = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.joystickPointerId) return;
      this.joystickActive = false;
      this.joystickPointerId = -1;
      if (this.joystickBase) this.joystickBase.setVisible(false);
      if (this.joystickThumb) this.joystickThumb.setVisible(false);
    };

    this.subs.listen(scene.input, 'pointerdown', onPointerDown);
    this.subs.listen(scene.input, 'pointermove', onPointerMove);
    this.subs.listen(scene.input, 'pointerup', onPointerUp);
  }

  destroy(): void {
    this.subs.dispose();

    this.joystickBase?.destroy();
    this.joystickThumb?.destroy();
    this.joystickBase = null;
    this.joystickThumb = null;
    this.joystickActive = false;
    this.joystickPointerId = -1;
    this.pendingTouchDash = false;
    this.prevGamepadDash = false;
    this.prevGamepadMenu = false;
  }
}
