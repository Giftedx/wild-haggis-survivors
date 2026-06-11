import { describe, it, expect } from 'vitest';
import {
  createSelkieFormState,
  DEFAULT_SELKIE_FORM,
  getSelkieFormLabelKey,
  getSelkieFormModifiers,
  getSelkieRunStartPickupBonus,
  isCoastalAffinityBiome,
  shiftSelkieForm,
  toggleSelkieFormOnDashEdge,
} from './selkieForm';

describe('selkieForm.createSelkieFormState', () => {
  it('starts in the default haggis form with zero shifts', () => {
    const state = createSelkieFormState();
    expect(state.form).toBe(DEFAULT_SELKIE_FORM);
    expect(state.form).toBe('haggis');
    expect(state.shiftCount).toBe(0);
  });
});

describe('selkieForm.shiftSelkieForm', () => {
  it('alternates between haggis and seal across shifts', () => {
    const state = createSelkieFormState();
    expect(shiftSelkieForm(state)).toBe('seal');
    expect(state.shiftCount).toBe(1);
    expect(shiftSelkieForm(state)).toBe('haggis');
    expect(state.shiftCount).toBe(2);
    expect(shiftSelkieForm(state)).toBe('seal');
    expect(state.shiftCount).toBe(3);
  });
});

describe('selkieForm.toggleSelkieFormOnDashEdge', () => {
  it('is a no-op for non-selkie variants', () => {
    const state = createSelkieFormState();
    const result = toggleSelkieFormOnDashEdge(state, 'classic');
    expect(result).toBeNull();
    expect(state.form).toBe('haggis');
    expect(state.shiftCount).toBe(0);
  });

  it('shifts form on the selkie variant', () => {
    const state = createSelkieFormState();
    const result = toggleSelkieFormOnDashEdge(state, 'selkie');
    expect(result).toBe('seal');
    expect(state.form).toBe('seal');
  });
});

describe('selkieForm.getSelkieFormModifiers', () => {
  it('returns identity modifiers for haggis form', () => {
    const m = getSelkieFormModifiers('haggis');
    expect(m).toEqual({ speedMul: 1, driftMul: 1, pickupRadiusFlat: 0 });
  });

  it('returns a calmer faster seal form with pickup bonus', () => {
    const m = getSelkieFormModifiers('seal');
    expect(m.speedMul).toBeGreaterThan(1);
    expect(m.speedMul).toBeLessThan(1.25);
    expect(m.driftMul).toBeLessThan(1);
    expect(m.driftMul).toBeGreaterThan(0);
    expect(m.pickupRadiusFlat).toBeGreaterThan(0);
  });
});

describe('selkieForm.getSelkieFormLabelKey', () => {
  it('exposes both form labels under the ui.hud.selkie tree', () => {
    expect(getSelkieFormLabelKey('haggis')).toBe('ui.hud.selkie.haggis');
    expect(getSelkieFormLabelKey('seal')).toBe('ui.hud.selkie.seal');
  });
});

describe('selkieForm.getSelkieFormModifiers — coastal affinity (Phase 2)', () => {
  it('does not bloom for haggis form even in coastal biomes', () => {
    const base = getSelkieFormModifiers('haggis');
    const bloomed = getSelkieFormModifiers('haggis', 'loch');
    expect(bloomed).toEqual(base);
  });

  it('does not bloom for seal form in non-coastal biomes', () => {
    const base = getSelkieFormModifiers('seal');
    expect(getSelkieFormModifiers('seal', 'bog')).toEqual(base);
    expect(getSelkieFormModifiers('seal', 'heather')).toEqual(base);
    expect(getSelkieFormModifiers('seal', null)).toEqual(base);
    expect(getSelkieFormModifiers('seal', undefined)).toEqual(base);
  });

  it('blooms speedMul and pickupRadiusFlat on loch / pine biomes', () => {
    const base = getSelkieFormModifiers('seal');
    const lochBloom = getSelkieFormModifiers('seal', 'loch');
    const pineBloom = getSelkieFormModifiers('seal', 'pine');
    expect(lochBloom.speedMul).toBeGreaterThan(base.speedMul);
    expect(lochBloom.pickupRadiusFlat).toBeGreaterThan(base.pickupRadiusFlat);
    expect(pineBloom).toEqual(lochBloom);
  });

  it('bloom stays bounded — combined speed under 1.2 for sanity', () => {
    const lochBloom = getSelkieFormModifiers('seal', 'loch');
    expect(lochBloom.speedMul).toBeLessThan(1.2);
  });

  it('isCoastalAffinityBiome only flags loch/pine', () => {
    expect(isCoastalAffinityBiome('loch')).toBe(true);
    expect(isCoastalAffinityBiome('pine')).toBe(true);
    expect(isCoastalAffinityBiome('heather')).toBe(false);
    expect(isCoastalAffinityBiome('bog')).toBe(false);
    expect(isCoastalAffinityBiome(null)).toBe(false);
    expect(isCoastalAffinityBiome(undefined)).toBe(false);
  });
});

describe('selkieForm.getSelkieRunStartPickupBonus', () => {
  it('grants a small pickup-radius blessing only to the Selkie variant', () => {
    expect(getSelkieRunStartPickupBonus('selkie')).toBeGreaterThan(0);
    expect(getSelkieRunStartPickupBonus('selkie')).toBeLessThanOrEqual(20);
    expect(getSelkieRunStartPickupBonus('classic')).toBe(0);
    expect(getSelkieRunStartPickupBonus('moor_runner')).toBe(0);
  });
});
