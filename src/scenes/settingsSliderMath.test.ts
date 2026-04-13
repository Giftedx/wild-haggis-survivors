import { describe, expect, it } from 'vitest';
import {
  sliderValueFromRatio,
  sliderRatioFromValue,
  steppedSliderBump,
} from './settingsSliderMath';

describe('settingsSliderMath', () => {
  describe('sliderRatioFromValue', () => {
    it('maps min → 0 and max → 1', () => {
      expect(sliderRatioFromValue(0, 0, 1)).toBe(0);
      expect(sliderRatioFromValue(1, 0, 1)).toBe(1);
    });

    it('maps midpoint to 0.5', () => {
      expect(sliderRatioFromValue(0.5, 0, 1)).toBeCloseTo(0.5, 6);
      expect(sliderRatioFromValue(1.1, 0.8, 1.4)).toBeCloseTo(0.5, 6);
    });

    it('clamps values outside the range', () => {
      expect(sliderRatioFromValue(-0.3, 0, 1)).toBe(0);
      expect(sliderRatioFromValue(2, 0, 1)).toBe(1);
    });

    it('handles degenerate zero-width range without NaN', () => {
      // ui scale at a fixed 1.0..1.0 should snap to 0 rather than divide by zero.
      expect(sliderRatioFromValue(1, 1, 1)).toBe(0);
    });
  });

  describe('sliderValueFromRatio', () => {
    it('maps 0 → min and 1 → max', () => {
      expect(sliderValueFromRatio(0, 0, 1)).toBe(0);
      expect(sliderValueFromRatio(1, 0, 1)).toBe(1);
    });

    it('clamps ratios outside [0,1]', () => {
      expect(sliderValueFromRatio(-0.5, 0, 1)).toBe(0);
      expect(sliderValueFromRatio(1.5, 0, 1)).toBe(1);
    });

    it('snaps to step when step is provided', () => {
      // uiScale range 0.8..1.4 step 0.05 — a ratio of 0.52 is 1.112, snap to 1.10.
      expect(sliderValueFromRatio(0.52, 0.8, 1.4, 0.05)).toBeCloseTo(1.1, 6);
    });

    it('never drifts past max due to step rounding', () => {
      // ratio 1 with a step that does not divide the range evenly.
      expect(sliderValueFromRatio(1, 0.8, 1.4, 0.05)).toBeCloseTo(1.4, 6);
    });

    it('is inverse-stable with sliderRatioFromValue at snap-aligned values', () => {
      const min = 0;
      const max = 1;
      const step = 0.1;
      for (let v = 0; v <= 1 + 1e-9; v += step) {
        const r = sliderRatioFromValue(v, min, max);
        const round = sliderValueFromRatio(r, min, max, step);
        expect(round).toBeCloseTo(v, 6);
      }
    });
  });

  describe('steppedSliderBump', () => {
    it('increments by step, clamped to max', () => {
      expect(steppedSliderBump(0.5, +1, 0, 1, 0.1)).toBeCloseTo(0.6, 6);
      expect(steppedSliderBump(0.95, +1, 0, 1, 0.1)).toBeCloseTo(1, 6);
    });

    it('decrements by step, clamped to min', () => {
      expect(steppedSliderBump(0.5, -1, 0, 1, 0.1)).toBeCloseTo(0.4, 6);
      expect(steppedSliderBump(0.05, -1, 0, 1, 0.1)).toBeCloseTo(0, 6);
    });

    it('uses step sign from direction, ignores magnitude', () => {
      // direction of +5 still bumps by exactly one step.
      expect(steppedSliderBump(0.5, +5, 0, 1, 0.1)).toBeCloseTo(0.6, 6);
    });

    it('avoids floating drift — repeated bumps land on whole-cent values', () => {
      let v = 0;
      for (let i = 0; i < 10; i++) v = steppedSliderBump(v, +1, 0, 1, 0.1);
      expect(v).toBeCloseTo(1, 6);
      // After a full sweep, the internal representation should still be a clean step.
      expect(Math.round(v * 100) / 100).toBe(1);
    });
  });
});
