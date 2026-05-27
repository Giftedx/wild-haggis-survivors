/**
 * Biome definitions — regions that tint the world, shift spawn weights,
 * and apply a mild mechanical modifier while the player stands inside them.
 *
 * Biomes are assigned spatially via a voronoi partition (see BiomeManager).
 * The whole layout is seeded from the run's RNG, so daily/seeded runs
 * produce the same map every time.
 */
import type { RNG } from '../utils/rng';
import { COLORS } from '../config';

export type BiomeId = 'bog' | 'loch' | 'pine' | 'heather' | 'coastal' | 'haar' | 'frost' | 'cairngorm' | 'glen_coe' | 'clyde_shipyard' | 'black_bog' | 'ben_nevis' | 'glasgow_close' | 'fingals_cave' | 'callanish' | 'trossachs' | 'edinburgh_old_town' | 'cairngorm_woods' | 'orkney' | 'corryvreckan' | 'shetland_voe' | 'skye_fairy_pool';
export type BiomeModifierKind =
  | 'bogSlow'
  | 'lochKnockback'
  | 'pineConcealment'
  | 'heatherBloom'
  | 'coastalTide'
  | 'haarConcealment'
  | 'frostBite'
  | 'cairngormWind'
  | 'glenCoeEcho'
  | 'clydeRivets'
  | 'blackBogInk'
  | 'benNevisWind'
  | 'glasgowClose'
  | 'fingalEcho'
  | 'callanishAlignment'
  | 'trossachsCanopy'
  | 'edinburghSmoke'
  | 'cairngormWood'
  | 'orkneyWind'
  | 'corryVreckan'
  | 'shetlandVoe'
  | 'fairyPoolGlow';

export interface BiomeDef {
  readonly id: BiomeId;
  /** i18n key for the biome's display name. */
  readonly nameKey: string;
  /** Primary tint hex for minimap / debug. */
  readonly tint: number;
  /** Entry-toast i18n key (Glesga patter). */
  readonly entryToastKey: string;
  /**
   * Single-sentence lore snippet shown 2.5 s after the entry toast on
   * the first encounter of each biome each run. Distilled from the
   * long-form `loreKey`; same place + voice, tighter for HUD use.
   */
  readonly loreSnippetKey: string;
  /**
   * Long-form Almanac lore i18n key — soulful 60-80-word entry that
   * carries the place's history, wildlife, and Scottish character.
   * Resolved by the Almanac Weys / Beasties detail panels and by any
   * lore-codex consumers; see `i18n.ts` `biomes.<id>.lore`.
   */
  readonly loreKey: string;
  /** Toast tint as CSS colour. */
  readonly toastColor: string;
  /** Weight multipliers applied per enemy key. Missing keys default to 1. */
  readonly spawnWeightMods: Readonly<Record<string, number>>;
  readonly modifier: BiomeModifierKind;
  /**
   * Music timbre preset (0..1 scalar on the Conductor's "biome" axis).
   * 0 = grounded/peat, 1 = bright/airy.
   */
  readonly moodTimbre: number;
  /**
   * F1 — resting haar-fog density (0..1) applied while the player is inside
   * this biome. Loch and bog sit low to water and hold mist naturally; pine
   * and heather sit higher and drier. Biome transitions briefly ramp this
   * to 1.0 via HaarFogController; see `haarTransitionSequence`.
   */
  readonly ambientHaarDensity: number;
}

export const BIOMES: Readonly<Record<BiomeId, BiomeDef>> = {
  bog: {
    id: 'bog',
    nameKey: 'biomes.bog.name',
    tint: 0x3a4a1a,
    entryToastKey: 'biomes.bog.entry',
    loreSnippetKey: 'biomes.bog.loreSnippet',
    loreKey: 'biomes.bog.lore',
    toastColor: '#9aa070',
    spawnWeightMods: {
      tourist: 1.3,
      midgie_swarm: 1.8,
      haggis_hunter: 1.2,
      eagle: 0.4,
      kelpie: 0.6,
    },
    modifier: 'bogSlow',
    moodTimbre: 0.15,
    ambientHaarDensity: 0.1,
  },
  loch: {
    id: 'loch',
    nameKey: 'biomes.loch.name',
    tint: 0x2a4a6a,
    entryToastKey: 'biomes.loch.entry',
    loreSnippetKey: 'biomes.loch.loreSnippet',
    loreKey: 'biomes.loch.lore',
    toastColor: '#88bbdd',
    spawnWeightMods: {
      kelpie: 2.0,
      eagle: 1.4,
      ghost: 1.2,
      tourist: 0.7,
      chef: 0.5,
    },
    modifier: 'lochKnockback',
    moodTimbre: 0.55,
    ambientHaarDensity: 0.2,
  },
  pine: {
    id: 'pine',
    nameKey: 'biomes.pine.name',
    tint: 0x1a3a22,
    entryToastKey: 'biomes.pine.entry',
    loreSnippetKey: 'biomes.pine.loreSnippet',
    loreKey: 'biomes.pine.lore',
    toastColor: '#5a8a5a',
    spawnWeightMods: {
      ghost: 1.6,
      berserker: 1.3,
      haggis_hunter: 1.3,
      sheep: 0.6,
    },
    modifier: 'pineConcealment',
    moodTimbre: 0.3,
    ambientHaarDensity: 0,
  },
  heather: {
    id: 'heather',
    nameKey: 'biomes.heather.name',
    tint: COLORS.HEATHER,
    entryToastKey: 'biomes.heather.entry',
    loreSnippetKey: 'biomes.heather.loreSnippet',
    loreKey: 'biomes.heather.lore',
    toastColor: '#c699ee',
    spawnWeightMods: {
      sheep: 1.4,
      highland_cow: 1.3,
      midge: 1.2,
      midgie_swarm: 0.7,
    },
    modifier: 'heatherBloom',
    moodTimbre: 0.8,
    ambientHaarDensity: 0,
  },
  coastal: {
    id: 'coastal',
    nameKey: 'biomes.coastal.name',
    tint: 0x4a7080,
    entryToastKey: 'biomes.coastal.entry',
    loreSnippetKey: 'biomes.coastal.loreSnippet',
    loreKey: 'biomes.coastal.lore',
    toastColor: '#9ac0d0',
    spawnWeightMods: {
      buzzard: 1.4,
      eagle: 1.3,
      golden_eagle: 1.2,
      kelpie: 1.1,
      sheep: 0.4,
      highland_cow: 0.3,
    },
    modifier: 'coastalTide',
    moodTimbre: 0.65,
    ambientHaarDensity: 0.35,
  },
  haar: {
    id: 'haar',
    nameKey: 'biomes.haar.name',
    tint: 0x6a7888,
    entryToastKey: 'biomes.haar.entry',
    loreSnippetKey: 'biomes.haar.loreSnippet',
    loreKey: 'biomes.haar.lore',
    toastColor: '#b8c4d4',
    spawnWeightMods: {
      // Fey palette: ghosts, haar wraith, blue man — fog turns the moor
      // into faerie territory. Open-field hostiles down-weighted (you
      // can hardly see them anyway; would feel cheap).
      ghost: 1.6,
      haar_wraith: 2.0,
      blue_man_of_minch: 1.4,
      kelpie: 1.2,
      eagle: 0.4,
      tourist: 0.5,
    },
    modifier: 'haarConcealment',
    moodTimbre: 0.45,
    // Charter §4.3 / Risk 7: capped at 0.7 not 1.0 so silhouette-first
    // readability holds at >300px. HaarFogController auto-tweens to this
    // target via biomeHaarTarget(settings, biome) on biome enter.
    ambientHaarDensity: 0.7,
  },
  frost: {
    id: 'frost',
    nameKey: 'biomes.frost.name',
    tint: 0x8a98a8,
    entryToastKey: 'biomes.frost.entry',
    loreSnippetKey: 'biomes.frost.loreSnippet',
    loreKey: 'biomes.frost.lore',
    toastColor: '#d8dee8',
    spawnWeightMods: {
      // Grave palette: cold-numbed pressure. Bodach Glas is the
      // signature creature (Phase 2 follow-up — the grey old man of
      // Ben Macdui); berserker (Caithness Viking hardiness), ghost
      // (winter death-portent), eagle (tops are their territory).
      // Tourists and chefs avoid the cold (-).
      bodach_glas: 2.0,
      berserker: 1.5,
      ghost: 1.4,
      eagle: 1.3,
      golden_eagle: 1.2,
      tourist: 0.3,
      chef: 0.2,
      sheep: 0.6,
    },
    modifier: 'frostBite',
    // Lowest moodTimbre in the catalog — sparse cold drone, the
    // most grounded music character. Frost sits below bog (0.15)
    // because Cairngorm winter is heavier/quieter than peat-bog
    // breath; the wind on the tops carries silence, not sound.
    moodTimbre: 0.1,
    // Cold air carries less mist than haar — the Cairngorms in winter
    // are clear and biting, not foggy. Low ambient haar.
    ambientHaarDensity: 0.15,
  },
  // Highland Horrors drop — Cairngorm Plateau.
  // Exposed subarctic plateau above the treeline. Britain's only true
  // arctic landscape: quartzite, rime, golden-eagle thermals. The Bodach
  // Glas paces the summit ridge. Wind cuts from the north without warning.
  cairngorm: {
    id: 'cairngorm',
    nameKey: 'biomes.cairngorm.name',
    tint: 0x6a7a60,
    entryToastKey: 'biomes.cairngorm.entry',
    loreSnippetKey: 'biomes.cairngorm.loreSnippet',
    loreKey: 'biomes.cairngorm.lore',
    toastColor: '#a8b898',
    spawnWeightMods: {
      bodach_glas: 2.5,
      ghost: 1.8,
      eagle: 1.5,
      golden_eagle: 2.0,
      berserker: 1.3,
      tourist: 0.1,
      chef: 0.05,
      sheep: 0.5,
      highland_cow: 0.2,
    },
    modifier: 'cairngormWind',
    // Exposed plateau — cold, clear. Grounded music character even below
    // frost (0.10) because the summit silence is heavier than peat breath.
    moodTimbre: 0.08,
    ambientHaarDensity: 0.1,
  },
  // Highland Horrors drop — Glen Coe.
  // Three miles of red-black rock, the River Coe fast below.
  glen_coe: {
    id: 'glen_coe',
    nameKey: 'biomes.glen_coe.name',
    tint: 0x2a1a14,
    entryToastKey: 'biomes.glen_coe.entry',
    loreSnippetKey: 'biomes.glen_coe.loreSnippet',
    loreKey: 'biomes.glen_coe.lore',
    toastColor: '#8a6858',
    spawnWeightMods: {
      ghost: 2.0,
      berserker: 1.5,
      eagle: 1.3,
      haar_wraith: 1.0,
      redcap: 1.2,
      sheep: 0.6,
      tourist: 0.2,
      chef: 0.1,
    },
    modifier: 'glenCoeEcho',
    // Glen Coe — sombre, dark, the weight of history. Heavier than bog.
    moodTimbre: 0.2,
    ambientHaarDensity: 0.3,
  },
  // Clyde Shipyard — postindustrial riverbank, rusted cranes, dry-docks,
  // still holding the heat of iron. Urban working-class Scotland; the moor
  // opens into broken concrete and slag. Urban hostiles weight up; wildlife
  // down. The `clydeRivets` modifier: +15% XP (craft-pride, team effort),
  // -8% speed (heavy ironwork underfoot). Unique: only biome that stacks
  // both an XP buff and a speed penalty.
  clyde_shipyard: {
    id: 'clyde_shipyard',
    nameKey: 'biomes.clyde_shipyard.name',
    tint: 0x5a4a38,
    entryToastKey: 'biomes.clyde_shipyard.entry',
    loreSnippetKey: 'biomes.clyde_shipyard.loreSnippet',
    loreKey: 'biomes.clyde_shipyard.lore',
    toastColor: '#c87840',
    spawnWeightMods: {
      buckfast_ned: 1.4,
      traffic_cone_totem: 1.3,
      edinburgh_ghost_guide: 1.3,
      berserker: 1.2,
      ghost: 1.3,
      tourist: 1.2,
      sheep: 0.05,
      highland_cow: 0.05,
      eagle: 0.5,
    },
    modifier: 'clydeRivets',
    // Industrial mid-low — the hiss of steam pressure, the rhythm of hammers.
    // Higher than glen_coe (0.2) but heavier than coastal (0.65).
    moodTimbre: 0.35,
    // River Clyde carries light mist at dawn; heavy smoke has cleared.
    ambientHaarDensity: 0.05,
  },
  // Black Bog — raised mire compressed to near-stone; peat went past brown
  // to ink-dark. The water holds no reflection. The drift pulls harder here.
  // `blackBogInk` modifier: −15% speed, ×2 drift (the darkness disorients).
  // Post-bell exclusive; ink_pool hazard spawns around the player.
  black_bog: {
    id: 'black_bog',
    nameKey: 'biomes.black_bog.name',
    tint: 0x100808,
    entryToastKey: 'biomes.black_bog.entry',
    loreSnippetKey: 'biomes.black_bog.loreSnippet',
    loreKey: 'biomes.black_bog.lore',
    toastColor: '#502020',
    spawnWeightMods: {
      ghost: 2.5,
      haar_wraith: 1.8,
      ledger_wraith: 1.8,
      edinburgh_ghost_guide: 1.3,
      tourist: 0.1,
      sheep: 0.1,
      highland_cow: 0.1,
      chef: 0.1,
    },
    modifier: 'blackBogInk',
    // Darkest biome in the catalog — below cairngorm (0.08). The ink muffles
    // everything; the music should feel like drowning in slow oil.
    moodTimbre: 0.05,
    // Dense murk — near-haar level. The fog isn't water mist here; it's
    // particulate peat spore. Charter §4.3 cap still applies.
    ambientHaarDensity: 0.65,
  },
  // Ben Nevis Summit — Britain's highest point, 1,345m above Fort William.
  // Exposed granite plateau above the cloud line. Prevailing Atlantic westerlies
  // push constantly across the summit; the `benNevisWind` modifier applies a
  // constant eastward push force on the player every frame — movement with the
  // wind is free; fighting it costs. Thin-air speed reduction (-8%) is lighter
  // than frostBite (-25%) or bogSlow (-15%); the wind force is the real tax.
  // Refs: SCOTTISH_RESEARCH_DEEP.md §4 Highland geography.
  ben_nevis: {
    id: 'ben_nevis',
    nameKey: 'biomes.ben_nevis.name',
    tint: 0x8899b8,
    entryToastKey: 'biomes.ben_nevis.entry',
    loreSnippetKey: 'biomes.ben_nevis.loreSnippet',
    loreKey: 'biomes.ben_nevis.lore',
    toastColor: '#9aaccc',
    spawnWeightMods: {
      golden_eagle: 2.5,
      eagle: 2.0,
      bodach_glas: 1.8,
      ghost: 1.3,
      berserker: 1.2,
      tourist: 0.15,
      chef: 0.05,
      sheep: 0.3,
      highland_cow: 0.1,
      buckfast_ned: 0.05,
    },
    modifier: 'benNevisWind',
    // Exposed summit — airy and stark. Brighter than any other biome
    // (1.0 = full Highland brightness); the cloud is overhead, not surrounding.
    moodTimbre: 0.90,
    // Wispy summit cloud — lower than haar (0.7) but present; the Ben is
    // rarely truly clear above 1000 m.
    ambientHaarDensity: 0.15,
  },
  // Glasgow Close — sodium-amber urban canyon. Cramped tenement closes,
  // puddled flagstones, the warm glow of chip-shop neon on wet stone.
  // `glasgowClose` modifier: −12% speed (the closes are tight — ye cannae
  // run at full tilt doon a shared stair), +18% XP (urban kill density;
  // every ned on the close-mouth counts). Distinct from clydeRivets (−8%/+15%).
  glasgow_close: {
    id: 'glasgow_close',
    nameKey: 'biomes.glasgow_close.name',
    tint: 0xf06010,
    entryToastKey: 'biomes.glasgow_close.entry',
    loreSnippetKey: 'biomes.glasgow_close.loreSnippet',
    loreKey: 'biomes.glasgow_close.lore',
    toastColor: '#f09040',
    spawnWeightMods: {
      buckfast_ned: 1.8,
      traffic_cone_totem: 1.5,
      edinburgh_ghost_guide: 1.4,
      ceilidh_caller: 1.3,
      sheep: 0.05,
      highland_cow: 0.05,
      eagle: 0.3,
    },
    modifier: 'glasgowClose',
    // Urban energy — higher than clyde_shipyard (0.35); the close has rhythm
    // and noise, a lively bustle even at midnight.
    moodTimbre: 0.7,
    // Sodium light cuts through the haar; urban heat dries the close-mouth
    // mist. Lowest ambient haar of any biome with an urban flavour.
    ambientHaarDensity: 0.05,
  },
  // Fingal's Cave — basalt sea cave on the Isle of Staffa.
  // Hexagonal columns, resonant acoustics, spray from the Atlantic swell.
  // `fingalEcho` modifier: +12% knockback (the cave amplifies every impact),
  // -8% speed (the basalt floor is uneven, the ground tilts and shifts).
  fingals_cave: {
    id: 'fingals_cave',
    nameKey: 'biomes.fingals_cave.name',
    tint: 0x1a2a38,
    entryToastKey: 'biomes.fingals_cave.entry',
    loreSnippetKey: 'biomes.fingals_cave.loreSnippet',
    loreKey: 'biomes.fingals_cave.lore',
    toastColor: '#6a8aaa',
    spawnWeightMods: {
      blue_man_of_minch: 2.0,
      seelie_piper: 1.5,
      unseelie_fiddler: 1.5,
      eagle: 1.2,
      ghost: 1.3,
      tourist: 0.2,
      chef: 0.1,
      sheep: 0.1,
      highland_cow: 0.1,
    },
    modifier: 'fingalEcho',
    // Resonant sea cave — haunting mid-range; higher timbre than glen_coe (0.2)
    // because the water-light and echo give it an ethereal brightness.
    moodTimbre: 0.50,
    // Atlantic spray and sea-cave mist — consistent dampness without full haar density.
    ambientHaarDensity: 0.30,
  },
  // Callanish Standing Stones — Neolithic site on the Isle of Lewis.
  // Twilight-purple ancient stones in cruciform alignment; the stones are said
  // to walk to the loch at midsummer. `callanishAlignment` modifier: −30% drift
  // (the ancient alignment steadies the haggis's path), +10% XP (the stones
  // carry the weight of deep time).
  callanish: {
    id: 'callanish',
    nameKey: 'biomes.callanish.name',
    tint: 0x3a2a5a,
    entryToastKey: 'biomes.callanish.entry',
    loreSnippetKey: 'biomes.callanish.loreSnippet',
    loreKey: 'biomes.callanish.lore',
    toastColor: '#9a88cc',
    spawnWeightMods: {
      ghost: 1.8,
      unseelie_fiddler: 1.5,
      seelie_piper: 1.3,
      haar_wraith: 1.2,
      redcap: 1.1,
      tourist: 0.1,
      chef: 0.05,
      sheep: 0.4,
    },
    modifier: 'callanishAlignment',
    // Twilight Neolithic — neither dark nor bright; the stones hold a lunar quality.
    // Midway between coastal (0.65) and haar (0.45).
    moodTimbre: 0.55,
    ambientHaarDensity: 0.20,
  },
  // Trossachs Forest — emerald-bluebell woodland, Rob Roy country.
  // Ancient oak and birch, deer trails worn to mud, bluebells in April.
  // `trossachsCanopy` modifier: +8% speed (the haggis knows the deer trails),
  // +10% XP (the forest is rich — every kill earns more in good cover).
  trossachs: {
    id: 'trossachs',
    nameKey: 'biomes.trossachs.name',
    tint: 0x1a4018,
    entryToastKey: 'biomes.trossachs.entry',
    loreSnippetKey: 'biomes.trossachs.loreSnippet',
    loreKey: 'biomes.trossachs.lore',
    toastColor: '#6aa050',
    spawnWeightMods: {
      ghost: 1.5,
      berserker: 1.4,
      haggis_hunter: 1.3,
      eagle: 1.2,
      golden_eagle: 1.1,
      sheep: 0.6,
      highland_cow: 0.3,
      tourist: 0.4,
      chef: 0.3,
    },
    modifier: 'trossachsCanopy',
    // Warm woodland — brighter than bog (0.15), lighter than coastal (0.65).
    // The canopy lets light in, and Rob Roy's country has a defiant warmth.
    moodTimbre: 0.45,
    // Morning mist among the trees — light, not oppressive. Lower than haar.
    ambientHaarDensity: 0.10,
  },
  // B8 — Edinburgh Old Town. Smoke-grey closes and wynds; gaslit Royal Mile.
  // -10% speed (you cannae sprint doon a shared stair or through a close);
  // +12% XP (urban kill density and Edinburgh's scholar-energy pays out).
  // Haar density 0.15 — the Forth haar drifts up the Canongate on cold evenings.
  edinburgh_old_town: {
    id: 'edinburgh_old_town',
    nameKey: 'biomes.edinburgh_old_town.name',
    tint: 0x5a5060,
    entryToastKey: 'biomes.edinburgh_old_town.entry',
    loreSnippetKey: 'biomes.edinburgh_old_town.loreSnippet',
    loreKey: 'biomes.edinburgh_old_town.lore',
    toastColor: '#9a88a8',
    spawnWeightMods: {
      ghost: 1.8, edinburgh_ghost_guide: 1.5, buckfast_ned: 0.2, traffic_cone_totem: 0.3,
      tome_wraith: 1.3, dean_apparition: 1.2, rook: 1.3, tourist: 0.8, chef: 0.5,
      sheep: 0.05, highland_cow: 0.05, blue_man_of_minch: 0.05,
    },
    modifier: 'edinburghSmoke',
    moodTimbre: 0.55,
    ambientHaarDensity: 0.15,
  },
  // B8 — Cairngorm Woods. Ancient Caledonian pine forest below the plateau;
  // distinct from cairngorm (the exposed summit). Dense canopy, root-threaded
  // floor. +6% speed (you know the deer trails); -10% drift (the trees
  // straighten your path — you navigate by trunk-gaps not by feel).
  cairngorm_woods: {
    id: 'cairngorm_woods',
    nameKey: 'biomes.cairngorm_woods.name',
    tint: 0x1a3318,
    entryToastKey: 'biomes.cairngorm_woods.entry',
    loreSnippetKey: 'biomes.cairngorm_woods.loreSnippet',
    loreKey: 'biomes.cairngorm_woods.lore',
    toastColor: '#5a8858',
    spawnWeightMods: {
      ghost: 1.2, eagle: 1.4, golden_eagle: 1.0, berserker: 1.2,
      haggis_hunter: 1.3, sheep: 0.4, highland_cow: 0.3, tourist: 0.3,
      buckfast_ned: 0.05, traffic_cone_totem: 0.05,
    },
    modifier: 'cairngormWood',
    moodTimbre: 0.40,
    ambientHaarDensity: 0.15,
  },
  // B8 — Orkney Neolithic. Windswept grey-green Orcadian pasture; Ring of
  // Brodgar and Maeshowe on the horizon. Constant Atlantic westerly (biomeWindX)
  // mimics the relentless Orkney wind — moving with it is free, fighting it
  // costs stamina. +12% XP (ancient standing power flows through the stones).
  orkney: {
    id: 'orkney',
    nameKey: 'biomes.orkney.name',
    tint: 0x5a7860,
    entryToastKey: 'biomes.orkney.entry',
    loreSnippetKey: 'biomes.orkney.loreSnippet',
    loreKey: 'biomes.orkney.lore',
    toastColor: '#78aa88',
    spawnWeightMods: {
      ghost: 1.3, haar_wraith: 1.2, gale_wraith: 1.5, seelie_piper: 1.0,
      puffin: 0.05, sheep: 0.8, highland_cow: 0.5, tourist: 0.6,
      buckfast_ned: 0.05, traffic_cone_totem: 0.05,
    },
    modifier: 'orkneyWind',
    moodTimbre: 0.50,
    ambientHaarDensity: 0.25,
  },
  // B9 — Corryvreckan. The strait between Jura and Scarba; third-largest
  // whirlpool in the world. The Cailleach washes her great plaid here at
  // winter's turn. `corryVreckan` modifier: constant random-direction
  // current pushes the player (milder than benNevisWind; the whirlpool
  // spirals rather than blasts). −5% speed (wading the swell), +10%
  // knockback (the surge amplifies every impact).
  corryvreckan: {
    id: 'corryvreckan',
    nameKey: 'biomes.corryvreckan.name',
    tint: 0x0a2030,
    entryToastKey: 'biomes.corryvreckan.entry',
    loreSnippetKey: 'biomes.corryvreckan.loreSnippet',
    loreKey: 'biomes.corryvreckan.lore',
    toastColor: '#3a7088',
    spawnWeightMods: {
      kelpie: 2.0,
      blue_man_of_minch: 1.8,
      haar_wraith: 1.3,
      ghost: 1.2,
      eagle: 0.3,
      tourist: 0.1,
      chef: 0.05,
      sheep: 0.05,
      highland_cow: 0.05,
    },
    modifier: 'corryVreckan',
    // Deep mythic water — lower timbre than coastal (0.65); the whirlpool
    // is heavy with history and the Cailleach's weight.
    moodTimbre: 0.35,
    // Atlantic spray from the strait — denser than coastal, lighter than haar.
    ambientHaarDensity: 0.40,
  },
  // B9 — Shetland Voe. Norse-inflected sea inlet between Shetland cliffs;
  // midsummer twilight (simmer dim), Viking heritage, puffin stacks.
  // `shetlandVoe` modifier: +10% speed (quick on the voe shore — Viking
  // pragmatism), −10% drift (Norse linearity steadies the path).
  shetland_voe: {
    id: 'shetland_voe',
    nameKey: 'biomes.shetland_voe.name',
    tint: 0x5a6878,
    entryToastKey: 'biomes.shetland_voe.entry',
    loreSnippetKey: 'biomes.shetland_voe.loreSnippet',
    loreKey: 'biomes.shetland_voe.lore',
    toastColor: '#88a0b8',
    spawnWeightMods: {
      ghost: 1.3,
      haar_wraith: 1.1,
      eagle: 1.2,
      golden_eagle: 0.8,
      tourist: 0.3,
      chef: 0.2,
      sheep: 0.9,
      highland_cow: 0.3,
      blue_man_of_minch: 0.8,
    },
    modifier: 'shetlandVoe',
    // Norse bright — brighter than coastal (0.65), almost airy. The
    // simmer dim gives a silver clarity that reads as high moodTimbre.
    moodTimbre: 0.60,
    // Shetland haar off the voe — lighter than haar biome (0.7).
    ambientHaarDensity: 0.30,
  },
  // B9 — Skye Fairy Pools. Crystal mineral pools in black gabbro gorges
  // below the Black Cuillin above Glenbrittle. `fairyPoolGlow` modifier:
  // +25% XP (the pools are fey-charged — every kill resonates deeper),
  // −5% speed (wading the crystal shallows). Ethereal, gorgeous, fey.
  skye_fairy_pool: {
    id: 'skye_fairy_pool',
    nameKey: 'biomes.skye_fairy_pool.name',
    tint: 0x2a8a88,
    entryToastKey: 'biomes.skye_fairy_pool.entry',
    loreSnippetKey: 'biomes.skye_fairy_pool.loreSnippet',
    loreKey: 'biomes.skye_fairy_pool.lore',
    toastColor: '#5accc8',
    spawnWeightMods: {
      haar_wraith: 1.8,
      seelie_piper: 1.5,
      unseelie_fiddler: 1.4,
      ghost: 1.3,
      kelpie: 1.2,
      tourist: 0.4,
      chef: 0.2,
      sheep: 0.2,
      highland_cow: 0.1,
      eagle: 0.5,
    },
    modifier: 'fairyPoolGlow',
    // Ethereal and bright — higher than coastal (0.65), almost ben_nevis
    // (0.90) territory; the pools have a luminous quality.
    moodTimbre: 0.75,
    // Light mist rising from the mineral pools — lower than haar.
    ambientHaarDensity: 0.20,
  },
} as const;

export const BIOME_IDS: readonly BiomeId[] = ['bog', 'loch', 'pine', 'heather', 'coastal', 'haar', 'frost', 'cairngorm', 'glen_coe', 'clyde_shipyard', 'black_bog', 'ben_nevis', 'glasgow_close', 'fingals_cave', 'callanish', 'trossachs', 'edinburgh_old_town', 'cairngorm_woods', 'orkney', 'corryvreckan', 'shetland_voe', 'skye_fairy_pool'];

/**
 * Pick a biome set for this run. We want every run to feel distinct but
 * never boring — so guarantee at least 3 different biomes appear.
 */
export function pickBiomeAssignment(rng: RNG, seedCount: number): BiomeId[] {
  const ids: BiomeId[] = [];
  // Seed the first 3 with unique biomes for variety.
  const pool = [...BIOME_IDS];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = rng.int(0, pool.length - 1);
    ids.push(pool[idx]);
    pool.splice(idx, 1);
  }
  // Fill remainder with weighted random (can repeat).
  while (ids.length < seedCount) {
    ids.push(rng.pick(BIOME_IDS));
  }
  // Shuffle so the "unique 3" aren't always the first 3 seed points.
  for (let i = ids.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}
