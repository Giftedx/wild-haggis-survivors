/**
 * Cloud-save Worker — contract tests.
 *
 * These exercise the Worker handler against the `InMemoryStorage`
 * adapter. They prove the request/response contract, the conflict
 * detection rule, and the auth shape.
 *
 * Deliberately NOT exercised here:
 *   - Real D1 IO performance / concurrency
 *   - Real Cloudflare runtime quirks (Cache API, Durable Objects)
 *   - Real magic-link auth
 *   - Network failures (timeout, DNS, TLS)
 *
 * Those are still product/infra decisions per ADR 0006 §Cons.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { handleRequest } from '../src/handlers';
import { InMemoryStorage } from '../src/storage';
import {
  CLOUD_SAVE_ENVELOPE_VERSION,
  MAX_PAYLOAD_BYTES,
  type CloudSaveEnvelope,
} from '../src/types';

const USER = 'user-spike-1';
const OTHER_USER = 'user-spike-2';
const BASE = 'https://worker.example.test';

function envelope(overrides: Partial<CloudSaveEnvelope> = {}): CloudSaveEnvelope {
  return {
    envelopeVersion: CLOUD_SAVE_ENVELOPE_VERSION,
    payloadSchemaVersion: 17,
    lastModified: 1_700_000_000_000,
    deviceId: 'dev-test',
    payload: '{"x":1}',
    ...overrides,
  };
}

function putReq(userId: string, env: CloudSaveEnvelope, bearer: string | null = userId): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (bearer !== null) headers.Authorization = `Bearer ${bearer}`;
  return new Request(`${BASE}/v1/envelope/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(env),
  });
}

function getReq(userId: string, bearer: string | null = userId): Request {
  const headers: Record<string, string> = {};
  if (bearer !== null) headers.Authorization = `Bearer ${bearer}`;
  return new Request(`${BASE}/v1/envelope/${userId}`, { method: 'GET', headers });
}

function deleteReq(userId: string, bearer: string | null = userId): Request {
  const headers: Record<string, string> = {};
  if (bearer !== null) headers.Authorization = `Bearer ${bearer}`;
  return new Request(`${BASE}/v1/account/${userId}`, { method: 'DELETE', headers });
}

describe('cloud-save Worker — envelope round-trip', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('PUT then GET returns the envelope unchanged', async () => {
    const env = envelope({ payload: '{"hello":"world"}' });
    const putRes = await handleRequest(putReq(USER, env), storage);
    expect(putRes.status).toBe(204);

    const getRes = await handleRequest(getReq(USER), storage);
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as CloudSaveEnvelope;
    expect(body.payload).toBe('{"hello":"world"}');
    expect(body.envelopeVersion).toBe(CLOUD_SAVE_ENVELOPE_VERSION);
    expect(body.deviceId).toBe('dev-test');
    expect(body.lastModified).toBe(1_700_000_000_000);
    expect(body.payloadSchemaVersion).toBe(17);
  });

  it('GET on unknown user returns 404 with no body', async () => {
    const getRes = await handleRequest(getReq(USER), storage);
    expect(getRes.status).toBe(404);
    expect(await getRes.text()).toBe('');
  });

  it('serverUpdatedAt header is present on GET', async () => {
    const fixedNow = 1_711_111_111_111;
    const stamped = new InMemoryStorage(() => fixedNow);
    await handleRequest(putReq(USER, envelope()), stamped);
    const getRes = await handleRequest(getReq(USER), stamped);
    expect(getRes.headers.get('X-Server-Updated-At')).toBe(String(fixedNow));
  });
});

describe('cloud-save Worker — conflict on stale lastModified', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('rejects PUT whose lastModified is older than stored, returning 409 + current', async () => {
    const fresh = envelope({ lastModified: 2_000, payload: '{"v":"fresh"}' });
    const stale = envelope({ lastModified: 1_000, payload: '{"v":"stale"}' });

    expect((await handleRequest(putReq(USER, fresh), storage)).status).toBe(204);

    const conflictRes = await handleRequest(putReq(USER, stale), storage);
    expect(conflictRes.status).toBe(409);
    const body = (await conflictRes.json()) as { error: string; current: CloudSaveEnvelope };
    expect(body.error).toBe('stale-write');
    expect(body.current.payload).toBe('{"v":"fresh"}');

    // Server still holds the fresh envelope; stale write was rejected.
    const getRes = await handleRequest(getReq(USER), storage);
    const stored = (await getRes.json()) as CloudSaveEnvelope;
    expect(stored.payload).toBe('{"v":"fresh"}');
  });

  it('accepts PUT whose lastModified equals stored (LWW tie → new write wins)', async () => {
    const a = envelope({ lastModified: 5_000, payload: '{"who":"first"}' });
    const b = envelope({ lastModified: 5_000, payload: '{"who":"second"}' });

    expect((await handleRequest(putReq(USER, a), storage)).status).toBe(204);
    expect((await handleRequest(putReq(USER, b), storage)).status).toBe(204);

    const stored = (await (await handleRequest(getReq(USER), storage)).json()) as CloudSaveEnvelope;
    expect(stored.payload).toBe('{"who":"second"}');
  });

  it('accepts PUT whose lastModified is strictly newer than stored', async () => {
    const a = envelope({ lastModified: 1_000, payload: '{"v":"old"}' });
    const b = envelope({ lastModified: 2_000, payload: '{"v":"new"}' });

    expect((await handleRequest(putReq(USER, a), storage)).status).toBe(204);
    expect((await handleRequest(putReq(USER, b), storage)).status).toBe(204);

    const stored = (await (await handleRequest(getReq(USER), storage)).json()) as CloudSaveEnvelope;
    expect(stored.payload).toBe('{"v":"new"}');
  });
});

describe('cloud-save Worker — auth', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('GET without Bearer returns 401', async () => {
    const res = await handleRequest(getReq(USER, null), storage);
    expect(res.status).toBe(401);
  });

  it('PUT without Bearer returns 401', async () => {
    const res = await handleRequest(putReq(USER, envelope(), null), storage);
    expect(res.status).toBe(401);
  });

  it('GET with Bearer for a different user returns 403', async () => {
    const res = await handleRequest(getReq(USER, OTHER_USER), storage);
    expect(res.status).toBe(403);
  });

  it('PUT with Bearer for a different user returns 403 and does not write', async () => {
    const res = await handleRequest(putReq(USER, envelope(), OTHER_USER), storage);
    expect(res.status).toBe(403);
    expect(storage.size()).toBe(0);
  });

  it('Bearer must equal exact userId — substring/prefix match rejected', async () => {
    const res = await handleRequest(getReq(USER, USER + '-extra'), storage);
    expect(res.status).toBe(403);
  });
});

describe('cloud-save Worker — body validation', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('rejects non-JSON body with 400', async () => {
    const req = new Request(`${BASE}/v1/envelope/${USER}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${USER}`,
        'Content-Type': 'application/json',
      },
      body: 'not json at all',
    });
    const res = await handleRequest(req, storage);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('json-parse');
  });

  it('rejects envelope with wrong envelopeVersion with 400', async () => {
    const env = envelope();
    (env as unknown as { envelopeVersion: number }).envelopeVersion = 999;
    const res = await handleRequest(putReq(USER, env), storage);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('envelope-envelope-version');
  });

  it('rejects envelope with empty deviceId with 400', async () => {
    const res = await handleRequest(
      putReq(USER, envelope({ deviceId: '' })),
      storage,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('envelope-device-id');
  });

  it('rejects envelope whose payload exceeds MAX_PAYLOAD_BYTES with 413', async () => {
    const big = 'x'.repeat(MAX_PAYLOAD_BYTES + 10);
    const res = await handleRequest(
      putReq(USER, envelope({ payload: big })),
      storage,
    );
    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe('payload-too-large');
  });
});

describe('cloud-save Worker — account deletion', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('DELETE removes the row; subsequent GET is 404', async () => {
    await handleRequest(putReq(USER, envelope()), storage);
    expect(storage.size()).toBe(1);
    const delRes = await handleRequest(deleteReq(USER), storage);
    expect(delRes.status).toBe(204);
    expect(storage.size()).toBe(0);

    const getRes = await handleRequest(getReq(USER), storage);
    expect(getRes.status).toBe(404);
  });

  it('DELETE without Bearer returns 401', async () => {
    const res = await handleRequest(deleteReq(USER, null), storage);
    expect(res.status).toBe(401);
  });

  it('DELETE for a different user returns 403', async () => {
    const res = await handleRequest(deleteReq(USER, OTHER_USER), storage);
    expect(res.status).toBe(403);
  });

  it('DELETE on unknown user is idempotent and returns 204', async () => {
    const res = await handleRequest(deleteReq(USER), storage);
    expect(res.status).toBe(204);
  });
});

describe('cloud-save Worker — routing', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('unknown route returns 404', async () => {
    const req = new Request(`${BASE}/nope`, { method: 'GET' });
    const res = await handleRequest(req, storage);
    expect(res.status).toBe(404);
  });

  it('userId with disallowed characters returns 404 (route mismatch)', async () => {
    const req = new Request(`${BASE}/v1/envelope/has spaces`, {
      method: 'GET',
      headers: { Authorization: 'Bearer foo' },
    });
    const res = await handleRequest(req, storage);
    expect(res.status).toBe(404);
  });

  it('disallows methods other than GET/PUT on /v1/envelope/:userId', async () => {
    const req = new Request(`${BASE}/v1/envelope/${USER}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${USER}` },
      body: '{}',
    });
    const res = await handleRequest(req, storage);
    expect(res.status).toBe(405);
  });

  it('two users have independent storage rows', async () => {
    await handleRequest(putReq(USER, envelope({ payload: '{"u":"a"}' })), storage);
    await handleRequest(
      putReq(OTHER_USER, envelope({ payload: '{"u":"b"}' })),
      storage,
    );
    const a = (await (await handleRequest(getReq(USER), storage)).json()) as CloudSaveEnvelope;
    const b = (await (await handleRequest(getReq(OTHER_USER), storage)).json()) as CloudSaveEnvelope;
    expect(a.payload).toBe('{"u":"a"}');
    expect(b.payload).toBe('{"u":"b"}');
  });
});
