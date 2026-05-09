import { describe, expect, it } from 'vitest';
import {
  ENEMY_TYPES,
  BOSSES,
  getEnemyDisplayName,
  getEnemyConfigsByKeys,
  getAvailableEnemyTypes,
} from './enemies';
import { WAVE_TIMELINE } from '../core/BalanceConfig';
import { DEFAULT_LOCALE, setLocale, t } from '../core/i18n';

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
    const validBehaviors = ['chase', 'swarm', 'tank', 'dive', 'ranged', 'hazard', 'orbit', 'flee', 'spawner', 'phase', 'flank', 'three_bay'];
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
  it('has at least 7 bosses', () => {
    // Floor was 5 at launch; raised to 7 once the N1 Tier-2 mythos
    // additions (Each-uisge 7:30, Nicnevin 12:30) shipped. Solway
    // Remnant brings the floor to 8 once cultural review clears.
    expect(BOSSES.length).toBeGreaterThanOrEqual(7);
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

  /**
   * Catches the typo-id bug class — a missing nameKey or warningKey
   * surfaces the literal key string at runtime (boss banner reads as
   * raw dot-path). Every boss def's i18n keys must resolve in EN.
   */
  it('every boss nameKey + warningKey resolves in EN', () => {
    setLocale(DEFAULT_LOCALE);
    try {
      for (const boss of BOSSES) {
        expect(t(boss.nameKey), `nameKey for ${boss.key}`).not.toBe(boss.nameKey);
        expect(t(boss.warningKey), `warningKey for ${boss.key}`).not.toBe(boss.warningKey);
      }
    } finally {
      setLocale(DEFAULT_LOCALE);
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

  /**
   * Coverage fence — every ENEMY_TYPES key should have a curated
   * display name, not the underscore-to-title-case fallback. Catches
   * the silent drift where a new enemy ships with a name like
   * "Traffic Cone Totem" OK by accident but risks something uglier
   * like "Buckfast Ned" → "Buckfast_ned" on an underscore typo.
   */
  it('every ENEMY_TYPES key has a curated display name (no underscore fallback)', () => {
    for (const key of Object.keys(ENEMY_TYPES)) {
      const display = getEnemyDisplayName(key);
      expect(display, `'${key}' display name is empty`).not.toBe('');
      // Curated names never contain underscores — fallback path is
      // the only way a raw underscore slips through.
      expect(display, `'${key}' display name has raw underscore: "${display}"`).not.toMatch(/_/);
    }
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
