import { describe, expect, it } from 'vitest';
import { t } from './i18n';

describe('i18n.t', () => {
  it('resolves nested dot paths', () => {
    expect(t('ui.menu.start_run')).toBe('START RUN');
    expect(t('ui.gameOver.victory_title')).toBe('VICTORY!');
  });

  it('interpolates {placeholders}', () => {
    expect(t('ui.menu.kill_credits', { count: 42 })).toBe('Kill credits: 42');
    expect(t('ui.gameOver.gold_title', { amount: 99 })).toBe('+99 Gold');
    expect(t('ui.gameOver.run_variant', { label: 'Highlander' })).toBe('Run Variant: Highlander');
  });

  it('returns the key string when the path is missing', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
    expect(t('ui.menu.nope')).toBe('ui.menu.nope');
  });

  it('returns the key when the path hits a non-leaf object', () => {
    expect(t('ui.menu')).toBe('ui.menu');
  });

  it('EN_STRINGS contains evolution and achievement entries used by BalanceConfig keys', () => {
    expect(t('evolution.thistle_storm.name')).toBe('Thistle Storm');
    expect(t('achievement.ach_survive_10m.title')).toBe('Heather Marathon');
  });
});
