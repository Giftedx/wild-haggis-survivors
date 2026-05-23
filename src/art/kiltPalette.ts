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
  // V2 Track 2 — Peerie Shetlander. Moss + sea field, rust stripe
  // (Viking iron echo), bleached-driftwood accent.
  peerie_shetlander: { field: 0x3a5a4a, fieldDark: 0x1e3a2a, stripe: 0xaa6030, accent: 0xe0d8c8 },
  // V2 Track 3 — Burns's Wee Beastie. Aged-ink field, Ayrshire
  // arterial-red stripe, poet's cream accent.
  burns_wee_beastie: { field: 0x6a4030, fieldDark: 0x3a201c, stripe: 0xc82830, accent: 0xf0e4c8 },
  // Witch's Hare — Auldearn 1662. Bruised-heather field, witch-eye
  // green stripe, moonlight-silver accent thread.
  witch_hare: { field: 0x4a2848, fieldDark: 0x281428, stripe: 0x6a8848, accent: 0xd0c8d4 },
  // Wild Living World — Selkie. Wet-stone field with kelp-green
  // stripe and surf-foam accent. The two-form mechanic carries the
  // identity; the kilt sits quiet.
  selkie:       { field: 0x2a3540, fieldDark: 0x12181e, stripe: 0x4a8a7c, accent: 0xe8f0ec },
  // Morningside Haggis — grey-gold Edinburgh stone field, pearl-grey
  // stripe, warm pearl accent. As composed as the address warrants.
  morningside:  { field: 0x8a8070, fieldDark: 0x4a4038, stripe: 0xb8c8a8, accent: 0xe8e0d8 },
  // Drouthy Haggis — deep Highland red field, amber-gold stripe, warm
  // amber accent. The flask catches the light. Traditional and well-used.
  drouthy:      { field: 0xb84018, fieldDark: 0x6a2008, stripe: 0xf0c828, accent: 0xd88028 },
  // Pibroch Haggis — dark drone-brown field, silver chanter stripe.
  // The colour of the bag against the silver of the pipes.
  pibroch:      { field: 0x3a2010, fieldDark: 0x1e1008, stripe: 0xc8c8c8, accent: 0x807060 },
  // Orcadian Haggis — deep sea-teal field, standing-stone grey-green
  // stripe, Norse-gold accent thread. The Orkney palette in kilt form.
  orcadian:     { field: 0x2e5060, fieldDark: 0x1a3040, stripe: 0x7a8060, accent: 0xc8a858 },
  // Hebridean Haggis — Atlantic blue field, kelp-green stripe,
  // machair marram-grass gold accent thread.
  hebridean:    { field: 0x2e6070, fieldDark: 0x1a3a4a, stripe: 0x6a9878, accent: 0xd0c890 },
  // Iron Brew Haggis — orange field, Irn-Bru blue stripe,
  // rust-amber accent. The can in kilt form.
  iron_brew:    { field: 0xd04010, fieldDark: 0x8a2800, stripe: 0x2040a0, accent: 0xff8040 },
  // Gran's Best Haggis — deep burgundy field, sage-green stripe,
  // cream-gold accent. Hearth colours; the armchair tartan.
  grans_best:   { field: 0x8a3048, fieldDark: 0x5a1028, stripe: 0x4a6840, accent: 0xc8a060 },
  // The Pict — ochre-red field (warpaint), woad-blue stripe, dark-stone accent.
  the_pict:     { field: 0x6e3a10, fieldDark: 0x3a1c08, stripe: 0x2a4a6a, accent: 0x8a5020 },
  // The Jacobite — deep Jacobite-blue field, Stuart-crimson stripe, gold-braid accent.
  jacobite:     { field: 0x2e4878, fieldDark: 0x1a2848, stripe: 0xc04030, accent: 0xc8a840 },
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
