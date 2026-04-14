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
  /** Base XP needed for level 2. Bumped 10 → 12 to stop the L2 instant-ding.*/
  BASE_REQUIREMENT: 12,

  /** Multiplier per level (exponential curve). 1.15 → 1.17 makes the
   *  mid-game ramp slightly steeper without pushing L30 out of reach. */
  SCALING_FACTOR: 1.17,

  /** Maximum player level */
  MAX_LEVEL: 30,

  /** Number of upgrade cards shown on level-up */
  CARDS_PER_LEVEL: 3,

  /**
   * At max level, XP from gems and scripted grants converts to run gold
   * instead of vanishing — keeps the bar meaningful through the finale.
   * Applied as floor(xpValue * ratio); minimum 1 gold when xpValue >= 1.
   */
  OVERFLOW_XP_TO_GOLD_RATIO: 0.32,
} as const;

export const ENEMIES = {
  /** Max concurrent active enemies on screen */
  MAX_ACTIVE: 400,

  /** Spawn distance from camera edge (pixels outside view) */
  SPAWN_BUFFER: 80,

  /** HP scaling per minute of game time (percentage).
   *  Rebalanced 0.05 → 0.08: player damage scales via level-ups + weapon
   *  levels + passives at roughly 5-8× by minute 25, while enemy HP was
   *  only scaling to 2.25×. Late game was trivial. New scale brings min-25
   *  enemy HP to 3.0×, keeping pressure without being unfair. */
  HP_SCALE_PER_MINUTE: 0.08,
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
