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

export type EnemyBehavior = 'chase' | 'swarm' | 'tank' | 'dive' | 'ranged' | 'hazard';

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
  terrier: {
    key: 'terrier',
    texture: 'terrier',
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
};

export function getAvailableEnemyTypes(gameTimeSec: number): EnemyConfig[] {
  return Object.values(ENEMY_TYPES).filter(e => gameTimeSec >= e.appearsAt);
}

/**
 * Get a spawn weight for an enemy type based on game time.
 * Newer enemies are weighted higher; early enemies fade out over time.
 * Returns a weight >= 1 (never fully removes enemies, just makes them rare).
 */
export function getSpawnWeight(config: EnemyConfig, gameTimeSec: number): number {
  const timeSinceAppear = gameTimeSec - config.appearsAt;
  // Weight decays over 10 minutes after the enemy type first appears
  // Fresh enemies: weight ~10, old enemies: weight ~1
  return Math.max(1, 10 - timeSinceAppear / 60);
}

// ── Boss definitions ──

export interface BossConfig {
  key: string;
  name: string;
  warningText: string;
  spawnTimeSec: number;
  texture: string;
  speed: number;
  hp: number;
  damage: number;
  xpValue: number;
  scale: number;
}

export const BOSSES: BossConfig[] = [
  {
    key: 'gordon',
    name: 'Gordon the Chef',
    warningText: 'A CHEF APPROACHES!',
    spawnTimeSec: 300,     // 5:00
    texture: 'boss',
    speed: 100,
    hp: 150,
    damage: 20,
    xpValue: 25,
    scale: 2.0,
  },
  {
    key: 'tour_bus',
    name: 'The Tour Bus',
    warningText: 'THE TOUR BUS IS COMING!',
    spawnTimeSec: 600,     // 10:00
    texture: 'boss',
    speed: 50,
    hp: 400,
    damage: 25,
    xpValue: 50,
    scale: 2.5,
  },
  {
    key: 'the_laird',
    name: 'The Laird',
    warningText: 'THE LAIRD HAS ARRIVED!',
    spawnTimeSec: 900,     // 15:00
    texture: 'boss',
    speed: 80,
    hp: 600,
    damage: 30,
    xpValue: 75,
    scale: 2.2,
  },
  {
    key: 'hunter_general',
    name: 'The Haggis Hunter General',
    warningText: 'THE HUNTER GENERAL APPROACHES!',
    spawnTimeSec: 1200,    // 20:00
    texture: 'boss',
    speed: 90,
    hp: 800,
    damage: 35,
    xpValue: 100,
    scale: 2.3,
  },
  {
    key: 'taxman',
    name: 'Death (The Taxman)',
    warningText: 'THE TAXMAN COMETH!',
    spawnTimeSec: 1500,    // 25:00
    texture: 'boss',
    speed: 130,
    hp: 1500,
    damage: 50,
    xpValue: 200,
    scale: 3.0,
  },
];
