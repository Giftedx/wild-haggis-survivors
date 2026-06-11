/**
 * task_08 cloud-save Worker — route handlers.
 *
 * URL shape mirrors what `src/cloud/httpCloudSaveClient.ts` actually
 * sends:
 *   GET    /v1/envelope    → 200 envelope-json | 404 (no row)
 *   PUT    /v1/envelope    → 204 stored | 400 bad body | 413 oversize
 *   DELETE /v1/account     → 204 deleted (idempotent)
 *
 * Auth: `Authorization: Bearer {userId}` on every route. Missing or
 * malformed bearer → 401. Real magic-link auth is the T421 follow-up
 * — see `src/auth.ts` docstring.
 *
 * Server is schema-blind: the inner save payload is round-tripped as
 * an opaque string. Validation happens only on the envelope wrapper.
 */
import {
  CLOUD_SAVE_ENVELOPE_VERSION,
  MAX_BODY_BYTES,
  MAX_PAYLOAD_BYTES,
  MIN_PAYLOAD_BYTES,
  type CloudSaveEnvelope,
  type ErrorBody,
} from './types';
import type { D1Adapter } from './d1Adapter';
import { parseBearerUserId } from './auth';

function jsonError(status: number, error: string, message?: string): Response {
  const body: ErrorBody = message ? { error, message } : { error };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Validate the parsed envelope. Returns the envelope on success or a
 * short error code on failure. The Worker maps the failure to 400 or
 * 413 depending on the code.
 *
 * Forward-compatible: unknown extra fields are accepted (clients may
 * add envelope fields ahead of Worker deploys). Only shape failures
 * that would corrupt round-trip behaviour reject.
 */
function validateEnvelopeShape(input: unknown): CloudSaveEnvelope | string {
  if (typeof input !== 'object' || input === null) return 'not-object';
  const o = input as Record<string, unknown>;
  if (o.envelopeVersion !== CLOUD_SAVE_ENVELOPE_VERSION) return 'envelope-version';
  if (
    typeof o.payloadSchemaVersion !== 'number' ||
    !Number.isFinite(o.payloadSchemaVersion) ||
    o.payloadSchemaVersion <= 0
  ) {
    return 'payload-schema-version';
  }
  if (
    typeof o.lastModified !== 'number' ||
    !Number.isFinite(o.lastModified) ||
    o.lastModified < 0
  ) {
    return 'last-modified';
  }
  if (typeof o.deviceId !== 'string' || o.deviceId.length === 0) return 'device-id';
  if (typeof o.payload !== 'string') return 'payload-type';
  const bytes = byteLength(o.payload);
  if (bytes < MIN_PAYLOAD_BYTES) return 'payload-too-small';
  if (bytes > MAX_PAYLOAD_BYTES) return 'payload-too-large';
  return {
    envelopeVersion: CLOUD_SAVE_ENVELOPE_VERSION,
    payloadSchemaVersion: Math.floor(o.payloadSchemaVersion),
    lastModified: Math.floor(o.lastModified),
    deviceId: o.deviceId,
    payload: o.payload,
  };
}

export async function handleEnvelopeGet(
  req: Request,
  adapter: D1Adapter,
): Promise<Response> {
  const userId = parseBearerUserId(req);
  if (!userId) return jsonError(401, 'unauthorized', 'missing or malformed bearer');
  const row = await adapter.getEnvelope(userId);
  if (!row) return emptyResponse(404);
  return new Response(row.payload, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Server-Updated-At': String(row.updatedAt),
    },
  });
}

export async function handleEnvelopePut(
  req: Request,
  adapter: D1Adapter,
  now: () => number,
): Promise<Response> {
  const userId = parseBearerUserId(req);
  if (!userId) return jsonError(401, 'unauthorized', 'missing or malformed bearer');

  // Reject by Content-Length first when present — saves the body read.
  const lenHeader = req.headers.get('Content-Length');
  if (lenHeader !== null) {
    const len = Number.parseInt(lenHeader, 10);
    if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
      return jsonError(413, 'payload-too-large', 'request body exceeds maximum');
    }
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return jsonError(400, 'bad-request', 'failed to read body');
  }
  if (byteLength(raw) > MAX_BODY_BYTES) {
    return jsonError(413, 'payload-too-large', 'request body exceeds maximum');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonError(400, 'bad-request', 'invalid JSON');
  }

  const validated = validateEnvelopeShape(parsed);
  if (typeof validated === 'string') {
    if (validated === 'payload-too-large') {
      return jsonError(413, 'payload-too-large', 'envelope payload exceeds maximum');
    }
    return jsonError(400, 'bad-request', `envelope ${validated}`);
  }

  // Re-serialize to a normalized JSON string. The Worker is schema-blind
  // for inner payload, but we strip unknown wrapper fields to avoid
  // storing client-side test flags (e.g. `forceConflictPrompt`) when
  // they are present.
  const stored = JSON.stringify({
    envelopeVersion: validated.envelopeVersion,
    payloadSchemaVersion: validated.payloadSchemaVersion,
    lastModified: validated.lastModified,
    deviceId: validated.deviceId,
    payload: validated.payload,
  });

  await adapter.putEnvelope(userId, stored, now());
  return emptyResponse(204);
}

export async function handleAccountDelete(
  req: Request,
  adapter: D1Adapter,
): Promise<Response> {
  const userId = parseBearerUserId(req);
  if (!userId) return jsonError(401, 'unauthorized', 'missing or malformed bearer');
  await adapter.deleteUser(userId);
  // Idempotent — never reveal whether a row existed.
  return emptyResponse(204);
}

/**
 * Single dispatch. Tests call this with a manually constructed
 * `Request` and an adapter; the Worker `fetch` entry calls it too.
 */
export async function dispatchRequest(
  req: Request,
  adapter: D1Adapter,
  now: () => number = Date.now,
): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (pathname === '/v1/envelope') {
    if (req.method === 'GET') return handleEnvelopeGet(req, adapter);
    if (req.method === 'PUT') return handleEnvelopePut(req, adapter, now);
    return jsonError(405, 'method-not-allowed');
  }
  if (pathname === '/v1/account') {
    if (req.method === 'DELETE') return handleAccountDelete(req, adapter);
    return jsonError(405, 'method-not-allowed');
  }
  return jsonError(404, 'route-not-found');
}
