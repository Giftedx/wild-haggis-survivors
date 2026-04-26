import path from 'node:path';
import { expect, test } from './fixtures';

/**
 * DESIGN.md verification harness.
 *
 * Navigates every top-level scene via the Phaser SceneManager and writes
 * a PNG to ./design-verify-screens/ so tokens + prose can be cross-checked
 * against real pixels.
 *
 * Skipped: ActIntermission (requires runtime callback), CombinationsPreview
 * (dev-only), SpriteExport (dev tool).
 */

const OUT_DIR = path.resolve(process.cwd(), 'design-verify-screens');

const CURRENT_SAVE_VERSION = 9;

interface PhaserGame {
  scene: {
    start(k: string, data?: unknown): void;
    stop(k: string): void;
    isActive(k: string): boolean;
    getScene(k: string): unknown;
  };
}

async function bootAndClear(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.addInitScript((ver) => {
    try {
      localStorage.setItem('whs_meta_save', JSON.stringify({
        saveVersion: ver,
        hasCompletedTutorial: true,
        gold: 500,
        permanentUpgrades: {},
      }));
      (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
    } catch { /* ignore */ }
  }, CURRENT_SAVE_VERSION);

  await page.goto('/');
  const canvas = page.locator('canvas[role="application"]');
  await expect(canvas).toBeVisible({ timeout: 60_000 });
  await canvas.click({ position: { x: 8, y: 8 } });
  await canvas.focus();

  // Let BootScene fade its splash — 2s staggered reveal + 400ms out.
  await page.waitForTimeout(500);
}

async function gotoScene(page: Parameters<Parameters<typeof test>[1]>[0], key: string, data?: unknown, settleMs = 1200) {
  const started = await page.evaluate(async ({ k, d }) => {
    const g = (window as unknown as { game?: PhaserGame }).game;
    if (!g) return false;
    // Stop the currently-active scenes we know about so the target mounts cleanly.
    for (const s of ['MainMenu','Menu','Game','ActIntermission','GameOver','Shop','MetaShop','Chronicle','Deeds','Curse','Settings']) {
      try { g.scene.stop(s); } catch { /* ignore */ }
    }
    g.scene.start(k, d ?? {});
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      if (g.scene.isActive(k)) return true;
      await new Promise((r) => setTimeout(r, 80));
    }
    return false;
  }, { k: key, d: data });
  expect(started, `scene ${key} failed to activate`).toBe(true);
  await page.waitForTimeout(settleMs);
}

async function snap(page: Parameters<Parameters<typeof test>[1]>[0], name: string) {
  const canvas = page.locator('canvas[role="application"]');
  await canvas.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
}

function gameOverPayload() {
  return {
    mode: 'death',
    isVictory: false,
    summary: {
      timeSurvivedSec: 348,
      enemiesKilled: 287,
      bossGold: 100,
      coinGold: 220,
      coinGoldSpent: 0,
      bestCombo: 47,
      victory: false,
    },
    runResult: {
      save: {},
      goldEarned: 320,
      newlyUnlockedVariants: [],
    },
    xpLevel: 14,
    bossKillCount: 1,
    ownedPassiveCount: 3,
    weaponCount: 4,
    evolvedCount: 1,
    buildSummary: 'Tartan Toss / Whisky Glass / Bagpipes',
    variantLabel: 'Wild Haggis',
    variantKey: 'haggis',
    weaponDamage: {
      tartan_toss: 24_817,
      whisky_glass: 12_104,
      bagpipes: 8902,
    },
    seedCode: 'GLEN-7842-MIST',
    runSeed: 7842,
    ironmoor: false,
    isDaily: false,
  };
}

test.describe('DESIGN.md scene capture', () => {
  test.setTimeout(120_000);

  test('capture every top-level scene', async ({ page }) => {
    await bootAndClear(page);

    // 01 — Boot splash (after boot already transitioned; re-start briefly)
    await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGame }).game;
      if (!g) return;
      try { g.scene.start('Boot'); } catch { /* ignore */ }
    });
    await page.waitForTimeout(1400);
    await snap(page, '01-boot-splash');

    // 02 — Main menu
    await gotoScene(page, 'MainMenu', undefined, 1400);
    await snap(page, '02-main-menu');

    // 03 — Settings
    await gotoScene(page, 'Settings');
    await snap(page, '03-settings');

    // 04 — Meta shop
    await gotoScene(page, 'MetaShop');
    await snap(page, '04-meta-shop');

    // 05 — Chronicle
    await gotoScene(page, 'Chronicle');
    await snap(page, '05-chronicle');

    // 06 — Deeds
    await gotoScene(page, 'Deeds');
    await snap(page, '06-deeds');

    // 07 — Curse picker
    await gotoScene(page, 'Curse');
    await snap(page, '07-curse');

    // 08 — In-run Menu (variant/loadout)
    await gotoScene(page, 'Menu');
    await snap(page, '08-run-menu');

    // 09 — Gameplay (early moor)
    await gotoScene(page, 'Game', { seed: 12345 }, 2500);
    await snap(page, '09-gameplay-early');

    // 10 — Gameplay later (let some combat unfold)
    await page.waitForTimeout(6000);
    await snap(page, '10-gameplay-late');

    // 11 — Pause overlay
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await snap(page, '11-pause-overlay');
    await page.keyboard.press('Escape'); // resume

    // 12 — Shop (post-run)
    await gotoScene(page, 'Shop');
    await snap(page, '12-shop');

    // 13 — Game over
    await gotoScene(page, 'GameOver', gameOverPayload());
    await snap(page, '13-game-over');
  });
});
