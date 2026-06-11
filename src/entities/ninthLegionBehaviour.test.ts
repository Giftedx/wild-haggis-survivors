import { describe, it, expect } from 'vitest';
import {
  simulateNinthLegionBehaviour,
  initialNinthLegionState,
  NINTH_LEGION_PHASE2_ELAPSED_MS,
  NINTH_LEGION_PHASE3_HP,
  NINTH_LEGION_SHROUD_DR,
  NINTH_LEGION_WAVE_SPAWN_MS,
  NINTH_LEGION_WAVE_SIZE,
  NINTH_LEGION_ATTACK_CADENCE_MS,
  NINTH_LEGION_SPEED_MUL,
  NINTH_LEGION_REARGUARD_CADENCE_MS,
  NINTH_LEGION_REARGUARD_SIZE,
  type NinthLegionState,
} from './ninthLegionBehaviour';

function tick(state: NinthLegionState, deltaMs: number, hpPct = 1.0): NinthLegionState {
  return simulateNinthLegionBehaviour(state, { deltaMs, hpPct });
}

describe('ninthLegionBehaviour', () => {
  describe('initial state', () => {
    it('starts shrouded in phase 1', () => {
      const s = initialNinthLegionState();
      expect(s.phase).toBe(1);
      expect(s.isShrouded).toBe(true);
      expect(s.speedMul).toBe(NINTH_LEGION_SPEED_MUL[1]);
    });

    it('SHROUD_DR is 0.90', () => {
      expect(NINTH_LEGION_SHROUD_DR).toBe(0.90);
    });
  });

  describe('phase 1 — wave spawning', () => {
    it('fires wave 0 on the first tick (elapsed >= 0)', () => {
      const s = tick(initialNinthLegionState(), 1);
      expect(s.shouldSpawnWave).toBe(true);
      expect(s.wavesFired).toContain(0);
    });

    it('does not re-fire wave 0 after it fired', () => {
      let s = tick(initialNinthLegionState(), 1);
      s = tick(s, 1);
      expect(s.shouldSpawnWave).toBe(false);
    });

    it('fires all three waves before phase 2 threshold', () => {
      // Advance to just before wave 1 — wave 0 fires at elapsed 0 so it fires in this tick too
      let s = tick(initialNinthLegionState(), NINTH_LEGION_WAVE_SPAWN_MS[1] - 1);
      expect(s.wavesFired).toContain(0);
      expect(s.wavesFired).not.toContain(1);

      // Wave 1 fires
      s = tick(s, 2);
      expect(s.wavesFired).toContain(1);
      expect(s.shouldSpawnWave).toBe(true);

      // Wave 2 fires
      s = tick(s, NINTH_LEGION_WAVE_SPAWN_MS[2] - NINTH_LEGION_WAVE_SPAWN_MS[1] + 1);
      expect(s.wavesFired).toContain(2);
      expect(s.shouldSpawnWave).toBe(true);
    });

    it('WAVE_SIZE is 4', () => {
      expect(NINTH_LEGION_WAVE_SIZE).toBe(4);
    });

    it('remains shrouded throughout phase 1', () => {
      const s = tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS - 100);
      expect(s.isShrouded).toBe(true);
      expect(s.phase).toBe(1);
    });
  });

  describe('phase 1 → 2 transition', () => {
    it('lifts shroud at PHASE2_ELAPSED_MS', () => {
      let s = tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS - 1);
      expect(s.phase).toBe(1);
      expect(s.isShrouded).toBe(true);
      s = tick(s, 2);
      expect(s.phase).toBe(2);
      expect(s.isShrouded).toBe(false);
      expect(s.shouldLiftShroud).toBe(true);
    });

    it('shouldLiftShroud resets the next tick', () => {
      let s = tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS + 1);
      expect(s.shouldLiftShroud).toBe(true);
      s = tick(s, 1);
      expect(s.shouldLiftShroud).toBe(false);
    });

    it('speed increases to SPEED_MUL[2] on phase 2 entry', () => {
      const s = tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS + 1);
      expect(s.speedMul).toBe(NINTH_LEGION_SPEED_MUL[2]);
    });
  });

  describe('phase 2 — pilum attacks', () => {
    function enterPhase2(): NinthLegionState {
      return tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS + 1);
    }

    it('fires attack after ATTACK_CADENCE_MS[2]', () => {
      let s = enterPhase2();
      s = tick(s, NINTH_LEGION_ATTACK_CADENCE_MS[2] - 1);
      expect(s.shouldFireAttack).toBe(false);
      s = tick(s, 2);
      expect(s.shouldFireAttack).toBe(true);
    });

    it('shouldFireAttack resets the next tick', () => {
      let s = enterPhase2();
      s = tick(s, NINTH_LEGION_ATTACK_CADENCE_MS[2] + 1);
      expect(s.shouldFireAttack).toBe(true);
      s = tick(s, 1);
      expect(s.shouldFireAttack).toBe(false);
    });

    it('does not spawn rear-guard in phase 2', () => {
      let s = enterPhase2();
      s = tick(s, NINTH_LEGION_REARGUARD_CADENCE_MS + 1);
      expect(s.shouldSpawnRearguard).toBe(false);
    });
  });

  describe('phase 2 → 3 transition', () => {
    it('enters phase 3 when HP drops to PHASE3_HP', () => {
      const p2 = tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS + 1);
      const s = tick(p2, 1, NINTH_LEGION_PHASE3_HP - 0.01);
      expect(s.phase).toBe(3);
      expect(s.speedMul).toBe(NINTH_LEGION_SPEED_MUL[3]);
    });

    it('stays in phase 2 above PHASE3_HP', () => {
      const p2 = tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS + 1);
      const s = tick(p2, 1, NINTH_LEGION_PHASE3_HP + 0.01);
      expect(s.phase).toBe(2);
    });
  });

  describe('phase 3 — tighter attacks + rear-guard', () => {
    function enterPhase3WithFreshCooldown(): NinthLegionState {
      // Enter phase 2, drain its initial attack cooldown, then cross into phase 3.
      // This ensures the next attack resets to cadence[3] rather than sitting at
      // whatever residual cooldown was left from the phase 1→2 transition tick.
      let p2 = tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS + 1);
      // Fire the first phase-2 attack so cooldown resets to CADENCE[2]
      p2 = tick(p2, NINTH_LEGION_ATTACK_CADENCE_MS[2] + 1);
      // Now enter phase 3; cooldown = CADENCE[2] - 1 (1ms elapsed in this tick)
      return tick(p2, 1, NINTH_LEGION_PHASE3_HP - 0.01);
    }

    it('cadence[3] is faster than cadence[2]', () => {
      expect(NINTH_LEGION_ATTACK_CADENCE_MS[3]).toBeLessThan(NINTH_LEGION_ATTACK_CADENCE_MS[2]);
    });

    it('fires attack at cadence[3] after the first phase-3 attack resets the timer', () => {
      let s = enterPhase3WithFreshCooldown();
      // Drain the initial attack (leftover from phase 2 cooldown)
      s = tick(s, NINTH_LEGION_ATTACK_CADENCE_MS[2] + 1, NINTH_LEGION_PHASE3_HP - 0.01);
      expect(s.shouldFireAttack).toBe(true); // first p3 attack fires, resets to cadence[3]
      // Now the next attack should follow cadence[3]
      s = tick(s, NINTH_LEGION_ATTACK_CADENCE_MS[3] - 1, NINTH_LEGION_PHASE3_HP - 0.01);
      expect(s.shouldFireAttack).toBe(false);
      s = tick(s, 2, NINTH_LEGION_PHASE3_HP - 0.01);
      expect(s.shouldFireAttack).toBe(true);
    });

    it('spawns rear-guard after REARGUARD_CADENCE_MS in phase 3', () => {
      let s = tick(
        tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS + 1),
        1, NINTH_LEGION_PHASE3_HP - 0.01,
      );
      // rearguardCooldownMs starts at 20000 - 1 = 19999 after the 1ms entry tick
      s = tick(s, NINTH_LEGION_REARGUARD_CADENCE_MS - 2, NINTH_LEGION_PHASE3_HP - 0.01);
      expect(s.shouldSpawnRearguard).toBe(false);
      s = tick(s, 2, NINTH_LEGION_PHASE3_HP - 0.01);
      expect(s.shouldSpawnRearguard).toBe(true);
    });

    it('rear-guard resets and fires again after next cadence', () => {
      let s = tick(
        tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS + 1),
        1, NINTH_LEGION_PHASE3_HP - 0.01,
      );
      s = tick(s, NINTH_LEGION_REARGUARD_CADENCE_MS + 1, NINTH_LEGION_PHASE3_HP - 0.01);
      expect(s.shouldSpawnRearguard).toBe(true);
      s = tick(s, 1, NINTH_LEGION_PHASE3_HP - 0.01);
      expect(s.shouldSpawnRearguard).toBe(false);
    });

    it('REARGUARD_SIZE is 4', () => {
      expect(NINTH_LEGION_REARGUARD_SIZE).toBe(4);
    });
  });

  describe('output flags reset each tick', () => {
    it('shouldSpawnWave is false the tick after it fires', () => {
      let s = tick(initialNinthLegionState(), 1);
      expect(s.shouldSpawnWave).toBe(true);
      s = tick(s, 1);
      expect(s.shouldSpawnWave).toBe(false);
    });

    it('shouldFireAttack is false the tick after it fires', () => {
      let s = tick(initialNinthLegionState(), NINTH_LEGION_PHASE2_ELAPSED_MS + 1);
      s = tick(s, NINTH_LEGION_ATTACK_CADENCE_MS[2] + 1);
      expect(s.shouldFireAttack).toBe(true);
      s = tick(s, 1);
      expect(s.shouldFireAttack).toBe(false);
    });
  });
});
