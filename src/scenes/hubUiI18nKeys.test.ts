import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { t } from '../core/i18n';

const SCENES_DIR = dirname(fileURLToPath(import.meta.url));

const HUB_UI_ROOT_FILES = [
  'ActIntermissionScene.ts',
  'AlmanacScene.ts',
  'BootScene.ts',
  'CairnBoonPickerScene.ts',
  'ChronicleScene.ts',
  'CroftScene.ts',
  'CurseScene.ts',
  'DeedsScene.ts',
  'GameOverScene.ts',
  'MainMenuScene.ts',
  'MenuScene.ts',
  'MetaShopScene.ts',
  'SettingsInputScene.ts',
  'SettingsScene.ts',
  'ShopScene.ts',
  'SporranScene.ts',
  'almanacDomFocusActions.ts',
  'curseDomFocusActions.ts',
  'dailyMenuState.ts',
  'deedsDomFocusActions.ts',
  'gameOverDomFocusActions.ts',
  'gameOverFormatting.ts',
  'gameOverVariantChip.ts',
  'loadoutBadge.ts',
  'menuStatsStrip.ts',
  'metaShopDomFocusActions.ts',
  'metaShopRowState.ts',
  'settingsAssistMode.ts',
  'settingsBanterFrequency.ts',
  'settingsColorblind.ts',
  'settingsDomFocusActions.ts',
  'settingsInputDomFocusActions.ts',
  'settingsLocale.ts',
  'settingsPreviewCard.ts',
  'settingsToggle.ts',
  'shopDomFocusActions.ts',
  'sporranDomFocusActions.ts',
] as const;

const ROOT_FILES_WITH_STATIC_KEYS = HUB_UI_ROOT_FILES.filter(
  (file) => file !== 'settingsDomFocusActions.ts' && file !== 'settingsInputDomFocusActions.ts',
);

const HUB_UI_HELPER_DIRS = [
  'almanac',
  'croft',
  'game-over',
  'settings',
] as const;

const STATIC_T_KEY_PATTERN = /\bt\(\s*(['"`])([^'"`${}]+)\1/g;

function collectTypeScriptFiles(path: string): string[] {
  const status = statSync(path);
  if (status.isFile()) return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : [];
  if (!status.isDirectory()) return [];

  return readdirSync(path)
    .flatMap((entry) => collectTypeScriptFiles(join(path, entry)))
    .sort();
}

function extractStaticTranslationKeys(path: string): string[] {
  const source = readFileSync(path, 'utf8');
  const keys = new Set<string>();
  for (const match of source.matchAll(STATIC_T_KEY_PATTERN)) {
    const key = match[2];
    if (key) keys.add(key);
  }
  return [...keys].sort();
}

function assertResolvedKey(key: string, owner: string): void {
  const resolved = t(key, {
    amount: 1,
    challenge: 'Outlast 1:00',
    combo: 2,
    count: 3,
    curse: 'Heavy Legs',
    date: '2026-05-25',
    discovered: 4,
    gold: 5,
    heard: 6,
    kills: 7,
    level: 8,
    max: 9,
    missing: 10,
    multiplier: 1.5,
    name: 'Test Haggis',
    owned: 11,
    seed: 'ABC-123',
    target: 'the moor',
    time: '1:23',
    total: 12,
    variant: 'Classic Haggis',
    weapon: 'Claymore',
  });

  expect(resolved, `${owner} leaked raw i18n key ${key}`).not.toBe(key);
  expect(resolved.trim().length, `${owner} resolved ${key} to empty copy`).toBeGreaterThan(0);
}

describe('hub UI static i18n keys', () => {
  it('resolves every static t() key in hub scenes and helpers', () => {
    const files = [
      ...HUB_UI_ROOT_FILES.map((file) => join(SCENES_DIR, file)),
      ...HUB_UI_HELPER_DIRS.flatMap((dir) => collectTypeScriptFiles(join(SCENES_DIR, dir))),
    ];

    const seen = new Set<string>();
    const ownersWithKeys = new Set<string>();
    const checked: string[] = [];

    for (const file of files) {
      const owner = relative(SCENES_DIR, file).replace(/\\/g, '/');
      for (const key of extractStaticTranslationKeys(file)) {
        const checkId = `${owner}:${key}`;
        if (seen.has(checkId)) continue;
        seen.add(checkId);
        ownersWithKeys.add(owner);
        checked.push(checkId);
        assertResolvedKey(key, owner);
      }
    }

    expect([...ownersWithKeys].sort()).toEqual(expect.arrayContaining(ROOT_FILES_WITH_STATIC_KEYS));
    expect(checked.length).toBeGreaterThan(0);
  });
});
