/** One segment of the spawn director — active while `gameTimeSec >= timeSec` until a later segment wins. */
export type WaveTimelineEntry = {
  timeSec: number;
  intervalSec: number;
  burstSize: number;
  enemyKeys: readonly string[];
};

function buildWaveTimeline(): WaveTimelineEntry[] {
  const milestones: { t: number; add: string }[] = [
    { t: 0, add: 'tourist' },
    { t: 90, add: 'chef' },
    { t: 180, add: 'midge' },
    { t: 240, add: 'sheep' },
    { t: 300, add: 'kelpie' },
    { t: 360, add: 'highland_cow' },
    { t: 420, add: 'eagle' },
    { t: 450, add: 'midgie_swarm' },
    { t: 480, add: 'piper' },
    { t: 540, add: 'ghost' },
    { t: 600, add: 'haggis_hunter' },
    { t: 660, add: 'nest' },
    { t: 780, add: 'angry_scotsman' },
    { t: 840, add: 'berserker' },
    { t: 900, add: 'deep_fryer' },
  ];
  const keys: string[] = [];
  return milestones.map(({ t, add }) => {
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
];

/** Max weapon level before an evolution can be offered from a chest. */
export const EVOLUTION_MIN_WEAPON_LEVEL = 5;

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
  | 'ach_all_bosses';

export const ACHIEVEMENT_DEFS: Record<
  AchievementId,
  {
    titleKey: string;
    descriptionKey: string;
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
  ach_all_bosses: {
    titleKey: 'achievement.ach_all_bosses.title',
    descriptionKey: 'achievement.ach_all_bosses.description',
  },
};

