import { describe, it, expect } from 'vitest';
import {
  COMPANION_KEYS_IN_ORDER,
  COMPANION_DEFS,
  MAX_COMPANIONS_PER_RUN,
  type CompanionKey,
} from './companionTypes';

describe('COMPANION_KEYS_IN_ORDER', () => {
  it('contains all three companions in stable order', () => {
    expect(COMPANION_KEYS_IN_ORDER).toEqual(['sheepdog', 'stoat_scout', 'eagle']);
  });

  it('has no duplicates', () => {
    expect(new Set(COMPANION_KEYS_IN_ORDER).size).toBe(COMPANION_KEYS_IN_ORDER.length);
  });
});

describe('COMPANION_DEFS', () => {
  it('has a def for every key in COMPANION_KEYS_IN_ORDER', () => {
    for (const key of COMPANION_KEYS_IN_ORDER) {
      expect(COMPANION_DEFS[key]).toBeDefined();
      expect(COMPANION_DEFS[key].key).toBe(key);
    }
  });

  it('each def has two texture keys', () => {
    for (const key of COMPANION_KEYS_IN_ORDER) {
      expect(COMPANION_DEFS[key].textureKeys).toHaveLength(2);
    }
  });

  describe('eagle def', () => {
    const eagle = COMPANION_DEFS.eagle;

    it('uses the correct perched texture keys', () => {
      expect(eagle.textureKeys[0]).toBe('croft_eagle_perch_f0');
      expect(eagle.textureKeys[1]).toBe('croft_eagle_perch_f1');
    });

    it('has wider personal space than sheepdog and stoat', () => {
      expect(eagle.followDistance).toBeGreaterThan(COMPANION_DEFS.sheepdog.followDistance);
      expect(eagle.followDistance).toBeGreaterThan(COMPANION_DEFS.stoat_scout.followDistance);
    });

    it('has longer tether than stoat', () => {
      expect(eagle.tetherDistance).toBeGreaterThanOrEqual(COMPANION_DEFS.stoat_scout.tetherDistance);
    });

    it('has slower max speed than stoat (dignified, not darting)', () => {
      expect(eagle.maxSpeed).toBeLessThan(COMPANION_DEFS.stoat_scout.maxSpeed);
    });

    it('has a slower idle frame rate than stoat', () => {
      expect(eagle.idleFrameSec).toBeGreaterThan(COMPANION_DEFS.stoat_scout.idleFrameSec);
    });

    it('references the correct i18n nameKey', () => {
      expect(eagle.nameKey).toBe('ui.hud.companion.eagle');
    });
  });
});

describe('MAX_COMPANIONS_PER_RUN', () => {
  it('is 1 — cosmetic-only promise intact', () => {
    expect(MAX_COMPANIONS_PER_RUN).toBe(1);
  });
});

describe('CompanionKey type coverage', () => {
  it('eagle is a valid CompanionKey at runtime via the def record', () => {
    const key: CompanionKey = 'eagle';
    expect(COMPANION_DEFS[key]).toBeDefined();
  });
});
