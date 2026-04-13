import { describe, expect, it } from 'vitest';
import { BANTER_POOLS, BANTER_KEYS, getBanterPool, type BanterContext } from './banter';
import { BOSSES } from './enemies';
import { t } from '../core/i18n';

describe('BANTER_POOLS structure', () => {
  const allContexts: BanterContext[] = [
    'first_blood', 'kill_streak', 'level_up', 'low_hp',
    'recover', 'boss_warn', 'boss_down', 'biome_change', 'idle',
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
