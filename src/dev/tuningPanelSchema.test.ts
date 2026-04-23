import { describe, expect, it } from 'vitest';
import {
  deriveFieldSpecs,
  WEAPON_FIELD_HINTS,
  ENEMY_FIELD_HINTS,
  shouldSkipKey,
  isHintedNumberLeaf,
} from './tuningPanelSchema';

function defaultHintCheckImpl(value: number) {
  // `defaultHint` is private — exercise it via deriveFieldSpecs with an
  // unhinted leaf name (must NOT end in "Key", which is a skip rule).
  const specs = deriveFieldSpecs({ mysteryStat: value });
  return specs[0];
}

describe('tuningPanelSchema', () => {
  describe('shouldSkipKey', () => {
    it('skips identifier-style keys', () => {
      expect(shouldSkipKey('key')).toBe(true);
      expect(shouldSkipKey('texture')).toBe(true);
      expect(shouldSkipKey('behavior')).toBe(true);
      expect(shouldSkipKey('evolutionKey')).toBe(true);
    });

    it('skips i18n path fields', () => {
      expect(shouldSkipKey('nameKey')).toBe(true);
      expect(shouldSkipKey('descriptionKey')).toBe(true);
      expect(shouldSkipKey('warningKey')).toBe(true);
    });

    it('keeps numeric stat keys', () => {
      expect(shouldSkipKey('damage')).toBe(false);
      expect(shouldSkipKey('cooldownMs')).toBe(false);
      expect(shouldSkipKey('hp')).toBe(false);
    });
  });

  describe('isHintedNumberLeaf', () => {
    it('accepts finite numbers', () => {
      expect(isHintedNumberLeaf(0)).toBe(true);
      expect(isHintedNumberLeaf(-1.5)).toBe(true);
      expect(isHintedNumberLeaf(1000)).toBe(true);
    });

    it('rejects NaN, Infinity, non-numbers', () => {
      expect(isHintedNumberLeaf(NaN)).toBe(false);
      expect(isHintedNumberLeaf(Infinity)).toBe(false);
      expect(isHintedNumberLeaf('5')).toBe(false);
      expect(isHintedNumberLeaf(null)).toBe(false);
      expect(isHintedNumberLeaf(undefined)).toBe(false);
    });
  });

  describe('deriveFieldSpecs', () => {
    it('returns one spec per numeric leaf at top level', () => {
      const specs = deriveFieldSpecs({ damage: 10, hp: 5 });
      expect(specs).toHaveLength(2);
      expect(specs.map(s => s.label).sort()).toEqual(['damage', 'hp']);
    });

    it('skips non-numeric leaves', () => {
      const specs = deriveFieldSpecs({
        damage: 10,
        key: 'thistle_shot',
        texture: 'thistle',
        nameKey: 'weapon.thistle.name',
      });
      expect(specs).toHaveLength(1);
      expect(specs[0].label).toBe('damage');
    });

    it('recurses into nested objects with dot-path labels', () => {
      const specs = deriveFieldSpecs({
        damage: 10,
        levelScaling: { damage: 1.25, cooldown: 0.88 },
      });
      const labels = specs.map(s => s.label).sort();
      expect(labels).toEqual(['damage', 'levelScaling.cooldown', 'levelScaling.damage']);
    });

    it('preserves path arrays for nested fields', () => {
      const specs = deriveFieldSpecs({
        levelScaling: { damage: 1.25 },
      });
      expect(specs[0].path).toEqual(['levelScaling', 'damage']);
    });

    it('skips arrays', () => {
      const specs = deriveFieldSpecs({
        damage: 10,
        levelScaling: { countAt: [3, 5], damage: 1.25 },
      });
      const labels = specs.map(s => s.label).sort();
      expect(labels).toEqual(['damage', 'levelScaling.damage']);
      expect(labels).not.toContain('levelScaling.countAt');
    });

    it('skips null values', () => {
      const specs = deriveFieldSpecs({ damage: 10, optional: null });
      expect(specs).toHaveLength(1);
    });

    it('applies hint when key matches', () => {
      const specs = deriveFieldSpecs(
        { damage: 10 },
        { damage: { min: 0, max: 100, step: 0.5 } },
      );
      expect(specs[0]).toMatchObject({ min: 0, max: 100, step: 0.5 });
    });

    it('falls back to default hint for unknown numeric keys', () => {
      const spec = defaultHintCheckImpl(50);
      expect(spec.min).toBe(0);
      expect(spec.max).toBeGreaterThan(50);
      expect(spec.step).toBe(1);
    });

    it('default hint produces float step for float values', () => {
      const spec = defaultHintCheckImpl(1.25);
      expect(spec.step).toBeLessThan(1);
      expect(Number.isInteger(spec.step)).toBe(false);
    });

    it('default hint handles zero gracefully', () => {
      const spec = defaultHintCheckImpl(0);
      expect(spec.min).toBe(0);
      expect(spec.max).toBeGreaterThan(0);
      expect(spec.step).toBeGreaterThan(0);
    });
  });

  describe('field hint tables', () => {
    it('WEAPON_FIELD_HINTS covers core weapon stats', () => {
      const required = ['damage', 'cooldownMs', 'projectileSpeed', 'pierce', 'aoeRadius'];
      for (const k of required) {
        expect(WEAPON_FIELD_HINTS[k]).toBeDefined();
      }
    });

    it('ENEMY_FIELD_HINTS covers core enemy stats', () => {
      const required = ['speed', 'hp', 'damage', 'xpValue', 'appearsAt', 'packSize'];
      for (const k of required) {
        expect(ENEMY_FIELD_HINTS[k]).toBeDefined();
      }
    });

    it('all hints have min < max and step > 0', () => {
      for (const [key, h] of Object.entries({ ...WEAPON_FIELD_HINTS, ...ENEMY_FIELD_HINTS })) {
        expect(h.min, key).toBeLessThan(h.max);
        expect(h.step, key).toBeGreaterThan(0);
      }
    });
  });

  describe('integration with realistic weapon shape', () => {
    it('derives expected fields from a WeaponDef-shaped object', () => {
      const sample = {
        key: 'thistle_shot',
        nameKey: 'weapon.thistle_shot.name',
        descriptionKey: 'weapon.thistle_shot.description',
        behavior: 'projectile',
        cooldownMs: 1200,
        damage: 5,
        projectileSpeed: 350,
        projectileCount: 1,
        pierce: 0,
        range: 500,
        aoeRadius: 0,
        arcDegrees: 0,
        knockback: 0,
        levelScaling: {
          damage: 1.25,
          cooldown: 0.88,
          countAt: [3, 5],
          pierce: 0,
          radius: 1,
        },
      };
      const specs = deriveFieldSpecs(sample, WEAPON_FIELD_HINTS);
      const labels = specs.map(s => s.label);
      expect(labels).toContain('damage');
      expect(labels).toContain('cooldownMs');
      expect(labels).toContain('levelScaling.damage');
      expect(labels).toContain('levelScaling.cooldown');
      expect(labels).not.toContain('key');
      expect(labels).not.toContain('nameKey');
      expect(labels).not.toContain('behavior');
      expect(labels).not.toContain('levelScaling.countAt');
    });
  });
});

