import { describe, expect, it } from 'vitest';
import { BANTER_POOLS, BANTER_KEYS, getBanterPool, type BanterContext } from './banter';
import { BOSSES } from './enemies';
import { CURSES } from './curses';
import { WEAPON_DEFS, type WeaponKey } from './weapons';
import { BIOMES, type BiomeId } from './biomes';
import { VARIANTS } from './variants';
import { t } from '../core/i18n';

describe('BANTER_POOLS structure', () => {
  const allContexts: BanterContext[] = [
    'first_blood', 'kill_streak', 'level_up', 'low_hp',
    'recover', 'boss_warn', 'boss_down', 'biome_change',
    'weapon_evolve', 'curse_start', 'moor_moment', 'idle',
    // W2 Moor Road
    'act_intermission_enter', 'act_complete', 'route_picked',
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

  it('weapon_evolve has keysByTag for every weapon', () => {
    const weaponKeys = Object.keys(WEAPON_DEFS) as WeaponKey[];
    const pool = getBanterPool('weapon_evolve');
    expect(pool, 'weapon_evolve pool missing').toBeDefined();
    const tags = Object.keys(pool!.keysByTag ?? {});
    for (const wk of weaponKeys) {
      expect(tags, `weapon_evolve missing tag '${wk}'`).toContain(wk);
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
