/**
 * Gold palettes for the two "big moment" juice effects — boss death
 * and weapon-evolution spectacle. They sit apart from COLORS in
 * config.ts because the hues here are specifically tuned for
 * particle rain / ring layering readability, not general UI use.
 *
 * Boss-death leans warmer-brass so it reads as "the monster fell";
 * evolution leans brighter yellow-gold so it reads as "YOUR
 * legendary". Sharing the constants here makes the two moments
 * tunable side-by-side and prevents accidental cross-contamination.
 *
 * The anchor tone (COLORS.WHISKY_GOLD) appears inside each palette so
 * the juice and HUD gold read as the same family — recolouring the
 * UI gold carries through to the biggest moments automatically.
 */

import { COLORS } from '../config';

// ── Boss death spectacle ────────────────────────────────────────────

/** Four-colour gold palette sampled randomly for each boss-death particle. */
export const JUICE_BOSS_DEATH_GOLDS: readonly number[] = [
  COLORS.WHISKY_GOLD, 0xffcc44, 0xffdd66, 0xeebb00,
] as const;

/** Primary ring gold for the boss-death expanding ring (first wave). */
export const JUICE_BOSS_DEATH_RING_PRIMARY = COLORS.WHISKY_GOLD;
/** Lighter secondary ring gold (second wave, 150ms delayed). */
export const JUICE_BOSS_DEATH_RING_SECONDARY = 0xffcc44;

// ── Evolution spectacle ─────────────────────────────────────────────

/** Four-colour gold palette sampled cyclically for evolution particles. */
export const JUICE_EVOLUTION_GOLDS: readonly number[] = [
  0xffdd44, 0xffcc22, 0xeebb00, 0xffee88,
] as const;

/** Three-colour palette for the layered expanding rings (light → dark). */
export const JUICE_EVOLUTION_RING_GOLDS: readonly number[] = [
  0xffee88, 0xffcc44, COLORS.WHISKY_GOLD,
] as const;

/** Radial beam colour shooting outward from the player. */
export const JUICE_EVOLUTION_BEAM_COLOR = 0xffdd44;
/** Horizontal line colour above and below the "LEGENDARY" banner. */
export const JUICE_EVOLUTION_BANNER_LINE_COLOR = 0xffdd44;
/** Dark banner backdrop behind the legendary text. */
export const JUICE_EVOLUTION_BANNER_BG_COLOR = 0x2a1a00;
