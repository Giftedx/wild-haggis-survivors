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
    { t: 180, add: 'terrier' },
    { t: 240, add: 'sheep' },
    { t: 420, add: 'eagle' },
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
    projectilePoolMax: 200,
    projectilePrewarm: 30,
    trailEveryNFrames: 3,
    minEffectiveCooldownMs: 50,
  },
  player: {
    dashCooldownMs: 2000,
    dashSpeed: 600,
    dashDurationMs: 150,
    postDashGraceMs: 50,
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
  name: string;
  description: string;
};

export const EVOLUTION_RECIPES: readonly EvolutionRecipeDef[] = [
  {
    baseWeapon: 'thistle_shot',
    requiredPassive: 'sporran',
    evolvedWeapon: 'thistle_storm',
    name: 'Thistle Storm',
    description: '8 homing thistles seek enemies across the screen.',
  },
  {
    baseWeapon: 'bagpipe_blast',
    requiredPassive: 'whisky_flask',
    evolvedWeapon: 'highland_fling',
    name: 'The Highland Fling',
    description: 'Massive pulsating sonic ring shatters all enemies.',
  },
  {
    baseWeapon: 'caber_toss',
    requiredPassive: 'kilt',
    evolvedWeapon: 'highland_games',
    name: 'Highland Games',
    description: 'Caber explodes on final pierce, leaving a burning zone.',
  },
  {
    baseWeapon: 'scotch_mist',
    requiredPassive: 'tam_o_shanter',
    evolvedWeapon: 'the_haar',
    name: 'The Haar',
    description: 'Dense fog covers 40% of the screen, melting enemies.',
  },
  {
    baseWeapon: 'haggis_hurler',
    requiredPassive: 'irn_bru',
    evolvedWeapon: 'haggis_cannon',
    name: 'Haggis Cannon',
    description: 'Rapid-fire haggis that explode on each bounce.',
  },
  {
    baseWeapon: 'nessie_tentacle',
    requiredPassive: 'loch_water',
    evolvedWeapon: 'nessie_unleashed',
    name: 'Nessie Unleashed',
    description: 'Multiple massive tentacles sweep the entire screen.',
  },
];

/** Max weapon level before an evolution can be offered from a chest. */
export const EVOLUTION_MIN_WEAPON_LEVEL = 5;

/** Achievement ids persisted on `SaveManager.unlockedAchievements`. */
export type AchievementId =
  | 'ach_kills_1000'
  | 'ach_survive_10m'
  | 'ach_defeat_taxman';

export const ACHIEVEMENT_DEFS: Record<
  AchievementId,
  {
    title: string;
    description: string;
  }
> = {
  ach_kills_1000: {
    title: 'Cull of the Glen',
    description: 'Reach 1,000 lifetime kills (meta).',
  },
  ach_survive_10m: {
    title: 'Heather Marathon',
    description: 'Survive 10 minutes in a single run.',
  },
  ach_defeat_taxman: {
    title: 'Tax-Free Zone',
    description: 'Defeat the Taxman.',
  },
};

