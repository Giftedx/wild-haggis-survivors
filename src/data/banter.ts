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
  | 'idle';

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
    ],
  },
  {
    context: 'boss_down',
    tone: 'hearth',
    priority: 70,
    keys: [
      'ui.banter.boss_down.a',
      'ui.banter.boss_down.b',
      'ui.banter.boss_down.c',
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
    ],
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
    ],
    // Variant voice tilt — only authored for variants with strong
    // on-brand character. Others fall back to the generic pool, which is
    // intentional: not every variant needs a distinct voice to feel right.
    keysByTag: {
      iron_belly: [
        'ui.banter.level_up.iron_belly.a',
        'ui.banter.level_up.iron_belly.b',
        'ui.banter.level_up.iron_belly.c',
      ],
      moor_runner: [
        'ui.banter.level_up.moor_runner.a',
        'ui.banter.level_up.moor_runner.b',
        'ui.banter.level_up.moor_runner.c',
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
    ],
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
    ],
  },
  {
    context: 'recover',
    tone: 'hearth',
    priority: 35,
    keys: [
      'ui.banter.recover.a',
      'ui.banter.recover.b',
      'ui.banter.recover.c',
    ],
  },
  {
    context: 'biome_change',
    tone: 'hearth',
    priority: 30,
    keys: [
      'ui.banter.biome_change.a',
      'ui.banter.biome_change.b',
      'ui.banter.biome_change.c',
    ],
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
    ],
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
