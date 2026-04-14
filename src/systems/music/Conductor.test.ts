import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Conductor, GameMusicState } from './Conductor';

function baseState(overrides: Partial<GameMusicState> = {}): GameMusicState {
  return {
    hp: 100, maxHp: 100, gameTimeSec: 0,
    enemyCount: 0, comboCount: 0, killCount: 0,
    bossActive: false, biomeTimbre: 0.5, ...overrides,
  };
}

function pumpMood(c: Conductor, delta: number, state: GameMusicState, frames: number): void {
  for (let i = 0; i < frames; i++) {
    c.updateMood(delta, state);
  }
}

describe('Conductor', () => {
  describe('updateMood', () => {
    it('intensity rises toward target over time', () => {
      const c = new Conductor();
      pumpMood(c, 16, baseState({ gameTimeSec: 600, enemyCount: 125 }), 300);
      expect(c.intensity).toBeGreaterThan(0.3);
      expect(c.intensity).toBeLessThanOrEqual(1);
    });

    it('danger rises when hp < 30%', () => {
      const c = new Conductor();
      pumpMood(c, 16, baseState({ hp: 10, maxHp: 100 }), 200);
      expect(c.danger).toBeGreaterThan(0.3);
    });

    it('danger decays when hp >= 30%', () => {
      const c = new Conductor();
      c.danger = 0.8;
      pumpMood(c, 16, baseState({ hp: 80, maxHp: 100 }), 200);
      expect(c.danger).toBeLessThan(0.5);
    });

    it('chaos rises with enemy count and combo', () => {
      const c = new Conductor();
      pumpMood(c, 16, baseState({ enemyCount: 200, comboCount: 15 }), 200);
      expect(c.chaos).toBeGreaterThan(0.2);
    });

    it('skips mood updates in resolution mode', () => {
      const c = new Conductor();
      c.intensity = 0.5;
      c.enterResolution();
      const before = c.intensity;
      pumpMood(c, 16, baseState({ gameTimeSec: 1200, enemyCount: 250 }), 100);
      expect(c.intensity).toBe(before);
    });

    it('smooths biome timbre toward target', () => {
      const c = new Conductor();
      expect(c.getSmoothedBiomeTimbre()).toBeCloseTo(0.45, 2);
      pumpMood(c, 16, baseState({ biomeTimbre: 1.0 }), 1200);
      expect(c.getSmoothedBiomeTimbre()).toBeGreaterThan(0.85);
    });

    it('still lerps biome timbre while in resolution mode', () => {
      const c = new Conductor();
      c.enterResolution();
      pumpMood(c, 16, baseState({ biomeTimbre: 0.95 }), 900);
      expect(c.getSmoothedBiomeTimbre()).toBeGreaterThan(0.65);
    });

    it('hpFrac defaults to 1 when maxHp is 0', () => {
      const c = new Conductor();
      pumpMood(c, 16, baseState({ hp: 0, maxHp: 0 }), 100);
      expect(c.danger).toBeCloseTo(0, 1);
    });
  });

  describe('kill rate', () => {
    it('computes kills per second over sliding window', () => {
      const c = new Conductor();
      pumpMood(c, 16, baseState({ gameTimeSec: 1, killCount: 0, comboCount: 10, hp: 80, maxHp: 100 }), 1);
      pumpMood(c, 16, baseState({ gameTimeSec: 3, killCount: 20, comboCount: 10, hp: 80, maxHp: 100 }), 1);
      pumpMood(c, 16, baseState({ gameTimeSec: 5, killCount: 40, comboCount: 10, hp: 80, maxHp: 100 }), 1);
      expect(c.triumph).toBeGreaterThan(0);
    });

    it('triumph stays 0 at low combo or low hp', () => {
      const c = new Conductor();
      pumpMood(c, 16, baseState({ gameTimeSec: 5, killCount: 40, comboCount: 2, hp: 80, maxHp: 100 }), 10);
      expect(c.triumph).toBeCloseTo(0, 2);
    });
  });

  describe('enterResolution + isResolutionComplete', () => {
    it('sets triumph=1, danger=0, chaos=0', () => {
      const c = new Conductor();
      c.danger = 0.5;
      c.chaos = 0.5;
      c.enterResolution();
      expect(c.triumph).toBe(1);
      expect(c.danger).toBe(0);
      expect(c.chaos).toBe(0);
    });

    it('resolution descends to root and completes', () => {
      const c = new Conductor();
      c.enterResolution();
      let notes = 0;
      const maxNotes = 50;
      while (!c.isResolutionComplete() && notes < maxNotes) {
        c.nextNote();
        notes++;
      }
      expect(c.isResolutionComplete()).toBe(true);
      expect(notes).toBeLessThan(maxNotes);
    });

    it('isResolutionComplete false before entering resolution', () => {
      const c = new Conductor();
      expect(c.isResolutionComplete()).toBe(false);
    });
  });

  describe('nextNote', () => {
    let mathRandomSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      mathRandomSpy.mockRestore();
    });

    it('returns freq, velocity, intervalSec, releaseSec', () => {
      const c = new Conductor();
      const note = c.nextNote();
      expect(note).not.toBeNull();
      expect(note!.freq).toBeGreaterThan(0);
      expect(note!.velocity).toBeGreaterThanOrEqual(0.1);
      expect(note!.velocity).toBeLessThanOrEqual(0.8);
      expect(note!.intervalSec).toBeGreaterThan(0);
      expect(note!.releaseSec).toBeGreaterThan(1);
      expect(note!.releaseSec).toBeLessThanOrEqual(2.8);
    });

    it('longer releases when moor/evolution accents present in state', () => {
      const c = new Conductor();
      c.updateMood(16, baseState({ moorBloom: 0.95, evolutionGlow: 0.9 }));
      const note = c.nextNote()!;
      expect(note.releaseSec).toBeGreaterThan(2.1);
    });

    it('freq is from Dorian scale', () => {
      const DORIAN = [
        220.0, 246.9, 261.6, 293.7, 329.6, 370.0, 392.0,
        440.0, 493.9, 523.3, 587.3, 659.3, 740.0, 784.0,
      ];
      const allFreqs = [...DORIAN, 349.2, 698.5, 277.2, 554.4];
      const c = new Conductor();
      for (let i = 0; i < 20; i++) {
        const note = c.nextNote()!;
        expect(allFreqs).toContain(note.freq);
      }
    });

    it('interval shrinks as intensity rises', () => {
      const c = new Conductor();
      const calm = c.nextNote()!.intervalSec;

      const c2 = new Conductor();
      c2.intensity = 1;
      const intense = c2.nextNote()!.intervalSec;

      expect(intense).toBeLessThan(calm);
    });
  });

  describe('getMood', () => {
    it('returns current mood values', () => {
      const c = new Conductor();
      c.intensity = 0.5;
      c.danger = 0.3;
      c.chaos = 0.2;
      c.triumph = 0.1;
      const mood = c.getMood();
      expect(mood).toEqual({
        intensity: 0.5,
        danger: 0.3,
        chaos: 0.2,
        triumph: 0.1,
      });
    });
  });
});
