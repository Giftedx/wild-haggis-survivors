import { describe, it, expect } from 'vitest';
import {
  simulateStoorWormBehaviour,
  initialStoorWormState,
  STOOR_WORM_PHASE2_HP,
  STOOR_WORM_PHASE3_HP,
  STOOR_WORM_SCALE_LOCK_MS,
  STOOR_WORM_GAPE_MS,
  STOOR_WORM_SCALE_LOCK_DR,
  STOOR_WORM_ATTACK_CADENCE_MS,
  STOOR_WORM_SPEED_MUL,
  type StoorWormState,
} from './stoorWormBehaviour';

function tick(state: StoorWormState, deltaMs: number, hpPct = 1.0): StoorWormState {
  return simulateStoorWormBehaviour(state, { deltaMs, hpPct });
}

describe('stoorWormBehaviour', () => {
  describe('initial state', () => {
    it('starts sealed in phase 1 at full speed', () => {
      const s = initialStoorWormState();
      expect(s.phase).toBe(1);
      expect(s.scaleLockState).toBe('sealed');
      expect(s.isScaleLocked).toBe(true);
      expect(s.speedMul).toBe(STOOR_WORM_SPEED_MUL[1]);
    });

    it('SCALE_LOCK_DR is 0.80', () => {
      expect(STOOR_WORM_SCALE_LOCK_DR).toBe(0.80);
    });
  });

  describe('scale lock cycle (phases 1 and 2)', () => {
    it('transitions sealed → gaping after SCALE_LOCK_MS', () => {
      let s = initialStoorWormState();
      s = tick(s, STOOR_WORM_SCALE_LOCK_MS - 1);
      expect(s.scaleLockState).toBe('sealed');
      expect(s.isScaleLocked).toBe(true);
      s = tick(s, 2);
      expect(s.scaleLockState).toBe('gaping');
      expect(s.isScaleLocked).toBe(false);
    });

    it('transitions gaping → sealed after GAPE_MS', () => {
      let s = initialStoorWormState();
      // Enter gaping
      s = tick(s, STOOR_WORM_SCALE_LOCK_MS + 1);
      expect(s.scaleLockState).toBe('gaping');
      // Stay gaping until GAPE_MS expires
      s = tick(s, STOOR_WORM_GAPE_MS - 1);
      expect(s.scaleLockState).toBe('gaping');
      s = tick(s, 2);
      expect(s.scaleLockState).toBe('sealed');
      expect(s.isScaleLocked).toBe(true);
    });

    it('cycle repeats — sealed after first gape window (two ticks)', () => {
      let s = initialStoorWormState();
      s = tick(s, STOOR_WORM_SCALE_LOCK_MS + 1); // sealed → gaping
      expect(s.scaleLockState).toBe('gaping');
      s = tick(s, STOOR_WORM_GAPE_MS + 1); // gaping → sealed
      expect(s.scaleLockState).toBe('sealed');
    });
  });

  describe('phase 1 attacks', () => {
    it('fires after ATTACK_CADENCE_MS[1]', () => {
      let s = initialStoorWormState();
      s = tick(s, STOOR_WORM_ATTACK_CADENCE_MS[1] - 1);
      expect(s.shouldFireAttack).toBe(false);
      s = tick(s, 2);
      expect(s.shouldFireAttack).toBe(true);
    });

    it('shouldFireAttack resets the next tick', () => {
      let s = initialStoorWormState();
      s = tick(s, STOOR_WORM_ATTACK_CADENCE_MS[1] + 1);
      expect(s.shouldFireAttack).toBe(true);
      s = tick(s, 1);
      expect(s.shouldFireAttack).toBe(false);
    });
  });

  describe('phase 1 → 2 transition', () => {
    it('enters phase 2 at PHASE2_HP threshold', () => {
      let s = initialStoorWormState();
      s = tick(s, 1, STOOR_WORM_PHASE2_HP - 0.01);
      expect(s.phase).toBe(2);
      expect(s.didPhaseChange).toBe(true);
      expect(s.speedMul).toBe(STOOR_WORM_SPEED_MUL[2]);
    });

    it('stays in phase 1 above PHASE2_HP', () => {
      const s = tick(initialStoorWormState(), 1, STOOR_WORM_PHASE2_HP + 0.01);
      expect(s.phase).toBe(1);
    });

    it('didPhaseChange resets the next tick', () => {
      let s = tick(initialStoorWormState(), 1, STOOR_WORM_PHASE2_HP - 0.01);
      expect(s.didPhaseChange).toBe(true);
      s = tick(s, 1, STOOR_WORM_PHASE2_HP - 0.01);
      expect(s.didPhaseChange).toBe(false);
    });

    it('attack cadence tightens in phase 2', () => {
      expect(STOOR_WORM_ATTACK_CADENCE_MS[2]).toBeLessThan(STOOR_WORM_ATTACK_CADENCE_MS[1]);
    });

    it('scale lock continues in phase 2', () => {
      const s = tick(initialStoorWormState(), 1, STOOR_WORM_PHASE2_HP - 0.01);
      expect(s.isScaleLocked).toBe(true); // still in sealed window
    });
  });

  describe('phase 2 → 3 transition', () => {
    it('enters phase 3 at PHASE3_HP threshold', () => {
      let s = tick(initialStoorWormState(), 1, STOOR_WORM_PHASE2_HP - 0.01);
      s = tick(s, 1, STOOR_WORM_PHASE3_HP - 0.01);
      expect(s.phase).toBe(3);
      expect(s.didPhaseChange).toBe(true);
      expect(s.speedMul).toBe(STOOR_WORM_SPEED_MUL[3]);
    });

    it('stays in phase 2 above PHASE3_HP', () => {
      const p2 = tick(initialStoorWormState(), 1, STOOR_WORM_PHASE2_HP - 0.01);
      const s = tick(p2, 1, STOOR_WORM_PHASE3_HP + 0.01);
      expect(s.phase).toBe(2);
    });

    it('cannot jump from phase 1 to phase 3 in one tick', () => {
      // Phase transitions are sequential — phase 1 checks for phase2 threshold first
      const s = tick(initialStoorWormState(), 1, STOOR_WORM_PHASE3_HP - 0.01);
      expect(s.phase).toBe(2); // phase 1→2 fires; phase 2→3 needs a separate tick
    });
  });

  describe('phase 3 — death thrash', () => {
    function enterPhase3(): StoorWormState {
      const p2 = tick(initialStoorWormState(), 1, STOOR_WORM_PHASE2_HP - 0.01);
      return tick(p2, 1, STOOR_WORM_PHASE3_HP - 0.01);
    }

    it('scale lock is always off in phase 3', () => {
      const s = tick(enterPhase3(), 1, STOOR_WORM_PHASE3_HP - 0.01);
      expect(s.isScaleLocked).toBe(false);
      expect(s.scaleLockState).toBe('gaping');
    });

    it('scale lock stays off even past SCALE_LOCK_MS in phase 3', () => {
      let s = enterPhase3();
      s = tick(s, STOOR_WORM_SCALE_LOCK_MS + 1, STOOR_WORM_PHASE3_HP - 0.01);
      expect(s.isScaleLocked).toBe(false);
    });

    it('fires attacks at cadence[3]', () => {
      let s = enterPhase3();
      // Drain residual cooldown from phase transitions
      s = tick(s, STOOR_WORM_ATTACK_CADENCE_MS[1] + 1, STOOR_WORM_PHASE3_HP - 0.01);
      expect(s.shouldFireAttack).toBe(true); // fire drains + resets to cadence[3]
      s = tick(s, STOOR_WORM_ATTACK_CADENCE_MS[3] - 1, STOOR_WORM_PHASE3_HP - 0.01);
      expect(s.shouldFireAttack).toBe(false);
      s = tick(s, 2, STOOR_WORM_PHASE3_HP - 0.01);
      expect(s.shouldFireAttack).toBe(true);
    });

    it('cadence[3] is faster than cadence[2]', () => {
      expect(STOOR_WORM_ATTACK_CADENCE_MS[3]).toBeLessThan(STOOR_WORM_ATTACK_CADENCE_MS[2]);
    });
  });

  describe('output flags reset each tick', () => {
    it('shouldFireAttack is false the tick after it fires', () => {
      let s = initialStoorWormState();
      s = tick(s, STOOR_WORM_ATTACK_CADENCE_MS[1] + 1);
      expect(s.shouldFireAttack).toBe(true);
      s = tick(s, 1);
      expect(s.shouldFireAttack).toBe(false);
    });
  });
});
