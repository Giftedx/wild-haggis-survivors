import { describe, it, expect } from 'vitest';
import {
  resolveVariantChipStyle,
  shouldSpawnVariantSparkles,
  variantChipSparkleSpec,
} from './gameOverVariantChip';

describe('resolveVariantChipStyle', () => {
  it('no unlock keeps default 1px stroke', () => {
    expect(resolveVariantChipStyle(false).strokeWidth).toBe(1);
  });

  it('unlock bumps stroke to 2px', () => {
    expect(resolveVariantChipStyle(true).strokeWidth).toBe(2);
  });

  it('haggis scale is larger than the previous 1.4', () => {
    const a = resolveVariantChipStyle(false).haggisScale;
    const b = resolveVariantChipStyle(true).haggisScale;
    expect(a).toBeGreaterThan(1.4);
    expect(b).toBeGreaterThan(1.4);
  });
});

describe('shouldSpawnVariantSparkles', () => {
  it('no unlock — no sparkles', () => {
    expect(shouldSpawnVariantSparkles([], false)).toBe(false);
  });

  it('unlock without reduceParticles — sparkles fire', () => {
    expect(shouldSpawnVariantSparkles(['moor_runner'], false)).toBe(true);
  });

  it('unlock with reduceParticles — sparkles suppressed', () => {
    expect(shouldSpawnVariantSparkles(['moor_runner'], true)).toBe(false);
  });

  it('undefined payload field is treated as empty', () => {
    expect(shouldSpawnVariantSparkles(undefined, false)).toBe(false);
  });
});

describe('variantChipSparkleSpec', () => {
  it('returns 4 sparkle specs — one per corner', () => {
    const specs = variantChipSparkleSpec(500, 300, 600);
    expect(specs).toHaveLength(4);
  });

  it('sparkles straddle chip horizontal edges', () => {
    const specs = variantChipSparkleSpec(500, 300, 600);
    const leftXs = specs.filter((s) => s.x < 500).map((s) => s.x);
    const rightXs = specs.filter((s) => s.x > 500).map((s) => s.x);
    expect(leftXs).toHaveLength(2);
    expect(rightXs).toHaveLength(2);
    // Each side pair straddles the chip edge (halfW = 300).
    for (const x of leftXs) expect(500 - x).toBeGreaterThan(300);
    for (const x of rightXs) expect(x - 500).toBeGreaterThan(300);
  });

  it('delays increase across sparkles — stagger order preserved', () => {
    const specs = variantChipSparkleSpec(500, 300, 600);
    for (let i = 1; i < specs.length; i++) {
      expect(specs[i].delay).toBeGreaterThan(specs[i - 1].delay);
    }
  });

  it('all sparkles have positive radius (visible)', () => {
    for (const s of variantChipSparkleSpec(100, 100, 200)) {
      expect(s.radius).toBeGreaterThan(0);
    }
  });
});
