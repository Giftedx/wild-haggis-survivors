/** Game-wide constants. Tweak these to tune the entire game. */

export const GAME = {
  /** World dimensions in game units */
  WORLD_WIDTH: 3000,
  WORLD_HEIGHT: 3000,

  /** Target canvas size (scales to fit viewport) */
  WIDTH: 800,
  HEIGHT: 600,

  /** Physics */
  PHYSICS_DEBUG: false,
} as const;

export const PLAYER = {
  /** Base movement speed (pixels/sec) */
  SPEED: 200,

  /** Clockwise drift applied to movement vector (degrees per frame).
   *  5° is subtle but noticeable — you veer ~1 tile over a few seconds.
   *  Enough to reward clockwise kiting without making basic movement frustrating. */
  DRIFT_DEGREES: 5,

  /** Starting HP */
  MAX_HP: 100,

  /** Growth per level (multiplier on base scale) */
  GROWTH_PER_LEVEL: 0.05,

  /** Max scale multiplier (2x starting size) */
  MAX_SCALE: 2.0,

  /** Drift reduction per level (percentage) */
  DRIFT_REDUCTION_PER_LEVEL: 0.01,

  /** Speed reduction per level (percentage) */
  SPEED_REDUCTION_PER_LEVEL: 0.01,

  /** Base pickup radius for XP gems */
  PICKUP_RADIUS: 60,
} as const;

export const XP = {
  /** Base XP needed for level 2 */
  BASE_REQUIREMENT: 10,

  /** Multiplier per level (exponential curve) */
  SCALING_FACTOR: 1.15,

  /** Maximum player level */
  MAX_LEVEL: 30,

  /** Number of upgrade cards shown on level-up */
  CARDS_PER_LEVEL: 3,
} as const;

export const ENEMIES = {
  /** Max concurrent active enemies on screen */
  MAX_ACTIVE: 400,

  /** Spawn distance from camera edge (pixels outside view) */
  SPAWN_BUFFER: 80,

  /** HP scaling per minute of game time (percentage) */
  HP_SCALE_PER_MINUTE: 0.05,
} as const;

export const COLORS = {
  /** Highland palette */
  GRASS: 0x2d5a27,
  HEATHER: 0x6b3fa0,
  STONE: 0x7a6e5d,
  SKY: 0x4a7fb5,

  /** UI */
  WHISKY_GOLD: 0xd4a017,
  SCOTTISH_BLUE: 0x005eb8,
  HP_RED: 0xcc3333,
  XP_BAR: 0xd4a017,

  /** Card rarity borders */
  COMMON: 0x888888,
  UNCOMMON: 0x44aa44,
  RARE: 0x4488dd,
  LEGENDARY: 0xddaa00,

  /** Background */
  BG_DARK: 0x1a1a2e,
} as const;
