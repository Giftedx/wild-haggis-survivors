import Phaser from 'phaser';
import { SubscriptionBag } from './SubscriptionBag';
import { gamepadStickToMove, mergeMoveVectors } from './inputMath';

const GAMEPAD_MOVE_DEADZONE = 0.22;

/**
 * Unified input: virtual joystick (touch), gamepad (sticks + D-pad), and WASD / arrows.
 * Movement is merged with max length 1. Dash: Space, gamepad South / RT, right-half tap (touch).
 */
export class InputManager {
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
    if (this.pendingTouchDash) {
      this.pendingTouchDash = false;
      return true;
    }
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      return true;
    }
    if (this.pollGamepadDashEdge()) return true;
    return false;
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
    if (this.joystickActive) {
      return this.getJoystickDirection();
    }

    const kb = this.getKeyboardDirection();
    const gp = this.getGamepadMoveVector();

    if (kb.x === 0 && kb.y === 0) return gp;
    if (gp.x === 0 && gp.y === 0) return kb;
    return mergeMoveVectors(kb, gp, 1);
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

    const len = Math.hypot(x, y);
    if (len > 0) {
      return { x: x / len, y: y / len };
    }
    return { x: 0, y: 0 };
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
    const dlen = Math.hypot(dx, dy);
    if (dlen > 0) {
      return { x: dx / dlen, y: dy / dlen };
    }

    // Right stick as look/move fallback (Steam Deck / twin-stick comfort)
    lx = pad.rightStick.x;
    ly = pad.rightStick.y;
    return gamepadStickToMove(lx, ly, GAMEPAD_MOVE_DEADZONE);
  }

  private getJoystickDirection(): { x: number; y: number } {
    const dx = this.joystickCurrent.x - this.joystickOrigin.x;
    const dy = this.joystickCurrent.y - this.joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

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
        this.joystickOrigin.x = pointer.x;
        this.joystickOrigin.y = pointer.y;
        this.joystickCurrent.x = pointer.x;
        this.joystickCurrent.y = pointer.y;

        if (this.joystickBase && this.joystickThumb) {
          this.joystickBase.setPosition(pointer.x, pointer.y).setVisible(true);
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
          const dist = Math.sqrt(dx * dx + dy * dy);
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
  }
}
