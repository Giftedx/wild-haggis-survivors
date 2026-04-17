import { describe, it, expect } from 'vitest';
import {
  dashLabelColor,
  dashPulseScale,
  dashPulseAlpha,
  DASH_COLOR_READY,
  DASH_COLOR_READY_HC,
  DASH_COLOR_COOLING,
  DASH_COLOR_COOLING_HC,
  DASH_PULSE_SCALE_AMPLITUDE,
  DASH_PULSE_ALPHA_CENTER,
  DASH_PULSE_ALPHA_AMPLITUDE,
  DASH_PULSE_PHASE_STEP,
} from './hudDashStyle';

describe('dashLabelColor — 2x2 palette', () => {
  it('ready + normal palette', () => {
    expect(dashLabelColor(true, false)).toBe(DASH_COLOR_READY);
  });

  it('ready + high-contrast palette', () => {
    expect(dashLabelColor(true, true)).toBe(DASH_COLOR_READY_HC);
  });

  it('cooling + normal palette', () => {
    expect(dashLabelColor(false, false)).toBe(DASH_COLOR_COOLING);
  });

  it('cooling + high-contrast palette', () => {
    expect(dashLabelColor(false, true)).toBe(DASH_COLOR_COOLING_HC);
  });

  it('all four palette slots produce distinct colours', () => {
    const s = new Set([
      DASH_COLOR_READY, DASH_COLOR_READY_HC,
      DASH_COLOR_COOLING, DASH_COLOR_COOLING_HC,
    ]);
    expect(s.size).toBe(4);
  });
});

describe('dashPulseScale', () => {
  it('returns 1 when cooling — no pulse', () => {
    for (let phase = 0; phase < 5; phase += 0.3) {
      expect(dashPulseScale(false, phase)).toBe(1);
    }
  });

  it('oscillates inside [1 - A, 1 + A] when ready', () => {
    const min = 1 - DASH_PULSE_SCALE_AMPLITUDE;
    const max = 1 + DASH_PULSE_SCALE_AMPLITUDE;
    for (let phase = 0; phase < 20; phase += 0.17) {
      const s = dashPulseScale(true, phase);
      expect(s).toBeGreaterThanOrEqual(min - 1e-9);
      expect(s).toBeLessThanOrEqual(max + 1e-9);
    }
  });

  it('hits scale = 1 at phase = 0 (sin(0) = 0)', () => {
    expect(dashPulseScale(true, 0)).toBeCloseTo(1, 9);
  });
});

describe('dashPulseAlpha', () => {
  it('returns 1 when cooling — full-alpha static pip', () => {
    for (let phase = 0; phase < 5; phase += 0.3) {
      expect(dashPulseAlpha(false, phase)).toBe(1);
    }
  });

  it('oscillates inside [CENTER - A, CENTER + A] when ready', () => {
    const min = DASH_PULSE_ALPHA_CENTER - DASH_PULSE_ALPHA_AMPLITUDE;
    const max = DASH_PULSE_ALPHA_CENTER + DASH_PULSE_ALPHA_AMPLITUDE;
    for (let phase = 0; phase < 20; phase += 0.17) {
      const a = dashPulseAlpha(true, phase);
      expect(a).toBeGreaterThanOrEqual(min - 1e-9);
      expect(a).toBeLessThanOrEqual(max + 1e-9);
    }
  });

  it('hits alpha = CENTER at phase = 0', () => {
    expect(dashPulseAlpha(true, 0)).toBeCloseTo(DASH_PULSE_ALPHA_CENTER, 9);
  });

  it('cooling alpha (1) is always at least as bright as the brightest ready alpha', () => {
    const maxReadyAlpha = DASH_PULSE_ALPHA_CENTER + DASH_PULSE_ALPHA_AMPLITUDE;
    expect(1).toBeGreaterThanOrEqual(maxReadyAlpha);
  });
});

describe('tuning constants', () => {
  it('pulse phase step is positive', () => {
    expect(DASH_PULSE_PHASE_STEP).toBeGreaterThan(0);
  });

  it('amplitudes are positive', () => {
    expect(DASH_PULSE_SCALE_AMPLITUDE).toBeGreaterThan(0);
    expect(DASH_PULSE_ALPHA_AMPLITUDE).toBeGreaterThan(0);
  });
});
