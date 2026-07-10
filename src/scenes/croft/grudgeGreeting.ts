/**
 * Grudge-coloured Croft greeting — Taxman Grudge Ledger v2
 * (DESIGN_IDEAS §1 follow-up).
 *
 * Every victory banks the run's `GrudgeVerdict` into
 * `save.grudgeVerdictsLifetime` (schema v24, `bumpGrudgeVerdict`).
 * This helper reads that record and picks Gran's header greeting for
 * the Croft: once a finishing style dominates the lifetime ledger,
 * word has got round the glen and Gran greets her haggis accordingly.
 *
 * Rules:
 *   - `even` verdicts never colour the greeting — they are "no
 *     pattern" runs; the ledger records them but Gran has nothing to
 *     remark on.
 *   - Dominance = highest lifetime count among the four styled
 *     verdicts. Ties resolve in `judgeGrudge`'s own precedence order
 *     (precise > reckless > coward > bruiser) so the hub reading and
 *     the in-run judgement can never disagree about which trait is
 *     "more singular".
 *   - No banked styled verdict → the classic kettle greeting.
 *
 * Pure + Phaser-free, sister to `CroftTrophies.ts`: reads a narrowed
 * save view, returns an i18n key, safe to import from tests.
 */
import type { SaveData } from '../../utils/save/types';

export type GrudgeGreetingView = Pick<SaveData, 'grudgeVerdictsLifetime'>;

/** Styled verdicts in `judgeGrudge` precedence order — the tie-break.
 *  `even` is deliberately absent (see module docstring). */
const GRUDGE_GREETING_PRECEDENCE = [
  'precise',
  'reckless',
  'coward',
  'bruiser',
] as const;

export type GrudgeGreetingVerdict = (typeof GRUDGE_GREETING_PRECEDENCE)[number];

/** Default greeting key — Gran's original kettle welcome. */
export const CROFT_GREET_DEFAULT_KEY = 'ui.croft.gran_greet';

/**
 * Pick the i18n key for Gran's Croft header greeting. Returns the
 * default kettle greeting until a styled verdict is banked; after
 * that, the dominant lifetime verdict's line.
 */
export function pickGranGreetingKey(view: GrudgeGreetingView): string {
  const counts = view.grudgeVerdictsLifetime;
  if (!counts) return CROFT_GREET_DEFAULT_KEY;

  let dominant: GrudgeGreetingVerdict | null = null;
  let dominantCount = 0;
  for (const verdict of GRUDGE_GREETING_PRECEDENCE) {
    const n = counts[verdict] ?? 0;
    // Strict > keeps the earlier (higher-precedence) verdict on ties.
    if (n > dominantCount) {
      dominant = verdict;
      dominantCount = n;
    }
  }

  return dominant
    ? `ui.croft.gran_greet_grudge.${dominant}`
    : CROFT_GREET_DEFAULT_KEY;
}
