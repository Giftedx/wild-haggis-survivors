import { describe, expect, it } from 'vitest';
import { buildCloudSaveEnvelope } from './cloudSaveEnvelope';
import {
  MemoryCloudSaveClient,
  NoopCloudSaveClient,
} from './cloudSaveClient';

const PAYLOAD = JSON.stringify({ saveVersion: 17, totalKills: 0 });

function env(ms: number, device: string) {
  return buildCloudSaveEnvelope(PAYLOAD, {
    payloadSchemaVersion: 17,
    deviceId: device,
    now: ms,
  });
}

describe('NoopCloudSaveClient', () => {
  it('reports signed-out', () => {
    expect(NoopCloudSaveClient.getAuthState().kind).toBe('signed-out');
  });

  it('refuses every operation', async () => {
    expect((await NoopCloudSaveClient.requestMagicLink('a@b.c')).ok).toBe(false);
    expect((await NoopCloudSaveClient.pullEnvelope()).ok).toBe(false);
    expect((await NoopCloudSaveClient.pushEnvelope(env(1, 'd'))).ok).toBe(false);
  });

  it('signOut succeeds idempotently (already signed out)', async () => {
    expect((await NoopCloudSaveClient.signOut()).ok).toBe(true);
  });

  it('subscriptions return a no-op unsubscribe', () => {
    const unsub = NoopCloudSaveClient.onAuthStateChanged(() => {
      // no-op
    });
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
  });
});

describe('MemoryCloudSaveClient — auth', () => {
  it('starts signed-out by default', () => {
    const c = new MemoryCloudSaveClient();
    expect(c.getAuthState().kind).toBe('signed-out');
  });

  it('moves to signing-in on requestMagicLink', async () => {
    const c = new MemoryCloudSaveClient();
    const r = await c.requestMagicLink('a@b.c');
    expect(r.ok).toBe(true);
    expect(c.getAuthState().kind).toBe('signing-in');
  });

  it('rejects malformed emails', async () => {
    const c = new MemoryCloudSaveClient();
    const r = await c.requestMagicLink('not-an-email');
    expect(r.ok).toBe(false);
  });

  it('signOut returns to signed-out', async () => {
    const c = new MemoryCloudSaveClient({
      authState: { kind: 'signed-in', email: 'a@b.c', userId: 'u1' },
    });
    await c.signOut();
    expect(c.getAuthState().kind).toBe('signed-out');
  });

  it('emits state changes to subscribers', () => {
    const c = new MemoryCloudSaveClient();
    const seen: string[] = [];
    c.onAuthStateChanged((s) => seen.push(s.kind));
    c.setAuthState({ kind: 'signing-in' });
    c.setAuthState({ kind: 'signed-in', email: 'x@y.z', userId: 'u2' });
    expect(seen).toEqual(['signing-in', 'signed-in']);
  });

  it('unsubscribe stops further notifications', () => {
    const c = new MemoryCloudSaveClient();
    const seen: string[] = [];
    const unsub = c.onAuthStateChanged((s) => seen.push(s.kind));
    c.setAuthState({ kind: 'signing-in' });
    unsub();
    c.setAuthState({ kind: 'signed-out' });
    expect(seen).toEqual(['signing-in']);
  });
});

describe('MemoryCloudSaveClient — push/pull', () => {
  it('pull returns null when no remote save exists', async () => {
    const c = new MemoryCloudSaveClient({
      authState: { kind: 'signed-in', email: 'a@b.c', userId: 'u1' },
    });
    const r = await c.pullEnvelope();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeNull();
  });

  it('push then pull round-trips', async () => {
    const c = new MemoryCloudSaveClient({
      authState: { kind: 'signed-in', email: 'a@b.c', userId: 'u1' },
    });
    const e = env(1_700_000_000_000, 'device-a');
    const pushR = await c.pushEnvelope(e);
    expect(pushR.ok).toBe(true);
    const pullR = await c.pullEnvelope();
    expect(pullR.ok).toBe(true);
    if (pullR.ok) expect(pullR.value).toEqual(e);
  });

  it('pushedEnvelopes log accumulates calls', async () => {
    const c = new MemoryCloudSaveClient({
      authState: { kind: 'signed-in', email: 'a@b.c', userId: 'u1' },
    });
    await c.pushEnvelope(env(100, 'a'));
    await c.pushEnvelope(env(200, 'a'));
    expect(c.pushedEnvelopes.map((e) => e.lastModified)).toEqual([100, 200]);
  });

  it('refuses push/pull when signed-out', async () => {
    const c = new MemoryCloudSaveClient();
    expect((await c.pullEnvelope()).ok).toBe(false);
    expect((await c.pushEnvelope(env(1, 'a'))).ok).toBe(false);
  });

  it('isolates remotes by userId', async () => {
    const c = new MemoryCloudSaveClient({
      authState: { kind: 'signed-in', email: 'a@b.c', userId: 'u1' },
    });
    await c.pushEnvelope(env(100, 'a'));
    c.setAuthState({ kind: 'signed-in', email: 'x@y.z', userId: 'u2' });
    const r = await c.pullEnvelope();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeNull();
  });
});

describe('MemoryCloudSaveClient — error injection', () => {
  it('returns the injected error from every op', async () => {
    const c = new MemoryCloudSaveClient({
      authState: { kind: 'signed-in', email: 'a@b.c', userId: 'u1' },
    });
    c.injectError = { reason: 'network', message: 'simulated' };
    const r = await c.pullEnvelope();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('network');
      expect(r.message).toBe('simulated');
    }
  });
});

describe('MemoryCloudSaveClient — account deletion', () => {
  it('removes remote save and signs out', async () => {
    const c = new MemoryCloudSaveClient({
      authState: { kind: 'signed-in', email: 'a@b.c', userId: 'u1' },
    });
    await c.pushEnvelope(env(100, 'a'));
    const r = await c.requestAccountDeletion();
    expect(r.ok).toBe(true);
    expect(c.getRemoteEnvelope('u1')).toBeUndefined();
    expect(c.getAuthState().kind).toBe('signed-out');
  });

  it('refuses when not signed-in', async () => {
    const c = new MemoryCloudSaveClient();
    expect((await c.requestAccountDeletion()).ok).toBe(false);
  });
});
