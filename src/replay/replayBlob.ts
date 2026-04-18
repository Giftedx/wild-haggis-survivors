/**
 * T1 deterministic replay — blob format + codec.
 *
 * A ReplayBlob is the complete record-side payload for a single run: the
 * seed that re-establishes RNG, the variant chosen, the build identifier,
 * and the per-frame input + delta stream. This module owns only the pure
 * data type + codec; recording is driven by `ReplayRecorder` and consumed
 * by a future playback engine (see docs/adr/0002).
 *
 * JSON-friendly: frames are plain objects for now. If blob size crosses
 * the localStorage quota in practice, switch to parallel typed arrays +
 * base64 (tracked in ADR-0002 follow-ups).
 */

/**
 * Format version. Bump when the frame shape or field semantics change
 * (e.g. adding gamepad-face-button edges for a new variant). Readers must
 * reject blobs whose version doesn't match — no partial-compat shims.
 */
export const REPLAY_BLOB_VERSION = 1 as const;

/** Matches GameScene.update's delta clamp (see CLAUDE.md). */
export const REPLAY_MAX_DT_MS = 100;

export interface ReplayFrame {
  /** Game-time delta in ms applied this frame. Clamped to [0, 100]. */
  dtMs: number;
  /** Input direction x-component, clamped so |d| ≤ 1. */
  dx: number;
  /** Input direction y-component, clamped so |d| ≤ 1. */
  dy: number;
  /** Dash edge fired this frame (JustDown / gamepad edge / touch tap). */
  dash: boolean;
  /** Menu-pause edge fired this frame (gamepad Start/Options). */
  menu: boolean;
}

export interface ReplayBlobMeta {
  /** Build identifier (commit sha or package version). */
  build: string;
  /** 32-bit normalized RNG seed. */
  seed: number;
  /** Variant key chosen for the run (classic, moor_runner, …). */
  variantKey: string;
}

export interface ReplayBlob extends ReplayBlobMeta {
  version: typeof REPLAY_BLOB_VERSION;
  frameCount: number;
  frames: ReplayFrame[];
}

export function createEmptyReplayBlob(meta: ReplayBlobMeta): ReplayBlob {
  return {
    version: REPLAY_BLOB_VERSION,
    build: meta.build,
    seed: meta.seed,
    variantKey: meta.variantKey,
    frameCount: 0,
    frames: [],
  };
}

/**
 * Defensive clamp of raw per-frame data to the schema. Applied by the
 * recorder on push and by the deserializer on read — keeps malformed
 * upstream data from poisoning the stream.
 */
export function clampReplayFrame(raw: ReplayFrame): ReplayFrame {
  const dtMs = clampFinite(raw.dtMs, 0, REPLAY_MAX_DT_MS, 0);
  const { dx, dy } = clampDir(raw.dx, raw.dy);
  return {
    dtMs,
    dx,
    dy,
    dash: toBoolean(raw.dash),
    menu: toBoolean(raw.menu),
  };
}

export function serializeReplay(blob: ReplayBlob): string {
  return JSON.stringify(blob);
}

export function deserializeReplay(raw: string): ReplayBlob | null {
  const parsed = parseReplayRoot(raw, REPLAY_BLOB_VERSION);
  if (parsed === null) return null;
  const meta = parseReplayBaseMeta(parsed);
  if (meta === null) return null;
  const frames = parseReplayFrames(parsed);
  return {
    version: REPLAY_BLOB_VERSION,
    ...meta,
    frameCount: frames.length,
    frames,
  };
}

/**
 * Shared v1/v2 deserializer helpers — extracted so v2 doesn't re-write
 * the base-field + frame-array parsing. Exported for `replayBlobV2.ts`.
 */
export function parseReplayRoot(raw: string, expectedVersion: number): Record<string, unknown> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (parsed.version !== expectedVersion) return null;
  return parsed;
}

export function parseReplayBaseMeta(
  parsed: Record<string, unknown>,
): ReplayBlobMeta | null {
  const build = typeof parsed.build === 'string' ? parsed.build : null;
  const seed =
    typeof parsed.seed === 'number' && Number.isFinite(parsed.seed)
      ? Math.floor(parsed.seed)
      : null;
  const variantKey = typeof parsed.variantKey === 'string' ? parsed.variantKey : null;
  if (build === null || seed === null || variantKey === null) return null;
  return { build, seed, variantKey };
}

export function parseReplayFrames(parsed: Record<string, unknown>): ReplayFrame[] {
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
        dash: toBoolean(f.dash),
        menu: toBoolean(f.menu),
      }),
    );
  }
  return frames;
}

export function isReplayBlob(value: unknown): value is ReplayBlob {
  if (!isRecord(value)) return false;
  if (value.version !== REPLAY_BLOB_VERSION) return false;
  if (typeof value.build !== 'string') return false;
  if (typeof value.seed !== 'number' || !Number.isFinite(value.seed)) return false;
  if (typeof value.variantKey !== 'string') return false;
  if (typeof value.frameCount !== 'number') return false;
  if (!Array.isArray(value.frames)) return false;
  return true;
}

// ── v1 / v2 union ──────────────────────────────────────────────────
//
// Callers that should accept either shape go through `ReplayBlobAny` +
// `isReplayBlobAny`. The imports stay at the bottom to avoid a forward
// reference during eval (v2 module imports from this file for shared
// clamp / frame types).
import { isReplayBlobV2, type ReplayBlobV2 } from './replayBlobV2';

export type ReplayBlobAny = ReplayBlob | ReplayBlobV2;

export function isReplayBlobAny(value: unknown): value is ReplayBlobAny {
  return isReplayBlob(value) || isReplayBlobV2(value);
}

function clampFinite(value: number, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function clampDir(rawX: number, rawY: number): { dx: number; dy: number } {
  const x = Number.isFinite(rawX) ? rawX : 0;
  const y = Number.isFinite(rawY) ? rawY : 0;
  const len = Math.hypot(x, y);
  if (len <= 1 || len === 0) return { dx: x, dy: y };
  return { dx: x / len, dy: y / len };
}

function toBoolean(v: unknown): boolean {
  return Boolean(v);
}

/** Exported for `replayBlobV2.ts`; also used internally. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
