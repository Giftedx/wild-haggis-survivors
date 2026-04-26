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

  /**
   * Post-cap echo cards — XP accumulated past MAX_LEVEL triggers an
   * echo card pick when this threshold is crossed. Overflow still
   * converts to gold on the same XP (echoes + gold are both paid).
   * Tuned to ~1 echo per 30-60s in the late game (kill density feeds
   * the buffer at ~20-40 XP/sec). Smaller value = more echoes per run;
   * larger value = rarer choices. See `src/data/upgrades.ts#ECHO_CARDS`.
   */
  ECHO_XP_THRESHOLD: 1000,
} as const;

export const ENEMIES = {
  /** Max concurrent active enemies on screen */
  MAX_ACTIVE: 400,

  /** Spawn distance from camera edge (pixels outside view) */
  SPAWN_BUFFER: 80,

  /** HP scaling per minute of game time (percentage).
   *  Rebalanced 0.05 → 0.08 → 0.10: player damage scales to 5-8× by
   *  minute 25 via level-ups + weapon levels + passives. Playtester
   *  feedback (2026-04-21): reaching lvl 30 at ~5min leaves the back
   *  half of the run feeling AFK because enemies don't keep up. At
   *  0.10, min-25 enemy HP is 3.5× (was 3.0×) and the late-game
   *  pressure is noticeable without being unfair on early levels. */
  HP_SCALE_PER_MINUTE: 0.10,
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
  /** U1 Rune tier — carved-stone mauve, sits between rare (blue) and
   *  legendary (gold) on the rarity spectrum. */
  RUNE: 0x8c7aa0,
  /** Phase B Endless — Mythic tier (Overcharge cards). Spectral purple
   *  ramping into hot pink — visually distinct from RUNE (mauve) so the
   *  two tiers don't compete on the rarity spectrum. */
  MYTHIC: 0xff66cc,

  /** Background */
  BG_DARK: 0x1a1a2e,

  /** Primary panel/container background — menus, overlays, card
   *  backdrops. Unifies the 8 ad-hoc dark-navy values that drifted
   *  across scenes. */
  PANEL: 0x111728,
  /** Secondary surface — card interiors, list rows, tile fills.
   *  Slightly lighter than PANEL for layered depth. */
  PANEL_SURFACE: 0x1a1a28,

  /** Sprite art red — slightly cooler than HP_RED, used for clothing /
   *  armour across angryScotsman, hunterGeneral, deepFryer, chest, and
   *  the boss HP bar fill. Kept distinct from HP_RED (UI health bars)
   *  so art palette and HUD palette can evolve independently. */
  SPRITE_RED: 0xcc2222,

  /** Toast / achievement overlay gold — warm highlight for transient
   *  notifications (act intermission titles, achievement pops, event
   *  bus toasts). */
  TOAST_GOLD: 0xffdd88,

  /** Danger-flash red — damage vignette, low-FPS indicator, HP-crit
   *  feedback. Brighter and more saturated than HP_RED so it punches
   *  through particle noise. */
  DANGER_RED: 0xff4444,

  /** Full-screen overlay dimming — level-up, pause, death, act
   *  intermission. One value for every overlay in the game. */
  OVERLAY_DIM: 0x000000,

  /** Bright gold — crits, legendary particles, evolution beams. */
  CRIT_GOLD: 0xffdd44,
  /** Reward gold — pickup toasts, boss ring secondary, chest collect. */
  REWARD_GOLD: 0xffcc44,
  /** Positive green — weapon acquire, heal, health orb. */
  POSITIVE_GREEN: 0x44dd44,
  /** Combo amber — warm combo counter tier (20–49). */
  COMBO_AMBER: 0xe8a830,
} as const;

export const UI = {
  /** Overlay backdrop alpha — all full-screen dimming overlays.
   *  Pre-fix value (0.82) let the bright kill-streak banner, banter
   *  bubbles, and active toasts bleed visibly through pause / level-up /
   *  intermission / game-over. 0.94 hides everything below it but still
   *  leaves enough sight of the gameplay layer to anchor the overlay. */
  OVERLAY_ALPHA: 0.94,
  /** High-contrast overlay alpha. */
  OVERLAY_ALPHA_HC: 0.98,
} as const;

/**
 * CSS-string forms of the palette for Phaser text `color:` fields, which
 * want `#RRGGBB` not `0xRRGGBB`. Mirrors the hex palette above so a tweak
 * to `COLORS.WHISKY_GOLD` carries through to every gold text label on
 * the next reload — no hand-sync of parallel string literals.
 */
export const COLORS_CSS = {
  WHISKY_GOLD: '#d4a017',
  WHITE: '#ffffff',
  /** Pure black. Used by the small-text strokes that don't want the
   *  warm INK shift — damage numbers, combo text, tutorial tips,
   *  caption overlay, etc. Deliberately distinct from `INK`. */
  BLACK: '#000000',
  /** Near-black ink — used by every bold title stroke (BootScene, PauseMenu,
   *  JuiceSystem). Kept as a separate value (not `#000`) because the subtle
   *  warm shift reads better over the moor-blue backdrop. */
  INK: '#0a0a14',
  /** CSS mirror of COLORS.BG_DARK, for Phaser's top-level `backgroundColor`
   *  config (which wants a CSS string). Change the number in COLORS to
   *  recolour, and update this twin — `colorsCss.test.ts` enforces sync. */
  BG_DARK: '#1a1a2e',
  /** CSS mirror of COLORS.HP_RED — used by the death-panel title so a
   *  recolour of the HP red carries through to the game-over gravitas hue. */
  HP_RED: '#cc3333',
  SPRITE_RED: '#cc2222',
  TOAST_GOLD: '#ffdd88',
  DANGER_RED: '#ff4444',
  LEGENDARY: '#ddaa00',
  /** Warm tan — tertiary button text, HUD secondary info, card body. */
  WARM_TAN: '#e8d4a0',
  /** Dusty tan — subdued body text, stats, descriptions. */
  DUSTY_TAN: '#b8a88a',
  /** Hint grey — de-emphasized labels, placeholders. */
  HINT: '#6a7390',
  /** Cool grey — neutral body text on dark panels. */
  COOL_GREY: '#c8d0e0',

  /** Bright gold for CSS contexts — crits, legendary moments. */
  CRIT_GOLD: '#ffdd44',
  /** Reward gold for CSS contexts — pickup/milestone toasts. */
  REWARD_GOLD: '#ffcc44',
  /** Positive green for CSS contexts — weapon acquire, heal. */
  POSITIVE_GREEN: '#44dd44',
  /** Combo amber for CSS contexts — combo 20+ tier. */
  COMBO_AMBER: '#e8a830',

  // ── Text gray family (cool-blue grays for body text / labels) ──

  /** Brightest body text — bold titles, emphasis headings. */
  TEXT_BRIGHT: '#e4e9f0',
  /** Standard body text — default paragraph color. */
  TEXT_PRIMARY: '#c4cdd8',
  /** Secondary labels — less prominent info. */
  TEXT_SECONDARY: '#9ea8bb',
  /** De-emphasized info — tertiary context. */
  TEXT_MUTED: '#8a93a8',
  /** Italic subtitles — scene context, timestamps. */
  TEXT_SUBTITLE: '#7f8ca7',
  /** Footer / fine print — dimmest readable text. */
  TEXT_DIM: '#596780',

  // ── Semantic accent families ──

  /** Curse text — death banners, curse labels. */
  CURSE_MAUVE: '#c8a0a0',
  /** Curse emphasis — bright mauve for active curse display. */
  CURSE_MAUVE_BRIGHT: '#e8a0c6',
  /** Victory / unlock green. */
  VICTORY_GREEN: '#77c977',
  /** Warm label tan — stat labels in GameOver. */
  LABEL_TAN: '#b69643',
  /** Status/copyright tan — muted informational text. */
  STATUS_TAN: '#8a7a6a',
} as const;
