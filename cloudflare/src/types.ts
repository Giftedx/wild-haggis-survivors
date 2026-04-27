/**
 * task_08 cloud-save Worker — shared types.
 *
 * Sibling-project types. Deliberately NOT imported from `src/cloud/*` —
 * the Worker is a separate TS project (its own `tsconfig.json`) and
 * importing from the game would couple the two builds together. The
 * envelope wire shape is the contract; the integration tests prove
 * the Worker and the client agree on it.
 */

import type { D1Database } from '@cloudflare/workers-types';

/** Cloudflare environment bindings — see `wrangler.toml` `[[d1_databases]]`. */
export interface Env {
  /** D1 binding. The miniflare integration test wires this up too. */
  DB: D1Database;
}

/** Standard JSON error response shape from `/v1/*`. */
export interface ErrorBody {
  error: string;
  message?: string;
}

/** What we accept on the wire — duplicated from `src/cloud/cloudSaveEnvelope.ts`. */
export interface CloudSaveEnvelope {
  envelopeVersion: 1;
  payloadSchemaVersion: number;
  lastModified: number;
  deviceId: string;
  payload: string;
  signature?: string;
  forceConflictPrompt?: boolean;
}

/** Matches `MAX_PAYLOAD_BYTES` in `src/cloud/cloudSaveEnvelope.ts`. */
export const MAX_PAYLOAD_BYTES = 256 * 1024;
/** Matches `MIN_PAYLOAD_BYTES` in `src/cloud/cloudSaveEnvelope.ts`. */
export const MIN_PAYLOAD_BYTES = 2;
/** Hard request-body cap (envelope wrapping + slack). 320 KB. */
export const MAX_BODY_BYTES = 320 * 1024;
/** Current envelope wire-format version. */
export const CLOUD_SAVE_ENVELOPE_VERSION = 1 as const;
