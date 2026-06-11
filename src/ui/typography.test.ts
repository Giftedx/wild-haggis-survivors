import { describe, it, expect } from 'vitest';
import {
  FONT_SCALE,
  textStyle,
  type FontRole,
} from './typography';

describe('FONT_SCALE', () => {
  it('defines all 7 roles', () => {
    const roles: FontRole[] = [
      'display', 'title', 'heading', 'body', 'label', 'small', 'subtitle',
    ];
    for (const role of roles) {
      expect(FONT_SCALE[role]).toBeDefined();
      expect(FONT_SCALE[role].size).toMatch(/^\d+px$/);
    }
  });

  it('sizes decrease from display to small', () => {
    const ordered: FontRole[] = ['display', 'title', 'heading', 'body', 'label', 'small'];
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = parseInt(FONT_SCALE[ordered[i]].size);
      const b = parseInt(FONT_SCALE[ordered[i + 1]].size);
      expect(a).toBeGreaterThan(b);
    }
  });
});

describe('textStyle', () => {
  it('returns correct fontFamily', () => {
    const s = textStyle('body');
    expect(s.fontFamily).toBe('monospace');
  });

  it('applies color override', () => {
    const s = textStyle('body', { color: '#ff0000' });
    expect(s.color).toBe('#ff0000');
  });

  it('uses white as default color', () => {
    const s = textStyle('body');
    expect(s.color).toBe('#ffffff');
  });

  it('subtitle role uses italic', () => {
    const s = textStyle('subtitle');
    expect(s.fontStyle).toBe('italic');
  });

  it('non-subtitle roles use bold', () => {
    const s = textStyle('title');
    expect(s.fontStyle).toBe('bold');
  });

  it('applies stroke for non-subtitle roles', () => {
    const s = textStyle('title');
    expect(s.stroke).toBe('#000');
    expect(s.strokeThickness).toBe(4);
  });

  it('subtitle has no stroke by default', () => {
    const s = textStyle('subtitle');
    expect(s.strokeThickness).toBe(0);
  });

  it('align option is passed through', () => {
    const s = textStyle('body', { align: 'center' });
    expect(s.align).toBe('center');
  });

  it('wordWrap option is passed through', () => {
    const s = textStyle('subtitle', { wordWrap: { width: 300 } });
    expect(s.wordWrap).toEqual({ width: 300 });
  });
});
