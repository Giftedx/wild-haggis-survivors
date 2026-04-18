/**
 * Enemy type definitions — stats, timing, and behavior.
 *
 * Behavior types:
 *  - 'chase':   Walk directly toward player (default)
 *  - 'swarm':   Fast, low HP, spawns in packs
 *  - 'tank':    Very slow, very high HP, pushes through
 *  - 'dive':    Charges from off-screen in a straight line at high speed
 *  - 'ranged':  Maintains distance, fires a slowing projectile
 *  - 'hazard':  Static, invincible, damages on contact
 */

export type EnemyBehavior =
  | 'chase'
  | 'swarm'
  | 'tank'
  | 'dive'
  | 'ranged'
  | 'hazard'
  | 'orbit'
  | 'flee'
  | 'spawner'
  | 'phase'
  | 'flank';

export interface EnemyConfig {
  key: string;
  texture: string;
  speed: number;
  hp: number;
  damage: number;
  xpValue: number;
  /** Game time in seconds when this enemy type starts spawning */
  appearsAt: number;
  behavior: EnemyBehavior;
  /** How many spawn per burst (swarmers spawn more) */
  packSize: number;
  /** When true, never spatial-cull physics/AI (dense off-screen swarms). */
  spatialCullImmune?: boolean;
}

export const ENEMY_TYPES: Record<string, EnemyConfig> = {
  tourist: {
    key: 'tourist',
    texture: 'tourist',
    speed: 60,
    hp: 3,
    damage: 5,
    xpValue: 1,
    appearsAt: 0,
    behavior: 'chase',
    packSize: 1,
  },
  chef: {
    key: 'chef',
    texture: 'chef',
    speed: 80,
    hp: 5,
    damage: 8,
    xpValue: 2,
    appearsAt: 90,     // 1:30
    behavior: 'chase',
    packSize: 1,
  },
  midge: {
    key: 'midge',
    texture: 'midge',
    speed: 130,
    hp: 2,
    damage: 3,
    xpValue: 1,
    appearsAt: 180,    // 3:00
    behavior: 'swarm',
    packSize: 5,
  },
  highland_cow: {
    key: 'highland_cow',
    texture: 'highland_cow',
    speed: 30,
    hp: 40,
    damage: 15,
    xpValue: 5,
    appearsAt: 300,    // 5:00
    behavior: 'tank',
    packSize: 1,
  },
  eagle: {
    key: 'eagle',
    texture: 'eagle',
    speed: 250,
    hp: 4,
    damage: 10,
    xpValue: 2,
    appearsAt: 420,    // 7:00
    behavior: 'dive',
    packSize: 1,
  },
  haggis_hunter: {
    key: 'haggis_hunter',
    texture: 'haggis_hunter',
    speed: 50,
    hp: 15,
    damage: 6,
    xpValue: 3,
    appearsAt: 600,    // 10:00
    behavior: 'ranged',
    packSize: 1,
  },
  angry_scotsman: {
    key: 'angry_scotsman',
    texture: 'angry_scotsman',
    speed: 110,
    hp: 25,
    damage: 12,
    xpValue: 5,
    appearsAt: 780,    // 13:00
    behavior: 'chase',
    packSize: 1,
  },
  deep_fryer: {
    key: 'deep_fryer',
    texture: 'deep_fryer',
    speed: 0,
    hp: 9999,
    damage: 20,
    xpValue: 0,
    appearsAt: 900,    // 15:00
    behavior: 'hazard',
    packSize: 1,
  },
  piper: {
    key: 'piper',
    texture: 'piper',
    speed: 70,
    hp: 20,
    damage: 4,
    xpValue: 8,
    appearsAt: 480,    // 8:00
    behavior: 'orbit',
    packSize: 1,
  },
  berserker: {
    key: 'berserker',
    texture: 'angry_scotsman',
    speed: 80,
    hp: 35,
    damage: 15,
    xpValue: 6,
    appearsAt: 840,    // 14:00
    behavior: 'chase',
    packSize: 1,
  },
  ghost: {
    key: 'ghost',
    texture: 'ghost',
    speed: 70,
    hp: 25,        // buffed from 8 — was too fragile to matter at 9:00
    damage: 8,
    xpValue: 4,
    appearsAt: 540,    // 9:00
    behavior: 'phase',
    packSize: 1,
  },
  nest: {
    key: 'nest',
    texture: 'nest',
    speed: 0,
    hp: 80,        // buffed from 30 — was dying before first spawn tick
    damage: 0,
    xpValue: 10,
    appearsAt: 660,    // 11:00
    behavior: 'spawner',
    packSize: 1,
  },
  sheep: {
    key: 'sheep',
    texture: 'sheep',
    speed: 90,
    hp: 1,
    damage: 2,
    xpValue: 1,
    appearsAt: 240,    // 4:00
    behavior: 'flee',
    packSize: 4,
  },
  kelpie: {
    key: 'kelpie',
    texture: 'kelpie',
    speed: 155,
    hp: 8,
    damage: 7,
    xpValue: 2,
    appearsAt: 300,    // 5:00 — water-horse skirmisher
    behavior: 'flank',
    packSize: 1,
  },
  midgie_swarm: {
    key: 'midgie_swarm',
    texture: 'midgie_swarm',
    speed: 95,
    hp: 1,
    damage: 1,
    xpValue: 1,
    appearsAt: 450,    // 7:30 — biting cloud (always simulated off-camera)
    behavior: 'swarm',
    packSize: 16,
    spatialCullImmune: true,
  },
  // Urban Ghaists family opener — DESIGN_IDEAS section 3. On death the
  // dropped bottle breaks into a slick patch that slows the player
  // (handled in EnemyKillHandler + HazardZones.spawnBottleSlick).
  buckfast_ned: {
    key: 'buckfast_ned',
    texture: 'buckfast_ned',
    speed: 100,
    hp: 18,
    damage: 8,
    xpValue: 4,
    appearsAt: 720,    // 12:00 — streets turn on you past the kirkyard
    behavior: 'chase',
    packSize: 1,
  },
  // Urban Ghaists #3 — DESIGN_IDEAS section 3. Victorian ghost-tour
  // guide that keeps its distance and lobs projectiles. Ranged
  // behavior is already wired — the flavor carries through the sprite
  // + name + i18n line; the "narrates as a damage source" beat from
  // the idea bullet is served by the tour-guide silhouette + ranged
  // telegraph, not a new caption system (YAGNI until a surface wants
  // it).
  edinburgh_ghost_guide: {
    key: 'edinburgh_ghost_guide',
    texture: 'edinburgh_ghost_guide',
    speed: 55,
    hp: 22,
    damage: 10,
    xpValue: 5,
    appearsAt: 810,    // 13:30 — just past angry_scotsman, before berserker
    behavior: 'ranged',
    packSize: 1,
  },
  // Urban Ghaists #2 — DESIGN_IDEAS section 3. Static roadworks totem:
  // stands still (chase behaviour at speed 0 so the damage path stays
  // shared with normal enemies), but when killed bursts into four slick
  // patches at the cardinals. Higher HP + contact damage than the ned
  // to reward deliberate targeting.
  traffic_cone_totem: {
    key: 'traffic_cone_totem',
    texture: 'traffic_cone_totem',
    speed: 0,
    hp: 45,
    damage: 12,
    xpValue: 6,
    appearsAt: 870,    // 14:30 — roadworks close in as the run tightens
    behavior: 'chase',
    packSize: 1,
  },
};

/**
 * Display-name map for enemy keys — used by the death-reflection panel and
 * any UI surface that needs to render an enemy key as a warm, readable name.
 * Keep voice-appropriate (Voice Card) — e.g. "Tour Bus" rather than "tour_bus",
 * "Haggis Hunter" rather than "haggis_hunter". Unknown keys fall back to
 * title-casing the key with underscores → spaces.
 */
const ENEMY_DISPLAY_NAMES: Record<string, string> = {
  tourist: 'Tourist',
  chef: 'Chef',
  midge: 'Highland Midge',
  highland_cow: 'Highland Cow',
  eagle: 'Eagle',
  haggis_hunter: 'Haggis Hunter',
  angry_scotsman: 'Angry Scotsman',
  deep_fryer: 'Deep Fryer',
  piper: 'Piper',
  berserker: 'Berserker',
  ghost: 'Ghost',
  nest: 'Nest',
  sheep: 'Sheep',
  kelpie: 'Kelpie',
  midgie_swarm: 'Midgie Swarm',
  buckfast_ned: 'Buckfast Ned',
  traffic_cone_totem: 'Traffic Cone Totem',
  edinburgh_ghost_guide: 'Edinburgh Ghost Guide',
  // Bosses
  gordon: 'Gordon the Chef',
  tour_bus: 'Tour Bus',
  the_laird: 'The Laird',
  hunter_general: 'Haggis Hunter General',
  taxman: 'Taxman',
};

export function getEnemyDisplayName(key: string): string {
  const known = ENEMY_DISPLAY_NAMES[key];
  if (known) return known;
  // Fallback: replace underscores and title-case each word.
  return key
    .split('_')
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

export function getAvailableEnemyTypes(gameTimeSec: number): EnemyConfig[] {
  return Object.values(ENEMY_TYPES).filter(e => gameTimeSec >= e.appearsAt);
}

/** Resolve spawn director keys to configs (unknown keys skipped). */
export function getEnemyConfigsByKeys(keys: readonly string[]): EnemyConfig[] {
  const out: EnemyConfig[] = [];
  for (const k of keys) {
    const c = ENEMY_TYPES[k];
    if (c) out.push(c);
  }
  return out;
}

/**
 * Get a spawn weight for an enemy type based on game time.
 * Newer enemies are weighted higher; early enemies fade out over time.
 * Floor of 3 so old enemies remain a chunk of late-game variety (tourists
 * at minute 20 are actually dangerous thanks to HP scaling, and always
 * spawning the newest enemy type was making late game monotonous).
 */
export function getSpawnWeight(config: EnemyConfig, gameTimeSec: number): number {
  const timeSinceAppear = gameTimeSec - config.appearsAt;
  // Weight decays over ~7 minutes after the enemy type first appears:
  //   BASE_WEIGHT   = 10  (fresh enemy)
  //   MIN_WEIGHT    = 3   (old enemy — was 1, too low, removed them from the pool)
  //   DECAY_DIVISOR = 42  (10 - 420/42 = 0 hits floor around 7 minutes)
  // Future tuning pass may promote these to BALANCE.enemy.*_WEIGHT.
  const BASE_WEIGHT = 10;
  const MIN_WEIGHT = 3;
  const DECAY_DIVISOR = 42;
  return Math.max(MIN_WEIGHT, BASE_WEIGHT - timeSinceAppear / DECAY_DIVISOR);
}

// ── Boss definitions ──

export interface BossConfig {
  key: string;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  nameKey: string;
  /** i18n dot-path — resolved with `t(warningKey)` at show time */
  warningKey: string;
  spawnTimeSec: number;
  texture: string;
  speed: number;
  hp: number;
  damage: number;
  xpValue: number;
  scale: number;
}

// Boss HP rebalanced ~×6 from launch values. Evolved weapon builds were
// melting bosses in <5 seconds because player DPS outpaced these numbers
// badly. Target kill time is now 20-40 seconds — enough for the fight to
// feel like a fight instead of a cutscene. NOTE: bosses bypass the regular
// HP_SCALE_PER_MINUTE formula; instead, SpawnSystem applies a separate
// time-based scaler (+0.2% per second after minute 5) so these base
// numbers are the minimum HP — actual HP grows with game time.
export const BOSSES: BossConfig[] = [
  {
    key: 'gordon',
    nameKey: 'boss.gordon.name',
    warningKey: 'ui.bossWarning.gordon',
    spawnTimeSec: 300,     // 5:00
    texture: 'boss_gordon',
    speed: 100,
    hp: 500,
    damage: 20,
    xpValue: 25,
    scale: 2.0,
  },
  {
    key: 'tour_bus',
    nameKey: 'boss.tour_bus.name',
    warningKey: 'ui.bossWarning.tour_bus',
    spawnTimeSec: 600,     // 10:00
    texture: 'boss_tour_bus',
    speed: 50,
    hp: 2000,
    damage: 25,
    xpValue: 50,
    scale: 2.5,
  },
  {
    key: 'the_laird',
    nameKey: 'boss.the_laird.name',
    warningKey: 'ui.bossWarning.the_laird',
    spawnTimeSec: 900,     // 15:00
    texture: 'boss_laird',
    speed: 80,
    hp: 3500,
    damage: 30,
    xpValue: 75,
    scale: 2.2,
  },
  {
    key: 'hunter_general',
    nameKey: 'boss.hunter_general.name',
    warningKey: 'ui.bossWarning.hunter_general',
    spawnTimeSec: 1200,    // 20:00
    texture: 'boss_hunter_general',
    speed: 90,
    hp: 5500,
    damage: 35,
    xpValue: 100,
    scale: 2.3,
  },
  {
    key: 'taxman',
    nameKey: 'boss.taxman.name',
    warningKey: 'ui.bossWarning.taxman',
    spawnTimeSec: 1500,    // 25:00
    texture: 'boss_taxman',
    speed: 130,
    hp: 10000,
    damage: 50,
    xpValue: 200,
    scale: 3.0,
  },
];
