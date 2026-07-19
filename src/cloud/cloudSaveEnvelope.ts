/**
 * P3 Cloud Saves — envelope shape.
 *
 * The cloud envelope wraps the existing `whs_save` payload (schema v${SAVE_SCHEMA_VERSION},
 * see `src/utils/save/schema.ts`) without modifying the inner shape. The
 * server is schema-blind passthrough; client-side migrations stay where
 * they already live.
 *
 * Pure module — no Phaser, no DOM, no network. Safe to import from any
 * layer; covered by Vitest at `cloudSaveEnvelope.test.ts`.
 *
 * Charter: `docs/top-10-tasks/03-p3-cloud-saves.md` §Phase 2.1.
 * Decision: `docs/P3_BACKEND_DECISION_MATRIX.md` (architectural choice
 * ratified 2026-05-09).
 * ADR: `docs/adr/0006-cloud-save-backend.md`.
 *
 * No backend dependency — this file ships independent of which provider
 * the maintainer eventually picks.
 */

/** Current envelope schema version. Bump if the wrapper shape changes. */
export const CLOUD_SAVE_ENVELOPE_VERSION = 1 as const;

/**
 * Maximum accepted inner-payload length in bytes. The hard ceiling is
 * any cloud provider's per-row blob limit (D1: 1 MB, KV: 25 MB,
 * Firestore: 1 MB, Supabase: 50 MB). 256 KB is generous for the
 * existing v${SAVE_SCHEMA_VERSION} payload (5–50 KB typical, 200 KB worst case with full
 * replay blob) and gives the server a sanity check before persisting.
 */
export const MAX_PAYLOAD_BYTES = 256 * 1024;

/** Minimum length we'll accept — empty strings are corruption. */
export const MIN_PAYLOAD_BYTES = 2; // "{}" at minimum

export interface CloudSaveEnvelope {
  /** Envelope schema version. Distinct from inner payload's schema. */
  envelopeVersion: typeof CLOUD_SAVE_ENVELOPE_VERSION;
  /**
   * The inner payload schema version (e.g. SAVE_SCHEMA_VERSION for current `whs_save`).
   * Recorded so the conflict-resolution layer can refuse to overwrite
   * a newer-schema local with an older-schema cloud blob (or vice
   * versa). See `cloudSaveConflict.ts`.
   */
  payloadSchemaVersion: number;
  /** Wall-clock timestamp at write, in milliseconds since UNIX epoch. */
  lastModified: number;
  /**
   * Stable per-device identifier. Generated lazily on first cloud
   * sign-in via `crypto.randomUUID()` and persisted in `localStorage`.
   * Used by the conflict UX to label "this device" vs "the cloud" and
   * to detect cross-device divergence.
   */
  deviceId: string;
  /**
   * The inner payload, JSON-stringified. Stored as a string (not parsed
   * here) so we don't have to coerce the inner shape; that's the
   * existing `migrateAndCoerce` path's job in `save.ts` and
   * `SaveManager.ts`. Server is schema-blind.
   */
  payload: string;
  /**
   * Test/debug flag — when true, the conflict detector forces the
   * `conflict-ambiguous` branch regardless of timestamps. Used by
   * Playwright e2e specs that need to exercise the dialog without
   * setting up two devices. Never set this to `true` in production
   * code.
   */
  forceConflictPrompt?: boolean;
}

/**
 * The wire format used by the eventual Worker connector. Identical to
 * the in-memory envelope plus an optional `signature` field reserved
 * for HMAC payload integrity (post-MVP). Server requests use this
 * shape; clients should never emit `signature` until the integrity
 * layer ships.
 */
export interface CloudSaveWireEnvelope extends CloudSaveEnvelope {
  /** Reserved for HMAC of payload + lastModified. Not yet implemented. */
  signature?: string;
}

export interface BuildEnvelopeOpts {
  payloadSchemaVersion: number;
  deviceId: string;
  /** ISO ms timestamp; defaults to `Date.now()`. Tests pass an explicit value. */
  now?: number;
}

/**
 * Wrap an inner save payload (already JSON-stringified) in a cloud
 * envelope. Throws if the payload exceeds `MAX_PAYLOAD_BYTES` — the
 * caller (toast handler) decides how to surface that.
 */
export function buildCloudSaveEnvelope(
  payload: string,
  opts: BuildEnvelopeOpts,
): CloudSaveEnvelope {
  if (typeof payload !== 'string') {
    throw new TypeError('cloudSaveEnvelope: payload must be a string');
  }
  const bytes = byteLength(payload);
  if (bytes < MIN_PAYLOAD_BYTES) {
    throw new RangeError(`cloudSaveEnvelope: payload too small (${bytes} bytes)`);
  }
  if (bytes > MAX_PAYLOAD_BYTES) {
    throw new RangeError(
      `cloudSaveEnvelope: payload exceeds ${MAX_PAYLOAD_BYTES} bytes (got ${bytes})`,
    );
  }
  if (typeof opts.deviceId !== 'string' || opts.deviceId.length === 0) {
    throw new TypeError('cloudSaveEnvelope: deviceId must be a non-empty string');
  }
  if (typeof opts.payloadSchemaVersion !== 'number' || !Number.isFinite(opts.payloadSchemaVersion)) {
    throw new TypeError('cloudSaveEnvelope: payloadSchemaVersion must be a finite number');
  }
  const now = typeof opts.now === 'number' && Number.isFinite(opts.now)
    ? opts.now
    : Date.now();
  return {
    envelopeVersion: CLOUD_SAVE_ENVELOPE_VERSION,
    payloadSchemaVersion: Math.floor(opts.payloadSchemaVersion),
    lastModified: Math.floor(now),
    deviceId: opts.deviceId,
    payload,
  };
}

/**
 * Parse + validate an envelope received from the wire. Returns the
 * envelope on success, or throws with a descriptive error on any
 * shape problem — callers should treat any throw as "treat the local
 * as authoritative" (per spec doc, corrupt remote = self-heal silent
 * push).
 */
export function parseCloudSaveEnvelope(input: unknown): CloudSaveEnvelope {
  if (typeof input !== 'object' || input === null) {
    throw new TypeError('cloudSaveEnvelope: input is not an object');
  }
  const o = input as Record<string, unknown>;
  if (o.envelopeVersion !== CLOUD_SAVE_ENVELOPE_VERSION) {
    throw new RangeError(
      `cloudSaveEnvelope: unsupported envelopeVersion ${String(o.envelopeVersion)}`,
    );
  }
  const payloadSchemaVersion = o.payloadSchemaVersion;
  if (typeof payloadSchemaVersion !== 'number' || !Number.isFinite(payloadSchemaVersion) || payloadSchemaVersion <= 0) {
    throw new TypeError('cloudSaveEnvelope: invalid payloadSchemaVersion');
  }
  const lastModified = o.lastModified;
  if (typeof lastModified !== 'number' || !Number.isFinite(lastModified) || lastModified < 0) {
    throw new TypeError('cloudSaveEnvelope: invalid lastModified');
  }
  const deviceId = o.deviceId;
  if (typeof deviceId !== 'string' || deviceId.length === 0) {
    throw new TypeError('cloudSaveEnvelope: invalid deviceId');
  }
  const payload = o.payload;
  if (typeof payload !== 'string') {
    throw new TypeError('cloudSaveEnvelope: payload must be a string');
  }
  const bytes = byteLength(payload);
  if (bytes < MIN_PAYLOAD_BYTES || bytes > MAX_PAYLOAD_BYTES) {
    throw new RangeError(
      `cloudSaveEnvelope: payload size ${bytes} out of bounds [${MIN_PAYLOAD_BYTES}, ${MAX_PAYLOAD_BYTES}]`,
    );
  }
  const out: CloudSaveEnvelope = {
    envelopeVersion: CLOUD_SAVE_ENVELOPE_VERSION,
    payloadSchemaVersion: Math.floor(payloadSchemaVersion),
    lastModified: Math.floor(lastModified),
    deviceId,
    payload,
  };
  if (o.forceConflictPrompt === true) {
    out.forceConflictPrompt = true;
  }
  return out;
}

/**
 * Serialize an envelope for transit. Round-trip with `parseCloudSaveEnvelope`
 * is a vitest invariant.
 */
export function serializeCloudSaveEnvelope(envelope: CloudSaveEnvelope): string {
  return JSON.stringify(envelope);
}

function byteLength(s: string): number {
  // TextEncoder is available in modern browsers, Node 18+, and Workers.
  // Fall back to a UTF-8 byte estimate if absent (very old jsdom).
  const enc = (globalThis as unknown as { TextEncoder?: { new (): { encode(s: string): Uint8Array } } }).TextEncoder;
  if (enc) return new enc().encode(s).length;
  // Approximate: count code points; multi-byte chars under-counted but
  // close enough for the size guard. The MAX_PAYLOAD_BYTES limit has
  // generous headroom over typical save sizes.
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xD800 && c <= 0xDBFF) { bytes += 4; i += 1; }
    else bytes += 3;
  }
  return bytes;
}
