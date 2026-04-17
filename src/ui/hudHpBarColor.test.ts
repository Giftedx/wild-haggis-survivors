import { describe, it, expect } from 'vitest';
import {
  targetHpBarColor,
  packRgbColor,
  HP_BAR_GREEN,
  HP_BAR_YELLOW,
  HP_BAR_ORANGE,
  HP_BAR_RED,
  HP_BAR_GREEN_THRESHOLD,
  HP_BAR_YELLOW_THRESHOLD,
  HP_BAR_ORANGE_THRESHOLD,
} from './hudHpBarColor';

describe('targetHpBarColor', () => {
  it('returns green above 0.6', () => {
    expect(targetHpBarColor(1)).toEqual(HP_BAR_GREEN);
    expect(targetHpBarColor(0.8)).toEqual(HP_BAR_GREEN);
    expect(targetHpBarColor(0.6 + 0.001)).toEqual(HP_BAR_GREEN);
  });

  it('returns yellow at or below 0.6, above 0.35', () => {
    expect(targetHpBarColor(0.6)).toEqual(HP_BAR_YELLOW); // strict >
    expect(targetHpBarColor(0.5)).toEqual(HP_BAR_YELLOW);
    expect(targetHpBarColor(0.35 + 0.001)).toEqual(HP_BAR_YELLOW);
  });

  it('returns orange at or below 0.35, above 0.15', () => {
    expect(targetHpBarColor(0.35)).toEqual(HP_BAR_ORANGE);
    expect(targetHpBarColor(0.25)).toEqual(HP_BAR_ORANGE);
    expect(targetHpBarColor(0.15 + 0.001)).toEqual(HP_BAR_ORANGE);
  });

  it('returns red at or below 0.15, including 0 and negatives', () => {
    expect(targetHpBarColor(0.15)).toEqual(HP_BAR_RED);
    expect(targetHpBarColor(0.05)).toEqual(HP_BAR_RED);
    expect(targetHpBarColor(0)).toEqual(HP_BAR_RED);
    // Defensive: a negative fraction never arrives in prod but shouldn't crash.
    expect(targetHpBarColor(-1)).toEqual(HP_BAR_RED);
  });

  it('thresholds form a strict descending chain', () => {
    expect(HP_BAR_GREEN_THRESHOLD).toBeGreaterThan(HP_BAR_YELLOW_THRESHOLD);
    expect(HP_BAR_YELLOW_THRESHOLD).toBeGreaterThan(HP_BAR_ORANGE_THRESHOLD);
    expect(HP_BAR_ORANGE_THRESHOLD).toBeGreaterThan(0);
  });
});

describe('packRgbColor', () => {
  it('packs clean byte values into 0xRRGGBB', () => {
    expect(packRgbColor({ r: 0x44, g: 0xcc, b: 0x44 })).toBe(0x44cc44);
    expect(packRgbColor({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(packRgbColor({ r: 0xff, g: 0xff, b: 0xff })).toBe(0xffffff);
  });

  it('rounds fractional channels', () => {
    // Lerp values arrive mid-step from the scene. 0.5 rounds up (banker variants ignored here).
    expect(packRgbColor({ r: 68.4, g: 203.6, b: 67.8 })).toBe((68 << 16) | (204 << 8) | 68);
  });

  it('clamps channels above 255 to 255', () => {
    expect(packRgbColor({ r: 300, g: 400, b: 500 })).toBe(0xffffff);
  });

  it('clamps channels below 0 to 0', () => {
    expect(packRgbColor({ r: -1, g: -100, b: -50 })).toBe(0);
  });

  it('channels don\'t bleed (high R doesn\'t corrupt G/B bits)', () => {
    // r = 0xff, g = 0, b = 0 → 0xff0000. Then g = 0x10 → 0xff1000.
    expect(packRgbColor({ r: 0xff, g: 0, b: 0 })).toBe(0xff0000);
    expect(packRgbColor({ r: 0xff, g: 0x10, b: 0 })).toBe(0xff1000);
    expect(packRgbColor({ r: 0xff, g: 0x10, b: 0x01 })).toBe(0xff1001);
  });
});
