import { describe, expect, it } from 'vitest';
import { ChestSpriteRegistry } from './ChestSpriteRegistry';

function mockSprite(x = 0, y = 0, active = true) {
  return { x, y, active } as never;
}

describe('ChestSpriteRegistry', () => {
  it('tracks and returns markers for active chests', () => {
    const r = new ChestSpriteRegistry();
    r.track(mockSprite(10, 20, true), false);
    r.track(mockSprite(30, 40, true), true);
    const markers = r.getMarkers();
    expect(markers).toEqual([
      { x: 10, y: 20, golden: false },
      { x: 30, y: 40, golden: true },
    ]);
  });

  it('prunes inactive sprites on getMarkers', () => {
    const r = new ChestSpriteRegistry();
    const alive = mockSprite(10, 10, true);
    const dead = mockSprite(20, 20, false);
    r.track(alive, false);
    r.track(dead, true);
    const markers = r.getMarkers();
    expect(markers).toHaveLength(1);
    expect(markers[0]).toEqual({ x: 10, y: 10, golden: false });
    // Second call confirms the inactive entry is gone, not re-seen.
    expect(r.getMarkers()).toHaveLength(1);
  });

  it('untrack removes a sprite by reference', () => {
    const r = new ChestSpriteRegistry();
    const a = mockSprite(1, 1, true);
    const b = mockSprite(2, 2, true);
    r.track(a, false);
    r.track(b, true);
    r.untrack(a);
    expect(r.getMarkers()).toEqual([{ x: 2, y: 2, golden: true }]);
  });

  it('reset empties the registry', () => {
    const r = new ChestSpriteRegistry();
    r.track(mockSprite(), false);
    r.track(mockSprite(), true);
    r.reset();
    expect(r.getMarkers()).toEqual([]);
  });

  it('forEachSprite visits every tracked sprite', () => {
    const r = new ChestSpriteRegistry();
    const a = mockSprite(1, 1, true);
    const b = mockSprite(2, 2, true);
    r.track(a, false);
    r.track(b, true);
    const visited: unknown[] = [];
    r.forEachSprite((s) => visited.push(s));
    expect(visited).toEqual([a, b]);
  });
});
