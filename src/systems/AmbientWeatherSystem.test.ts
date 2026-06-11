import { describe, it, expect } from 'vitest';
import { pickWeatherMode } from './AmbientWeatherSystem';

describe('pickWeatherMode (season → ambient weather mapping)', () => {
  it('maps samhain → drizzle (smirr)', () => {
    expect(pickWeatherMode('samhain')).toBe('drizzle');
  });

  it('maps beltane → sun_shaft', () => {
    expect(pickWeatherMode('beltane')).toBe('sun_shaft');
  });

  it('maps hogmanay → stonehaven_fireballs (Aberdeenshire procession)', () => {
    expect(pickWeatherMode('hogmanay')).toBe('stonehaven_fireballs');
  });

  it('maps burns_night → rain', () => {
    expect(pickWeatherMode('burns_night')).toBe('rain');
  });

  it('maps st_andrews → aurora (Mirrie Dancers)', () => {
    expect(pickWeatherMode('st_andrews')).toBe('aurora');
  });

  it('maps imbolc → lambing_motes (Brigid\'s mantle)', () => {
    expect(pickWeatherMode('imbolc')).toBe('lambing_motes');
  });

  it('maps lammas → harvest_drift (chaff on the wind)', () => {
    expect(pickWeatherMode('lammas')).toBe('harvest_drift');
  });

  it('maps bracken_turn → bracken_drift (copper-leaf fall)', () => {
    expect(pickWeatherMode('bracken_turn')).toBe('bracken_drift');
  });

  it('maps up_helly_aa → up_helly_aa_embers (Lerwick galley sparks)', () => {
    expect(pickWeatherMode('up_helly_aa')).toBe('up_helly_aa_embers');
  });

  it('maps bannockburn → bannockburn_dust (the air remembers the haugh)', () => {
    expect(pickWeatherMode('bannockburn')).toBe('bannockburn_dust');
  });

  it('maps glorious_twelfth → grouse_feather_drift (feathers on the moor wind)', () => {
    expect(pickWeatherMode('glorious_twelfth')).toBe('grouse_feather_drift');
  });

  it('returns null when no event is active', () => {
    expect(pickWeatherMode(null)).toBe(null);
  });

  it('returns null for an unknown event key (defensive)', () => {
    expect(pickWeatherMode('not_a_real_event')).toBe(null);
  });
});
