import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';

function assertResolves(key: string, vars?: Record<string, string | number>): void {
  const resolved = vars ? t(key, vars) : t(key);
  expect(resolved, key).not.toBe(key);
  expect(resolved.length, key).toBeGreaterThan(0);
}

const PAUSE_QUIP_KEYS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `ui.pause.quip_${n}`);

/**
 * Misc in-run chrome: pause quips, level-up banner, a11y captions (root
 * `captions.*` tree — not under `ui`).
 */
describe('auxiliary run UI i18n smoke', () => {
  it('resolves accessibility caption strings', () => {
    assertResolves('captions.victory_chorus');
    assertResolves('captions.death_fall');
    assertResolves('captions.low_hp');
  });

  it('resolves pause-menu quips (PauseMenu RNG lines)', () => {
    for (const key of PAUSE_QUIP_KEYS) assertResolves(key);
  });

  it('resolves pause-menu elite-affix reference heading', () => {
    assertResolves('ui.pause.elite_affix_heading');
  });

  it('resolves UpgradeCards + evolution chest banner copy', () => {
    assertResolves('ui.upgradeCards.level_title', { level: 5 });
    assertResolves('ui.upgradeCards.choose_upgrade');
    assertResolves('ui.upgradeCards.reroll', { count: 2 });
    assertResolves('ui.upgradeCards.chest_evolution_title');
    assertResolves('ui.upgradeCards.chest_evolution_sub');
  });
});
