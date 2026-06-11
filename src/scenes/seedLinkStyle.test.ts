import { describe, it, expect } from 'vitest';
import { resolveSeedLinkStyle } from './seedLinkStyle';

const HOVER = '#d4a017';

describe('resolveSeedLinkStyle — 2 states × 2 contrast modes', () => {
  it('default (not HC) uses muted blue-grey idle, thin stroke', () => {
    const s = resolveSeedLinkStyle(false, HOVER);
    expect(s.idle.color).toBe('#8e9bb8');
    expect(s.idle.strokeThickness).toBe(2);
    expect(s.hover.strokeThickness).toBe(3);
  });

  it('high-contrast lifts the idle colour and adds a pixel to every stroke', () => {
    const s = resolveSeedLinkStyle(true, HOVER);
    expect(s.idle.color).toBe('#b8c6dc');
    expect(s.idle.strokeThickness).toBe(3);
    expect(s.hover.strokeThickness).toBe(4);
  });

  it('hover colour is carried through unchanged (scene injects its palette)', () => {
    expect(resolveSeedLinkStyle(false, HOVER).hover.color).toBe(HOVER);
    expect(resolveSeedLinkStyle(true, '#ff00ff').hover.color).toBe('#ff00ff');
  });

  it('hover stroke is pure black; idle stroke is the near-black #06080c', () => {
    const s = resolveSeedLinkStyle(false, HOVER);
    expect(s.idle.stroke).toBe('#06080c');
    expect(s.hover.stroke).toBe('#000000');
  });

  it('HC always adds exactly +1 to both idle and hover stroke thickness', () => {
    const base = resolveSeedLinkStyle(false, HOVER);
    const hc = resolveSeedLinkStyle(true, HOVER);
    expect(hc.idle.strokeThickness - base.idle.strokeThickness).toBe(1);
    expect(hc.hover.strokeThickness - base.hover.strokeThickness).toBe(1);
  });
});
