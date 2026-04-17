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
import Phaser from 'phaser';
import type { PickerSlot, RouteDef, RoutePick } from '../data/routes';
import { ROUTES_BY_SLOT } from '../data/routes';
import {
  resolveDefaultRoute,
  buildRoutePick,
  actIntermissionCardStartX,
  actIntermissionShortcutIndex,
} from './actIntermissionResolve';
import { resolveActIntermissionCardStyle } from './actIntermissionCardStyle';
import { t } from '../core/i18n';

export interface ActIntermissionLaunchData {
  slot: PickerSlot;
  /** Game-time seconds at which the picker was launched. Used for RoutePick.atGameTimeSec. */
  atGameTimeSec: number;
  /** Callback invoked with the resolved RoutePick once the player chooses. */
  onResolve: (pick: RoutePick, route: RouteDef) => void;
}

export class ActIntermissionScene extends Phaser.Scene {
  static readonly KEY = 'ActIntermission';

  private launchData!: ActIntermissionLaunchData;
  /** Shortcut map — 1/2/3 keys resolve the matching card. Cleared on stop. */
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor() {
    super({ key: ActIntermissionScene.KEY });
  }

  init(data: ActIntermissionLaunchData): void {
    this.launchData = data;
  }

  create(): void {
    const routes = ROUTES_BY_SLOT[this.launchData.slot];
    this.renderRouteCards(routes);
    this.installKeyboardShortcuts(routes);
    // Uninstall when the scene tears down so the handler doesn't leak
    // into the paired GameScene after resolve.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.uninstallKeyboardShortcuts());
  }

  private renderRouteCards(routes: readonly RouteDef[]): void {
    const { width, height } = this.cameras.main;

    // Darkened backdrop — blocks input to the paired GameScene.
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65)
      .setInteractive();

    // Title — act 1 vs act 2.
    const titleKey = this.launchData.slot === 'A'
      ? 'ui.actIntermission.title_act_1'
      : 'ui.actIntermission.title_act_2';
    this.add.text(width / 2, height / 2 - 200, t(titleKey), {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffdd88',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Subtitle / hint.
    this.add.text(width / 2, height / 2 - 160, t('ui.actIntermission.pick_hint'), {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Cards.
    const cardW = 240;
    const cardH = 300;
    const gap = 32;
    const startX = actIntermissionCardStartX(width, routes.length, cardW, gap);
    const y = height / 2 + 40;

    routes.forEach((route, i) => {
      const x = startX + i * (cardW + gap);
      this.buildCard(x, y, cardW, cardH, route, i + 1);
    });
  }

  private buildCard(x: number, y: number, w: number, h: number, route: RouteDef, shortcut: number): void {
    const cardStyle = resolveActIntermissionCardStyle();
    const bg = this.add.rectangle(x, y, w, h, 0x1a1a28, 0.98)
      .setStrokeStyle(cardStyle.idle.thickness, cardStyle.idle.color)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y - h / 2 + 24, t(route.labelKey), {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffdd88',
      wordWrap: { width: w - 24 }, align: 'center',
    }).setOrigin(0.5, 0);

    this.add.text(x, y, t(route.descKey), {
      fontFamily: 'monospace', fontSize: '14px', color: '#ccccdd',
      wordWrap: { width: w - 24 }, align: 'center',
    }).setOrigin(0.5);

    // Shortcut digit corner badge — pairs with the 1/2/3 keyboard handler.
    this.add.text(x - w / 2 + 12, y - h / 2 + 10, `${shortcut}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#7f8ca7',
      fontStyle: 'bold',
    }).setOrigin(0, 0);

    bg.on(Phaser.Input.Events.POINTER_OVER, () => bg.setStrokeStyle(cardStyle.hover.thickness, cardStyle.hover.color));
    bg.on(Phaser.Input.Events.POINTER_OUT, () => bg.setStrokeStyle(cardStyle.idle.thickness, cardStyle.idle.color));
    bg.on(Phaser.Input.Events.POINTER_DOWN, () => this.resolve(route));
  }

  /**
   * 1/2/3 keys resolve the matching card. Installed once per scene launch;
   * SHUTDOWN event (Phaser emits on scene.stop) uninstalls so no stray
   * handler bleeds into GameScene after the picker closes.
   */
  private installKeyboardShortcuts(routes: readonly RouteDef[]): void {
    if (typeof window === 'undefined') return;
    this.keyHandler = (e: KeyboardEvent) => {
      const idx = actIntermissionShortcutIndex(e.key);
      if (idx === null) return;
      const route = routes[idx];
      if (!route) return;
      e.preventDefault();
      this.resolve(route);
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  private uninstallKeyboardShortcuts(): void {
    if (!this.keyHandler) return;
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keyHandler);
    }
    this.keyHandler = undefined;
  }

  /**
   * Apply a pick and close. Skip-setting path calls this directly with the
   * slot's default route.
   */
  resolve(route: RouteDef, opts?: { defaultedBySetting?: boolean }): void {
    this.uninstallKeyboardShortcuts();
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
