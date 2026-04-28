import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';
import { BOSSES, ENEMY_TYPES } from './enemies';

/**
 * C1 Almanac — every shipped enemy + boss must have a `beastie.<key>.lore`
 * leaf that resolves through `t()`. The Almanac's `buildBeastieDetail`
 * resolves this key directly; the panel falls back to a generic stub
 * when the lookup fails, so a missing leaf silently demotes the entry
 * to placeholder lore. This fence catches that drift loudly.
 *
 * Pairs with `biomeI18n.smoke.test.ts` — same pattern, broader coverage.
 */
describe('beastie lore i18n smoke', () => {
  it('every ENEMY_TYPES key has a beastie.<key>.lore leaf in EN', () => {
    for (const key of Object.keys(ENEMY_TYPES)) {
      const path = `beastie.${key}.lore`;
      const resolved = t(path);
      expect(resolved, `missing beastie lore for enemy '${key}'`).not.toBe(path);
      expect(resolved.length, `empty beastie lore for enemy '${key}'`).toBeGreaterThan(20);
    }
  });

  it('every BOSSES key has a beastie.<key>.lore leaf in EN', () => {
    for (const boss of BOSSES) {
      const path = `beastie.${boss.key}.lore`;
      const resolved = t(path);
      expect(resolved, `missing beastie lore for boss '${boss.key}'`).not.toBe(path);
      expect(resolved.length, `empty beastie lore for boss '${boss.key}'`).toBeGreaterThan(20);
    }
  });
});
