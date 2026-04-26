/**
 * T401 slice — Moor Road act intermission `onResolve` callback factory.
 * Keeps route-pick side effects in one testable module; GameScene wires deps.
 */
import { globalEventBus } from '../../core/GlobalEventBus';
import { bumpRoutePicked, addFirstRouteVisit } from '../../utils/save';
import { applyRouteModifierDeltas } from '../actIntermissionResolve';
import type { RouteDef, RoutePick } from '../../data/routes';
import type { RunActState } from './RunActState';
import type { RunModifiers } from '../../core/RunModifiers';
import type { ReplayRecorder } from '../../replay/ReplayRecorder';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { RouteResumeContext } from '../../data/routes';

export interface ActIntermissionResolveDeps {
  actN: 1 | 2;
  runActState: RunActState;
  replayRecorder: ReplayRecorder | null;
  runModifiers: RunModifiers;
  discoveryRunId: () => string;
  banter: BanterSystem | null;
  spawnSystem: SpawnSystem;
  weaponSystem: WeaponSystem;
  timeManager: TimeManager;
  initNodeMapForAct: (act: 1 | 2 | 3) => void;
  buildRouteResumeContext: () => RouteResumeContext;
}

export function createActIntermissionOnResolve(
  deps: ActIntermissionResolveDeps,
): (pick: RoutePick, route: RouteDef) => void {
  const {
    actN,
    runActState,
    replayRecorder,
    runModifiers,
    discoveryRunId,
    banter,
    spawnSystem,
    weaponSystem,
    timeManager,
    initNodeMapForAct,
    buildRouteResumeContext,
  } = deps;

  return (pick: RoutePick, route: RouteDef): void => {
    runActState.recordPick(pick);
    replayRecorder?.pushRoute(pick);
    runModifiers.routePicks.push(pick);
    bumpRoutePicked(pick.routeKey, discoveryRunId(), Date.now());
    addFirstRouteVisit(pick.routeKey);
    banter?.request('route_picked', { tag: pick.routeKey });
    applyRouteModifierDeltas(runModifiers, route);
    spawnSystem.setSpawnIntervalMult(runModifiers.spawnIntervalMult);
    weaponSystem.setCurseCooldownMul(runModifiers.weaponCooldownMult);
    runActState.advanceToAct(
      (actN + 1) as 1 | 2 | 3,
      spawnSystem.getGameTimeSec(),
    );
    initNodeMapForAct((actN + 1) as 1 | 2 | 3);
    route.onResume?.(buildRouteResumeContext());
    timeManager.release('ACT_INTERMISSION');
    globalEventBus.emit('GLOBAL_ROUTE_PICKED', {
      slot: pick.slot,
      routeKey: pick.routeKey,
      atGameTimeSec: pick.atGameTimeSec,
      defaultedBySetting: pick.defaultedBySetting,
    });
  };
}
