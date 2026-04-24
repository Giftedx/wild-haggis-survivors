import { describe, expect, it } from 'vitest';
import {
  HEARTH_CANVAS_SIZE,
  HEARTH_FRAME_COUNT,
  HEARTH_FRAMES,
  HEARTH_TEXTURE_KEYS,
} from './hearth';

describe('Hearth sprite drawer', () => {
  it('exposes a canvas size large enough for a full flame column', () => {
    expect(HEARTH_CANVAS_SIZE).toBeGreaterThanOrEqual(56);
    expect(HEARTH_CANVAS_SIZE).toBeLessThanOrEqual(96);
  });

  it('authors exactly HEARTH_FRAME_COUNT flicker frames', () => {
    expect(HEARTH_FRAME_COUNT).toBe(4);
    expect(HEARTH_FRAMES.length).toBe(HEARTH_FRAME_COUNT);
  });

  it('exposes one texture key per frame, uniquely prefixed', () => {
    expect(HEARTH_TEXTURE_KEYS.length).toBe(HEARTH_FRAME_COUNT);
    expect(new Set(HEARTH_TEXTURE_KEYS).size).toBe(HEARTH_FRAME_COUNT);
    for (const k of HEARTH_TEXTURE_KEYS) {
      expect(k.startsWith('croft_hearth_')).toBe(true);
    }
  });

  it('keeps every frame offset within sprite-local bounds', () => {
    for (const f of HEARTH_FRAMES) {
      expect(Math.abs(f.tipX)).toBeLessThanOrEqual(HEARTH_CANVAS_SIZE / 4);
      expect(Math.abs(f.tipY)).toBeLessThanOrEqual(HEARTH_CANVAS_SIZE / 4);
      expect(Math.abs(f.leftLickY)).toBeLessThanOrEqual(HEARTH_CANVAS_SIZE / 4);
      expect(Math.abs(f.rightLickY)).toBeLessThanOrEqual(HEARTH_CANVAS_SIZE / 4);
    }
  });

  it('ember glow sits within the 0..1 brightness range', () => {
    for (const f of HEARTH_FRAMES) {
      expect(f.emberGlow).toBeGreaterThanOrEqual(0);
      expect(f.emberGlow).toBeLessThanOrEqual(1);
    }
  });

  it('flame cycle visits a peak-bright frame (emberGlow >= 0.95) at least once', () => {
    const peak = HEARTH_FRAMES.some((f) => f.emberGlow >= 0.95);
    expect(peak, 'flicker cycle never hits a peak frame').toBe(true);
  });

  it('flame tip moves left and right across the 4-frame cycle', () => {
    const tipXs = HEARTH_FRAMES.map((f) => f.tipX);
    expect(Math.min(...tipXs)).toBeLessThan(0);
    expect(Math.max(...tipXs)).toBeGreaterThan(0);
  });
});
