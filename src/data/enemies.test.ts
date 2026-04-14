import { describe, expect, it } from 'vitest';
import {
  ENEMY_TYPES,
  BOSSES,
  getEnemyDisplayName,
  getEnemyConfigsByKeys,
  getAvailableEnemyTypes,
} from './enemies';
import { WAVE_TIMELINE } from '../core/BalanceConfig';

describe('ENEMY_TYPES', () => {
  const keys = Object.keys(ENEMY_TYPES);

  it('has at least 10 enemy types', () => {
    expect(keys.length).toBeGreaterThanOrEqual(10);
  });

  it('every enemy key matches its .key field', () => {
    for (const key of keys) {
      expect(ENEMY_TYPES[key].key).toBe(key);
    }
  });

  it('every enemy has positive HP', () => {
    for (const key of keys) {
      expect(ENEMY_TYPES[key].hp).toBeGreaterThan(0);
    }
  });

  it('every enemy has non-negative speed', () => {
    for (const key of keys) {
      expect(ENEMY_TYPES[key].speed).toBeGreaterThanOrEqual(0);
    }
  });

  it('every enemy has a valid behavior type', () => {
    const validBehaviors = ['chase', 'swarm', 'tank', 'dive', 'ranged', 'hazard', 'orbit', 'flee', 'spawner', 'phase', 'flank'];
    for (const key of keys) {
      expect(validBehaviors, `${key} has unknown behavior: ${ENEMY_TYPES[key].behavior}`)
        .toContain(ENEMY_TYPES[key].behavior);
    }
  });

  it('every wave timeline enemy key exists in ENEMY_TYPES', () => {
    for (const entry of WAVE_TIMELINE) {
      for (const key of entry.enemyKeys) {
        expect(ENEMY_TYPES, `Wave timeline references unknown enemy: ${key}`).toHaveProperty(key);
      }
    }
  });
});

describe('BOSSES', () => {
  it('has at least 5 bosses', () => {
    expect(BOSSES.length).toBeGreaterThanOrEqual(5);
  });

  it('every boss has a unique key', () => {
    const keys = new Set(BOSSES.map((b) => b.key));
    expect(keys.size).toBe(BOSSES.length);
  });

  it('every boss has positive HP and spawn time', () => {
    for (const boss of BOSSES) {
      expect(boss.hp, `${boss.key} has non-positive HP`).toBeGreaterThan(0);
      expect(boss.spawnTimeSec, `${boss.key} has non-positive spawnTimeSec`).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('getEnemyDisplayName', () => {
  it('returns the curated label when the key is known', () => {
    expect(getEnemyDisplayName('tourist')).toBe('Tourist');
    expect(getEnemyDisplayName('midgie_swarm')).toBe('Midgie Swarm');
    expect(getEnemyDisplayName('tour_bus')).toBe('Tour Bus');
  });

  it('title-cases unknown keys with underscores as word breaks', () => {
    expect(getEnemyDisplayName('wee_mod_enemy')).toBe('Wee Mod Enemy');
  });

  it('handles empty string without throwing', () => {
    expect(getEnemyDisplayName('')).toBe('');
  });
});

describe('getEnemyConfigsByKeys', () => {
  it('returns only configs that exist, preserving input order', () => {
    const cfgs = getEnemyConfigsByKeys(['tourist', 'not_real', 'chef']);
    expect(cfgs.map((c) => c.key)).toEqual(['tourist', 'chef']);
  });
});

describe('getAvailableEnemyTypes', () => {
  it('includes enemies whose appearsAt is <= game time', () => {
    const t0 = getAvailableEnemyTypes(0);
    expect(t0.some((e) => e.key === 'tourist')).toBe(true);
    expect(t0.some((e) => e.key === 'chef')).toBe(false);
    const late = getAvailableEnemyTypes(120);
    expect(late.length).toBeGreaterThanOrEqual(t0.length);
    expect(late.some((e) => e.key === 'chef')).toBe(true);
  });
});
