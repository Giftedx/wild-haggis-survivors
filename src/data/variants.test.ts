import { describe, expect, it } from 'vitest';
import {
  VARIANTS,
  VARIANT_KEYS,
  getVariantByKey,
  isVariantKey,
  formatVariantModifierSummary,
  type VariantKey,
} from './variants';
import { t } from '../core/i18n';

describe('variants', () => {
  it('has at least 6 variants', () => {
    expect(VARIANTS.length).toBeGreaterThanOrEqual(6);
  });

  it('VARIANT_KEYS matches VARIANTS array keys', () => {
    expect(VARIANT_KEYS).toEqual(VARIANTS.map((v) => v.key));
  });

  it('every variant has valid i18n name and flavor keys', () => {
    for (const variant of VARIANTS) {
      const name = t(variant.nameKey);
      const flavor = t(variant.flavorKey);
      expect(name, `${variant.key} nameKey not resolved`).not.toBe(variant.nameKey);
      expect(flavor, `${variant.key} flavorKey not resolved`).not.toBe(variant.flavorKey);
      expect(name.length).toBeGreaterThan(0);
      expect(flavor.length).toBeGreaterThan(0);
    }
  });

  it('every variant key is unique', () => {
    const keys = new Set(VARIANTS.map((v) => v.key));
    expect(keys.size).toBe(VARIANTS.length);
  });

  it('every variant has a unique textureKey', () => {
    const textures = new Set(VARIANTS.map((v) => v.textureKey));
    expect(textures.size).toBe(VARIANTS.length);
  });

  it('getVariantByKey returns correct variants', () => {
    for (const key of VARIANT_KEYS) {
      const v = getVariantByKey(key);
      expect(v.key).toBe(key);
    }
  });

  it('getVariantByKey falls back to classic for unknown keys', () => {
    const v = getVariantByKey('nonexistent' as VariantKey);
    expect(v.key).toBe('classic');
  });

  it('isVariantKey validates correctly', () => {
    expect(isVariantKey('classic')).toBe(true);
    expect(isVariantKey('pipe_breath')).toBe(true);
    expect(isVariantKey('bogus')).toBe(false);
    expect(isVariantKey(42)).toBe(false);
  });

  it('classic variant has no unlock condition (type: default)', () => {
    const classic = getVariantByKey('classic');
    expect(classic.unlock.type).toBe('default');
  });

  it('all non-default variants have positive unlock requirements', () => {
    for (const variant of VARIANTS) {
      if (variant.unlock.type !== 'default') {
        const req = (variant.unlock as any).required;
        expect(req, `${variant.key} has non-positive unlock requirement`).toBeGreaterThan(0);
      }
    }
  });

  it('formatVariantModifierSummary returns baseline copy when modifiers are empty', () => {
    expect(formatVariantModifierSummary(getVariantByKey('classic'))).toBe(t('variant.summary.baseline'));
  });

  it('formatVariantModifierSummary joins modifier lines when present', () => {
    const summary = formatVariantModifierSummary(getVariantByKey('moor_runner'));
    expect(summary).not.toBe(t('variant.summary.baseline'));
    expect(summary.length).toBeGreaterThan(0);
    expect(summary).toContain('  |  ');
  });
});
