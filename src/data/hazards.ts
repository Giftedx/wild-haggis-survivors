/**
 * Hazards — environmental dangers placed in the world by biome.
 *
 * Pure data, no Phaser. Each entry maps to a validator-locked sprite
 * key baked in BootScene; the runtime `HazardsSystem` consumes this
 * catalog at spawn time. Damage is applied to the player on overlap
 * (NOT enemies) — these are footing hazards, not combat.
 *
 * Biome routing:
 *   peat_pit       → bog       (camouflaged hole, slow lingering)
 *   falling_slate  → pine      (mountain forest, brief deadly slab)
 *   burn_water     → loch      (water-adjacent rapids, lingers long)
 *   loose_scree    → heather   (Highland uplands, slipping chips)
 *   tidal_wrack    → coastal   (kelp tangle, low chip on lingering)
 *   slick_cobble   → haar      (fog-condensed wet stones, slip chip)
 *   rime_patch     → frost     (frost-bound stone, cold chip)
 *
 * Tuning rationale:
 *   - peat_pit: medium damage (8), medium hitbox (16 px), longest sit
 *     of the bog hazards (12 s) — you walk into it, you take a hit.
 *   - falling_slate: highest damage (12), tightest hitbox (10 px), very
 *     short lifetime (4 s) — telegraphed slab that hits and is gone.
 *   - burn_water: lowest damage (4), widest hitbox (18 px), longest
 *     lifetime (18 s) — chip damage, easy to wade out of.
 *   - loose_scree: low-mid damage (5), mid hitbox (14 px), 8 s lifetime
 *     — slipping mountain chips that scatter then settle.
 *   - tidal_wrack: low damage (4, tied with burn_water), wide hitbox
 *     (20 px), long lifetime (15 s) — tangle of kelp the tide left; chip
 *     on stationary loiter, mirrors burn_water but coastline-flavoured.
 *   - slick_cobble: low-mid damage (5), mid hitbox (14 px), 10 s lifetime
 *     — fog condenses on stones; the slip is a hidden tax in low
 *     visibility. Same damage as loose_scree but slipperier-feeling
 *     because the haar already cuts your readout.
 *   - rime_patch: low-mid damage (5), mid hitbox (16 px), 11 s lifetime
 *     — frost-bound stone with crystal bloom. Charter §4.4 originally
 *     wanted HP-conditional cold tick; HazardsSystem doesn't support
 *     conditional gates, so dropped to flat chip with biome-wide
 *     `frostBite` modifier (-25% speed) carrying the frost tax.
 */
import type { BiomeId } from './biomes';

export type HazardKey =
  | 'peat_pit'
  | 'falling_slate'
  | 'burn_water'
  | 'loose_scree'
  | 'tidal_wrack'
  | 'slick_cobble'
  | 'rime_patch'
  // Highland Horrors drop — new plateau + glen hazards.
  | 'wind_shear'
  | 'highland_mist'
  // Clyde Shipyard — molten runoff from the dry-docks.
  | 'molten_slag'
  // Black Bog — near-black standing peat water; wide chip hazard.
  | 'ink_pool'
  // Ben Nevis Summit — sudden rotor gust pocket on the exposed plateau.
  | 'summit_gust'
  // Glasgow Close — Buckfast bottle-pool on the close flagstones.
  | 'buckfast_pool'
  // Fingal's Cave — fractured basalt column crack underfoot.
  | 'basalt_crack'
  // Callanish Standing Stones — alignment energy ring, brief and sharp.
  | 'stone_ring'
  // Trossachs Forest — exposed root trip across the deer trail.
  | 'root_trip'
  // Edinburgh Old Town — loose cobblestone gap on the Royal Mile.
  | 'cobble_gap'
  // Cairngorm Woods — fallen Caledonian pine trunk across the trail.
  | 'fallen_pine'
  // Orkney Neolithic — toppled standing slab on the windswept machair.
  | 'standing_slab'
  // B9 — Corryvreckan strait — sudden surge from the whirlpool's outer rotor.
  | 'corry_maelstrom'
  // B9 — Shetland Voe — abrupt squall off the clifftop.
  | 'shetland_squall'
  // B9 — Skye Fairy Pools — enchanted mist drifting up from the mineral pools.
  | 'fairy_mist'
  // Hebridean Shore — kelp ribbon left by the tide; slick underfoot.
  | 'kelp_strand';

export interface HazardDef {
  readonly key: HazardKey;
  /** Validator-locked texture baked in BootScene. */
  readonly texture: string;
  /** Biome that gates spawning — system skips if mismatch. */
  readonly biome: BiomeId;
  /** Damage applied to player on overlap. */
  readonly damage: number;
  /** Square-distance compare radius in pixels. */
  readonly hitboxRadius: number;
  /** How long the hazard sits in the world before despawning. */
  readonly lifetimeMs: number;
  /** Approximate cadence between hazard spawns when this biome is active. */
  readonly spawnIntervalMs: number;
}

export const HAZARDS: Readonly<Record<HazardKey, HazardDef>> = {
  peat_pit: {
    key: 'peat_pit',
    texture: 'hazard_peat_pit',
    biome: 'bog',
    damage: 8,
    hitboxRadius: 16,
    lifetimeMs: 12000,
    spawnIntervalMs: 9000,
  },
  falling_slate: {
    key: 'falling_slate',
    texture: 'hazard_falling_slate',
    biome: 'pine',
    damage: 12,
    hitboxRadius: 10,
    lifetimeMs: 4000,
    spawnIntervalMs: 11000,
  },
  burn_water: {
    key: 'burn_water',
    texture: 'hazard_burn_water',
    biome: 'loch',
    damage: 4,
    hitboxRadius: 18,
    lifetimeMs: 18000,
    spawnIntervalMs: 10000,
  },
  loose_scree: {
    key: 'loose_scree',
    texture: 'hazard_loose_scree',
    biome: 'heather',
    damage: 5,
    hitboxRadius: 14,
    lifetimeMs: 8000,
    spawnIntervalMs: 8500,
  },
  tidal_wrack: {
    key: 'tidal_wrack',
    texture: 'hazard_tidal_wrack',
    biome: 'coastal',
    damage: 4,
    hitboxRadius: 20,
    lifetimeMs: 15000,
    spawnIntervalMs: 9500,
  },
  slick_cobble: {
    key: 'slick_cobble',
    texture: 'hazard_slick_cobble',
    biome: 'haar',
    damage: 5,
    hitboxRadius: 14,
    lifetimeMs: 10000,
    spawnIntervalMs: 9000,
  },
  rime_patch: {
    key: 'rime_patch',
    texture: 'hazard_rime_patch',
    biome: 'frost',
    damage: 5,
    hitboxRadius: 16,
    lifetimeMs: 11000,
    spawnIntervalMs: 9500,
  },
  // Highland Horrors — Cairngorm Plateau hazard.
  // A sudden gust that scythes across the exposed top — rotor turbulence.
  // High damage (10), small hitbox (12 px), short lifetime (4500ms) — a
  // beat longer than falling_slate (the gust passes fast but lingers
  // slightly more than a telegraphed slab).
  wind_shear: {
    key: 'wind_shear',
    texture: 'hazard_wind_shear',
    biome: 'cairngorm',
    damage: 10,
    hitboxRadius: 12,
    lifetimeMs: 4500,
    spawnIntervalMs: 8000,
  },
  // Highland Horrors — Glen Coe hazard.
  // Low river mist settling in the valley floor. Wide, soft, lingers.
  // Chip damage (4, tied with burn_water and tidal_wrack — atmosphere,
  // not punishment) but it lingers long enough that standing still
  // in the glen pays for it.
  highland_mist: {
    key: 'highland_mist',
    texture: 'hazard_highland_mist',
    biome: 'glen_coe',
    damage: 4,
    hitboxRadius: 22,
    lifetimeMs: 14000,
    spawnIntervalMs: 10500,
  },
  // Clyde Shipyard — molten slag pool from the dry-dock floor.
  // Highest damage in the catalog (14) — liquid metal runoff; no safe
  // stepping. Tight hitbox (13 px) and shorter lifetime (5 s) so it's
  // a quick punish, not a wallowing bog. Ten-second interval gives room
  // to dodge between spawns. Pairs with Steam Engine's industrial theme.
  molten_slag: {
    key: 'molten_slag',
    texture: 'hazard_molten_slag',
    biome: 'clyde_shipyard',
    damage: 14,
    hitboxRadius: 13,
    lifetimeMs: 5000,
    spawnIntervalMs: 10000,
  },
  // Black Bog — ink pool from the compressed peat.
  // Wide hitbox (22 px) mirrors highland_mist — the pool spreads further
  // than it looks. Long lifetime (14 s) and medium chip (3) — the bog is
  // patient. Pairs with the ×2 drift modifier: disoriented movement keeps
  // the player standing in it longer than they intend to.
  ink_pool: {
    key: 'ink_pool',
    texture: 'hazard_ink_pool',
    biome: 'black_bog',
    damage: 3,
    hitboxRadius: 22,
    lifetimeMs: 14000,
    spawnIntervalMs: 9000,
  },
  // Ben Nevis Summit — sudden gust pocket on the exposed plateau.
  // Compact, fast-moving air column (tight hitbox 11 px) that hits hard (9)
  // and dissolves quickly (4 s). The gust is brief — summit rotors form and
  // dissipate fast. Pairs with the constant benNevisWind drift: the hazard is
  // the sudden spike on top of a steady push.
  summit_gust: {
    key: 'summit_gust',
    texture: 'hazard_summit_gust',
    biome: 'ben_nevis',
    damage: 9,
    hitboxRadius: 11,
    lifetimeMs: 4000,
    spawnIntervalMs: 8500,
  },
  // Glasgow Close — Buckfast bottle-pool on the flagstone close-floor.
  // Amber glass and sticky tonic-wine puddle; medium damage (8), medium
  // hitbox (15 px). 8 s lifetime — it sits on the close-floor long enough
  // to punish a player who isnae paying attention. 9.5 s interval matches
  // tidal_wrack's cadence: not oppressive, but always somewhere underfoot.
  buckfast_pool: {
    key: 'buckfast_pool',
    texture: 'hazard_buckfast_pool',
    biome: 'glasgow_close',
    damage: 8,
    hitboxRadius: 15,
    lifetimeMs: 8000,
    spawnIntervalMs: 9500,
  },
  // Fingal's Cave — fractured basalt column crack underfoot.
  // Medium damage (10), tight hitbox (10 px) — the crack is narrow but the
  // basalt lip catches a hoof cleanly. Medium lifetime (5500 ms) — cracks
  // linger after the column shifts. Calmer interval (9000 ms) than falling
  // slate because cave acoustics warn you first.
  basalt_crack: {
    key: 'basalt_crack',
    texture: 'hazard_basalt_crack',
    biome: 'fingals_cave',
    damage: 10,
    hitboxRadius: 10,
    lifetimeMs: 5500,
    spawnIntervalMs: 9000,
  },
  // Callanish Standing Stones — alignment energy ring.
  // The stones discharge a pulse of ley energy. Medium damage (9), mid
  // hitbox (12 px), medium lifetime (7000 ms — the ring fades slowly).
  // Wider interval (10000 ms) — the stones fire on their own rhythm.
  stone_ring: {
    key: 'stone_ring',
    texture: 'hazard_stone_ring',
    biome: 'callanish',
    damage: 9,
    hitboxRadius: 12,
    lifetimeMs: 7000,
    spawnIntervalMs: 10000,
  },
  // Trossachs Forest — exposed root across the deer trail.
  // Low damage (6), mid hitbox (11 px), medium lifetime (6000 ms).
  // Trip hazard: the root is always there; the haggis just wasn't watching.
  root_trip: {
    key: 'root_trip',
    texture: 'hazard_root_trip',
    biome: 'trossachs',
    damage: 6,
    hitboxRadius: 11,
    lifetimeMs: 6000,
    spawnIntervalMs: 9000,
  },
  // Edinburgh Old Town — loose cobblestone gap on the Royal Mile.
  // Mid damage (8), tight hitbox (9 px — a single missing stone).
  // The close floor is ancient; some stones are missing. Urban chip hazard.
  cobble_gap: {
    key: 'cobble_gap',
    texture: 'hazard_cobble_gap',
    biome: 'edinburgh_old_town',
    damage: 8,
    hitboxRadius: 9,
    lifetimeMs: 5500,
    spawnIntervalMs: 9500,
  },
  // Cairngorm Woods — fallen Caledonian pine trunk blocking the trail.
  // Mid damage (7), wide hitbox (14 px — the trunk is thick).
  // The old pines fall without warning; the forest floor is littered.
  fallen_pine: {
    key: 'fallen_pine',
    texture: 'hazard_fallen_pine',
    biome: 'cairngorm_woods',
    damage: 7,
    hitboxRadius: 14,
    lifetimeMs: 6500,
    spawnIntervalMs: 9500,
  },
  // Orkney — toppled Neolithic standing slab.
  // High damage (10), mid hitbox (12 px), long lifetime (7s).
  // The slabs have been falling for 5000 years. This one just chose now.
  standing_slab: {
    key: 'standing_slab',
    texture: 'hazard_standing_slab',
    biome: 'orkney',
    damage: 10,
    hitboxRadius: 12,
    lifetimeMs: 7000,
    spawnIntervalMs: 10000,
  },
  // B9 — Corryvreckan surge. A sudden wave from the whirlpool's outer
  // rotor — high damage (11), mid hitbox (15 px), medium lifetime (8 s).
  // The wave rolls fast and retreats fast; the danger is the next one.
  corry_maelstrom: {
    key: 'corry_maelstrom',
    texture: 'hazard_corry_maelstrom',
    biome: 'corryvreckan',
    damage: 11,
    hitboxRadius: 15,
    lifetimeMs: 8000,
    spawnIntervalMs: 9000,
  },
  // B9 — Shetland squall. An abrupt cliff-top gust that hits hard and
  // dissolves fast. High damage (10), tight hitbox (12 px), short
  // lifetime (5 s) — the squall arrives without warning and is gone.
  // Paired with shetlandVoe's −10% drift: the squall is the spike.
  shetland_squall: {
    key: 'shetland_squall',
    texture: 'hazard_shetland_squall',
    biome: 'shetland_voe',
    damage: 10,
    hitboxRadius: 12,
    lifetimeMs: 5000,
    spawnIntervalMs: 8500,
  },
  // B9 — Fairy mist. Enchanted mineral mist rising from the Skye pools.
  // Low damage (5), wide hitbox (18 px), long lifetime (14 s) — the
  // mist is not violent; it merely does not let go. Low damage mirrors
  // burn_water and tidal_wrack (chip-on-loiter), but the fairyPoolGlow
  // +25% XP modifier means lingering in it can be a calculated trade.
  fairy_mist: {
    key: 'fairy_mist',
    texture: 'hazard_fairy_mist',
    biome: 'skye_fairy_pool',
    damage: 5,
    hitboxRadius: 18,
    lifetimeMs: 14000,
    spawnIntervalMs: 10000,
  },
  // Hebridean Shore — kelp ribbon left by the tide; slick underfoot. Low
  // chip damage (5), wide hitbox (19 px), long lifetime (15 s). The machair
  // walk is leisurely, the kelp hidden under surf — same loiter penalty as
  // tidal_wrack but wider spread, offset by hebrideanTide's +10% XP bonus.
  kelp_strand: {
    key: 'kelp_strand',
    texture: 'hazard_kelp_strand',
    biome: 'hebridean_shore',
    damage: 5,
    hitboxRadius: 19,
    lifetimeMs: 15000,
    spawnIntervalMs: 10000,
  },
};

/** All hazard keys, in catalog order. */
export const HAZARD_KEYS: readonly HazardKey[] = [
  'peat_pit',
  'falling_slate',
  'burn_water',
  'loose_scree',
  'tidal_wrack',
  'slick_cobble',
  'rime_patch',
  'wind_shear',
  'highland_mist',
  'molten_slag',
  'ink_pool',
  'summit_gust',
  'buckfast_pool',
  'basalt_crack',
  'stone_ring',
  'root_trip',
  'cobble_gap',
  'fallen_pine',
  'standing_slab',
  'corry_maelstrom',
  'shetland_squall',
  'fairy_mist',
  'kelp_strand',
];
