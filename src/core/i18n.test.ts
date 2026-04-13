import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { t } from './i18n';
import { WEAPON_DEFS } from '../data/weapons';
import { BOSSES } from '../data/enemies';
import { VARIANTS } from '../data/variants';
import { PERMANENT_UPGRADES } from '../data/permanentUpgrades';
import { WEAPON_CARDS, PASSIVE_CARDS, STAT_CARDS } from '../data/upgrades';
import { META_SHOP_ITEMS, listMetaShopItemKeys } from '../data/metaShopItems';
import { ACHIEVEMENT_DEFS } from './BalanceConfig';

describe('i18n.t', () => {
  it('resolves nested dot paths', () => {
    expect(t('ui.menu.start_run')).toBe('START RUN');
    expect(t('ui.gameOver.victory_title')).toBe('The moor is yours!');
    expect(t('ui.settings.telemetry_opt_in')).toContain('anonymous');
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

/**
 * Regression fences — every data-file row that is player-facing must have
 * a resolvable i18n key. If a new weapon / boss / variant / upgrade is added
 * without wiring the corresponding dictionary entry, these tests fail loudly.
 */
/** Keys with both `ui.passive.hud_abbrev.*` and `ui.passive.pause_short.*` entries. */
const PASSIVE_UI_KEYS = [
  'sporran',
  'whisky_flask',
  'kilt',
  'tam_o_shanter',
  'irn_bru',
  'loch_water',
  'thistle_crown',
  'highland_shield',
  'tartan_sash',
] as const;

describe('i18n regression fences — data-file coverage', () => {
  function assertResolves(key: string, label: string): void {
    const resolved = t(key);
    expect(resolved, `${label}: ${key}`).not.toBe(key);
    expect(resolved.length, `${label}: ${key} must be non-empty`).toBeGreaterThan(0);
  }

  it('every WEAPON_DEFS entry has resolving nameKey and descriptionKey', () => {
    for (const w of Object.values(WEAPON_DEFS)) {
      assertResolves(w.nameKey, `weapon.${w.key}.name`);
      assertResolves(w.descriptionKey, `weapon.${w.key}.description`);
    }
  });

  it('every BOSS entry has a resolving nameKey and warningKey', () => {
    for (const b of BOSSES) {
      assertResolves(b.nameKey, `boss.${b.key}.name`);
      // warningKey lives under ui.bossWarning.* (already migrated earlier).
      assertResolves(b.warningKey, b.warningKey);
    }
  });

  it('every VARIANT entry has resolving nameKey and flavorKey', () => {
    for (const v of VARIANTS) {
      assertResolves(v.nameKey, `variant.${v.key}.name`);
      assertResolves(v.flavorKey, `variant.${v.key}.flavor`);
    }
  });

  it('variant modifier summary helper namespace is fully populated', () => {
    for (const k of ['speed', 'hp', 'armor', 'pickup', 'xp', 'dmg', 'drift', 'cdr', 'baseline']) {
      assertResolves(`variant.summary.${k}`, `variant.summary.${k}`);
    }
  });

  it('variant unlock helper namespace is fully populated', () => {
    for (const k of ['survive', 'best_kills', 'total_gold', 'victories', 'ready']) {
      assertResolves(`variant.unlock.${k}`, `variant.unlock.${k}`);
    }
  });

  it('every PERMANENT_UPGRADES entry has resolving nameKey and descriptionKey', () => {
    for (const u of PERMANENT_UPGRADES) {
      assertResolves(u.nameKey, `permanentUpgrade.${u.key}.name`);
      assertResolves(u.descriptionKey, `permanentUpgrade.${u.key}.description`);
    }
  });

  it('every UpgradeCard entry (WEAPON/PASSIVE/STAT) has resolving name and description keys', () => {
    for (const arr of [WEAPON_CARDS, PASSIVE_CARDS, STAT_CARDS]) {
      for (const c of arr) {
        assertResolves(c.name, `upgradeCard.${c.id}.name`);
        assertResolves(c.description, `upgradeCard.${c.id}.description`);
      }
    }
  });

  it('rarity labels are defined for all four rarities', () => {
    for (const r of ['common', 'uncommon', 'rare', 'legendary']) {
      assertResolves(`ui.common.rarity.${r}`, `ui.common.rarity.${r}`);
    }
  });

  it('HUD passive abbreviation namespace is populated for all 9 passives', () => {
    for (const k of PASSIVE_UI_KEYS) {
      assertResolves(`ui.passive.hud_abbrev.${k}`, `ui.passive.hud_abbrev.${k}`);
    }
  });

  it('pause menu passive short lines and tutorial overlay copy resolve', () => {
    for (const k of PASSIVE_UI_KEYS) {
      assertResolves(`ui.passive.pause_short.${k}`, `ui.passive.pause_short.${k}`);
    }
    assertResolves('tutorial.move', 'tutorial.move');
    assertResolves('tutorial.gem', 'tutorial.gem');
    assertResolves('tutorial.drift', 'tutorial.drift');
  });

  it('menu stats line templates exist in short and long forms', () => {
    assertResolves('ui.menu.stats_short', 'ui.menu.stats_short');
    assertResolves('ui.menu.stats_long', 'ui.menu.stats_long');
  });

  it('every meta shop item has resolving name and description keys', () => {
    for (const key of listMetaShopItemKeys()) {
      const item = META_SHOP_ITEMS[key];
      assertResolves(item.nameKey, `metaItem.${key}.name`);
      assertResolves(item.descriptionKey, `metaItem.${key}.description`);
    }
  });

  it('every achievement has resolving title and description keys', () => {
    for (const [id, def] of Object.entries(ACHIEVEMENT_DEFS)) {
      assertResolves(def.titleKey, `achievement.${id}.title`);
      assertResolves(def.descriptionKey, `achievement.${id}.description`);
    }
  });
});

/**
 * Static-analysis fence: catches partial i18n migrations in scene / UI code
 * by scanning the source tree for the deprecated literal-field access patterns
 * that Phase 4 migrated AWAY FROM. The legacy `name` / `flavorText` fields
 * still exist on data interfaces (auto-battler debug logs, analytics), but
 * they MUST NOT be read by scenes or UI files — those must go through t().
 *
 * If this test fails, someone added new code (or reverted old code) that
 * reads a player-facing data-literal field directly. Replace with t(def.<fieldKey>).
 */
describe('i18n regression fences — no legacy literal access in scenes/UI', () => {
  const ROOT = join(__dirname, '..', '..', 'src');
  const SCAN_DIRS = ['scenes', 'ui'];
  // Patterns that indicate a partial migration. Each pattern is a real
  // scenario observed in this project's history.
  const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
    {
      pattern: /\bvariant\.name\b/,
      reason: 'variant.name — use t(variant.nameKey)',
    },
    {
      pattern: /\bvariant\.flavorText\b/,
      reason: 'variant.flavorText — use t(variant.flavorKey)',
    },
    {
      pattern: /\bbossDef\.name\b/,
      reason: 'bossDef.name — use t(bossDef.nameKey)',
    },
    {
      pattern: /\bweapon\.config\.name\b/,
      reason: 'weapon.config.name — use t(weapon.config.nameKey)',
    },
    {
      pattern: /\bupgrade\.name\b/,
      reason: 'upgrade.name — use t(upgrade.nameKey)',
    },
    {
      pattern: /\bupgrade\.description\b/,
      reason: 'upgrade.description — use t(upgrade.descriptionKey)',
    },
  ];

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const s = statSync(full);
      if (s.isDirectory()) walk(full, out);
      else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) out.push(full);
    }
    return out;
  }

  const filesToScan = SCAN_DIRS
    .map((d) => join(ROOT, d))
    .flatMap((d) => walk(d));

  it('scenes/ and ui/ contain no forbidden legacy literal field accesses', () => {
    const violations: string[] = [];
    for (const file of filesToScan) {
      const text = readFileSync(file, 'utf-8');
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comments — we want to preserve the freedom to DOCUMENT these
        // patterns without breaking the test.
        if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
        for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
          if (pattern.test(line)) {
            violations.push(`${relative(ROOT, file)}:${i + 1}: ${reason}\n  ${line.trim()}`);
          }
        }
      }
    }
    expect(violations, `legacy literal field access detected:\n${violations.join('\n')}`).toEqual([]);
  });
});
