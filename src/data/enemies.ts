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
  /** Opt-in arcade-physics mass override. Defaults follow behaviour
   *  ('tank' → 5, everything else → 1). Useful for signature contact
   *  feel — e.g. gale_wraith's shove pushes the player harder than a
   *  regular chase enemy because the collision resolver respects mass
   *  in the rebound velocity. */
  massOverride?: number;
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
  // Cryptids family opener — DESIGN_IDEAS section 3. Off-screen howl
  // 2 s before dive per the bullet (the "clean telegraph" half of the
  // idea); the howl-timing UX sits in sprite framing + banter layer
  // rather than a new AI state machine, so this ships as a themed
  // dive alt to eagle — same behaviour family, scarier silhouette,
  // later slot in the timeline so the player already knows what a
  // dive feels like.
  barghest: {
    key: 'barghest',
    texture: 'barghest',
    speed: 275,
    hp: 6,
    damage: 14,
    xpValue: 3,
    appearsAt: 570,    // 9:30 — sits after ghost (9:00) and before
                       // haggis_hunter (10:00), long enough past
                       // eagle (7:00) that the dive vocabulary is
                       // trained before the teeth come out.
    behavior: 'dive',
    packSize: 1,
  },
  // Cryptids #2 — DESIGN_IDEAS section 3. Young kelpie; reuses the
  // `flee` behaviour family (same as sheep) but at a faster gait
  // and with higher XP on catch — the "lures with fake pickup
  // glow" half of the idea sits in the shimmer-blue sprite rather
  // than a bait-pickup system (shippable without a new decoy
  // mechanic; lure-pickup stays open for a future drop).
  kelpie_foal: {
    key: 'kelpie_foal',
    texture: 'kelpie_foal',
    speed: 130,
    hp: 4,
    damage: 3,
    xpValue: 4,
    appearsAt: 390,    // 6:30 — after eagle teaches dive; this is the
                       // first cryptid-coded flee target so it slots
                       // before the barghest reveal.
    behavior: 'flee',
    packSize: 3,
  },
  // Cryptids #3 — DESIGN_IDEAS section 3. Slow-moving ocean spirit
  // that keeps distance and lobs a "kenning" projectile. Ships as a
  // themed `ranged` alt to haggis_hunter — the banter-literal-answer
  // reward half of the bullet stays open for a future banter-hook
  // pass; the visual + ranged cadence carries the flavour now.
  blue_man_of_minch: {
    key: 'blue_man_of_minch',
    texture: 'blue_man_of_minch',
    speed: 45,
    hp: 30,
    damage: 11,
    xpValue: 6,
    appearsAt: 630,    // 10:30 — sits between haggis_hunter (10:00)
                       // and nest (11:00); second ranged enemy, so
                       // the player has the projectile-dodge muscle.
    behavior: 'ranged',
    packSize: 1,
  },
  // Weather family opener — DESIGN_IDEAS section 3. "Spawns local fog
  // on death" lands through a new HazardZones patch: fog halves the
  // player's pickup radius while they stand in it (parallel to the
  // slick patch that halves movement). The wraith itself is a frail
  // chase enemy — the fog is the real mechanical beat.
  haar_wraith: {
    key: 'haar_wraith',
    texture: 'haar_wraith',
    speed: 80,
    hp: 12,
    damage: 6,
    xpValue: 4,
    appearsAt: 750,    // 12:30 — sits between buckfast_ned (12:00)
                       // and angry_scotsman (13:00); slot gives the
                       // player time to notice the fog mechanic before
                       // combat density climbs.
    behavior: 'chase',
    packSize: 1,
  },
  // Academic Apparitions — DESIGN_IDEAS section 3. Ceilidh caller is
  // an ethereal dance-master; visually tries to suggest "forces
  // enemies to move in sync" through orbit choreography rather than
  // a new AI state (the sync mechanic stays open for a future drop).
  // Existing orbit behaviour gives the caller a smooth rotation that
  // reads as dance-time.
  ceilidh_caller: {
    key: 'ceilidh_caller',
    texture: 'ceilidh_caller',
    speed: 75,
    hp: 20,
    damage: 9,
    xpValue: 5,
    appearsAt: 645,    // 10:45 — after haggis_hunter + blue_man_of_
                       // minch (both ranged), before nest; the
                       // player's orbit-dodge vocabulary is trained
                       // from piper/ghost by now.
    behavior: 'orbit',
    packSize: 1,
  },
  // Faerie family opener — DESIGN_IDEAS section 3. Seelie (fair)
  // court piper that orbits the player; visual reads "tricksy,
  // rhythmic, sparkle-then-commit" per the family description.
  // Reuses the existing `orbit` behaviour (same AI as piper), so
  // the ship is sprite + stats + timeline slot.
  seelie_piper: {
    key: 'seelie_piper',
    texture: 'seelie_piper',
    speed: 90,
    hp: 16,
    damage: 7,
    xpValue: 5,
    appearsAt: 500,    // 8:20 — sits between piper (8:00) and
                       // ghost (9:00); second orbiter keeps the
                       // beat but rotates in the opposite direction
                       // relative to piper, visually.
    behavior: 'orbit',
    packSize: 1,
  },
  // Faerie #2 — DESIGN_IDEAS section 3. Unseelie (dark) court
  // fiddler. Orbits like its Seelie sibling but with a darker
  // palette so the two read as paired opposites at a glance.
  unseelie_fiddler: {
    key: 'unseelie_fiddler',
    texture: 'unseelie_fiddler',
    speed: 100,
    hp: 18,
    damage: 8,
    xpValue: 5,
    appearsAt: 520,    // 8:40 — just after seelie_piper; deliberate
                       // pairing so the two court halves land close
                       // in time for the "fair vs dark" read.
    behavior: 'orbit',
    packSize: 1,
  },
  // Weather #2 — DESIGN_IDEAS section 3. "Displaces player on
  // contact" lands through a mass override: Phaser's arcade collision
  // resolver respects body.mass when computing rebound velocity, so
  // a mass-15 body shoves the mass-1 player on every touch. Damage
  // stays low — the signature is the shove, not the sting.
  gale_wraith: {
    key: 'gale_wraith',
    texture: 'gale_wraith',
    speed: 115,
    hp: 14,
    damage: 4,
    xpValue: 4,
    appearsAt: 825,    // 13:45 — after haar_wraith + angry_scotsman so
                       // the player knows both Weather flavours; sits
                       // just before berserker (14:00).
    behavior: 'chase',
    packSize: 1,
    massOverride: 15,
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
  // Academic Apparitions #2 — DESIGN_IDEAS section 3. Floating open
  // tome with a ghostly face between the pages; torn scroll-corners
  // orbit the volume. Ships on the existing `ranged` behaviour —
  // pages read as the "scroll-unfurl telegraph" from the family
  // bullet without a new projectile class. Slots after ceilidh_caller
  // (10:45) so the two Academic members land close in time for the
  // scholarly read to register.
  tome_wraith: {
    key: 'tome_wraith',
    texture: 'tome_wraith',
    speed: 50,
    hp: 28,
    damage: 9,
    xpValue: 5,
    appearsAt: 690,    // 11:30 — between nest (11:00) and
                       // buckfast_ned (12:00); the library-of-the-
                       // dead beat lands before the streets turn.
    behavior: 'ranged',
    packSize: 1,
  },
  // Academic Apparitions #3 — DESIGN_IDEAS section 3. Formal dean in
  // mortarboard + gown with a stern ghostly face. Chase behaviour with
  // a mass override so contact shoves the player — the dean presses
  // through you "because the academy does not wait". Higher HP than
  // the tome wraith to reward deliberate focus. Sits late enough that
  // the player's weapons can actually handle the bulk.
  dean_apparition: {
    key: 'dean_apparition',
    texture: 'dean_apparition',
    speed: 50,
    hp: 45,
    damage: 13,
    xpValue: 7,
    appearsAt: 765,    // 12:45 — between haar_wraith (12:30) and
                       // angry_scotsman (13:00); adds a tank-leaning
                       // apparition to the late-teen pool.
    behavior: 'chase',
    packSize: 1,
    massOverride: 5,
  },
  // Taxman's Retinue opener — DESIGN_IDEAS section 3. Ghostly auditor
  // trailing ledger pages and ink-red drips; the "immune until the
  // Taxman takes damage" bullet stays open pending an event-bus gate
  // (YAGNI until a second Retinue enemy wants the same hook). Ships
  // as a late-game `chase` so the flavour lands — paper swirl on
  // contact, higher HP than buckfast_ned because the player's build
  // is mature by 15:30.
  ledger_wraith: {
    key: 'ledger_wraith',
    texture: 'ledger_wraith',
    speed: 85,
    hp: 35,
    damage: 11,
    xpValue: 6,
    appearsAt: 930,    // 15:30 — just after deep_fryer hazard; the
                       // first Retinue sighting marks the "Taxman
                       // is coming" beat ten minutes before the boss.
    behavior: 'chase',
    packSize: 1,
  },
  // Taxman's Retinue #2 — DESIGN_IDEAS section 3. Auditor-priest
  // with a censer-tipped staff; "beam ranged, tests drift skill"
  // deferred pending a beam-weapon class. Ships as a themed `ranged`
  // variant — slow, keeps distance, lobs a slowing projectile that
  // reads as a writ of audit. Late enough that the player's drift
  // handling is already battle-tempered.
  auditor_priest: {
    key: 'auditor_priest',
    texture: 'auditor_priest',
    speed: 45,
    hp: 32,
    damage: 12,
    xpValue: 7,
    appearsAt: 1050,   // 17:30 — second Retinue slot; by here the
                       // post-bell drumbeat is audible and the
                       // player knows the Taxman fight is imminent.
    behavior: 'ranged',
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
  barghest: 'Barghest',
  kelpie_foal: 'Kelpie Foal',
  blue_man_of_minch: 'Blue Man of the Minch',
  haar_wraith: 'Haar Wraith',
  gale_wraith: 'Gale Wraith',
  seelie_piper: 'Seelie Piper',
  unseelie_fiddler: 'Unseelie Fiddler',
  ceilidh_caller: 'Ceilidh Caller',
  tome_wraith: 'Tome Wraith',
  dean_apparition: 'Dean Apparition',
  ledger_wraith: 'Ledger Wraith',
  auditor_priest: 'Auditor Priest',
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
