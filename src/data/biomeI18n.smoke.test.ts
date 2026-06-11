import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';
import { BIOMES } from './biomes';

/**
 * Regression fence: biome entry toasts and names resolve via `t(nameKey)` /
 * `t(entryToastKey)` from `BIOMES` (GameScene / Banter paths).
 */
describe('biome i18n smoke', () => {
  it('resolves every biome nameKey and entryToastKey', () => {
    for (const def of Object.values(BIOMES)) {
      const name = t(def.nameKey);
      expect(name, def.nameKey).not.toBe(def.nameKey);
      expect(name.length, def.nameKey).toBeGreaterThan(0);
      const entry = t(def.entryToastKey);
      expect(entry, def.entryToastKey).not.toBe(def.entryToastKey);
      expect(entry.length, def.entryToastKey).toBeGreaterThan(0);
    }
  });
});
