/** One segment of the spawn director — active while `gameTimeSec >= timeSec` until a later segment wins. */
export type WaveTimelineEntry = {
  timeSec: number;
  intervalSec: number;
  burstSize: number;
  enemyKeys: readonly string[];
};

/**
 * Edinburgh-themed enemy keys gated until B5 Phase 3 ships
 * (cultural consultation required — see CULTURAL_SENSITIVITIES_RESEARCH.md §2.7
 * and docs/superpowers/specs/2026-04-28-five-missing-biomes-design.md).
 * Mirrors the rune-offer filter in `runeCards.test.ts` (`biome_urban` excluded).
 * Act 3 Moor Road node banks intentionally retain these as designed encounter
 * content; only the open-world cumulative spawn pool is gated here.
 */
const BIOME_URBAN_READY = false;
const URBAN_GATED_ENEMY_KEYS: ReadonlySet<string> = new Set(['edinburgh_ghost_guide']);

function buildWaveTimeline(): WaveTimelineEntry[] {
  const milestones: { t: number; add: string }[] = [
    { t: 0, add: 'tourist' },
    { t: 90, add: 'chef' },
    { t: 180, add: 'midge' },
    { t: 240, add: 'sheep' },
    { t: 300, add: 'kelpie' },
    { t: 360, add: 'highland_cow' },
    { t: 390, add: 'kelpie_foal' },
    { t: 420, add: 'eagle' },
    { t: 450, add: 'midgie_swarm' },
    { t: 480, add: 'piper' },
    { t: 500, add: 'seelie_piper' },
    { t: 520, add: 'unseelie_fiddler' },
    { t: 530, add: 'redcap' },
    { t: 540, add: 'ghost' },
    { t: 570, add: 'barghest' },
    { t: 600, add: 'haggis_hunter' },
    { t: 630, add: 'blue_man_of_minch' },
    { t: 645, add: 'ceilidh_caller' },
    { t: 660, add: 'nest' },
    { t: 660, add: 'beithir' },          // 11:00 — Argyll viper, opens
                                          // the Race the Beithir mechanic
                                          // (DESIGN_IDEAS §1; SCOTTISH_RESEARCH §1.2).
    { t: 690, add: 'tome_wraith' },
    { t: 720, add: 'buckfast_ned' },
    { t: 720, add: 'cu_sith' },         // 12:00 — Three-Bay Warning fey hound
                                          // (DESIGN_IDEAS §1; SCOTTISH_RESEARCH §1.2).
    { t: 750, add: 'haar_wraith' },
    { t: 765, add: 'dean_apparition' },
    { t: 780, add: 'angry_scotsman' },
    { t: 810, add: 'edinburgh_ghost_guide' },
    { t: 825, add: 'gale_wraith' },
    { t: 840, add: 'berserker' },
    { t: 870, add: 'traffic_cone_totem' },
    { t: 900, add: 'deep_fryer' },
    { t: 930, add: 'ledger_wraith' },
    { t: 1050, add: 'auditor_priest' },
    { t: 1080, add: 'bodach_glas' },     // 18:00 — Cairngorm grey old
                                          // man, frost-biome signature
                                          // silhouette enemy. B5 Phase 2
                                          // follow-up. SCOTTISH_RESEARCH
                                          // §1.2 / charter §4.4.
  ];
  const gated = milestones.filter(
    (m) => BIOME_URBAN_READY || !URBAN_GATED_ENEMY_KEYS.has(m.add),
  );
  const keys: string[] = [];
  return gated.map(({ t, add }) => {
    keys.push(add);
    return {
      timeSec: t,
      intervalSec: Math.max(0.3, 1.5 - t * 0.002),
      burstSize: Math.min(15, Math.floor(2 + Math.log2(1 + t / 30))),
      enemyKeys: [...keys],
    };
  });
}

/** Data-driven wave / spawn director — tune without editing SpawnSystem. */
export const WAVE_TIMELINE: readonly WaveTimelineEntry[] = buildWaveTimeline();

export function getActiveWaveTimelineEntry(gameTimeSec: number): WaveTimelineEntry {
  let active = WAVE_TIMELINE[0];
  for (const e of WAVE_TIMELINE) {
    if (gameTimeSec >= e.timeSec) active = e;
  }
  return active;
}

export const BALANCE = {
  /** Run cap — finale clears mobs and spawns `FINAL_BOSS_KEY` (see SpawnSystem). */
  run: {
    /** Seconds from run start until timeline spawns stop and the final boss sequence runs. */
    RUN_WIN_TIME_SEC: 900,
    /** Must match a `BOSSES[].key` in `data/enemies.ts` (defeat → victory). */
    FINAL_BOSS_KEY: 'taxman',
  },
  /** Camera-relative tuning — off-screen enemies throttle physics / AI. */
  spatial: {
    /** Pixels beyond `cameras.main.worldView` where bodies disable and AI is skipped. */
    cullMarginPx: 200,
  },
  xp: {
    gemPoolMax: 500,
    gemPrewarm: 50,
    criticalHpMagnetThreshold: 0.15,
    criticalHpMagnetMultiplier: 3,
    collectDistancePx: 20,
  },
  weapons: {
    projectilePoolMax: 350,
    projectilePrewarm: 30,
    trailEveryNFrames: 3,
    minEffectiveCooldownMs: 50,
    /**
     * Max flying projectiles per weapon key (readability + pool pressure).
     * Evolved bursts respect the same cap — extra shots are skipped quietly.
     */
    maxSimultaneousProjectilesPerWeapon: 26,
  },
  director: {
    /** Kill-pressure adds this much to elite spawn chance (clamped in SpawnSystem). */
    killPressureEliteBonusMax: 0.065,
    /** Added to pressure accumulator per non-boss kill (decays every frame). */
    killPressurePerKill: 0.038,
    /** Exponential decay per second — ~10s half-life at 60fps-scale deltas. */
    killPressureDecayPerSec: 0.11,
  },
  player: {
    dashCooldownMs: 1600,
    dashSpeed: 760,
    dashDurationMs: 180,
    postDashGraceMs: 80,
    dashAfterImageCount: 5,
    netSlowAmount: 80,
    shieldCooldownMs: 20000,
    baseHitboxRadius: 20,
    /**
     * One-time per run: crossing from above → at/below this HP fraction grants
     * `moorMercyLuckBonus` to level-up card weights (stacking with sporran / meta).
     */
    moorMercyHpFrac: 0.28,
    moorMercyLuckBonus: 12,
  },
  enemy: {
    rangedStandoffPx: 200,
    orbitRadiusPx: 180,
    phaseToggleMs: 2000,
    spawnerWarmupMs: 500,
    spawnerIntervalMs: 4000,
    hazardTtlMs: 10000,
    diveDespawnMarginPx: 300,
    rangedCooldownMs: 3000,
    /** Elites start spawning this many seconds into the run. */
    ELITE_UNLOCK_SEC: 120,
    /** Per-spawn chance that a non-hazard, non-swarm enemy upgrades to elite. */
    ELITE_SPAWN_CHANCE: 0.10,
    /**
     * Gold elite kill chain — second gold elite within this many *game* seconds
     * of the previous gold elite pays `eliteChainGoldSecond`; third pays
     * `eliteChainGoldTriple` and resets the chain.
     */
    eliteChainWindowSec: 45,
    eliteChainGoldSecond: 12,
    eliteChainGoldTriple: 28,
  },
  juice: {
    impactRingPoolSize: 80,
    trailDotPoolSize: 60,
    burstDotPoolSize: 50,
    burstRingPoolSize: 15,
    bossParticlePoolSize: 35,
    bossRingPoolSize: 5,
  },
  bossWarning: {
    spawnDelayMs: 1500,
    fadeOutDelayMs: 1200,
    fadeOutDurationMs: 400,
  },
  hud: {
    /**
     * Wave difficulty ladder displayed under the timer. Single source of
     * truth — HUD reads from this, so tuning the wave arc stays consistent
     * between the WAVE_TIMELINE (gameplay) and what the player sees.
     */
    WAVE_DIFFICULTY_MARKS: [
      { minSec: 0,    label: 'I',   color: '#88cc88' },
      { minSec: 180,  label: 'II',  color: '#cccc44' },
      { minSec: 420,  label: 'III', color: '#dd8844' },
      { minSec: 720,  label: 'IV',  color: '#dd4444' },
      { minSec: 1200, label: 'V',   color: '#ff2222' },
    ] as const,
    /** Enemy count threshold above which the HUD flashes the "MAX" warning. */
    ENEMY_WARN_THRESHOLD: 350,
  },
} as const;

/**
 * Weapon evolution synergy — max-level base weapon + required passive.
 * `evolvedWeapon` is the evolution id used by WeaponSystem / HUD (e.g. thistle_storm).
 * Offered from treasure chests (not the random level-up pool).
 */
export type EvolutionRecipeDef = {
  baseWeapon: string;
  requiredPassive: string;
  evolvedWeapon: string;
  /** Dot-path key for `i18n.t()` — e.g. `evolution.thistle_storm.name`. */
  nameKey: string;
  descriptionKey: string;
};

export const EVOLUTION_RECIPES: readonly EvolutionRecipeDef[] = [
  {
    baseWeapon: 'thistle_shot',
    requiredPassive: 'sporran',
    evolvedWeapon: 'thistle_storm',
    nameKey: 'evolution.thistle_storm.name',
    descriptionKey: 'evolution.thistle_storm.description',
  },
  {
    baseWeapon: 'bagpipe_blast',
    requiredPassive: 'whisky_flask',
    evolvedWeapon: 'highland_fling',
    nameKey: 'evolution.highland_fling.name',
    descriptionKey: 'evolution.highland_fling.description',
  },
  {
    baseWeapon: 'caber_toss',
    requiredPassive: 'kilt',
    evolvedWeapon: 'highland_games',
    nameKey: 'evolution.highland_games.name',
    descriptionKey: 'evolution.highland_games.description',
  },
  {
    baseWeapon: 'scotch_mist',
    requiredPassive: 'tam_o_shanter',
    evolvedWeapon: 'the_haar',
    nameKey: 'evolution.the_haar.name',
    descriptionKey: 'evolution.the_haar.description',
  },
  {
    baseWeapon: 'haggis_hurler',
    requiredPassive: 'irn_bru',
    evolvedWeapon: 'haggis_cannon',
    nameKey: 'evolution.haggis_cannon.name',
    descriptionKey: 'evolution.haggis_cannon.description',
  },
  {
    baseWeapon: 'nessie_tentacle',
    requiredPassive: 'loch_water',
    evolvedWeapon: 'nessie_unleashed',
    nameKey: 'evolution.nessie_unleashed.name',
    descriptionKey: 'evolution.nessie_unleashed.description',
  },
  {
    baseWeapon: 'claymore',
    requiredPassive: 'tartan_sash',
    evolvedWeapon: 'william_blade',
    nameKey: 'evolution.william_blade.name',
    descriptionKey: 'evolution.william_blade.description',
  },
  {
    // DESIGN_IDEAS §1 + §5 — Shinty Stick + Shinty Ball → Shinty Caman.
    // The wee wood ball + the curved ash caman = camanachd, the ancient
    // Highland game. The evolved form rapid-fires bouncing balls in all
    // directions (ash blur). Sister-fantasy to the already-shipped
    // Shinty Parry mechanic — defence + offence under one banner.
    baseWeapon: 'shinty_stick',
    requiredPassive: 'shinty_ball',
    evolvedWeapon: 'shinty_caman',
    nameKey: 'evolution.shinty_caman.name',
    descriptionKey: 'evolution.shinty_caman.description',
  },
  {
    // DESIGN_IDEAS §5 — Sgian Dubh + Whetstone → Sgian Geal. The "black
    // knife" tucked in the stocking + the sharpening stone in the
    // pocket = Sgian Geal, the "white knife" — the ceremonial twin of
    // the dirk-set. Mechanically the evolved form trades base damage
    // for a guaranteed crit on every hit; the Whetstone has put such
    // an edge on the blade that nothing it touches can be glanced.
    baseWeapon: 'sgian_dubh',
    requiredPassive: 'whetstone',
    evolvedWeapon: 'sgian_geal',
    nameKey: 'evolution.sgian_geal.name',
    descriptionKey: 'evolution.sgian_geal.description',
  },
  {
    // DESIGN_IDEAS §5 — Stag Antler + Velvet Antler → Monarch's Charge.
    // The lowered-head goring + the stored summer energy of velvet =
    // the moment after the rut, the king-stag turning his full crown
    // through the herd. Mechanically the evolved form keeps the
    // baseline arc but the dash-strike becomes a 360° antler-sweep at
    // 3.5× damage that briefly stuns the wounded — the kind of beat
    // that tells a player "this is yours, you earned the throne".
    baseWeapon: 'stag_antler',
    requiredPassive: 'velvet_antler',
    evolvedWeapon: 'monarch_charge',
    nameKey: 'evolution.monarch_charge.name',
    descriptionKey: 'evolution.monarch_charge.description',
  },
];

/** Max weapon level before an evolution can be offered from a chest. */
export const EVOLUTION_MIN_WEAPON_LEVEL = 5;

/**
 * Burns's Wee Beastie unlock threshold — derived from the number of evolution
 * recipes so adding a recipe automatically lifts the gate. Achievement copy
 * interpolates `{count}` from this value via `descriptionVars` below; see
 * `i18n/achievement.ts` + `i18n.scs/achievement.ts` for the placeholder strings.
 *
 * Re-exported from `src/utils/save/schema.ts` for existing call-sites.
 */
export const BURNS_EVOLUTION_THRESHOLD = EVOLUTION_RECIPES.length;

/** Achievement ids persisted on `SaveManager.unlockedAchievements`. */
export type AchievementId =
  | 'ach_kills_1000'
  | 'ach_kills_5000'
  | 'ach_survive_5m'
  | 'ach_survive_10m'
  | 'ach_full_run'
  | 'ach_defeat_taxman'
  | 'ach_first_victory'
  | 'ach_first_evolution'
  | 'ach_codex_half'
  | 'ach_codex_loremaster'
  | 'ach_moor_hearth_30'
  | 'ach_all_bosses'
  | 'ach_walk_every_road'
  | 'ach_ironmoor_victor'
  | 'ach_full_herd'
  | 'ach_laird_victor'
  | 'ach_stone_circle'
  | 'ach_relic_seeker'
  | 'ach_echo_touched'
  | 'ach_ceilidh_commander'
  | 'ach_past_the_bell'
  | 'ach_endless_endurance'
  | 'ach_cursed_victor'
  | 'ach_combo_100'
  | 'ach_cailleach_unlock'
  | 'ach_doric_unlock'
  | 'ach_peerie_unlock'
  | 'ach_burns_beastie_unlock';

export const ACHIEVEMENT_DEFS: Record<
  AchievementId,
  {
    titleKey: string;
    descriptionKey: string;
    descriptionVars?: Readonly<Record<string, string | number>>;
  }
> = {
  ach_kills_1000: {
    titleKey: 'achievement.ach_kills_1000.title',
    descriptionKey: 'achievement.ach_kills_1000.description',
  },
  ach_kills_5000: {
    titleKey: 'achievement.ach_kills_5000.title',
    descriptionKey: 'achievement.ach_kills_5000.description',
  },
  ach_survive_5m: {
    titleKey: 'achievement.ach_survive_5m.title',
    descriptionKey: 'achievement.ach_survive_5m.description',
  },
  ach_survive_10m: {
    titleKey: 'achievement.ach_survive_10m.title',
    descriptionKey: 'achievement.ach_survive_10m.description',
  },
  ach_full_run: {
    titleKey: 'achievement.ach_full_run.title',
    descriptionKey: 'achievement.ach_full_run.description',
  },
  ach_defeat_taxman: {
    titleKey: 'achievement.ach_defeat_taxman.title',
    descriptionKey: 'achievement.ach_defeat_taxman.description',
  },
  ach_first_victory: {
    titleKey: 'achievement.ach_first_victory.title',
    descriptionKey: 'achievement.ach_first_victory.description',
  },
  ach_first_evolution: {
    titleKey: 'achievement.ach_first_evolution.title',
    descriptionKey: 'achievement.ach_first_evolution.description',
  },
  ach_codex_half: {
    titleKey: 'achievement.ach_codex_half.title',
    descriptionKey: 'achievement.ach_codex_half.description',
  },
  ach_codex_loremaster: {
    titleKey: 'achievement.ach_codex_loremaster.title',
    descriptionKey: 'achievement.ach_codex_loremaster.description',
  },
  ach_moor_hearth_30: {
    titleKey: 'achievement.ach_moor_hearth_30.title',
    descriptionKey: 'achievement.ach_moor_hearth_30.description',
  },
  ach_all_bosses: {
    titleKey: 'achievement.ach_all_bosses.title',
    descriptionKey: 'achievement.ach_all_bosses.description',
  },
  ach_walk_every_road: {
    titleKey: 'achievement.ach_walk_every_road.title',
    descriptionKey: 'achievement.ach_walk_every_road.description',
  },
  ach_ironmoor_victor: {
    titleKey: 'achievement.ach_ironmoor_victor.title',
    descriptionKey: 'achievement.ach_ironmoor_victor.description',
  },
  ach_full_herd: {
    titleKey: 'achievement.ach_full_herd.title',
    descriptionKey: 'achievement.ach_full_herd.description',
  },
  ach_laird_victor: {
    titleKey: 'achievement.ach_laird_victor.title',
    descriptionKey: 'achievement.ach_laird_victor.description',
  },
  ach_stone_circle: {
    titleKey: 'achievement.ach_stone_circle.title',
    descriptionKey: 'achievement.ach_stone_circle.description',
  },
  ach_relic_seeker: {
    titleKey: 'achievement.ach_relic_seeker.title',
    descriptionKey: 'achievement.ach_relic_seeker.description',
  },
  ach_echo_touched: {
    titleKey: 'achievement.ach_echo_touched.title',
    descriptionKey: 'achievement.ach_echo_touched.description',
  },
  ach_ceilidh_commander: {
    titleKey: 'achievement.ach_ceilidh_commander.title',
    descriptionKey: 'achievement.ach_ceilidh_commander.description',
  },
  ach_past_the_bell: {
    titleKey: 'achievement.ach_past_the_bell.title',
    descriptionKey: 'achievement.ach_past_the_bell.description',
  },
  ach_endless_endurance: {
    titleKey: 'achievement.ach_endless_endurance.title',
    descriptionKey: 'achievement.ach_endless_endurance.description',
  },
  ach_cursed_victor: {
    titleKey: 'achievement.ach_cursed_victor.title',
    descriptionKey: 'achievement.ach_cursed_victor.description',
  },
  ach_combo_100: {
    titleKey: 'achievement.ach_combo_100.title',
    descriptionKey: 'achievement.ach_combo_100.description',
  },
  ach_cailleach_unlock: {
    titleKey: 'achievement.ach_cailleach_unlock.title',
    descriptionKey: 'achievement.ach_cailleach_unlock.description',
  },
  ach_doric_unlock: {
    titleKey: 'achievement.ach_doric_unlock.title',
    descriptionKey: 'achievement.ach_doric_unlock.description',
  },
  ach_peerie_unlock: {
    titleKey: 'achievement.ach_peerie_unlock.title',
    descriptionKey: 'achievement.ach_peerie_unlock.description',
  },
  ach_burns_beastie_unlock: {
    titleKey: 'achievement.ach_burns_beastie_unlock.title',
    descriptionKey: 'achievement.ach_burns_beastie_unlock.description',
    descriptionVars: { count: BURNS_EVOLUTION_THRESHOLD },
  },
};

