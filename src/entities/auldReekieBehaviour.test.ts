import { describe, it, expect } from 'vitest';
import {
  simulateAuldReekieBehaviour,
  initialAuldReekieState,
  AULD_REEKIE_PHASE2_HP,
  AULD_REEKIE_PHASE3_HP,
  LANTERN_CADENCE_MS,
  BLINK_CADENCE_P2_MS,
  BLINK_CADENCE_P3_MS,
  BLINK_TELEGRAPH_MS,
  GAS_CADENCE_P2_MS,
  GAS_CADENCE_P3_MS,
  SPEED_MUL_P1,
  SPEED_MUL_P2,
  SPEED_MUL_P3,
  type AuldReekieState,
} from './auldReekieBehaviour';

function tick(state: AuldReekieState, deltaMs: number, hpPct = 1.0): AuldReekieState {
  return simulateAuldReekieBehaviour(state, { deltaMs, hpPct });
}

describe('auldReekieBehaviour', () => {
  describe('phase transitions', () => {
    it('starts in phase 1 with speedMul 1.0', () => {
      const s = initialAuldReekieState();
      expect(s.phase).toBe(1);
      expect(s.speedMul).toBe(SPEED_MUL_P1);
    });

    it('enters phase 2 at AULD_REEKIE_PHASE2_HP', () => {
      const s = tick(initialAuldReekieState(), 100, AULD_REEKIE_PHASE2_HP - 0.01);
      expect(s.phase).toBe(2);
      expect(s.speedMul).toBe(SPEED_MUL_P2);
    });

    it('enters phase 3 at AULD_REEKIE_PHASE3_HP', () => {
      const s = tick(initialAuldReekieState(), 100, AULD_REEKIE_PHASE3_HP - 0.01);
      expect(s.phase).toBe(3);
      expect(s.speedMul).toBe(SPEED_MUL_P3);
    });
  });

  describe('lantern lob (phases 1 and 2)', () => {
    it('fires after LANTERN_CADENCE_MS in phase 1', () => {
      let s = initialAuldReekieState();
      s = tick(s, LANTERN_CADENCE_MS - 1);
      expect(s.shouldFireLantern).toBe(false);
      s = tick(s, 2);
      expect(s.shouldFireLantern).toBe(true);
    });

    it('does not set shouldFireTripleFan in phase 2', () => {
      let s = initialAuldReekieState();
      s = tick(s, LANTERN_CADENCE_MS + 1, AULD_REEKIE_PHASE2_HP - 0.01);
      expect(s.shouldFireTripleFan).toBe(false);
    });
  });

  describe('triple fan (phase 3)', () => {
    it('fires triple fan instead of lantern in phase 3', () => {
      let s = initialAuldReekieState();
      s = tick(s, 1, AULD_REEKIE_PHASE3_HP - 0.01); // enter phase 3, timer resets
      s = tick(s, LANTERN_CADENCE_MS + 1, AULD_REEKIE_PHASE3_HP - 0.01);
      expect(s.shouldFireTripleFan).toBe(true);
      expect(s.shouldFireLantern).toBe(false);
    });
  });

  describe('summons', () => {
    it('summons 4 tourist_ghosts once in phase 1', () => {
      const s = initialAuldReekieState();
      const next = tick(s, 1);
      expect(next.shouldSummonPack).toBe(4);
      // only fires once
      const after = tick(next, 1);
      expect(after.shouldSummonPack).toBe(0);
    });

    it('summons 2 tourist_ghosts on transition to phase 2', () => {
      let s = initialAuldReekieState();
      s = tick(s, 100); // consume phase1 summon
      // drive to phase 2
      const atP2 = tick(s, 1, AULD_REEKIE_PHASE2_HP - 0.01);
      expect(atP2.shouldSummonPack).toBe(2);
      const after = tick(atP2, 1, AULD_REEKIE_PHASE2_HP - 0.01);
      expect(after.shouldSummonPack).toBe(0);
    });

    it('summons nothing on phase 3 entry', () => {
      let s = initialAuldReekieState();
      s = tick(s, 100); // consume phase1 summon
      s = tick(s, 1, AULD_REEKIE_PHASE2_HP - 0.01); // phase 2 summon
      s = tick(s, 1, AULD_REEKIE_PHASE2_HP - 0.01); // clear
      const atP3 = tick(s, 1, AULD_REEKIE_PHASE3_HP - 0.01);
      expect(atP3.shouldSummonPack).toBe(0);
    });
  });

  describe('blink telegraph → execute cycle (phase 2)', () => {
    it('does not blink in phase 1', () => {
      let s = initialAuldReekieState();
      s = tick(s, BLINK_CADENCE_P2_MS + 1);
      expect(s.shouldStartBlinkTelegraph).toBe(false);
    });

    it('telegraphs blink in phase 2 after BLINK_CADENCE_P2_MS', () => {
      let s = initialAuldReekieState();
      s = tick(s, 1, AULD_REEKIE_PHASE2_HP - 0.01); // enter p2
      s = tick(s, BLINK_CADENCE_P2_MS - 1, AULD_REEKIE_PHASE2_HP - 0.01);
      expect(s.shouldStartBlinkTelegraph).toBe(false);
      s = tick(s, 2, AULD_REEKIE_PHASE2_HP - 0.01);
      expect(s.shouldStartBlinkTelegraph).toBe(true);
      expect(s.blinkTelegraphing).toBe(true);
    });

    it('executes blink after BLINK_TELEGRAPH_MS', () => {
      let s = initialAuldReekieState();
      s = tick(s, 1, AULD_REEKIE_PHASE2_HP - 0.01);
      s = tick(s, BLINK_CADENCE_P2_MS + 1, AULD_REEKIE_PHASE2_HP - 0.01);
      // now telegraphing
      s = tick(s, BLINK_TELEGRAPH_MS - 1, AULD_REEKIE_PHASE2_HP - 0.01);
      expect(s.shouldExecuteBlink).toBe(false);
      s = tick(s, 2, AULD_REEKIE_PHASE2_HP - 0.01);
      expect(s.shouldExecuteBlink).toBe(true);
      expect(s.blinkTelegraphing).toBe(false);
    });

    it('uses BLINK_CADENCE_P3_MS in phase 3', () => {
      let s = initialAuldReekieState();
      s = tick(s, 1, AULD_REEKIE_PHASE3_HP - 0.01);
      s = tick(s, BLINK_CADENCE_P3_MS + 1, AULD_REEKIE_PHASE3_HP - 0.01);
      expect(s.shouldStartBlinkTelegraph).toBe(true);
    });
  });

  describe('gas pulse (phases 2 and 3)', () => {
    it('does not gas-telegraph in phase 1', () => {
      let s = initialAuldReekieState();
      s = tick(s, GAS_CADENCE_P2_MS + 1);
      expect(s.shouldStartGasTelegraph).toBe(false);
    });

    it('gas-telegraphs in phase 2 after GAS_CADENCE_P2_MS', () => {
      let s = initialAuldReekieState();
      s = tick(s, 1, AULD_REEKIE_PHASE2_HP - 0.01);
      s = tick(s, GAS_CADENCE_P2_MS + 1, AULD_REEKIE_PHASE2_HP - 0.01);
      expect(s.shouldStartGasTelegraph).toBe(true);
    });

    it('fires gas after GAS_TELEGRAPH_MS', () => {
      let s = initialAuldReekieState();
      s = tick(s, 1, AULD_REEKIE_PHASE2_HP - 0.01);
      s = tick(s, GAS_CADENCE_P2_MS + 1, AULD_REEKIE_PHASE2_HP - 0.01);
      // now telegraphing — wait past GAS_TELEGRAPH_MS (1000 ms)
      s = tick(s, 1001, AULD_REEKIE_PHASE2_HP - 0.01);
      expect(s.shouldFireGas).toBe(true);
    });

    it('uses GAS_CADENCE_P3_MS in phase 3', () => {
      let s = initialAuldReekieState();
      s = tick(s, 1, AULD_REEKIE_PHASE3_HP - 0.01);
      s = tick(s, GAS_CADENCE_P3_MS + 1, AULD_REEKIE_PHASE3_HP - 0.01);
      expect(s.shouldStartGasTelegraph).toBe(true);
    });
  });

  describe('output flags reset each tick', () => {
    it('shouldFireLantern is false the tick after it fires', () => {
      let s = initialAuldReekieState();
      s = tick(s, LANTERN_CADENCE_MS + 1);
      expect(s.shouldFireLantern).toBe(true);
      s = tick(s, 1);
      expect(s.shouldFireLantern).toBe(false);
    });
  });
});
