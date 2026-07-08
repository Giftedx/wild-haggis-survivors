import type { Page } from '@playwright/test';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';
import { expect, test } from './fixtures';

type SceneManagerProbe = {
  start(k: string, data?: unknown): void;
  isActive(k: string): boolean;
};

type GameWindow = {
  game?: {
    scene: SceneManagerProbe;
  };
};

async function seedEstablishedPlayer(page: Page): Promise<void> {
  await page.addInitScript((metaSaveVersion) => {
    try {
      localStorage.setItem('whs_meta_save', JSON.stringify({
        saveVersion: metaSaveVersion,
        totalKills: 5000,
        totalKillsSpent: 0,
        unlockedWeapons: [],
        unlockedUpgrades: [],
        unlockedAchievements: [
          'ach_survive_10m',
          'ach_survive_5m',
          'ach_kills_1000',
          'ach_defeat_taxman',
          'ach_first_victory',
        ],
        activeRun: null,
        hasCompletedTutorial: true,
        hasSeenDriftTutorial: true,
        hasSeenEliteAffixTip: true,
        hasSeenMoorMomentTip: true,
        hasSeenCeilidhChainTip: true,
        hasSeenStandingStonesTip: true,
        hasSeenAncestralEchoTip: true,
        moorMomentsLifetime: 0,
        runHistory: [],
        dailyChallenge: null,
        codexCulledKeys: [],
      }));
    } catch {
      /* ignore */
    }
  }, CURRENT_META_SAVE_VERSION);
}

async function bootGame(page: Page): Promise<void> {
  await page.goto('./');
  const canvas = page.locator('canvas[role="application"]');
  await expect(canvas).toBeVisible({ timeout: 60_000 });
  await canvas.click({ position: { x: 8, y: 8 } });
  await page.bringToFront();
}

async function waitForScene(page: Page, sceneKey: string, timeoutMs = 15_000): Promise<boolean> {
  return page.evaluate(
    async ({ key, timeout }) => {
      const g = (window as unknown as GameWindow).game;
      if (!g) return false;
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (g.scene.isActive(key)) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    },
    { key: sceneKey, timeout: timeoutMs },
  );
}

async function clickDomFocusButton(page: Page, focusId: string): Promise<void> {
  const clicked = await page.evaluate((id) => {
    const button = document.querySelector<HTMLButtonElement>(`button[data-focus-id="${id}"]`);
    if (!button || button.disabled) return false;
    button.click();
    return true;
  }, focusId);
  expect(clicked, `DOM focus button ${focusId} should exist and be enabled`).toBe(true);
}

function gameOverPayload() {
  return {
    mode: 'death',
    isVictory: false,
    summary: {
      timeSurvivedSec: 90,
      enemiesKilled: 50,
      bossGold: 0,
      coinGold: 0,
      bestCombo: 5,
    },
    runResult: {
      save: {},
      goldEarned: 36,
      newlyUnlockedVariants: [],
    },
    xpLevel: 5,
    bossKillCount: 0,
    ownedPassiveCount: 0,
    weaponCount: 1,
    evolvedCount: 0,
    buildSummary: '',
    variantLabel: 'Classic',
    variantKey: 'classic',
    weaponDamage: {},
  };
}

test.describe('hub return-target flow', () => {
  test('GameOver → Gold Shop back returns to Croft', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await seedEstablishedPlayer(page);
    await bootGame(page);

    const gameOverStarted = await page.evaluate(async (payload) => {
      const g = (window as unknown as GameWindow).game;
      if (!g) return false;
      g.scene.start('GameOver', payload);
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('GameOver')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    }, gameOverPayload());
    expect(gameOverStarted, 'GameOver scene failed to activate').toBe(true);

    await clickDomFocusButton(page, 'gameover-gold-shop');
    expect(await waitForScene(page, 'Shop'), 'Gold Shop did not activate from GameOver').toBe(true);

    await clickDomFocusButton(page, 'shop-back');
    expect(await waitForScene(page, 'Croft'), 'Shop back did not return to Croft').toBe(true);
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });

  test('MetaShop honors explicit Croft return targets and resets to MainMenu by default', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await seedEstablishedPlayer(page);
    await bootGame(page);

    const croftTargetStarted = await page.evaluate(async () => {
      const g = (window as unknown as GameWindow).game;
      if (!g) return false;
      g.scene.start('MetaShop', { returnTo: 'Croft' });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('MetaShop')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(croftTargetStarted, 'MetaShop scene failed to activate with Croft return').toBe(true);

    await clickDomFocusButton(page, 'meta-shop-back');
    expect(await waitForScene(page, 'Croft'), 'MetaShop back did not return to Croft').toBe(true);

    const defaultTargetStarted = await page.evaluate(async () => {
      const g = (window as unknown as GameWindow).game;
      if (!g) return false;
      g.scene.start('MetaShop');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('MetaShop')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(defaultTargetStarted, 'MetaShop scene failed to reactivate with default return').toBe(true);

    await clickDomFocusButton(page, 'meta-shop-back');
    expect(await waitForScene(page, 'MainMenu'), 'MetaShop default back did not reset to MainMenu').toBe(true);
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
