import { describe, it, expect } from 'vitest';
import { isDiveOffscreen, type CameraBounds } from './isDiveOffscreen';

const cam: CameraBounds = {
  scrollX: 1000,
  scrollY: 1000,
  width: 800,
  height: 600,
  zoom: 1,
};
const W = 3000;
const H = 3000;
const MARGIN = 100;

describe('isDiveOffscreen', () => {
  it('enemy dead-centre of camera is not offscreen', () => {
    expect(isDiveOffscreen(cam.scrollX + 400, cam.scrollY + 300, cam, W, H, MARGIN)).toBe(false);
  });

  it('enemy just inside the camera + margin is not offscreen', () => {
    // Just inside the right edge including margin.
    expect(isDiveOffscreen(cam.scrollX + 800 + MARGIN - 1, cam.scrollY + 300, cam, W, H, MARGIN)).toBe(false);
  });

  it('enemy past right edge + margin is offscreen', () => {
    expect(isDiveOffscreen(cam.scrollX + 800 + MARGIN + 1, cam.scrollY + 300, cam, W, H, MARGIN)).toBe(true);
  });

  it('enemy past left edge - margin is offscreen', () => {
    expect(isDiveOffscreen(cam.scrollX - MARGIN - 1, cam.scrollY + 300, cam, W, H, MARGIN)).toBe(true);
  });

  it('enemy far past the world rect is offscreen even if camera snapped', () => {
    // Place camera weirdly far; enemy at negative absolute coords still triggers farFromWorld.
    const shifted = { ...cam, scrollX: -10000, scrollY: -10000 };
    expect(isDiveOffscreen(-200, -200, shifted, W, H, MARGIN)).toBe(true);
  });

  it('camera zoom shrinks the effective view box', () => {
    // Zoom 2 halves the visible region: viewW goes 800 → 400, so the
    // right edge of the view relative to scrollX drops from +800 to +400.
    // Enemy at +550 would be in-view at z=1 (within margin) but past
    // +400 + margin (=500) at z=2.
    const zoomed = { ...cam, zoom: 2 };
    expect(isDiveOffscreen(cam.scrollX + 550, cam.scrollY + 200, zoomed, W, H, MARGIN))
      .toBe(true);
  });

  it('zero / very-low zoom falls back to the 0.001 floor (no divide-by-zero)', () => {
    const zero = { ...cam, zoom: 0 };
    // With zoom→0.001 clamp, viewW becomes huge so the enemy at centre is safely in-view.
    expect(isDiveOffscreen(cam.scrollX + 400, cam.scrollY + 300, zero, W, H, MARGIN)).toBe(false);
  });
});
