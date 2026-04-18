/**
 * T1 Phase 3 — v2 replay blob.
 *
 * Adds optional per-run metadata (curseKey, route picks, composed
 * player stats snapshot) on top of the v1 shape so playback can
 * reproduce runs that carried a curse, took Moor Road routes, or ran
 * on non-default meta-upgrade stats.
 *
 * v1 readers reject v2 blobs by design (version mismatch). Callers
 * that accept either shape go through `ReplayBlobAny` + `isReplayBlobAny`
 * in `./replayBlob.ts`.
 */
import {
  clampReplayFrame,
  REPLAY_MAX_DT_MS,
  type ReplayBlobMeta,
  type ReplayFrame,
} from './replayBlob';
import type { PickerSlot, RouteKey, RoutePick } from '../data/routes';
import {
  isComposedStatsSnapshot,
  type ComposedStatsSnapshot,
} from './composedStatsSnapshot';

export const REPLAY_BLOB_V2_VERSION = 2 as const;
export { REPLAY_MAX_DT_MS };

export interface ReplayBlobV2Meta extends ReplayBlobMeta {
  /** Active curse key for the run, if the player took one. */
  curseKey?: string;
  /** Ordered route picks — one entry per resolved Moor Road picker. */
  routes?: RoutePick[];
  /** Snapshot of composed player stats at run start. */
  composedStats?: ComposedStatsSnapshot;
}

export interface ReplayBlobV2 extends ReplayBlobV2Meta {
  version: typeof REPLAY_BLOB_V2_VERSION;
  frameCount: number;
  frames: ReplayFrame[];
}

export function createEmptyReplayBlobV2(meta: ReplayBlobV2Meta): ReplayBlobV2 {
  return {
    version: REPLAY_BLOB_V2_VERSION,
    build: meta.build,
    seed: meta.seed,
    variantKey: meta.variantKey,
    curseKey: meta.curseKey,
    routes: meta.routes,
    composedStats: meta.composedStats,
    frameCount: 0,
    frames: [],
  };
}

export function serializeReplayV2(blob: ReplayBlobV2): string {
  return JSON.stringify(blob);
}

export function deserializeReplayV2(raw: string): ReplayBlobV2 | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (parsed.version !== REPLAY_BLOB_V2_VERSION) return null;
  const build = typeof parsed.build === 'string' ? parsed.build : null;
  const seed =
    typeof parsed.seed === 'number' && Number.isFinite(parsed.seed)
      ? Math.floor(parsed.seed)
      : null;
  const variantKey = typeof parsed.variantKey === 'string' ? parsed.variantKey : null;
  if (build === null || seed === null || variantKey === null) return null;

  const framesRaw = Array.isArray(parsed.frames) ? parsed.frames : [];
  const frames: ReplayFrame[] = [];
  for (const f of framesRaw) {
    if (!isRecord(f)) continue;
    if (typeof f.dtMs !== 'number' || !Number.isFinite(f.dtMs)) continue;
    if (typeof f.dx !== 'number' || !Number.isFinite(f.dx)) continue;
    if (typeof f.dy !== 'number' || !Number.isFinite(f.dy)) continue;
    frames.push(
      clampReplayFrame({
        dtMs: f.dtMs,
        dx: f.dx,
        dy: f.dy,
        dash: Boolean(f.dash),
        menu: Boolean(f.menu),
      }),
    );
  }

  const curseKey = typeof parsed.curseKey === 'string' ? parsed.curseKey : undefined;
  const routes = Array.isArray(parsed.routes) ? coerceRoutes(parsed.routes) : undefined;
  const composedStats = isComposedStatsSnapshot(parsed.composedStats)
    ? parsed.composedStats
    : undefined;

  return {
    version: REPLAY_BLOB_V2_VERSION,
    build,
    seed,
    variantKey,
    frameCount: frames.length,
    frames,
    curseKey,
    routes,
    composedStats,
  };
}

export function isReplayBlobV2(value: unknown): value is ReplayBlobV2 {
  if (!isRecord(value)) return false;
  if (value.version !== REPLAY_BLOB_V2_VERSION) return false;
  if (typeof value.build !== 'string') return false;
  if (typeof value.seed !== 'number' || !Number.isFinite(value.seed)) return false;
  if (typeof value.variantKey !== 'string') return false;
  if (typeof value.frameCount !== 'number') return false;
  if (!Array.isArray(value.frames)) return false;
  return true;
}

/** Route keys supported by W2 — kept in sync with `RouteKey` union. */
const ROUTE_KEYS: ReadonlyArray<RouteKey> = [
  'up_the_brae',
  'round_the_loch',
  'through_the_kirkyard',
  'stand_yer_ground',
  'run_for_the_hills',
  'buckie_pitstop',
];

function isRouteKey(v: unknown): v is RouteKey {
  return typeof v === 'string' && (ROUTE_KEYS as readonly string[]).includes(v);
}

function isPickerSlot(v: unknown): v is PickerSlot {
  return v === 'A' || v === 'B';
}

function coerceRoutes(arr: unknown[]): RoutePick[] | undefined {
  const out: RoutePick[] = [];
  for (const r of arr) {
    if (!isRecord(r)) continue;
    if (!isPickerSlot(r.slot)) continue;
    if (!isRouteKey(r.routeKey)) continue;
    const atGameTimeSec =
      typeof r.atGameTimeSec === 'number' && Number.isFinite(r.atGameTimeSec)
        ? r.atGameTimeSec
        : 0;
    const defaultedBySetting = Boolean(r.defaultedBySetting);
    out.push({ slot: r.slot, routeKey: r.routeKey, atGameTimeSec, defaultedBySetting });
  }
  return out.length > 0 ? out : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
