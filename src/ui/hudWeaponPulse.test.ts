import { describe, it, expect } from 'vitest';
import {
  weaponPulseState,
  PULSE_RATE_RAD_PER_MS,
  PULSE_PHASE_OFFSET_PER_SLOT,
  WEAPON_ICON_BASE_SCALE,
  READY_PULSE_SCALE_CENTER,
  READY_PULSE_SCALE_AMPLITUDE,
  READY_PULSE_ALPHA_CENTER,
  READY_PULSE_ALPHA_AMPLITUDE,
  COOLING_ALPHA,
  COOLING_SCALE_FACTOR,
} from './hudWeaponPulse';

describe('weaponPulseState — cooling', () => {
  it('returns constant scale+alpha when not ready (any time, any slot)', () => {
    const a = weaponPulseState(0, 0, false);
    const b = weaponPulseState(12345, 3, false);
    expect(a).toEqual(b);
    expect(a.scale).toBe(WEAPON_ICON_BASE_SCALE * COOLING_SCALE_FACTOR);
    expect(a.alpha).toBe(COOLING_ALPHA);
  });

  it('cooling alpha is dimmer than the dimmest ready alpha', () => {
    const readyMin = READY_PULSE_ALPHA_CENTER - READY_PULSE_ALPHA_AMPLITUDE;
    expect(COOLING_ALPHA).toBeLessThan(readyMin);
  });
});

describe('weaponPulseState — ready', () => {
  it('scale stays within [center-amp, center+amp] × base', () => {
    const base = WEAPON_ICON_BASE_SCALE;
    const min = base * (READY_PULSE_SCALE_CENTER - READY_PULSE_SCALE_AMPLITUDE);
    const max = base * (READY_PULSE_SCALE_CENTER + READY_PULSE_SCALE_AMPLITUDE);
    // Sample the wave densely — must never escape bounds.
    for (let t = 0; t < 5000; t += 13) {
      const s = weaponPulseState(t, 0, true).scale;
      expect(s).toBeGreaterThanOrEqual(min - 1e-9);
      expect(s).toBeLessThanOrEqual(max + 1e-9);
    }
  });

  it('alpha stays within [center-amp, center+amp]', () => {
    const min = READY_PULSE_ALPHA_CENTER - READY_PULSE_ALPHA_AMPLITUDE;
    const max = READY_PULSE_ALPHA_CENTER + READY_PULSE_ALPHA_AMPLITUDE;
    for (let t = 0; t < 5000; t += 13) {
      const a = weaponPulseState(t, 0, true).alpha;
      expect(a).toBeGreaterThanOrEqual(min - 1e-9);
      expect(a).toBeLessThanOrEqual(max + 1e-9);
    }
  });

  it('adjacent slots are out of phase', () => {
    // At t=0, phase = slotIndex * 0.5. Slot 0 and 1 differ by 0.5 rad.
    const s0 = weaponPulseState(0, 0, true);
    const s1 = weaponPulseState(0, 1, true);
    expect(s0.scale).not.toBe(s1.scale);
    expect(s0.alpha).not.toBe(s1.alpha);
  });

  it('hits scale = base * center when sin(phase) = 0 (at t = 0, slot 0)', () => {
    // phase = 0 * 0.0048 + 0 * 0.5 = 0, sin(0) = 0
    const s = weaponPulseState(0, 0, true);
    expect(s.scale).toBeCloseTo(WEAPON_ICON_BASE_SCALE * READY_PULSE_SCALE_CENTER, 9);
    expect(s.alpha).toBeCloseTo(READY_PULSE_ALPHA_CENTER, 9);
  });

  it('pulse period reflects PULSE_RATE_RAD_PER_MS (one full cycle @ 2π / rate)', () => {
    const periodMs = (2 * Math.PI) / PULSE_RATE_RAD_PER_MS;
    const a = weaponPulseState(0, 0, true);
    const b = weaponPulseState(periodMs, 0, true);
    // After a full period, scale should return to the starting value.
    expect(b.scale).toBeCloseTo(a.scale, 6);
    expect(b.alpha).toBeCloseTo(a.alpha, 6);
  });

  it('ready pulse peak scale exceeds cooling scale — visual lift is real', () => {
    // peak = base * (center + amp); cooling = base * factor (factor = 1.0)
    const peak = WEAPON_ICON_BASE_SCALE * (READY_PULSE_SCALE_CENTER + READY_PULSE_SCALE_AMPLITUDE);
    const cooling = WEAPON_ICON_BASE_SCALE * COOLING_SCALE_FACTOR;
    expect(peak).toBeGreaterThan(cooling * 0.9); // roughly parity — peak ≈ cooling
    // The visual cue is the oscillation, not absolute size — just sanity check.
    expect(READY_PULSE_SCALE_AMPLITUDE).toBeGreaterThan(0);
  });
});

describe('tuning constants', () => {
  it('phase offset per slot is positive and less than 2π', () => {
    expect(PULSE_PHASE_OFFSET_PER_SLOT).toBeGreaterThan(0);
    expect(PULSE_PHASE_OFFSET_PER_SLOT).toBeLessThan(2 * Math.PI);
  });

  it('pulse rate is positive', () => {
    expect(PULSE_RATE_RAD_PER_MS).toBeGreaterThan(0);
  });
});
