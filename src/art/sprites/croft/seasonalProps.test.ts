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
});
