/**
 * Whisper picker for The Moor Remembers cairns.
 *
 * Pure decision function. Given a context describing the cairn touch
 * (variant of the past-self, whether this is the first cairn ever
 * touched on this save, current grandfather-leaf reveal count, and a
 * seeded RNG sample in [0,1)), returns the i18n key for the whisper
 * line that should fire.
 *
 * Replay-deterministic: same context → same result.
 *
 * Spec: `docs/superpowers/specs/2026-05-22-the-moor-remembers-design.md` §4.
 */
import { GRANDFATHER_WHISPER_CHANCE } from '../../utils/save/fallenCairns';

const SUPPORTED_VARIANT_LINES = new Set([
  'classic',
  'cailleach',
  'glaswegian',
  'doric_quinie',
  'burns_wee_beastie',
  'morningside',
  'drouthy',
  'pibroch',
  'orcadian',
  'hebridean',
  'iron_brew',
  'grans_best',
  'the_pict',
  'jacobite',
  'tam_o_shanter',
  'engineer',
  'tufted',
  'moor_runner',
  'iron_belly',
  'glen_forager',
  'surefoot',
  'pipe_breath',
  'wee_ghostie',
  'laird',
  'anticlockwise',
  'peerie_shetlander',
  'witch_hare',
  'selkie',
]);

export interface WhisperPickContext {
  readonly variantKey: string;
  readonly isFirstDeathTouchEver: boolean;
  readonly oldDroverRevealedCount: number;
  readonly rngSample: number;
}

export type WhisperResult =
  | { readonly kind: 'past_self'; readonly i18nKey: string }
  | { readonly kind: 'grandfather'; readonly i18nKey: string; readonly leafIndex: number };

export function pickWhisper(ctx: WhisperPickContext): WhisperResult {
  if (ctx.isFirstDeathTouchEver) {
    return { kind: 'past_self', i18nKey: 'ui.cairn.whisper.past_self.first_death' };
  }

  if (
    ctx.oldDroverRevealedCount < 25 &&
    ctx.rngSample < GRANDFATHER_WHISPER_CHANCE
  ) {
    const leafIndex = ctx.oldDroverRevealedCount + 1;
    const padded = String(leafIndex).padStart(2, '0');
    return { kind: 'grandfather', i18nKey: `ui.cairn.grandfather.${padded}`, leafIndex };
  }

  const variant = SUPPORTED_VARIANT_LINES.has(ctx.variantKey) ? ctx.variantKey : 'classic';
  return { kind: 'past_self', i18nKey: `ui.cairn.whisper.past_self.${variant}` };
}
