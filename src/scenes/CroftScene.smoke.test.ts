import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, setLocale, t } from '../core/i18n';
import {
  CROFT_I18N_KEYS,
  CROFT_SCENE_KEY,
} from './croft/CroftComposition';

/**
 * Smoke tests for CroftScene.
 *
 * Importing CroftScene directly pulls in Phaser which touches `window`
 * at module eval and fails under the node-env vitest config (see
 * CLAUDE.md "Phaser imports break in node-env vitest"). We therefore
 * test the pure identifiers + i18n surface the scene depends on —
 * Playwright e2e owns the headfull "launches without error" check.
 */
describe('CroftScene identity', () => {
  it('scene key constant is stable', () => {
    expect(CROFT_SCENE_KEY).toBe('Croft');
  });
});

describe('CroftScene i18n keys (EN)', () => {
  it('every key in CROFT_I18N_KEYS resolves to a non-placeholder string', () => {
    for (const key of CROFT_I18N_KEYS) {
      const value = t(key);
      expect(value, `${key} unresolved`).not.toBe(key);
      expect(value.length, `${key} empty`).toBeGreaterThan(0);
    }
  });

  it('title fits a short-label budget (<= 4 words)', () => {
    const title = t('ui.croft.title');
    const words = title.split(/\s+/).filter(Boolean);
    expect(words.length, `title "${title}" exceeds 4 words`).toBeLessThanOrEqual(4);
  });

  it('gran_greet is a short banter line (<= 16 words)', () => {
    const line = t('ui.croft.gran_greet');
    const words = line.split(/\s+/).filter(Boolean);
    expect(words.length, `gran_greet "${line}" exceeds 16 words`).toBeLessThanOrEqual(16);
  });
});

describe('CroftScene i18n keys (SCS overlay)', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE));

  it('every key in CROFT_I18N_KEYS resolves under scs (overlay or EN fallback)', () => {
    setLocale('scs');
    for (const key of CROFT_I18N_KEYS) {
      const value = t(key);
      expect(value, `${key} unresolved in scs`).not.toBe(key);
      expect(value.length, `${key} empty in scs`).toBeGreaterThan(0);
    }
  });
});
