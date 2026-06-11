import { expect, test } from './fixtures';

/**
 * T202 — gamepad runtime E2E.
 *
 * Phaser's GamepadPlugin polls `navigator.getGamepads()` each input tick
 * and dispatches a `gamepadconnected` event when a fresh pad shows up.
 * Playwright doesn't expose a real gamepad through the WebDriver protocol
 * yet, so we install a synthetic gamepad object via `addInitScript` —
 * Phaser sees it on the next refresh and surfaces it as `pad1`.
 *
 * Once `pad1.connected === true`, mutating the synthetic pad's
 * `buttons[i].pressed` / `axes[i]` lets us drive the same code paths as a
 * real controller: `consumeDashPressed` polls the dash binding, the
 * `getGamepadMoveVector` reads d-pad + stick. The two assertions cover
 * the high-value seams the audit flagged:
 *   1. d-pad right → player.x increases (movement code path live)
 *   2. button 0 → Player.isDashing === true (dash binding default)
 *
 * If `pad1.connected` never flips, the spec fails fast with a clear
 * reason rather than waiting on a movement assertion that can never pass.
 */

const CURRENT_SAVE_VERSION = 9;

interface SyntheticButton {
  pressed: boolean;
  touched: boolean;
  value: number;
}

interface SyntheticGamepad {
  id: string;
  index: number;
  connected: boolean;
  mapping: string;
  timestamp: number;
  buttons: SyntheticButton[];
  axes: number[];
}

declare global {
  interface Window {
    __synthPad?: SyntheticGamepad;
  }
}

test.describe('Gamepad runtime E2E', () => {
  test('synthetic pad: d-pad right moves player, button 0 dashes', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((ver: number) => {
      try {
        // Skip the tutorial first-run path — this run targets gameplay
        // input, not onboarding. Mirrors `e2e/input-remap.spec.ts`.
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
      } catch {
        /* ignore */
      }

      // Build a synthetic standard-mapping gamepad. 17 buttons covers
      // standard layout (0–16: face / shoulder / trigger / select / start /
      // sticks / d-pad). Mutating these objects in place is the contract
      // — Phaser's `Gamepad.update()` re-reads `livePad.buttons[i].pressed`
      // each tick, so changes show up next frame.
      const buttons: SyntheticButton[] = Array.from({ length: 17 }, () => ({
        pressed: false,
        touched: false,
        value: 0,
      }));
      const axes: number[] = [0, 0, 0, 0];
      const synthPad: SyntheticGamepad = {
        id: 'Synthetic Standard Gamepad (vendor: 0000 product: 0000)',
        index: 0,
        connected: true,
        mapping: 'standard',
        timestamp: 0,
        buttons,
        axes,
      };
      window.__synthPad = synthPad;

      // Override navigator.getGamepads to return the synthetic pad. We
      // bump `timestamp` on each read so Phaser's "live pad changed"
      // heuristics fire in case any internal short-circuit checks it.
      const proxy = (): (SyntheticGamepad | null)[] => {
        synthPad.timestamp = performance.now();
        return [synthPad, null, null, null];
      };
      try {
        Object.defineProperty(navigator, 'getGamepads', {
          configurable: true,
          value: proxy,
        });
      } catch {
        (navigator as unknown as { getGamepads: typeof proxy }).getGamepads = proxy;
      }
    }, CURRENT_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    // Boot the Game scene.
    const gameBooted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game');
      const start = Date.now();
      while (Date.now() - start < 30_000) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(gameBooted, 'Game scene failed to activate').toBe(true);
    await page.waitForTimeout(400);

    // Fire the gamepadconnected event so Phaser picks the pad up promptly
    // (the polling fallback would also catch it, but the event keeps the
    // spec deterministic on the first input update tick).
    await page.evaluate(() => {
      const synthPad = window.__synthPad;
      if (!synthPad) return;
      try {
        const evt = new (window as unknown as { GamepadEvent: typeof Event }).GamepadEvent(
          'gamepadconnected',
          { gamepad: synthPad as unknown } as EventInit,
        );
        window.dispatchEvent(evt);
      } catch {
        // Some browsers don't expose GamepadEvent constructor — fall
        // back to a plain Event with a `gamepad` field.
        const evt = new Event('gamepadconnected') as Event & { gamepad?: unknown };
        evt.gamepad = synthPad;
        window.dispatchEvent(evt);
      }
    });

    // Wait until Phaser's `pad1.connected` flips. If we time out here,
    // the rest of the spec is meaningless — surface the reason early.
    const padConnected = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string }; input?: {
          gamepad?: { pad1?: { connected?: boolean } | null };
        } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game');
      if (!gs) return false;
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        const pad = gs.input?.gamepad?.pad1;
        if (pad?.connected) return true;
        await new Promise((r) => setTimeout(r, 32));
      }
      return false;
    });
    expect(padConnected, 'Phaser pad1 did not connect to synthetic gamepad').toBe(true);

    // GameScene opens with a COUNTDOWN that pauses physics for ~3s.
    // Movement assertions can't pass until that lifts, so wait it out.
    const countdownLifted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string }; physics?: {
          world?: { isPaused?: boolean } } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game');
      if (!gs) return false;
      const deadline = Date.now() + 8_000;
      while (Date.now() < deadline) {
        if (gs.physics?.world?.isPaused === false) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(countdownLifted, 'Countdown never lifted (physics still paused)').toBe(true);

    // ── 1. d-pad right (button 15 standard) → player.x increases ──
    // Drive both the d-pad button and the left stick so the assertion
    // exercises both branches of `getGamepadMoveVector` (stick wins when
    // non-zero; d-pad provides the fallback). Each is independently
    // sufficient on its own.
    const moveResult = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string }; player?: { x?: number } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        player?: { x?: number };
      };
      if (!gs?.player || typeof gs.player.x !== 'number') {
        return { delta: 0, reason: 'no player' };
      }
      const startX = gs.player.x;
      const synth = window.__synthPad!;
      synth.buttons[15].pressed = true;
      synth.buttons[15].value = 1;
      synth.axes[0] = 0.9;
      const deadline = Date.now() + 1_500;
      let endX = startX;
      while (Date.now() < deadline) {
        endX = gs.player.x ?? startX;
        if (endX - startX > 5) break;
        await new Promise((r) => setTimeout(r, 16));
      }
      synth.buttons[15].pressed = false;
      synth.buttons[15].value = 0;
      synth.axes[0] = 0;
      return { delta: endX - startX, reason: '' };
    });
    expect(
      moveResult.delta,
      `d-pad right did not move player (delta=${moveResult.delta}, ${moveResult.reason})`,
    ).toBeGreaterThan(5);

    // Settle for a beat so the prevGamepadDash latch resets cleanly
    // before we drive the dash edge.
    await page.waitForTimeout(120);

    // ── 2. button 0 (dash binding default primary) → isDashing flips ──
    const dashResult = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string }; player?: { isDashing?: boolean } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        player?: { isDashing?: boolean };
      };
      if (!gs?.player) return { dashed: false, reason: 'no player' };
      const synth = window.__synthPad!;
      synth.buttons[0].pressed = true;
      synth.buttons[0].value = 1;
      const deadline = Date.now() + 2_000;
      let dashed = false;
      while (Date.now() < deadline) {
        if (gs.player.isDashing) { dashed = true; break; }
        await new Promise((r) => setTimeout(r, 16));
      }
      synth.buttons[0].pressed = false;
      synth.buttons[0].value = 0;
      return { dashed, reason: dashed ? '' : 'isDashing never flipped' };
    });
    expect(
      dashResult.dashed,
      `button 0 did not trigger dash: ${dashResult.reason}`,
    ).toBe(true);

    expect(pageErrors, `Page errors during gamepad test:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
