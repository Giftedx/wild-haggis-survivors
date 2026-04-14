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
    assertResolves('ui.hud.curse_chip', { name: 'Heavy Legs' });
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
  });

  it('resolves ui.run.* identity handoff', () => {
    assertResolves('ui.run.start_identity', { name: 'A', flavor: 'B' });
    assertResolves('ui.run.resume_identity', { name: 'A', flavor: 'B' });
  });

  it('resolves per-boss celebration + spawn warning copy from BOSSES table', () => {
    for (const b of BOSSES) {
      assertResolves(`ui.game.boss_killed_${b.key}`);
      assertResolves(b.warningKey);
    }
  });
});
