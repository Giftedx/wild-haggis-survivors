/**
 * Shared-run URL codec — turns a run's identifying setup (seed + variant +
 * optional curse) into a shareable URL and parses it back on the recipient
 * side.
 *
 * Format (V2):
 *   `?run=<seed code>&v=<variant key>[&c=<curse key>][&t=<sec>&o=<v|d>]`
 *
 *   - `run` reuses the existing checksum-protected seed code from
 *     `src/utils/rng.ts` so the URL token is the same string a player
 *     already sees on Game Over (and can type by hand if they want).
 *   - `v` carries the variant key (e.g. `classic`, `moor_runner`).
 *   - `c` is omitted entirely for a clean run; an unknown curse on the
 *     recipient's build is treated as "clean" rather than refusing the
 *     whole URL — preserves forward-compatibility if a sender's build
 *     carries a curse the recipient's build no longer ships.
 *   - `t` + `o` (V2) carry the sharer's outcome: time survived in
 *     whole seconds + a single-char outcome flag (`v` victory, `d`
 *     death). They are **paired** — either both decode to a populated
 *     `challenge` field, or neither does. Recipient sees a "time to
 *     beat" banner. Forward-compat: tampering / partial params /
 *     unknown outcomes degrade the challenge to `null` while leaving
 *     the setup half (the part that drives the actual run) intact.
 *
 * Builds on the deterministic T1 replay foundation (ADR-0002): given the
 * same {seed, variantKey, curseKey} on the same engine version, the spawn
 * cadence, card pool, and starting RNG stream are identical to the
 * sender's run. The recipient still plays their own inputs — this is a
 * setup-share, not a frame-by-frame replay.
 */

import { encodeSeed, decodeSeed } from './rng';
import {
  isVariantKey,
  type VariantKey,
} from '../data/variants';
import { getCurseByKey, type CurseKey } from '../data/curses';

/** V2 — outcome metadata describing the sharer's run end-state. */
export interface SharedRunChallenge {
  /** Victory or death, mapped to the URL's single-char `o` flag. */
  outcome: 'victory' | 'death';
  /** Seconds survived — already a whole-number on the URL. */
  timeSurvivedSec: number;
}

/** Setup payload encoded into / decoded from a shared-run URL. */
export interface SharedRunSetup {
  /** Numeric seed decoded from the checksum-protected seed code. */
  seed: number;
  variantKey: VariantKey;
  curseKey: CurseKey | null;
  /**
   * V2 — present when the URL carried the sharer's outcome metadata.
   * Null when omitted or when the URL was tampered (the setup half
   * still resolves so the recipient can play the run; the challenge
   * banner just falls back to the V1 "Shared run · ..." form). Optional
   * on the build side so V1 call sites don't have to spell `challenge:
   * null` explicitly; parse always sets it (either populated or null).
   */
  challenge?: SharedRunChallenge | null;
}

/** Optional shape consumed by `buildSharedRunUrl`. */
export interface BuildSharedRunUrlOptions {
  challenge?: SharedRunChallenge | null;
}

/** Query-param names we manage. Kept short so the URL stays scannable. */
export const SHARED_RUN_PARAM = 'run';
export const SHARED_RUN_VARIANT_PARAM = 'v';
export const SHARED_RUN_CURSE_PARAM = 'c';
export const SHARED_RUN_TIME_PARAM = 't';
export const SHARED_RUN_OUTCOME_PARAM = 'o';

const MANAGED_PARAMS = [
  SHARED_RUN_PARAM,
  SHARED_RUN_VARIANT_PARAM,
  SHARED_RUN_CURSE_PARAM,
  SHARED_RUN_TIME_PARAM,
  SHARED_RUN_OUTCOME_PARAM,
];

/**
 * Defensive upper bound on the `t` param. A real run never lasts
 * longer than the Bell + a generous overtime; 24h is a tampering
 * canary, not a balance number. Out-of-range times are dropped at
 * parse time so a recipient can't be tricked into a "beat
 * 9999999:59" banner.
 */
const MAX_REASONABLE_TIME_SEC = 24 * 60 * 60;

/** Map the sharer's outcome to the single-char URL flag. */
function outcomeToFlag(outcome: SharedRunChallenge['outcome']): 'v' | 'd' {
  return outcome === 'victory' ? 'v' : 'd';
}

/** Inverse — single-char flag to outcome enum, or null for anything else. */
function flagToOutcome(flag: string | null): SharedRunChallenge['outcome'] | null {
  if (flag === 'v') return 'victory';
  if (flag === 'd') return 'death';
  return null;
}

/** True iff `s` is a finite, non-negative number under the canary cap. */
function isReasonableTimeSec(s: number): boolean {
  return Number.isFinite(s) && s >= 0 && s <= MAX_REASONABLE_TIME_SEC;
}

/**
 * Build a shareable URL for the given setup, layered onto `baseUrl`.
 *
 * Any pre-existing `run` / `v` / `c` / `t` / `o` params on the base URL
 * are scrubbed before re-stamping so duplicate keys can't appear.
 * Unrelated params (utm tags, devDps, etc.) are preserved — a sharer's
 * analytics or dev-tools URL shape stays intact.
 *
 * If `options.challenge` is supplied and represents a reasonable
 * outcome (finite non-negative time, supported outcome flag), `t` + `o`
 * are stamped. Malformed challenges are silently dropped — the setup
 * URL is still useful even if the outcome metadata couldn't be encoded.
 */
export function buildSharedRunUrl(
  setup: SharedRunSetup,
  baseUrl: string,
  options: BuildSharedRunUrlOptions = {},
): string {
  const url = new URL(baseUrl);
  for (const key of MANAGED_PARAMS) url.searchParams.delete(key);
  url.searchParams.set(SHARED_RUN_PARAM, encodeSeed(setup.seed));
  url.searchParams.set(SHARED_RUN_VARIANT_PARAM, setup.variantKey);
  if (setup.curseKey) url.searchParams.set(SHARED_RUN_CURSE_PARAM, setup.curseKey);

  const challenge = options.challenge;
  if (challenge) {
    const flooredSec = Math.floor(challenge.timeSurvivedSec);
    if (isReasonableTimeSec(flooredSec)) {
      url.searchParams.set(SHARED_RUN_TIME_PARAM, String(flooredSec));
      url.searchParams.set(SHARED_RUN_OUTCOME_PARAM, outcomeToFlag(challenge.outcome));
    }
  }
  return url.toString();
}

/**
 * Parse a shared-run URL / query string / URLSearchParams back to a
 * setup, or return `null` if the run param is missing or any required
 * field fails validation.
 *
 * Challenge metadata (`t` + `o`) is parsed permissively: either both
 * resolve cleanly into a populated `challenge` field, or `challenge`
 * is `null`. Tampering / partial params / out-of-range times never
 * fail the whole parse — the setup half (the part the run actually
 * needs) always wins.
 */
export function parseSharedRunUrl(
  input: string | URLSearchParams,
): SharedRunSetup | null {
  const params = coerceParams(input);
  if (!params) return null;

  const runCode = params.get(SHARED_RUN_PARAM);
  if (!runCode) return null;
  const seed = decodeSeed(runCode);
  if (seed === null) return null;

  const variantKey = params.get(SHARED_RUN_VARIANT_PARAM);
  if (!variantKey || !isVariantKey(variantKey)) return null;

  // Unknown curse → permissive degrade to clean run. See module docstring
  // for the forward-compatibility rationale.
  const rawCurse = params.get(SHARED_RUN_CURSE_PARAM);
  const curse = getCurseByKey(rawCurse);

  return {
    seed,
    variantKey,
    curseKey: curse ? (curse.key as CurseKey) : null,
    challenge: parseChallengeFromParams(params),
  };
}

/**
 * Read the V2 challenge metadata off `params`. Returns `null` for any
 * of: missing pair, non-numeric / out-of-range time, unknown outcome
 * flag. Never throws — the setup half of the parse must always succeed.
 */
function parseChallengeFromParams(params: URLSearchParams): SharedRunChallenge | null {
  const rawTime = params.get(SHARED_RUN_TIME_PARAM);
  const rawOutcome = params.get(SHARED_RUN_OUTCOME_PARAM);
  if (rawTime == null || rawOutcome == null) return null;

  const time = Number(rawTime);
  if (!Number.isFinite(time)) return null;
  if (!isReasonableTimeSec(time)) return null;

  const outcome = flagToOutcome(rawOutcome);
  if (!outcome) return null;

  return { outcome, timeSurvivedSec: Math.floor(time) };
}

function coerceParams(
  input: string | URLSearchParams | null | undefined,
): URLSearchParams | null {
  if (input == null) return null;
  if (input instanceof URLSearchParams) return input;
  if (typeof input !== 'string' || input.length === 0) return null;
  try {
    // Try as a full URL first.
    return new URL(input).searchParams;
  } catch {
    // Fall through — treat as a bare query string.
  }
  // Strip any leading "?" so `URLSearchParams("?foo=1")` and `URLSearchParams("foo=1")` behave alike.
  const cleaned = input.startsWith('?') ? input.slice(1) : input;
  return new URLSearchParams(cleaned);
}
