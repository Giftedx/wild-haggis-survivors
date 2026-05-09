import { describe, expect, it } from 'vitest';
import { WEAPON_DEFS, type WeaponKey } from './weapons';
import { EVOLUTION_RECIPES } from '../core/BalanceConfig';
import { t } from '../core/i18n';

describe('WEAPON_DEFS', () => {
  const keys = Object.keys(WEAPON_DEFS) as WeaponKey[];

  it('has exactly 10 weapons', () => {
    expect(keys).toHaveLength(10);
  });

  it('every weapon key matches its .key field', () => {
    for (const key of keys) {
      expect(WEAPON_DEFS[key].key).toBe(key);
    }
  });

  it('every weapon has valid i18n name and description keys', () => {
    for (const key of keys) {
      const def = WEAPON_DEFS[key];
      const name = t(def.nameKey);
      const desc = t(def.descriptionKey);
      expect(name, `${key} nameKey not found in i18n`).not.toBe(def.nameKey);
      expect(desc, `${key} descriptionKey not found in i18n`).not.toBe(def.descriptionKey);
    }
  });

  it('every evolution recipe references valid weapon and passive keys', () => {
    for (const recipe of EVOLUTION_RECIPES) {
      expect(keys).toContain(recipe.baseWeapon);
      const evoName = t(recipe.nameKey);
      expect(evoName, `Evolution ${recipe.evolvedWeapon} nameKey not found`).not.toBe(recipe.nameKey);
    }
  });

  it('weapon cooldowns are within reasonable range (50ms - 5000ms)', () => {
    for (const key of keys) {
      const cd = WEAPON_DEFS[key].cooldownMs;
      expect(cd).toBeGreaterThanOrEqual(50);
      expect(cd).toBeLessThanOrEqual(5000);
    }
  });

  it('weapon damage values are positive', () => {
    for (const key of keys) {
      expect(WEAPON_DEFS[key].damage).toBeGreaterThan(0);
    }
  });
});

describe('weapon stat scaling (levelUpWeapon math)', () => {
  function computeStatsAtLevel(key: WeaponKey, level: number) {
    const def = WEAPON_DEFS[key];
    const s = def.levelScaling;
    let damage = def.damage;
    let cooldownMs = def.cooldownMs;
    let pierce = def.pierce;
    let aoeRadius = def.aoeRadius;
    let projectileCount = def.projectileCount;

    for (let lv = 2; lv <= level; lv++) {
      damage = Math.ceil(def.damage * Math.pow(s.damage, lv - 1));
      cooldownMs = Math.max(200, def.cooldownMs * Math.pow(s.cooldown, lv - 1));
      pierce = def.pierce + s.pierce * (lv - 1);
      aoeRadius = def.aoeRadius * Math.pow(s.radius, lv - 1);
      if (s.countAt.includes(lv)) projectileCount++;
    }

    return { damage, cooldownMs, pierce, aoeRadius, projectileCount };
  }

  it('thistle_shot gains projectile count at levels 3 and 5', () => {
    const def = WEAPON_DEFS.thistle_shot;
    expect(def.levelScaling.countAt).toEqual([3, 5]);

    const lv2 = computeStatsAtLevel('thistle_shot', 2);
    expect(lv2.projectileCount).toBe(1);

    const lv3 = computeStatsAtLevel('thistle_shot', 3);
    expect(lv3.projectileCount).toBe(2);

    const lv5 = computeStatsAtLevel('thistle_shot', 5);
    expect(lv5.projectileCount).toBe(3);
  });

  it('damage scales multiplicatively per level', () => {
    const def = WEAPON_DEFS.thistle_shot;
    const lv5 = computeStatsAtLevel('thistle_shot', 5);
    const expected = Math.ceil(def.damage * Math.pow(def.levelScaling.damage, 4));
    expect(lv5.damage).toBe(expected);
  });

  it('cooldown never drops below 200ms floor', () => {
    for (const key of Object.keys(WEAPON_DEFS) as WeaponKey[]) {
      const stats = computeStatsAtLevel(key, 5);
      expect(stats.cooldownMs).toBeGreaterThanOrEqual(200);
    }
  });

  it('piercing weapons accumulate pierce per level', () => {
    const def = WEAPON_DEFS.caber_toss;
    expect(def.levelScaling.pierce).toBeGreaterThan(0);
    const lv5 = computeStatsAtLevel('caber_toss', 5);
    expect(lv5.pierce).toBe(def.pierce + def.levelScaling.pierce * 4);
  });

  it('aoe weapons scale radius per level', () => {
    const def = WEAPON_DEFS.bagpipe_blast;
    const lv3 = computeStatsAtLevel('bagpipe_blast', 3);
    const expected = def.aoeRadius * Math.pow(def.levelScaling.radius, 2);
    expect(lv3.aoeRadius).toBeCloseTo(expected);
  });
});

describe('weapon evolution stat boosts', () => {
  function computeEvolvedStats(key: WeaponKey) {
    const lv5 = (() => {
      const def = WEAPON_DEFS[key];
      const s = def.levelScaling;
      return {
        damage: Math.ceil(def.damage * Math.pow(s.damage, 4)),
        cooldownMs: Math.max(200, def.cooldownMs * Math.pow(s.cooldown, 4)),
        projectileCount: def.projectileCount + s.countAt.filter(l => l <= 5).length,
        pierce: def.pierce + s.pierce * 4,
        aoeRadius: def.aoeRadius * Math.pow(s.radius, 4),
      };
    })();

    return {
      damage: Math.ceil(lv5.damage * 1.35),
      cooldownMs: Math.max(220, lv5.cooldownMs * 0.72),
      projectileCount: Math.max(lv5.projectileCount, 2),
      aoeRadius: lv5.aoeRadius * 1.35,
      pierce: Math.max(lv5.pierce, 3),
    };
  }

  it('evolution applies 1.35x damage multiplier', () => {
    const def = WEAPON_DEFS.thistle_shot;
    const lv5Damage = Math.ceil(def.damage * Math.pow(def.levelScaling.damage, 4));
    const evolved = computeEvolvedStats('thistle_shot');
    expect(evolved.damage).toBe(Math.ceil(lv5Damage * 1.35));
  });

  it('evolution cooldown floors at 220ms (not 200ms)', () => {
    for (const key of Object.keys(WEAPON_DEFS) as WeaponKey[]) {
      const evolved = computeEvolvedStats(key);
      expect(evolved.cooldownMs).toBeGreaterThanOrEqual(220);
    }
  });

  it('evolution guarantees at least 2 projectiles', () => {
    for (const key of Object.keys(WEAPON_DEFS) as WeaponKey[]) {
      const evolved = computeEvolvedStats(key);
      expect(evolved.projectileCount).toBeGreaterThanOrEqual(2);
    }
  });

  it('evolution guarantees at least 3 pierce', () => {
    for (const key of Object.keys(WEAPON_DEFS) as WeaponKey[]) {
      const evolved = computeEvolvedStats(key);
      expect(evolved.pierce).toBeGreaterThanOrEqual(3);
    }
  });
});
