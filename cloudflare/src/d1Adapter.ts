/**
 * task_08 cloud-save Worker — D1 adapter.
 *
 * Thin typed wrapper around `D1Database` for the three operations the
 * Worker performs. Kept narrow on purpose — wider read/scan operations
 * belong in a follow-up (T424 schema migration runner / audit log).
 *
 * The schema is in `schema/0001_initial.sql`. Real production deploys
 * apply it via `wrangler d1 execute`; the integration tests apply it
 * to the miniflare-managed D1 instance per-test (see
 * `test/worker.integration.test.ts`).
 */
import type { D1Database } from '@cloudflare/workers-types';

/** Stored row shape — `payload` is the envelope JSON string. */
export interface StoredRow {
  payload: string;
  updatedAt: number;
}

export class D1Adapter {
  constructor(private readonly db: D1Database) {}

  async getEnvelope(userId: string): Promise<StoredRow | null> {
    const row = await this.db
      .prepare('SELECT payload, updated_at AS updatedAt FROM envelopes WHERE user_id = ?')
      .bind(userId)
      .first<{ payload: string; updatedAt: number }>();
    if (!row) return null;
    return { payload: row.payload, updatedAt: row.updatedAt };
  }

  async putEnvelope(userId: string, json: string, now: number): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO envelopes (user_id, payload, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(user_id) DO UPDATE SET
           payload = excluded.payload,
           updated_at = excluded.updated_at`,
      )
      .bind(userId, json, now)
      .run();
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM envelopes WHERE user_id = ?')
      .bind(userId)
      .run();
    const changes = result.meta?.changes ?? 0;
    return changes > 0;
  }
}
