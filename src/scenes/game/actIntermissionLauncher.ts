/**
 * Act Intermission launcher — Phase 5 Bucket 4 of the codebase
 * restructure. Owns the three-branch resolve path that used to live
 * inline as `GameScene.launchActIntermission`:
 *
 *   1. Replay playback — recorded pick wins, no UI, no pause.
 *   2. Skip Intermissions setting — auto-default route, toast only.
 *   3. Live — pause + caption + ActIntermissionScene.launch.
 *
 * All three eventually fire the shared `onResolve` closure, which
 * advances `RunActState`, applies the route's `modifierDeltas`,
 * resyncs cached SpawnSystem/WeaponSystem multipliers (per the
 * "Bag-vs-cached-field divergence" gotcha in CLAUDE.md), runs
 * `route.onResume`, and emits the global telemetry event.
 *
 * Pure-ish: takes a hooks object so the launcher can read live scene
 * state (settings, banter, runActState) without owning it. Scene
 * launch + time.delayedCall come from the injected `Phaser.Scene` —
 * no module-level import of Phaser, so this file stays import-safe
 * for node-env vitest tests of pure helpers (not the launcher
 * itself, which is too Phaser-coupled to unit-test in isolation).
 */
import type Phaser from 'phaser';
import type { RouteDef, RoutePick, RouteResumeContext, PickerSlot } from '../../data/routes';
import { getRoute } from '../../data/routes';
import type { RunModifiers } from '../../core/RunModifiers';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { SettingsManager } from '../../core/SettingsManager';
import type { ReplayRecorder } from '../../replay/ReplayRecorder';
import type { RunActState } from './RunActState';
import { ActIntermissionScene } from '../ActIntermissionScene';
import { applyRouteModifierDeltas } from '../actIntermissionResolve';
import { bumpRoutePicked, addFirstRouteVisit } from '../../utils/save';
import { globalEventBus } from '../../core/GlobalEventBus';
import { t } from '../../core/i18n';
import { COLORS_CSS } from '../../config';

/**
 * Hooks the launcher reads / writes during a resolve. Most are
 * straight references to GameScene fields; the function-typed entries
 * are scene methods the launcher can't replicate (node-map roll,
 * route-resume context build).
 */
export interface ActIntermissionLauncherHooks {
  scene: Phaser.Scene;
  spawnSystem: SpawnSystem;
  weaponSystem: WeaponSystem;
  timeManager: TimeManager;
  juice: JuiceSystem;
  banter: BanterSystem | null;
  settingsManager: SettingsManager;
  runActState: RunActState;
  runModifiers: RunModifiers;
  replayRecorder: ReplayRecorder | null;
  /**
   * Replay-pending route queue. The launcher mutates this in place
   * (shift) when the recorded pick matches the current slot.
   */
  pendingReplayRoutes: RoutePick[];
  caption: (id: string, message: string, tint?: string, durationMs?: number) => void;
  discoveryRunId: () => string;
  buildRouteResumeContext: () => RouteResumeContext;
  initNodeMapForAct: (act: 1 | 2 | 3) => void;
}

/**
 * Launch the act-intermission flow for `actN`. Picks one of the three
 * branches (replay / skip / live UI) and routes through the shared
 * resolver. Side-effect-only — caller doesn't observe a return value.
 */
export function launchActIntermission(
  hooks: ActIntermissionLauncherHooks,
  actN: 1 | 2,
): void {
  const slot: PickerSlot = actN === 1 ? 'A' : 'B';
  const atGameTimeSec = Math.floor(hooks.spawnSystem.getGameTimeSec());
  const settings = hooks.settingsManager.load();

  // Tag the request with the act number so the banter pool can pick
  // act-specific lines ("Act 1 wrapped" vs "Act 2 wrapped"). Generic
  // pool still fires when no act-tagged sub-pool exists.
  hooks.banter?.request('act_complete', { tag: `act_${actN}` });

  const onResolve = (pick: RoutePick, route: RouteDef) => {
    hooks.runActState.recordPick(pick);
    hooks.replayRecorder?.pushRoute(pick);
    hooks.runModifiers.routePicks.push(pick);
    // C1 M3 Task 14 — persist into the DiscoveryLog so the Almanac's
    // Weys book lights up the entry. Best-effort write; the act
    // transition still proceeds even if the save fails.
    bumpRoutePicked(pick.routeKey, hooks.discoveryRunId(), Date.now());
    // H1 M2 T16 — light up the Croft photo-wall polaroid on first pick.
    addFirstRouteVisit(pick.routeKey);
    hooks.banter?.request('route_picked', { tag: pick.routeKey });
    applyRouteModifierDeltas(hooks.runModifiers, route);
    // Mid-run bag writes don't propagate through the cached private
    // fields that their consumers hold. No current route uses these
    // besides `spawnIntervalMult`, but the generic bag applicator
    // would silently no-op a future route writing to either field
    // — preempt the footgun by resyncing every run-distribution
    // multiplier that has a cached reader:
    //   - `SpawnSystem.spawnIntervalMult` → cached at run start
    //   - `WeaponSystem.curseCooldownMul` → cached at run start
    // `moveSpeedMult` / `startHpRatio` fold into the Player's
    // composed base stats at construction; routes MUST NOT touch
    // them (Player.runBase* are `readonly`, no setter exists).
    hooks.spawnSystem.setSpawnIntervalMult(hooks.runModifiers.spawnIntervalMult);
    hooks.weaponSystem.setCurseCooldownMul(hooks.runModifiers.weaponCooldownMult);
    hooks.runActState.advanceToAct(
      (actN + 1) as 1 | 2 | 3,
      hooks.spawnSystem.getGameTimeSec(),
    );
    // M1 — fresh node path for the new act. Runs after advanceToAct so
    // `runActState.currentAct` reads the new value everywhere downstream.
    hooks.initNodeMapForAct((actN + 1) as 1 | 2 | 3);
    route.onResume?.(hooks.buildRouteResumeContext());
    hooks.timeManager.release('ACT_INTERMISSION');
    // Telemetry fan-out — AnalyticsManager logs `route_picked` (opt-in
    // only). Shape mirrors `RoutePick` so route-monotony and skip-rate
    // kill-criteria can be computed directly from portal stats.
    globalEventBus.emit('GLOBAL_ROUTE_PICKED', {
      slot: pick.slot,
      routeKey: pick.routeKey,
      atGameTimeSec: pick.atGameTimeSec,
      defaultedBySetting: pick.defaultedBySetting,
    });
  };

  // T1 Phase 3 — playback: the recorded pick wins. No card UI, no
  // pause — shift the next route off the queue and apply inline.
  // Slot mismatch would indicate a corrupt blob; bail to the live
  // path in that case so the run keeps moving.
  if (hooks.pendingReplayRoutes.length > 0) {
    const next = hooks.pendingReplayRoutes[0];
    if (next.slot === slot) {
      hooks.pendingReplayRoutes.shift();
      const route = getRoute(next.routeKey);
      hooks.scene.time.delayedCall(0, () => onResolve(next, route));
      return;
    }
    // Slot mismatch: log + fall through to live handling. Don't pop
    // the queue — later picks may still line up.
    console.warn('[replay] route slot mismatch', { expected: slot, got: next.slot });
  }

  if (settings.skipActIntermissions) {
    const { pick, route } = ActIntermissionScene.resolveDefault(slot, atGameTimeSec);
    // T301 — surface the auto-picked route so a player who toggled
    // Skip Intermissions still sees which fork the moor took. Without
    // this toast the route silently changes the run's modifiers and
    // the player has no way to learn what just happened.
    hooks.juice.showToast(
      t('ui.game.skip_route_picked', { route: t(route.labelKey) }),
      '#ffe080',
    );
    // No pause, no scene launch — apply inline on a delayedCall(0) so
    // current frame (camera shake, XP gem spawn, banter) finishes.
    hooks.scene.time.delayedCall(0, () => onResolve(pick, route));
    return;
  }

  hooks.timeManager.request('ACT_INTERMISSION', { pausePhysics: true, timeScale: 0 });
  hooks.banter?.request('act_intermission_enter');
  // A11y caption — surfaces the fork moment for audio-off / deaf play.
  hooks.caption(
    'act_intermission_open',
    t('ui.captions.act_intermission_open'),
    COLORS_CSS.TOAST_GOLD,
    3000,
  );
  hooks.scene.scene.launch(ActIntermissionScene.KEY, {
    slot,
    atGameTimeSec,
    onResolve,
  });
}
