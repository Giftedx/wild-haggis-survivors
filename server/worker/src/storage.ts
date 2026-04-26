/**
 * Cloud-save Worker — storage adapter contract.
 *
 * Two implementations:
 *   - `InMemoryStorage` — used by contract tests; no external deps.
 *   - `D1Storage` (sketch only) — production binding shape; the
 *     Worker reads `env.DB` (D1 binding) and runs a one-row table.
 *     Not exercised by tests; the spike does not prove D1 perf.
 *
 * Adapter contract:
 *   - `get(userId)` → null if no row, else the stored envelope+meta
 *   - `put(userId, envelope, opts)` → the result of the write,
 *     with `conflict: true` if the write was rejected because the
 *     caller's `lastModified` was older than what the server holds.
 *   - `delete(userId)` → idempotent; resolves true if a row existed
 *
 * The conflict semantics live in the adapter contract, not in the
 * Worker handler — that lets us test conflict behaviour directly
 * against the in-memory adapter without standing up an HTTP server
 * or a fake D1.
 */
import type { CloudSaveEnvelope, StoredEnvelope } from './types';

export interface PutResult {
  /**
   * `false` only when the server already held a strictly newer envelope
   * (by `lastModified`) than the caller's. The Worker maps this to a
   * `409 Conflict` HTTP response so the client can run conflict
   * resolution. Same-timestamp writes are accepted (last write wins,
   * tie goes to the new write); see contract test
   * `accepts_equal_lastModified_no_conflict`.
   */
  ok: boolean;
  /** Populated when `ok` is false: the envelope the server still holds. */
  current?: StoredEnvelope;
}

export interface Storage {
  get(userId: string): Promise<StoredEnvelope | null>;
  put(userId: string, envelope: CloudSaveEnvelope): Promise<PutResult>;
  delete(userId: string): Promise<boolean>;
}

/**
 * In-memory adapter. Used by contract tests. Backed by a `Map`, no IO.
 *
 * Conflict policy: rejects PUTs whose `envelope.lastModified` is
 * strictly older than the stored row's `envelope.lastModified`.
 * Same-timestamp writes are accepted (last write wins).
 */
export class InMemoryStorage implements Storage {
  private readonly rows = new Map<string, StoredEnvelope>();
  private readonly nowFn: () => number;

  constructor(nowFn: () => number = Date.now) {
    this.nowFn = nowFn;
  }

  async get(userId: string): Promise<StoredEnvelope | null> {
    return this.rows.get(userId) ?? null;
  }

  async put(userId: string, envelope: CloudSaveEnvelope): Promise<PutResult> {
    const existing = this.rows.get(userId);
    if (existing && envelope.lastModified < existing.envelope.lastModified) {
      return { ok: false, current: existing };
    }
    const stored: StoredEnvelope = {
      envelope,
      serverUpdatedAt: this.nowFn(),
    };
    this.rows.set(userId, stored);
    return { ok: true };
  }

  async delete(userId: string): Promise<boolean> {
    return this.rows.delete(userId);
  }

  // -- Test helpers --
  size(): number {
    return this.rows.size;
  }

  clear(): void {
    this.rows.clear();
  }
}

/**
 * D1 adapter — sketch only. Not used by tests; not imported by the
 * default test bootstrap.
 *
 * Schema (proposed; see ADR 0006):
 *
 *   CREATE TABLE saves (
 *     user_id TEXT PRIMARY KEY,
 *     payload TEXT NOT NULL,           -- the envelope, JSON-stringified
 *     last_modified INTEGER NOT NULL,  -- envelope.lastModified
 *     server_updated_at INTEGER NOT NULL
 *   );
 *
 * The conflict check uses a conditional UPDATE so we don't need a
 * SELECT-then-UPDATE round trip. If `changes()` returns 0 the row was
 * not updated (either missing or stale write); the Worker then SELECTs
 * to decide between insert and conflict.
 */
export interface D1LikeBinding {
  prepare(sql: string): {
    bind(...vals: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<{ meta?: { changes?: number } }>;
    };
  };
}

export class D1Storage implements Storage {
  constructor(private readonly db: D1LikeBinding) {}

  async get(userId: string): Promise<StoredEnvelope | null> {
    const row = await this.db
      .prepare('SELECT payload, server_updated_at FROM saves WHERE user_id = ?')
      .bind(userId)
      .first<{ payload: string; server_updated_at: number }>();
    if (!row) return null;
    const envelope = JSON.parse(row.payload) as CloudSaveEnvelope;
    return { envelope, serverUpdatedAt: row.server_updated_at };
  }

  async put(userId: string, envelope: CloudSaveEnvelope): Promise<PutResult> {
    const existing = await this.get(userId);
    if (existing && envelope.lastModified < existing.envelope.lastModified) {
      return { ok: false, current: existing };
    }
    const serverUpdatedAt = Date.now();
    await this.db
      .prepare(
        `INSERT INTO saves (user_id, payload, last_modified, server_updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           payload = excluded.payload,
           last_modified = excluded.last_modified,
           server_updated_at = excluded.server_updated_at`,
      )
      .bind(userId, JSON.stringify(envelope), envelope.lastModified, serverUpdatedAt)
      .run();
    return { ok: true };
  }

  async delete(userId: string): Promise<boolean> {
    const res = await this.db
      .prepare('DELETE FROM saves WHERE user_id = ?')
      .bind(userId)
      .run();
    return (res.meta?.changes ?? 0) > 0;
  }
}
