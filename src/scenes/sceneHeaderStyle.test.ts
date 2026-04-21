import { describe, it, expect } from 'vitest';
import {
  sceneHeaderTextStyle,
  sceneSubtitleTextStyle,
} from './sceneHeaderStyle';

describe('sceneHeaderTextStyle — shared bold-stroke title', () => {
  it('passes through caller-supplied fontSize and color', () => {
    const s = sceneHeaderTextStyle('30px', '#d4a017');
    expect(s.fontSize).toBe('30px');
    expect(s.color).toBe('#d4a017');
  });

  it('always pins monospace, bold weight, black 4px stroke', () => {
    const s = sceneHeaderTextStyle('28px', '#e8a0c6');
    expect(s.fontFamily).toBe('monospace');
    expect(s.fontStyle).toBe('bold');
    expect(s.stroke).toBe('#000');
    expect(s.strokeThickness).toBe(4);
  });

  it('returns a fresh object per call (no shared mutable state)', () => {
    const a = sceneHeaderTextStyle('20px', '#fff');
    const b = sceneHeaderTextStyle('20px', '#fff');
    expect(a).not.toBe(b);
  });
});

describe('sceneSubtitleTextStyle — italic mood / progress subtitle', () => {
  it('passes through caller-supplied color', () => {
    const s = sceneSubtitleTextStyle('#7f8ca7', 800);
    expect(s.color).toBe('#7f8ca7');
  });

  it('pins monospace 13px italic centered', () => {
    const s = sceneSubtitleTextStyle('#fff', 800);
    expect(s.fontFamily).toBe('monospace');
    expect(s.fontSize).toBe('13px');
    expect(s.fontStyle).toBe('italic');
    expect(s.align).toBe('center');
  });

  it('word-wraps to sceneWidth - 60 px', () => {
    expect(sceneSubtitleTextStyle('#fff', 800).wordWrap?.width).toBe(740);
    expect(sceneSubtitleTextStyle('#fff', 600).wordWrap?.width).toBe(540);
  });
});
