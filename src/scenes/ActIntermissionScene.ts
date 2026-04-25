/**
 * ActIntermissionScene — W2 Moor Road paired modal scene.
 *
 * Launched by GameScene via `scene.launch('ActIntermission', { slot })` on a
 * completed-act boss kill. Pauses the paired GameScene via TimeManager
 * (lowest-wins timeScale token so physics + spawn director + chest timer all
 * freeze), renders three route cards from the slot's route set, and on pick
 * resolves by:
 *   1. Writing the RoutePick to RunActState + RunModifiers.routePicks.
 *   2. Merging modifierDeltas into the run's modifier bag.
 *   3. Invoking onResume with the RouteResumeContext.
 *   4. Releasing the TimeManager token.
 *   5. Stopping itself and returning focus to GameScene.
 *
 * Mirrors the CurseScene/MenuScene pair pattern.
 */
import * as Phaser from 'phaser';
import type { PickerSlot, RouteDef, RoutePick } from '../data/routes';
import { ROUTES_BY_SLOT } from '../data/routes';
import {
  resolveDefaultRoute,
  buildRoutePick,
  actIntermissionCardStartX,
  actIntermissionShortcutIndex,
} from './actIntermissionResolve';
import { t } from '../core/i18n';
import { COLORS, COLORS_CSS, UI } from '../config';
import { textStyle } from '../ui/typography';
import { createRouteCard } from '../ui/routeCard';
import {
  firstEnabledModalFocusIndex,
  moveModalFocusIndex,
  type ModalFocusEntry,
} from '../ui/modalFocus';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { HaarFogController } from '../systems/shaders/HaarFogController';
import { capHaarForA11y } from '../systems/shaders/haarA11y';
import { DEFAULT_HAAR_TRANSITION } from '../systems/shaders/haarTransition';
import { resolveActIntermissionCardStyle } from './actIntermissionCardStyle';

export interface ActIntermissionLaunchData {
  slot: PickerSlot;
  /** Game-time seconds at which the picker was launched. Used for RoutePick.atGameTimeSec. */
  atGameTimeSec: number;
  /** Callback invoked with the resolved RoutePick once the player chooses. */
  onResolve: (pick: RoutePick, route: RouteDef) => void;
}

interface RouteFocusEntry extends ModalFocusEntry {
  readonly route: RouteDef;
  readonly bg: Phaser.GameObjects.Rectangle;
}

export class ActIntermissionScene extends Phaser.Scene {
  static readonly KEY = 'ActIntermission';

  private launchData!: ActIntermissionLaunchData;
  /** Scene-scoped keyboard handler. Cleared on stop. */
  private keyHandler?: (e: KeyboardEvent) => void;
  private routeFocusEntries: RouteFocusEntry[] = [];
  private focusedRouteIndex = -1;
  private gamepadUpdateHandler: (() => void) | null = null;
  private prevPadBack = false;
  private prevPadForward = false;
  private prevPadConfirm = false;
  /** F1 — haar fog filter controller applied to this scene's camera. */
  private haar?: HaarFogController;

  constructor() {
    super({ key: ActIntermissionScene.KEY });
  }

  init(data: ActIntermissionLaunchData): void {
    this.launchData = data;
  }

  create(): void {
    this.routeFocusEntries = [];
    this.focusedRouteIndex = -1;
    this.prevPadBack = this.prevPadForward = this.prevPadConfirm = false;
    const routes = ROUTES_BY_SLOT[this.launchData.slot];
    this.renderRouteCards(routes);
    this.installKeyboardShortcuts(routes);
    this.installGamepadShortcuts();
    this.applyHaarWash();
    audio.startAmbientWind(0.04);
    // Uninstall keyboard handler and fade wind when the scene tears down.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.uninstallKeyboardShortcuts();
      this.uninstallGamepadShortcuts();
      audio.fadeOutAmbientWind(400);
      this.haar = undefined;
    });
  }

  /**
   * F1 — apply a haar-fog filter to this scene's camera, ramping density
   * from 0 up to the a11y-capped target over the ramp-in window. The filter
   * lives on the scene's own camera; tearing down the scene removes it
   * automatically.
   *
   * WebGL-only: Canvas renderer doesn't expose the filter pipeline, so this
   * method returns early there. reduceParticles and motionScale settings
   * cap the density + slow the ramp — see `capHaarForA11y`.
   */
  private applyHaarWash(): void {
    if (this.sys.game.renderer.type !== Phaser.WEBGL) return;
    const cam = this.cameras.main;
    const filters = cam.filters;
    if (!filters) return;
    try {
      const { motionScale, reduceParticles, reduceFlashing } = getSettingsManager().load();
      const target = capHaarForA11y(
        { motionScale, reduceParticles, reduceFlashing },
        0.8,
        DEFAULT_HAAR_TRANSITION,
      );
      this.haar = new HaarFogController(cam, { density: 0 });
      filters.internal.add(this.haar);
      this.tweens.add({
        targets: this.haar.state,
        density: target.density,
        duration: target.transition.rampInMs,
        ease: 'Sine.easeOut',
      });
    } catch {
      // If the filter API isn't available on this renderer, haar is disabled
      // for this scene. The picker still functions.
      this.haar = undefined;
    }
  }

  update(_time: number, delta: number): void {
    if (this.haar) this.haar.advanceTime(delta * 0.001);
  }

  private renderRouteCards(routes: readonly RouteDef[]): void {
    const { width, height } = this.cameras.main;
    const { uiScale } = getSettingsManager().load();

    // Darkened backdrop — blocks input to the paired GameScene.
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.OVERLAY_DIM, UI.OVERLAY_ALPHA)
      .setInteractive();

    // Title — act 1 vs act 2.
    // Clamp title/subtitle Y to a minimum top margin so short viewports
    // (mobile landscape <500px tall) don't push the title off-screen at
    // high uiScale. Offsets scale with uiScale up to the point where the
    // scaled text would collide with the top edge, then snap to a fixed
    // safe margin.
    const titleKey = this.launchData.slot === 'A'
      ? 'ui.actIntermission.title_act_1'
      : 'ui.actIntermission.title_act_2';
    const titleY = Math.max(Math.round(40 * uiScale), height / 2 - Math.round(200 * uiScale));
    const subtitleY = Math.max(titleY + Math.round(36 * uiScale), height / 2 - Math.round(160 * uiScale));
    this.add.text(width / 2, titleY, t(titleKey),
      textStyle('title', { color: COLORS_CSS.TOAST_GOLD }),
    ).setOrigin(0.5).setScale(uiScale);

    // Subtitle / hint.
    this.add.text(width / 2, subtitleY, t('ui.actIntermission.pick_hint'),
      textStyle('label', { color: COLORS_CSS.HINT }),
    ).setOrigin(0.5).setScale(uiScale);

    // Cards — shrink on narrow viewports so all routes stay on-screen.
    // Card aspect dropped 1.25 → 0.95 so the route cards no longer carry
    // ~250 px of dead space below their two-line description (audit 07).
    const maxCardW = Math.floor((width - 64) / routes.length - 24);
    const cardW = Math.min(240, Math.max(100, maxCardW));
    const cardH = Math.round(cardW * 0.95);
    const gap = Math.min(32, Math.max(8, Math.floor((width - routes.length * cardW) / (routes.length + 1))));
    const startX = actIntermissionCardStartX(width, routes.length, cardW, gap);
    const y = height / 2 + Math.round(40 * uiScale);

    routes.forEach((route, i) => {
      const x = startX + i * (cardW + gap);
      const card = createRouteCard({
        scene: this,
        x,
        y,
        width: cardW,
        height: cardH,
        route,
        shortcut: i + 1,
        uiScale,
        onSelect: (r) => this.resolve(r),
      });
      this.routeFocusEntries.push({ route, bg: card.bg });
      card.bg.on('pointerover', () => {
        this.focusedRouteIndex = i;
        this.applyRouteFocus();
      });
      card.bg.on('pointerout', () => this.applyRouteFocus());
    });
    this.focusedRouteIndex = firstEnabledModalFocusIndex(this.routeFocusEntries);
    this.applyRouteFocus();
  }

  /**
   * 1/2/3 keys resolve the matching card. Arrow keys / Tab move focus and
   * Enter / Space confirm the focused route. Installed once per scene launch;
   * SHUTDOWN event (Phaser emits on scene.stop) uninstalls so no stray
   * handler bleeds into GameScene after the picker closes.
   */
  private installKeyboardShortcuts(routes: readonly RouteDef[]): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.keyHandler = (e: KeyboardEvent) => {
      const idx = actIntermissionShortcutIndex(e.key);
      if (idx !== null) {
        const route = routes[idx];
        if (!route) return;
        e.preventDefault();
        this.resolve(route);
        return;
      }

      if (
        e.key === 'ArrowLeft'
        || e.key === 'ArrowUp'
        || (e.key === 'Tab' && e.shiftKey)
      ) {
        e.preventDefault();
        this.moveRouteFocus(-1);
        return;
      }

      if (
        e.key === 'ArrowRight'
        || e.key === 'ArrowDown'
        || e.key === 'Tab'
      ) {
        e.preventDefault();
        this.moveRouteFocus(1);
        return;
      }

      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      this.activateFocusedRoute();
    };
    keyboard.on('keydown', this.keyHandler);
  }

  private uninstallKeyboardShortcuts(): void {
    if (!this.keyHandler) return;
    this.input.keyboard?.off('keydown', this.keyHandler);
    this.keyHandler = undefined;
  }

  private installGamepadShortcuts(): void {
    this.uninstallGamepadShortcuts();
    this.gamepadUpdateHandler = () => {
      const pad = this.input.gamepad?.pad1;
      if (!pad?.connected) {
        this.prevPadBack = this.prevPadForward = this.prevPadConfirm = false;
        return;
      }

      const back = pad.left || pad.up || pad.leftStick.x < -0.5 || pad.leftStick.y < -0.5;
      const forward = pad.right || pad.down || pad.leftStick.x > 0.5 || pad.leftStick.y > 0.5;
      const confirm = pad.buttons[0]?.pressed === true || pad.buttons[9]?.pressed === true;

      if (back && !this.prevPadBack) this.moveRouteFocus(-1);
      if (forward && !this.prevPadForward) this.moveRouteFocus(1);
      if (confirm && !this.prevPadConfirm) this.activateFocusedRoute();

      this.prevPadBack = back;
      this.prevPadForward = forward;
      this.prevPadConfirm = confirm;
    };
    this.events.on('update', this.gamepadUpdateHandler);
  }

  private uninstallGamepadShortcuts(): void {
    if (!this.gamepadUpdateHandler) return;
    this.events.off('update', this.gamepadUpdateHandler);
    this.gamepadUpdateHandler = null;
  }

  private moveRouteFocus(direction: -1 | 1): void {
    this.focusedRouteIndex = moveModalFocusIndex(
      this.routeFocusEntries,
      this.focusedRouteIndex,
      direction,
    );
    this.applyRouteFocus();
  }

  private activateFocusedRoute(): void {
    const entry = this.routeFocusEntries[this.focusedRouteIndex];
    if (!entry || entry.disabled) return;
    this.resolve(entry.route);
  }

  private applyRouteFocus(): void {
    const style = resolveActIntermissionCardStyle();
    for (let i = 0; i < this.routeFocusEntries.length; i++) {
      const entry = this.routeFocusEntries[i]!;
      if (i === this.focusedRouteIndex) {
        entry.bg.setStrokeStyle(style.hover.thickness, style.hover.color);
      } else {
        entry.bg.setStrokeStyle(style.idle.thickness, style.idle.color);
      }
    }
  }

  /**
   * Apply a pick and close. Skip-setting path calls this directly with the
   * slot's default route.
   */
  resolve(route: RouteDef, opts?: { defaultedBySetting?: boolean }): void {
    this.uninstallKeyboardShortcuts();
    this.uninstallGamepadShortcuts();
    const pick = buildRoutePick(route, this.launchData.atGameTimeSec, opts);
    this.launchData.onResolve(pick, route);
    this.scene.stop();
  }

  /**
   * Convenience: applies the slot's DEFAULT_ROUTE_ON_SKIP route without
   * rendering cards. Used by GameScene when skipActIntermissions=true.
   * Delegates to pure helper for testability (Phaser can't load in node).
   */
  static resolveDefault(
    slot: PickerSlot,
    atGameTimeSec: number,
  ): { pick: RoutePick; route: RouteDef } {
    return resolveDefaultRoute(slot, atGameTimeSec);
  }
}
