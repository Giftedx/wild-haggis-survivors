/**
 * P3 spike — HTTP `CloudSaveClient` for local integration tests and future Worker wiring.
 * Contract: GET/PUT JSON envelope at `{baseUrl}/v1/envelope` with `Authorization: Bearer {userId}`.
 */
import type { CloudSaveEnvelope } from './cloudSaveEnvelope';
import { parseCloudSaveEnvelope, serializeCloudSaveEnvelope } from './cloudSaveEnvelope';
import type {
  CloudSaveAuthState,
  CloudSaveClient,
  CloudSaveOpResult,
} from './cloudSaveClient';

export class HttpCloudSaveClient implements CloudSaveClient {
  private authState: CloudSaveAuthState = { kind: 'signed-out' };
  private readonly listeners = new Set<(s: CloudSaveAuthState) => void>();
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(baseUrl: string, fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = fetchImpl;
  }

  getAuthState(): CloudSaveAuthState {
    return this.authState;
  }

  onAuthStateChanged(listener: (s: CloudSaveAuthState) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private setAuth(s: CloudSaveAuthState): void {
    this.authState = s;
    for (const l of this.listeners) l(s);
  }

  /**
   * Vitest-only escape hatch (integration tests). Throws in production browser builds.
   */
  signInForTest(email: string, userId: string): void {
    const vitest = typeof process !== 'undefined' && process.env.VITEST === 'true';
    if (!vitest && import.meta.env.PROD) {
      throw new Error('HttpCloudSaveClient.signInForTest is not available in production');
    }
    this.setAuth({ kind: 'signed-in', email, userId });
  }

  async requestMagicLink(email: string): Promise<CloudSaveOpResult> {
    if (typeof email !== 'string' || !email.includes('@')) {
      return { ok: false, reason: 'unknown', message: 'invalid email' };
    }
    this.setAuth({ kind: 'signing-in' });
    return { ok: true, value: undefined };
  }

  async signOut(): Promise<CloudSaveOpResult> {
    this.setAuth({ kind: 'signed-out' });
    return { ok: true, value: undefined };
  }

  async pullEnvelope(): Promise<CloudSaveOpResult<CloudSaveEnvelope | null>> {
    if (this.authState.kind !== 'signed-in') {
      return { ok: false, reason: 'unauthorized' };
    }
    const url = `${this.baseUrl}/v1/envelope`;
    try {
      const res = await this.fetchImpl(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.authState.userId}` },
      });
      if (res.status === 404) return { ok: true, value: null };
      if (!res.ok) return { ok: false, reason: res.status === 401 ? 'unauthorized' : 'server-error' };
      const json: unknown = await res.json();
      return { ok: true, value: parseCloudSaveEnvelope(json) };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }

  async pushEnvelope(envelope: CloudSaveEnvelope): Promise<CloudSaveOpResult> {
    if (this.authState.kind !== 'signed-in') {
      return { ok: false, reason: 'unauthorized' };
    }
    const url = `${this.baseUrl}/v1/envelope`;
    try {
      const res = await this.fetchImpl(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.authState.userId}`,
          'Content-Type': 'application/json',
        },
        body: serializeCloudSaveEnvelope(envelope),
      });
      if (!res.ok) {
        if (res.status === 413) return { ok: false, reason: 'payload-too-large' };
        return { ok: false, reason: 'server-error' };
      }
      return { ok: true, value: undefined };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }

  async requestAccountDeletion(): Promise<CloudSaveOpResult> {
    if (this.authState.kind !== 'signed-in') {
      return { ok: false, reason: 'unauthorized' };
    }
    const url = `${this.baseUrl}/v1/account`;
    try {
      const res = await this.fetchImpl(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.authState.userId}` },
      });
      if (!res.ok) return { ok: false, reason: 'server-error' };
      this.setAuth({ kind: 'signed-out' });
      return { ok: true, value: undefined };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }
}
