import { describe, expect, it } from 'vitest';
import { PALETTE, PALETTE_GROUPS } from './palettes';

describe('PALETTE', () => {
  it('exposes named hex anchors grouped by family', () => {
    expect(PALETTE.peat.shadow).toBe(0x3a2818);
    expect(PALETTE.heather.bright).toBe(0xb090d0);
    expect(PALETTE.gold.aged).toBe(0xc8a040);
  });

  it('every value is a 24-bit integer (0..0xffffff)', () => {
    for (const group of Object.values(PALETTE)) {
      for (const hex of Object.values(group)) {
        expect(hex).toBeGreaterThanOrEqual(0);
        expect(hex).toBeLessThanOrEqual(0xffffff);
      }
    }
  });

  it('PALETTE_GROUPS enumerates every family name', () => {
    const keys = Object.keys(PALETTE).sort();
    expect([...PALETTE_GROUPS].sort()).toEqual(keys);
  });

  it('has no duplicate hex across the whole palette', () => {
    const all: number[] = [];
    for (const group of Object.values(PALETTE)) {
      for (const hex of Object.values(group)) all.push(hex);
    }
    expect(new Set(all).size).toBe(all.length);
  });
});
