import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from './fixtures';

/**
 * Extra UI audit coverage for states that are not reached by the primary
 * marathon screenshot sweep. Output shares ./design-verify-screens/ui-audit/.
 */

const OUT_DIR = path.resolve(process.cwd(), 'design-verify-screens', 'ui-audit');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CURRENT_META_VERSION = 9;
const CURRENT_GAMEPLAY_VERSION = 17;

interface PhaserGame {
  scene: {
    start(k: string, data?: unknown): void;
    stop(k: string): void;
    isActive(k: string): boolean;
    getScene(k: string): unknown;
    scenes: Array<{ scene: { key: string } }>;
  };
}

type PageT = Parameters<Parameters<typeof test>[1]>[0];

async function seedFullProgress(page: PageT): Promise<void> {
  await page.addInitScript(({ metaVer, gameplayVer }) => {
    try {
      const stamp = { runId: 'run:audit', timestamp: 1000 };
      const todayKey = new Date().toISOString().slice(0, 10);
      const metaBase = {
        saveVersion: metaVer,
        totalKills: 7421,
        totalKillsSpent: 2600,
        unlockedWeapons: [],
        unlockedUpgrades: [],
        activeRun: null,
        unlockedAchievements: ['ach_kills_1000', 'ach_survive_10'],
        hasCompletedTutorial: true,
        hasSeenDriftTutorial: true,
        gold: 5000,
        permanentUpgrades: {
          maxHp: 2,
          movement: 1,
          pickup: 1,
          xpRate: 1,
        },
        unlockedVariants: ['haggis', 'seilkie', 'doric_quinie', 'peerie_shetlander', 'burns_wee_beastie'],
        selectedVariant: 'haggis',
        totalRuns: 24,
        victories: 6,
        bestTime: 1492,
        bestKills: 1218,
        totalGoldEarned: 41_250,
        bestCombo: 184,
        dailyChallenge: {
          dateKey: todayKey,
          bestTimeSec: 1492,
          bestEnemiesKilled: 1218,
          attempts: 2,
          completedVictory: true,
        },
        moorMomentsLifetime: 4,
        codexCulledKeys: ['tourist', 'seagull', 'ned', 'gordon'],
      };
      localStorage.setItem('whs_meta_save', JSON.stringify(metaBase));

      const settingsRaw = localStorage.getItem('whs_game_settings');
      const settings = settingsRaw && settingsRaw.length > 0
        ? (JSON.parse(settingsRaw) as Record<string, unknown>)
        : {};
      localStorage.setItem('whs_game_settings', JSON.stringify({
        ...settings,
        photosensitivityWarningSeen: true,
      }));

      const makeFind = (timestamp: number) => ({ firstAcquiredAt: { runId: 'run:audit', timestamp }, acquireCount: 2 });
      const makeBanter = (timestamp: number) => ({ firstHeardAt: { runId: 'run:audit', timestamp }, hearCount: 3 });
      localStorage.setItem('whs_save', JSON.stringify({
        schemaVersion: gameplayVer,
        totalRuns: 24,
        victories: 6,
        totalKills: 7421,
        bestTime: 1492,
        bestKills: 1218,
        bestCombo: 184,
        gold: 5000,
        totalGoldEarned: 41_250,
        runHistory: Array.from({ length: 14 }, (_, i) => ({
          timestamp: Date.now() - i * 86_400_000,
          timeSurvivedSec: 310 + i * 83,
          enemiesKilled: 140 + i * 72,
          level: 7 + (i % 18),
          bossKills: i % 4,
          goldEarned: 90 + i * 45,
          bestCombo: 22 + i * 11,
          variantKey: i % 3 === 0 ? 'burns_wee_beastie' : i % 3 === 1 ? 'seilkie' : 'haggis',
          isVictory: i % 4 === 0,
          weaponKeys: ['tartan_toss', 'whisky_glass', 'bagpipes', 'porridge_bowl'].slice(0, 2 + (i % 3)),
          runSeed: 7000 + i * 37,
          isDaily: i % 5 === 0,
          name: i % 3 === 0 ? `Gran's Tale ${i + 1}` : undefined,
          curseKey: i % 4 === 1 ? 'thin_blood' : undefined,
          ironmoor: i % 6 === 2,
          routeKeys: i % 2 === 0 ? ['up_the_brae', 'stand_yer_ground'] : ['peat_cutter_path'],
          heldRelicKeys: i % 3 === 0 ? ['whisky_dram', 'cairn_stone'] : [],
        })),
        discoveryLog: {
          beastiesSeen: {
            tourist: { firstSeenAt: stamp, seenCount: 18, killCount: 420 },
            seagull: { firstSeenAt: stamp, seenCount: 11, killCount: 230 },
            ned: { firstSeenAt: stamp, seenCount: 8, killCount: 112 },
            gordon: { firstSeenAt: stamp, seenCount: 3, killCount: 3 },
            tour_bus: { firstSeenAt: stamp, seenCount: 2, killCount: 2 },
            taxman: { firstSeenAt: stamp, seenCount: 1, killCount: 1 },
          },
          routesVisited: {
            up_the_brae: { firstPickedAt: stamp, pickCount: 4 },
            stand_yer_ground: { firstPickedAt: stamp, pickCount: 3 },
            peat_cutter_path: { firstPickedAt: stamp, pickCount: 2 },
          },
          findsAcquired: {
            tartan_toss: makeFind(1100),
            whisky_glass: makeFind(1200),
            bagpipes: makeFind(1300),
            highland_shield: makeFind(1400),
            movement: makeFind(1500),
            pickup: makeFind(1600),
            whisky_dram: makeFind(1700),
            cairn_stone: makeFind(1800),
          },
          banterHeard: {
            'banter.first_time.relic_first_pickup.01': makeBanter(1900),
            'banter.low_hp.generic.01': makeBanter(2000),
            'banter.boss_warn.gordon.01': makeBanter(2100),
          },
          almanacVisits: 7,
        },
      }));
      (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
    } catch {
      /* ignore */
    }
  }, { metaVer: CURRENT_META_VERSION, gameplayVer: CURRENT_GAMEPLAY_VERSION });
}

async function bootCanvas(page: PageT, url = './'): Promise<void> {
  await page.goto(url);
  const canvas = page.locator('canvas[role="application"]');
  await expect(canvas).toBeVisible({ timeout: 60_000 });
  await canvas.click({ position: { x: 8, y: 8 } });
  await page.bringToFront();
  await canvas.focus();
}

async function gotoScene(page: PageT, key: string, data: unknown = {}, settleMs = 1000): Promise<void> {
  const ok = await page.evaluate(async ({ k, d }) => {
    const g = (window as unknown as { game?: PhaserGame }).game;
    if (!g) return false;
    for (const s of [
      'MainMenu', 'Menu', 'Game', 'ActIntermission', 'GameOver', 'Shop',
      'MetaShop', 'Chronicle', 'Deeds', 'Curse', 'Settings', 'SettingsInput',
      'Almanac', 'Croft', 'CombinationsPreview',
    ]) {
      try { g.scene.stop(s); } catch { /* ignore */ }
      try {
        const sc = g.scene.getScene(s) as { children?: { removeAll?: () => void }; tweens?: { killAll?: () => void } } | null;
        sc?.tweens?.killAll?.();
        sc?.children?.removeAll?.();
      } catch { /* ignore */ }
    }
    await new Promise((r) => setTimeout(r, 250));
    g.scene.start(k, d ?? {});
    const deadline = Date.now() + 12_000;
    while (Date.now() < deadline) {
      if (g.scene.isActive(k)) return true;
      await new Promise((r) => setTimeout(r, 80));
    }
    return false;
  }, { k: key, d: data });
  expect(ok, `scene ${key} failed to activate`).toBe(true);
  await page.waitForTimeout(settleMs);
}

async function loadToolScene(page: PageT, key: 'CombinationsPreview' | 'SpriteExport'): Promise<void> {
  const ok = await page.evaluate(async (toolKey) => {
    const loader = (window as unknown as {
      __WHS_LOAD_TOOL_SCENE__?: (key: string) => Promise<boolean>;
    }).__WHS_LOAD_TOOL_SCENE__;
    if (!loader) return false;
    try {
      return await loader(toolKey);
    } catch {
      return false;
    }
  }, key);
  expect(ok, `tool scene ${key} failed to lazy-register`).toBe(true);
}

async function snap(page: PageT, name: string): Promise<void> {
  const canvas = page.locator('canvas[role="application"]');
  await canvas.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
}

async function waitGameTick(page: PageT, minSec: number): Promise<void> {
  await page.evaluate(async (target) => {
    const g = (window as unknown as { game?: PhaserGame }).game;
    if (!g) return;
    const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
      spawnSystem?: { getGameTimeSec?(): number };
    } | undefined;
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const t = gs?.spawnSystem?.getGameTimeSec?.() ?? 0;
      if (t >= target) return;
      await new Promise((r) => setTimeout(r, 100));
    }
  }, minSec);
}

async function openFullRelicPrompt(page: PageT): Promise<void> {
  await waitGameTick(page, 0.3);
  const opened = await page.evaluate(() => {
    const dbg = (window as unknown as { DEBUG?: {
      openRelicDiscardPromptForAudit?(): boolean;
    } }).DEBUG;
    return dbg?.openRelicDiscardPromptForAudit?.() ?? false;
  });
  expect(opened, 'failed to open full relic prompt').toBe(true);
  await page.waitForTimeout(450);
}

function gameOverPayload(mode: 'death' | 'victory') {
  return {
    mode,
    isVictory: mode === 'victory',
    summary: {
      timeSurvivedSec: mode === 'victory' ? 1492 : 348,
      enemiesKilled: mode === 'victory' ? 1218 : 287,
      bossGold: mode === 'victory' ? 600 : 100,
      coinGold: mode === 'victory' ? 980 : 220,
      coinGoldSpent: 0,
      bestCombo: mode === 'victory' ? 184 : 47,
      victory: mode === 'victory',
    },
    runResult: {
      save: {},
      goldEarned: mode === 'victory' ? 1640 : 320,
      newlyUnlockedVariants: mode === 'victory' ? ['burns_wee_beastie'] : [],
    },
    xpLevel: mode === 'victory' ? 28 : 14,
    bossKillCount: mode === 'victory' ? 3 : 1,
    ownedPassiveCount: mode === 'victory' ? 6 : 3,
    weaponCount: mode === 'victory' ? 6 : 4,
    evolvedCount: mode === 'victory' ? 4 : 1,
    buildSummary: 'Tartan Toss / Whisky Glass / Bagpipes',
    variantLabel: mode === 'victory' ? "Burns's Wee Beastie" : 'Wild Haggis',
    variantKey: mode === 'victory' ? 'burns_wee_beastie' : 'haggis',
    weaponDamage: {
      tartan_toss: mode === 'victory' ? 142_318 : 24_817,
      whisky_glass: mode === 'victory' ? 88_412 : 12_104,
      bagpipes: mode === 'victory' ? 62_210 : 8902,
    },
    seedCode: 'GLEN-7842-MIST',
    runSeed: 7842,
    ironmoor: false,
    isDaily: false,
  };
}

async function showNodePrompt(page: PageT, name: string, title: string): Promise<void> {
  await page.evaluate(({ promptTitle }) => {
    const g = (window as unknown as { game?: PhaserGame }).game;
    const gs = g?.scene.getScene('Game') as {
      timeManager?: { request?: (key: string, opts: unknown) => void; release?: (key: string) => void };
      nodePromptUI?: { show?: (opts: unknown) => void };
    } | undefined;
    gs?.timeManager?.request?.('NODE_PROMPT_AUDIT', { pausePhysics: true, timeScale: 0 });
    gs?.nodePromptUI?.show?.({
      title: promptTitle,
      body: 'A warm light sits beside the road. Choose the bargain that keeps the herd moving.',
      options: [
        { key: 'heal', label: 'Take the oatcake blessing', subLabel: '+2 hearts' },
        { key: 'buy', label: 'Buy a very long sample trader relic name', subLabel: '120 gold' },
        { key: 'disabled', label: 'Promise a taxman nothing', subLabel: 'Needs 4 HP', disabled: true },
      ],
      allowSkip: true,
      onResolve: () => gs?.timeManager?.release?.('NODE_PROMPT_AUDIT'),
    });
  }, { promptTitle: title });
  await page.waitForTimeout(450);
  await snap(page, name);
}

test.describe('UI design audit — extra mapped states', () => {
  test.setTimeout(180_000);

  test('15 menu, settings, and input variants', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);

    await page.evaluate(({ metaVer }) => {
      const activeRun = {
        gameTimeSec: 123,
        playerX: 0,
        playerY: 0,
        playerHealth: 5,
        playerMaxHp: 5,
        currentXp: 6,
        currentLevel: 3,
        acquiredWeapons: [{ key: 'tartan_toss', level: 2, evolved: false, evolutionKey: '' }],
        selectedVariantKey: 'haggis',
        killCount: 42,
        ownedPassives: [],
        evolvedWeaponKeys: [],
        ironmoor: false,
      };
      const raw = localStorage.getItem('whs_meta_save');
      const save = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      localStorage.setItem('whs_meta_save', JSON.stringify({ ...save, saveVersion: metaVer, activeRun }));
    }, { metaVer: CURRENT_META_VERSION });
    await gotoScene(page, 'MainMenu', {}, 1300);
    await snap(page, '15a-main-menu-resume-daily-cleared');

    await gotoScene(page, 'Settings', {}, 900);
    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      const scene = g?.scene.getScene('Settings') as { promptIronmoorConfirm?: (proceed: () => void) => void } | undefined;
      scene?.promptIronmoorConfirm?.(() => {});
    });
    await page.waitForTimeout(300);
    await snap(page, '15b-settings-ironmoor-confirm');

    await gotoScene(page, 'SettingsInput', {}, 900);
    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      const scene = g?.scene.getScene('SettingsInput') as {
        beginCapture?: (action: string, slot: string, kind: string) => void;
      } | undefined;
      scene?.beginCapture?.('moveUp', 'primary', 'keyboard');
    });
    await page.waitForTimeout(500);
    await snap(page, '15c-settings-input-keyboard-capture');
  });

  test('16 paginated and expanded catalog states', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);

    await gotoScene(page, 'Shop', { page: 1 }, 900);
    await snap(page, '16a-shop-page-2');

    await gotoScene(page, 'MetaShop', {}, 900);
    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      const scene = g?.scene.getScene('MetaShop') as { page?: number; renderRows?: () => void } | undefined;
      if (scene) {
        scene.page = 1;
        scene.renderRows?.();
      }
    });
    await page.waitForTimeout(300);
    await snap(page, '16b-meta-shop-page-2');

    await gotoScene(page, 'Chronicle', {}, 1100);
    await snap(page, '16c-chronicle-populated-page-1');
    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      const scene = g?.scene.getScene('Chronicle') as {
        page?: number;
        ROWS_START_Y?: number;
        renderRunsPage?: (startY: number, width: number, uiScale: number) => void;
        scale?: { width: number };
      } | undefined;
      if (scene?.renderRunsPage && scene.scale) {
        scene.page = 1;
        scene.renderRunsPage(scene.ROWS_START_Y ?? 418, scene.scale.width, 1);
      }
    });
    await page.waitForTimeout(300);
    await snap(page, '16d-chronicle-populated-page-2');

    await gotoScene(page, 'Deeds', {}, 900);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await snap(page, '16e-deeds-page-2');

    await gotoScene(page, 'Almanac', {}, 900);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await snap(page, '16f-almanac-weys-expanded');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await snap(page, '16g-almanac-finds-expanded');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await snap(page, '16h-almanac-banter-expanded');
  });

  test('17 gameplay modal prompt states', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);
    await gotoScene(page, 'Game', {}, 1300);

    await showNodePrompt(page, '17a-node-prompt-shrine', 'A Shrine by the Road');

    await gotoScene(page, 'Game', {}, 1300);
    await showNodePrompt(page, '17b-node-prompt-trader', 'Wee Trader at the Dyke');

    await gotoScene(page, 'Game', {}, 1300);
    await openFullRelicPrompt(page);
    await snap(page, '17c-relic-full-sporran-discard');
  });

  test('18 narrow mobile overflow targets', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await seedFullProgress(page);
    await bootCanvas(page);

    await gotoScene(page, 'Settings', {}, 900);
    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      const scene = g?.scene.getScene('Settings') as { promptIronmoorConfirm?: (proceed: () => void) => void } | undefined;
      scene?.promptIronmoorConfirm?.(() => {});
    });
    await page.waitForTimeout(300);
    await snap(page, '18a-mobile-settings-ironmoor-confirm');

    await gotoScene(page, 'GameOver', gameOverPayload('victory'), 1700);
    await snap(page, '18b-mobile-game-over-victory');

    await gotoScene(page, 'Game', {}, 1300);
    await showNodePrompt(page, '18c-mobile-node-prompt', 'Wee Trader at the Dyke');

    await gotoScene(page, 'Game', {}, 1300);
    await openFullRelicPrompt(page);
    await snap(page, '18d-mobile-relic-full-sporran-discard');

    await gotoScene(page, 'Deeds', {}, 900);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await snap(page, '18e-mobile-deeds-page-2');
  });

  test('19 dev registered scenes', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page, '/?export');
    await page.waitForTimeout(1000);
    await snap(page, '19a-sprite-export-scene');

    await bootCanvas(page, '/?devScenes=1');
    await gotoScene(page, 'Game', {}, 1300);
    await page.keyboard.press('F3');
    await page.waitForTimeout(300);
    await snap(page, '19b-debug-overlay');

    await loadToolScene(page, 'CombinationsPreview');
    await gotoScene(page, 'CombinationsPreview', {}, 1000);
    await snap(page, '19c-combinations-preview');
  });
});
