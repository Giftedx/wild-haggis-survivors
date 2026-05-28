import { describe, expect, it } from 'vitest';
import { HAZARDS, HAZARD_KEYS } from './hazards';

// ---------------------------------------------------------------------------
// HAZARD_KEYS — catalog enumeration
// ---------------------------------------------------------------------------

describe('HAZARD_KEYS', () => {
  it('contains 25 entries', () => {
    expect(HAZARD_KEYS).toHaveLength(25);
  });

  it('has no duplicates', () => {
    expect(HAZARD_KEYS).toHaveLength(new Set(HAZARD_KEYS).size);
  });
});

// ---------------------------------------------------------------------------
// HAZARDS — catalog integrity
// ---------------------------------------------------------------------------

describe('HAZARDS catalog', () => {
  it('has an entry for every key in HAZARD_KEYS', () => {
    for (const key of HAZARD_KEYS) {
      expect(HAZARDS[key], `missing entry for key ${key}`).toBeDefined();
    }
  });

  it('entry count matches HAZARD_KEYS length', () => {
    expect(Object.keys(HAZARDS)).toHaveLength(HAZARD_KEYS.length);
  });

  it('key field on each entry matches the record key', () => {
    for (const [k, def] of Object.entries(HAZARDS)) {
      expect(def.key).toBe(k);
    }
  });

  it('texture follows the pattern hazard_<key>', () => {
    for (const [k, def] of Object.entries(HAZARDS)) {
      expect(def.texture).toBe(`hazard_${k}`);
    }
  });

  it('every entry has damage > 0', () => {
    for (const def of Object.values(HAZARDS)) {
      expect(def.damage, `damage <= 0 for ${def.key}`).toBeGreaterThan(0);
    }
  });

  it('every entry has hitboxRadius > 0', () => {
    for (const def of Object.values(HAZARDS)) {
      expect(def.hitboxRadius, `hitboxRadius <= 0 for ${def.key}`).toBeGreaterThan(0);
    }
  });

  it('every entry has lifetimeMs > 0', () => {
    for (const def of Object.values(HAZARDS)) {
      expect(def.lifetimeMs, `lifetimeMs <= 0 for ${def.key}`).toBeGreaterThan(0);
    }
  });

  it('every entry has spawnIntervalMs > 0', () => {
    for (const def of Object.values(HAZARDS)) {
      expect(def.spawnIntervalMs, `spawnIntervalMs <= 0 for ${def.key}`).toBeGreaterThan(0);
    }
  });

  it('no two hazards share the same biome', () => {
    const biomes = Object.values(HAZARDS).map((d) => d.biome);
    expect(biomes).toHaveLength(new Set(biomes).size);
  });

  it('biome field is a non-empty string on every entry', () => {
    for (const def of Object.values(HAZARDS)) {
      expect(typeof def.biome).toBe('string');
      expect(def.biome.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Specific spot checks
// ---------------------------------------------------------------------------

describe('hazard spot checks', () => {
  it('peat_pit is biome bog with damage 8', () => {
    expect(HAZARDS.peat_pit.biome).toBe('bog');
    expect(HAZARDS.peat_pit.damage).toBe(8);
  });

  it('falling_slate has highest damage in the original 7', () => {
    const original7 = ['peat_pit', 'falling_slate', 'burn_water', 'loose_scree', 'tidal_wrack', 'slick_cobble', 'rime_patch'] as const;
    const maxDamage = Math.max(...original7.map((k) => HAZARDS[k].damage));
    expect(HAZARDS.falling_slate.damage).toBe(maxDamage);
  });

  it('molten_slag has the highest damage in the catalog', () => {
    const maxDamage = Math.max(...Object.values(HAZARDS).map((d) => d.damage));
    expect(HAZARDS.molten_slag.damage).toBe(maxDamage);
  });

  it('burn_water biome is loch', () => {
    expect(HAZARDS.burn_water.biome).toBe('loch');
  });

  it('fire_pillar biome is calton_hill', () => {
    expect(HAZARDS.fire_pillar.biome).toBe('calton_hill');
  });

  it('musket_volley biome is jacobite_moor with damage 9', () => {
    expect(HAZARDS.musket_volley.biome).toBe('jacobite_moor');
    expect(HAZARDS.musket_volley.damage).toBe(9);
  });
});
