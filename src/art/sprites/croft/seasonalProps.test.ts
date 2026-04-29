import { describe, expect, it } from 'vitest';
import type * as Phaser from 'phaser';
import type { CroftLayout } from '../../../scenes/croft/CroftComposition';
import { drawSeasonalProps } from './seasonalProps';

/**
 * The drawer itself is Phaser-bound so its full output is exercised
 * by the Croft e2e smoke; here we lock the pure contract — the
 * drawer must be a no-op for null and unknown event keys so future
 * events and off-season windows never accidentally call the Phaser
 * API when none has been authored.
 */
function buildRecordingGraphics(): {
  gfx: Phaser.GameObjects.Graphics;
  calls: string[];
} {
  const calls: string[] = [];
  const handler: ProxyHandler<object> = {
    get: (_t, prop) => {
      return (...args: unknown[]) => {
        calls.push(`${String(prop)}(${args.length})`);
        return proxy;
      };
    },
  };
  const proxy = new Proxy({}, handler) as unknown as Phaser.GameObjects.Graphics;
  return { gfx: proxy, calls };
}

const emptyLayout = {} as CroftLayout;

/**
 * Minimum layout for drawer dispatch — `bracken_turn` reads
 * `layout.thistle.x/y` to position the bracken bunch; tests with
 * bare-bones layouts pass `0/0` to verify the dispatch routes.
 */
const minimalLayout = {
  thistle: { x: 0, y: 0 },
  table: { x: 0, y: 0 },
  mantelpiece: { x: 0, y: 0, w: 0, h: 0 },
} as unknown as CroftLayout;

describe('drawSeasonalProps', () => {
  it('is a no-op when eventKey is null (no props drawn off-season)', () => {
    const { gfx, calls } = buildRecordingGraphics();
    drawSeasonalProps(gfx, null, emptyLayout);
    expect(calls).toEqual([]);
  });

  it('is a no-op for unknown event keys (future events safe)', () => {
    const { gfx, calls } = buildRecordingGraphics();
    drawSeasonalProps(gfx, 'not_a_real_event', emptyLayout);
    expect(calls).toEqual([]);
  });

  it('routes to a drawer for bracken_turn — calls graphics API at least once', () => {
    const { gfx, calls } = buildRecordingGraphics();
    drawSeasonalProps(gfx, 'bracken_turn', minimalLayout);
    expect(calls.length).toBeGreaterThan(0);
  });

  it('routes to a drawer for lammas — calls graphics API at least once', () => {
    const { gfx, calls } = buildRecordingGraphics();
    drawSeasonalProps(gfx, 'lammas', minimalLayout);
    expect(calls.length).toBeGreaterThan(0);
  });

  it('routes to a drawer for imbolc — calls graphics API at least once', () => {
    const { gfx, calls } = buildRecordingGraphics();
    drawSeasonalProps(gfx, 'imbolc', minimalLayout);
    expect(calls.length).toBeGreaterThan(0);
  });

  it('routes to a drawer for hogmanay — calls graphics API at least once', () => {
    const { gfx, calls } = buildRecordingGraphics();
    // Hogmanay uses layout.hearth.x/y in addition to table — extend
    // minimal layout for this case so the drawer doesn't NPE.
    const hogmanayLayout = {
      ...minimalLayout,
      hearth: { x: 0, y: 0 },
    } as unknown as CroftLayout;
    drawSeasonalProps(gfx, 'hogmanay', hogmanayLayout);
    expect(calls.length).toBeGreaterThan(0);
  });

  it('routes to a drawer for samhain — calls graphics API at least once', () => {
    const { gfx, calls } = buildRecordingGraphics();
    drawSeasonalProps(gfx, 'samhain', minimalLayout);
    expect(calls.length).toBeGreaterThan(0);
  });

  it('routes to a drawer for beltane — calls graphics API at least once', () => {
    const { gfx, calls } = buildRecordingGraphics();
    drawSeasonalProps(gfx, 'beltane', minimalLayout);
    expect(calls.length).toBeGreaterThan(0);
  });

  it('routes to a drawer for st_andrews — calls graphics API at least once', () => {
    const { gfx, calls } = buildRecordingGraphics();
    drawSeasonalProps(gfx, 'st_andrews', minimalLayout);
    expect(calls.length).toBeGreaterThan(0);
  });

  it('every cohort event routes to a real drawer (8/8 coverage)', () => {
    // Locks the cohort feature-parity contract: every registered E1
    // seasonal event must have an authored croft-prop drawer. Future
    // cohort additions failing this test mean the croft surface
    // drifted from the cohort. Layout extended with hearth +
    // mantelpiece for events that read those slots.
    const fullLayout = {
      ...minimalLayout,
      hearth: { x: 0, y: 0 },
    } as unknown as CroftLayout;
    const events = [
      'burns_night', 'hogmanay', 'imbolc', 'beltane',
      'lammas', 'samhain', 'bracken_turn', 'st_andrews',
    ];
    for (const event of events) {
      const { gfx, calls } = buildRecordingGraphics();
      drawSeasonalProps(gfx, event, fullLayout);
      expect(calls.length, `${event} drawer did not paint`).toBeGreaterThan(0);
    }
  });
});
