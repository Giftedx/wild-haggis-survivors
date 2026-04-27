-- task_08 cloud-save Worker — initial D1 schema (v1).
--
-- One row per signed-in user. The Worker is schema-blind for the inner
-- save payload — it stores the envelope JSON as an opaque TEXT column.
-- See `src/cloud/cloudSaveEnvelope.ts` for the envelope shape and
-- ADR `docs/adr/0006-cloud-save-backend.draft.md` for context.
--
-- Apply locally:
--   npx wrangler d1 execute wild-haggis-saves --local --file=schema/0001_initial.sql
--
-- Idempotent — safe to re-run during local dev.

CREATE TABLE IF NOT EXISTS envelopes (
  user_id     TEXT PRIMARY KEY NOT NULL,
  payload     TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_envelopes_updated_at
  ON envelopes (updated_at);
