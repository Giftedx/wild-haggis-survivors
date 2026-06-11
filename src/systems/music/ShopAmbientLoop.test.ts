import { describe, it, expect } from 'vitest';
import { ShopAmbientLoop } from './ShopAmbientLoop';

/**
 * ShopAmbientLoop unit tests.
 *
 * Web Audio API is unavailable in the vitest node environment, so we test
 * structural and constant correctness only — not the audio graph itself.
 * start() / stop() must not throw when the AudioContext is unavailable
 * (getAudioContext returns null in node env without VITEST activation).
 */

describe('ShopAmbientLoop', () => {
  describe('constants', () => {
    it('BASE_FREQ is a positive audible frequency', () => {
      expect(ShopAmbientLoop.BASE_FREQ).toBeGreaterThan(0);
      expect(ShopAmbientLoop.BASE_FREQ).toBeLessThan(20000);
    });

    it('SUB_FREQ is half of BASE_FREQ (one octave down)', () => {
      expect(ShopAmbientLoop.SUB_FREQ).toBeCloseTo(ShopAmbientLoop.BASE_FREQ / 2, 1);
    });

    it('DETUNE_HZ is a small positive offset for chorus warmth', () => {
      expect(ShopAmbientLoop.DETUNE_HZ).toBeGreaterThan(0);
      expect(ShopAmbientLoop.DETUNE_HZ).toBeLessThan(10);
    });

    it('LFO_RATE is a very slow sub-Hz rate', () => {
      expect(ShopAmbientLoop.LFO_RATE).toBeGreaterThan(0);
      expect(ShopAmbientLoop.LFO_RATE).toBeLessThan(1);
    });

    it('MAX_VOL is in a valid 0–1 range and deliberately quiet', () => {
      expect(ShopAmbientLoop.MAX_VOL).toBeGreaterThan(0);
      expect(ShopAmbientLoop.MAX_VOL).toBeLessThanOrEqual(1);
      // Should be subtle — below 0.2
      expect(ShopAmbientLoop.MAX_VOL).toBeLessThan(0.2);
    });
  });

  describe('instantiation', () => {
    it('can be constructed without throwing', () => {
      expect(() => new ShopAmbientLoop()).not.toThrow();
    });
  });

  describe('lifecycle methods with unavailable AudioContext', () => {
    it('start() does not throw when AudioContext is unavailable', () => {
      const loop = new ShopAmbientLoop();
      expect(() => loop.start()).not.toThrow();
    });

    it('stop() does not throw when never started', () => {
      const loop = new ShopAmbientLoop();
      expect(() => loop.stop()).not.toThrow();
    });

    it('stop() does not throw after start() with unavailable AudioContext', () => {
      const loop = new ShopAmbientLoop();
      loop.start(); // no-ops — AudioContext unavailable
      expect(() => loop.stop()).not.toThrow();
    });

    it('applyVolume() does not throw when not started', () => {
      const loop = new ShopAmbientLoop();
      expect(() => loop.applyVolume(1.0, 1.0)).not.toThrow();
    });

    it('start() is idempotent — second call does not throw', () => {
      const loop = new ShopAmbientLoop();
      loop.start();
      expect(() => loop.start()).not.toThrow();
    });
  });
});
