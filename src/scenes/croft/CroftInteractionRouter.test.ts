import { describe, expect, it } from 'vitest';
import { CROFT_ACTION_KEYS, route } from './CroftInteractionRouter';

describe('CroftInteractionRouter', () => {
  it('routes start_run to the Curse picker (leaves croft; Curse commits to Game)', () => {
    const r = route('start_run');
    expect(r.target).toBe('Curse');
    expect(r.leavesCroft).toBe(true);
  });

  it('routes shop to the Shop sub-scene without leaving the croft', () => {
    const r = route('shop');
    expect(r.target).toBe('Shop');
    expect(r.leavesCroft).toBe(false);
  });

  it('routes settings, chronicle, deeds, almanac as sub-views (stay in croft)', () => {
    for (const key of ['settings', 'chronicle', 'deeds', 'almanac'] as const) {
      expect(route(key).leavesCroft, `${key} should not leave croft`).toBe(false);
    }
  });

  it('routes each action to a distinct scene for the leavesCroft=false sub-views', () => {
    const subviews = CROFT_ACTION_KEYS.filter((k) => !route(k).leavesCroft);
    const targets = subviews.map((k) => route(k).target);
    expect(new Set(targets).size, 'sub-view targets overlap').toBe(subviews.length);
  });

  it('every CroftActionKey resolves to a non-empty target', () => {
    for (const key of CROFT_ACTION_KEYS) {
      const r = route(key);
      expect(r.target.length, `${key} has empty target`).toBeGreaterThan(0);
    }
  });

  it('variant_picker temporarily routes to Menu pending M3 drove flow', () => {
    // Until M3 lands, drove-clicks relegate to MenuScene's carousel.
    // Future change: update this test when variant picker lives in-croft.
    expect(route('variant_picker').target).toBe('Menu');
  });

  it('quit returns to MainMenu (intro-scene exit)', () => {
    expect(route('quit').target).toBe('MainMenu');
  });
});
