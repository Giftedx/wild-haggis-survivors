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

export type BiomeId = 'bog' | 'loch' | 'pine' | 'heather' | 'coastal' | 'haar' | 'frost' | 'cairngorm' | 'glen_coe' | 'clyde_shipyard';
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
  | 'clydeRivets';

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
} as const;

export const BIOME_IDS: readonly BiomeId[] = ['bog', 'loch', 'pine', 'heather', 'coastal', 'haar', 'frost', 'cairngorm', 'glen_coe', 'clyde_shipyard'];

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
