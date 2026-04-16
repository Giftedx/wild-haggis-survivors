import { describe, expect, it } from 'vitest';
import { RunActState } from './RunActState';

describe('RunActState', () => {
  describe('initial state', () => {
    it('starts at act 1, no picks, actStartTimeSec 0', () => {
      const s = new RunActState();
      expect(s.currentAct).toBe(1);
      expect(s.actStartTimeSec).toBe(0);
      expect(s.pickerHistory).toEqual([]);
    });
  });

  describe('reset', () => {
    it('returns all fields to initial values after direct writes', () => {
      const s = new RunActState();
      s.currentAct = 2;
      s.actStartTimeSec = 305;
      s.pickerHistory.push({
        slot: 'A',
        routeKey: 'up_the_brae',
        atGameTimeSec: 305,
        defaultedBySetting: false,
      });
      s.reset();
      expect(s.currentAct).toBe(1);
      expect(s.actStartTimeSec).toBe(0);
      expect(s.pickerHistory).toEqual([]);
    });

    it('reset replaces the pickerHistory array (doesn\'t mutate in place)', () => {
      const s = new RunActState();
      const original = s.pickerHistory;
      s.pickerHistory.push({
        slot: 'A',
        routeKey: 'up_the_brae',
        atGameTimeSec: 305,
        defaultedBySetting: false,
      });
      s.reset();
      // Reference identity check — reset should assign a fresh [], not mutate.
      // This catches a future `.length = 0` regression.
      expect(s.pickerHistory).not.toBe(original);
      expect(original.length).toBe(1); // original array untouched
    });
  });
});
