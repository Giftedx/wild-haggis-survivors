/**
 * P3 Cloud Saves — `CloudSaveClient` interface + in-memory test double.
 *
 * The contract every backend connector must satisfy. The eventual
 * Cloudflare Workers + D1 connector (`WorkerCloudSaveClient`, not
 * shipped in this branch) implements this; future Supabase / Firebase
 * connectors would slot in behind the same interface.
 *
 * Pure module — no Phaser, no DOM, no real network. The
 * `MemoryCloudSaveClient` ships now to support unit tests of the
 * sync engine's logic without standing up a server.
 *
 * Charter §Phase 1 + §Phase 2 reference.
 *
 * No method of this interface ever throws on network failure — failures
 * are returned as `{ ok: false, reason }` so the caller can toast and
 * retry without try/catch boilerplate at every call site.
 */

import type { CloudSaveEnvelope } from './cloudSaveEnvelope';

export type CloudSaveAuthState =
  | { kind: 'signed-out' }
  | { kind: 'signing-in' }
  | { kind: 'signed-in'; email: string; userId: string };

export type CloudSaveOpResult<T = void> =
  | { ok: true; value: T }
  | { ok: false; reason: CloudSaveErrorReason; message?: string };

export type CloudSaveErrorReason =
  | 'network'
  | 'unauthorized'
  | 'rate-limited'
  | 'payload-too-large'
  | 'schema-mismatch'
  | 'storage-full'
  | 'server-error'
  | 'unknown';

export interface CloudSaveClient {
  /**
   * Current auth state. Synchronous so UI can render without flicker;
   * the underlying store is updated by sign-in / sign-out flows.
   */
  getAuthState(): CloudSaveAuthState;

  /**
   * Subscribe to auth state changes. Returns an unsubscribe function.
   * Used by the MenuScene cloud-status indicator + Settings → Account.
   */
  onAuthStateChanged(listener: (s: CloudSaveAuthState) => void): () => void;

  /**
   * Begin magic-link sign-in. Resolves once the email has been sent;
   * the actual session is established after the player follows the
   * link in the email and lands on the verify route. UX layers should
   * show "check your email" after this resolves.
   */
  requestMagicLink(email: string): Promise<CloudSaveOpResult>;

  /** Tear down the local session. Idempotent. */
  signOut(): Promise<CloudSaveOpResult>;

  /**
   * Pull the cloud envelope for the signed-in user. Returns
   * `value: null` if there is no cloud save yet (first-time sign-in).
   * Returns an `ok: false` reason on transport / auth errors.
   */
  pullEnvelope(): Promise<CloudSaveOpResult<CloudSaveEnvelope | null>>;

  /**
   * Push the given envelope to the cloud, replacing whatever is there.
   * Server is schema-blind — no merging, no migration, just store.
   * Conflict resolution happens client-side before this is called.
   */
  pushEnvelope(envelope: CloudSaveEnvelope): Promise<CloudSaveOpResult>;

  /**
   * Initiate account deletion. GDPR Article 17. The recommended
   * implementation is soft-delete (7-day undo window via emailed link)
   * but the contract here just says "asked to delete"; the connector
   * decides the policy.
   */
  requestAccountDeletion(): Promise<CloudSaveOpResult>;
}

/**
 * Test double — in-memory, no network, no IO. Useful for any test
 * exercising the sync engine without a real server.
 *
 * Construct with optional initial state:
 *   new MemoryCloudSaveClient({ authState: { kind: 'signed-in', email: 'a@b.com', userId: 'u1' } })
 *
 * Tests can manipulate the store directly via `setRemoteEnvelope` /
 * `clearRemoteEnvelope` for setup, and read `pushedEnvelopes` to
 * assert sync behaviour.
 */
export class MemoryCloudSaveClient implements CloudSaveClient {
  private authState: CloudSaveAuthState;
  private listeners = new Set<(s: CloudSaveAuthState) => void>();
  private remoteByUserId = new Map<string, CloudSaveEnvelope>();
  /** Append-only log of every successful pushEnvelope call. */
  public pushedEnvelopes: CloudSaveEnvelope[] = [];
  /** Test hook: when set, every op returns this failure. */
  public injectError: { reason: CloudSaveErrorReason; message?: string } | null = null;

  constructor(opts?: { authState?: CloudSaveAuthState }) {
    this.authState = opts?.authState ?? { kind: 'signed-out' };
  }

  getAuthState(): CloudSaveAuthState {
    return this.authState;
  }

  onAuthStateChanged(listener: (s: CloudSaveAuthState) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /** Test-only: simulate the verify-link landing → signed-in. */
  setAuthState(s: CloudSaveAuthState): void {
    this.authState = s;
    for (const l of this.listeners) l(s);
  }

  async requestMagicLink(email: string): Promise<CloudSaveOpResult> {
    if (this.injectError) return { ok: false, ...this.injectError };
    if (typeof email !== 'string' || !email.includes('@')) {
      return { ok: false, reason: 'unknown', message: 'invalid email' };
    }
    this.setAuthState({ kind: 'signing-in' });
    return { ok: true, value: undefined };
  }

  async signOut(): Promise<CloudSaveOpResult> {
    if (this.injectError) return { ok: false, ...this.injectError };
    this.setAuthState({ kind: 'signed-out' });
    return { ok: true, value: undefined };
  }

  async pullEnvelope(): Promise<CloudSaveOpResult<CloudSaveEnvelope | null>> {
    if (this.injectError) return { ok: false, ...this.injectError };
    if (this.authState.kind !== 'signed-in') {
      return { ok: false, reason: 'unauthorized' };
    }
    const env = this.remoteByUserId.get(this.authState.userId) ?? null;
    return { ok: true, value: env };
  }

  async pushEnvelope(envelope: CloudSaveEnvelope): Promise<CloudSaveOpResult> {
    if (this.injectError) return { ok: false, ...this.injectError };
    if (this.authState.kind !== 'signed-in') {
      return { ok: false, reason: 'unauthorized' };
    }
    this.remoteByUserId.set(this.authState.userId, envelope);
    this.pushedEnvelopes.push(envelope);
    return { ok: true, value: undefined };
  }

  async requestAccountDeletion(): Promise<CloudSaveOpResult> {
    if (this.injectError) return { ok: false, ...this.injectError };
    if (this.authState.kind !== 'signed-in') {
      return { ok: false, reason: 'unauthorized' };
    }
    this.remoteByUserId.delete(this.authState.userId);
    this.setAuthState({ kind: 'signed-out' });
    return { ok: true, value: undefined };
  }

  // --- Test-only helpers ---
  setRemoteEnvelope(userId: string, envelope: CloudSaveEnvelope): void {
    this.remoteByUserId.set(userId, envelope);
  }
  clearRemoteEnvelope(userId: string): void {
    this.remoteByUserId.delete(userId);
  }
  getRemoteEnvelope(userId: string): CloudSaveEnvelope | undefined {
    return this.remoteByUserId.get(userId);
  }
}

/**
 * Sentinel client that always reports signed-out and refuses every
 * call. Useful as the production default until the live Worker
 * connector is wired — code paths that observe `getAuthState()` see
 * "signed-out" and skip cloud entirely. The game stays offline-first
 * by construction.
 */
export const NoopCloudSaveClient: CloudSaveClient = {
  getAuthState: () => ({ kind: 'signed-out' }),
  onAuthStateChanged: () => () => { /* no-op */ },
  requestMagicLink: async () => ({ ok: false, reason: 'unknown', message: 'cloud sync not configured' }),
  signOut: async () => ({ ok: true, value: undefined }),
  pullEnvelope: async () => ({ ok: false, reason: 'unauthorized' }),
  pushEnvelope: async () => ({ ok: false, reason: 'unauthorized' }),
  requestAccountDeletion: async () => ({ ok: false, reason: 'unauthorized' }),
};
