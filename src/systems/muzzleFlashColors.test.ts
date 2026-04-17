import { describe, it, expect } from 'vitest';
import {
  resolveMuzzleFlashColor,
  MUZZLE_FLASH_THISTLE,
  MUZZLE_FLASH_CABER,
  MUZZLE_FLASH_HAGGIS,
  MUZZLE_FLASH_CLAYMORE,
} from './muzzleFlashColors';

describe('resolveMuzzleFlashColor — per-weapon identity', () => {
  it('projectile returns thistle purple', () => {
    expect(resolveMuzzleFlashColor('projectile')).toBe(MUZZLE_FLASH_THISTLE);
  });

  it('piercing returns wood amber', () => {
    expect(resolveMuzzleFlashColor('piercing')).toBe(MUZZLE_FLASH_CABER);
  });

  it('bouncing returns haggis brown', () => {
    expect(resolveMuzzleFlashColor('bouncing')).toBe(MUZZLE_FLASH_HAGGIS);
  });

  it('arc_sweep returns claymore steel blue', () => {
    expect(resolveMuzzleFlashColor('arc_sweep')).toBe(MUZZLE_FLASH_CLAYMORE);
  });

  it('behaviors that render their own FX return null', () => {
    expect(resolveMuzzleFlashColor('aoe_pulse')).toBeNull();
    expect(resolveMuzzleFlashColor('trail')).toBeNull();
    expect(resolveMuzzleFlashColor('aura_pulse')).toBeNull();
  });

  it('all four flash colours are visually distinct', () => {
    const colors = new Set([
      MUZZLE_FLASH_THISTLE,
      MUZZLE_FLASH_CABER,
      MUZZLE_FLASH_HAGGIS,
      MUZZLE_FLASH_CLAYMORE,
    ]);
    expect(colors.size).toBe(4);
  });
});
