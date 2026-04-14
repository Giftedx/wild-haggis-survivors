import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';
import { BOSSES } from '../data/enemies';

function assertResolves(key: string, vars?: Record<string, string | number>): void {
  const resolved = vars ? t(key, vars) : t(key);
  expect(resolved, key).not.toBe(key);
  expect(resolved.length, key).toBeGreaterThan(0);
}

const KILL_MILESTONE_THRESHOLDS = [100, 250, 500, 1000, 2500, 5000] as const;

/**
 * Regression fence for strings shown during active play: HUD, combo/juice
 * toasts, pickups, level-up flow, run identity, boss warnings.
 */
describe('in-run HUD / game / juice i18n smoke', () => {
  it('resolves TutorialSystem overlay + drift banner copy', () => {
    assertResolves('tutorial.move');
    assertResolves('tutorial.gem');
    assertResolves('tutorial.drift');
    assertResolves('tutorial.elite_affix_first', { name: 'Swift' });
    assertResolves('tutorial.moor_moment_first');
  });

  it('resolves ui.common.rarity.* (UpgradeCards pills)', () => {
    for (const r of ['common', 'uncommon', 'rare', 'legendary'] as const) {
      assertResolves(`ui.common.rarity.${r}`);
    }
  });

  it('resolves ui.hud.* (HUD + JuiceSystem combo line)', () => {
    assertResolves('ui.hud.level_fmt', { level: 1 });
    assertResolves('ui.hud.goal_countdown', { m: 0, s: '00' });
    assertResolves('ui.hud.goal_finale');
    assertResolves('ui.hud.wave_objective', { wave: 1, goal: 'x' });
    assertResolves('ui.hud.enemies_capped_suffix');
    assertResolves('ui.hud.kills_enemies', { kills: 0, count: 0, suffix: '' });
    assertResolves('ui.hud.kills_enemies', { kills: 1, count: 2, suffix: t('ui.hud.enemies_capped_suffix') });
    assertResolves('ui.hud.dash_ready');
    assertResolves('ui.hud.dash_cooldown_pct', { pct: 50 });
    assertResolves('ui.hud.dash_label');
    assertResolves('ui.hud.dps_line', { dps: 123 });
    assertResolves('ui.hud.curse_chip', { name: 'Heavy Legs', pct: 30 });
    assertResolves('ui.hud.combo_bonus', { pct: 10 });
    assertResolves('ui.hud.combo', { count: 5, bonus: t('ui.hud.combo_bonus', { pct: 5 }) });
    assertResolves('ui.hud.combo', { count: 0, bonus: '' });
  });

  it('resolves ui.game.* used in GameScene, PickupSpawner, LevelUpFlow, JuiceSystem, RunLifecycle', () => {
    assertResolves('ui.game.kill_milestone', { count: 7, gold: 0 });
    for (const n of KILL_MILESTONE_THRESHOLDS) {
      assertResolves(`ui.game.kill_${n}`, { gold: 1 });
    }
    assertResolves('ui.game.boss_killed_generic');
    assertResolves('ui.game.boss_kill_heal', { hp: 5 });
    assertResolves('ui.game.achievement_unlock', { title: 'x' });
    assertResolves('ui.game.boss_enraged');
    assertResolves('ui.game.controls_hint');
    assertResolves('ui.game.countdown_go');
    assertResolves('ui.game.armor_blocked', { amount: 1 });
    assertResolves('ui.game.second_wind');
    assertResolves('ui.game.combo_dropped', { count: 3 });
    assertResolves('ui.game.combo_dropped_big', { count: 10 });
    assertResolves('ui.game.combo_11');
    assertResolves('ui.game.combo_50');
    assertResolves('ui.game.combo_100');
    assertResolves('ui.game.combo_200');
    assertResolves('ui.game.treasure_nearby');
    assertResolves('ui.game.treasure_collected');
    assertResolves('ui.game.golden_nearby');
    assertResolves('ui.game.golden_collected', { gold: 5 });
    assertResolves('ui.game.gold_pickup_float', { gold: 2 });
    assertResolves('ui.game.level_banner', { level: 2 });
    assertResolves('ui.game.level_power_surge', { level: 3 });
    assertResolves('ui.game.evolution_primed', { name: 'Legend' });
    assertResolves('ui.game.level_up_fallback');
    assertResolves('ui.game.upgrade_new_weapon', { name: 'x' });
    assertResolves('ui.game.upgrade_weapon_level', { name: 'x' });
    assertResolves('ui.game.upgrade_add_passive', { name: 'x' });
    assertResolves('ui.game.upgrade_stat_boost', { name: 'x' });
    assertResolves('ui.game.upgrade_evolve_weapon', { name: 'x' });
    assertResolves('ui.game.max_level_toast');
    assertResolves('ui.game.xp_overflow_gold', { gold: 14 });
    assertResolves('ui.game.codex_first_cull', { name: 'Tourist' });
  });

  it('resolves ui.run.* identity handoff', () => {
    assertResolves('ui.run.start_identity', { name: 'A', flavor: 'B' });
    assertResolves('ui.run.resume_identity', { name: 'A', flavor: 'B' });
  });

  it('resolves ui.moor_moment.* (timed hearth beats)', () => {
    assertResolves('ui.moor_moment.boon_at_ceiling', { gold: 12 });
    const ids = [
      'peat_glint', 'loch_breath', 'heather_rest', 'pine_pull',
      'crow_bargain', 'distant_tune', 'warm_stone', 'wind_shift',
      'amber_glow',
    ] as const;
    for (const id of ids) {
      assertResolves(`ui.moor_moment.${id}.caption`);
      assertResolves(`ui.moor_moment.${id}.caption_home`);
      if (id === 'pine_pull' || id === 'wind_shift') {
        assertResolves(`ui.moor_moment.${id}.toast`);
        assertResolves(`ui.moor_moment.${id}.toast_home`);
      } else if (id === 'loch_breath' || id === 'distant_tune') {
        assertResolves(`ui.moor_moment.${id}.toast`, { xp: 10 });
        assertResolves(`ui.moor_moment.${id}.toast_home`, { xp: 10 });
      } else if (id === 'heather_rest' || id === 'warm_stone') {
        assertResolves(`ui.moor_moment.${id}.toast`, { hp: 5 });
        assertResolves(`ui.moor_moment.${id}.toast_home`, { hp: 5 });
      } else {
        assertResolves(`ui.moor_moment.${id}.toast`, { gold: 8 });
        assertResolves(`ui.moor_moment.${id}.toast_home`, { gold: 8 });
      }
    }
  });

  it('resolves per-boss celebration + spawn warning copy from BOSSES table', () => {
    for (const b of BOSSES) {
      assertResolves(`ui.game.boss_killed_${b.key}`);
      assertResolves(b.warningKey);
    }
  });
});
