import { describe, it, expect } from 'vitest';
import { resolveCardRarityGlowStyle, LOW_RARITY_GLOW_COLOR } from './cardRarityGlowStyle';
import { RARITY_COLORS } from '../data/upgrades';

describe('resolveCardRarityGlowStyle — 3 visual tiers across 4 rarities', () => {
  it('legendary uses the widest pad + brightest alpha, tinted with border colour', () => {
    const s = resolveCardRarityGlowStyle('legendary', RARITY_COLORS.legendary);
    expect(s.padExpand).toBe(8);
    expect(s.alpha).toBe(0.15);
    expect(s.color).toBe(RARITY_COLORS.legendary);
  });

  it('rare uses a smaller pad + softer alpha, still tinted with border colour', () => {
    const s = resolveCardRarityGlowStyle('rare', RARITY_COLORS.rare);
    expect(s.padExpand).toBe(4);
    expect(s.alpha).toBe(0.1);
    expect(s.color).toBe(RARITY_COLORS.rare);
  });

  it('common + uncommon fall into one low-rarity bucket (both get the warm gold wash)', () => {
    const common = resolveCardRarityGlowStyle('common', RARITY_COLORS.common);
    const uncommon = resolveCardRarityGlowStyle('uncommon', RARITY_COLORS.uncommon);
    expect(common).toEqual(uncommon);
    expect(common.color).toBe(LOW_RARITY_GLOW_COLOR);
    expect(common.alpha).toBe(0.04);
    expect(common.padExpand).toBe(2);
  });

  it('low-rarity glow ignores the rarity border colour (single warm-gold identity)', () => {
    const s = resolveCardRarityGlowStyle('uncommon', 0xff00ff);
    expect(s.color).toBe(LOW_RARITY_GLOW_COLOR);
  });

  it('pad and alpha both strictly decrease from legendary → rare → common', () => {
    const leg = resolveCardRarityGlowStyle('legendary', 0);
    const rare = resolveCardRarityGlowStyle('rare', 0);
    const com = resolveCardRarityGlowStyle('common', 0);
    expect(leg.padExpand).toBeGreaterThan(rare.padExpand);
    expect(rare.padExpand).toBeGreaterThan(com.padExpand);
    expect(leg.alpha).toBeGreaterThan(rare.alpha);
    expect(rare.alpha).toBeGreaterThan(com.alpha);
  });

  it('rune sits between rare and legendary: tinted with its border, mid-pad + mid-alpha', () => {
    const s = resolveCardRarityGlowStyle('rune', RARITY_COLORS.rune);
    expect(s.color).toBe(RARITY_COLORS.rune);
    expect(s.padExpand).toBeGreaterThan(4); // > rare
    expect(s.padExpand).toBeLessThan(8);    // < legendary
    expect(s.alpha).toBeGreaterThan(0.1);   // > rare
    expect(s.alpha).toBeLessThan(0.15);     // < legendary
  });
});

describe('mythic — Phase B Endless Overcharge tier', () => {
  it('mythic sits above legendary: widest pad, loudest alpha, tinted border', () => {
    const s = resolveCardRarityGlowStyle('mythic', RARITY_COLORS.mythic);
    expect(s.color).toBe(RARITY_COLORS.mythic);
    expect(s.padExpand).toBeGreaterThan(8); // > legendary
    expect(s.alpha).toBeGreaterThan(0.15); // > legendary
  });
});
