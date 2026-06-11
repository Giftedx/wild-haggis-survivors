import { describe, it, expect } from 'vitest';
import {
  createDashStrikeState,
  tickDashStrike,
  resetDashStrike,
} from './dashStrikeTrigger';

describe('dashStrikeTrigger', () => {
  describe('createDashStrikeState', () => {
    it('starts at rest — no dash in progress, no cooldown debt', () => {
      const s = createDashStrikeState();
      expect(s.prevDashing).toBe(false);
      expect(s.cooldownRemainingMs).toBe(0);
    });
  });

  describe('first dash — cooldown ready', () => {
    it('fires on the rising edge of isDashing', () => {
      const s = createDashStrikeState();
      const result = tickDashStrike(s, {
        isDashing: true,
        deltaMs: 16,
        cooldownMsOnFire: 1500,
      });
      expect(result.shouldFire).toBe(true);
      expect(s.cooldownRemainingMs).toBe(1500);
      expect(s.prevDashing).toBe(true);
    });

    it('does NOT fire while dash continues — only the rising edge counts', () => {
      const s = createDashStrikeState();
      tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      // Subsequent frames during the same dash: no second fire.
      const r2 = tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      const r3 = tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      expect(r2.shouldFire).toBe(false);
      expect(r3.shouldFire).toBe(false);
    });
  });

  describe('cooldown gate', () => {
    it('swallows a fresh dash that starts before cooldown drains', () => {
      const s = createDashStrikeState();
      // Fire once.
      tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      // Dash ends.
      tickDashStrike(s, { isDashing: false, deltaMs: 100, cooldownMsOnFire: 1500 });
      // Fresh dash starts way too soon — cooldown still draining.
      const r = tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      expect(r.shouldFire).toBe(false);
      // Cooldown is NOT re-stamped on the swallowed edge — it keeps
      // ticking down toward zero from where it was.
      expect(s.cooldownRemainingMs).toBeLessThan(1500);
    });

    it('fires the next dash once cooldown has fully drained', () => {
      const s = createDashStrikeState();
      tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      tickDashStrike(s, { isDashing: false, deltaMs: 1500, cooldownMsOnFire: 1500 });
      expect(s.cooldownRemainingMs).toBe(0);

      const r = tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      expect(r.shouldFire).toBe(true);
      expect(s.cooldownRemainingMs).toBe(1500);
    });

    it('clamps cooldown at 0 — never owes negative time', () => {
      const s = createDashStrikeState();
      tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      // Massive delta blast drains cooldown past zero — the clamp
      // protects the next-dash gate from accepting a "credit" frame.
      tickDashStrike(s, { isDashing: false, deltaMs: 10000, cooldownMsOnFire: 1500 });
      expect(s.cooldownRemainingMs).toBe(0);
    });
  });

  describe('falling edge', () => {
    it('does not fire on dash end, only on dash start', () => {
      const s = createDashStrikeState();
      tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      // Dash ends — must NOT count as another fire.
      const r = tickDashStrike(s, { isDashing: false, deltaMs: 16, cooldownMsOnFire: 1500 });
      expect(r.shouldFire).toBe(false);
    });
  });

  describe('cooldownMsOnFire variation', () => {
    it('writes whatever cooldown the caller specified — Stag (1500) vs Monarch (1300)', () => {
      const s = createDashStrikeState();
      const r1 = tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      expect(r1.shouldFire).toBe(true);
      expect(s.cooldownRemainingMs).toBe(1500);

      // Drain.
      tickDashStrike(s, { isDashing: false, deltaMs: 1500, cooldownMsOnFire: 1500 });
      // Next fire with the evolved-form cooldown.
      const r2 = tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1300 });
      expect(r2.shouldFire).toBe(true);
      expect(s.cooldownRemainingMs).toBe(1300);
    });
  });

  describe('resetDashStrike', () => {
    it('zeroes cooldown + clears edge memory — a fresh first dash fires', () => {
      const s = createDashStrikeState();
      tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      // Mid-cooldown reset.
      resetDashStrike(s);
      expect(s.prevDashing).toBe(false);
      expect(s.cooldownRemainingMs).toBe(0);

      // First post-reset dash should fire — the gate is fully clear.
      const r = tickDashStrike(s, { isDashing: true, deltaMs: 16, cooldownMsOnFire: 1500 });
      expect(r.shouldFire).toBe(true);
    });
  });

  describe('replay determinism', () => {
    it('two parallel state machines under identical input emit identical fire streams', () => {
      // Mirrors the parity-test shape used by shintyParry / driftMastery
      // helpers — the contract is "same inputs → same outputs", and the
      // helper has zero hidden state, so identical input streams MUST
      // yield identical fire-edge sequences.
      const a = createDashStrikeState();
      const b = createDashStrikeState();
      const script: Array<{ isDashing: boolean; deltaMs: number; cd: number }> = [
        { isDashing: false, deltaMs: 16, cd: 1500 },
        { isDashing: true,  deltaMs: 16, cd: 1500 }, // EDGE — fire
        { isDashing: true,  deltaMs: 16, cd: 1500 },
        { isDashing: false, deltaMs: 16, cd: 1500 },
        { isDashing: false, deltaMs: 1600, cd: 1500 }, // drain past cooldown
        { isDashing: true,  deltaMs: 16, cd: 1500 }, // EDGE — fire again
        { isDashing: true,  deltaMs: 16, cd: 1500 },
        { isDashing: false, deltaMs: 200, cd: 1500 }, // cd still draining
        { isDashing: true,  deltaMs: 16, cd: 1500 }, // EDGE — swallowed
      ];
      const aFires: boolean[] = [];
      const bFires: boolean[] = [];
      for (const step of script) {
        aFires.push(tickDashStrike(a, { isDashing: step.isDashing, deltaMs: step.deltaMs, cooldownMsOnFire: step.cd }).shouldFire);
        bFires.push(tickDashStrike(b, { isDashing: step.isDashing, deltaMs: step.deltaMs, cooldownMsOnFire: step.cd }).shouldFire);
      }
      expect(aFires).toEqual(bFires);
      // And spot-check the fire count: edges at frames 1 and 5 only.
      expect(aFires.filter((f) => f).length).toBe(2);
      expect(aFires[1]).toBe(true);
      expect(aFires[5]).toBe(true);
      expect(aFires[8]).toBe(false); // swallowed by cooldown
    });
  });
});
