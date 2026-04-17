/**
 * Seeded PRNG for deterministic runs (daily challenge, shared seed codes,
 * speedrun verification, bug reproduction).
 *
 * Uses mulberry32 — a 32-bit hash-style PRNG with good distribution and
 * ~2^32 period. Not cryptographic. Fast enough to burn thousands of calls
 * per frame without measurable cost.
 *
 * Usage rule: only gameplay-affecting decisions should go through this
 * (card draws, elite rolls, loot tables, crit, weighted spawns). Pure VFX
 * — particle angles, muzzle-flash jitter, audio detune, ambient wisps —
 * keeps `Math.random()`. The split keeps the API surface small and avoids
 * regressions in visual feel when the same seed produces the same fight.
 *
 * Seed codes: user-facing seeds are encoded as base36 with a fixed length
 * and a checksum character so "copy seed from game-over and paste into
 * friend's client" is robust to typos.
 */
import { formatLocalYmd } from './formatDate';

/**
 * Immutable-seeded number generator. Calling `next()` mutates internal
 * state; no re-seeding after construction — create a fresh RNG instead.
 */
export interface RNG {
  /** The seed this RNG was created with. Stays stable across next() calls. */
  readonly seed: number;
  /** Uniform [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Float in [min, max). */
  float(min: number, max: number): number;
  /** `true` with `probability`, defaults 0.5. */
  bool(probability?: number): boolean;
  /** Random element of an array. Throws on empty (would be undefined). */
  pick<T>(arr: readonly T[]): T;
  /**
   * Weighted random selection. Callback returns non-negative weight per item;
   * total weight must be > 0. Item with highest relative weight is most likely.
   */
  weighted<T>(items: readonly T[], weight: (t: T, i: number) => number): T;
  /** Produce a fresh sub-RNG seeded from this RNG's next draw. Parent is advanced. */
  branch(): RNG;
}

/** mulberry32 — public-domain 32-bit PRNG. */
function makeMulberry32(seedInput: number): () => number {
  // Coerce to unsigned 32-bit and avoid zero (mulberry32 outputs 0 forever at 0).
  let s = (seedInput | 0) || 0x9e3779b9;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create an RNG from a numeric seed, or a seed code string produced by
 * `encodeSeed()` / parsed by `parseSeedInput()`.
 */
export function createRNG(seed: number | string): RNG {
  const numeric = typeof seed === 'number' ? seed : stringHashToSeed(seed);
  return buildRng(numeric);
}

function buildRng(seedNumeric: number): RNG {
  const normalized = normalizeSeed(seedNumeric);
  const raw = makeMulberry32(normalized);
  const rng: RNG = {
    seed: normalized,
    next: raw,
    int(min, max) {
      if (max < min) [min, max] = [max, min];
      return Math.floor(raw() * (max - min + 1)) + min;
    },
    float(min, max) {
      return min + raw() * (max - min);
    },
    bool(probability = 0.5) {
      return raw() < probability;
    },
    pick(arr) {
      if (arr.length === 0) throw new Error('RNG.pick: empty array');
      return arr[Math.floor(raw() * arr.length)];
    },
    weighted(items, weight) {
      if (items.length === 0) throw new Error('RNG.weighted: empty array');
      let total = 0;
      for (let i = 0; i < items.length; i++) total += Math.max(0, weight(items[i], i));
      if (total <= 0) {
        // Graceful fallback: if all weights are zero, uniform-pick so we don't
        // return undefined or throw at a runtime decision point.
        return items[Math.floor(raw() * items.length)];
      }
      let roll = raw() * total;
      for (let i = 0; i < items.length; i++) {
        const w = Math.max(0, weight(items[i], i));
        roll -= w;
        if (roll <= 0) return items[i];
      }
      return items[items.length - 1];
    },
    branch() {
      // Derive a fresh seed from one draw; caller gets an independent stream
      // without entangling with the parent's future calls (parent still advances).
      const childSeed = Math.floor(raw() * 0x100000000);
      return buildRng(childSeed);
    },
  };
  return rng;
}

function normalizeSeed(n: number): number {
  if (!Number.isFinite(n)) return 0x9e3779b9;
  const u = Math.floor(Math.abs(n)) >>> 0;
  return u === 0 ? 0x9e3779b9 : u;
}

/** Hash a string into a 32-bit seed. FNV-1a 32-bit, public-domain. */
function stringHashToSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Fresh random seed in the full 32-bit range, from `crypto` when available. */
export function randomSeed(): number {
  const g = globalThis as unknown as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } };
  if (g.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    g.crypto.getRandomValues(buf);
    return normalizeSeed(buf[0]);
  }
  return normalizeSeed(Math.floor(Math.random() * 0x100000000));
}

// ── Seed codec ────────────────────────────────────────────────────────
//
// Encoded form: 6-character base36 payload + 1-character checksum.
// 32-bit seeds fit in 7 base36 chars (36^7 ≈ 78 billion > 2^32 ≈ 4.3 billion)
// but we limit to 26 bits of payload for a compact 6-char code, which is
// plenty of entropy for challenge-style sharing and keeps codes easy to say
// over voice / copy-paste. The checksum catches 1-char typos.

const SEED_BASE = 36;
const SEED_PAYLOAD_BITS = 26;
const SEED_MASK = (1 << SEED_PAYLOAD_BITS) - 1;

/**
 * Encode a seed to a 7-character case-insensitive share code.
 * `decodeSeed()` on the result returns the same (normalized) numeric seed.
 */
export function encodeSeed(seed: number): string {
  const payload = normalizeSeed(seed) & SEED_MASK;
  const body = payload.toString(SEED_BASE).padStart(6, '0').toUpperCase();
  return `${body}${checksumChar(body)}`;
}

/**
 * Parse a 7-character share code to a numeric seed, or return null if the
 * code is malformed or fails the checksum. Case-insensitive; strips spaces.
 */
export function decodeSeed(code: string): number | null {
  if (typeof code !== 'string') return null;
  const cleaned = code.replace(/\s+/g, '').toUpperCase();
  if (cleaned.length !== 7) return null;
  const body = cleaned.slice(0, 6);
  const expect = checksumChar(body);
  if (cleaned[6] !== expect) return null;
  if (!/^[0-9A-Z]{6}$/.test(body)) return null;
  const numeric = parseInt(body, SEED_BASE);
  if (!Number.isFinite(numeric)) return null;
  return normalizeSeed(numeric);
}

/**
 * Accept either a share code or a raw numeric string and return a numeric
 * seed. Returns null on malformed input. Used by the "enter seed" UI so a
 * power user can paste the checksummed code OR a naked number.
 */
export function parseSeedInput(input: string): number | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.trim();
  if (!cleaned) return null;
  // Try share code first (length + checksum form).
  const decoded = decodeSeed(cleaned);
  if (decoded !== null) return decoded;
  // Fallback: raw integer.
  if (/^-?\d+$/.test(cleaned)) {
    const n = Number(cleaned);
    if (Number.isFinite(n)) return normalizeSeed(n);
  }
  return null;
}

function checksumChar(body: string): string {
  // Simple sum-of-digits % 36; catches single-character typos in the 6-char
  // payload since any digit change shifts the sum by a nonzero amount mod 36.
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    sum += parseInt(body[i], SEED_BASE);
  }
  return (sum % SEED_BASE).toString(SEED_BASE).toUpperCase();
}

// ── Daily challenge seed ──────────────────────────────────────────────

/**
 * YYYY-MM-DD date key in local time. All players in the same local calendar
 * day see the same daily challenge; midnight rollover is per-timezone so no
 * single cohort gets strictly earlier access.
 */
export function currentDailyDateKey(now: Date = new Date()): string {
  return formatLocalYmd(now);
}

/**
 * Deterministic seed for a given calendar day. Same numeric seed for everyone
 * on the same date (local). Uses a scope prefix so "daily" doesn't collide
 * with anyone's custom seed that happens to be the same date string.
 */
export function dailyChallengeSeed(now: Date = new Date()): number {
  return stringHashToSeed(`wild-haggis-daily:${currentDailyDateKey(now)}`);
}
