import { describe, it, expect } from 'vitest';
import {
  resolveXpGemTier,
  XP_GEM_BOSS_COLOR,
  XP_GEM_ELITE_COLOR,
  XP_GEM_MAX_SCALE,
  XP_GEM_ELITE_THRESHOLD,
  XP_GEM_BOSS_THRESHOLD,
} from './xpGemTier';

describe('resolveXpGemTier — 3 tiers × shared scale formula', () => {
  it('regular gem (value=1) has no tint, no aura, no label', () => {
    const s = resolveXpGemTier(1);
    expect(s.tint).toBeNull();
    expect(s.aura).toBeNull();
    expect(s.showLabel).toBe(false);
  });

  it('elite gem (value ≥ 3 < 5) uses pale gold + medium aura + label', () => {
    const s = resolveXpGemTier(XP_GEM_ELITE_THRESHOLD);
    expect(s.tint).toBe(XP_GEM_ELITE_COLOR);
    expect(s.aura).toEqual({ color: XP_GEM_ELITE_COLOR, radius: 10 });
    expect(s.showLabel).toBe(true);
  });

  it('boss gem (value ≥ 5) uses bright white + big aura + label', () => {
    const s = resolveXpGemTier(XP_GEM_BOSS_THRESHOLD);
    expect(s.tint).toBe(XP_GEM_BOSS_COLOR);
    expect(s.aura).toEqual({ color: XP_GEM_BOSS_COLOR, radius: 14 });
    expect(s.showLabel).toBe(true);
  });

  it('aura colour always matches tint colour (single-identity per tier)', () => {
    const elite = resolveXpGemTier(3);
    const boss = resolveXpGemTier(7);
    expect(elite.aura?.color).toBe(elite.tint!);
    expect(boss.aura?.color).toBe(boss.tint!);
  });

  it('boss aura radius > elite aura radius (visual weight ordering)', () => {
    const elite = resolveXpGemTier(3);
    const boss = resolveXpGemTier(5);
    expect(boss.aura!.radius).toBeGreaterThan(elite.aura!.radius);
  });

  it('scale grows with value up to XP_GEM_MAX_SCALE', () => {
    expect(resolveXpGemTier(1).scale).toBeLessThan(resolveXpGemTier(3).scale);
    expect(resolveXpGemTier(3).scale).toBeLessThan(resolveXpGemTier(6).scale);
    // 0.8 + 100*0.15 = 15.8 → clamped to XP_GEM_MAX_SCALE.
    expect(resolveXpGemTier(100).scale).toBe(XP_GEM_MAX_SCALE);
  });

  it('boundary values: exactly 3 is elite, exactly 5 is boss', () => {
    expect(resolveXpGemTier(3).tint).toBe(XP_GEM_ELITE_COLOR);
    expect(resolveXpGemTier(5).tint).toBe(XP_GEM_BOSS_COLOR);
  });

  it('just below elite threshold is regular', () => {
    expect(resolveXpGemTier(2).tint).toBeNull();
  });
});
