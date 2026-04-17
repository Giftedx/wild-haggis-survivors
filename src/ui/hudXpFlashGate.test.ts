import { describe, it, expect } from 'vitest';
import {
  shouldTriggerXpLevelUpFlash,
  XP_FLASH_PREV_HIGH_THRESHOLD,
  XP_FLASH_CURR_LOW_THRESHOLD,
} from './hudXpFlashGate';

describe('shouldTriggerXpLevelUpFlash', () => {
  it('fires on a full-to-empty wrap-around', () => {
    // Canonical level-up: bar was near full, now near empty.
    expect(shouldTriggerXpLevelUpFlash(0.95, 0.05)).toBe(true);
    expect(shouldTriggerXpLevelUpFlash(0.99, 0.01)).toBe(true);
  });

  it('does not fire when the previous frame is below the high threshold', () => {
    expect(shouldTriggerXpLevelUpFlash(0.8, 0.1)).toBe(false); // strict >
    expect(shouldTriggerXpLevelUpFlash(0.5, 0.05)).toBe(false);
  });

  it('does not fire when the current frame is at or above the low threshold', () => {
    expect(shouldTriggerXpLevelUpFlash(0.95, 0.2)).toBe(false); // strict <
    expect(shouldTriggerXpLevelUpFlash(0.95, 0.5)).toBe(false);
  });

  it('does not fire on a gentle XP spend (reroll, partial level)', () => {
    // Bar was 0.9 → 0.7 (reroll cost) — still above the low threshold.
    expect(shouldTriggerXpLevelUpFlash(0.9, 0.7)).toBe(false);
    // Or 0.85 → 0.3 — still above the 0.2 gate.
    expect(shouldTriggerXpLevelUpFlash(0.85, 0.3)).toBe(false);
  });

  it('does not fire on a fresh run (both fractions at 0)', () => {
    expect(shouldTriggerXpLevelUpFlash(0, 0)).toBe(false);
  });

  it('does not fire on a climbing bar (prev < curr)', () => {
    expect(shouldTriggerXpLevelUpFlash(0.5, 0.8)).toBe(false);
  });

  it('thresholds leave a safe gap between high and low', () => {
    // If these ever overlap (high <= low), the gate would never fire.
    expect(XP_FLASH_PREV_HIGH_THRESHOLD).toBeGreaterThan(XP_FLASH_CURR_LOW_THRESHOLD);
  });
});
