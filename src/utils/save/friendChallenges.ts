/**
 * Friend Challenges — local persistence for received shared-run challenge URLs.
 *
 * A challenge record is written when a player visits a `?run=...&t=...&o=...`
 * URL (the BootScene path). Attempts are appended at run-end when the run was
 * launched from such a URL. The surface in MainMenuScene shows pending and
 * beaten challenges.
 *
 * Dedup key: `makeChallengeId(seed, variantKey, curseKey, targetTimeSec)`.
 * Receiving the same URL twice does not double-write.
 */

/** Outcome of a single attempt at a friend challenge. */
export interface FriendChallengeAttempt {
  timeSurvivedSec: number;
  outcome: 'victory' | 'death';
  ts: number;
}

/** Persisted record of a received friend challenge. */
export interface FriendChallengeRecord {
  /** Stable dedup ID derived from the URL's identifying fields. */
  id: string;
  seed: number;
  variantKey: string;
  curseKey: string | null;
  /** Sharer's time survived — "beat" / "outlast" target. */
  targetTimeSec: number;
  targetOutcome: 'victory' | 'death';
  receivedAt: number;
  attempts: FriendChallengeAttempt[];
}

const MAX_CHALLENGES = 20;
const MAX_ATTEMPTS_PER_CHALLENGE = 10;

export function makeChallengeId(
  seed: number,
  variantKey: string,
  curseKey: string | null,
  targetTimeSec: number,
): string {
  return `${seed.toString(16)}-${variantKey}-${curseKey ?? 'clean'}-${targetTimeSec}`;
}

/** A challenge is beaten when any attempt survived at least as long as the target. */
export function isChallengeBeaten(record: FriendChallengeRecord): boolean {
  return record.attempts.some((a) => a.timeSurvivedSec >= record.targetTimeSec);
}

/** Add a new challenge record, deduplicating by ID. Returns the updated array. */
export function addChallenge(
  challenges: FriendChallengeRecord[],
  record: FriendChallengeRecord,
): FriendChallengeRecord[] {
  if (challenges.some((c) => c.id === record.id)) return challenges;
  const next = [...challenges, record];
  return next.length > MAX_CHALLENGES ? next.slice(-MAX_CHALLENGES) : next;
}

/** Append an attempt to the matching record. Returns the updated array. */
export function appendAttempt(
  challenges: FriendChallengeRecord[],
  id: string,
  attempt: FriendChallengeAttempt,
): FriendChallengeRecord[] {
  return challenges.map((c) => {
    if (c.id !== id) return c;
    const attempts = [...c.attempts, attempt];
    return { ...c, attempts: attempts.length > MAX_ATTEMPTS_PER_CHALLENGE ? attempts.slice(-MAX_ATTEMPTS_PER_CHALLENGE) : attempts };
  });
}

function coerceFriendChallengeAttempts(v: unknown): FriendChallengeAttempt[] {
  if (!Array.isArray(v)) return [];
  const out: FriendChallengeAttempt[] = [];
  for (const raw of v) {
    if (typeof raw !== 'object' || raw === null) continue;
    const o = raw as Record<string, unknown>;
    const timeSurvivedSec = typeof o.timeSurvivedSec === 'number' && Number.isFinite(o.timeSurvivedSec) && o.timeSurvivedSec >= 0
      ? Math.floor(o.timeSurvivedSec) : null;
    const outcome = o.outcome === 'victory' || o.outcome === 'death' ? o.outcome : null;
    const ts = typeof o.ts === 'number' && o.ts > 0 ? Math.floor(o.ts) : null;
    if (timeSurvivedSec === null || !outcome || ts === null) continue;
    out.push({ timeSurvivedSec, outcome, ts });
  }
  return out;
}

export function coerceFriendChallenges(v: unknown): FriendChallengeRecord[] {
  if (!Array.isArray(v)) return [];
  const out: FriendChallengeRecord[] = [];
  for (const raw of v) {
    if (typeof raw !== 'object' || raw === null) continue;
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === 'string' && o.id ? o.id : null;
    const seed = typeof o.seed === 'number' && Number.isFinite(o.seed) ? Math.floor(o.seed) : null;
    const variantKey = typeof o.variantKey === 'string' && o.variantKey ? o.variantKey : null;
    const curseKey = typeof o.curseKey === 'string' && o.curseKey ? o.curseKey : null;
    const targetTimeSec = typeof o.targetTimeSec === 'number' && o.targetTimeSec >= 0
      ? Math.floor(o.targetTimeSec) : null;
    const targetOutcome = o.targetOutcome === 'victory' || o.targetOutcome === 'death' ? o.targetOutcome : null;
    const receivedAt = typeof o.receivedAt === 'number' && o.receivedAt > 0 ? Math.floor(o.receivedAt) : null;
    if (!id || seed === null || !variantKey || targetTimeSec === null || !targetOutcome || receivedAt === null) continue;
    const attempts = coerceFriendChallengeAttempts(o.attempts);
    out.push({ id, seed, variantKey, curseKey, targetTimeSec, targetOutcome, receivedAt, attempts });
  }
  return out;
}
