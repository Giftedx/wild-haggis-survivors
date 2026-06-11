import { describe, it, expect } from 'vitest';
import {
  resolveMuzzleFlashColor,
  resolveWeaponVfxColor,
  MUZZLE_FLASH_THISTLE,
  MUZZLE_FLASH_CABER,
  MUZZLE_FLASH_HAGGIS,
  MUZZLE_FLASH_CLAYMORE,
  VFX_COLOR_BAGPIPE,
  VFX_COLOR_MIST,
  VFX_COLOR_AURA,
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

describe('resolveWeaponVfxColor — all 7 behaviors', () => {
  it('projectile returns thistle purple', () => {
    expect(resolveWeaponVfxColor('projectile')).toBe(MUZZLE_FLASH_THISTLE);
  });

  it('piercing returns wood amber', () => {
    expect(resolveWeaponVfxColor('piercing')).toBe(MUZZLE_FLASH_CABER);
  });

  it('bouncing returns haggis brown', () => {
    expect(resolveWeaponVfxColor('bouncing')).toBe(MUZZLE_FLASH_HAGGIS);
  });

  it('arc_sweep returns claymore steel blue', () => {
    expect(resolveWeaponVfxColor('arc_sweep')).toBe(MUZZLE_FLASH_CLAYMORE);
  });

  it('aoe_pulse returns highland blue', () => {
    expect(resolveWeaponVfxColor('aoe_pulse')).toBe(VFX_COLOR_BAGPIPE);
  });

  it('trail returns misty silver-blue', () => {
    expect(resolveWeaponVfxColor('trail')).toBe(VFX_COLOR_MIST);
  });

  it('aura_pulse returns forest drone green', () => {
    expect(resolveWeaponVfxColor('aura_pulse')).toBe(VFX_COLOR_AURA);
  });

  it('all 7 VFX colors are visually distinct', () => {
    const colors = new Set([
      resolveWeaponVfxColor('projectile'),
      resolveWeaponVfxColor('piercing'),
      resolveWeaponVfxColor('bouncing'),
      resolveWeaponVfxColor('arc_sweep'),
      resolveWeaponVfxColor('aoe_pulse'),
      resolveWeaponVfxColor('trail'),
      resolveWeaponVfxColor('aura_pulse'),
    ]);
    expect(colors.size).toBe(7);
  });
});
