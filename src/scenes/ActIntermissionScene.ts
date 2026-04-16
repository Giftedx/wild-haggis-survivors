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
import { resolveDefaultRoute } from './actIntermissionResolve';

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

  constructor() {
    super({ key: ActIntermissionScene.KEY });
  }

  init(data: ActIntermissionLaunchData): void {
    this.launchData = data;
  }

  create(): void {
    const routes = ROUTES_BY_SLOT[this.launchData.slot];
    this.renderRouteCards(routes);
  }

  private renderRouteCards(routes: readonly RouteDef[]): void {
    // Full rendering in Task 12. For the skeleton commit we draw minimal
    // placeholder rectangles so the scene is observably alive.
    const { width, height } = this.cameras.main;
    const cardW = 220;
    const cardH = 280;
    const gap = 40;
    const totalW = cardW * routes.length + gap * (routes.length - 1);
    const startX = (width - totalW) / 2 + cardW / 2;
    const y = height / 2;

    routes.forEach((route, i) => {
      const x = startX + i * (cardW + gap);
      const bg = this.add.rectangle(x, y, cardW, cardH, 0x222233, 0.95)
        .setStrokeStyle(2, 0xd4a017)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y - cardH / 2 + 20, route.key, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffdd88',
      }).setOrigin(0.5);
      bg.on(Phaser.Input.Events.POINTER_DOWN, () => this.resolve(route));
    });
  }

  /**
   * Apply a pick and close. Skip-setting path calls this directly with the
   * slot's default route.
   */
  resolve(route: RouteDef, opts?: { defaultedBySetting?: boolean }): void {
    const pick: RoutePick = {
      slot: route.slot,
      routeKey: route.key,
      atGameTimeSec: this.launchData.atGameTimeSec,
      defaultedBySetting: opts?.defaultedBySetting ?? false,
    };
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
