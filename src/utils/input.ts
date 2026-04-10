import Phaser from 'phaser';
import { SubscriptionBag } from './SubscriptionBag';

/**
 * Unified input: reads WASD/arrow keys on desktop,
 * virtual joystick on mobile, and returns a normalized direction vector.
 */
export class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> | undefined;

  // Virtual joystick state (mobile)
  private joystickActive = false;
  private joystickPointerId: number = -1; // Track which finger owns the joystick
  private joystickOrigin = { x: 0, y: 0 };
  private joystickCurrent = { x: 0, y: 0 };
  private readonly JOYSTICK_DEAD_ZONE = 15;
  private readonly JOYSTICK_MAX_DIST = 60;

  // Joystick visual elements
  private joystickBase: Phaser.GameObjects.Arc | null = null;
  private joystickThumb: Phaser.GameObjects.Arc | null = null;

  private isTouchDevice: boolean;
  private subs = new SubscriptionBag();

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
    }

    if (this.isTouchDevice) {
      this.setupTouchJoystick();
    }
  }

  /** Returns a normalized {x, y} direction vector. Zero vector = no input. */
  getDirection(): { x: number; y: number } {
    // Touch joystick takes priority if active
    if (this.joystickActive) {
      return this.getJoystickDirection();
    }

    // Keyboard input
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

    // Normalize diagonal movement
    const len = Math.sqrt(x * x + y * y);
    if (len > 0) {
      return { x: x / len, y: y / len };
    }
    return { x: 0, y: 0 };
  }

  private getJoystickDirection(): { x: number; y: number } {
    const dx = this.joystickCurrent.x - this.joystickOrigin.x;
    const dy = this.joystickCurrent.y - this.joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.JOYSTICK_DEAD_ZONE) {
      return { x: 0, y: 0 };
    }

    // Normalize to unit vector — consistent with keyboard (always full speed)
    return {
      x: dx / dist,
      y: dy / dist,
    };
  }

  private setupTouchJoystick(): void {
    const scene = this.scene;

    const ensureVisuals = () => {
      if (this.joystickBase && this.joystickThumb) return;
      // Create joystick visuals (hidden until touch)
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
      // Don't activate joystick if the pointer hit an interactive game object
      // (e.g., upgrade cards, pause buttons) — those should consume the tap
      const hitObjects = scene.input.hitTestPointer(pointer);
      if (hitObjects.some(obj => obj.input?.enabled)) return;

      // Only use left half of screen for joystick, and only if no joystick active
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

        // Clamp thumb visual to max distance
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

    this.subs.listen(scene.input as any, 'pointerdown', onPointerDown);
    this.subs.listen(scene.input as any, 'pointermove', onPointerMove);
    this.subs.listen(scene.input as any, 'pointerup', onPointerUp);
  }

  destroy(): void {
    this.subs.dispose();

    this.joystickBase?.destroy();
    this.joystickThumb?.destroy();
    this.joystickBase = null;
    this.joystickThumb = null;
    this.joystickActive = false;
    this.joystickPointerId = -1;
  }
}
