import { describe, it, expect, beforeEach } from 'vitest';
import { getCameraViewport, resetCameraViewportCache } from './cameraViewport';

function makeScene(opts: {
  zoom?: number;
  camWidth?: number;
  camHeight?: number;
  scaleWidth?: number;
  scaleHeight?: number;
  timeNow?: number;
} = {}) {
  const zoom = opts.zoom ?? 1;
  const camWidth = opts.camWidth ?? 800;
  const camHeight = opts.camHeight ?? 600;
  return {
    cameras: { main: { zoom, width: camWidth, height: camHeight } },
    scale: { width: opts.scaleWidth ?? camWidth, height: opts.scaleHeight ?? camHeight },
    time: { now: opts.timeNow ?? 0 },
    game: { canvas: null },
  } as unknown as Phaser.Scene;
}

describe('getCameraViewport', () => {
  beforeEach(() => {
    resetCameraViewportCache();
  });

  it('returns full viewport at zoom=1', () => {
    const vp = getCameraViewport(makeScene());
    expect(vp.x).toBeCloseTo(0, 5);
    expect(vp.y).toBeCloseTo(0, 5);
    expect(vp.width).toBeCloseTo(800, 5);
    expect(vp.height).toBeCloseTo(600, 5);
    expect(vp.zoom).toBe(1);
  });

  it('applies zoom offset and scales dimensions', () => {
    const vp = getCameraViewport(makeScene({ zoom: 2, camWidth: 800, camHeight: 600 }));
    expect(vp.width).toBeCloseTo(400, 5);
    expect(vp.height).toBeCloseTo(300, 5);
    expect(vp.x).toBeCloseTo(200, 5);
    expect(vp.y).toBeCloseTo(150, 5);
    expect(vp.zoom).toBe(2);
  });

  it('treats zoom=0 as 1 (falsy fallback)', () => {
    const vp = getCameraViewport(makeScene({ zoom: 0 }));
    expect(vp.zoom).toBe(1);
    expect(vp.width).toBeCloseTo(800, 5);
  });

  it('clamps tiny zoom to 0.001 minimum', () => {
    const vp = getCameraViewport(makeScene({ zoom: 0.0001 }));
    expect(vp.zoom).toBeCloseTo(0.001, 5);
    expect(vp.width).toBeGreaterThan(0);
  });

  it('caches result within same frame', () => {
    const scene = makeScene({ timeNow: 100 });
    const vp1 = getCameraViewport(scene);
    const vp2 = getCameraViewport(scene);
    expect(vp1).toBe(vp2);
  });

  it('invalidates cache on new frame time', () => {
    const scene1 = makeScene({ timeNow: 100 });
    const vp1 = getCameraViewport(scene1);
    const scene2 = makeScene({ timeNow: 116 });
    const vp2 = getCameraViewport(scene2);
    expect(vp1).not.toBe(vp2);
  });

  it('invalidates cache on different scene', () => {
    const s1 = makeScene({ timeNow: 100 });
    const s2 = makeScene({ timeNow: 100 });
    const vp1 = getCameraViewport(s1);
    const vp2 = getCameraViewport(s2);
    expect(vp1).not.toBe(vp2);
  });

  it('resetCameraViewportCache forces recompute', () => {
    const scene = makeScene({ timeNow: 100 });
    const vp1 = getCameraViewport(scene);
    resetCameraViewportCache();
    const vp2 = getCameraViewport(scene);
    expect(vp1).not.toBe(vp2);
  });

  it('falls back to scale dimensions when camera missing', () => {
    const scene = {
      cameras: { main: null },
      scale: { width: 1024, height: 768 },
      time: { now: 0 },
      game: { canvas: null },
    } as unknown as Phaser.Scene;
    const vp = getCameraViewport(scene);
    expect(vp.width).toBeCloseTo(1024, 5);
    expect(vp.height).toBeCloseTo(768, 5);
  });
});
