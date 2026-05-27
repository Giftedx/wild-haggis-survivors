import { describe, it, expect } from 'vitest';
import {
  initialTaxmanGrudgeState,
  simulateTaxmanGrudgeBehaviour,
  TAXMAN_PHASE2_HP_THRESHOLD,
  TAXMAN_TRANSITION_PAUSE_MS,
  TAXMAN_PHASE2_CADENCE_MS,
  TAXMAN_PHASE2_SPEED_MUL,
} from './taxmanGrudgeBehaviour';
import type { GrudgeVerdict } from './grudgeLedger';

const tick = (
  state: ReturnType<typeof initialTaxmanGrudgeState>,
  delta: number,
  hpPct: number,
  verdict: GrudgeVerdict = 'even',
) =>
  simulateTaxmanGrudgeBehaviour(state, {
    deltaMs: delta,
    hpPct,
    resolvedVerdict: verdict,
  });

describe('simulateTaxmanGrudgeBehaviour', () => {
  describe('phase 1 — chase only', () => {
    it('no attacks while HP is above threshold', () => {
      const s = tick(initialTaxmanGrudgeState(), 16, 0.9);
      expect(s.phase).toBe(1);
      expect(s.shouldFireAttack).toBe(false);
      expect(s.shouldFireTransition).toBe(false);
      expect(s.speedMul).toBe(1.0);
      expect(s.isPaused).toBe(false);
    });

    it('stays phase 1 at exactly the threshold', () => {
      const s = tick(initialTaxmanGrudgeState(), 16, TAXMAN_PHASE2_HP_THRESHOLD + 0.001);
      expect(s.phase).toBe(1);
    });
  });

  describe('transition — HP crosses threshold', () => {
    it('fires transition flag exactly once', () => {
      const s0 = initialTaxmanGrudgeState();
      const s1 = tick(s0, 16, 0.49, 'bruiser');
      expect(s1.shouldFireTransition).toBe(true);
      expect(s1.phase).toBe('transitioning');
      expect(s1.verdict).toBe('bruiser');
      expect(s1.isPaused).toBe(true);
      expect(s1.speedMul).toBe(0);

      const s2 = tick(s1, 16, 0.49, 'bruiser');
      expect(s2.shouldFireTransition).toBe(false);
      expect(s2.isPaused).toBe(true);
    });

    it('verdict is locked at transition — later resolvedVerdict input ignored', () => {
      const s0 = initialTaxmanGrudgeState();
      const s1 = tick(s0, 16, 0.49, 'coward');
      expect(s1.verdict).toBe('coward');
      // Pass a different verdict in subsequent ticks
      const s2 = tick(s1, 16, 0.49, 'reckless');
      const s3 = tick(s2, TAXMAN_TRANSITION_PAUSE_MS + 16, 0.49, 'even');
      expect(s3.verdict).toBe('coward'); // locked at transition
    });

    it('pause counts down and then enters phase 2', () => {
      const s0 = initialTaxmanGrudgeState();
      const sT = tick(s0, 16, 0.49, 'precise');
      expect(sT.phase).toBe('transitioning');
      // Consume the full pause in one large tick
      const s2 = tick(sT, TAXMAN_TRANSITION_PAUSE_MS + 50, 0.49, 'precise');
      expect(s2.phase).toBe(2);
      expect(s2.isPaused).toBe(false);
      expect(s2.verdict).toBe('precise');
      expect(s2.speedMul).toBe(TAXMAN_PHASE2_SPEED_MUL.precise);
      expect(s2.shouldFireAttack).toBe(false); // first cadence not yet consumed
    });
  });

  describe('phase 2 — verdict-specific attacks', () => {
    function enterPhase2(verdict: GrudgeVerdict) {
      const s0 = initialTaxmanGrudgeState();
      const sT = tick(s0, 16, 0.49, verdict);
      return tick(sT, TAXMAN_TRANSITION_PAUSE_MS + 50, 0.49, verdict);
    }

    it('fires attack after one full cadence', () => {
      const s2 = enterPhase2('reckless');
      expect(s2.shouldFireAttack).toBe(false);
      const sFire = tick(s2, TAXMAN_PHASE2_CADENCE_MS.reckless + 16, 0.49, 'reckless');
      expect(sFire.shouldFireAttack).toBe(true);
    });

    it('attack flag clears after one tick', () => {
      const s2 = enterPhase2('bruiser');
      const sFire = tick(s2, TAXMAN_PHASE2_CADENCE_MS.bruiser + 16, 0.49, 'bruiser');
      expect(sFire.shouldFireAttack).toBe(true);
      const sNext = tick(sFire, 16, 0.49, 'bruiser');
      expect(sNext.shouldFireAttack).toBe(false);
    });

    it('cadence resets after fire', () => {
      const s2 = enterPhase2('coward');
      const sFire = tick(s2, TAXMAN_PHASE2_CADENCE_MS.coward + 16, 0.49, 'coward');
      // Consume part of the new cooldown
      const sPartial = tick(sFire, 100, 0.49, 'coward');
      expect(sPartial.shouldFireAttack).toBe(false);
    });

    it.each([
      ['coward',   TAXMAN_PHASE2_SPEED_MUL.coward],
      ['bruiser',  TAXMAN_PHASE2_SPEED_MUL.bruiser],
      ['precise',  TAXMAN_PHASE2_SPEED_MUL.precise],
      ['reckless', TAXMAN_PHASE2_SPEED_MUL.reckless],
      ['even',     TAXMAN_PHASE2_SPEED_MUL.even],
    ] as [GrudgeVerdict, number][])(
      'verdict %s has correct speed mul',
      (verdict, expectedMul) => {
        const s2 = enterPhase2(verdict);
        expect(s2.speedMul).toBeCloseTo(expectedMul);
      },
    );
  });
});
