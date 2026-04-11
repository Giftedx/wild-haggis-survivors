import { describe, expect, it } from 'vitest';
import { t } from './i18n';

describe('i18n.t', () => {
  it('resolves nested dot paths', () => {
    expect(t('ui.menu.start_run')).toBe('START RUN');
    expect(t('ui.gameOver.victory_title')).toBe('The moor is yours!');
  });

  it('interpolates {placeholders}', () => {
    expect(t('ui.menu.kill_credits', { count: 42 })).toBe('The glen remembers: 42 lifetime culls');
    expect(t('ui.gameOver.gold_title', { amount: 99 })).toBe('99 golden haggis earned');
    expect(t('ui.gameOver.run_variant', { label: 'Highlander' })).toBe('This run: Highlander');
    expect(
      t('ui.run.start_identity', { name: 'Classic Haggis', flavor: 'Stubborn wee legend.' })
    ).toBe('Classic Haggis\nStubborn wee legend.');
    expect(
      t('ui.run.resume_identity', { name: 'Moor Runner', flavor: 'Fleet hooves.' })
    ).toBe('Trail picked back up — Moor Runner\nFleet hooves.');
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

  it('exposes boss warning and in-run toast keys used by SpawnSystem and GameScene', () => {
    expect(t('ui.bossWarning.taxman')).toContain('Taxman');
    expect(t('ui.game.kill_milestone', { count: 100, gold: 2 })).toContain('100');
    expect(t('ui.pause.stats_loadout', { w: 2, c: 3 })).toContain('2');
  });
});
