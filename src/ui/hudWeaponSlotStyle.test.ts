import { describe, it, expect } from 'vitest';
import {
  resolveHudWeaponSlotStyle,
  WEAPON_SLOT_EVOLVED_LABEL,
  WEAPON_SLOT_NORMAL_LABEL,
  WEAPON_SLOT_EVOLVED_STROKE,
  WEAPON_SLOT_DEFAULT_STROKE,
} from './hudWeaponSlotStyle';

describe('resolveHudWeaponSlotStyle — evolved vs normal', () => {
  it('evolved weapon always returns the warm-gold label + stroke', () => {
    const s = resolveHudWeaponSlotStyle(true, null);
    expect(s.labelColor).toBe(WEAPON_SLOT_EVOLVED_LABEL);
    expect(s.strokeColor).toBe(WEAPON_SLOT_EVOLVED_STROKE);
  });

  it('evolved palette ignores the high-contrast stroke override', () => {
    const s = resolveHudWeaponSlotStyle(true, 0x8fb4ff);
    // The HC override must not override the "I am evolved" gold signal.
    expect(s.strokeColor).toBe(WEAPON_SLOT_EVOLVED_STROKE);
  });

  it('normal weapon uses white label + default dim-grey stroke with no HC override', () => {
    const s = resolveHudWeaponSlotStyle(false, null);
    expect(s.labelColor).toBe(WEAPON_SLOT_NORMAL_LABEL);
    expect(s.strokeColor).toBe(WEAPON_SLOT_DEFAULT_STROKE);
  });

  it('normal weapon uses HC stroke override when supplied', () => {
    const hc = 0x8fb4ff;
    const s = resolveHudWeaponSlotStyle(false, hc);
    expect(s.labelColor).toBe(WEAPON_SLOT_NORMAL_LABEL);
    expect(s.strokeColor).toBe(hc);
  });

  it('evolved and normal label colours are distinct', () => {
    expect(WEAPON_SLOT_EVOLVED_LABEL).not.toBe(WEAPON_SLOT_NORMAL_LABEL);
  });

  it('undefined evolved flag reads as normal (weapon defs omit the field pre-evolution)', () => {
    const s = resolveHudWeaponSlotStyle(undefined, null);
    expect(s.labelColor).toBe(WEAPON_SLOT_NORMAL_LABEL);
    expect(s.strokeColor).toBe(WEAPON_SLOT_DEFAULT_STROKE);
  });
});
