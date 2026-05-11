import { expect, test } from './fixtures';

/**
 * Wee Tales — single procedural prose epitaph that closes a run.
 *
 * Drives a synthetic Game-Over flow:
 *   1. Boot into the live page so Phaser is ready + the locale tree
 *      is initialised.
 *   2. Launch GameOverScene with a payload tagged to deterministically
 *      hit the `victory.three_bosses` wee-tale template:
 *        - mode: 'victory'
 *        - bossKilledKeys: ['gordon', 'tour_bus', 'taxman']
 *        - timeSurvivedSec: 1500 (epic bucket)
 *        - runSeed: 12345 (seeded sub-RNG draws the same sample on
 *          every render; the picker biases toward the most-specific
 *          template, and `three_bosses` has 4 required tags vs the
 *          next-best `victory.epic`/`victory.taxman_kill` at 2 each)
 *   3. Walk the GameOverScene children and assert one Text object
 *      carries the expected prose substring "boss-skulls in the
 *      heather behind" (verbatim from the EN catalogue).
 *
 * Why a substring match: the full line interpolates `{time}` to
 * `25:00`, so the entire authored phrase up to the time slot is the
 * stable assertion target. The substring is uniquely associated with
 * the `victory.three_bosses` template — no other catalogue entry
 * uses it.
 */

interface PhaserGameLike {
  scene: {
    start(k: string, data?: unknown): void;
    isActive(k: string): boolean;
    getScene(k: string): unknown;
  };
}

test.describe('Wee Tales — run-end prose epitaph', () => {
  test.setTimeout(60_000);

  test('renders a closing prose line on Game Over (victory + 3 bosses)', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: 9,
          hasCompletedTutorial: true,
        }));
      } catch { /* ignore */ }
    });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();

    const overReady = await page.evaluate(async () => {
      const g = (window as unknown as { game?: PhaserGameLike }).game;
      if (!g) return false;
      const payload = {
        mode: 'victory' as const,
        isVictory: true,
        summary: {
          timeSurvivedSec: 1500,
          enemiesKilled: 1200,
          bossGold: 300,
          coinGold: 800,
          coinGoldSpent: 0,
          bestCombo: 96,
          victory: true,
        },
        runResult: {
          save: {},
          goldEarned: 1100,
          newlyUnlockedVariants: [],
        },
        xpLevel: 30,
        bossKillCount: 3,
        ownedPassiveCount: 5,
        weaponCount: 6,
        evolvedCount: 2,
        buildSummary: 'Tartan Toss / Whisky Glass / Bagpipes',
        variantLabel: 'Wild Haggis',
        variantKey: 'classic',
        weaponDamage: { tartan_toss: 24_000 },
        seedCode: 'TEST-WEE-TALE',
        runSeed: 12345,
        ironmoor: false,
        isDaily: false,
        bossKilledKeys: ['gordon', 'tour_bus', 'taxman'],
        biomesVisited: ['bog', 'loch', 'pine'],
      };
      g.scene.start('GameOver', payload);
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('GameOver')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(overReady, 'GameOver scene failed to activate').toBe(true);

    // The wee-tale text renders via a delayed fade-in (delay 520 ms,
    // duration 360 ms). Wait long enough for it to be in the
    // children list and visible.
    await page.waitForTimeout(1_400);

    // Read the GameOverScene children — look for the wee-tale Text
    // by the unique authored substring from the `victory.three_bosses`
    // template. The line ends with `{time}` interpolation which
    // resolves to `25:00` for the 1500 s payload above, so the
    // assertion target is the verbatim prefix.
    const found = await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGameLike }).game;
      if (!g) return { ok: false, line: '', taleKey: null };
      type TextLike = {
        text?: string;
        type?: string;
        getData?: (k: string) => unknown;
      };
      const over = g.scene.getScene('GameOver') as { children?: { list?: TextLike[] } } | undefined;
      const children = over?.children?.list ?? [];
      const hit = children.find((c) =>
        typeof c?.text === 'string'
        && /boss-skulls in the heather behind/i.test(c.text),
      );
      return {
        ok: Boolean(hit),
        line: hit?.text ?? '',
        taleKey: (typeof hit?.getData === 'function' ? hit.getData('weeTaleKey') : null) as
          | string
          | null
          | undefined,
      };
    });
    expect(found.ok, 'wee-tale prose line not found on GameOver').toBe(true);
    expect(found.line).toMatch(/boss-skulls in the heather behind/i);
    // Time slot interpolated — confirms the picker's params plumbed
    // through to the rendered string.
    expect(found.line).toMatch(/25:00/);
    // Tale-key data attribute set by renderGameOverWeeTale so the
    // E2E + future audits can identify exactly which template fired
    // without parsing the localised prose.
    expect(found.taleKey).toBe('ui.weeTale.victory.three_bosses');
  });

  test('renders a death-flavoured prose line for a Taxman-killed run', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: 9,
          hasCompletedTutorial: true,
        }));
      } catch { /* ignore */ }
    });
    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });

    const ready = await page.evaluate(async () => {
      const g = (window as unknown as { game?: PhaserGameLike }).game;
      if (!g) return false;
      g.scene.start('GameOver', {
        mode: 'death',
        isVictory: false,
        summary: {
          timeSurvivedSec: 1620,
          enemiesKilled: 900,
          bossGold: 250,
          coinGold: 700,
          coinGoldSpent: 0,
          bestCombo: 80,
          victory: false,
        },
        runResult: { save: {}, goldEarned: 950, newlyUnlockedVariants: [] },
        xpLevel: 27,
        bossKillCount: 2,
        ownedPassiveCount: 5,
        weaponCount: 6,
        evolvedCount: 1,
        buildSummary: 'Bagpipes / Tartan Toss',
        variantLabel: 'Wild Haggis',
        variantKey: 'classic',
        weaponDamage: { bagpipes: 16_000 },
        seedCode: 'TEST-TAX-DEATH',
        runSeed: 67890,
        ironmoor: false,
        isDaily: false,
        bossKilledKeys: ['gordon', 'tour_bus'],
        biomesVisited: ['bog', 'loch'],
        postBellSec: 120,
        deathCause: { tag: 'boss_crushed', sourceKey: 'taxman' },
      });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('GameOver')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(ready).toBe(true);
    await page.waitForTimeout(1_400);

    const tale = await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGameLike }).game;
      if (!g) return null;
      type TextLike = {
        text?: string;
        getData?: (k: string) => unknown;
      };
      const over = g.scene.getScene('GameOver') as { children?: { list?: TextLike[] } } | undefined;
      const children = over?.children?.list ?? [];
      // Find any Text object that resolved to a wee-tale key
      // (every wee-tale render stamps `weeTaleKey` via setData).
      const hit = children.find(
        (c) => typeof c?.getData === 'function' && typeof c.getData('weeTaleKey') === 'string',
      );
      return hit
        ? {
            line: hit.text ?? '',
            taleKey: hit.getData!('weeTaleKey') as string,
          }
        : null;
    });
    expect(tale, 'no wee-tale Text object found on GameOver').not.toBeNull();
    // Taxman + post-bell + epic: the picker's 4^specificity weighting
    // routes the pool toward the two taxman-flavoured templates
    // (`death.taxman` spec 2, `death.taxman_postbell` spec 3). Either
    // is a correct outcome for this context — the contract under
    // test is "the closing line was Taxman-flavoured", not
    // template-key equality, since the underlying RNG sample is a
    // function of the seed (different seeds will pick either).
    expect(tale!.taleKey).toMatch(/^ui\.weeTale\.death\.taxman/);
    expect(tale!.line).toMatch(/Taxman/);
    expect(tale!.line).toMatch(/27:00/); // 1620 sec → mm:ss interpolation
  });
});
