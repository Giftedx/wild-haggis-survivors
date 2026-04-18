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
  isRecord,
  parseReplayBaseMeta,
  parseReplayFrames,
  parseReplayRoot,
  type ReplayBlobMeta,
  type ReplayFrame,
} from './replayBlob';
import type { PickerSlot, RoutePick } from '../data/routes';
import { getRoute } from '../data/routes';
import {
  isComposedStatsSnapshot,
  type ComposedStatsSnapshot,
} from './composedStatsSnapshot';

export const REPLAY_BLOB_V2_VERSION = 2 as const;

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
  const parsed = parseReplayRoot(raw, REPLAY_BLOB_V2_VERSION);
  if (parsed === null) return null;
  const meta = parseReplayBaseMeta(parsed);
  if (meta === null) return null;

  const frames = parseReplayFrames(parsed);
  const curseKey = typeof parsed.curseKey === 'string' ? parsed.curseKey : undefined;
  const routes = Array.isArray(parsed.routes) ? coerceRoutes(parsed.routes) : undefined;
  const composedStats = isComposedStatsSnapshot(parsed.composedStats)
    ? parsed.composedStats
    : undefined;

  return {
    version: REPLAY_BLOB_V2_VERSION,
    ...meta,
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

function isPickerSlot(v: unknown): v is PickerSlot {
  return v === 'A' || v === 'B';
}

/**
 * Validate a raw route-pick record against the live `RouteKey` union via
 * the existing `getRoute` catalog — so adding a new route in `routes.ts`
 * automatically widens what playback will accept, no parallel list to
 * keep in sync.
 */
function coerceRoutes(arr: unknown[]): RoutePick[] | undefined {
  const out: RoutePick[] = [];
  for (const r of arr) {
    if (!isRecord(r)) continue;
    if (!isPickerSlot(r.slot)) continue;
    if (typeof r.routeKey !== 'string') continue;
    try {
      getRoute(r.routeKey as never);
    } catch {
      continue; // unknown routeKey → drop this entry
    }
    const atGameTimeSec =
      typeof r.atGameTimeSec === 'number' && Number.isFinite(r.atGameTimeSec)
        ? r.atGameTimeSec
        : 0;
    const defaultedBySetting = Boolean(r.defaultedBySetting);
    out.push({
      slot: r.slot,
      routeKey: r.routeKey as RoutePick['routeKey'],
      atGameTimeSec,
      defaultedBySetting,
    });
  }
  return out.length > 0 ? out : undefined;
}
