import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';
import {
  headlineKeyFor,
  tipKeyFor,
  type DeathCause,
  type DeathCauseTag,
} from '../core/deathCauseClassifier';

function assertResolves(key: string, vars?: Record<string, string | number>): void {
  const resolved = vars ? t(key, vars) : t(key);
  expect(resolved, key).not.toBe(key);
  expect(resolved.length, key).toBeGreaterThan(0);
}

/** Mirrors classifier tags — if a new tag ships, this list must grow (compile fails otherwise). */
const ALL_TAGS: DeathCauseTag[] = [
  'hazard',
  'boss_crushed',
  'elite_kill',
  'one_shot',
  'same_killer',
  'swarmed',
  'low_hp_neglect',
  'unlucky',
];

function minimalCause(tag: DeathCauseTag): DeathCause {
  if (tag === 'same_killer') {
    return { tag, sourceKey: 'test_enemy', hitsFromSource: 3 };
  }
  return { tag, sourceKey: tag === 'boss_crushed' || tag === 'elite_kill' || tag === 'one_shot' ? 'test_enemy' : null };
}

/**
 * GameOverScene death insight uses `headline` + `{ source }` + `tip` (see GameOverScene.renderDeathInsight).
 * These tests lock compassionate-failure copy so refactors cannot drop keys silently.
 */
describe('game over / run result i18n smoke', () => {
  it('resolves every death-cause whit headline + tip (classifier ↔ i18n parity)', () => {
    const sourceLabel = 'Moor Beast';
    for (const tag of ALL_TAGS) {
      const cause = minimalCause(tag);
      const hk = headlineKeyFor(cause);
      const tk = tipKeyFor(cause);
      const headline = t(hk, { source: sourceLabel });
      const tip = t(tk);
      expect(headline, hk).not.toContain('{');
      expect(tip, tk).not.toContain('{');
      expect(headline, hk).not.toBe(hk);
      expect(tip, tk).not.toBe(tk);
    }
  });

  it('resolves rotating death titles and subtitles (GameOverScene RNG lines)', () => {
    for (const n of ['', '_2', '_3', '_4'] as const) {
      assertResolves(`ui.gameOver.death_title${n === '' ? '' : n}`);
      assertResolves(`ui.gameOver.death_sub${n === '' ? '' : n}`);
    }
  });

  it('resolves victory + core stats / action copy used on GameOverScene', () => {
    assertResolves('ui.gameOver.victory_title');
    assertResolves('ui.gameOver.victory_sub');
    assertResolves('ui.gameOver.whit_heading');
    assertResolves('ui.gameOver.stat_time');
    assertResolves('ui.gameOver.stat_kills');
    assertResolves('ui.gameOver.stat_level');
    assertResolves('ui.gameOver.stat_bosses');
    assertResolves('ui.gameOver.stat_passives');
    assertResolves('ui.gameOver.stat_combo');
    assertResolves('ui.gameOver.weapons_line', { count: 2, evolved: 1 });
    assertResolves('ui.gameOver.weapons_line_one', { evolved: 0 });
    assertResolves('ui.gameOver.damage_by_weapon');
    assertResolves('ui.gameOver.gold_title', { amount: 42 });
    assertResolves('ui.gameOver.gold_breakdown', {
      timeGold: 1,
      killGold: 2,
      bossGold: 3,
      coinGold: 4,
    });
    assertResolves('ui.gameOver.play_again');
    assertResolves('ui.gameOver.upgrades');
    assertResolves('ui.gameOver.menu');
    assertResolves('ui.gameOver.run_variant', { label: 'Test' });
    assertResolves('ui.gameOver.no_weapon_damage');
    assertResolves('ui.gameOver.more_weapons', { count: 3 });
    assertResolves('ui.gameOver.unlock_single');
    assertResolves('ui.gameOver.unlock_multi');
    assertResolves('ui.gameOver.next_tip');
    assertResolves('ui.gameOver.new_best');
    assertResolves('ui.gameOver.seed_normal', { code: 'ABC' });
    assertResolves('ui.gameOver.seed_daily', { code: 'XYZ' });
    assertResolves('ui.gameOver.seed_copy_hint');
    assertResolves('ui.gameOver.seed_copied', { code: 'ZZZ' });
    assertResolves('ui.gameOver.postcard_hint');
    assertResolves('ui.gameOver.postcard_saved');
    assertResolves('ui.gameOver.rerun_same_seed');
  });

  it('resolves post-bell and run-end ceremony strings', () => {
    assertResolves('ui.gameOver.keep_going_offer');
    assertResolves('ui.gameOver.post_bell_start');
    assertResolves('ui.gameOver.post_bell_sendoff');
  });
});
