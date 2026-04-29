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
 */
import type { BiomeId } from './biomes';

export type HazardKey =
  | 'peat_pit'
  | 'falling_slate'
  | 'burn_water'
  | 'loose_scree'
  | 'tidal_wrack';

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
};

/** All hazard keys, in catalog order. */
export const HAZARD_KEYS: readonly HazardKey[] = [
  'peat_pit',
  'falling_slate',
  'burn_water',
  'loose_scree',
  'tidal_wrack',
];
