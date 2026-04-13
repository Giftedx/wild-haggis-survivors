import { describe, expect, it } from 'vitest';
import { ENEMY_TYPES, BOSSES } from './enemies';
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
