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
  // Glasgow Close — sodium amber, the close's defining streetlight colour.
  glasgow_close: 0xf06010,
  // B7 — Fingal's Cave: deep Atlantic teal, the cave-pool colour at low tide.
  fingals_cave: 0x3a6a88,
  // B7 — Callanish: violet-mauve, the Lewis dusk that makes the stones glow.
  callanish: 0x8870c0,
  // B7 — Trossachs: deep forest green, Rob Roy country in full leaf.
  trossachs: 0x3a6030,
  // B8 — Edinburgh Old Town: gaslit amber-gold, sodium lanterns on the Mile.
  edinburgh_old_town: 0xd09040,
  // B8 — Cairngorm Woods: rich Caledonian pine-green, deep canopy.
  cairngorm_woods: 0x3a6020,
  // B8 — Orkney: Neolithic grey-teal, the ancient stone light.
  orkney: 0x7aaa90,
  // B9 — Corryvreckan: deep Atlantic teal, the whirlpool's churning colour.
  corryvreckan: 0x1a5868,
  // B9 — Shetland Voe: silver-slate, the simmer dim at midnight.
  shetland_voe: 0x8898b0,
  // B9 — Skye Fairy Pools: mineral turquoise, the pool's glow from below.
  skye_fairy_pool: 0x40c8c0,
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
  // B5 — coastal / haar / frost
  {
    id: 'tide_gift',
    captionKey: 'ui.moor_moment.tide_gift.caption',
    toastKey: 'ui.moor_moment.tide_gift.toast',
    reward: { kind: 'gold', amount: 14 },
    homeBiome: 'coastal',
    captionKeyHome: 'ui.moor_moment.tide_gift.caption_home',
    toastKeyHome: 'ui.moor_moment.tide_gift.toast_home',
  },
  {
    id: 'haar_rest',
    captionKey: 'ui.moor_moment.haar_rest.caption',
    toastKey: 'ui.moor_moment.haar_rest.toast',
    reward: { kind: 'xp', amount: 30 },
    homeBiome: 'haar',
    captionKeyHome: 'ui.moor_moment.haar_rest.caption_home',
    toastKeyHome: 'ui.moor_moment.haar_rest.toast_home',
  },
  {
    id: 'frost_mercy',
    captionKey: 'ui.moor_moment.frost_mercy.caption',
    toastKey: 'ui.moor_moment.frost_mercy.toast',
    reward: { kind: 'heal', amount: 8 },
    homeBiome: 'frost',
    captionKeyHome: 'ui.moor_moment.frost_mercy.caption_home',
    toastKeyHome: 'ui.moor_moment.frost_mercy.toast_home',
  },
  // B6 — cairngorm / glen_coe / clyde_shipyard / black_bog / ben_nevis / glasgow_close
  {
    id: 'quartzite_glint',
    captionKey: 'ui.moor_moment.quartzite_glint.caption',
    toastKey: 'ui.moor_moment.quartzite_glint.toast',
    reward: { kind: 'gold', amount: 16 },
    homeBiome: 'cairngorm',
    captionKeyHome: 'ui.moor_moment.quartzite_glint.caption_home',
    toastKeyHome: 'ui.moor_moment.quartzite_glint.toast_home',
  },
  {
    id: 'glen_echo',
    captionKey: 'ui.moor_moment.glen_echo.caption',
    toastKey: 'ui.moor_moment.glen_echo.toast',
    reward: { kind: 'xp', amount: 32 },
    homeBiome: 'glen_coe',
    captionKeyHome: 'ui.moor_moment.glen_echo.caption_home',
    toastKeyHome: 'ui.moor_moment.glen_echo.toast_home',
  },
  {
    id: 'rivet_pull',
    captionKey: 'ui.moor_moment.rivet_pull.caption',
    toastKey: 'ui.moor_moment.rivet_pull.toast',
    reward: { kind: 'magnet', flatPx: 60, durationMs: 8500 },
    homeBiome: 'clyde_shipyard',
    captionKeyHome: 'ui.moor_moment.rivet_pull.caption_home',
    toastKeyHome: 'ui.moor_moment.rivet_pull.toast_home',
  },
  {
    id: 'ink_give',
    captionKey: 'ui.moor_moment.ink_give.caption',
    toastKey: 'ui.moor_moment.ink_give.toast',
    reward: { kind: 'heal', amount: 9 },
    homeBiome: 'black_bog',
    captionKeyHome: 'ui.moor_moment.ink_give.caption_home',
    toastKeyHome: 'ui.moor_moment.ink_give.toast_home',
  },
  {
    id: 'summit_call',
    captionKey: 'ui.moor_moment.summit_call.caption',
    toastKey: 'ui.moor_moment.summit_call.toast',
    reward: { kind: 'xp', amount: 36 },
    homeBiome: 'ben_nevis',
    captionKeyHome: 'ui.moor_moment.summit_call.caption_home',
    toastKeyHome: 'ui.moor_moment.summit_call.toast_home',
  },
  {
    id: 'close_find',
    captionKey: 'ui.moor_moment.close_find.caption',
    toastKey: 'ui.moor_moment.close_find.toast',
    reward: { kind: 'gold', amount: 15 },
    homeBiome: 'glasgow_close',
    captionKeyHome: 'ui.moor_moment.close_find.caption_home',
    toastKeyHome: 'ui.moor_moment.close_find.toast_home',
  },
  // B7 — fingals_cave / callanish / trossachs
  {
    id: 'basalt_note',
    captionKey: 'ui.moor_moment.basalt_note.caption',
    toastKey: 'ui.moor_moment.basalt_note.toast',
    reward: { kind: 'xp', amount: 34 },
    homeBiome: 'fingals_cave',
    captionKeyHome: 'ui.moor_moment.basalt_note.caption_home',
    toastKeyHome: 'ui.moor_moment.basalt_note.toast_home',
  },
  {
    id: 'stone_patience',
    captionKey: 'ui.moor_moment.stone_patience.caption',
    toastKey: 'ui.moor_moment.stone_patience.toast',
    reward: { kind: 'heal', amount: 7 },
    homeBiome: 'callanish',
    captionKeyHome: 'ui.moor_moment.stone_patience.caption_home',
    toastKeyHome: 'ui.moor_moment.stone_patience.toast_home',
  },
  {
    id: 'forest_cache',
    captionKey: 'ui.moor_moment.forest_cache.caption',
    toastKey: 'ui.moor_moment.forest_cache.toast',
    reward: { kind: 'gold', amount: 13 },
    homeBiome: 'trossachs',
    captionKeyHome: 'ui.moor_moment.forest_cache.caption_home',
    toastKeyHome: 'ui.moor_moment.forest_cache.toast_home',
  },
  // B8 — edinburgh_old_town / cairngorm_woods / orkney
  {
    id: 'wynd_coin',
    captionKey: 'ui.moor_moment.wynd_coin.caption',
    toastKey: 'ui.moor_moment.wynd_coin.toast',
    reward: { kind: 'gold', amount: 17 },
    homeBiome: 'edinburgh_old_town',
    captionKeyHome: 'ui.moor_moment.wynd_coin.caption_home',
    toastKeyHome: 'ui.moor_moment.wynd_coin.toast_home',
  },
  {
    id: 'resin_warmth',
    captionKey: 'ui.moor_moment.resin_warmth.caption',
    toastKey: 'ui.moor_moment.resin_warmth.toast',
    reward: { kind: 'heal', amount: 8 },
    homeBiome: 'cairngorm_woods',
    captionKeyHome: 'ui.moor_moment.resin_warmth.caption_home',
    toastKeyHome: 'ui.moor_moment.resin_warmth.toast_home',
  },
  {
    id: 'neolithic_memory',
    captionKey: 'ui.moor_moment.neolithic_memory.caption',
    toastKey: 'ui.moor_moment.neolithic_memory.toast',
    reward: { kind: 'xp', amount: 36 },
    homeBiome: 'orkney',
    captionKeyHome: 'ui.moor_moment.neolithic_memory.caption_home',
    toastKeyHome: 'ui.moor_moment.neolithic_memory.toast_home',
  },
  // B9 — corryvreckan / shetland_voe / skye_fairy_pool
  {
    id: 'maelstrom_pull',
    captionKey: 'ui.moor_moment.maelstrom_pull.caption',
    toastKey: 'ui.moor_moment.maelstrom_pull.toast',
    reward: { kind: 'magnet', flatPx: 65, durationMs: 9000 },
    homeBiome: 'corryvreckan',
    captionKeyHome: 'ui.moor_moment.maelstrom_pull.caption_home',
    toastKeyHome: 'ui.moor_moment.maelstrom_pull.toast_home',
  },
  {
    id: 'voe_drift',
    captionKey: 'ui.moor_moment.voe_drift.caption',
    toastKey: 'ui.moor_moment.voe_drift.toast',
    reward: { kind: 'gold', amount: 14 },
    homeBiome: 'shetland_voe',
    captionKeyHome: 'ui.moor_moment.voe_drift.caption_home',
    toastKeyHome: 'ui.moor_moment.voe_drift.toast_home',
  },
  {
    id: 'pool_light',
    captionKey: 'ui.moor_moment.pool_light.caption',
    toastKey: 'ui.moor_moment.pool_light.toast',
    reward: { kind: 'xp', amount: 38 },
    homeBiome: 'skye_fairy_pool',
    captionKeyHome: 'ui.moor_moment.pool_light.caption_home',
    toastKeyHome: 'ui.moor_moment.pool_light.toast_home',
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
