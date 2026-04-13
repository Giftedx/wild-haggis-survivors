import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';
import { CURSES } from '../data/curses';
import { META_SHOP_ITEMS } from '../data/metaShopItems';
import { VARIANTS } from '../data/variants';
import type { DeathCauseTag } from '../core/deathCauseClassifier';

function assertResolves(key: string, vars?: Record<string, string | number>): void {
  const resolved = vars ? t(key, vars) : t(key);
  expect(resolved, key).not.toBe(key);
  expect(resolved.length, key).toBeGreaterThan(0);
}

const DEATH_TAGS: DeathCauseTag[] = [
  'hazard',
  'boss_crushed',
  'elite_kill',
  'one_shot',
  'same_killer',
  'swarmed',
  'low_hp_neglect',
  'unlucky',
];

const STATS_LINE_VARS = {
  bestTime: '0:00',
  bestKills: 0,
  bestCombo: 0,
  totalRuns: 0,
  victories: 0,
  gold: 0,
};

/**
 * i18n regression fence for shop, meta shop, curse picker, loadout menu,
 * run toasts, and game-over copy — mirrors `hearthUi.i18n.smoke.test.ts`.
 */
describe('economy / run UI i18n smoke', () => {
  it('resolves ShopScene keys', () => {
    const staticKeys = [
      'ui.shop.title',
      'ui.shop.gold_bank_fresh',
      'ui.shop.max',
      'ui.shop.back_to_menu',
      'ui.shop.prev',
      'ui.shop.next',
    ] as const;
    for (const key of staticKeys) assertResolves(key);
    assertResolves('ui.shop.gold_bank', { count: 0 });
    assertResolves('ui.shop.page', { current: 1, total: 1 });
    assertResolves('ui.shop.cost_gold', { cost: 1 });
  });

  it('resolves MetaShopScene shell + pagination keys', () => {
    assertResolves('ui.metaShop.title');
    assertResolves('ui.metaShop.subtitle');
    assertResolves('ui.metaShop.back');
    assertResolves('ui.metaShop.kill_credits_fresh');
    assertResolves('ui.metaShop.kill_credits', { count: 0 });
    assertResolves('ui.metaShop.requires_achievement', { title: 'x', hint: 'y' });
    assertResolves('ui.metaShop.requires_previous', { name: 'z' });
  });

  it('resolves every meta shop item name + description key', () => {
    for (const item of Object.values(META_SHOP_ITEMS)) {
      assertResolves(item.nameKey);
      assertResolves(item.descriptionKey);
    }
  });

  it('resolves CurseScene keys + curse card copy', () => {
    const keys = [
      'ui.curseScene.title',
      'ui.curseScene.subtitle',
      'ui.curseScene.back',
      'ui.curseScene.pick',
      'ui.curseScene.pick_none',
      'ui.curseScene.none_title',
      'ui.curseScene.none_desc',
    ] as const;
    for (const key of keys) assertResolves(key);
    assertResolves('ui.curseScene.gold_chip', { pct: 10 });
    for (const c of CURSES) {
      assertResolves(c.nameKey);
      assertResolves(c.descKey);
    }
  });

  it('resolves RunLifecycle victory / Post-Bell toasts', () => {
    assertResolves('ui.gameOver.keep_going_offer');
    assertResolves('ui.gameOver.post_bell_start');
    assertResolves('ui.gameOver.post_bell_sendoff');
  });

  it('resolves GameOverScene + death-reflection i18n', () => {
    const staticKeys = [
      'ui.gameOver.victory_title',
      'ui.gameOver.death_title',
      'ui.gameOver.death_title_2',
      'ui.gameOver.death_title_3',
      'ui.gameOver.death_title_4',
      'ui.gameOver.victory_sub',
      'ui.gameOver.death_sub',
      'ui.gameOver.death_sub_2',
      'ui.gameOver.death_sub_3',
      'ui.gameOver.death_sub_4',
      'ui.gameOver.stat_time',
      'ui.gameOver.stat_kills',
      'ui.gameOver.stat_level',
      'ui.gameOver.stat_bosses',
      'ui.gameOver.stat_passives',
      'ui.gameOver.stat_combo',
      'ui.gameOver.damage_by_weapon',
      'ui.gameOver.play_again',
      'ui.gameOver.upgrades',
      'ui.gameOver.menu',
      'ui.gameOver.unlock_single',
      'ui.gameOver.unlock_multi',
      'ui.gameOver.next_tip',
      'ui.gameOver.new_best',
      'ui.gameOver.seed_copy_hint',
      'ui.gameOver.no_weapon_damage',
      'ui.tips.dash',
      'ui.tips.combo',
      'ui.tips.armor',
      'ui.tips.evolve',
      'ui.tips.piper',
      'ui.tips.kite',
    ] as const;
    for (const key of staticKeys) assertResolves(key);

    assertResolves('ui.gameOver.gold_breakdown', {
      timeGold: 0,
      killGold: 0,
      bossGold: 0,
      coinGold: 0,
    });
    assertResolves('ui.gameOver.run_variant', { label: 'Test' });
    assertResolves('ui.gameOver.curse_chip', { curse: 'Heavy legs', pct: 30 });
    assertResolves('ui.gameOver.weapons_line', { count: 1, evolved: 0 });
    assertResolves('ui.gameOver.gold_title', { amount: 12 });
    assertResolves('ui.gameOver.damage_summary', { kills: 1, time: '0:10', gold: 3 });
    assertResolves('ui.gameOver.more_weapons', { count: 2 });
    assertResolves('ui.gameOver.seed_daily', { code: 'AAAAAAA' });
    assertResolves('ui.gameOver.seed_normal', { code: 'AAAAAAA' });
    assertResolves('ui.gameOver.seed_copied', { code: 'AAAAAAA' });

    const source = 'bogey';
    for (const tag of DEATH_TAGS) {
      assertResolves(`ui.gameOver.whit_headline_${tag}`, { source });
      assertResolves(`ui.gameOver.whit_tip_${tag}`);
    }
  });

  it('resolves MenuScene loadout keys (variant panel + stats strip)', () => {
    const keys = [
      'ui.loadout.subtitle',
      'ui.loadout.stats_hint',
      'ui.loadout.play',
      'ui.loadout.upgrades',
      'ui.loadout.variant_loadout',
      'ui.loadout.requirement_ready',
      'ui.loadout.requirement_locked',
      'ui.loadout.selected',
      'ui.loadout.select',
      'ui.loadout.locked',
      'ui.loadout.status_current',
      'ui.loadout.status_switch',
      'ui.loadout.status_locked',
    ] as const;
    for (const key of keys) assertResolves(key);
    assertResolves('ui.loadout.requirement_progress', {
      label: t('ui.loadout.requirement_locked'),
      current: 0,
      required: 1,
    });
    const sampleVariantName = t(VARIANTS[0]!.nameKey).toUpperCase();
    assertResolves('ui.loadout.current_loadout', { name: sampleVariantName });
    assertResolves('ui.menu.stats_short', STATS_LINE_VARS);
    assertResolves('ui.menu.stats_long', STATS_LINE_VARS);
  });
});
