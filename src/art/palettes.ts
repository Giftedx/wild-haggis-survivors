/**
 * Curated palette anchors per `docs/ART_STYLE_BIBLE.md`. Single source of
 * truth for procedural drawer colour choices. No stray hex constants in
 * drawer code — pull from here or extend this module.
 *
 * Families chosen from the existing sprite inventory (dean_apparition,
 * tome_wraith, redcap, etc.) and grouped so a drawer can pick an anchor
 * + a lighter / darker sibling without hunting across the codebase.
 */

export const PALETTE = {
  peat: {
    shadow: 0x3a2818,
    mid: 0x5a3e20,
    warm: 0x4a2e18,
  },
  heather: {
    dark: 0x8060a0,
    mid: 0x9070b0,
    bright: 0xb090d0,
  },
  loch: {
    deep: 0x2a4a6a,
    mid: 0x4a7090,
    cool: 0x6a90b0,
  },
  gold: {
    aged: 0xc8a040,
    warm: 0xd4b055,
    bright: 0xffc840,
  },
  stone: {
    shadow: 0x2a2a30,
    mid: 0x4a4a50,
    highlight: 0x8a8a90,
  },
  red: {
    deep: 0xaa2020,
    arterial: 0xc42828,
    dried: 0x901818,
  },
} as const;

export const PALETTE_GROUPS = Object.keys(PALETTE) as Array<keyof typeof PALETTE>;

/**
 * Per-variant tint applied by HaggisContainer body-sprite drawer. Phase 0
 * ships `classic` only; remaining 8 variants land in Phase 1 alongside
 * per-variant atlas bake.
 */
export interface VariantPalette {
  readonly body: number;
  readonly bodyShadow: number;
  readonly bodyHighlight: number;
  readonly accent: number;
}

export const CLASSIC_VARIANT: VariantPalette = {
  body: PALETTE.peat.mid,
  bodyShadow: PALETTE.peat.shadow,
  bodyHighlight: PALETTE.peat.warm,
  accent: PALETTE.gold.aged,
};
