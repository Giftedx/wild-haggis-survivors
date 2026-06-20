/**
 * P3 Cloud Saves — conflict-resolution helper.
 *
 * Pure module — no Phaser, no DOM, no network. Vitest-covered.
 *
 * Implements the Last-Writer-Wins-with-conflict-prompt logic described
 * in `docs/archive/superpowers/specs/2026-04-26-cloud-save-conflict-ux-design.md`.
 *
 * Four verdicts:
 *  - `in-sync`               → no action
 *  - `local-newer`           → push local → cloud (silent)
 *  - `remote-newer`          → pull cloud → local (silent)
 *  - `conflict-ambiguous`    → show conflict dialog
 *
 * Plus three refusal verdicts for schema-version-mismatch safety:
 *  - `refuse-cloud-newer-schema`  → refuse to overwrite local with newer-schema cloud
 *  - `refuse-cloud-older-schema`  → refuse to push older-schema local to cloud
 *
 * The implementation is deliberately small. It exists as a pure module
 * so the UX dialog (`CloudSaveConflictScene`, future Phaser code) and
 * the network layer (`CloudSaveClient`, future Worker connector) can
 * both consume it without circular imports.
 */

import type { CloudSaveEnvelope } from './cloudSaveEnvelope';

/**
 * Default tolerance window (60s) before we surface the conflict dialog.
 * Two saves modified within this window get the prompt; outside the
 * window, the newer one silently wins. See spec Case D.
 */
export const DEFAULT_TOLERANT_WINDOW_MS = 60_000;

export interface SaveSummary {
  /** ISO 8601 string for human display. */
  lastModifiedISO: string;
  /** Raw ms timestamp — kept for sort + diff. */
  lastModifiedMs: number;
  /** Inner payload schema version (e.g. 17 for current). */
  payloadSchemaVersion: number;
  /** Source device id. */
  deviceId: string;
  /** Inner-payload-derived headline stats — best-effort, never throws. */
  totalKills: number;
  variantsUnlocked: number;
  almanacEntries: number;
}

export type ConflictVerdict =
  | { kind: 'in-sync' }
  | { kind: 'local-newer' }
  | { kind: 'remote-newer' }
  | { kind: 'conflict-ambiguous'; localSummary: SaveSummary; remoteSummary: SaveSummary }
  | { kind: 'refuse-cloud-newer-schema'; localSchema: number; remoteSchema: number }
  | { kind: 'refuse-cloud-older-schema'; localSchema: number; remoteSchema: number };

export interface DetectConflictOpts {
  /** Override the 60s default; tests use small windows for determinism. */
  tolerantWindowMs?: number;
  /** When true, force `conflict-ambiguous`. Wires through to envelope.forceConflictPrompt. */
  forceConflict?: boolean;
}

/**
 * Decide what to do given a local + remote envelope. Pure.
 *
 * Schema-version refusals (charter spec, conflict-UX spec):
 *   - if remote's payload schema is HIGHER than local's, the remote was
 *     written by a newer client. We must NOT overwrite local with data
 *     this build doesn't understand → `refuse-cloud-newer-schema`.
 *     UI shows "update the game to sync" toast.
 *   - if remote's payload schema is LOWER than local's by more than
 *     one major step, the remote is so far behind that pushing local
 *     would clobber a prior known-good cloud state with a forward-only
 *     migration. Refuse to push → `refuse-cloud-older-schema`. The
 *     server will re-issue the push after the player explicitly opts
 *     in via "force overwrite cloud" in Settings (post-MVP).
 *
 * Otherwise, run the LWW comparison with the tolerance window.
 */
export function detectCloudSaveConflict(
  local: CloudSaveEnvelope,
  remote: CloudSaveEnvelope,
  opts?: DetectConflictOpts,
): ConflictVerdict {
  const tolerantWindowMs = opts?.tolerantWindowMs ?? DEFAULT_TOLERANT_WINDOW_MS;

  // Schema-version safety first. Charter calls these out as hard refusals.
  if (remote.payloadSchemaVersion > local.payloadSchemaVersion) {
    return {
      kind: 'refuse-cloud-newer-schema',
      localSchema: local.payloadSchemaVersion,
      remoteSchema: remote.payloadSchemaVersion,
    };
  }
  // Allow a 1-version downgrade overwrite (the common case after a
  // local migration where the cloud is one step behind). Refuse anything
  // larger; humans should opt in via Settings explicitly.
  if (local.payloadSchemaVersion - remote.payloadSchemaVersion >= 2) {
    return {
      kind: 'refuse-cloud-older-schema',
      localSchema: local.payloadSchemaVersion,
      remoteSchema: remote.payloadSchemaVersion,
    };
  }

  // Force-conflict escape hatch (e2e test usage; envelope flag).
  if (opts?.forceConflict || local.forceConflictPrompt || remote.forceConflictPrompt) {
    return {
      kind: 'conflict-ambiguous',
      localSummary: summarizeForConflictDialog(local),
      remoteSummary: summarizeForConflictDialog(remote),
    };
  }

  const dt = local.lastModified - remote.lastModified;

  // Bit-identical timestamps (rare in practice, but possible if the
  // last sync flushed both sides simultaneously). Treat as in-sync.
  if (dt === 0) return { kind: 'in-sync' };

  // Within the tolerance window AND different deviceIds → genuine
  // multi-device near-simultaneous edit; surface dialog.
  if (Math.abs(dt) <= tolerantWindowMs && local.deviceId !== remote.deviceId) {
    return {
      kind: 'conflict-ambiguous',
      localSummary: summarizeForConflictDialog(local),
      remoteSummary: summarizeForConflictDialog(remote),
    };
  }

  // Outside tolerance window OR same device → LWW.
  return dt > 0 ? { kind: 'local-newer' } : { kind: 'remote-newer' };
}

/**
 * Extract a small UI-facing summary from an envelope for the conflict
 * dialog. Best-effort: if the inner payload is unparseable, fields
 * default to 0; never throws.
 *
 * The summary intentionally pulls only headline stats (totalKills,
 * variants unlocked, almanac entries). The dialog uses these to give
 * the player a basis for choosing — exhaustive diffs are out of scope
 * (would risk overwhelming the player and exposing internal save shape
 * to the UI).
 */
export function summarizeForConflictDialog(envelope: CloudSaveEnvelope): SaveSummary {
  const lastModifiedISO = isoFromMs(envelope.lastModified);
  let totalKills = 0;
  let variantsUnlocked = 0;
  let almanacEntries = 0;
  try {
    const inner = JSON.parse(envelope.payload) as Record<string, unknown>;
    totalKills = nonNegInt(inner.totalKills);
    variantsUnlocked = arrayLen(inner.unlockedVariants);
    almanacEntries = arrayLen(inner.almanacEntries);
    // The save shape may not have these exact keys today; the conflict
    // dialog is forward-compatible — when the discovery log lands keys,
    // the dialog updates without a breaking change here. Best-effort.
  } catch {
    // Corrupt payload — leave headline counts at 0; dialog still
    // shows the timestamp and deviceId fields the player needs.
  }
  return {
    lastModifiedISO,
    lastModifiedMs: envelope.lastModified,
    payloadSchemaVersion: envelope.payloadSchemaVersion,
    deviceId: envelope.deviceId,
    totalKills,
    variantsUnlocked,
    almanacEntries,
  };
}

function isoFromMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '';
  try {
    return new Date(ms).toISOString();
  } catch {
    return '';
  }
}

function nonNegInt(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return 0;
  return Math.floor(v);
}

function arrayLen(v: unknown): number {
  if (Array.isArray(v)) return v.length;
  // Discovery log can also be an object map keyed by entry id.
  if (v && typeof v === 'object') return Object.keys(v as Record<string, unknown>).length;
  return 0;
}
