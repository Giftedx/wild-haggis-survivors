import * as Phaser from 'phaser';
import { SubscriptionBag } from './SubscriptionBag';
import type { IInput } from './iInput';
import { clampVectorLength, gamepadStickToMove, mergeMoveVectors, clampJoystickOrigin, type ViewportSafeInsets } from './inputMath';
import { resolveTouchControlLayout, dashZoneHintPulseAlpha } from '../ui/dashZoneAffordance';
import { t } from '../core/i18n';
import { InputMapper } from '../input/InputMapper';
import { isGamepadActionPressed } from '../input/gamepadAction';
import { getSettingsManager } from '../core/SettingsManager';
import type { ActionKey, GamepadBinding } from '../core/actions';

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
  private mapper: InputMapper | undefined;

  // Virtual joystick state (mobile)
  private joystickActive = false;
  private joystickPointerId: number = -1;
  private joystickOrigin = { x: 0, y: 0 };
  private joystickCurrent = { x: 0, y: 0 };
  private readonly JOYSTICK_DEAD_ZONE = 15;
  private readonly JOYSTICK_MAX_DIST = 60;

  private joystickBase: Phaser.GameObjects.Arc | null = null;
  private joystickThumb: Phaser.GameObjects.Arc | null = null;

  // W95 — visible right-side dash-zone affordance. Faint band + label
  // shown on touch-primary devices so first-time mobile players can
  // discover the dash tap target. Fades out + destroys on the first
  // tap inside the zone.
  private dashZoneBand: Phaser.GameObjects.Rectangle | null = null;
  private dashZoneLabel: Phaser.GameObjects.Text | null = null;
  private dashZoneHintActive = false;
  private dashZoneHintStartMs = 0;

  private isTouchDevice: boolean;
  private subs = new SubscriptionBag();

  private pendingTouchDash = false;
  private prevGamepadDash = false;
  private prevGamepadMenu = false;
  private gamepadBindings: Partial<Record<ActionKey, GamepadBinding>> = {};

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
      this.mapper = new InputMapper(scene);
    }

    this.refreshGamepadBindings();

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
    } else if (this.mapper?.justDown('dash')) {
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
    const menu = isGamepadActionPressed(pad.buttons, this.gamepadBindings.pause);
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
    const now = isGamepadActionPressed(pad.buttons, this.gamepadBindings.dash);
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
    if (!this.mapper) return { x: 0, y: 0 };

    let x = 0;
    let y = 0;
    if (this.mapper.isDown('moveLeft')) x -= 1;
    if (this.mapper.isDown('moveRight')) x += 1;
    if (this.mapper.isDown('moveUp')) y -= 1;
    if (this.mapper.isDown('moveDown')) y += 1;
    return clampVectorLength(x, y, 1);
  }

  /**
   * A1 M3 — re-read key + gamepad bindings from SettingsManager. Call
   * this after a SettingsInputScene rebind so the new mapping takes
   * effect without a full scene reload. Safe to call when the scene has
   * no keyboard.
   */
  refreshKeyBindings(): void {
    this.mapper?.refresh();
    this.refreshGamepadBindings();
  }

  private refreshGamepadBindings(): void {
    this.gamepadBindings = getSettingsManager().load().gamepadBindings;
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

    this.spawnDashZoneHint();

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

      const controlLayout = resolveTouchControlLayout(scene.scale.width, scene.scale.height, readBodySafeInsets());
      if (pointer.x >= controlLayout.dashZone.x) {
        this.pendingTouchDash = true;
        // First tap inside the dash zone dismisses the discoverability
        // hint — once the player has used it, the band would be noise.
        this.dismissDashZoneHint();
        return;
      }

      if (!this.joystickActive && pointer.x < controlLayout.dashZone.x) {
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

  /**
   * Spawn the visible dash-zone discoverability hint (W95). Faint band
   * over the right 40% with a centred "DASH" label that breathes via a
   * slow pulse. Touch-only — not shown on desktop. Auto-dismissed on
   * the first dash tap (`onPointerDown` above) and on session teardown.
   */
  private spawnDashZoneHint(): void {
    if (this.dashZoneHintActive) return;
    const scene = this.scene;
    // Defensive — minimal scene stubs in unit tests (e.g. MemoryLeak)
    // don't carry add.rectangle / add.text / events. Skip the visible
    // affordance gracefully so the input wiring itself stays testable.
    const sceneAddAny = scene.add as unknown as {
      rectangle?: (...args: unknown[]) => unknown;
      text?: (...args: unknown[]) => unknown;
    };
    if (typeof sceneAddAny.rectangle !== 'function' || typeof sceneAddAny.text !== 'function') return;
    if (!scene.events || typeof scene.events.on !== 'function') return;
    const bounds = resolveTouchControlLayout(
      scene.scale.width,
      scene.scale.height,
      readBodySafeInsets(),
    ).dashHint;
    this.dashZoneBand = scene.add
      .rectangle(bounds.centreX, bounds.centreY, bounds.width, bounds.height, 0xffd980, 0.1)
      .setName('dash-zone-hint-band')
      .setScrollFactor(0)
      .setDepth(998)
      .setBlendMode(Phaser.BlendModes.ADD);
    let dashHintLabel = '';
    try {
      dashHintLabel = t('ui.hud.dash_zone_hint');
    } catch {
      dashHintLabel = 'DASH';
    }
    this.dashZoneLabel = scene.add
      .text(bounds.centreX, bounds.centreY, dashHintLabel || 'DASH', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffe7a8',
        fontStyle: 'bold',
        stroke: '#1a1020',
        strokeThickness: 3,
        align: 'center',
      })
      .setName('dash-zone-hint-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(999);
    this.dashZoneHintActive = true;
    this.dashZoneHintStartMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    // Subscribe to scene `update` so the pulse animates in lockstep with
    // the rest of the scene without spinning a separate timer.
    const onUpdate = () => {
      if (!this.dashZoneHintActive || !this.dashZoneBand || !this.dashZoneLabel) return;
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const elapsed = now - this.dashZoneHintStartMs;
      const a = dashZoneHintPulseAlpha(elapsed);
      this.dashZoneBand.setAlpha(a);
      this.dashZoneLabel.setAlpha(a * 2.4);
    };
    this.subs.listen(scene.events, Phaser.Scenes.Events.UPDATE, onUpdate);
  }

  /** Fade out + destroy the dash-zone discoverability hint. Idempotent. */
  private dismissDashZoneHint(): void {
    if (!this.dashZoneHintActive) return;
    this.dashZoneHintActive = false;
    const band = this.dashZoneBand;
    const label = this.dashZoneLabel;
    this.dashZoneBand = null;
    this.dashZoneLabel = null;
    const tweens = this.scene.tweens;
    if (band) {
      if (tweens && typeof tweens.add === 'function') {
        tweens.add({
          targets: band,
          alpha: 0,
          duration: 320,
          onComplete: () => band.destroy(),
        });
      } else {
        band.destroy();
      }
    }
    if (label) {
      if (tweens && typeof tweens.add === 'function') {
        tweens.add({
          targets: label,
          alpha: 0,
          duration: 320,
          onComplete: () => label.destroy(),
        });
      } else {
        label.destroy();
      }
    }
  }

  destroy(): void {
    this.subs.dispose();

    this.joystickBase?.destroy();
    this.joystickThumb?.destroy();
    this.joystickBase = null;
    this.joystickThumb = null;
    this.joystickActive = false;

    this.dashZoneBand?.destroy();
    this.dashZoneLabel?.destroy();
    this.dashZoneBand = null;
    this.dashZoneLabel = null;
    this.dashZoneHintActive = false;
    this.joystickPointerId = -1;
    this.pendingTouchDash = false;
    this.prevGamepadDash = false;
    this.prevGamepadMenu = false;
  }
}
