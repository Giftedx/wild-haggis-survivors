/**
 * Cloud-save Worker — request handler.
 *
 * Pure(ish) handler: takes a `Request` + a `Storage`, returns a
 * `Response`. No Cloudflare globals; the test runner constructs a
 * `Request` and an `InMemoryStorage` and asserts on the response.
 *
 * Routing:
 *   - GET  /v1/envelope/:userId       → 200 envelope | 404 missing | 401 auth | 403 wrong user
 *   - PUT  /v1/envelope/:userId       → 204 ok | 409 stale | 400 bad body | 413 oversize | 401 auth | 403 wrong user
 *   - DELETE /v1/account/:userId      → 204 ok | 401 auth | 403 wrong user
 *
 * Auth: `Authorization: Bearer {userId}` (matches what
 * `src/cloud/httpCloudSaveClient.ts` already sends). The Worker
 * compares the bearer to the URL `:userId`. Real magic-link auth is
 * out of scope — see ADR 0006 §Cons. The bearer-equals-userId scheme
 * is the spike's stand-in.
 *
 * The handler validates the body shape just enough to refuse obvious
 * garbage (oversize, malformed JSON, missing required fields). It
 * does NOT inspect the inner save payload — server is schema-blind.
 */
import type { Storage } from './storage';
import type { CloudSaveEnvelope } from './types';
import {
  CLOUD_SAVE_ENVELOPE_VERSION,
  MAX_BODY_BYTES,
  MAX_PAYLOAD_BYTES,
  MIN_PAYLOAD_BYTES,
} from './types';

/** Match URL like `/v1/envelope/abc` or `/v1/account/abc`. Returns userId or null. */
function matchUserPath(prefix: string, pathname: string): string | null {
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  if (rest.length === 0 || rest.includes('/')) return null;
  // userId is a UUID-ish opaque string; allow URL-safe chars.
  if (!/^[A-Za-z0-9_\-]{1,128}$/.test(rest)) return null;
  return rest;
}

function jsonResponse(status: number, body: Record<string, unknown> | null = null): Response {
  if (body === null) return new Response(null, { status });
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseAuth(headers: Headers): string | null {
  const v = headers.get('Authorization') ?? '';
  const m = /^Bearer (.+)$/.exec(v);
  return m?.[1] ?? null;
}

/**
 * Validate the parsed envelope body. Returns null on success or a
 * short error code on failure. Mirrors the validation in
 * `parseCloudSaveEnvelope` from `src/cloud/cloudSaveEnvelope.ts`,
 * but the Worker is more lenient: it accepts unknown extra fields
 * (forward-compat for client envelope additions) and only rejects
 * shape failures that would corrupt round-trip behaviour.
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
  // Approximate UTF-8 byte size check; the real Worker has TextEncoder.
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

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Single entry point. The Cloudflare Worker `fetch` handler delegates
 * here so the tests can call `handleRequest` with a manually
 * constructed `Request` and any `Storage` impl.
 */
export async function handleRequest(req: Request, storage: Storage): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Routing: envelope read/write
  const envelopeUserId = matchUserPath('/v1/envelope/', pathname);
  const accountUserId = matchUserPath('/v1/account/', pathname);

  if (envelopeUserId !== null) {
    return handleEnvelope(req, storage, envelopeUserId);
  }
  if (accountUserId !== null) {
    return handleAccount(req, storage, accountUserId);
  }
  return jsonResponse(404, { error: 'route-not-found' });
}

async function handleEnvelope(req: Request, storage: Storage, userId: string): Promise<Response> {
  const bearer = parseAuth(req.headers);
  if (!bearer) return jsonResponse(401, { error: 'missing-bearer' });
  if (bearer !== userId) return jsonResponse(403, { error: 'wrong-user' });

  if (req.method === 'GET') {
    const stored = await storage.get(userId);
    if (!stored) return new Response(null, { status: 404 });
    return new Response(JSON.stringify(stored.envelope), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Server-Updated-At': String(stored.serverUpdatedAt),
      },
    });
  }

  if (req.method === 'PUT') {
    // Reject oversize body before parsing.
    const lenHeader = req.headers.get('Content-Length');
    if (lenHeader !== null) {
      const len = Number.parseInt(lenHeader, 10);
      if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
        return jsonResponse(413, { error: 'body-too-large' });
      }
    }
    let raw: string;
    try {
      raw = await req.text();
    } catch {
      return jsonResponse(400, { error: 'body-read' });
    }
    if (byteLength(raw) > MAX_BODY_BYTES) {
      return jsonResponse(413, { error: 'body-too-large' });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return jsonResponse(400, { error: 'json-parse' });
    }
    const envelopeOrErr = validateEnvelopeShape(parsed);
    if (typeof envelopeOrErr === 'string') {
      // Map oversize-payload to 413 specifically; other shape errors → 400.
      if (envelopeOrErr === 'payload-too-large') {
        return jsonResponse(413, { error: 'payload-too-large' });
      }
      return jsonResponse(400, { error: `envelope-${envelopeOrErr}` });
    }
    const result = await storage.put(userId, envelopeOrErr);
    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: 'stale-write',
          current: result.current?.envelope ?? null,
          serverUpdatedAt: result.current?.serverUpdatedAt ?? null,
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
    return new Response(null, { status: 204 });
  }

  return jsonResponse(405, { error: 'method-not-allowed' });
}

async function handleAccount(req: Request, storage: Storage, userId: string): Promise<Response> {
  const bearer = parseAuth(req.headers);
  if (!bearer) return jsonResponse(401, { error: 'missing-bearer' });
  if (bearer !== userId) return jsonResponse(403, { error: 'wrong-user' });

  if (req.method === 'DELETE') {
    await storage.delete(userId);
    return new Response(null, { status: 204 });
  }
  return jsonResponse(405, { error: 'method-not-allowed' });
}
