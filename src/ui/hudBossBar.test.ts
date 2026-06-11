import { describe, it, expect } from 'vitest';
import {
  bossHpBarStyle,
  BOSS_HP_MID_THRESHOLD,
  BOSS_HP_WARNING_THRESHOLD,
  BOSS_GLOW_PULSE_ALPHA_CENTER,
  BOSS_GLOW_PULSE_ALPHA_AMPLITUDE,
  BOSS_GLOW_MID_ALPHA,
  BOSS_GLOW_PULSE_RATE_RAD_PER_MS,
} from './hudBossBar';

describe('bossHpBarStyle — tier selection', () => {
  it('baseline tier at and above mid threshold (glow alpha 0)', () => {
    const s = bossHpBarStyle(1, 0);
    expect(s.fillColor).toBe(0xcc2222);
    expect(s.highlightColor).toBe(0xff6644);
    expect(s.glowAlpha).toBe(0);
  });

  it('baseline tier at exactly the mid threshold (>=)', () => {
    expect(bossHpBarStyle(BOSS_HP_MID_THRESHOLD, 0).glowAlpha).toBe(0);
  });

  it('mid tier in [warning, mid) — static glow', () => {
    const s = bossHpBarStyle(BOSS_HP_WARNING_THRESHOLD + 0.01, 0);
    expect(s.fillColor).toBe(0xdd3333);
    expect(s.highlightColor).toBe(0xff7755);
    expect(s.glowAlpha).toBe(BOSS_GLOW_MID_ALPHA);
  });

  it('mid tier at the warning threshold (not below yet)', () => {
    const s = bossHpBarStyle(BOSS_HP_WARNING_THRESHOLD, 0);
    expect(s.glowAlpha).toBe(BOSS_GLOW_MID_ALPHA);
  });

  it('warning tier below warning threshold — brightest fill + pulsing glow', () => {
    const s = bossHpBarStyle(0.1, 0);
    expect(s.fillColor).toBe(0xff2222);
    expect(s.highlightColor).toBe(0xffaa44);
    // At t=0, sin(0)=0 so alpha = CENTER.
    expect(s.glowAlpha).toBeCloseTo(BOSS_GLOW_PULSE_ALPHA_CENTER, 9);
  });

  it('warning glow alpha oscillates in [CENTER - AMP, CENTER + AMP]', () => {
    const min = BOSS_GLOW_PULSE_ALPHA_CENTER - BOSS_GLOW_PULSE_ALPHA_AMPLITUDE;
    const max = BOSS_GLOW_PULSE_ALPHA_CENTER + BOSS_GLOW_PULSE_ALPHA_AMPLITUDE;
    for (let t = 0; t < 5000; t += 73) {
      const a = bossHpBarStyle(0.1, t).glowAlpha;
      expect(a).toBeGreaterThanOrEqual(min - 1e-9);
      expect(a).toBeLessThanOrEqual(max + 1e-9);
    }
  });

  it('warning pulse period reflects BOSS_GLOW_PULSE_RATE_RAD_PER_MS', () => {
    const periodMs = (2 * Math.PI) / BOSS_GLOW_PULSE_RATE_RAD_PER_MS;
    const a0 = bossHpBarStyle(0.1, 0).glowAlpha;
    const aP = bossHpBarStyle(0.1, periodMs).glowAlpha;
    expect(aP).toBeCloseTo(a0, 6);
  });
});

describe('threshold invariants', () => {
  it('warning < mid (below warning is strictly more critical than mid)', () => {
    expect(BOSS_HP_WARNING_THRESHOLD).toBeLessThan(BOSS_HP_MID_THRESHOLD);
  });

  it('warning pulse amplitude is positive', () => {
    expect(BOSS_GLOW_PULSE_ALPHA_AMPLITUDE).toBeGreaterThan(0);
  });

  it('mid glow alpha is less than the brightest warning alpha (visible escalation peak)', () => {
    const maxWarning = BOSS_GLOW_PULSE_ALPHA_CENTER + BOSS_GLOW_PULSE_ALPHA_AMPLITUDE;
    expect(BOSS_GLOW_MID_ALPHA).toBeLessThan(maxWarning);
  });
});
