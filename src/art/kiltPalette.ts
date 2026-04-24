/**
 * Variant-aware kilt color palette — derives the 4 kilt drawing colors
 * from each haggis variant so every variant wears a distinct tartan.
 *
 * The mapping:
 *   field     — main kilt color (was KILT_RED)
 *   fieldDark — pleat shadow (was KILT_RED_DARK)
 *   stripe    — warp/weft bars (was KILT_GREEN)
 *   accent    — pinstripes (was KILT_YELLOW)
 */
import type { VariantKey } from '../data/variants';

export interface KiltPalette {
  /** Main kilt field color. */
  field: number;
  /** Darker shade for pleat shadows. */
  fieldDark: number;
  /** Warp/weft stripe color. */
  stripe: number;
  /** Pinstripe accent. */
  accent: number;
}

const KILT_PALETTES: Record<VariantKey, KiltPalette> = {
  classic:      { field: 0xa84828, fieldDark: 0x6b2a14, stripe: 0x244a2a, accent: 0xd4a017 },
  iron_belly:   { field: 0x3d6a4b, fieldDark: 0x1f3a28, stripe: 0x2a4a5a, accent: 0x88bb66 },
  moor_runner:  { field: 0xc0382b, fieldDark: 0x6b1010, stripe: 0x244a2a, accent: 0xffcc44 },
  glen_forager: { field: 0xb58a2b, fieldDark: 0x6a4a10, stripe: 0x3a5a2a, accent: 0xffe08a },
  surefoot:     { field: 0x5a6170, fieldDark: 0x2a3040, stripe: 0x4a5a6a, accent: 0xa8b8c8 },
  pipe_breath:  { field: 0x7a6ac0, fieldDark: 0x3a2a60, stripe: 0x4a3a6a, accent: 0xccaaff },
  laird:        { field: 0x2e6aa8, fieldDark: 0x1a3a5a, stripe: 0x4a6a8a, accent: 0x88ccff },
  wee_ghostie:  { field: 0x9dabc2, fieldDark: 0x5a6878, stripe: 0x6a7a8a, accent: 0xd8e8f8 },
  glaswegian:   { field: 0xff5a00, fieldDark: 0x8a2a00, stripe: 0x1a2028, accent: 0xffaa44 },
  cailleach:    { field: 0x2a4a2a, fieldDark: 0x1a2f1a, stripe: 0x8a2828, accent: 0xd4d0c0 },
  anticlockwise:{ field: 0x5a4e44, fieldDark: 0x2a2420, stripe: 0x7d6f62, accent: 0xc0d4d8 },
  // V2 Track 1 — Doric Quinie. Aberdonian granite field, North Sea
  // silver-blue stripe, aged-gold accent (mainline palette anchor).
  doric_quinie: { field: 0x4a5a6a, fieldDark: 0x2a3a4a, stripe: 0xd0d4e0, accent: 0xc8a040 },
};

/**
 * Shared tartan palette for all enemy and world tartan elements.
 * Muted Stewart red — reads as "generic Scottish" while sitting below
 * player kilt saturation in visual hierarchy. Accent uses WHISKY_GOLD
 * to tie into the game's primary accent language.
 */
export const HIGHLAND_TARTAN: KiltPalette = {
  field: 0xa83030,
  fieldDark: 0x6b1a1a,
  stripe: 0x1a4422,
  accent: 0xd4a017,
};

const FALLBACK: KiltPalette = KILT_PALETTES.classic;

export function resolveKiltPalette(variantKey: string): KiltPalette {
  return KILT_PALETTES[variantKey as VariantKey] ?? FALLBACK;
}
