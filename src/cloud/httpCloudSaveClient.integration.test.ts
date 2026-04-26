import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type IncomingMessage } from 'node:http';
import { HttpCloudSaveClient } from './httpCloudSaveClient';
import { buildCloudSaveEnvelope } from './cloudSaveEnvelope';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

describe('HttpCloudSaveClient (local http integration)', () => {
  const store = new Map<string, string>();
  let server: ReturnType<typeof createServer>;
  let port = 0;

  beforeAll(async () => {
    server = createServer(async (req, res) => {
      const auth = req.headers.authorization ?? '';
      const m = /^Bearer (.+)$/.exec(auth);
      const userId = m?.[1] ?? '';
      const url = req.url ?? '';

      if (req.method === 'GET' && url === '/v1/envelope') {
        if (!userId) {
          res.writeHead(401); res.end(); return;
        }
        const raw = store.get(userId);
        if (!raw) {
          res.writeHead(404); res.end(); return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(raw);
        return;
      }

      if (req.method === 'PUT' && url === '/v1/envelope') {
        if (!userId) {
          res.writeHead(401); res.end(); return;
        }
        const body = await readBody(req);
        store.set(userId, body);
        res.writeHead(204); res.end();
        return;
      }

      if (req.method === 'DELETE' && url === '/v1/account') {
        if (!userId) {
          res.writeHead(401); res.end(); return;
        }
        store.delete(userId);
        res.writeHead(204); res.end();
        return;
      }

      res.writeHead(404); res.end();
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address();
    if (addr && typeof addr === 'object') port = addr.port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('round-trips envelope over HTTP', async () => {
    const base = `http://127.0.0.1:${port}`;
    const client = new HttpCloudSaveClient(base);
    client.signInForTest('t@t.com', 'user-spike-1');

    const empty = await client.pullEnvelope();
    expect(empty.ok && empty.value).toBeNull();

    const env = buildCloudSaveEnvelope('{"x":1}', {
      payloadSchemaVersion: 17,
      deviceId: 'dev-test',
      now: 1_700_000_000_000,
    });
    const push = await client.pushEnvelope(env);
    expect(push.ok).toBe(true);

    const pull = await client.pullEnvelope();
    expect(pull.ok && pull.value?.payload).toBe('{"x":1}');

    const del = await client.requestAccountDeletion();
    expect(del.ok).toBe(true);
    expect(client.getAuthState().kind).toBe('signed-out');
    const again = await client.pullEnvelope();
    expect(again.ok).toBe(false);
  });
});
