/**
 * Authored tartan presets — curated plaid palettes that replace the
 * procedural derivation when a run meets a rare victory condition
 * (Ironmoor one-life, post-Bell survivor, cursed triumph). Everything
 * else keeps the procedural variant-+-weapon derivation in `tartan.ts`
 * so each variant still gets a distinct fingerprint on ordinary runs.
 *
 * Matching is pure: each preset has a `matches(sig)` predicate + a
 * priority. When multiple predicates fire, the highest priority wins —
 * so an Ironmoor run that also survived past the Bell still gets the
 * Ironmoor Crown (the rarer prerequisite).
 *
 * DESIGN_IDEAS section 6: "Authored patterns + deed-gated unlocks".
 * The deed-gating falls out of the signature: every condition below
 * maps 1:1 to an existing achievement pool (Ironmoor victory, post-Bell
 * survival, cursed-run completion) so unlocking a preset is exactly
 * finishing that kind of run.
 */
import type { TartanProfile, TartanSignature } from './tartan';

export interface AuthoredTartan {
  /** Stable identifier — used in tests + future gallery UI. */
  readonly id: string;
  /** The palette the postcard renderer composites. */
  readonly profile: TartanProfile;
  /** Pure predicate — signature carries every field we inspect. */
  readonly matches: (sig: TartanSignature) => boolean;
  /** Higher = preferred when multiple match. Gaps of 20 leave room. */
  readonly priority: number;
}

/**
 * Ironmoor Crown — one-life victory. Silver-white warp over dark slate,
 * gold accent thread for the triumph. Rarest authored tartan; trumps
 * everything else because surviving Ironmoor is the hardest gate.
 */
const IRONMOOR_CROWN: AuthoredTartan = {
  id: 'ironmoor_crown',
  profile: {
    base: '#12141a',
    primary: '#e6e8ee',
    secondary: '#6a7282',
    accent: '#e8c458',
  },
  matches: (sig) => sig.victory === true && sig.ironmoor === true,
  priority: 100,
};

/**
 * Cursed Triumph — won a run with an active curse. Deep violet warp,
 * midnight secondary, black thread — the curse literally woven in.
 */
const CURSED_TRIUMPH: AuthoredTartan = {
  id: 'cursed_triumph',
  profile: {
    base: '#160a1a',
    primary: '#4a2a6a',
    secondary: '#201428',
    accent: '#0a0a10',
  },
  matches: (sig) => sig.victory === true && sig.cursed === true && sig.ironmoor !== true,
  priority: 60,
};

/**
 * Taxman's Reckoning — survived past the Bell (Taxman kill) on a
 * non-Ironmoor, non-cursed victory. Ledger black + blood red + ink
 * white + amber thread; the ledger colours repaid.
 */
const TAXMAN_RECKONING: AuthoredTartan = {
  id: 'taxman_reckoning',
  profile: {
    base: '#0d0d12',
    primary: '#5c1f1f',
    secondary: '#d8d4c8',
    accent: '#f0a020',
  },
  matches: (sig) =>
    sig.victory === true
    && sig.postBell === true
    && sig.ironmoor !== true
    && sig.cursed !== true,
  priority: 40,
};

/**
 * V2 — Cailleach's Mantle. Won the Cailleach Gauntlet (7 cairn touches
 * + Cailleach defeated). Winter-frost palette: pale ice warp, slate
 * blue secondary, deep slate base, bone-bronze accent — the colours
 * of the goddess the haggis bested. Priority 80 sits below Ironmoor
 * Crown (100) but above Cursed Triumph (60) — the gauntlet is harder
 * than a curse, gentler than Ironmoor.
 */
const CAILLEACH_MANTLE: AuthoredTartan = {
  id: 'cailleach_mantle',
  profile: {
    base: '#0a141c',
    primary: '#e8f0f5',
    secondary: '#3c4a5a',
    accent: '#d8c8a0',
  },
  matches: (sig) =>
    sig.victory === true
    && sig.cailleachGauntletWon === true
    && sig.ironmoor !== true,
  priority: 80,
};

/** Ordered registry — exported for tests + future gallery UI. */
export const AUTHORED_TARTANS: readonly AuthoredTartan[] = [
  IRONMOOR_CROWN,
  CAILLEACH_MANTLE,
  CURSED_TRIUMPH,
  TAXMAN_RECKONING,
];

/**
 * Resolve a signature to its best-fitting authored preset, or
 * `undefined` when no preset matches (caller falls back to procedural).
 */
export function pickAuthoredTartan(sig: TartanSignature): AuthoredTartan | undefined {
  let best: AuthoredTartan | undefined;
  for (const t of AUTHORED_TARTANS) {
    if (!t.matches(sig)) continue;
    if (!best || t.priority > best.priority) best = t;
  }
  return best;
}
