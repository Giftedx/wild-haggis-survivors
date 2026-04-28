import path from 'node:path';
import { expect, test } from './fixtures';

/**
 * UI design audit harness — screenshots EVERY player-facing surface so a
 * reviewer can scan layout/overflow/legibility/contrast issues in one pass.
 * Output → ./design-verify-screens/ui-audit/.
 *
 * Numbered file naming so review order is obvious. Each test is independent
 * and seeds its own state — failure of one doesn't poison the rest.
 */

const OUT_DIR = path.resolve(process.cwd(), 'design-verify-screens', 'ui-audit');
const CURRENT_META_VERSION = 13;
const CURRENT_GAMEPLAY_VERSION = 8;

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

/**
 * Standard pre-boot init — skips tutorial, marks photosensitivity warning seen,
 * stocks gold for shop/meta-shop renders, seeds discovery log + variant unlocks
 * so codex/almanac/croft surfaces aren't all silhouettes.
 */
async function seedFullProgress(page: PageT): Promise<void> {
  await page.addInitScript(({ metaVer, gameplayVer }) => {
    try {
      localStorage.setItem('whs_meta_save', JSON.stringify({
        saveVersion: metaVer,
        hasCompletedTutorial: true,
        gold: 5000,
        permanentUpgrades: {
          maxHp: 2,
          movement: 1,
          pickup: 1,
          xpRate: 1,
        },
        unlockedVariants: ['haggis', 'seilkie', 'doric_quinie', 'peerie_shetlander', 'burns_wee_beastie'],
        selectedVariant: 'haggis',
        totalRuns: 12,
        victories: 3,
        bestTime: 1432,
        bestKills: 894,
        totalKills: 7421,
        totalGoldEarned: 25_410,
        bestCombo: 142,
      }));
      const settingsRaw = localStorage.getItem('whs_game_settings');
      const settings = settingsRaw && settingsRaw.length > 0
        ? (JSON.parse(settingsRaw) as Record<string, unknown>)
        : {};
      localStorage.setItem('whs_game_settings', JSON.stringify({
        ...settings,
        photosensitivityWarningSeen: true,
      }));
      // Discovery log seeded so almanac shows real entries, not silhouettes.
      // Lifetime stats seeded so Chronicle reads non-zero numbers (P2.1 —
      // ChronicleScene pulls totalRuns / victories / totalKills from
      // whs_save, not whs_meta_save).
      localStorage.setItem('whs_save', JSON.stringify({
        schemaVersion: gameplayVer,
        totalRuns: 12,
        victories: 3,
        totalKills: 7421,
        bestTime: 1432,
        bestKills: 894,
        bestCombo: 142,
        gold: 5000,
        totalGoldEarned: 25_410,
        discoveryLog: {
          beastiesSeen: {
            tourist: { firstSeenAt: { runId: 'run:test', timestamp: 1000 }, seenCount: 14, killCount: 312 },
            seagull: { firstSeenAt: { runId: 'run:test', timestamp: 1100 }, seenCount: 9, killCount: 188 },
            ned: { firstSeenAt: { runId: 'run:test', timestamp: 1200 }, seenCount: 7, killCount: 96 },
            gordon: { firstSeenAt: { runId: 'run:test', timestamp: 2000 }, seenCount: 3, killCount: 3 },
            tour_bus: { firstSeenAt: { runId: 'run:test', timestamp: 2100 }, seenCount: 2, killCount: 2 },
            taxman: { firstSeenAt: { runId: 'run:test', timestamp: 2200 }, seenCount: 1, killCount: 1 },
          },
          routesVisited: {
            up_the_brae: { firstSeenAt: { runId: 'run:test', timestamp: 1500 }, count: 4 },
            stand_yer_ground: { firstSeenAt: { runId: 'run:test', timestamp: 1600 }, count: 3 },
          },
          findsAcquired: {},
          banterHeard: {},
          almanacVisits: 5,
        },
      }));
      // AUTO_BATTLE keeps level-up modal from blocking timer ticks during
      // gameplay screenshots; the level-up test toggles this off explicitly.
      (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
    } catch {
      /* ignore */
    }
  }, { metaVer: CURRENT_META_VERSION, gameplayVer: CURRENT_GAMEPLAY_VERSION });
}

async function bootCanvas(page: PageT): Promise<void> {
  await page.goto('/');
  const canvas = page.locator('canvas[role="application"]');
  await expect(canvas).toBeVisible({ timeout: 60_000 });
  await canvas.click({ position: { x: 8, y: 8 } });
  await page.bringToFront();
  await canvas.focus();
}

async function gotoScene(page: PageT, key: string, data: unknown = {}, settleMs = 1200): Promise<void> {
  const ok = await page.evaluate(async ({ k, d }) => {
    const g = (window as unknown as { game?: PhaserGame }).game;
    if (!g) return false;
    for (const s of ['MainMenu', 'Menu', 'Game', 'ActIntermission', 'GameOver',
                     'Shop', 'MetaShop', 'Chronicle', 'Deeds', 'Curse', 'Settings',
                     'SettingsInput', 'Almanac', 'Croft']) {
      try { g.scene.stop(s); } catch { /* ignore */ }
      // Phaser scene.stop fires shutdown but doesn't destroy display
      // objects synchronously. Force children clear so the next scene's
      // first render frame doesn't show prior-scene titles/mascots
      // (audit 08a "double title" artifact).
      try {
        const sc = g.scene.getScene(s) as unknown as {
          children?: { removeAll?: () => void };
          tweens?: { killAll?: () => void };
        } | null;
        if (sc?.tweens?.killAll) sc.tweens.killAll();
        if (sc?.children?.removeAll) sc.children.removeAll();
      } catch { /* ignore */ }
    }
    // Settle a couple of rAF frames for any residual destroy() callbacks.
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

async function snap(page: PageT, name: string): Promise<void> {
  const canvas = page.locator('canvas[role="application"]');
  await canvas.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
}

/** Pump game time forward + tick a few rAF frames so HUD/state settle. */
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

async function ensureLiveGame(page: PageT, seed: number, settleMs = 1200): Promise<void> {
  const live = await page.evaluate(() => {
    const g = (window as unknown as { game?: PhaserGame }).game;
    if (!g) return false;
    const gameActive = g.scene.isActive('Game');
    const gameOverActive = g.scene.isActive('GameOver');
    const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
      player?: { active?: boolean; getHp?(): number };
    } | undefined;
    return gameActive
      && !gameOverActive
      && gs?.player?.active !== false
      && (gs?.player?.getHp?.() ?? 1) > 0;
  });
  if (live) return;
  await gotoScene(page, 'Game', { seed }, settleMs);
  await waitGameTick(page, 5);
}

test.describe('UI design audit — full screenshot sweep', () => {
  test.setTimeout(180_000);

  // ---------------------------------------------------------------------------
  // 01 — Boot splash sequence
  // ---------------------------------------------------------------------------
  test('01 boot splash sequence', async ({ page }) => {
    await page.addInitScript((ver) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
      } catch { /* ignore */ }
    }, CURRENT_META_VERSION);
    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    const start = Date.now();
    for (const t of [
      { name: '01a-boot-early', atMs: 800 },
      { name: '01b-boot-peak', atMs: 1400 },
      { name: '01c-boot-held', atMs: 1900 },
    ]) {
      const wait = Math.max(0, t.atMs - (Date.now() - start));
      if (wait > 0) await page.waitForTimeout(wait);
      await canvas.screenshot({ path: path.join(OUT_DIR, `${t.name}.png`) });
    }
  });

  // ---------------------------------------------------------------------------
  // 02 — Photosensitivity warning splash (first-run, separate from main flow)
  // ---------------------------------------------------------------------------
  test('02 photosensitivity warning splash', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: 13,
          hasCompletedTutorial: true,
        }));
        localStorage.removeItem('whs_game_settings');
      } catch { /* ignore */ }
    });
    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    // Wait past boot dawn paint (~2.8s) so splash is mounted.
    await page.waitForTimeout(3500);
    await canvas.screenshot({ path: path.join(OUT_DIR, '02-photosensitivity-splash.png') });
  });

  // ---------------------------------------------------------------------------
  // 03 — Top-level menu/scene sweep
  // ---------------------------------------------------------------------------
  test('03 top-level menu sweep', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);
    await page.waitForTimeout(1000);

    await gotoScene(page, 'MainMenu', {}, 1500);
    await snap(page, '03a-main-menu');

    await gotoScene(page, 'Menu', {}, 1500);
    await snap(page, '03b-loadout-menu');

    await gotoScene(page, 'Settings', {}, 1200);
    await snap(page, '03c-settings');

    await gotoScene(page, 'SettingsInput', {}, 1200);
    await snap(page, '03d-settings-input-remap');

    await gotoScene(page, 'MetaShop', {}, 1200);
    await snap(page, '03e-meta-shop');

    await gotoScene(page, 'Shop', {}, 1200);
    await snap(page, '03f-shop');

    await gotoScene(page, 'Chronicle', {}, 1500);
    await snap(page, '03g-chronicle');

    await gotoScene(page, 'Deeds', {}, 1500);
    await snap(page, '03h-deeds');

    await gotoScene(page, 'Curse', {}, 1500);
    await snap(page, '03i-curse-picker');

    await gotoScene(page, 'Croft', {}, 1500);
    await snap(page, '03j-croft');
  });

  // ---------------------------------------------------------------------------
  // 04 — Almanac (cycle every tab)
  // ---------------------------------------------------------------------------
  test('04 almanac all tabs', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);
    await page.waitForTimeout(1000);
    await gotoScene(page, 'Almanac', {}, 1500);
    await snap(page, '04a-almanac-default');

    // ALMANAC_TAB_KEYS export: ['beasties','weys','finds','banter'].
    const tabs = ['weys', 'finds', 'banter'];

    let i = 0;
    for (const tabKey of tabs) {
      i += 1;
      const switched = await page.evaluate((k) => {
        const g = (window as unknown as { game?: PhaserGame }).game;
        if (!g) return false;
        const scene = g.scene.getScene('Almanac') as unknown as {
          activeTab: string;
          renderActiveBook?(w: number, h: number, s: number): void;
          renderTabBar?(w: number, s: number): void;
          scale: { width: number; height: number };
        };
        scene.activeTab = k;
        scene.renderTabBar?.(scene.scale.width, 1);
        scene.renderActiveBook?.(scene.scale.width, scene.scale.height, 1);
        return true;
      }, tabKey);
      if (!switched) continue;
      await page.waitForTimeout(800);
      await snap(page, `04b-almanac-tab-${String(i).padStart(2, '0')}-${tabKey}`);
    }

    // Expand a beasties entry to capture detail panel.
    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      if (!g) return;
      const scene = g.scene.getScene('Almanac') as unknown as {
        activeTab: string;
        expandStates: Record<string, { expandedKey: string | null }>;
        renderActiveBook?(w: number, h: number, s: number): void;
        scale: { width: number; height: number };
      };
      scene.activeTab = 'beasties';
      scene.expandStates.beasties = { expandedKey: 'tourist' };
      scene.renderActiveBook?.(scene.scale.width, scene.scale.height, 1);
    });
    await page.waitForTimeout(600);
    await snap(page, '04c-almanac-entry-expanded');
  });

  // ---------------------------------------------------------------------------
  // 05 — Gameplay: countdown + early + mid + late + boss
  // ---------------------------------------------------------------------------
  test('05 gameplay surfaces', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);
    await page.waitForTimeout(800);

    await gotoScene(page, 'Game', { seed: 12345 }, 200);
    // Countdown is up immediately on Game start.
    await page.waitForTimeout(400);
    await snap(page, '05a-gameplay-countdown');

    await waitGameTick(page, 5);
    await snap(page, '05b-gameplay-early-hud');

    await waitGameTick(page, 60);
    await snap(page, '05c-gameplay-1min');

    await waitGameTick(page, 180);
    await snap(page, '05d-gameplay-3min');

    // Time-travel to gordon spawn window and capture boss state.
    await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: { skipToMinute(m: number): void } }).DEBUG;
      dbg?.skipToMinute(5);
    });
    await page.waitForTimeout(2000);
    await snap(page, '05e-gameplay-boss-warning');
    await page.waitForTimeout(2500);
    await snap(page, '05f-gameplay-boss-onscreen');

    await ensureLiveGame(page, 54321);

    // Pause overlay over a live mid-run.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    await snap(page, '05g-pause-overlay');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Spawn a relic next to player → relic-pickup prompt + slot UI.
    const relicSpawned = await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      const dbg = (window as unknown as { DEBUG?: {
        spawnRelicAt?(k: string, x: number, y: number): boolean;
      } }).DEBUG;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        player?: { x: number; y: number };
      };
      const px = gs?.player?.x ?? 0;
      const py = (gs?.player?.y ?? 0) - 80; // offset slightly so prompt visible
      return dbg?.spawnRelicAt?.('sporran_of_holding', px, py) ?? false;
    });
    expect(relicSpawned, 'debug relic spawn failed').toBe(true);
    await page.waitForTimeout(900);
    await snap(page, '05h-relic-spawned-nearby');

    // Walk into it — small wait for overlap.
    await page.waitForTimeout(2500);
    await snap(page, '05i-relic-pickup-prompt');
  });

  // ---------------------------------------------------------------------------
  // 06 — Level-up upgrade card flow (disable AUTO_BATTLE so modal stays open)
  // ---------------------------------------------------------------------------
  test('06 level-up upgrade cards', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);
    await page.waitForTimeout(800);
    // Override AUTO_BATTLE off — we WANT the modal visible.
    await page.evaluate(() => {
      (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = false;
    });
    await gotoScene(page, 'Game', { seed: 99 }, 1200);
    await waitGameTick(page, 5);
    // Force a level-up directly via LevelUpFlow.
    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        levelUpFlow?: { handleLevelUp(n: number): void };
      };
      gs?.levelUpFlow?.handleLevelUp(2);
    });
    await page.waitForTimeout(900);
    await snap(page, '06a-level-up-cards');

    // Force a higher level-up to cycle different rarity colors.
    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        levelUpFlow?: { handleLevelUp(n: number): void };
      };
      gs?.levelUpFlow?.handleLevelUp(8);
    });
    await page.waitForTimeout(900);
    await snap(page, '06b-level-up-cards-mid');
  });

  // ---------------------------------------------------------------------------
  // 07 — Act intermission (route picker)
  // ---------------------------------------------------------------------------
  test('07 act intermission picker', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);
    await page.waitForTimeout(800);
    await gotoScene(page, 'Game', { seed: 7 }, 1200);
    await waitGameTick(page, 5);

    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      const gameScenePlugin = g?.scene.getScene('Game') as unknown as {
        scene: { launch(k: string, data?: unknown): void };
      } | null;
      gameScenePlugin?.scene.launch('ActIntermission', {
        slot: 'A',
        atGameTimeSec: 305,
        onResolve: () => {},
      });
    });
    await page.waitForTimeout(1500);
    await snap(page, '07a-act-intermission-slot-a');

    // Slot B has different cards.
    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      try { g?.scene.stop('ActIntermission'); } catch { /* ignore */ }
      const gameScenePlugin = g?.scene.getScene('Game') as unknown as {
        scene: { launch(k: string, data?: unknown): void };
      } | null;
      gameScenePlugin?.scene.launch('ActIntermission', {
        slot: 'B',
        atGameTimeSec: 605,
        onResolve: () => {},
      });
    });
    await page.waitForTimeout(1500);
    await snap(page, '07b-act-intermission-slot-b');
  });

  // ---------------------------------------------------------------------------
  // 08 — Game over screens (death + victory)
  // ---------------------------------------------------------------------------
  test('08 game over screens', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);
    await page.waitForTimeout(800);

    const buildPayload = (mode: 'death' | 'victory') => ({
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
    });

    await gotoScene(page, 'GameOver', buildPayload('death'), 2000);
    await snap(page, '08a-game-over-death');

    await gotoScene(page, 'GameOver', buildPayload('victory'), 2000);
    await snap(page, '08b-game-over-victory');

    // Ironmoor variant — extra banner.
    await gotoScene(page, 'GameOver', { ...buildPayload('victory'), ironmoor: true }, 2000);
    await snap(page, '08c-game-over-ironmoor-victory');
  });

  // ---------------------------------------------------------------------------
  // 09 — Mobile viewport sweep (key surfaces only — full sweep is overkill)
  // ---------------------------------------------------------------------------
  test('09 mobile viewport sweep', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await seedFullProgress(page);
    await bootCanvas(page);
    await page.waitForTimeout(1500);

    await gotoScene(page, 'MainMenu', {}, 1500);
    await snap(page, '09a-mobile-main-menu');

    await gotoScene(page, 'Menu', {}, 1500);
    await snap(page, '09b-mobile-loadout');

    await gotoScene(page, 'Settings', {}, 1200);
    await snap(page, '09c-mobile-settings');

    await gotoScene(page, 'Almanac', {}, 1500);
    await snap(page, '09d-mobile-almanac');

    await gotoScene(page, 'Croft', {}, 1500);
    await snap(page, '09e-mobile-croft');

    await gotoScene(page, 'Chronicle', {}, 1500);
    await snap(page, '09f-mobile-chronicle');

    await gotoScene(page, 'Game', { seed: 12345 }, 1200);
    await waitGameTick(page, 5);
    await snap(page, '09g-mobile-gameplay-early');

    await waitGameTick(page, 90);
    await snap(page, '09h-mobile-gameplay-mid');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    await snap(page, '09i-mobile-pause');
  });

  // ---------------------------------------------------------------------------
  // 10 — Wide viewport sweep (large monitor)
  // ---------------------------------------------------------------------------
  test('10 wide-viewport sweep', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await seedFullProgress(page);
    await bootCanvas(page);
    await page.waitForTimeout(1500);

    await gotoScene(page, 'MainMenu', {}, 1500);
    await snap(page, '10a-wide-main-menu');

    await gotoScene(page, 'Game', { seed: 12345 }, 1200);
    await waitGameTick(page, 60);
    await snap(page, '10b-wide-gameplay');
  });

  // ---------------------------------------------------------------------------
  // 11 — A11y modes: high-contrast UI + colourblind LUT + captions
  // ---------------------------------------------------------------------------
  test('11 a11y modes', async ({ page }) => {
    await seedFullProgress(page);
    // Override settings: HC on, colourblind monochrome, captions on.
    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem('whs_game_settings');
        const cur = raw && raw.length > 0
          ? (JSON.parse(raw) as Record<string, unknown>)
          : {};
        localStorage.setItem('whs_game_settings', JSON.stringify({
          ...cur,
          photosensitivityWarningSeen: true,
          highContrastUi: true,
          colorblindMode: 'monochrome',
          captionsOn: true,
        }));
      } catch { /* ignore */ }
    });
    await bootCanvas(page);
    await page.waitForTimeout(1000);

    await gotoScene(page, 'MainMenu', {}, 1500);
    await snap(page, '11a-hc-main-menu');

    await gotoScene(page, 'Settings', {}, 1500);
    await snap(page, '11b-hc-settings');

    await gotoScene(page, 'Almanac', {}, 1500);
    await snap(page, '11c-hc-almanac');

    await gotoScene(page, 'Croft', {}, 1500);
    await snap(page, '11d-hc-croft');

    await gotoScene(page, 'Game', { seed: 12345 }, 1200);
    await waitGameTick(page, 5);
    await snap(page, '11e-hc-gameplay-early');
    await waitGameTick(page, 60);
    await snap(page, '11f-hc-gameplay-1min');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    await snap(page, '11g-hc-pause');
  });

  // ---------------------------------------------------------------------------
  // 12 — Tutorial first-run (no hasCompletedTutorial flag)
  // ---------------------------------------------------------------------------
  test('12 tutorial fresh-save', async ({ page }) => {
    // Don't seed full progress — keep it raw fresh-save.
    await page.addInitScript(() => {
      try {
        // Photosensitivity ack only — leave everything else default.
        localStorage.setItem('whs_game_settings', JSON.stringify({
          photosensitivityWarningSeen: true,
        }));
        localStorage.removeItem('whs_meta_save');
        localStorage.removeItem('whs_save');
      } catch { /* ignore */ }
    });
    await bootCanvas(page);
    await page.waitForTimeout(1500);

    await gotoScene(page, 'MainMenu', {}, 1500);
    await snap(page, '12a-fresh-main-menu');

    await gotoScene(page, 'Game', { seed: 12345 }, 1200);
    await page.waitForTimeout(1500);
    await snap(page, '12b-fresh-tutorial-countdown');
    await waitGameTick(page, 5);
    await snap(page, '12c-fresh-tutorial-early');
    await waitGameTick(page, 30);
    await snap(page, '12d-fresh-tutorial-30s');
  });

  // ---------------------------------------------------------------------------
  // 13 — Daily challenge attempt screen
  // ---------------------------------------------------------------------------
  test('13 daily challenge', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);
    await page.waitForTimeout(800);

    // Launch a daily run by dispatching the same path the daily button uses.
    await gotoScene(page, 'Game', { seed: 99999, isDaily: true }, 1200);
    await page.waitForTimeout(800);
    await snap(page, '13a-daily-countdown');
    await waitGameTick(page, 5);
    await snap(page, '13b-daily-early');
  });

  // ---------------------------------------------------------------------------
  // 14 — Boss HP bar dwell (re-verify pass-1 missing-bar finding)
  // ---------------------------------------------------------------------------
  test('14 boss hp bar dwell', async ({ page }) => {
    await seedFullProgress(page);
    await bootCanvas(page);
    await page.waitForTimeout(800);

    await gotoScene(page, 'Game', { seed: 4242 }, 1200);
    await waitGameTick(page, 5);
    await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: { skipToMinute(m: number): void } }).DEBUG;
      dbg?.skipToMinute(5);
    });
    // Long dwell so the boss is fully on-screen + bar mounted.
    await page.waitForTimeout(6000);
    await snap(page, '14a-boss-hp-bar-dwell');
  });
});
