import { describe, it, expect } from 'vitest';
import {
  resolveChronicleRowVictoryStyle,
  CHRONICLE_WIN_BADGE,
  CHRONICLE_LOSS_BADGE,
} from './chronicleRowVictoryStyle';

describe('resolveChronicleRowVictoryStyle — 2-state row identity', () => {
  it('victory uses the "✦ WIN" badge and bold warm gold', () => {
    const s = resolveChronicleRowVictoryStyle(true);
    expect(s.badgeLabel).toBe(CHRONICLE_WIN_BADGE);
    expect(s.badgeColor).toBe('#f7d27a');
    expect(s.mainColor).toBe('#f5e1a6');
    expect(s.mainFontStyle).toBe('bold');
  });

  it('defeat uses the "FELL" badge and quiet slate', () => {
    const s = resolveChronicleRowVictoryStyle(false);
    expect(s.badgeLabel).toBe(CHRONICLE_LOSS_BADGE);
    expect(s.badgeColor).toBe('#9aa4bb');
    expect(s.mainColor).toBe('#d6dde7');
    expect(s.mainFontStyle).toBe('normal');
  });

  it('victory is bold; defeat is normal (weight reads the outcome)', () => {
    expect(resolveChronicleRowVictoryStyle(true).mainFontStyle).toBe('bold');
    expect(resolveChronicleRowVictoryStyle(false).mainFontStyle).toBe('normal');
  });

  it('all four fields differ between the two outcomes', () => {
    const win = resolveChronicleRowVictoryStyle(true);
    const loss = resolveChronicleRowVictoryStyle(false);
    expect(win.badgeLabel).not.toBe(loss.badgeLabel);
    expect(win.badgeColor).not.toBe(loss.badgeColor);
    expect(win.mainColor).not.toBe(loss.mainColor);
    expect(win.mainFontStyle).not.toBe(loss.mainFontStyle);
  });
});
