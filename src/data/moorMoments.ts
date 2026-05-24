/**
 * Moor moments — occasional mid-run beats: a line of hearth voice, a little
 * mechanical gift, and a whisper of music/SFX glue. Order is shuffled per run
 * from the seeded RNG so daily runs stay deterministic.
 *
 * Each moment has an optional **home biome**: when the player is standing
 * there, the caption/toast swap to place-grounded lines (same reward).
 */
import type { BiomeId } from './biomes';
import type { RNG } from '../utils/rng';

export type MoorMomentReward =
  | { kind: 'gold'; amount: number }
  | { kind: 'xp'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'magnet'; flatPx: number; durationMs: number };

export interface MoorMomentDef {
  readonly id: string;
  /** i18n key for full caption (a11y + bottom line). */
  readonly captionKey: string;
  /** i18n key for short toast — usually includes reward numbers. */
  readonly toastKey: string;
  readonly reward: MoorMomentReward;
  /** When set, captionKeyHome / toastKeyHome replace base copy in this biome. */
  readonly homeBiome?: BiomeId;
  readonly captionKeyHome?: string;
  readonly toastKeyHome?: string;
}

/** First cadence (~seconds into the run) before the repeating gap kicks in. */
export const MOOR_MOMENT_FIRST_SEC = 92;

/** Base gap between moments; `+ rng(0, MOOR_MOMENT_GAP_JITTER_SEC)` each time. */
export const MOOR_MOMENT_GAP_BASE_SEC = 96;
export const MOOR_MOMENT_GAP_JITTER_SEC = 52;

/**
 * When the moment fires in its **home** biome, nudge rewards up — noticeable,
 * not economy-breaking.
 */
export const MOOR_HOME_REWARD = {
  goldMult: 1.28,
  xpMult: 1.22,
  healMult: 1.35,
  magnetFlatBonus: 14,
  magnetDurationMsBonus: 2000,
} as const;

/** VFX tint for moor burst — keyed by biome for a subtle read. */
export const MOOR_MOMENT_BURST_TINT: Record<BiomeId, number> = {
  bog: 0x7a9e6b,
  loch: 0x6ba8c4,
  pine: 0x5d8a52,
  heather: 0xc49bd4,
  // B5 Phase 1 — Seawrack: sea-foam blue-grey, brighter than loch
  // (loch is freshwater dark; coastal is salt-spray light).
  coastal: 0x9bc4d4,
  // B5 Phase 1b — Haar: cool desaturated grey-mauve, distinct from
  // coastal's saltier blue. The fog drains chroma; tint matches.
  haar: 0xa8aebc,
  // B5 Phase 2 — Frost: cold ice-blue, brightest of the cold tones
  // (frost reads brighter than haar despite less saturation — snow
  // throws light back). Distinct from coastal/haar greys.
  frost: 0xc8e0ee,
  // Highland Horrors — Cairngorm: quartzite pale-green, the colour of
  // lichen-covered exposed rock on a bright cold day.
  cairngorm: 0xb0c8a0,
  // Highland Horrors — Glen Coe: deep red-ochre, the distinctive
  // Glencoe volcanic rock in afternoon light.
  glen_coe: 0x9a6048,
  // Clyde Shipyard — copper-orange, the colour of a hot rivet just caught.
  clyde_shipyard: 0xc87840,
  // Black Bog — deep ink-purple; iridescent sheen on the dark water.
  black_bog: 0x3a1848,
  // Ben Nevis Summit — slate-blue, the colour of the summit plateau under
  // an overcast Atlantic sky. Coldest and greyest of all biome tints.
  ben_nevis: 0x8899b8,
};

export const MOOR_MOMENTS: readonly MoorMomentDef[] = [
  {
    id: 'peat_glint',
    captionKey: 'ui.moor_moment.peat_glint.caption',
    toastKey: 'ui.moor_moment.peat_glint.toast',
    reward: { kind: 'gold', amount: 12 },
    homeBiome: 'bog',
    captionKeyHome: 'ui.moor_moment.peat_glint.caption_home',
    toastKeyHome: 'ui.moor_moment.peat_glint.toast_home',
  },
  {
    id: 'loch_breath',
    captionKey: 'ui.moor_moment.loch_breath.caption',
    toastKey: 'ui.moor_moment.loch_breath.toast',
    reward: { kind: 'xp', amount: 28 },
    homeBiome: 'loch',
    captionKeyHome: 'ui.moor_moment.loch_breath.caption_home',
    toastKeyHome: 'ui.moor_moment.loch_breath.toast_home',
  },
  {
    id: 'heather_rest',
    captionKey: 'ui.moor_moment.heather_rest.caption',
    toastKey: 'ui.moor_moment.heather_rest.toast',
    reward: { kind: 'heal', amount: 7 },
    homeBiome: 'heather',
    captionKeyHome: 'ui.moor_moment.heather_rest.caption_home',
    toastKeyHome: 'ui.moor_moment.heather_rest.toast_home',
  },
  {
    id: 'pine_pull',
    captionKey: 'ui.moor_moment.pine_pull.caption',
    toastKey: 'ui.moor_moment.pine_pull.toast',
    reward: { kind: 'magnet', flatPx: 55, durationMs: 8200 },
    homeBiome: 'pine',
    captionKeyHome: 'ui.moor_moment.pine_pull.caption_home',
    toastKeyHome: 'ui.moor_moment.pine_pull.toast_home',
  },
  {
    id: 'crow_bargain',
    captionKey: 'ui.moor_moment.crow_bargain.caption',
    toastKey: 'ui.moor_moment.crow_bargain.toast',
    reward: { kind: 'gold', amount: 18 },
    homeBiome: 'heather',
    captionKeyHome: 'ui.moor_moment.crow_bargain.caption_home',
    toastKeyHome: 'ui.moor_moment.crow_bargain.toast_home',
  },
  {
    id: 'distant_tune',
    captionKey: 'ui.moor_moment.distant_tune.caption',
    toastKey: 'ui.moor_moment.distant_tune.toast',
    reward: { kind: 'xp', amount: 36 },
    homeBiome: 'pine',
    captionKeyHome: 'ui.moor_moment.distant_tune.caption_home',
    toastKeyHome: 'ui.moor_moment.distant_tune.toast_home',
  },
  {
    id: 'warm_stone',
    captionKey: 'ui.moor_moment.warm_stone.caption',
    toastKey: 'ui.moor_moment.warm_stone.toast',
    reward: { kind: 'heal', amount: 10 },
    homeBiome: 'bog',
    captionKeyHome: 'ui.moor_moment.warm_stone.caption_home',
    toastKeyHome: 'ui.moor_moment.warm_stone.toast_home',
  },
  {
    id: 'wind_shift',
    captionKey: 'ui.moor_moment.wind_shift.caption',
    toastKey: 'ui.moor_moment.wind_shift.toast',
    reward: { kind: 'magnet', flatPx: 70, durationMs: 9000 },
    homeBiome: 'loch',
    captionKeyHome: 'ui.moor_moment.wind_shift.caption_home',
    toastKeyHome: 'ui.moor_moment.wind_shift.toast_home',
  },
  {
    id: 'amber_glow',
    captionKey: 'ui.moor_moment.amber_glow.caption',
    toastKey: 'ui.moor_moment.amber_glow.toast',
    reward: { kind: 'gold', amount: 16 },
    homeBiome: 'bog',
    captionKeyHome: 'ui.moor_moment.amber_glow.caption_home',
    toastKeyHome: 'ui.moor_moment.amber_glow.toast_home',
  },
  {
    // Drouthy-themed: an abandoned flask on the moor. Unanchored —
    // fires in any biome. Small gold reward + a wee warmth line.
    id: 'whisky_nip',
    captionKey: 'ui.moor_moment.whisky_nip.caption',
    toastKey: 'ui.moor_moment.whisky_nip.toast',
    reward: { kind: 'gold', amount: 14 },
  },
];

export function shuffleMoorMoments(rng: RNG): MoorMomentDef[] {
  const a: MoorMomentDef[] = MOOR_MOMENTS.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
