import { describe, it, expect } from 'vitest';
import { resolveWaveLabel } from './hudWaveLabel';
import { BALANCE } from '../core/BalanceConfig';

describe('resolveWaveLabel', () => {
  it('returns mark[0] at time 0', () => {
    const m0 = BALANCE.hud.WAVE_DIFFICULTY_MARKS[0];
    expect(resolveWaveLabel(0)).toEqual({ label: m0.label, color: m0.color });
  });

  it('stays at the current mark while time < next threshold', () => {
    const m0 = BALANCE.hud.WAVE_DIFFICULTY_MARKS[0];
    const m1 = BALANCE.hud.WAVE_DIFFICULTY_MARKS[1];
    // One second before wave II starts (180) — still on mark 0.
    expect(resolveWaveLabel(m1.minSec - 1)).toEqual({ label: m0.label, color: m0.color });
  });

  it('advances to the next mark exactly at its threshold', () => {
    for (let i = 1; i < BALANCE.hud.WAVE_DIFFICULTY_MARKS.length; i++) {
      const mark = BALANCE.hud.WAVE_DIFFICULTY_MARKS[i];
      expect(resolveWaveLabel(mark.minSec)).toEqual({ label: mark.label, color: mark.color });
    }
  });

  it('sticks on the last mark forever (no wrap-around)', () => {
    const last = BALANCE.hud.WAVE_DIFFICULTY_MARKS[BALANCE.hud.WAVE_DIFFICULTY_MARKS.length - 1];
    expect(resolveWaveLabel(last.minSec)).toEqual({ label: last.label, color: last.color });
    expect(resolveWaveLabel(last.minSec + 1000)).toEqual({ label: last.label, color: last.color });
    expect(resolveWaveLabel(Number.MAX_SAFE_INTEGER)).toEqual({ label: last.label, color: last.color });
  });

  it('handles negative time (game time before start — defensive) by returning mark 0', () => {
    const m0 = BALANCE.hud.WAVE_DIFFICULTY_MARKS[0];
    // Even with a negative sec, the first mark's minSec is 0 so loop picks it up.
    // The inline fallback also guards this — assert it still gives mark 0.
    expect(resolveWaveLabel(-1)).toEqual({ label: m0.label, color: m0.color });
  });

  it('returns one of the authored marks (never fabricates a label)', () => {
    const validLabels = BALANCE.hud.WAVE_DIFFICULTY_MARKS.map((m) => m.label);
    for (let t = 0; t < 2000; t += 37) {
      expect(validLabels).toContain(resolveWaveLabel(t).label);
    }
  });
});
