import { describe, expect, it } from 'vitest';
import { BOSSES, ENEMY_TYPES } from '../../data/enemies';
import {
  EAGER_ENEMY_MAX_APPEARS_AT_SEC,
  isEagerEnemyKey,
  selectEagerEnemyKeys,
} from './enemyAtlasEager';

describe('isEagerEnemyKey', () => {
  it('selects an enemy appearing at or before the threshold', () => {
    const early = Object.values(ENEMY_TYPES).find(
      (c) => c.appearsAt <= EAGER_ENEMY_MAX_APPEARS_AT_SEC,
    );
    expect(early, 'fixture: at least one early enemy must exist').toBeDefined();
    expect(isEagerEnemyKey(early!.key)).toBe(true);
  });

  it('defers an enemy appearing after the threshold', () => {
    const late = Object.values(ENEMY_TYPES).find(
      (c) => c.appearsAt > EAGER_ENEMY_MAX_APPEARS_AT_SEC,
    );
    expect(late, 'fixture: at least one late enemy must exist').toBeDefined();
    expect(isEagerEnemyKey(late!.key)).toBe(false);
  });

  it('never marks a boss (absent from ENEMY_TYPES) as eager', () => {
    for (const boss of BOSSES) {
      expect(isEagerEnemyKey(boss.key), `${boss.key} must not be eager`).toBe(false);
    }
  });

  it('returns false for an unknown key', () => {
    expect(isEagerEnemyKey('___not_an_enemy___')).toBe(false);
  });

  it('respects an explicit threshold (boundary is inclusive)', () => {
    const tourist = ENEMY_TYPES.tourist;
    expect(tourist.appearsAt).toBe(0);
    expect(isEagerEnemyKey('tourist', 0)).toBe(true);
    // chef appears at 90 — eager at 90, deferred at 89
    expect(isEagerEnemyKey('chef', 90)).toBe(true);
    expect(isEagerEnemyKey('chef', 89)).toBe(false);
  });
});

describe('selectEagerEnemyKeys', () => {
  it('keeps only in-roster keys within the threshold; drops bosses + unknowns', () => {
    const mixed = [
      ...Object.keys(ENEMY_TYPES),
      ...BOSSES.map((b) => b.key),
      '___unknown___',
    ];
    const eager = selectEagerEnemyKeys(mixed);
    expect(eager.length).toBeGreaterThan(0);
    expect(eager).not.toContain('___unknown___');
    for (const boss of BOSSES) expect(eager).not.toContain(boss.key);
    for (const k of eager) {
      expect(ENEMY_TYPES[k]).toBeDefined();
      expect(ENEMY_TYPES[k].appearsAt).toBeLessThanOrEqual(EAGER_ENEMY_MAX_APPEARS_AT_SEC);
    }
  });

  it('a higher threshold yields a superset of a lower threshold', () => {
    const keys = Object.keys(ENEMY_TYPES);
    const lo = selectEagerEnemyKeys(keys, 120);
    const hi = selectEagerEnemyKeys(keys, 600);
    expect(lo.every((k) => hi.includes(k))).toBe(true);
    expect(hi.length).toBeGreaterThanOrEqual(lo.length);
  });
});
