/**
 * Cloud-save Worker — wire-format types.
 *
 * The Worker is a thin schema-blind passthrough: it accepts an opaque
 * envelope body, persists it under a userId key, and serves it back.
 * The inner save payload is the existing `whs_save` JSON, unchanged.
 *
 * These types are duplicated from `src/cloud/cloudSaveEnvelope.ts` on
 * purpose — the Worker is a sibling project and must not import from
 * the game bundle (or vice versa). The envelope shape is the contract;
 * mismatches are caught by the contract tests.
 *
 * If the envelope shape ever changes, both files must be updated and
 * the contract tests will fail until they agree again.
 */
export const CLOUD_SAVE_ENVELOPE_VERSION = 1 as const;

/** 256 KB — matches MAX_PAYLOAD_BYTES in src/cloud/cloudSaveEnvelope.ts. */
export const MAX_PAYLOAD_BYTES = 256 * 1024;
/** 2 bytes ("{}") — matches MIN_PAYLOAD_BYTES in src/cloud/cloudSaveEnvelope.ts. */
export const MIN_PAYLOAD_BYTES = 2;

/**
 * Hard cap on the entire request body (envelope + slack). The envelope
 * wraps a payload up to MAX_PAYLOAD_BYTES with a few hundred bytes of
 * envelope metadata; round up generously to 320 KB so a typo in the
 * envelope wrapper does not silently 413 a valid save.
 */
export const MAX_BODY_BYTES = 320 * 1024;

export interface CloudSaveEnvelope {
  envelopeVersion: typeof CLOUD_SAVE_ENVELOPE_VERSION;
  payloadSchemaVersion: number;
  /** ms since epoch — used for stale-write conflict detection. */
  lastModified: number;
  deviceId: string;
  /** JSON-stringified inner save. The Worker never parses this. */
  payload: string;
  /** Reserved; ignored by Worker until HMAC integrity layer ships. */
  signature?: string;
  /** Reserved; ignored by Worker (used by client conflict UX only). */
  forceConflictPrompt?: boolean;
}

/** Stored row plus server-side metadata. */
export interface StoredEnvelope {
  envelope: CloudSaveEnvelope;
  /** Server-assigned write timestamp (ms since epoch). */
  serverUpdatedAt: number;
}
