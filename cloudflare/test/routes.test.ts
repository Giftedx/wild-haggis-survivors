/**
 * task_08 cloud-save Worker — route-handler unit tests.
 *
 * These exercise `dispatchRequest` against a stub `D1Adapter`-shaped
 * object backed by a `Map`. They are FAST (no miniflare bootstrap) and
 * give us coverage of the validation / error-mapping branches that
 * the integration tests don't hit easily.
 *
 * The real D1 + miniflare end-to-end suite lives in
 * `worker.integration.test.ts` and uses `HttpCloudSaveClient` from
 * the game's `src/cloud/` to prove the wire contract.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { dispatchRequest } from '../src/routes';
import type { D1Adapter, StoredRow } from '../src/d1Adapter';
import {
  CLOUD_SAVE_ENVELOPE_VERSION,
  MAX_PAYLOAD_BYTES,
  type CloudSaveEnvelope,
} from '../src/types';

const USER = 'user-int-1';
const BASE = 'https://worker.example.test';

class StubAdapter {
  rows = new Map<string, StoredRow>();
  async getEnvelope(userId: string): Promise<StoredRow | null> {
    return this.rows.get(userId) ?? null;
  }
  async putEnvelope(userId: string, json: string, now: number): Promise<void> {
    this.rows.set(userId, { payload: json, updatedAt: now });
  }
  async deleteUser(userId: string): Promise<boolean> {
    return this.rows.delete(userId);
  }
}

function makeEnvelope(over: Partial<CloudSaveEnvelope> = {}): CloudSaveEnvelope {
  return {
    envelopeVersion: CLOUD_SAVE_ENVELOPE_VERSION,
    payloadSchemaVersion: 17,
    lastModified: 1_700_000_000_000,
    deviceId: 'dev-test',
    payload: '{"x":1}',
    ...over,
  };
}

function bearer(userId = USER): Record<string, string> {
  return { Authorization: `Bearer ${userId}` };
}

describe('dispatchRequest — auth', () => {
  let stub: StubAdapter;
  beforeEach(() => { stub = new StubAdapter(); });

  it('GET /v1/envelope without bearer → 401', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, { method: 'GET' }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('unauthorized');
  });

  it('PUT /v1/envelope without bearer → 401', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makeEnvelope()),
      }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(401);
  });

  it('DELETE /v1/account without bearer → 401', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/account`, { method: 'DELETE' }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(401);
  });

  it('GET with malformed bearer ("Bearer" only) → 401', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'GET',
        headers: { Authorization: 'Bearer ' },
      }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(401);
  });

  it('GET with bearer userId containing forbidden chars → 401', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'GET',
        headers: { Authorization: 'Bearer drop table users; --' },
      }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(401);
  });
});

describe('dispatchRequest — round trip', () => {
  let stub: StubAdapter;
  beforeEach(() => { stub = new StubAdapter(); });

  it('GET on empty store → 404 with empty body', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, { method: 'GET', headers: bearer() }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('');
  });

  it('PUT then GET round-trips the envelope unchanged', async () => {
    const env = makeEnvelope({ payload: '{"hello":"world"}' });
    const put = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'PUT',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify(env),
      }),
      stub as unknown as D1Adapter,
      () => 1_711_111_111_111,
    );
    expect(put.status).toBe(204);

    const get = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, { method: 'GET', headers: bearer() }),
      stub as unknown as D1Adapter,
    );
    expect(get.status).toBe(200);
    expect(get.headers.get('X-Server-Updated-At')).toBe('1711111111111');
    const body = await get.json() as CloudSaveEnvelope;
    expect(body.payload).toBe('{"hello":"world"}');
    expect(body.envelopeVersion).toBe(CLOUD_SAVE_ENVELOPE_VERSION);
    expect(body.deviceId).toBe('dev-test');
  });

  it('PUT strips unknown wrapper fields (e.g. forceConflictPrompt)', async () => {
    const env = {
      ...makeEnvelope(),
      forceConflictPrompt: true,
      __injected: 'should-not-survive',
    };
    await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'PUT',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify(env),
      }),
      stub as unknown as D1Adapter,
    );

    const stored = stub.rows.get(USER);
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!.payload) as Record<string, unknown>;
    expect(parsed.forceConflictPrompt).toBeUndefined();
    expect(parsed.__injected).toBeUndefined();
    expect(parsed.envelopeVersion).toBe(1);
  });
});

describe('dispatchRequest — body validation', () => {
  let stub: StubAdapter;
  beforeEach(() => { stub = new StubAdapter(); });

  it('non-JSON body → 400', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'PUT',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: 'not json',
      }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string; message?: string };
    expect(body.error).toBe('bad-request');
  });

  it('wrong envelopeVersion → 400', async () => {
    const env = { ...makeEnvelope(), envelopeVersion: 999 };
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'PUT',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify(env),
      }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(400);
  });

  it('empty deviceId → 400', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'PUT',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify(makeEnvelope({ deviceId: '' })),
      }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(400);
  });

  it('payload exceeding MAX_PAYLOAD_BYTES → 413', async () => {
    const big = 'x'.repeat(MAX_PAYLOAD_BYTES + 100);
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'PUT',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify(makeEnvelope({ payload: big })),
      }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(413);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('payload-too-large');
  });
});

describe('dispatchRequest — account deletion', () => {
  let stub: StubAdapter;
  beforeEach(() => { stub = new StubAdapter(); });

  it('DELETE removes the row; subsequent GET → 404', async () => {
    await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'PUT',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify(makeEnvelope()),
      }),
      stub as unknown as D1Adapter,
    );
    expect(stub.rows.size).toBe(1);

    const del = await dispatchRequest(
      new Request(`${BASE}/v1/account`, { method: 'DELETE', headers: bearer() }),
      stub as unknown as D1Adapter,
    );
    expect(del.status).toBe(204);
    expect(stub.rows.size).toBe(0);

    const get = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, { method: 'GET', headers: bearer() }),
      stub as unknown as D1Adapter,
    );
    expect(get.status).toBe(404);
  });

  it('DELETE on unknown user is idempotent → 204', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/account`, { method: 'DELETE', headers: bearer() }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(204);
  });

  it('two users have independent rows', async () => {
    const userA = 'user-a';
    const userB = 'user-b';
    await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'PUT',
        headers: { ...bearer(userA), 'Content-Type': 'application/json' },
        body: JSON.stringify(makeEnvelope({ payload: '{"u":"a"}' })),
      }),
      stub as unknown as D1Adapter,
    );
    await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'PUT',
        headers: { ...bearer(userB), 'Content-Type': 'application/json' },
        body: JSON.stringify(makeEnvelope({ payload: '{"u":"b"}' })),
      }),
      stub as unknown as D1Adapter,
    );
    const a = await (await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, { method: 'GET', headers: bearer(userA) }),
      stub as unknown as D1Adapter,
    )).json() as CloudSaveEnvelope;
    const b = await (await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, { method: 'GET', headers: bearer(userB) }),
      stub as unknown as D1Adapter,
    )).json() as CloudSaveEnvelope;
    expect(a.payload).toBe('{"u":"a"}');
    expect(b.payload).toBe('{"u":"b"}');
  });
});

describe('dispatchRequest — routing', () => {
  let stub: StubAdapter;
  beforeEach(() => { stub = new StubAdapter(); });

  it('unknown path → 404 with route-not-found', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/nope`, { method: 'GET', headers: bearer() }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('route-not-found');
  });

  it('POST to /v1/envelope → 405', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/envelope`, {
        method: 'POST',
        headers: bearer(),
        body: '{}',
      }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(405);
  });

  it('GET to /v1/account → 405', async () => {
    const res = await dispatchRequest(
      new Request(`${BASE}/v1/account`, { method: 'GET', headers: bearer() }),
      stub as unknown as D1Adapter,
    );
    expect(res.status).toBe(405);
  });
});
