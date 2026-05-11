/**
 * Shared-run URL codec — turns a run's identifying setup (seed + variant +
 * optional curse) into a shareable URL and parses it back on the recipient
 * side.
 *
 * Format: `?run=<7-char seed code>&v=<variant key>[&c=<curse key>]`
 *
 *   - `run` reuses the existing checksum-protected seed code from
 *     `src/utils/rng.ts` so the URL token is the same string a player
 *     already sees on Game Over (and can type by hand if they want).
 *   - `v` carries the variant key (e.g. `classic`, `moor_runner`).
 *   - `c` is omitted entirely for a clean run; an unknown curse on the
 *     recipient's build is treated as "clean" rather than refusing the
 *     whole URL — preserves forward-compatibility if a sender's build
 *     carries a curse the recipient's build no longer ships.
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

/** Setup payload encoded into / decoded from a shared-run URL. */
export interface SharedRunSetup {
  /** Numeric seed, already masked to the 26-bit codec payload. */
  seed: number;
  variantKey: VariantKey;
  curseKey: CurseKey | null;
}

/** Query-param names we manage. Kept short so the URL stays scannable. */
export const SHARED_RUN_PARAM = 'run';
export const SHARED_RUN_VARIANT_PARAM = 'v';
export const SHARED_RUN_CURSE_PARAM = 'c';

const MANAGED_PARAMS = [
  SHARED_RUN_PARAM,
  SHARED_RUN_VARIANT_PARAM,
  SHARED_RUN_CURSE_PARAM,
];

/**
 * Build a shareable URL for the given setup, layered onto `baseUrl`.
 *
 * Any pre-existing `run` / `v` / `c` params on the base URL are scrubbed
 * before re-stamping so duplicate keys can't appear. Unrelated params
 * (utm tags, devDps, etc.) are preserved — a sharer's analytics or
 * dev-tools URL shape stays intact.
 */
export function buildSharedRunUrl(
  setup: SharedRunSetup,
  baseUrl: string,
): string {
  const url = new URL(baseUrl);
  for (const key of MANAGED_PARAMS) url.searchParams.delete(key);
  url.searchParams.set(SHARED_RUN_PARAM, encodeSeed(setup.seed));
  url.searchParams.set(SHARED_RUN_VARIANT_PARAM, setup.variantKey);
  if (setup.curseKey) url.searchParams.set(SHARED_RUN_CURSE_PARAM, setup.curseKey);
  return url.toString();
}

/**
 * Parse a shared-run URL / query string / URLSearchParams back to a
 * setup, or return `null` if the run param is missing or any required
 * field fails validation.
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
  };
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
