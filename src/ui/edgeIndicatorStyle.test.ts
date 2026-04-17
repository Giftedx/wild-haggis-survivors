import { describe, it, expect } from 'vitest';
import {
  resolveEdgeIndicatorStyle,
  EDGE_INDICATOR_BOSS_COLOR,
  EDGE_INDICATOR_REGULAR_COLOR,
} from './edgeIndicatorStyle';

describe('resolveEdgeIndicatorStyle — 3 threat tiers', () => {
  it('boss uses warm gold + biggest pulse + strongest halo', () => {
    const s = resolveEdgeIndicatorStyle('boss', 0);
    expect(s.color).toBe(EDGE_INDICATOR_BOSS_COLOR);
    expect(s.scaleMul).toBe(1.6);
    expect(s.glowAlpha).toBe(0.2);
    expect(s.glowRadiusOffset).toBe(5);
  });

  it('elite uses the affix-injected tint at medium scale + alpha', () => {
    const affix = 0x33ddff;
    const s = resolveEdgeIndicatorStyle('elite', affix);
    expect(s.color).toBe(affix);
    expect(s.scaleMul).toBe(1.1);
    expect(s.glowAlpha).toBe(0.12);
  });

  it('regular uses the red palette at unit scale + lightest halo', () => {
    const s = resolveEdgeIndicatorStyle('regular', 0);
    expect(s.color).toBe(EDGE_INDICATOR_REGULAR_COLOR);
    expect(s.scaleMul).toBe(1.0);
    expect(s.glowAlpha).toBe(0.1);
  });

  it('scale and glow alpha both strictly decrease from boss → elite → regular', () => {
    const boss = resolveEdgeIndicatorStyle('boss', 0);
    const elite = resolveEdgeIndicatorStyle('elite', 0xffffff);
    const reg = resolveEdgeIndicatorStyle('regular', 0);
    expect(boss.scaleMul).toBeGreaterThan(elite.scaleMul);
    expect(elite.scaleMul).toBeGreaterThan(reg.scaleMul);
    expect(boss.glowAlpha).toBeGreaterThan(elite.glowAlpha);
    expect(elite.glowAlpha).toBeGreaterThan(reg.glowAlpha);
  });

  it('boss glow extends further than elite + regular (visual weight)', () => {
    const boss = resolveEdgeIndicatorStyle('boss', 0);
    const elite = resolveEdgeIndicatorStyle('elite', 0);
    const reg = resolveEdgeIndicatorStyle('regular', 0);
    expect(boss.glowRadiusOffset).toBeGreaterThan(elite.glowRadiusOffset);
    expect(elite.glowRadiusOffset).toBe(reg.glowRadiusOffset);
  });
});
