import { describe, expect, it } from 'vitest';
import {
  BANTER_POOLS,
  BANTER_KEYS,
  PENDING_POOL_METADATA,
  POOL_PRIORITIES,
  getBanterPool,
  type BanterContext,
  type PendingBanterContext,
} from './banter';
import { BOSSES } from './enemies';
import { CURSES } from './curses';
import { WEAPON_DEFS, type WeaponKey } from './weapons';
import { EVOLUTION_RECIPES } from '../core/BalanceConfig';
import { BIOMES, type BiomeId } from './biomes';
import { VARIANTS } from './variants';
import { ROUTES } from './routes';
import type { DeathCauseTag } from '../core/deathCauseClassifier';
import { t } from '../core/i18n';

describe('BANTER_POOLS structure', () => {
  const allContexts: BanterContext[] = [
    'first_blood', 'kill_streak', 'level_up', 'low_hp',
    'recover', 'boss_warn', 'boss_down', 'biome_change',
    'weapon_evolve', 'curse_start', 'moor_moment', 'idle',
    // W2 Moor Road
    'act_intermission_enter', 'act_complete', 'route_picked',
    // Reliquary pickup
    'reliquary_pick',
    // B1 Phase 2 — Gran-voice commentary
    'gran_commentary',
    // B1 Phase 2 Task 12 — cause-tagged death reflection
    'death_reflection',
    // B1 Phase 2 Task 10 — wee-beastie inner monologue
    'haggis_ambient',
    // B1 Phase 3 Task 17 — enemy flavour pool
    'enemy_ambient',
    // B1 Phase 3 Task 18 — reserved first-time events
    'first_time',
    // B1 Phase 4 Task 22 — Burns citations
    'burns_citation',
    // B1 Phase 4 Task 21 — Cailleach whispers
    'cailleach_whisper',
    // B1 Phase 5 — Seasonal event banter
    'seasonal_event',
    // DESIGN_IDEAS §1 — Cairn Stacking pickup + boon
    'cairn_moment',
    // DESIGN_IDEAS §1 — Stance Toggle cycle (Q-edge, three sub-pools)
    'stance_change',
    // DESIGN_IDEAS §1 — Shinty Parry consume edge (E-window success)
    'shinty_parry',
    // DESIGN_IDEAS §1 — Clootie Rag Wager commit edge (walk-through trunk)
    'clootie_wager',
    // "The Moor Remembers" — Cairn of Echoes walkover (past-self + grandfather sub-pools)
    'cairn_walkover',
    // V2 — Cailleach Gauntlet (armed / candles_lit / cailleach_spawned / cailleach_down / cailleach_dominant)
    'cailleach_gauntlet',
    // DESIGN_IDEAS §1 — Taxman Grudge Ledger run-end verdict line
    'taxman_grudge',
    // Father Taxman Phase 2 — mid-fight verdict-adapt at 50% HP threshold
    'taxman_grudge_phase2',
    // DESIGN_IDEAS §3 — Taxman's Retinue post-bell wave arrival
    'taxman_retinue_wave',
    // DESIGN_IDEAS §3 — Corryvreckan whirlpool encounter (warn + survived)
    'corryvreckan_warn',
    'corryvreckan_survived',
    // DESIGN_IDEAS §13 — Lemmings Easter Egg cliff-edge parade trigger
    'lemmings_remember',
    // DESIGN_IDEAS §1 — Race the Beithir venom-sting race window
    'beithir_sting',
    // DESIGN_IDEAS §11 — Haggis Wildlife Foundation field-note pickup
    'field_note_pickup',
    // Wild Living World Phase 2 — Selkie Dual-Form transformation cue
    'form_shifted',
  ];

  it('covers every BanterContext exactly once', () => {
    const poolContexts = BANTER_POOLS.map(p => p.context);
    expect(poolContexts.sort()).toEqual([...allContexts].sort());
    expect(new Set(poolContexts).size).toBe(poolContexts.length);
  });

  it('every pool has at least 2 keys (enough for no-repeat rotation)', () => {
    for (const pool of BANTER_POOLS) {
      expect(pool.keys.length, `${pool.context} has too few keys`).toBeGreaterThanOrEqual(2);
    }
  });

  it('priorities are unique (no ties in same-tick arbitration)', () => {
    const priorities = BANTER_POOLS.map(p => p.priority);
    expect(new Set(priorities).size).toBe(priorities.length);
  });

  it('curse_start has keysByTag for every curse', () => {
    const curseKeys = CURSES.map((c) => c.key);
    const pool = getBanterPool('curse_start');
    expect(pool, 'curse_start pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const ck of curseKeys) {
      expect(tags, `curse_start missing tag '${ck}'`).toContain(ck);
    }
  });

  it('weapon_evolve has keysByTag for every evolvable weapon (T212 — utility-only weapons excluded)', () => {
    // Source of truth: EVOLUTION_RECIPES. Bagpipes is utility-only (no
    // recipe) and intentionally has no banter tag — pre-T212 there was a
    // dead `bagpipes` pool that promised an evolution that never lands.
    const evolvableKeys = EVOLUTION_RECIPES.map((r) => r.baseWeapon as WeaponKey);
    const pool = getBanterPool('weapon_evolve');
    expect(pool, 'weapon_evolve pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const wk of evolvableKeys) {
      expect(tags, `weapon_evolve missing tag '${wk}'`).toContain(wk);
    }
    // Negative assertion: utility-only weapons (currently bagpipes) MUST
    // NOT have a banter tag, otherwise the pool can queue a line that
    // promises an evolution the player will never see.
    const utilityOnlyKeys = (Object.keys(WEAPON_DEFS) as WeaponKey[]).filter(
      (k) => !evolvableKeys.includes(k),
    );
    for (const uk of utilityOnlyKeys) {
      expect(tags, `weapon_evolve has stale utility-only tag '${uk}'`).not.toContain(uk);
    }
  });

  it('level_up has keysByTag for every non-classic variant', () => {
    const nonClassic = VARIANTS.filter((v) => v.key !== 'classic');
    const pool = getBanterPool('level_up');
    expect(pool, 'level_up pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const v of nonClassic) {
      expect(tags, `level_up missing tag '${v.key}'`).toContain(v.key);
    }
  });

  it('first_blood has keysByTag for every non-classic variant', () => {
    const nonClassic = VARIANTS.filter((v) => v.key !== 'classic');
    const pool = getBanterPool('first_blood');
    expect(pool, 'first_blood pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const v of nonClassic) {
      expect(tags, `first_blood missing tag '${v.key}'`).toContain(v.key);
    }
  });

  it('kill_streak has keysByTag for every non-classic variant', () => {
    const nonClassic = VARIANTS.filter((v) => v.key !== 'classic');
    const pool = getBanterPool('kill_streak');
    expect(pool, 'kill_streak pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const v of nonClassic) {
      expect(tags, `kill_streak missing tag '${v.key}'`).toContain(v.key);
    }
  });

  it('low_hp has keysByTag for every non-classic variant', () => {
    const nonClassic = VARIANTS.filter((v) => v.key !== 'classic');
    const pool = getBanterPool('low_hp');
    expect(pool, 'low_hp pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const v of nonClassic) {
      expect(tags, `low_hp missing tag '${v.key}'`).toContain(v.key);
    }
  });

  it('recover has keysByTag for every non-classic variant', () => {
    const nonClassic = VARIANTS.filter((v) => v.key !== 'classic');
    const pool = getBanterPool('recover');
    expect(pool, 'recover pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const v of nonClassic) {
      expect(tags, `recover missing tag '${v.key}'`).toContain(v.key);
    }
  });

  it('idle has keysByTag for every non-classic variant', () => {
    const nonClassic = VARIANTS.filter((v) => v.key !== 'classic');
    const pool = getBanterPool('idle');
    expect(pool, 'idle pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const v of nonClassic) {
      expect(tags, `idle missing tag '${v.key}'`).toContain(v.key);
    }
  });

  it('biome_change has keysByTag for every biome', () => {
    const biomeIds = Object.keys(BIOMES) as BiomeId[];
    const pool = getBanterPool('biome_change');
    expect(pool, 'biome_change pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const id of biomeIds) {
      expect(tags, `biome_change missing tag '${id}'`).toContain(id);
    }
  });

  it('core shipped biomes have an expanded ambient biome_change line pack', () => {
    const coreBiomeIds: readonly BiomeId[] = [
      'bog', 'loch', 'pine', 'heather', 'coastal', 'haar', 'frost',
    ];
    const pool = getBanterPool('biome_change');
    expect(pool, 'biome_change pool missing').toBeDefined();
    for (const id of coreBiomeIds) {
      const keys = pool!.keysByTag?.[id] ?? [];
      expect(keys.length, `biome_change/${id} needs at least five ambient lines`).toBeGreaterThanOrEqual(5);
      for (const key of keys) {
        expect(t(key), `EN missing ${key}`).not.toBe(key);
      }
    }
  });

  it('route_picked has keysByTag for every W2 route', () => {
    const routeKeys = ROUTES.map((r) => r.key);
    const pool = getBanterPool('route_picked');
    expect(pool, 'route_picked pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const rk of routeKeys) {
      expect(tags, `route_picked missing tag '${rk}'`).toContain(rk);
    }
  });

  it('death_reflection has keysByTag for every DeathCauseTag', () => {
    const allTags: readonly DeathCauseTag[] = [
      'hazard', 'boss_crushed', 'elite_kill', 'one_shot',
      'same_killer', 'swarmed', 'low_hp_neglect', 'unlucky',
    ];
    const pool = getBanterPool('death_reflection');
    expect(pool, 'death_reflection pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const dct of allTags) {
      expect(tags, `death_reflection missing tag '${dct}'`).toContain(dct);
    }
  });

  it('boss_warn and boss_down have keysByTag for every boss', () => {
    const bossKeys = BOSSES.map(b => b.key);

    for (const ctx of ['boss_warn', 'boss_down'] as const) {
      const pool = getBanterPool(ctx);
      expect(pool, `${ctx} pool missing`).toBeDefined();
      const tags = Object.keys(pool!.keysByTag ?? {});
      for (const bk of bossKeys) {
        expect(tags, `${ctx} missing tag for boss '${bk}'`).toContain(bk);
      }
    }
  });

  it('every keysByTag sub-pool has at least 2 entries', () => {
    for (const pool of BANTER_POOLS) {
      if (!pool.keysByTag) continue;
      for (const [tag, keys] of Object.entries(pool.keysByTag)) {
        expect(keys.length, `${pool.context}/${tag} has too few keys`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  // Boss-roster fence (2026-04-28). Promotes the spec-doc Risk-flag
  // pattern into a real assertion: any boss added to BOSSES must also
  // ship i18n leaves (display name + at least 2 boss_warn + 2 boss_down
  // banter lines). Each-Uisge shipped without these wired and silently
  // failed CI; this fence makes the omission impossible to miss.
  it('every boss has authored EN i18n content (name + boss_warn + boss_down)', () => {
    for (const boss of BOSSES) {
      const nameKey = `boss.${boss.key}.name`;
      expect(t(nameKey), `EN missing ${nameKey}`).not.toBe(nameKey);

      for (const ctx of ['boss_warn', 'boss_down'] as const) {
        // Pool tag entries reference letter-suffixed leaves (a, b, c...).
        // Require ≥2 to match the keysByTag pool rule.
        for (const suffix of ['a', 'b'] as const) {
          const key = `ui.banter.${ctx}.${boss.key}.${suffix}`;
          expect(t(key), `EN missing ${key}`).not.toBe(key);
        }
      }
    }
  });
});

describe('B1 Phase 1 — pending pool metadata', () => {
  // B1 Phase 4 + 5 graduation (2026-04-26): all pools that were pending
  // are now live in BANTER_POOLS. PENDING_POOL_METADATA is now empty;
  // tests below confirm the empty state + the live priorities of the
  // graduated pools.
  const expectedPending: ReadonlyArray<[PendingBanterContext, number]> = [];

  it('PENDING_POOL_METADATA is empty after B1 Phase 4+5 graduation', () => {
    expect(Object.keys(PENDING_POOL_METADATA)).toHaveLength(0);
  });

  it('pending IDs do not collide with live BanterContext entries', () => {
    const liveContexts = new Set<string>(BANTER_POOLS.map((p) => p.context));
    for (const id of Object.keys(PENDING_POOL_METADATA)) {
      expect(liveContexts.has(id), `${id} already lives in BANTER_POOLS`).toBe(false);
    }
  });

  it('POOL_PRIORITIES reflects live pool priorities', () => {
    for (const pool of BANTER_POOLS) {
      expect(POOL_PRIORITIES[pool.context]).toBe(pool.priority);
    }
  });

  it('POOL_PRIORITIES has no pending entries left', () => {
    for (const [id, priority] of expectedPending) {
      expect(POOL_PRIORITIES[id]).toBe(priority);
    }
  });

  it('first_time beats boss_warn (spec §2 — first-encounter always wins)', () => {
    expect(POOL_PRIORITIES.first_time).toBeGreaterThan(POOL_PRIORITIES.boss_warn);
  });

  it('enemy_ambient sits just above kill_streak, below reliquary_pick', () => {
    expect(POOL_PRIORITIES.enemy_ambient).toBe(41);
    expect(POOL_PRIORITIES.enemy_ambient).toBeGreaterThan(POOL_PRIORITIES.kill_streak);
    expect(POOL_PRIORITIES.enemy_ambient).toBeLessThan(POOL_PRIORITIES.reliquary_pick);
  });

  it('burns_citation sits between enemy_ambient and reliquary_pick', () => {
    expect(POOL_PRIORITIES.burns_citation).toBe(43);
    expect(POOL_PRIORITIES.burns_citation).toBeGreaterThan(POOL_PRIORITIES.enemy_ambient);
    expect(POOL_PRIORITIES.burns_citation).toBeLessThan(POOL_PRIORITIES.reliquary_pick);
  });

  // B1 Phase 4+5 graduation: spec §2 reconciled to live ladder slots.
  it('cailleach_whisper graduated at edge tone, priority 55', () => {
    const pool = BANTER_POOLS.find((p) => p.context === 'cailleach_whisper');
    expect(pool, 'cailleach_whisper should be live').toBeDefined();
    expect(pool!.tone).toBe('edge');
    expect(pool!.priority).toBe(55);
  });

  it('seasonal_event graduated at hearth tone, priority 64 (reconciled from spec 65 — collided with weapon_evolve)', () => {
    const pool = BANTER_POOLS.find((p) => p.context === 'seasonal_event');
    expect(pool, 'seasonal_event should be live').toBeDefined();
    expect(pool!.tone).toBe('hearth');
    expect(pool!.priority).toBe(64);
    expect(POOL_PRIORITIES.seasonal_event).toBeLessThan(POOL_PRIORITIES.weapon_evolve);
    expect(POOL_PRIORITIES.seasonal_event).toBeGreaterThan(POOL_PRIORITIES.level_up);
  });

  it('seasonal_event has sub-pools for every getActiveSeasonalEventKey return value', () => {
    const pool = BANTER_POOLS.find((p) => p.context === 'seasonal_event');
    expect(pool, 'seasonal_event pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    // st_andrews has no banter sub-pool yet (lightweight data-only event;
    // the ceremony resolver routes it through gran_commentary.seasonal_event).
    // burns_night / hogmanay / samhain / beltane are required.
    for (const evt of ['burns_night', 'hogmanay', 'samhain', 'beltane']) {
      expect(tags, `seasonal_event missing tag '${evt}'`).toContain(evt);
    }
  });
});

describe('BANTER_KEYS i18n resolution', () => {
  it('every banter key resolves to a real i18n string (not the key itself)', () => {
    for (const key of BANTER_KEYS) {
      const resolved = t(key);
      expect(resolved, `${key} not found in i18n`).not.toBe(key);
      expect(resolved.length, `${key} resolves to empty`).toBeGreaterThan(0);
    }
  });
});
