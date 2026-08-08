/**
 * Routes — Moor Road between-act choice definitions (W2).
 *
 * Six routes use two picker slots. Numeric `modifierDeltas` multiply
 * the current `RunModifiers` values at pick resolve time. `onResume`
 * handles heals, forced chests, elite spawns, and timed releases.
 *
 * Keys are stable save-visible identifiers; Chronicle displays use the
 * i18n labelKey / descKey resolved through `t()`.
 *
 * Boss → picker mapping (see `dispatchActComplete.ts`):
 *   - act 1 / `gordon` kill   → picker slot A
 *   - act 2 / `tour_bus` kill → picker slot B
 *   - `taxman` kill           → run-victory path; NOT routed through
 *     `onActComplete` and intentionally absent from `ROUTES_BY_SLOT`.
 */
import type { Player } from '../entities/Player';
import type { HazardZones } from '../scenes/game/HazardZones';
import type { PickupSpawner } from '../scenes/game/PickupSpawner';
import type { SpawnSystem } from '../systems/SpawnSystem';
import type { TimeManager } from '../systems/TimeManager';
import type { XPSystem } from '../systems/XPSystem';
import type { RNG } from '../utils/rng';
import type { RunModifiers } from '../core/RunModifiers';

export type PickerSlot = 'A' | 'B';

export type RouteKey =
  | 'up_the_brae'
  | 'round_the_loch'
  | 'through_the_kirkyard'
  | 'stand_yer_ground'
  | 'run_for_the_hills'
  | 'buckie_pitstop';

export const KIRKYARD_SPAWN_RELEASE_MS = 90_000;
export const STAND_YER_GROUND_XP_RELEASE_MS = 30_000;

export interface RoutePick {
  readonly slot: PickerSlot;
  readonly routeKey: RouteKey;
  readonly atGameTimeSec: number;
  readonly defaultedBySetting: boolean;
}

/**
 * Execution context passed to a route's `onResume` callback. Gives the
 * route access to the minimum set of systems it needs without importing
 * the whole scene graph.
 */
export interface RouteResumeContext {
  readonly player: Player;
  readonly hazardZones: HazardZones;
  readonly pickupSpawner: PickupSpawner;
  readonly spawnSystem: SpawnSystem;
  readonly timeManager: TimeManager;
  readonly xpSystem: XPSystem;
  readonly runRng: RNG;
  /** Mutable reference to the run-scoped modifiers bag. */
  readonly modifiers: RunModifiers;
  /** W2 picker B: grants a one-shot level-up reroll token. */
  readonly grantReroll: () => void;
}

/**
 * Keys on `RunModifiers` that a route may safely mutate mid-run.
 *
 * The rest (`moveSpeedMult`, `startHpRatio`) fold into the Player's
 * composed base stats at construction and have no mid-run setter, so a
 * route that wrote them would silently no-op. `routePicks` is an
 * append-only log owned by RunActState, not a tunable knob.
 *
 * `src/scenes/game/actIntermissionLauncher.ts` resyncs the cached readers for
 * `spawnIntervalMult` and `weaponCooldownMult`. The other keys have no cached
 * readers and need no resync call.
 */
export type RouteModifierDeltaKey =
  | 'spawnIntervalMult'
  | 'damageTakenMult'
  | 'goldMult'
  | 'weaponCooldownMult';

export interface RouteDef {
  readonly key: RouteKey;
  readonly slot: PickerSlot;
  readonly labelKey: string;
  readonly descKey: string;
  /**
   * Partial multipliers for `RunModifiers` applied at pick-resolve time.
   * Routes can use only fields in `RouteModifierDeltaKey`. Other fields
   * are read at run start or are not tunable.
   *
   * Numeric values multiply the current bag value.
   */
  readonly modifierDeltas: Partial<Pick<RunModifiers, RouteModifierDeltaKey>>;
  /** Side-effect callback — heal bursts, chest forcing, timed releases. */
  readonly onResume?: (ctx: RouteResumeContext) => void;
}

export const ROUTES: readonly RouteDef[] = [
  // Picker A — fires on gordon kill (~5:00)
  {
    key: 'up_the_brae',
    slot: 'A',
    labelKey: 'routes.up_the_brae.label',
    descKey: 'routes.up_the_brae.desc',
    modifierDeltas: {},
    onResume: (ctx) => {
      ctx.spawnSystem.setEliteWeightMultiplier(1.5);
      ctx.pickupSpawner.spawnGoldenChest();
    },
  },
  {
    key: 'round_the_loch',
    slot: 'A',
    labelKey: 'routes.round_the_loch.label',
    descKey: 'routes.round_the_loch.desc',
    modifierDeltas: {},
    onResume: (ctx) => {
      const heal = Math.ceil(ctx.player.getMaxHp() * 0.25);
      ctx.player.heal(heal);
      ctx.hazardZones.spawnHealingCircle();
      ctx.hazardZones.spawnHealingCircle();
    },
  },
  {
    key: 'through_the_kirkyard',
    slot: 'A',
    labelKey: 'routes.through_the_kirkyard.label',
    descKey: 'routes.through_the_kirkyard.desc',
    modifierDeltas: { spawnIntervalMult: 0.70 },
    onResume: (ctx) => {
      ctx.spawnSystem.forceSpawn('haggis_hunter', { elite: true });
      const routeSpawnIntervalMult = 0.70;
      ctx.timeManager.scheduleRealTime(KIRKYARD_SPAWN_RELEASE_MS, () => {
        ctx.modifiers.spawnIntervalMult /= routeSpawnIntervalMult;
        ctx.spawnSystem.setSpawnIntervalMult(ctx.modifiers.spawnIntervalMult);
      });
    },
  },

  // Picker B — fires on tour_bus kill (~10:00).
  {
    key: 'stand_yer_ground',
    slot: 'B',
    labelKey: 'routes.stand_yer_ground.label',
    descKey: 'routes.stand_yer_ground.desc',
    modifierDeltas: {},
    onResume: (ctx) => {
      ctx.xpSystem.setDropValueMultiplier(2);
      ctx.timeManager.scheduleRealTime(STAND_YER_GROUND_XP_RELEASE_MS, () => {
        ctx.xpSystem.setDropValueMultiplier(1);
      });
    },
  },
  {
    key: 'run_for_the_hills',
    slot: 'B',
    labelKey: 'routes.run_for_the_hills.label',
    descKey: 'routes.run_for_the_hills.desc',
    modifierDeltas: { spawnIntervalMult: 0.75 },
    onResume: (ctx) => {
      const heal = Math.ceil(ctx.player.getMaxHp() * 0.50);
      ctx.player.heal(heal);
      ctx.player.refreshDashCharges();
    },
  },
  {
    key: 'buckie_pitstop',
    slot: 'B',
    labelKey: 'routes.buckie_pitstop.label',
    descKey: 'routes.buckie_pitstop.desc',
    modifierDeltas: {},
    onResume: (ctx) => {
      ctx.spawnSystem.pauseSpawnsFor(15_000);
      ctx.grantReroll();
      ctx.spawnSystem.setEnemyHpMultiplier(1.10);
    },
  },
];

export const ROUTES_BY_SLOT: Readonly<Record<PickerSlot, readonly RouteDef[]>> = {
  A: ROUTES.filter((r) => r.slot === 'A'),
  B: ROUTES.filter((r) => r.slot === 'B'),
};

const ROUTE_BY_KEY: ReadonlyMap<RouteKey, RouteDef> = new Map(
  ROUTES.map((r) => [r.key, r] as const),
);

export function getRoute(key: RouteKey): RouteDef {
  const def = ROUTE_BY_KEY.get(key);
  if (!def) throw new Error(`getRoute: unknown route key ${key}`);
  return def;
}

/** Lowest-cost default per slot — used when Skip Intermissions is on. */
export const DEFAULT_ROUTE_ON_SKIP: Readonly<Record<PickerSlot, RouteKey>> = {
  A: 'round_the_loch',
  B: 'stand_yer_ground',
};
