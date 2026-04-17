import { describe, expect, it } from 'vitest';
import { ReplayRecorder } from './ReplayRecorder';

const META = { build: 'test', seed: 42, variantKey: 'classic' };

describe('ReplayRecorder', () => {
  it('starts with zero frames; finalize returns empty blob', () => {
    const r = new ReplayRecorder(META);
    expect(r.getFrameCount()).toBe(0);
    const blob = r.finalize();
    expect(blob.frameCount).toBe(0);
    expect(blob.frames).toEqual([]);
    expect(blob.build).toBe(META.build);
    expect(blob.seed).toBe(META.seed);
    expect(blob.variantKey).toBe(META.variantKey);
  });

  it('records 3 frames in order', () => {
    const r = new ReplayRecorder(META);
    r.pushFrame({ dtMs: 16, dx: 1, dy: 0, dash: false, menu: false });
    r.pushFrame({ dtMs: 16, dx: 0, dy: 0, dash: true, menu: false });
    r.pushFrame({ dtMs: 16, dx: 0, dy: -1, dash: false, menu: true });
    expect(r.getFrameCount()).toBe(3);

    const blob = r.finalize();
    expect(blob.frameCount).toBe(3);
    expect(blob.frames[0].dx).toBe(1);
    expect(blob.frames[1].dash).toBe(true);
    expect(blob.frames[2].menu).toBe(true);
  });

  it('clamps on push (dtMs > 100, |dir| > 1)', () => {
    const r = new ReplayRecorder(META);
    r.pushFrame({ dtMs: 400, dx: 3, dy: 4, dash: false, menu: false });
    const blob = r.finalize();
    expect(blob.frames[0].dtMs).toBe(100);
    const len = Math.hypot(blob.frames[0].dx, blob.frames[0].dy);
    expect(len).toBeLessThanOrEqual(1 + 1e-6);
  });

  it('reset() clears frames but preserves metadata', () => {
    const r = new ReplayRecorder(META);
    r.pushFrame({ dtMs: 16, dx: 1, dy: 0, dash: false, menu: false });
    r.reset();
    expect(r.getFrameCount()).toBe(0);
    const blob = r.finalize();
    expect(blob.seed).toBe(META.seed);
  });

  it('finalize() returns an independent snapshot', () => {
    const r = new ReplayRecorder(META);
    r.pushFrame({ dtMs: 16, dx: 1, dy: 0, dash: false, menu: false });
    const snapshot = r.finalize();
    r.pushFrame({ dtMs: 16, dx: 0, dy: 1, dash: false, menu: false });
    expect(snapshot.frameCount).toBe(1);
    expect(snapshot.frames).toHaveLength(1);
  });
});
