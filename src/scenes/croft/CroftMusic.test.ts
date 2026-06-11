import { describe, it, expect } from 'vitest';
import { CroftAmbientLoop } from './CroftMusic';

/**
 * Structural constants + lifecycle smoke — the Web Audio API is
 * unavailable under the vitest node env (same pattern as
 * ShopAmbientLoop). We verify the sonic intent via the pure
 * constants and confirm start/stop/applyVolume are safe to call
 * when the AudioContext can't be built.
 */
describe('CroftAmbientLoop', () => {
  describe('constants', () => {
    it('BASE_FREQ is an audible mid-register tonic', () => {
      expect(CroftAmbientLoop.BASE_FREQ).toBeGreaterThan(60);
      expect(CroftAmbientLoop.BASE_FREQ).toBeLessThan(1000);
    });

    it('FIFTH_FREQ is ~1.5× BASE_FREQ (open Highland fifth)', () => {
      expect(CroftAmbientLoop.FIFTH_FREQ / CroftAmbientLoop.BASE_FREQ).toBeCloseTo(1.5, 1);
    });

    it('DETUNE_HZ is a small positive chorus offset', () => {
      expect(CroftAmbientLoop.DETUNE_HZ).toBeGreaterThan(0);
      expect(CroftAmbientLoop.DETUNE_HZ).toBeLessThan(5);
    });

    it('LFO_RATE is a very slow sub-Hz breath', () => {
      expect(CroftAmbientLoop.LFO_RATE).toBeGreaterThan(0);
      expect(CroftAmbientLoop.LFO_RATE).toBeLessThan(1);
    });

    it('MAX_VOL is quieter than ShopAmbientLoop (dwell-safe)', () => {
      // Hard-coded comparison: CroftScene is where the player lingers.
      expect(CroftAmbientLoop.MAX_VOL).toBeGreaterThan(0);
      expect(CroftAmbientLoop.MAX_VOL).toBeLessThan(0.1);
    });

    it('FADE_IN_SEC is gentle enough to avoid a "thunk" on entry', () => {
      expect(CroftAmbientLoop.FADE_IN_SEC).toBeGreaterThan(0.5);
      expect(CroftAmbientLoop.FADE_IN_SEC).toBeLessThan(5);
    });

    it('FADE_OUT_SEC is shorter than FADE_IN_SEC (quick departure)', () => {
      expect(CroftAmbientLoop.FADE_OUT_SEC).toBeLessThan(CroftAmbientLoop.FADE_IN_SEC);
    });
  });

  describe('lifecycle with unavailable AudioContext', () => {
    it('can be constructed without throwing', () => {
      expect(() => new CroftAmbientLoop()).not.toThrow();
    });

    it('start() does not throw when AudioContext is unavailable', () => {
      const loop = new CroftAmbientLoop();
      expect(() => loop.start()).not.toThrow();
    });

    it('stop() does not throw when never started', () => {
      const loop = new CroftAmbientLoop();
      expect(() => loop.stop()).not.toThrow();
    });

    it('applyVolume() does not throw when not started', () => {
      const loop = new CroftAmbientLoop();
      expect(() => loop.applyVolume(1.0, 1.0)).not.toThrow();
    });

    it('start() is idempotent — second call does not throw', () => {
      const loop = new CroftAmbientLoop();
      loop.start();
      expect(() => loop.start()).not.toThrow();
    });
  });
});
