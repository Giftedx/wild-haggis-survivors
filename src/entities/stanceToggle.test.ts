import { describe, it, expect } from 'vitest';
import {
  cycleStance,
  getStanceModifiers,
  DEFAULT_STANCE,
  STANCE_ORDER,
  type Stance,
} from './stanceToggle';

describe('stanceToggle', () => {
  describe('cycle', () => {
    it('cycles loose → braced → reeling → loose', () => {
      expect(cycleStance('loose')).toBe('braced');
      expect(cycleStance('braced')).toBe('reeling');
      expect(cycleStance('reeling')).toBe('loose');
    });

    it('full cycle returns to start in 3 steps', () => {
      let s: Stance = DEFAULT_STANCE;
      s = cycleStance(s);
      s = cycleStance(s);
      s = cycleStance(s);
      expect(s).toBe(DEFAULT_STANCE);
    });

    it('falls back to start of cycle on a non-member input', () => {
      // Defensive contract — a corrupted save shouldn't strand the
      // player on an unrecognised stance.
      expect(cycleStance('unknown' as Stance)).toBe(STANCE_ORDER[0]);
    });
  });

  describe('modifiers', () => {
    it('loose is the identity stance', () => {
      const m = getStanceModifiers('loose');
      expect(m.speedMul).toBe(1.0);
      expect(m.driftMul).toBe(1.0);
    });

    it('braced is slower with halved drift', () => {
      const m = getStanceModifiers('braced');
      expect(m.speedMul).toBeLessThan(1.0);
      expect(m.driftMul).toBeLessThan(1.0);
      // Sanity bounds — feel-tuned, not exact, but a regression
      // that doubled the slowdown should fail this.
      expect(m.speedMul).toBeGreaterThan(0.6);
      expect(m.driftMul).toBeGreaterThan(0.2);
    });

    it('reeling is faster with amplified drift', () => {
      const m = getStanceModifiers('reeling');
      expect(m.speedMul).toBeGreaterThan(1.0);
      expect(m.driftMul).toBeGreaterThan(1.0);
      // Sanity bounds — runaway speed would break enemy chase
      // distance + offscreen culling.
      expect(m.speedMul).toBeLessThan(1.5);
      expect(m.driftMul).toBeLessThan(2.0);
    });

    it('braced trades speed for drift control vs reeling', () => {
      const b = getStanceModifiers('braced');
      const r = getStanceModifiers('reeling');
      // The risk/reward axis: braced is slower AND less drifty;
      // reeling is faster AND more drifty.
      expect(b.speedMul).toBeLessThan(r.speedMul);
      expect(b.driftMul).toBeLessThan(r.driftMul);
    });
  });

  describe('contract', () => {
    it('STANCE_ORDER covers the union exhaustively', () => {
      // Compile-time exhaustiveness via the switch; runtime sanity
      // that the order array isn't missing a member.
      const seen = new Set<Stance>(STANCE_ORDER);
      expect(seen.size).toBe(3);
      expect(seen.has('loose')).toBe(true);
      expect(seen.has('braced')).toBe(true);
      expect(seen.has('reeling')).toBe(true);
    });

    it('default stance is the cycle start', () => {
      expect(DEFAULT_STANCE).toBe(STANCE_ORDER[0]);
    });
  });
});
