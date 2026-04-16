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
});
