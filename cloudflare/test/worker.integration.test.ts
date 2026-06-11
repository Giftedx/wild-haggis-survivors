/**
 * task_08 cloud-save Worker — miniflare + D1 integration tests.
 *
 * Boots a real miniflare instance with the bundled Worker entrypoint
 * and an in-memory D1 binding (`d1Persist: false`). Applies the v0001
 * schema before each test, then exercises the contract using the SAME
 * `HttpCloudSaveClient` from the game's `src/cloud/` directory — the
 * Worker conforms to ITS contract, not the other way around.
 *
 * Together with the unit-level `routes.test.ts`, this proves:
 *   - The wire shape the client sends matches what the Worker accepts.
 *   - The D1 schema in `schema/0001_initial.sql` is sufficient.
 *   - The miniflare D1 binding behaves the same way real D1 will (insofar
 *     as miniflare's SQLite implementation is accurate to D1's, which is
 *     Cloudflare's own integration story).
 *
 * What this does NOT prove:
 *   - Real D1 throughput, replication, or contention behaviour
 *   - Real magic-link auth (T421) — the bearer-equals-userId scheme is a spike stand-in
 *   - Production deployment (T423)
 *   - Privacy policy / GDPR soft-delete (T422)
 *
 * If you change the URL paths or the auth header shape, BOTH the
 * Worker (`src/routes.ts`, `src/auth.ts`) and the client
 * (`src/cloud/httpCloudSaveClient.ts`) must move together. These tests
 * are the lock that prevents drift.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { Miniflare, type MiniflareOptions } from 'miniflare';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { HttpCloudSaveClient } from '../../src/cloud/httpCloudSaveClient';
import {
  buildCloudSaveEnvelope,
  MAX_PAYLOAD_BYTES,
} from '../../src/cloud/cloudSaveEnvelope';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_CLOUDFLARE_DIR = resolve(__dirname, '..');

const USER = 'user-int-1';
const OTHER_USER = 'user-int-2';

let mf: Miniflare;
let baseUrl: string;
let workerScript: string;
let schemaSql: string;

/**
 * Bundle the Worker entrypoint via esbuild so miniflare can execute
 * pure JS. We use `format: 'esm'` and `platform: 'browser'` to match
 * the Workers runtime expectations.
 */
async function bundleWorker(): Promise<string> {
  const entry = resolve(REPO_CLOUDFLARE_DIR, 'src/worker.ts');
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    conditions: ['worker', 'import', 'default'],
    sourcemap: false,
  });
  return result.outputFiles[0].text;
}

/**
 * Strip SQL line comments (`-- ...`) and split into individual statements.
 * Miniflare's `D1Database.exec` is finicky about comments mid-stream and
 * insists on whitespace-separated statements; this normalises both.
 */
function splitSqlStatements(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      return (idx >= 0 ? line.slice(0, idx) : line).trim();
    })
    .filter((line) => line.length > 0)
    .join(' ')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Apply the schema to the miniflare-provisioned D1 binding. Idempotent
 * (`CREATE TABLE IF NOT EXISTS`), so re-applying between tests is a no-op
 * if the DB persists; we still call it once per test for safety.
 */
async function applySchema(): Promise<void> {
  const db = await mf.getD1Database('DB');
  for (const stmt of splitSqlStatements(schemaSql)) {
    await db.prepare(stmt).run();
  }
}

beforeAll(async () => {
  workerScript = await bundleWorker();
  schemaSql = await readFile(resolve(REPO_CLOUDFLARE_DIR, 'schema/0001_initial.sql'), 'utf-8');

  const options: MiniflareOptions = {
    modules: true,
    script: workerScript,
    compatibilityDate: '2025-04-01',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: { DB: ':memory:' },
    // Bind to an ephemeral port; we read the actual URL from miniflare.
    port: 0,
  };
  mf = new Miniflare(options);
  await mf.ready;
  const url = await mf.ready;
  baseUrl = url.origin;
});

afterAll(async () => {
  if (mf) await mf.dispose();
});

beforeEach(async () => {
  // Wipe previous test state — miniflare keeps the D1 instance across
  // tests (single beforeAll), so we drop and re-apply the schema.
  const db = await mf.getD1Database('DB');
  await db.exec('DROP TABLE IF EXISTS envelopes;');
  await applySchema();
});

function newClient(userId = USER): HttpCloudSaveClient {
  const client = new HttpCloudSaveClient(baseUrl);
  client.signInForTest(`${userId}@test.example`, userId);
  return client;
}

function makeEnvelope(payload: string, opts: { lastModified?: number; deviceId?: string } = {}) {
  return buildCloudSaveEnvelope(payload, {
    payloadSchemaVersion: 17,
    deviceId: opts.deviceId ?? 'dev-int-test',
    now: opts.lastModified ?? 1_700_000_000_000,
  });
}

describe('HttpCloudSaveClient ↔ Worker (miniflare + D1) — pull on empty', () => {
  it('pull when no row exists → { ok: true, value: null }', async () => {
    const client = newClient();
    const result = await client.pullEnvelope();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeNull();
  });
});

describe('HttpCloudSaveClient ↔ Worker — round-trip', () => {
  it('push then pull returns matching envelope', async () => {
    const client = newClient();
    const env = makeEnvelope('{"hello":"miniflare"}');

    const push = await client.pushEnvelope(env);
    expect(push.ok).toBe(true);

    const pull = await client.pullEnvelope();
    expect(pull.ok).toBe(true);
    if (pull.ok && pull.value) {
      expect(pull.value.payload).toBe('{"hello":"miniflare"}');
      expect(pull.value.envelopeVersion).toBe(1);
      expect(pull.value.deviceId).toBe('dev-int-test');
      expect(pull.value.payloadSchemaVersion).toBe(17);
      expect(pull.value.lastModified).toBe(1_700_000_000_000);
    }
  });

  it('two users have isolated cloud saves', async () => {
    const a = newClient(USER);
    const b = newClient(OTHER_USER);

    await a.pushEnvelope(makeEnvelope('{"u":"a"}'));
    await b.pushEnvelope(makeEnvelope('{"u":"b"}'));

    const pullA = await a.pullEnvelope();
    const pullB = await b.pullEnvelope();
    expect(pullA.ok && pullA.value?.payload).toBe('{"u":"a"}');
    expect(pullB.ok && pullB.value?.payload).toBe('{"u":"b"}');
  });

  it('subsequent push overwrites the prior envelope', async () => {
    const client = newClient();
    await client.pushEnvelope(makeEnvelope('{"v":1}', { lastModified: 1_000 }));
    await client.pushEnvelope(makeEnvelope('{"v":2}', { lastModified: 2_000 }));
    const pull = await client.pullEnvelope();
    expect(pull.ok && pull.value?.payload).toBe('{"v":2}');
    expect(pull.ok && pull.value?.lastModified).toBe(2_000);
  });
});

describe('HttpCloudSaveClient ↔ Worker — auth', () => {
  it('pullEnvelope without sign-in → { ok: false, reason: "unauthorized" }', async () => {
    const client = new HttpCloudSaveClient(baseUrl);
    const result = await client.pullEnvelope();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unauthorized');
  });

  it('pushEnvelope without sign-in → { ok: false, reason: "unauthorized" }', async () => {
    const client = new HttpCloudSaveClient(baseUrl);
    const result = await client.pushEnvelope(makeEnvelope('{"x":1}'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unauthorized');
  });

  it('requestAccountDeletion without sign-in → { ok: false, reason: "unauthorized" }', async () => {
    const client = new HttpCloudSaveClient(baseUrl);
    const result = await client.requestAccountDeletion();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unauthorized');
  });

  it('Worker rejects requests without Bearer header (401)', async () => {
    // Direct fetch — bypass the client to verify the Worker contract.
    const res = await fetch(`${baseUrl}/v1/envelope`, { method: 'GET' });
    expect(res.status).toBe(401);
  });
});

describe('HttpCloudSaveClient ↔ Worker — payload too large', () => {
  it('Worker rejects oversized payloads with 413 → client maps to "payload-too-large"', async () => {
    // The envelope builder enforces MAX_PAYLOAD_BYTES, so we sneak past it
    // by hand-constructing the wire envelope. This proves the SERVER guard,
    // independent of the client-side guard.
    const client = newClient();
    const big = 'x'.repeat(MAX_PAYLOAD_BYTES + 1024);
    const envelope = {
      envelopeVersion: 1 as const,
      payloadSchemaVersion: 17,
      lastModified: 1_700_000_000_000,
      deviceId: 'dev-int-test',
      payload: big,
    };
    const result = await client.pushEnvelope(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('payload-too-large');
  });
});

describe('HttpCloudSaveClient ↔ Worker — account deletion', () => {
  it('deletion removes the cloud row; subsequent pull returns null', async () => {
    const client = newClient();
    await client.pushEnvelope(makeEnvelope('{"to":"delete"}'));

    // Sanity: the row exists.
    const before = await client.pullEnvelope();
    expect(before.ok && before.value?.payload).toBe('{"to":"delete"}');

    const del = await client.requestAccountDeletion();
    expect(del.ok).toBe(true);
    expect(client.getAuthState().kind).toBe('signed-out');

    // Re-sign-in (the same userId) and verify the row is gone.
    client.signInForTest('user@test.example', USER);
    const after = await client.pullEnvelope();
    expect(after.ok).toBe(true);
    if (after.ok) expect(after.value).toBeNull();
  });

  it('deletion is idempotent on a non-existent row', async () => {
    const client = newClient();
    const del = await client.requestAccountDeletion();
    expect(del.ok).toBe(true);
  });
});

describe('HttpCloudSaveClient ↔ Worker — D1 persistence shape', () => {
  it('the envelope JSON is round-tripped via D1 byte-for-byte (no schema mangling)', async () => {
    const client = newClient();
    const inner = JSON.stringify({
      kills: 12345,
      almanac: ['gordon', 'tour_bus', 'taxman'],
      weird: { unicode: 'haggis: \u{1F407}\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}' },
    });
    await client.pushEnvelope(makeEnvelope(inner));

    const pull = await client.pullEnvelope();
    expect(pull.ok).toBe(true);
    if (pull.ok && pull.value) {
      expect(pull.value.payload).toBe(inner);
      // The inner JSON parses back to the same object — schema-blind passthrough holds.
      const parsed = JSON.parse(pull.value.payload) as { kills: number };
      expect(parsed.kills).toBe(12345);
    }
  });
});
