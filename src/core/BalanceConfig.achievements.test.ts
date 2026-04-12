import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_DEFS } from './BalanceConfig';
import { t } from './i18n';

describe('ACHIEVEMENT_DEFS', () => {
  it('every achievement has valid i18n title and description keys', () => {
    for (const [id, def] of Object.entries(ACHIEVEMENT_DEFS)) {
      const title = t(def.titleKey);
      const desc = t(def.descriptionKey);
      // i18n returns the key itself when not found
      expect(title, `${id} titleKey "${def.titleKey}" not found in i18n`).not.toBe(def.titleKey);
      expect(desc, `${id} descriptionKey "${def.descriptionKey}" not found in i18n`).not.toBe(def.descriptionKey);
      expect(title.length).toBeGreaterThan(0);
      expect(desc.length).toBeGreaterThan(0);
    }
  });

  it('has at least 9 achievements', () => {
    expect(Object.keys(ACHIEVEMENT_DEFS).length).toBeGreaterThanOrEqual(9);
  });

  it('all achievement ids match ach_ prefix convention', () => {
    for (const id of Object.keys(ACHIEVEMENT_DEFS)) {
      expect(id).toMatch(/^ach_/);
    }
  });
});
