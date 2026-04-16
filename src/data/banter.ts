/**
 * Banter pools — context-reactive Glesga commentary.
 *
 * Mirrors the Conductor pattern (music): game-state → mood → output. Here,
 * the output is a short toast line through JuiceSystem + captions.
 *
 * Voice register (locked — see memory `feedback_voice_register.md`):
 *   - Hearth / Still Game warmth → default for ambient, kill streak, idle,
 *     biome, first blood, level up.
 *   - Edge / Limmy bite → failure, low-HP, boss warnings, last-gasp moments.
 *
 * All copy lives in `src/core/i18n.ts` under `ui.banter.*`. This file holds
 * *structure* only: which contexts exist, their priority, tone tag, and the
 * i18n keys of the line pool. Adding a new line = push an i18n key; the
 * engine picks-and-rotates without code changes.
 */

export type BanterTone = 'hearth' | 'edge';

export type BanterContext =
  | 'first_blood'
  | 'kill_streak'
  | 'level_up'
  | 'low_hp'
  | 'recover'
  | 'boss_warn'
  | 'boss_down'
  | 'biome_change'
  | 'weapon_evolve'
  | 'curse_start'
  | 'moor_moment'
  | 'idle'
  // W2 Moor Road
  | 'act_intermission_enter'
  | 'act_complete'
  | 'route_picked';

export interface BanterPool {
  context: BanterContext;
  tone: BanterTone;
  /** Higher wins when two contexts fire in the same tick. */
  priority: number;
  /** i18n keys — picked round-robin with a no-repeat window. */
  keys: readonly string[];
  /**
   * Optional authored sub-pools keyed by caller-supplied tag (boss key,
   * variant key, biome key, etc.). When a requester passes a tag that
   * matches a sub-pool, the engine prefers those lines over the generic
   * `keys` — that's how bosses get their own character and variants get
   * their own voice tint. Missing tag or unknown tag falls back to
   * `keys` silently.
   */
  keysByTag?: Readonly<Record<string, readonly string[]>>;
}

export const BANTER_POOLS: readonly BanterPool[] = [
  {
    context: 'boss_warn',
    tone: 'edge',
    priority: 100,
    keys: [
      'ui.banter.boss_warn.a',
      'ui.banter.boss_warn.b',
      'ui.banter.boss_warn.c',
      'ui.banter.boss_warn.d',
      'ui.banter.boss_warn.e',
    ],
    // Authored per-boss character moments. Each boss gets 3 lines so the
    // no-repeat window (size 8) can't starve a pool during back-to-back
    // runs, and the SpawnSystem never repeats the same boss mid-run.
    keysByTag: {
      gordon: [
        'ui.banter.boss_warn.gordon.a',
        'ui.banter.boss_warn.gordon.b',
        'ui.banter.boss_warn.gordon.c',
      ],
      tour_bus: [
        'ui.banter.boss_warn.tour_bus.a',
        'ui.banter.boss_warn.tour_bus.b',
        'ui.banter.boss_warn.tour_bus.c',
      ],
      the_laird: [
        'ui.banter.boss_warn.the_laird.a',
        'ui.banter.boss_warn.the_laird.b',
        'ui.banter.boss_warn.the_laird.c',
      ],
      hunter_general: [
        'ui.banter.boss_warn.hunter_general.a',
        'ui.banter.boss_warn.hunter_general.b',
        'ui.banter.boss_warn.hunter_general.c',
      ],
      taxman: [
        'ui.banter.boss_warn.taxman.a',
        'ui.banter.boss_warn.taxman.b',
        'ui.banter.boss_warn.taxman.c',
      ],
    },
  },
  {
    context: 'low_hp',
    tone: 'edge',
    priority: 80,
    keys: [
      'ui.banter.low_hp.a',
      'ui.banter.low_hp.b',
      'ui.banter.low_hp.c',
      'ui.banter.low_hp.d',
      'ui.banter.low_hp.e',
    ],
    keysByTag: {
      iron_belly: [
        'ui.banter.low_hp.iron_belly.a',
        'ui.banter.low_hp.iron_belly.b',
        'ui.banter.low_hp.iron_belly.c',
        'ui.banter.low_hp.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.low_hp.moor_runner.a',
        'ui.banter.low_hp.moor_runner.b',
        'ui.banter.low_hp.moor_runner.c',
        'ui.banter.low_hp.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.low_hp.glen_forager.a',
        'ui.banter.low_hp.glen_forager.b',
        'ui.banter.low_hp.glen_forager.c',
        'ui.banter.low_hp.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.low_hp.surefoot.a',
        'ui.banter.low_hp.surefoot.b',
        'ui.banter.low_hp.surefoot.c',
        'ui.banter.low_hp.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.low_hp.pipe_breath.a',
        'ui.banter.low_hp.pipe_breath.b',
        'ui.banter.low_hp.pipe_breath.c',
        'ui.banter.low_hp.pipe_breath.d',
      ],
    },
  },
  {
    context: 'boss_down',
    tone: 'hearth',
    priority: 70,
    keys: [
      'ui.banter.boss_down.a',
      'ui.banter.boss_down.b',
      'ui.banter.boss_down.c',
      'ui.banter.boss_down.d',
    ],
    keysByTag: {
      gordon: [
        'ui.banter.boss_down.gordon.a',
        'ui.banter.boss_down.gordon.b',
        'ui.banter.boss_down.gordon.c',
      ],
      tour_bus: [
        'ui.banter.boss_down.tour_bus.a',
        'ui.banter.boss_down.tour_bus.b',
        'ui.banter.boss_down.tour_bus.c',
      ],
      the_laird: [
        'ui.banter.boss_down.the_laird.a',
        'ui.banter.boss_down.the_laird.b',
        'ui.banter.boss_down.the_laird.c',
      ],
      hunter_general: [
        'ui.banter.boss_down.hunter_general.a',
        'ui.banter.boss_down.hunter_general.b',
        'ui.banter.boss_down.hunter_general.c',
      ],
      taxman: [
        'ui.banter.boss_down.taxman.a',
        'ui.banter.boss_down.taxman.b',
        'ui.banter.boss_down.taxman.c',
      ],
    },
  },
  {
    context: 'weapon_evolve',
    tone: 'hearth',
    priority: 65,
    keys: [
      'ui.banter.weapon_evolve.a',
      'ui.banter.weapon_evolve.b',
      'ui.banter.weapon_evolve.c',
      'ui.banter.weapon_evolve.d',
    ],
    keysByTag: {
      thistle_shot: [
        'ui.banter.weapon_evolve.thistle_shot.a',
        'ui.banter.weapon_evolve.thistle_shot.b',
        'ui.banter.weapon_evolve.thistle_shot.c',
        'ui.banter.weapon_evolve.thistle_shot.d',
      ],
      bagpipe_blast: [
        'ui.banter.weapon_evolve.bagpipe_blast.a',
        'ui.banter.weapon_evolve.bagpipe_blast.b',
        'ui.banter.weapon_evolve.bagpipe_blast.c',
        'ui.banter.weapon_evolve.bagpipe_blast.d',
      ],
      caber_toss: [
        'ui.banter.weapon_evolve.caber_toss.a',
        'ui.banter.weapon_evolve.caber_toss.b',
        'ui.banter.weapon_evolve.caber_toss.c',
        'ui.banter.weapon_evolve.caber_toss.d',
      ],
      scotch_mist: [
        'ui.banter.weapon_evolve.scotch_mist.a',
        'ui.banter.weapon_evolve.scotch_mist.b',
        'ui.banter.weapon_evolve.scotch_mist.c',
        'ui.banter.weapon_evolve.scotch_mist.d',
      ],
      haggis_hurler: [
        'ui.banter.weapon_evolve.haggis_hurler.a',
        'ui.banter.weapon_evolve.haggis_hurler.b',
        'ui.banter.weapon_evolve.haggis_hurler.c',
        'ui.banter.weapon_evolve.haggis_hurler.d',
      ],
      nessie_tentacle: [
        'ui.banter.weapon_evolve.nessie_tentacle.a',
        'ui.banter.weapon_evolve.nessie_tentacle.b',
        'ui.banter.weapon_evolve.nessie_tentacle.c',
        'ui.banter.weapon_evolve.nessie_tentacle.d',
      ],
      claymore: [
        'ui.banter.weapon_evolve.claymore.a',
        'ui.banter.weapon_evolve.claymore.b',
        'ui.banter.weapon_evolve.claymore.c',
        'ui.banter.weapon_evolve.claymore.d',
      ],
      bagpipes: [
        'ui.banter.weapon_evolve.bagpipes.a',
        'ui.banter.weapon_evolve.bagpipes.b',
        'ui.banter.weapon_evolve.bagpipes.c',
        'ui.banter.weapon_evolve.bagpipes.d',
      ],
    },
  },
  {
    context: 'curse_start',
    tone: 'hearth',
    priority: 59,
    keys: [
      'ui.banter.curse_start.generic.a',
      'ui.banter.curse_start.generic.b',
      'ui.banter.curse_start.generic.c',
      'ui.banter.curse_start.generic.d',
    ],
    keysByTag: {
      heavy_legs: [
        'ui.banter.curse_start.heavy_legs.a',
        'ui.banter.curse_start.heavy_legs.b',
        'ui.banter.curse_start.heavy_legs.c',
        'ui.banter.curse_start.heavy_legs.d',
      ],
      thin_hide: [
        'ui.banter.curse_start.thin_hide.a',
        'ui.banter.curse_start.thin_hide.b',
        'ui.banter.curse_start.thin_hide.c',
        'ui.banter.curse_start.thin_hide.d',
      ],
      restless_spirits: [
        'ui.banter.curse_start.restless_spirits.a',
        'ui.banter.curse_start.restless_spirits.b',
        'ui.banter.curse_start.restless_spirits.c',
        'ui.banter.curse_start.restless_spirits.d',
      ],
      empty_larder: [
        'ui.banter.curse_start.empty_larder.a',
        'ui.banter.curse_start.empty_larder.b',
        'ui.banter.curse_start.empty_larder.c',
        'ui.banter.curse_start.empty_larder.d',
      ],
    },
  },
  {
    context: 'level_up',
    tone: 'hearth',
    priority: 60,
    keys: [
      'ui.banter.level_up.a',
      'ui.banter.level_up.b',
      'ui.banter.level_up.c',
      'ui.banter.level_up.d',
      'ui.banter.level_up.e',
      'ui.banter.level_up.f',
    ],
    // Variant voice — `classic` intentionally uses the generic pool only.
    keysByTag: {
      iron_belly: [
        'ui.banter.level_up.iron_belly.a',
        'ui.banter.level_up.iron_belly.b',
        'ui.banter.level_up.iron_belly.c',
        'ui.banter.level_up.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.level_up.moor_runner.a',
        'ui.banter.level_up.moor_runner.b',
        'ui.banter.level_up.moor_runner.c',
        'ui.banter.level_up.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.level_up.glen_forager.a',
        'ui.banter.level_up.glen_forager.b',
        'ui.banter.level_up.glen_forager.c',
        'ui.banter.level_up.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.level_up.surefoot.a',
        'ui.banter.level_up.surefoot.b',
        'ui.banter.level_up.surefoot.c',
        'ui.banter.level_up.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.level_up.pipe_breath.a',
        'ui.banter.level_up.pipe_breath.b',
        'ui.banter.level_up.pipe_breath.c',
        'ui.banter.level_up.pipe_breath.d',
      ],
    },
  },
  {
    context: 'first_blood',
    tone: 'hearth',
    priority: 50,
    keys: [
      'ui.banter.first_blood.a',
      'ui.banter.first_blood.b',
      'ui.banter.first_blood.c',
      'ui.banter.first_blood.d',
    ],
    keysByTag: {
      iron_belly: [
        'ui.banter.first_blood.iron_belly.a',
        'ui.banter.first_blood.iron_belly.b',
        'ui.banter.first_blood.iron_belly.c',
        'ui.banter.first_blood.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.first_blood.moor_runner.a',
        'ui.banter.first_blood.moor_runner.b',
        'ui.banter.first_blood.moor_runner.c',
        'ui.banter.first_blood.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.first_blood.glen_forager.a',
        'ui.banter.first_blood.glen_forager.b',
        'ui.banter.first_blood.glen_forager.c',
        'ui.banter.first_blood.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.first_blood.surefoot.a',
        'ui.banter.first_blood.surefoot.b',
        'ui.banter.first_blood.surefoot.c',
        'ui.banter.first_blood.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.first_blood.pipe_breath.a',
        'ui.banter.first_blood.pipe_breath.b',
        'ui.banter.first_blood.pipe_breath.c',
        'ui.banter.first_blood.pipe_breath.d',
      ],
    },
  },
  {
    context: 'kill_streak',
    tone: 'hearth',
    priority: 40,
    keys: [
      'ui.banter.kill_streak.a',
      'ui.banter.kill_streak.b',
      'ui.banter.kill_streak.c',
      'ui.banter.kill_streak.d',
      'ui.banter.kill_streak.e',
    ],
    keysByTag: {
      iron_belly: [
        'ui.banter.kill_streak.iron_belly.a',
        'ui.banter.kill_streak.iron_belly.b',
        'ui.banter.kill_streak.iron_belly.c',
        'ui.banter.kill_streak.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.kill_streak.moor_runner.a',
        'ui.banter.kill_streak.moor_runner.b',
        'ui.banter.kill_streak.moor_runner.c',
        'ui.banter.kill_streak.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.kill_streak.glen_forager.a',
        'ui.banter.kill_streak.glen_forager.b',
        'ui.banter.kill_streak.glen_forager.c',
        'ui.banter.kill_streak.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.kill_streak.surefoot.a',
        'ui.banter.kill_streak.surefoot.b',
        'ui.banter.kill_streak.surefoot.c',
        'ui.banter.kill_streak.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.kill_streak.pipe_breath.a',
        'ui.banter.kill_streak.pipe_breath.b',
        'ui.banter.kill_streak.pipe_breath.c',
        'ui.banter.kill_streak.pipe_breath.d',
      ],
    },
  },
  {
    context: 'recover',
    tone: 'hearth',
    priority: 35,
    keys: [
      'ui.banter.recover.a',
      'ui.banter.recover.b',
      'ui.banter.recover.c',
      'ui.banter.recover.d',
    ],
    keysByTag: {
      iron_belly: [
        'ui.banter.recover.iron_belly.a',
        'ui.banter.recover.iron_belly.b',
        'ui.banter.recover.iron_belly.c',
        'ui.banter.recover.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.recover.moor_runner.a',
        'ui.banter.recover.moor_runner.b',
        'ui.banter.recover.moor_runner.c',
        'ui.banter.recover.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.recover.glen_forager.a',
        'ui.banter.recover.glen_forager.b',
        'ui.banter.recover.glen_forager.c',
        'ui.banter.recover.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.recover.surefoot.a',
        'ui.banter.recover.surefoot.b',
        'ui.banter.recover.surefoot.c',
        'ui.banter.recover.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.recover.pipe_breath.a',
        'ui.banter.recover.pipe_breath.b',
        'ui.banter.recover.pipe_breath.c',
        'ui.banter.recover.pipe_breath.d',
      ],
    },
  },
  {
    context: 'biome_change',
    tone: 'hearth',
    priority: 30,
    keys: [
      'ui.banter.biome_change.a',
      'ui.banter.biome_change.b',
      'ui.banter.biome_change.c',
      'ui.banter.biome_change.d',
    ],
    keysByTag: {
      bog: [
        'ui.banter.biome_change.bog.a',
        'ui.banter.biome_change.bog.b',
        'ui.banter.biome_change.bog.c',
        'ui.banter.biome_change.bog.d',
      ],
      loch: [
        'ui.banter.biome_change.loch.a',
        'ui.banter.biome_change.loch.b',
        'ui.banter.biome_change.loch.c',
        'ui.banter.biome_change.loch.d',
      ],
      pine: [
        'ui.banter.biome_change.pine.a',
        'ui.banter.biome_change.pine.b',
        'ui.banter.biome_change.pine.c',
        'ui.banter.biome_change.pine.d',
      ],
      heather: [
        'ui.banter.biome_change.heather.a',
        'ui.banter.biome_change.heather.b',
        'ui.banter.biome_change.heather.c',
        'ui.banter.biome_change.heather.d',
      ],
    },
  },
  {
    context: 'moor_moment',
    tone: 'hearth',
    priority: 31,
    keys: [
      'ui.banter.moor_moment.a',
      'ui.banter.moor_moment.b',
      'ui.banter.moor_moment.c',
      'ui.banter.moor_moment.d',
      'ui.banter.moor_moment.e',
      'ui.banter.moor_moment.f',
    ],
    keysByTag: {
      home_bog: [
        'ui.banter.moor_moment.home_bog.a',
        'ui.banter.moor_moment.home_bog.b',
        'ui.banter.moor_moment.home_bog.c',
        'ui.banter.moor_moment.home_bog.d',
      ],
      home_loch: [
        'ui.banter.moor_moment.home_loch.a',
        'ui.banter.moor_moment.home_loch.b',
        'ui.banter.moor_moment.home_loch.c',
        'ui.banter.moor_moment.home_loch.d',
      ],
      home_pine: [
        'ui.banter.moor_moment.home_pine.a',
        'ui.banter.moor_moment.home_pine.b',
        'ui.banter.moor_moment.home_pine.c',
        'ui.banter.moor_moment.home_pine.d',
      ],
      home_heather: [
        'ui.banter.moor_moment.home_heather.a',
        'ui.banter.moor_moment.home_heather.b',
        'ui.banter.moor_moment.home_heather.c',
        'ui.banter.moor_moment.home_heather.d',
      ],
      bog: [
        'ui.banter.moor_moment.bog.a',
        'ui.banter.moor_moment.bog.b',
        'ui.banter.moor_moment.bog.c',
      ],
      loch: [
        'ui.banter.moor_moment.loch.a',
        'ui.banter.moor_moment.loch.b',
        'ui.banter.moor_moment.loch.c',
      ],
      pine: [
        'ui.banter.moor_moment.pine.a',
        'ui.banter.moor_moment.pine.b',
        'ui.banter.moor_moment.pine.c',
      ],
      heather: [
        'ui.banter.moor_moment.heather.a',
        'ui.banter.moor_moment.heather.b',
        'ui.banter.moor_moment.heather.c',
      ],
    },
  },
  {
    context: 'idle',
    tone: 'hearth',
    priority: 10,
    keys: [
      'ui.banter.idle.a',
      'ui.banter.idle.b',
      'ui.banter.idle.c',
      'ui.banter.idle.d',
      'ui.banter.idle.e',
      'ui.banter.idle.f',
    ],
    keysByTag: {
      iron_belly: [
        'ui.banter.idle.iron_belly.a',
        'ui.banter.idle.iron_belly.b',
        'ui.banter.idle.iron_belly.c',
        'ui.banter.idle.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.idle.moor_runner.a',
        'ui.banter.idle.moor_runner.b',
        'ui.banter.idle.moor_runner.c',
        'ui.banter.idle.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.idle.glen_forager.a',
        'ui.banter.idle.glen_forager.b',
        'ui.banter.idle.glen_forager.c',
        'ui.banter.idle.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.idle.surefoot.a',
        'ui.banter.idle.surefoot.b',
        'ui.banter.idle.surefoot.c',
        'ui.banter.idle.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.idle.pipe_breath.a',
        'ui.banter.idle.pipe_breath.b',
        'ui.banter.idle.pipe_breath.c',
        'ui.banter.idle.pipe_breath.d',
      ],
    },
  },
  // W2 Moor Road — placeholder copy; full Glesga voice pass in M3.
  {
    context: 'act_intermission_enter',
    tone: 'hearth',
    priority: 52,
    keys: [
      'ui.banter.act_intermission_enter.a',
      'ui.banter.act_intermission_enter.b',
      'ui.banter.act_intermission_enter.c',
    ],
  },
  {
    context: 'act_complete',
    tone: 'hearth',
    priority: 57,
    keys: [
      'ui.banter.act_complete.a',
      'ui.banter.act_complete.b',
    ],
  },
  {
    context: 'route_picked',
    tone: 'hearth',
    priority: 48,
    keys: [
      'ui.banter.route_picked.generic.a',
      'ui.banter.route_picked.generic.b',
    ],
    keysByTag: {
      up_the_brae: [
        'ui.banter.route_picked.up_the_brae.a',
        'ui.banter.route_picked.up_the_brae.b',
      ],
      round_the_loch: [
        'ui.banter.route_picked.round_the_loch.a',
        'ui.banter.route_picked.round_the_loch.b',
      ],
      through_the_kirkyard: [
        'ui.banter.route_picked.through_the_kirkyard.a',
        'ui.banter.route_picked.through_the_kirkyard.b',
      ],
      stand_yer_ground: [
        'ui.banter.route_picked.stand_yer_ground.a',
        'ui.banter.route_picked.stand_yer_ground.b',
      ],
      run_for_the_hills: [
        'ui.banter.route_picked.run_for_the_hills.a',
        'ui.banter.route_picked.run_for_the_hills.b',
      ],
      buckie_pitstop: [
        'ui.banter.route_picked.buckie_pitstop.a',
        'ui.banter.route_picked.buckie_pitstop.b',
      ],
    },
  },
];

export function getBanterPool(context: BanterContext): BanterPool | undefined {
  return BANTER_POOLS.find((p) => p.context === context);
}

/** All i18n keys, flat — generic + every tagged sub-pool. Tests lean on
 *  this to prove every declared key resolves to a real i18n string. */
export const BANTER_KEYS: readonly string[] = BANTER_POOLS.flatMap((p) => {
  const tagged = p.keysByTag ? Object.values(p.keysByTag).flat() : [];
  return [...p.keys, ...tagged];
});
