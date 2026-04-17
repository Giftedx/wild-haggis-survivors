import { describe, it, expect } from 'vitest';
import {
  resolveFpsColor,
  FPS_COLOR_GREEN,
  FPS_COLOR_AMBER,
  FPS_COLOR_RED,
  FPS_GREEN_THRESHOLD,
  FPS_AMBER_THRESHOLD,
} from './fpsColor';

describe('resolveFpsColor — 3-state traffic light', () => {
  it('returns green at or above 55 fps', () => {
    expect(resolveFpsColor(60)).toBe(FPS_COLOR_GREEN);
    expect(resolveFpsColor(FPS_GREEN_THRESHOLD)).toBe(FPS_COLOR_GREEN);
  });

  it('returns amber between 30 and 55', () => {
    expect(resolveFpsColor(45)).toBe(FPS_COLOR_AMBER);
    expect(resolveFpsColor(FPS_AMBER_THRESHOLD)).toBe(FPS_COLOR_AMBER);
    expect(resolveFpsColor(FPS_GREEN_THRESHOLD - 1)).toBe(FPS_COLOR_AMBER);
  });

  it('returns red below 30', () => {
    expect(resolveFpsColor(FPS_AMBER_THRESHOLD - 1)).toBe(FPS_COLOR_RED);
    expect(resolveFpsColor(0)).toBe(FPS_COLOR_RED);
  });

  it('all three colours are distinct', () => {
    const palette = new Set([FPS_COLOR_GREEN, FPS_COLOR_AMBER, FPS_COLOR_RED]);
    expect(palette.size).toBe(3);
  });

  it('green threshold is higher than amber (sanity: ordering matters)', () => {
    expect(FPS_GREEN_THRESHOLD).toBeGreaterThan(FPS_AMBER_THRESHOLD);
  });
});
