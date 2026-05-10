/**
 * M1 — v3 replay blob.
 *
 * Extends v2 with `nodeOutcomes?: NodeOutcome[]` so a run that walked
 * Moor Road multi-node paths replays the same interactive choices
 * (shrine buff picked / bargain accepted or refused / trader item
 * taken). The node *path itself* still reproduces from the run seed
 * alone via `generateNodePath(bank, act, runRng.branch())`, so v3 only
 * records player-driven decision points.
 *
 * S1 Phase 2 (2026-05-10) — extended in place with the optional
 * `sporranPicks?: string[]` field rather than bumping to v4. The new
 * field is back-compat-shaped (optional, additive); pre-Phase 2 v3
 * blobs continue to load with the field absent, and `parseGameSceneInitData`
 * applies the picks during playback so the same modifier deltas land.
 *
 * v1/v2 readers reject v3 blobs by design (version mismatch). Callers
 * that accept any shape go through `ReplayBlobAny` + `isReplayBlobAny`
 * in `./replayBlob.ts`.
 */
import {
  isRecord,
  parseReplayBaseMeta,
  parseReplayFrames,
  parseReplayRoot,
  type ReplayFrame,
} from './replayBlob';
import type { ReplayBlobV2Meta } from './replayBlobV2';
import type { NodeOutcome } from '../data/nodeTypes';
import type { PickerSlot, RoutePick } from '../data/routes';
import { getRoute } from '../data/routes';
import { SPORRAN_CARD_IDS } from '../data/sporranCards';
import {
  isComposedStatsSnapshot,
  type ComposedStatsSnapshot,
} from './composedStatsSnapshot';

export const REPLAY_BLOB_V3_VERSION = 3 as const;

export interface ReplayBlobV3Meta extends ReplayBlobV2Meta {
  /** Ordered log of every resolved node outcome (all acts concatenated). */
  nodeOutcomes?: NodeOutcome[];
  /**
   * S1 Phase 2 — Sporran Deck picks (3 of 7 drawn cards) committed at
   * run start. Captured into the blob so playback re-applies the same
   * modifier deltas without re-rolling. Stale / unknown card IDs are
   * dropped at deserialize time so a removed card from a future release
   * never crashes playback.
   */
  sporranPicks?: string[];
}

export interface ReplayBlobV3 extends ReplayBlobV3Meta {
  version: typeof REPLAY_BLOB_V3_VERSION;
  frameCount: number;
  frames: ReplayFrame[];
}

export function createEmptyReplayBlobV3(meta: ReplayBlobV3Meta): ReplayBlobV3 {
  return {
    version: REPLAY_BLOB_V3_VERSION,
    build: meta.build,
    seed: meta.seed,
    variantKey: meta.variantKey,
    curseKey: meta.curseKey,
    routes: meta.routes,
    composedStats: meta.composedStats,
    nodeOutcomes: meta.nodeOutcomes,
    sporranPicks: meta.sporranPicks,
    frameCount: 0,
    frames: [],
  };
}

export function serializeReplayV3(blob: ReplayBlobV3): string {
  return JSON.stringify(blob);
}

export function deserializeReplayV3(raw: string): ReplayBlobV3 | null {
  const parsed = parseReplayRoot(raw, REPLAY_BLOB_V3_VERSION);
  if (parsed === null) return null;
  const meta = parseReplayBaseMeta(parsed);
  if (meta === null) return null;

  const frames = parseReplayFrames(parsed);
  const curseKey = typeof parsed.curseKey === 'string' ? parsed.curseKey : undefined;
  const routes = Array.isArray(parsed.routes) ? coerceRoutes(parsed.routes) : undefined;
  const composedStats = isComposedStatsSnapshot(parsed.composedStats)
    ? (parsed.composedStats as ComposedStatsSnapshot)
    : undefined;
  const nodeOutcomes = Array.isArray(parsed.nodeOutcomes)
    ? coerceNodeOutcomes(parsed.nodeOutcomes)
    : undefined;
  const sporranPicks = Array.isArray(parsed.sporranPicks)
    ? coerceSporranPicks(parsed.sporranPicks)
    : undefined;

  return {
    version: REPLAY_BLOB_V3_VERSION,
    ...meta,
    frameCount: frames.length,
    frames,
    curseKey,
    routes,
    composedStats,
    nodeOutcomes,
    sporranPicks,
  };
}

export function isReplayBlobV3(value: unknown): value is ReplayBlobV3 {
  if (!isRecord(value)) return false;
  if (value.version !== REPLAY_BLOB_V3_VERSION) return false;
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

function coerceRoutes(arr: unknown[]): RoutePick[] | undefined {
  const out: RoutePick[] = [];
  for (const r of arr) {
    if (!isRecord(r)) continue;
    if (!isPickerSlot(r.slot)) continue;
    if (typeof r.routeKey !== 'string') continue;
    try {
      getRoute(r.routeKey as never);
    } catch {
      continue;
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

/**
 * S1 Phase 2 — coerce + validate Sporran pick IDs from the persisted
 * blob. Drops non-string / empty / stale entries (anything not in
 * `SPORRAN_CARD_IDS`) so a renamed or removed card from a future
 * release never crashes a stored replay. Returns `undefined` on
 * absent / fully-invalid input so the field stays absent on the
 * deserialized shape (matches `nodeOutcomes` / `routes` precedent).
 */
function coerceSporranPicks(arr: unknown[]): string[] | undefined {
  const out: string[] = [];
  for (const raw of arr) {
    if (typeof raw !== 'string' || raw.length === 0) continue;
    if (!SPORRAN_CARD_IDS.has(raw)) continue;
    out.push(raw);
  }
  return out.length > 0 ? out : undefined;
}

function coerceNodeOutcomes(arr: unknown[]): NodeOutcome[] | undefined {
  const out: NodeOutcome[] = [];
  for (const raw of arr) {
    if (!isRecord(raw)) continue;
    const nodeKey = typeof raw.nodeKey === 'string' && raw.nodeKey ? raw.nodeKey : null;
    if (!nodeKey) continue;
    const visitedAtGameTimeSec =
      typeof raw.visitedAtGameTimeSec === 'number' && Number.isFinite(raw.visitedAtGameTimeSec)
        ? raw.visitedAtGameTimeSec
        : 0;
    if (typeof raw.chosenRewardKey === 'string' && raw.chosenRewardKey) {
      out.push({ nodeKey, chosenRewardKey: raw.chosenRewardKey, visitedAtGameTimeSec });
    } else {
      out.push({ nodeKey, visitedAtGameTimeSec });
    }
  }
  return out.length > 0 ? out : undefined;
}
