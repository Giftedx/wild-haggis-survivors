import { describe, expect, it } from 'vitest';
import {
  GRAN_CANVAS_SIZE,
  GRAN_FRAME_COUNT,
  GRAN_FRAMES,
  GRAN_TEXTURE_KEYS,
} from './gran';

/**
 * Pure data tests for the Gran drawer. The `drawGranFrame` / `bakeGranTextures`
 * functions require Phaser.Graphics and are exercised by the CroftScene e2e
 * smoke at M1 T10 — here we verify only the node-env-testable surface:
 * constants, frame-count alignment, and per-frame offset sanity.
 */
describe('Gran sprite drawer', () => {
  it('exposes a square canvas size large enough for a seated figure', () => {
    expect(GRAN_CANVAS_SIZE).toBeGreaterThanOrEqual(48);
    expect(GRAN_CANVAS_SIZE).toBeLessThanOrEqual(96);
  });

  it('authors exactly GRAN_FRAME_COUNT knitting frames', () => {
    expect(GRAN_FRAMES.length).toBe(GRAN_FRAME_COUNT);
  });

  it('exposes one texture key per frame', () => {
    expect(GRAN_TEXTURE_KEYS.length).toBe(GRAN_FRAME_COUNT);
    // Unique + all prefixed `croft_gran_`.
    expect(new Set(GRAN_TEXTURE_KEYS).size).toBe(GRAN_FRAME_COUNT);
    for (const k of GRAN_TEXTURE_KEYS) expect(k.startsWith('croft_gran_')).toBe(true);
  });

  it('keeps every per-frame offset within sprite-local bounds', () => {
    for (const f of GRAN_FRAMES) {
      for (const [name, value] of Object.entries(f)) {
        expect(Number.isFinite(value), `${name} is not finite`).toBe(true);
        expect(Math.abs(value), `${name} offset ${value} exceeds sprite bounds`).toBeLessThanOrEqual(
          GRAN_CANVAS_SIZE / 4,
        );
      }
    }
  });

  it('needles swap sides between frames (tick-tock animation)', () => {
    // First frame should have needles offset opposite to the last — knitters
    // visibly alternate. Middle frame is the rest position.
    const [f0, , f2] = GRAN_FRAMES;
    expect(Math.sign(f0.leftNeedleX)).toBe(-Math.sign(f2.leftNeedleX));
    expect(Math.sign(f0.rightNeedleX)).toBe(-Math.sign(f2.rightNeedleX));
  });

  it('middle frame is the rest position (all offsets zero or near zero)', () => {
    const rest = GRAN_FRAMES[1];
    expect(rest.leftNeedleX).toBe(0);
    expect(rest.rightNeedleX).toBe(0);
    expect(rest.woolX).toBe(0);
  });
});
