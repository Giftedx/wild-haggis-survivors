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
  | 'route_picked'
  // Reliquary pickup (M15) — off-path relic claimed
  | 'reliquary_pick'
  // B1 Phase 2 — Gran-voice commentary (hearth, elder warmth *about* the run)
  | 'gran_commentary'
  // B1 Phase 2 Task 12 — cause-tagged warm lament on death screen
  | 'death_reflection'
  // B1 Phase 2 Task 10 — wee-beastie inner-monologue during quiet stretches
  | 'haggis_ambient'
  // B1 Phase 3 Task 17 — per-enemy flavour on first encounter + rare respawn
  | 'enemy_ambient'
  // B1 Phase 3 Task 18 — reserved once-per-save lines (priority 110)
  | 'first_time'
  // B1 Phase 4 Task 22 — verified Burns quotations at context-matched triggers
  | 'burns_citation'
  // B1 Phase 4 Task 21 — Cailleach voice; act intermissions, low-HP, Bargain.
  // [GAELIC-REVIEW] Some leaves carry untranslated Gaelic fragments — every
  // such line is flagged with `[GAELIC-REVIEW]` in i18n.ts and listed in
  // docs/top-10-tasks/blocked/06-blocked-on-human.md. Native review required
  // before the lines reach a public release; pool ships hidden from general
  // play until reviewed (see graduation below).
  | 'cailleach_whisper'
  // B1 Phase 5 — seasonal-event banter. Fires when a seasonal window is
  // active (see SeasonalEventManager.activeSeasonalEvents). Sub-pool tags
  // mirror event keys: burns_night | hogmanay | samhain | beltane.
  | 'seasonal_event';

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
  /**
   * C1 M4 Task 21 — pool-level rarity flag for the Almanac's Banter
   * book. Lines in a `rare` pool surface with a ✨ marker so the player
   * sees them as collectibles rather than everyday lines. Trigger-gated
   * or once-per-save pools (first_time, burns_citation, reliquary_pick,
   * ...) set this true; default = false.
   */
  rare?: boolean;
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
      // 2026-04-29 expansion — 12 generic lines clears the no-repeat
      // window-size of 8 so back-to-back boss arrivals never recycle.
      'ui.banter.boss_warn.f',
      'ui.banter.boss_warn.g',
      'ui.banter.boss_warn.h',
      'ui.banter.boss_warn.i',
      'ui.banter.boss_warn.j',
      'ui.banter.boss_warn.k',
      'ui.banter.boss_warn.l',
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
      each_uisge: [
        'ui.banter.boss_warn.each_uisge.a',
        'ui.banter.boss_warn.each_uisge.b',
        'ui.banter.boss_warn.each_uisge.c',
      ],
      tour_bus: [
        'ui.banter.boss_warn.tour_bus.a',
        'ui.banter.boss_warn.tour_bus.b',
        'ui.banter.boss_warn.tour_bus.c',
      ],
      nicnevin: [
        'ui.banter.boss_warn.nicnevin.a',
        'ui.banter.boss_warn.nicnevin.b',
        'ui.banter.boss_warn.nicnevin.c',
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
      'ui.banter.low_hp.f',
      'ui.banter.low_hp.g',
      'ui.banter.low_hp.h',
      'ui.banter.low_hp.i',
      'ui.banter.low_hp.j',
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
      laird: [
        'ui.banter.low_hp.laird.a',
        'ui.banter.low_hp.laird.b',
        'ui.banter.low_hp.laird.c',
        'ui.banter.low_hp.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.low_hp.wee_ghostie.a',
        'ui.banter.low_hp.wee_ghostie.b',
        'ui.banter.low_hp.wee_ghostie.c',
        'ui.banter.low_hp.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.low_hp.glaswegian.a',
        'ui.banter.low_hp.glaswegian.b',
        'ui.banter.low_hp.glaswegian.c',
        'ui.banter.low_hp.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.low_hp.cailleach.a',
        'ui.banter.low_hp.cailleach.b',
        'ui.banter.low_hp.cailleach.c',
        'ui.banter.low_hp.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.low_hp.anticlockwise.a',
        'ui.banter.low_hp.anticlockwise.b',
        'ui.banter.low_hp.anticlockwise.c',
        'ui.banter.low_hp.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.low_hp.doric_quinie.a',
        'ui.banter.low_hp.doric_quinie.b',
        'ui.banter.low_hp.doric_quinie.c',
        'ui.banter.low_hp.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.low_hp.peerie_shetlander.a',
        'ui.banter.low_hp.peerie_shetlander.b',
        'ui.banter.low_hp.peerie_shetlander.c',
        'ui.banter.low_hp.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.low_hp.burns_wee_beastie.a',
        'ui.banter.low_hp.burns_wee_beastie.b',
        'ui.banter.low_hp.burns_wee_beastie.c',
        'ui.banter.low_hp.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.low_hp.witch_hare.a',
        'ui.banter.low_hp.witch_hare.b',
        'ui.banter.low_hp.witch_hare.c',
        'ui.banter.low_hp.witch_hare.d',
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
      'ui.banter.boss_down.e',
      'ui.banter.boss_down.f',
      'ui.banter.boss_down.g',
      'ui.banter.boss_down.h',
      'ui.banter.boss_down.i',
    ],
    keysByTag: {
      gordon: [
        'ui.banter.boss_down.gordon.a',
        'ui.banter.boss_down.gordon.b',
        'ui.banter.boss_down.gordon.c',
      ],
      each_uisge: [
        'ui.banter.boss_down.each_uisge.a',
        'ui.banter.boss_down.each_uisge.b',
        'ui.banter.boss_down.each_uisge.c',
      ],
      tour_bus: [
        'ui.banter.boss_down.tour_bus.a',
        'ui.banter.boss_down.tour_bus.b',
        'ui.banter.boss_down.tour_bus.c',
      ],
      nicnevin: [
        'ui.banter.boss_down.nicnevin.a',
        'ui.banter.boss_down.nicnevin.b',
        'ui.banter.boss_down.nicnevin.c',
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
      'ui.banter.weapon_evolve.e',
      'ui.banter.weapon_evolve.f',
      'ui.banter.weapon_evolve.g',
      'ui.banter.weapon_evolve.h',
      'ui.banter.weapon_evolve.i',
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
      // Bagpipes is utility-only (no entry in EVOLUTION_RECIPES) — see
      // CLAUDE.md "7 of the 8 weapons have a paired passive". Banter pool
      // intentionally omits a `bagpipes` tag so the system can never queue
      // a line that promises a non-existent evolution (T212).
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
      'ui.banter.curse_start.generic.e',
      'ui.banter.curse_start.generic.f',
      'ui.banter.curse_start.generic.g',
      'ui.banter.curse_start.generic.h',
      'ui.banter.curse_start.generic.i',
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
      windless_pipes: [
        'ui.banter.curse_start.windless_pipes.a',
        'ui.banter.curse_start.windless_pipes.b',
        'ui.banter.curse_start.windless_pipes.c',
        'ui.banter.curse_start.windless_pipes.d',
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
      laird: [
        'ui.banter.level_up.laird.a',
        'ui.banter.level_up.laird.b',
        'ui.banter.level_up.laird.c',
        'ui.banter.level_up.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.level_up.wee_ghostie.a',
        'ui.banter.level_up.wee_ghostie.b',
        'ui.banter.level_up.wee_ghostie.c',
        'ui.banter.level_up.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.level_up.glaswegian.a',
        'ui.banter.level_up.glaswegian.b',
        'ui.banter.level_up.glaswegian.c',
        'ui.banter.level_up.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.level_up.cailleach.a',
        'ui.banter.level_up.cailleach.b',
        'ui.banter.level_up.cailleach.c',
        'ui.banter.level_up.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.level_up.anticlockwise.a',
        'ui.banter.level_up.anticlockwise.b',
        'ui.banter.level_up.anticlockwise.c',
        'ui.banter.level_up.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.level_up.doric_quinie.a',
        'ui.banter.level_up.doric_quinie.b',
        'ui.banter.level_up.doric_quinie.c',
        'ui.banter.level_up.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.level_up.peerie_shetlander.a',
        'ui.banter.level_up.peerie_shetlander.b',
        'ui.banter.level_up.peerie_shetlander.c',
        'ui.banter.level_up.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.level_up.burns_wee_beastie.a',
        'ui.banter.level_up.burns_wee_beastie.b',
        'ui.banter.level_up.burns_wee_beastie.c',
        'ui.banter.level_up.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.level_up.witch_hare.a',
        'ui.banter.level_up.witch_hare.b',
        'ui.banter.level_up.witch_hare.c',
        'ui.banter.level_up.witch_hare.d',
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
      'ui.banter.first_blood.e',
      'ui.banter.first_blood.f',
      'ui.banter.first_blood.g',
      'ui.banter.first_blood.h',
      'ui.banter.first_blood.i',
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
      laird: [
        'ui.banter.first_blood.laird.a',
        'ui.banter.first_blood.laird.b',
        'ui.banter.first_blood.laird.c',
        'ui.banter.first_blood.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.first_blood.wee_ghostie.a',
        'ui.banter.first_blood.wee_ghostie.b',
        'ui.banter.first_blood.wee_ghostie.c',
        'ui.banter.first_blood.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.first_blood.glaswegian.a',
        'ui.banter.first_blood.glaswegian.b',
        'ui.banter.first_blood.glaswegian.c',
        'ui.banter.first_blood.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.first_blood.cailleach.a',
        'ui.banter.first_blood.cailleach.b',
        'ui.banter.first_blood.cailleach.c',
        'ui.banter.first_blood.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.first_blood.anticlockwise.a',
        'ui.banter.first_blood.anticlockwise.b',
        'ui.banter.first_blood.anticlockwise.c',
        'ui.banter.first_blood.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.first_blood.doric_quinie.a',
        'ui.banter.first_blood.doric_quinie.b',
        'ui.banter.first_blood.doric_quinie.c',
        'ui.banter.first_blood.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.first_blood.peerie_shetlander.a',
        'ui.banter.first_blood.peerie_shetlander.b',
        'ui.banter.first_blood.peerie_shetlander.c',
        'ui.banter.first_blood.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.first_blood.burns_wee_beastie.a',
        'ui.banter.first_blood.burns_wee_beastie.b',
        'ui.banter.first_blood.burns_wee_beastie.c',
        'ui.banter.first_blood.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.first_blood.witch_hare.a',
        'ui.banter.first_blood.witch_hare.b',
        'ui.banter.first_blood.witch_hare.c',
        'ui.banter.first_blood.witch_hare.d',
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
      'ui.banter.kill_streak.f',
      'ui.banter.kill_streak.g',
      'ui.banter.kill_streak.h',
      'ui.banter.kill_streak.i',
      'ui.banter.kill_streak.j',
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
      laird: [
        'ui.banter.kill_streak.laird.a',
        'ui.banter.kill_streak.laird.b',
        'ui.banter.kill_streak.laird.c',
        'ui.banter.kill_streak.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.kill_streak.wee_ghostie.a',
        'ui.banter.kill_streak.wee_ghostie.b',
        'ui.banter.kill_streak.wee_ghostie.c',
        'ui.banter.kill_streak.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.kill_streak.glaswegian.a',
        'ui.banter.kill_streak.glaswegian.b',
        'ui.banter.kill_streak.glaswegian.c',
        'ui.banter.kill_streak.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.kill_streak.cailleach.a',
        'ui.banter.kill_streak.cailleach.b',
        'ui.banter.kill_streak.cailleach.c',
        'ui.banter.kill_streak.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.kill_streak.anticlockwise.a',
        'ui.banter.kill_streak.anticlockwise.b',
        'ui.banter.kill_streak.anticlockwise.c',
        'ui.banter.kill_streak.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.kill_streak.doric_quinie.a',
        'ui.banter.kill_streak.doric_quinie.b',
        'ui.banter.kill_streak.doric_quinie.c',
        'ui.banter.kill_streak.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.kill_streak.peerie_shetlander.a',
        'ui.banter.kill_streak.peerie_shetlander.b',
        'ui.banter.kill_streak.peerie_shetlander.c',
        'ui.banter.kill_streak.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.kill_streak.burns_wee_beastie.a',
        'ui.banter.kill_streak.burns_wee_beastie.b',
        'ui.banter.kill_streak.burns_wee_beastie.c',
        'ui.banter.kill_streak.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.kill_streak.witch_hare.a',
        'ui.banter.kill_streak.witch_hare.b',
        'ui.banter.kill_streak.witch_hare.c',
        'ui.banter.kill_streak.witch_hare.d',
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
      'ui.banter.recover.e',
      'ui.banter.recover.f',
      'ui.banter.recover.g',
      'ui.banter.recover.h',
      'ui.banter.recover.i',
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
      laird: [
        'ui.banter.recover.laird.a',
        'ui.banter.recover.laird.b',
        'ui.banter.recover.laird.c',
        'ui.banter.recover.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.recover.wee_ghostie.a',
        'ui.banter.recover.wee_ghostie.b',
        'ui.banter.recover.wee_ghostie.c',
        'ui.banter.recover.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.recover.glaswegian.a',
        'ui.banter.recover.glaswegian.b',
        'ui.banter.recover.glaswegian.c',
        'ui.banter.recover.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.recover.cailleach.a',
        'ui.banter.recover.cailleach.b',
        'ui.banter.recover.cailleach.c',
        'ui.banter.recover.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.recover.anticlockwise.a',
        'ui.banter.recover.anticlockwise.b',
        'ui.banter.recover.anticlockwise.c',
        'ui.banter.recover.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.recover.doric_quinie.a',
        'ui.banter.recover.doric_quinie.b',
        'ui.banter.recover.doric_quinie.c',
        'ui.banter.recover.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.recover.peerie_shetlander.a',
        'ui.banter.recover.peerie_shetlander.b',
        'ui.banter.recover.peerie_shetlander.c',
        'ui.banter.recover.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.recover.burns_wee_beastie.a',
        'ui.banter.recover.burns_wee_beastie.b',
        'ui.banter.recover.burns_wee_beastie.c',
        'ui.banter.recover.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.recover.witch_hare.a',
        'ui.banter.recover.witch_hare.b',
        'ui.banter.recover.witch_hare.c',
        'ui.banter.recover.witch_hare.d',
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
      'ui.banter.biome_change.e',
      'ui.banter.biome_change.f',
      'ui.banter.biome_change.g',
      'ui.banter.biome_change.h',
      'ui.banter.biome_change.i',
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
      coastal: [
        'ui.banter.biome_change.coastal.a',
        'ui.banter.biome_change.coastal.b',
        'ui.banter.biome_change.coastal.c',
        'ui.banter.biome_change.coastal.d',
      ],
      haar: [
        'ui.banter.biome_change.haar.a',
        'ui.banter.biome_change.haar.b',
        'ui.banter.biome_change.haar.c',
        'ui.banter.biome_change.haar.d',
      ],
      frost: [
        'ui.banter.biome_change.frost.a',
        'ui.banter.biome_change.frost.b',
        'ui.banter.biome_change.frost.c',
        'ui.banter.biome_change.frost.d',
      ],
    },
  },
  {
    context: 'moor_moment',
    tone: 'hearth',
    priority: 31,
    // B1 Phase 2 Task 11 — expanded generic pool (a–z, 26 lines) and every
    // biome tag to +3; home_biome tags to +2. Totals +40 leaves over the
    // Phase 1 baseline, voice-registered against the moor-observational
    // hearth tone (short, metaphor-light, moor-tipping-its-hat energy).
    keys: [
      'ui.banter.moor_moment.a',
      'ui.banter.moor_moment.b',
      'ui.banter.moor_moment.c',
      'ui.banter.moor_moment.d',
      'ui.banter.moor_moment.e',
      'ui.banter.moor_moment.f',
      'ui.banter.moor_moment.g',
      'ui.banter.moor_moment.h',
      'ui.banter.moor_moment.i',
      'ui.banter.moor_moment.j',
      'ui.banter.moor_moment.k',
      'ui.banter.moor_moment.l',
      'ui.banter.moor_moment.m',
      'ui.banter.moor_moment.n',
      'ui.banter.moor_moment.o',
      'ui.banter.moor_moment.p',
      'ui.banter.moor_moment.q',
      'ui.banter.moor_moment.r',
      'ui.banter.moor_moment.s',
      'ui.banter.moor_moment.t',
      'ui.banter.moor_moment.u',
      'ui.banter.moor_moment.v',
      'ui.banter.moor_moment.w',
      'ui.banter.moor_moment.x',
      'ui.banter.moor_moment.y',
      'ui.banter.moor_moment.z',
    ],
    keysByTag: {
      home_bog: [
        'ui.banter.moor_moment.home_bog.a',
        'ui.banter.moor_moment.home_bog.b',
        'ui.banter.moor_moment.home_bog.c',
        'ui.banter.moor_moment.home_bog.d',
        'ui.banter.moor_moment.home_bog.e',
        'ui.banter.moor_moment.home_bog.f',
      ],
      home_loch: [
        'ui.banter.moor_moment.home_loch.a',
        'ui.banter.moor_moment.home_loch.b',
        'ui.banter.moor_moment.home_loch.c',
        'ui.banter.moor_moment.home_loch.d',
        'ui.banter.moor_moment.home_loch.e',
        'ui.banter.moor_moment.home_loch.f',
      ],
      home_pine: [
        'ui.banter.moor_moment.home_pine.a',
        'ui.banter.moor_moment.home_pine.b',
        'ui.banter.moor_moment.home_pine.c',
        'ui.banter.moor_moment.home_pine.d',
        'ui.banter.moor_moment.home_pine.e',
        'ui.banter.moor_moment.home_pine.f',
      ],
      home_heather: [
        'ui.banter.moor_moment.home_heather.a',
        'ui.banter.moor_moment.home_heather.b',
        'ui.banter.moor_moment.home_heather.c',
        'ui.banter.moor_moment.home_heather.d',
        'ui.banter.moor_moment.home_heather.e',
        'ui.banter.moor_moment.home_heather.f',
      ],
      bog: [
        'ui.banter.moor_moment.bog.a',
        'ui.banter.moor_moment.bog.b',
        'ui.banter.moor_moment.bog.c',
        'ui.banter.moor_moment.bog.d',
        'ui.banter.moor_moment.bog.e',
        'ui.banter.moor_moment.bog.f',
      ],
      loch: [
        'ui.banter.moor_moment.loch.a',
        'ui.banter.moor_moment.loch.b',
        'ui.banter.moor_moment.loch.c',
        'ui.banter.moor_moment.loch.d',
        'ui.banter.moor_moment.loch.e',
        'ui.banter.moor_moment.loch.f',
      ],
      pine: [
        'ui.banter.moor_moment.pine.a',
        'ui.banter.moor_moment.pine.b',
        'ui.banter.moor_moment.pine.c',
        'ui.banter.moor_moment.pine.d',
        'ui.banter.moor_moment.pine.e',
        'ui.banter.moor_moment.pine.f',
      ],
      heather: [
        'ui.banter.moor_moment.heather.a',
        'ui.banter.moor_moment.heather.b',
        'ui.banter.moor_moment.heather.c',
        'ui.banter.moor_moment.heather.d',
        'ui.banter.moor_moment.heather.e',
        'ui.banter.moor_moment.heather.f',
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
      'ui.banter.idle.g',
      'ui.banter.idle.h',
      'ui.banter.idle.i',
      'ui.banter.idle.j',
      'ui.banter.idle.k',
      'ui.banter.idle.l',
      'ui.banter.idle.m',
      'ui.banter.idle.n',
      'ui.banter.idle.o',
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
      laird: [
        'ui.banter.idle.laird.a',
        'ui.banter.idle.laird.b',
        'ui.banter.idle.laird.c',
        'ui.banter.idle.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.idle.wee_ghostie.a',
        'ui.banter.idle.wee_ghostie.b',
        'ui.banter.idle.wee_ghostie.c',
        'ui.banter.idle.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.idle.glaswegian.a',
        'ui.banter.idle.glaswegian.b',
        'ui.banter.idle.glaswegian.c',
        'ui.banter.idle.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.idle.cailleach.a',
        'ui.banter.idle.cailleach.b',
        'ui.banter.idle.cailleach.c',
        'ui.banter.idle.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.idle.anticlockwise.a',
        'ui.banter.idle.anticlockwise.b',
        'ui.banter.idle.anticlockwise.c',
        'ui.banter.idle.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.idle.doric_quinie.a',
        'ui.banter.idle.doric_quinie.b',
        'ui.banter.idle.doric_quinie.c',
        'ui.banter.idle.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.idle.peerie_shetlander.a',
        'ui.banter.idle.peerie_shetlander.b',
        'ui.banter.idle.peerie_shetlander.c',
        'ui.banter.idle.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.idle.burns_wee_beastie.a',
        'ui.banter.idle.burns_wee_beastie.b',
        'ui.banter.idle.burns_wee_beastie.c',
        'ui.banter.idle.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.idle.witch_hare.a',
        'ui.banter.idle.witch_hare.b',
        'ui.banter.idle.witch_hare.c',
        'ui.banter.idle.witch_hare.d',
      ],
    },
  },
  // W2 Moor Road.
  {
    context: 'act_intermission_enter',
    tone: 'hearth',
    priority: 52,
    keys: [
      'ui.banter.act_intermission_enter.a',
      'ui.banter.act_intermission_enter.b',
      'ui.banter.act_intermission_enter.c',
      'ui.banter.act_intermission_enter.d',
      'ui.banter.act_intermission_enter.e',
      'ui.banter.act_intermission_enter.f',
      'ui.banter.act_intermission_enter.g',
      'ui.banter.act_intermission_enter.h',
    ],
  },
  {
    context: 'act_complete',
    tone: 'hearth',
    priority: 57,
    keys: [
      'ui.banter.act_complete.a',
      'ui.banter.act_complete.b',
      'ui.banter.act_complete.c',
      'ui.banter.act_complete.d',
      'ui.banter.act_complete.e',
      'ui.banter.act_complete.f',
      'ui.banter.act_complete.g',
    ],
    // 2026-04-29 — GameScene's `launchActIntermission` now tags the
    // request with `act_${actN}` so each gate's outro reads as the
    // specific gate just fallen, not the same two-liner each time.
    keysByTag: {
      act_1: [
        'ui.banter.act_complete.act_1.a',
        'ui.banter.act_complete.act_1.b',
        'ui.banter.act_complete.act_1.c',
        'ui.banter.act_complete.act_1.d',
      ],
      act_2: [
        'ui.banter.act_complete.act_2.a',
        'ui.banter.act_complete.act_2.b',
        'ui.banter.act_complete.act_2.c',
        'ui.banter.act_complete.act_2.d',
      ],
    },
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
  {
    // B1 Phase 2 — Gran's commentary. Hearth, elder warmth *about* the run.
    // Priority 28 sits between idle (10) and biome_change (30) so scenic
    // biome shifts still win same-tick arbitration; Gran fires at run
    // boundaries and moor moments where that rarely clashes. Spec §2
    // proposed 30 but it collided with biome_change — resolved here.
    context: 'gran_commentary',
    tone: 'hearth',
    priority: 28,
    keys: [
      'ui.banter.gran_commentary.a',
      'ui.banter.gran_commentary.b',
      'ui.banter.gran_commentary.c',
      'ui.banter.gran_commentary.d',
      'ui.banter.gran_commentary.e',
      'ui.banter.gran_commentary.f',
      'ui.banter.gran_commentary.g',
      'ui.banter.gran_commentary.h',
      'ui.banter.gran_commentary.i',
      'ui.banter.gran_commentary.j',
      'ui.banter.gran_commentary.k',
      'ui.banter.gran_commentary.l',
    ],
    keysByTag: {
      run_start: [
        'ui.banter.gran_commentary.run_start.a',
        'ui.banter.gran_commentary.run_start.b',
        'ui.banter.gran_commentary.run_start.c',
        'ui.banter.gran_commentary.run_start.d',
        'ui.banter.gran_commentary.run_start.e',
        'ui.banter.gran_commentary.run_start.f',
        'ui.banter.gran_commentary.run_start.g',
        'ui.banter.gran_commentary.run_start.h',
      ],
      run_end_victory: [
        'ui.banter.gran_commentary.run_end_victory.a',
        'ui.banter.gran_commentary.run_end_victory.b',
        'ui.banter.gran_commentary.run_end_victory.c',
        'ui.banter.gran_commentary.run_end_victory.d',
        'ui.banter.gran_commentary.run_end_victory.e',
        'ui.banter.gran_commentary.run_end_victory.f',
      ],
      run_end_defeat: [
        'ui.banter.gran_commentary.run_end_defeat.a',
        'ui.banter.gran_commentary.run_end_defeat.b',
        'ui.banter.gran_commentary.run_end_defeat.c',
        'ui.banter.gran_commentary.run_end_defeat.d',
        'ui.banter.gran_commentary.run_end_defeat.e',
        'ui.banter.gran_commentary.run_end_defeat.f',
      ],
      moor_moment: [
        'ui.banter.gran_commentary.moor_moment.a',
        'ui.banter.gran_commentary.moor_moment.b',
        'ui.banter.gran_commentary.moor_moment.c',
        'ui.banter.gran_commentary.moor_moment.d',
        'ui.banter.gran_commentary.moor_moment.e',
        'ui.banter.gran_commentary.moor_moment.f',
      ],
      seasonal_event: [
        'ui.banter.gran_commentary.seasonal_event.a',
        'ui.banter.gran_commentary.seasonal_event.b',
        'ui.banter.gran_commentary.seasonal_event.c',
        'ui.banter.gran_commentary.seasonal_event.d',
        'ui.banter.gran_commentary.seasonal_event.e',
        'ui.banter.gran_commentary.seasonal_event.f',
      ],
      // B1 Phase 4 expansion — H1 Croft hub touchpoints. Wired to
      // CroftScene at first arrival, mantel glance, drove-route
      // returns, and morning-visit reset (per BANTER_GAPS §Phase 4).
      croft_arrival: [
        'ui.banter.gran_commentary.croft_arrival.a',
        'ui.banter.gran_commentary.croft_arrival.b',
        'ui.banter.gran_commentary.croft_arrival.c',
        'ui.banter.gran_commentary.croft_arrival.d',
        'ui.banter.gran_commentary.croft_arrival.e',
        'ui.banter.gran_commentary.croft_arrival.f',
        'ui.banter.gran_commentary.croft_arrival.g',
        'ui.banter.gran_commentary.croft_arrival.h',
      ],
      morning_hub: [
        'ui.banter.gran_commentary.morning_hub.a',
        'ui.banter.gran_commentary.morning_hub.b',
        'ui.banter.gran_commentary.morning_hub.c',
        'ui.banter.gran_commentary.morning_hub.d',
        'ui.banter.gran_commentary.morning_hub.e',
        'ui.banter.gran_commentary.morning_hub.f',
        'ui.banter.gran_commentary.morning_hub.g',
        'ui.banter.gran_commentary.morning_hub.h',
      ],
      drove_return: [
        'ui.banter.gran_commentary.drove_return.a',
        'ui.banter.gran_commentary.drove_return.b',
        'ui.banter.gran_commentary.drove_return.c',
        'ui.banter.gran_commentary.drove_return.d',
        'ui.banter.gran_commentary.drove_return.e',
        'ui.banter.gran_commentary.drove_return.f',
        'ui.banter.gran_commentary.drove_return.g',
        'ui.banter.gran_commentary.drove_return.h',
      ],
      mantel_glance: [
        'ui.banter.gran_commentary.mantel_glance.a',
        'ui.banter.gran_commentary.mantel_glance.b',
        'ui.banter.gran_commentary.mantel_glance.c',
        'ui.banter.gran_commentary.mantel_glance.d',
        'ui.banter.gran_commentary.mantel_glance.e',
        'ui.banter.gran_commentary.mantel_glance.f',
        'ui.banter.gran_commentary.mantel_glance.g',
        'ui.banter.gran_commentary.mantel_glance.h',
      ],
    },
  },
  {
    // B1 Phase 2 Task 12 — Death-screen reflection.
    //
    // Fires from `RunLifecycle.handleDeath` with `tag = DeathCauseTag`
    // (see `src/core/deathCauseClassifier.ts`). Priority 75 sits between
    // boss_down (70) and low_hp (80) so it wins over gran_commentary (28)
    // same-tick arbitration — death_reflection is richer (cause-aware,
    // 30 lines) and replaces the gran run_end_defeat trigger per B1
    // Phase 2 plan. The `run_end_defeat` sub-pool under gran_commentary
    // stays authored for future wiring (post-bell death, future
    // post-mortem pane, etc).
    //
    // Voice register: Hearth, warmly-framed per DESIGN_SOUL §Warmth Audit.
    // Never shaming. Each cause-tag line gently names what happened and
    // (where natural) offers a soft takeaway without duplicating the
    // game-over screen's `formatDeathInsightLine` tip.
    context: 'death_reflection',
    tone: 'hearth',
    priority: 75,
    keys: [
      'ui.banter.death_reflection.a',
      'ui.banter.death_reflection.b',
      'ui.banter.death_reflection.c',
      'ui.banter.death_reflection.d',
      'ui.banter.death_reflection.e',
      'ui.banter.death_reflection.f',
      'ui.banter.death_reflection.g',
      'ui.banter.death_reflection.h',
      'ui.banter.death_reflection.i',
      'ui.banter.death_reflection.j',
      'ui.banter.death_reflection.k',
    ],
    // B1 Phase 4 expansion — each tag grew from 3 → 6 leaves so the
    // no-repeat ring buffer (size 8) has room across consecutive
    // same-cause deaths in playtests.
    keysByTag: {
      hazard: [
        'ui.banter.death_reflection.hazard.a',
        'ui.banter.death_reflection.hazard.b',
        'ui.banter.death_reflection.hazard.c',
        'ui.banter.death_reflection.hazard.d',
        'ui.banter.death_reflection.hazard.e',
        'ui.banter.death_reflection.hazard.f',
      ],
      boss_crushed: [
        'ui.banter.death_reflection.boss_crushed.a',
        'ui.banter.death_reflection.boss_crushed.b',
        'ui.banter.death_reflection.boss_crushed.c',
        'ui.banter.death_reflection.boss_crushed.d',
        'ui.banter.death_reflection.boss_crushed.e',
        'ui.banter.death_reflection.boss_crushed.f',
      ],
      elite_kill: [
        'ui.banter.death_reflection.elite_kill.a',
        'ui.banter.death_reflection.elite_kill.b',
        'ui.banter.death_reflection.elite_kill.c',
        'ui.banter.death_reflection.elite_kill.d',
        'ui.banter.death_reflection.elite_kill.e',
        'ui.banter.death_reflection.elite_kill.f',
      ],
      one_shot: [
        'ui.banter.death_reflection.one_shot.a',
        'ui.banter.death_reflection.one_shot.b',
        'ui.banter.death_reflection.one_shot.c',
        'ui.banter.death_reflection.one_shot.d',
        'ui.banter.death_reflection.one_shot.e',
        'ui.banter.death_reflection.one_shot.f',
      ],
      same_killer: [
        'ui.banter.death_reflection.same_killer.a',
        'ui.banter.death_reflection.same_killer.b',
        'ui.banter.death_reflection.same_killer.c',
        'ui.banter.death_reflection.same_killer.d',
        'ui.banter.death_reflection.same_killer.e',
        'ui.banter.death_reflection.same_killer.f',
      ],
      swarmed: [
        'ui.banter.death_reflection.swarmed.a',
        'ui.banter.death_reflection.swarmed.b',
        'ui.banter.death_reflection.swarmed.c',
        'ui.banter.death_reflection.swarmed.d',
        'ui.banter.death_reflection.swarmed.e',
        'ui.banter.death_reflection.swarmed.f',
      ],
      low_hp_neglect: [
        'ui.banter.death_reflection.low_hp_neglect.a',
        'ui.banter.death_reflection.low_hp_neglect.b',
        'ui.banter.death_reflection.low_hp_neglect.c',
        'ui.banter.death_reflection.low_hp_neglect.d',
        'ui.banter.death_reflection.low_hp_neglect.e',
        'ui.banter.death_reflection.low_hp_neglect.f',
      ],
      unlucky: [
        'ui.banter.death_reflection.unlucky.a',
        'ui.banter.death_reflection.unlucky.b',
        'ui.banter.death_reflection.unlucky.c',
        'ui.banter.death_reflection.unlucky.d',
        'ui.banter.death_reflection.unlucky.e',
        'ui.banter.death_reflection.unlucky.f',
      ],
    },
  },
  {
    // B1 Phase 2 Task 10 — Haggis inner monologue.
    //
    // Fires from `GameTickers.tickBanter` on a 45s ±15s wall-clock
    // interval, gated by HP > 75% AND no enemy within 200px for 10s
    // continuous (quiet-moor-stretch only). Priority 25 sits between
    // biome_change (30) and the 28 gran slot but beats idle (10) so
    // mid-lull monologue surfaces over the catch-all idle chatter.
    //
    // Voice register: Hearth, wee-beastie simple — peaceful sensory
    // notes, food daydreams, small philosophy. Short lines, child-like
    // but never infantile. Generic pool only (no variant sub-pools in
    // this slice; could extend per-variant in a later pass).
    context: 'haggis_ambient',
    tone: 'hearth',
    priority: 25,
    keys: [
      'ui.banter.haggis_ambient.a', 'ui.banter.haggis_ambient.b',
      'ui.banter.haggis_ambient.c', 'ui.banter.haggis_ambient.d',
      'ui.banter.haggis_ambient.e', 'ui.banter.haggis_ambient.f',
      'ui.banter.haggis_ambient.g', 'ui.banter.haggis_ambient.h',
      'ui.banter.haggis_ambient.i', 'ui.banter.haggis_ambient.j',
      'ui.banter.haggis_ambient.k', 'ui.banter.haggis_ambient.l',
      'ui.banter.haggis_ambient.m', 'ui.banter.haggis_ambient.n',
      'ui.banter.haggis_ambient.o', 'ui.banter.haggis_ambient.p',
      'ui.banter.haggis_ambient.q', 'ui.banter.haggis_ambient.r',
      'ui.banter.haggis_ambient.s', 'ui.banter.haggis_ambient.t',
      'ui.banter.haggis_ambient.u', 'ui.banter.haggis_ambient.v',
      'ui.banter.haggis_ambient.w', 'ui.banter.haggis_ambient.x',
      'ui.banter.haggis_ambient.y', 'ui.banter.haggis_ambient.z',
      'ui.banter.haggis_ambient.aa', 'ui.banter.haggis_ambient.ab',
      'ui.banter.haggis_ambient.ac', 'ui.banter.haggis_ambient.ad',
      'ui.banter.haggis_ambient.ae', 'ui.banter.haggis_ambient.af',
      'ui.banter.haggis_ambient.ag', 'ui.banter.haggis_ambient.ah',
      'ui.banter.haggis_ambient.ai', 'ui.banter.haggis_ambient.aj',
      'ui.banter.haggis_ambient.ak', 'ui.banter.haggis_ambient.al',
      'ui.banter.haggis_ambient.am', 'ui.banter.haggis_ambient.an',
      'ui.banter.haggis_ambient.ao', 'ui.banter.haggis_ambient.ap',
      'ui.banter.haggis_ambient.aq', 'ui.banter.haggis_ambient.ar',
      'ui.banter.haggis_ambient.as', 'ui.banter.haggis_ambient.at',
      'ui.banter.haggis_ambient.au', 'ui.banter.haggis_ambient.av',
      'ui.banter.haggis_ambient.aw', 'ui.banter.haggis_ambient.ax',
      // Wild-haggis-myth contraband tribute (8 leaves). See i18n.ts notes
      // on the FDA sheep-lung ban — the haggis is literally illegal in
      // the US, so the wee monologue gets to be smug about it.
      'ui.banter.haggis_ambient.ay', 'ui.banter.haggis_ambient.az',
      'ui.banter.haggis_ambient.ba', 'ui.banter.haggis_ambient.bb',
      'ui.banter.haggis_ambient.bc', 'ui.banter.haggis_ambient.bd',
      'ui.banter.haggis_ambient.be', 'ui.banter.haggis_ambient.bf',
    ],
  },
  {
    // B1 Phase 4 Task 22 — Burns citations. Every line is a verified
    // quotation from Robert Burns (1759-1796), referenced against the
    // Kinsley 1968 critical edition. Public domain; no attribution
    // in-line (the voice itself carries the period cadence).
    //
    // Priority 43 — spec §2 called 45, which was already reliquary_pick's
    // live slot; resolved just below reliquary so a tangible curio
    // pickup keeps its tick and Burns pours through at the slightly
    // quieter moments. Still beats enemy_ambient (41) / kill_streak
    // (40) / moor_moment (31) same-tick.
    //
    // Trigger wiring lives at each call site — eight of nine sub-pools
    // are now wired (2026-05-09). Original Phase 5 deferral removed.
    //
    // Tag register per spec §3: context-justified, never random. Tags
    // map to the trigger surface each sub-pool is authored against:
    //   haggis_moment   → ✅ runeSystemController.ts (rune-pulse burst)
    //   mouse_moment    → ✅ EnemyKillHandler.handle (sheep / midge kill)
    //   loch_moment     → ✅ MoorMomentScheduler (loch biome)
    //   highland_moment → ✅ MoorMomentScheduler (heather / pine biome)
    //   victory_open    → ✅ SpawnSystem.spawnBoss (taxman warn + 9 s)
    //   defeat_lament   → ⏸ DEFERRED. death_reflection (priority 75) wins
    //                       same-tick arbitration over burns_citation (43)
    //                       on player death; GameOverScene has no banter
    //                       sink wired today. Reserved for the post-mortem
    //                       pane wire-up (paired with Gran's defeat sub-
    //                       pool, also currently deferred). Two couplets
    //                       authored ("Ae fond kiss"; "wan moon setting").
    //   charge          → ✅ Player.tickDriftMastery (burst consume edge)
    //   nae_haste       → ✅ GameScene curse_start delayed echo (+9 s)
    //   lineage_moment  → ✅ moorMoments.ts (ancestral echo / variant unlock)
    context: 'burns_citation',
    tone: 'hearth',
    priority: 43,
    rare: true,
    keys: [
      'ui.banter.burns_citation.a',
      'ui.banter.burns_citation.b',
    ],
    keysByTag: {
      haggis_moment: [
        // Eight Habbie-stanza couplets from "Address to a Haggis" (1786).
        // Cycles through the whole anthem across a Burns Night run via
        // the round-robin no-repeat ring.
        'ui.banter.burns_citation.haggis_moment.a',
        'ui.banter.burns_citation.haggis_moment.b',
        'ui.banter.burns_citation.haggis_moment.c',
        'ui.banter.burns_citation.haggis_moment.d',
        'ui.banter.burns_citation.haggis_moment.e',
        'ui.banter.burns_citation.haggis_moment.f',
        'ui.banter.burns_citation.haggis_moment.g',
        'ui.banter.burns_citation.haggis_moment.h',
      ],
      mouse_moment: [
        'ui.banter.burns_citation.mouse_moment.a',
        'ui.banter.burns_citation.mouse_moment.b',
      ],
      loch_moment: [
        'ui.banter.burns_citation.loch_moment.a',
        'ui.banter.burns_citation.loch_moment.b',
      ],
      highland_moment: [
        'ui.banter.burns_citation.highland_moment.a',
        'ui.banter.burns_citation.highland_moment.b',
      ],
      victory_open: [
        'ui.banter.burns_citation.victory_open.a',
        'ui.banter.burns_citation.victory_open.b',
      ],
      defeat_lament: [
        'ui.banter.burns_citation.defeat_lament.a',
        'ui.banter.burns_citation.defeat_lament.b',
      ],
      charge: [
        'ui.banter.burns_citation.charge.a',
        'ui.banter.burns_citation.charge.b',
      ],
      nae_haste: [
        'ui.banter.burns_citation.nae_haste.a',
        'ui.banter.burns_citation.nae_haste.b',
      ],
      lineage_moment: [
        'ui.banter.burns_citation.lineage_moment.a',
        'ui.banter.burns_citation.lineage_moment.b',
      ],
    },
  },
  {
    // B1 Phase 3 Task 18 — reserved first-time lines. Priority 110 beats
    // every other pool (boss_warn at 100 included) so these fire on the
    // exact tick the milestone happens. Once fired, `SaveData.firstTime
    // EventsFired` marks the event and the tag never replays across
    // saves — that's why the pool rides at the top of the ladder.
    //
    // Authored events (15 milestones × 2 lines each = 30 EN + 30 SCS):
    //   Boss first-kills:     gordon / tour_bus / the_laird /
    //                         hunter_general / taxman
    //   Evolution first-pick: thistle_shot / bagpipe_blast / caber_toss /
    //                         scotch_mist / haggis_hurler / nessie_tentacle /
    //                         claymore / bagpipes
    //   Meta milestones:      combo_100 (first 100-hit streak) /
    //                         ironmoor_first_victory
    //
    // Wiring lives with each call site (deferred per plan Task 6 — hook
    // lands alongside content). Boss-kill hook will live in
    // `EnemyKillHandler.handleBossKill`, evolution hook in
    // `LevelUpFlow.applyEvolution`, combo_100 in whatever records combos
    // top-out, and ironmoor_first_victory in the victory path.
    //
    // Every tagged sub-pool ships with 2+ lines so the no-repeat ring
    // buffer won't starve it if (hypothetically) the save-flag guard
    // ever fails to persist. Generic pool is an untagged fallback for
    // unknown events — should never be reached in practice once wiring
    // is complete, but stays for defensive behaviour.
    context: 'first_time',
    tone: 'hearth',
    priority: 110,
    rare: true,
    keys: [
      'ui.banter.first_time.a',
      'ui.banter.first_time.b',
    ],
    keysByTag: {
      boss_gordon_kill: [
        'ui.banter.first_time.boss_gordon_kill.a',
        'ui.banter.first_time.boss_gordon_kill.b',
      ],
      // each_uisge first-kill (2026-04-29) — closes the previously-missing
      // sub-pool gap so the Fey water-horse boss gets its own first-time
      // line instead of falling back to the generic milestone.
      boss_each_uisge_kill: [
        'ui.banter.first_time.boss_each_uisge_kill.a',
        'ui.banter.first_time.boss_each_uisge_kill.b',
      ],
      boss_tour_bus_kill: [
        'ui.banter.first_time.boss_tour_bus_kill.a',
        'ui.banter.first_time.boss_tour_bus_kill.b',
      ],
      // nicnevin first-kill — Fey-Grave register; matches the spec's
      // post-kill pool tone (queen fell, court silenced).
      boss_nicnevin_kill: [
        'ui.banter.first_time.boss_nicnevin_kill.a',
        'ui.banter.first_time.boss_nicnevin_kill.b',
      ],
      boss_the_laird_kill: [
        'ui.banter.first_time.boss_the_laird_kill.a',
        'ui.banter.first_time.boss_the_laird_kill.b',
      ],
      boss_hunter_general_kill: [
        'ui.banter.first_time.boss_hunter_general_kill.a',
        'ui.banter.first_time.boss_hunter_general_kill.b',
      ],
      boss_taxman_kill: [
        'ui.banter.first_time.boss_taxman_kill.a',
        'ui.banter.first_time.boss_taxman_kill.b',
      ],
      evo_thistle_shot: [
        'ui.banter.first_time.evo_thistle_shot.a',
        'ui.banter.first_time.evo_thistle_shot.b',
      ],
      evo_bagpipe_blast: [
        'ui.banter.first_time.evo_bagpipe_blast.a',
        'ui.banter.first_time.evo_bagpipe_blast.b',
      ],
      evo_caber_toss: [
        'ui.banter.first_time.evo_caber_toss.a',
        'ui.banter.first_time.evo_caber_toss.b',
      ],
      evo_scotch_mist: [
        'ui.banter.first_time.evo_scotch_mist.a',
        'ui.banter.first_time.evo_scotch_mist.b',
      ],
      evo_haggis_hurler: [
        'ui.banter.first_time.evo_haggis_hurler.a',
        'ui.banter.first_time.evo_haggis_hurler.b',
      ],
      evo_nessie_tentacle: [
        'ui.banter.first_time.evo_nessie_tentacle.a',
        'ui.banter.first_time.evo_nessie_tentacle.b',
      ],
      evo_claymore: [
        'ui.banter.first_time.evo_claymore.a',
        'ui.banter.first_time.evo_claymore.b',
      ],
      // No evo_bagpipes pool — bagpipes has no evolution per
      // EVOLUTION_RECIPES. T212 audit cleanup.
      combo_100: [
        'ui.banter.first_time.combo_100.a',
        'ui.banter.first_time.combo_100.b',
      ],
      ironmoor_first_victory: [
        'ui.banter.first_time.ironmoor_first_victory.a',
        'ui.banter.first_time.ironmoor_first_victory.b',
      ],
      // R1 M4 T26 — first Relic pickup this account. Gran voice,
      // Hearth register; fires once via `bumpFirstTimeEvent('relic_first_pickup')`.
      relic_first_pickup: [
        'ui.banter.first_time.relic_first_pickup.a',
        'ui.banter.first_time.relic_first_pickup.b',
      ],
      // U1 Task 18 — first Rune pickup this account. Gran voice,
      // Hearth register with a touch of Fey-wonder (cairn-age mystery).
      // Fires once via `bumpFirstTimeEvent('rune_first_pickup')`.
      rune_first_pickup: [
        'ui.banter.first_time.rune_first_pickup.a',
        'ui.banter.first_time.rune_first_pickup.b',
      ],
      // ── B1 Phase 4 expansion — variant unlock first-time banter
      //    (12 non-classic variants). Fires once per unlock-event via
      //    `bumpFirstTimeEvent('variant_${key}_unlocked')` on the
      //    eventual MetaProgression.unlockVariant call surface.
      //    Voice tilts variant-specific per Voice Card §Variant-scoped.
      variant_moor_runner_unlocked: [
        'ui.banter.first_time.variant_moor_runner_unlocked.a',
        'ui.banter.first_time.variant_moor_runner_unlocked.b',
      ],
      variant_iron_belly_unlocked: [
        'ui.banter.first_time.variant_iron_belly_unlocked.a',
        'ui.banter.first_time.variant_iron_belly_unlocked.b',
      ],
      variant_glen_forager_unlocked: [
        'ui.banter.first_time.variant_glen_forager_unlocked.a',
        'ui.banter.first_time.variant_glen_forager_unlocked.b',
      ],
      variant_surefoot_unlocked: [
        'ui.banter.first_time.variant_surefoot_unlocked.a',
        'ui.banter.first_time.variant_surefoot_unlocked.b',
      ],
      variant_pipe_breath_unlocked: [
        'ui.banter.first_time.variant_pipe_breath_unlocked.a',
        'ui.banter.first_time.variant_pipe_breath_unlocked.b',
      ],
      variant_wee_ghostie_unlocked: [
        'ui.banter.first_time.variant_wee_ghostie_unlocked.a',
        'ui.banter.first_time.variant_wee_ghostie_unlocked.b',
      ],
      variant_laird_unlocked: [
        'ui.banter.first_time.variant_laird_unlocked.a',
        'ui.banter.first_time.variant_laird_unlocked.b',
      ],
      variant_glaswegian_unlocked: [
        'ui.banter.first_time.variant_glaswegian_unlocked.a',
        'ui.banter.first_time.variant_glaswegian_unlocked.b',
      ],
      variant_anticlockwise_unlocked: [
        'ui.banter.first_time.variant_anticlockwise_unlocked.a',
        'ui.banter.first_time.variant_anticlockwise_unlocked.b',
      ],
      variant_cailleach_unlocked: [
        'ui.banter.first_time.variant_cailleach_unlocked.a',
        'ui.banter.first_time.variant_cailleach_unlocked.b',
      ],
      variant_doric_quinie_unlocked: [
        'ui.banter.first_time.variant_doric_quinie_unlocked.a',
        'ui.banter.first_time.variant_doric_quinie_unlocked.b',
      ],
      variant_peerie_shetlander_unlocked: [
        'ui.banter.first_time.variant_peerie_shetlander_unlocked.a',
        'ui.banter.first_time.variant_peerie_shetlander_unlocked.b',
      ],
      variant_burns_wee_beastie_unlocked: [
        'ui.banter.first_time.variant_burns_wee_beastie_unlocked.a',
        'ui.banter.first_time.variant_burns_wee_beastie_unlocked.b',
      ],
      // Witch's Hare — Isobel Gowdie 1662 confession. Cursed-victories:5
      // gate. Filed alongside the V2 cohort even though the variant
      // shipped 2026-04-28 (post-V2) — the banter pool was missed in
      // that ship and gets its couplet here as part of the first-time
      // wire-up.
      variant_witch_hare_unlocked: [
        'ui.banter.first_time.variant_witch_hare_unlocked.a',
        'ui.banter.first_time.variant_witch_hare_unlocked.b',
      ],
      // ── B1 Phase 4 expansion — first-pick of each W2 route. Fires
      //    once per route via
      //    `bumpFirstTimeEvent('route_${routeKey}_first')` on the
      //    ActIntermissionScene resolve callback.
      route_up_the_brae_first: [
        'ui.banter.first_time.route_up_the_brae_first.a',
        'ui.banter.first_time.route_up_the_brae_first.b',
      ],
      route_round_the_loch_first: [
        'ui.banter.first_time.route_round_the_loch_first.a',
        'ui.banter.first_time.route_round_the_loch_first.b',
      ],
      route_through_the_kirkyard_first: [
        'ui.banter.first_time.route_through_the_kirkyard_first.a',
        'ui.banter.first_time.route_through_the_kirkyard_first.b',
      ],
      route_stand_yer_ground_first: [
        'ui.banter.first_time.route_stand_yer_ground_first.a',
        'ui.banter.first_time.route_stand_yer_ground_first.b',
      ],
      route_run_for_the_hills_first: [
        'ui.banter.first_time.route_run_for_the_hills_first.a',
        'ui.banter.first_time.route_run_for_the_hills_first.b',
      ],
      route_buckie_pitstop_first: [
        'ui.banter.first_time.route_buckie_pitstop_first.a',
        'ui.banter.first_time.route_buckie_pitstop_first.b',
      ],
      // ── B1 Phase 4 expansion — first daily-challenge clear. Fires
      //    once via `bumpFirstTimeEvent('daily_first_clear')` on the
      //    daily victory path in RunLifecycle.handleVictory.
      daily_first_clear: [
        'ui.banter.first_time.daily_first_clear.a',
        'ui.banter.first_time.daily_first_clear.b',
      ],
    },
  },
  {
    // B1 Phase 3 Task 17 — enemy flavour. Fires on first-encounter of an
    // enemy key (tracked in `SaveData.seenEnemies`) and on a rare 1/20
    // respawn roll thereafter. Priority 40 sits above moor_moment (31) so
    // a new foe's reveal out-talks scenic chatter, but below boss_down
    // (70) / boss_warn (100) so boss moments own their tick cleanly.
    //
    // Wiring: SpawnSystem calls `resolveEnemyAmbientTrigger` (pure) and
    // routes the decision through `scene.requestBanter('enemy_ambient',
    // enemyKey)`. BanterSystem's no-repeat window + per-context cooldown
    // prevent the line from firing twice for the same enemy in the same
    // burst. `keysByTag` gets populated family-by-family across the
    // remaining Task 17 commits; generic pool is the untagged fallback.
    //
    // Priority 41 — spec §2 called 40 but that's the live `kill_streak`
    // slot; same resolution pattern as `gran_commentary` (28 ≠ spec 30).
    // 41 sits just above kill_streak so a first-encounter reveal wins
    // a same-tick arbitration against a streak line, and below
    // reliquary_pick (45) so curio claims keep their moment.
    context: 'enemy_ambient',
    tone: 'hearth',
    priority: 41,
    keys: [
      'ui.banter.enemy_ambient.a',
      'ui.banter.enemy_ambient.b',
      'ui.banter.enemy_ambient.c',
    ],
    keysByTag: {
      // ── Cryptids family (Task 17). Uncanny-warm moor voice naming the
      //    wildwood half-legend: barghest (Yorkshire/Scots black-dog
      //    omen), kelpie foal (water-horse lure), blue man of the Minch
      //    (riddle-speaking sea spirit). Tone: curious, wary, not
      //    terrified — the moor's seen stranger.
      barghest: [
        'ui.banter.enemy_ambient.barghest.a',
        'ui.banter.enemy_ambient.barghest.b',
        'ui.banter.enemy_ambient.barghest.c',
      ],
      // Cu Sith — Highland fairy hound, sister-companion family to
      // barghest in the Cryptids cluster. Tone: warm-wary, "listen
      // for the bays" — the three-hool warning is the fiction's
      // identifying feature. Refs SCOTTISH_RESEARCH §1.2.
      cu_sith: [
        'ui.banter.enemy_ambient.cu_sith.a',
        'ui.banter.enemy_ambient.cu_sith.b',
        'ui.banter.enemy_ambient.cu_sith.c',
      ],
      kelpie_foal: [
        'ui.banter.enemy_ambient.kelpie_foal.a',
        'ui.banter.enemy_ambient.kelpie_foal.b',
        'ui.banter.enemy_ambient.kelpie_foal.c',
      ],
      blue_man_of_minch: [
        'ui.banter.enemy_ambient.blue_man_of_minch.a',
        'ui.banter.enemy_ambient.blue_man_of_minch.b',
        'ui.banter.enemy_ambient.blue_man_of_minch.c',
      ],
      // ── Faerie Courts family (Task 17). Fae warm-tricksy — respect the
      //    manners, never strike a bargain. Redcap is the thug of the
      //    trio: no courtier energy, pure teeth.
      seelie_piper: [
        'ui.banter.enemy_ambient.seelie_piper.a',
        'ui.banter.enemy_ambient.seelie_piper.b',
        'ui.banter.enemy_ambient.seelie_piper.c',
      ],
      unseelie_fiddler: [
        'ui.banter.enemy_ambient.unseelie_fiddler.a',
        'ui.banter.enemy_ambient.unseelie_fiddler.b',
        'ui.banter.enemy_ambient.unseelie_fiddler.c',
      ],
      redcap: [
        'ui.banter.enemy_ambient.redcap.a',
        'ui.banter.enemy_ambient.redcap.b',
        'ui.banter.enemy_ambient.redcap.c',
      ],
      // ── Weather family (Task 17). Elemental-thin — treat the wraith as
      //    weather given a face. Short, wispy, no metaphors piled on.
      haar_wraith: [
        'ui.banter.enemy_ambient.haar_wraith.a',
        'ui.banter.enemy_ambient.haar_wraith.b',
        'ui.banter.enemy_ambient.haar_wraith.c',
      ],
      gale_wraith: [
        'ui.banter.enemy_ambient.gale_wraith.a',
        'ui.banter.enemy_ambient.gale_wraith.b',
        'ui.banter.enemy_ambient.gale_wraith.c',
      ],
      // ── Urban Ghaists family (Task 17). Sharp-comic Glesga patter —
      //    the moor's voice gets a city edge when the streets bleed
      //    through. Edge-adjacent but kept hearth-toned overall.
      buckfast_ned: [
        'ui.banter.enemy_ambient.buckfast_ned.a',
        'ui.banter.enemy_ambient.buckfast_ned.b',
        'ui.banter.enemy_ambient.buckfast_ned.c',
      ],
      traffic_cone_totem: [
        'ui.banter.enemy_ambient.traffic_cone_totem.a',
        'ui.banter.enemy_ambient.traffic_cone_totem.b',
        'ui.banter.enemy_ambient.traffic_cone_totem.c',
      ],
      edinburgh_ghost_guide: [
        'ui.banter.enemy_ambient.edinburgh_ghost_guide.a',
        'ui.banter.enemy_ambient.edinburgh_ghost_guide.b',
        'ui.banter.enemy_ambient.edinburgh_ghost_guide.c',
      ],
      // ── Academic Apparitions family (Task 17). Stern-scholarly with a
      //    wee comic undercut — the moor's voice is warm but wryly aware
      //    the dead scholars are bossy. Auld-university patter (St
      //    Andrews / Edinburgh / Glasgow).
      ceilidh_caller: [
        'ui.banter.enemy_ambient.ceilidh_caller.a',
        'ui.banter.enemy_ambient.ceilidh_caller.b',
        'ui.banter.enemy_ambient.ceilidh_caller.c',
      ],
      tome_wraith: [
        'ui.banter.enemy_ambient.tome_wraith.a',
        'ui.banter.enemy_ambient.tome_wraith.b',
        'ui.banter.enemy_ambient.tome_wraith.c',
      ],
      dean_apparition: [
        'ui.banter.enemy_ambient.dean_apparition.a',
        'ui.banter.enemy_ambient.dean_apparition.b',
        'ui.banter.enemy_ambient.dean_apparition.c',
      ],
      // ── Taxman's Retinue family (Task 17). Bureaucratic-dread —
      //    council-tax-reminder register, dry fear. Every line telegraphs
      //    the approaching boss without begging the tension.
      ledger_wraith: [
        'ui.banter.enemy_ambient.ledger_wraith.a',
        'ui.banter.enemy_ambient.ledger_wraith.b',
        'ui.banter.enemy_ambient.ledger_wraith.c',
      ],
      auditor_priest: [
        'ui.banter.enemy_ambient.auditor_priest.a',
        'ui.banter.enemy_ambient.auditor_priest.b',
        'ui.banter.enemy_ambient.auditor_priest.c',
      ],
      // ── Moor-Classic (Task 17). Original enemies without a Phase-2
      //    family tag — each gets 2 lines anchored to its silhouette
      //    (tourist, chef, midge, highland_cow, eagle, haggis_hunter,
      //    angry_scotsman, deep_fryer, piper, berserker, ghost, nest,
      //    sheep, kelpie, midgie_swarm). Generic moor-voice hearth.
      tourist: [
        'ui.banter.enemy_ambient.tourist.a',
        'ui.banter.enemy_ambient.tourist.b',
      ],
      chef: [
        'ui.banter.enemy_ambient.chef.a',
        'ui.banter.enemy_ambient.chef.b',
      ],
      midge: [
        'ui.banter.enemy_ambient.midge.a',
        'ui.banter.enemy_ambient.midge.b',
      ],
      highland_cow: [
        'ui.banter.enemy_ambient.highland_cow.a',
        'ui.banter.enemy_ambient.highland_cow.b',
      ],
      eagle: [
        'ui.banter.enemy_ambient.eagle.a',
        'ui.banter.enemy_ambient.eagle.b',
      ],
      haggis_hunter: [
        'ui.banter.enemy_ambient.haggis_hunter.a',
        'ui.banter.enemy_ambient.haggis_hunter.b',
      ],
      angry_scotsman: [
        'ui.banter.enemy_ambient.angry_scotsman.a',
        'ui.banter.enemy_ambient.angry_scotsman.b',
      ],
      deep_fryer: [
        'ui.banter.enemy_ambient.deep_fryer.a',
        'ui.banter.enemy_ambient.deep_fryer.b',
      ],
      piper: [
        'ui.banter.enemy_ambient.piper.a',
        'ui.banter.enemy_ambient.piper.b',
      ],
      berserker: [
        'ui.banter.enemy_ambient.berserker.a',
        'ui.banter.enemy_ambient.berserker.b',
      ],
      ghost: [
        'ui.banter.enemy_ambient.ghost.a',
        'ui.banter.enemy_ambient.ghost.b',
      ],
      nest: [
        'ui.banter.enemy_ambient.nest.a',
        'ui.banter.enemy_ambient.nest.b',
      ],
      sheep: [
        'ui.banter.enemy_ambient.sheep.a',
        'ui.banter.enemy_ambient.sheep.b',
      ],
      kelpie: [
        'ui.banter.enemy_ambient.kelpie.a',
        'ui.banter.enemy_ambient.kelpie.b',
      ],
      midgie_swarm: [
        'ui.banter.enemy_ambient.midgie_swarm.a',
        'ui.banter.enemy_ambient.midgie_swarm.b',
      ],
    },
  },
  {
    // Reliquary pickup (M15). Small hearth beat — the moor just handed
    // you a curio, acknowledging the off-path detour. Generic-only pool;
    // per-curio voice tint stays open for a future banter pass.
    context: 'reliquary_pick',
    tone: 'hearth',
    priority: 45,
    rare: true,
    keys: [
      'ui.banter.reliquary_pick.a',
      'ui.banter.reliquary_pick.b',
      'ui.banter.reliquary_pick.c',
      'ui.banter.reliquary_pick.d',
    ],
  },
  // ── B1 Phase 4 Task 21 — Cailleach whispers.
  //
  // Voice register: EDGE / GRAVE per Voice Card §Cailleach. Cailleach
  // Bheur — the Winter Queen, elder hag, shaper of mountains and keeper
  // of wild beasts. Stern, motherly, Gaelic-inflected. *Not* villainous;
  // an elder who expects better. Sparing words; every one carries weight.
  //
  // Priority 55 — sits below act_intermission_enter (52) (so the route-
  // pick beats it on the very-tick of the intermission opening) but above
  // first_blood (50). Wires planned: act intermissions (post-pick tick),
  // low-HP follow-on, Bargain events. Wiring lands in a follow-up commit
  // alongside content per "hook with content" pattern.
  //
  // [GAELIC-REVIEW] Some leaves carry untranslated Gaelic fragments
  // (a chiall / mo nighean / is fada an oidhche / tog ort / cha mhór /
  // a ghaoil / gabh air do shocair / sgrìobhte sa chloich). Every such
  // line is flagged inline in i18n.ts and listed in
  // docs/top-10-tasks/blocked/06-blocked-on-human.md. The pool is gated
  // by `rare: true` so the lines surface as collectible / accent
  // moments rather than ambient chatter — consistent with first_time,
  // burns_citation, and reliquary_pick precedent.
  {
    context: 'cailleach_whisper',
    tone: 'edge',
    priority: 55,
    rare: true,
    keys: [
      'ui.banter.cailleach_whisper.a',
      'ui.banter.cailleach_whisper.b',
      'ui.banter.cailleach_whisper.c',
      'ui.banter.cailleach_whisper.d',
      'ui.banter.cailleach_whisper.e',
      'ui.banter.cailleach_whisper.f',
      'ui.banter.cailleach_whisper.g',
      'ui.banter.cailleach_whisper.h',
      'ui.banter.cailleach_whisper.i',
      'ui.banter.cailleach_whisper.j',
      'ui.banter.cailleach_whisper.k',
      'ui.banter.cailleach_whisper.l',
      'ui.banter.cailleach_whisper.m',
      'ui.banter.cailleach_whisper.n',
      'ui.banter.cailleach_whisper.o',
      'ui.banter.cailleach_whisper.p',
      'ui.banter.cailleach_whisper.q',
      'ui.banter.cailleach_whisper.r',
      'ui.banter.cailleach_whisper.s',
      'ui.banter.cailleach_whisper.t',
    ],
  },
  // ── B1 Phase 5 — Seasonal event banter (standalone graduation).
  //
  // Voice register: HEARTH (warm seasonal moments) per Voice Card; the
  // Samhain sub-pool tilts Cailleach-edged. Tags align with
  // `getActiveSeasonalEventKey` returns. Each tag gets ≥ 12 lines so the
  // window's typical 7–14-day window can land lines without stutter.
  //
  // Priority 65 per spec §2 / PENDING_POOL_METADATA. Sits between
  // boss_down (70) and weapon_evolve (no, weapon_evolve is also 65 in
  // BANTER_POOLS — RECONCILIATION: spec §2 placed seasonal_event at 65,
  // but `weapon_evolve` already lives at 65. Resolved here at 64 so the
  // ladder stays unique and seasonal sits just below weapon evolution
  // (a pickup tick should still own its moment). Pattern matches
  // gran_commentary 30→28, enemy_ambient 40→41, burns_citation 45→43.
  {
    context: 'seasonal_event',
    tone: 'hearth',
    priority: 64,
    rare: true,
    keys: [
      'ui.banter.seasonal_event.a',
      'ui.banter.seasonal_event.b',
    ],
    keysByTag: {
      // Tag aligns with `getActiveSeasonalEventKey('burns_night')`. 20
      // lines — Burns canon citations + supper-ritual atmosphere. Public
      // domain Burns quotations cite Kinsley 1968 inline in i18n.ts.
      burns_night: [
        'ui.banter.seasonal_event.burns_night.a',
        'ui.banter.seasonal_event.burns_night.b',
        'ui.banter.seasonal_event.burns_night.c',
        'ui.banter.seasonal_event.burns_night.d',
        'ui.banter.seasonal_event.burns_night.e',
        'ui.banter.seasonal_event.burns_night.f',
        'ui.banter.seasonal_event.burns_night.g',
        'ui.banter.seasonal_event.burns_night.h',
        'ui.banter.seasonal_event.burns_night.i',
        'ui.banter.seasonal_event.burns_night.j',
        'ui.banter.seasonal_event.burns_night.k',
        'ui.banter.seasonal_event.burns_night.l',
        'ui.banter.seasonal_event.burns_night.m',
        'ui.banter.seasonal_event.burns_night.n',
        'ui.banter.seasonal_event.burns_night.o',
        'ui.banter.seasonal_event.burns_night.p',
        'ui.banter.seasonal_event.burns_night.q',
        'ui.banter.seasonal_event.burns_night.r',
        'ui.banter.seasonal_event.burns_night.s',
        'ui.banter.seasonal_event.burns_night.t',
      ],
      hogmanay: [
        'ui.banter.seasonal_event.hogmanay.a',
        'ui.banter.seasonal_event.hogmanay.b',
        'ui.banter.seasonal_event.hogmanay.c',
        'ui.banter.seasonal_event.hogmanay.d',
        'ui.banter.seasonal_event.hogmanay.e',
        'ui.banter.seasonal_event.hogmanay.f',
        'ui.banter.seasonal_event.hogmanay.g',
        'ui.banter.seasonal_event.hogmanay.h',
        'ui.banter.seasonal_event.hogmanay.i',
        'ui.banter.seasonal_event.hogmanay.j',
        'ui.banter.seasonal_event.hogmanay.k',
        'ui.banter.seasonal_event.hogmanay.l',
        'ui.banter.seasonal_event.hogmanay.m',
        'ui.banter.seasonal_event.hogmanay.n',
        'ui.banter.seasonal_event.hogmanay.o',
        'ui.banter.seasonal_event.hogmanay.p',
      ],
      samhain: [
        'ui.banter.seasonal_event.samhain.a',
        'ui.banter.seasonal_event.samhain.b',
        'ui.banter.seasonal_event.samhain.c',
        'ui.banter.seasonal_event.samhain.d',
        'ui.banter.seasonal_event.samhain.e',
        'ui.banter.seasonal_event.samhain.f',
        'ui.banter.seasonal_event.samhain.g',
        'ui.banter.seasonal_event.samhain.h',
        'ui.banter.seasonal_event.samhain.i',
        'ui.banter.seasonal_event.samhain.j',
        'ui.banter.seasonal_event.samhain.k',
        'ui.banter.seasonal_event.samhain.l',
      ],
      beltane: [
        'ui.banter.seasonal_event.beltane.a',
        'ui.banter.seasonal_event.beltane.b',
        'ui.banter.seasonal_event.beltane.c',
        'ui.banter.seasonal_event.beltane.d',
        'ui.banter.seasonal_event.beltane.e',
        'ui.banter.seasonal_event.beltane.f',
        'ui.banter.seasonal_event.beltane.g',
        'ui.banter.seasonal_event.beltane.h',
        'ui.banter.seasonal_event.beltane.i',
        'ui.banter.seasonal_event.beltane.j',
        'ui.banter.seasonal_event.beltane.k',
        'ui.banter.seasonal_event.beltane.l',
      ],
      // 2026-04-29 — three remaining seasonal cohort entries get their
      // dedicated banter sub-pools. 12 leaves each, bilingual, voice-
      // matched: St Andrew's Day = saltire / national-day; Imbolc =
      // Brìde / first stir of spring; Lammas = Lùnastal / harvest +
      // loaf-mass + Lugh's funeral games for Tailtiu.
      st_andrews: [
        'ui.banter.seasonal_event.st_andrews.a',
        'ui.banter.seasonal_event.st_andrews.b',
        'ui.banter.seasonal_event.st_andrews.c',
        'ui.banter.seasonal_event.st_andrews.d',
        'ui.banter.seasonal_event.st_andrews.e',
        'ui.banter.seasonal_event.st_andrews.f',
        'ui.banter.seasonal_event.st_andrews.g',
        'ui.banter.seasonal_event.st_andrews.h',
        'ui.banter.seasonal_event.st_andrews.i',
        'ui.banter.seasonal_event.st_andrews.j',
        'ui.banter.seasonal_event.st_andrews.k',
        'ui.banter.seasonal_event.st_andrews.l',
      ],
      imbolc: [
        'ui.banter.seasonal_event.imbolc.a',
        'ui.banter.seasonal_event.imbolc.b',
        'ui.banter.seasonal_event.imbolc.c',
        'ui.banter.seasonal_event.imbolc.d',
        'ui.banter.seasonal_event.imbolc.e',
        'ui.banter.seasonal_event.imbolc.f',
        'ui.banter.seasonal_event.imbolc.g',
        'ui.banter.seasonal_event.imbolc.h',
        'ui.banter.seasonal_event.imbolc.i',
        'ui.banter.seasonal_event.imbolc.j',
        'ui.banter.seasonal_event.imbolc.k',
        'ui.banter.seasonal_event.imbolc.l',
      ],
      lammas: [
        'ui.banter.seasonal_event.lammas.a',
        'ui.banter.seasonal_event.lammas.b',
        'ui.banter.seasonal_event.lammas.c',
        'ui.banter.seasonal_event.lammas.d',
        'ui.banter.seasonal_event.lammas.e',
        'ui.banter.seasonal_event.lammas.f',
        'ui.banter.seasonal_event.lammas.g',
        'ui.banter.seasonal_event.lammas.h',
        'ui.banter.seasonal_event.lammas.i',
        'ui.banter.seasonal_event.lammas.j',
        'ui.banter.seasonal_event.lammas.k',
        'ui.banter.seasonal_event.lammas.l',
      ],
      // 2026-04-29 — Bracken-turn closes the cohort banter coverage to
      // 8/8. 12 leaves voice the autumn-cusp moor: copper fronds, first
      // frost, rooks gathering, fires lit early at the steading.
      bracken_turn: [
        'ui.banter.seasonal_event.bracken_turn.a',
        'ui.banter.seasonal_event.bracken_turn.b',
        'ui.banter.seasonal_event.bracken_turn.c',
        'ui.banter.seasonal_event.bracken_turn.d',
        'ui.banter.seasonal_event.bracken_turn.e',
        'ui.banter.seasonal_event.bracken_turn.f',
        'ui.banter.seasonal_event.bracken_turn.g',
        'ui.banter.seasonal_event.bracken_turn.h',
        'ui.banter.seasonal_event.bracken_turn.i',
        'ui.banter.seasonal_event.bracken_turn.j',
        'ui.banter.seasonal_event.bracken_turn.k',
        'ui.banter.seasonal_event.bracken_turn.l',
      ],
    },
  },
];

export function getBanterPool(context: BanterContext): BanterPool | undefined {
  return BANTER_POOLS.find((p) => p.context === context);
}

/**
 * B1 Phase 1 — pools scheduled for authoring in later phases.
 *
 * These IDs are *not* members of `BanterContext` yet: each pool graduates
 * into `BanterContext` + `BANTER_POOLS` only when its lines are authored
 * (Phase 2 onward). Keeping them here preserves two existing invariants
 * from `banter.test.ts`:
 *   - every pool in `BANTER_POOLS` has ≥ 2 keys
 *   - no two pools in `BANTER_POOLS` share a priority
 *
 * Tests read `POOL_PRIORITIES` (derived below) to verify the priority
 * ladder called for in `docs/superpowers/specs/2026-04-23-banter-density-push-design.md §2`.
 */
// B1 Phase 4 + 5 graduation (2026-04-26): both `cailleach_whisper` and
// `seasonal_event` graduated into BANTER_POOLS. The PendingBanterContext
// union is now empty; preserved as `never` so the type infrastructure
// stays in place for any future deferred pool (the design pattern was
// the most useful invariant — let it persist with zero pending pools
// rather than ripping it out and rebuilding next time we defer one).
export type PendingBanterContext = never;

export interface PendingPoolMetadata {
  tone: BanterTone;
  priority: number;
}

/**
 * Tone + priority per spec §2 / §3. Priority ladder (high → low) after
 * B1 Phase 4 + 5 graduation:
 *   first_time (110) > boss_warn (100) > low_hp (80) > death_reflection (75) >
 *   boss_down (70) > weapon_evolve (65) > seasonal_event (64) >
 *   level_up (60) > curse_start (59) > act_complete (57) >
 *   cailleach_whisper (55) > act_intermission_enter (52) >
 *   first_blood (50) > route_picked (48) > reliquary_pick (45) >
 *   burns_citation (43) > enemy_ambient (41) > kill_streak (40) >
 *   recover (35) > moor_moment (31) > biome_change (30) >
 *   gran_commentary (28) > haggis_ambient (25) > idle (10)
 *
 * Reconciliation history (graduating pools shift down 1–2 slots when
 * the spec §2 number collided with a live pool — uniqueness is the
 * binding invariant):
 *   - `gran_commentary` shipped at 28 (spec 30 collided with biome_change).
 *   - `enemy_ambient` shipped at 41 (spec 40 collided with kill_streak).
 *   - `burns_citation` shipped at 43 (spec 45 collided with reliquary_pick).
 *   - `seasonal_event` shipped at 64 (spec 65 collided with weapon_evolve).
 *   - `cailleach_whisper` shipped at 55 (spec 55 — clean).
 *
 * PendingBanterContext is now `never`. Any future deferred pool registers
 * here with its tone + priority; on graduation it moves into
 * `BANTER_POOLS` and out of `PENDING_POOL_METADATA`.
 */
export const PENDING_POOL_METADATA: Readonly<Record<PendingBanterContext, PendingPoolMetadata>> = {
};

/**
 * Flat priority lookup spanning live (`BANTER_POOLS`) + pending
 * (`PENDING_POOL_METADATA`) pools. Single source of truth for the
 * ladder documented in B1 spec §2. Read-only at runtime; tests assert
 * spec numbers against this map so the ladder can't drift silently.
 */
export const POOL_PRIORITIES: Readonly<Record<string, number>> = (() => {
  const out: Record<string, number> = {};
  for (const p of BANTER_POOLS) out[p.context] = p.priority;
  // After B1 Phase 4+5 graduation `PENDING_POOL_METADATA` is empty
  // (`Record<never, …>`) — the loop is a no-op today but kept for
  // forward-compat when a future deferred pool re-registers. Cast
  // through unknown so the empty-record pattern doesn't widen `meta`
  // to TS's anomalous `unknown` for `Object.entries(Record<never, X>)`.
  const pending = PENDING_POOL_METADATA as Readonly<Record<string, PendingPoolMetadata>>;
  for (const [id, meta] of Object.entries(pending)) out[id] = meta.priority;
  return out;
})();

/** All i18n keys, flat — generic + every tagged sub-pool. Tests lean on
 *  this to prove every declared key resolves to a real i18n string. */
export const BANTER_KEYS: readonly string[] = BANTER_POOLS.flatMap((p) => {
  const tagged = p.keysByTag ? Object.values(p.keysByTag).flat() : [];
  return [...p.keys, ...tagged];
});
