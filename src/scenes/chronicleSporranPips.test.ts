import { describe, expect, it } from 'vitest';
import { buildSporranPipsForChronicle } from './chronicleSporranPips';
import { SPORRAN_KIND_ACCENT } from './sporranTileLayout';

describe('buildSporranPipsForChronicle', () => {
  it('returns [] for absent picks', () => {
    expect(buildSporranPipsForChronicle(undefined)).toEqual([]);
  });

  it('returns [] for empty picks', () => {
    expect(buildSporranPipsForChronicle([])).toEqual([]);
  });

  it('returns [] for non-array input (defensive)', () => {
    // @ts-expect-error — deliberately bad
    expect(buildSporranPipsForChronicle(null)).toEqual([]);
    // @ts-expect-error — deliberately bad
    expect(buildSporranPipsForChronicle('boon_silver')).toEqual([]);
  });

  it('resolves a curse + boon + quirk triple into kind-coloured pips in order', () => {
    const pips = buildSporranPipsForChronicle([
      'curse_heavy_legs',
      'boon_silver',
      'quirk_haggis_blooded',
    ]);
    expect(pips).toEqual([
      { kind: 'curse', color: SPORRAN_KIND_ACCENT.curse, cardId: 'curse_heavy_legs' },
      { kind: 'boon', color: SPORRAN_KIND_ACCENT.boon, cardId: 'boon_silver' },
      { kind: 'quirk', color: SPORRAN_KIND_ACCENT.quirk, cardId: 'quirk_haggis_blooded' },
    ]);
  });

  it('drops unknown ids silently (renamed / removed cards)', () => {
    const pips = buildSporranPipsForChronicle([
      'boon_silver',
      'curse_obsolete_xyz',
      'boon_coal',
    ]);
    expect(pips.map((p) => p.cardId)).toEqual(['boon_silver', 'boon_coal']);
  });

  it('drops non-string / empty entries (defensive against malformed save)', () => {
    // Build a deliberately mixed array via `unknown[]` so TS doesn't widen the
    // literal to `(string | null | number)[]` and erase the helper's defensive
    // narrowing path.
    const malformed: unknown[] = ['boon_silver', null, 42, '', 'boon_coal'];
    const pips = buildSporranPipsForChronicle(malformed as readonly string[]);
    expect(pips.map((p) => p.cardId)).toEqual(['boon_silver', 'boon_coal']);
  });

  it('preserves insertion order across mixed kinds', () => {
    const pips = buildSporranPipsForChronicle([
      'quirk_light_step',
      'curse_thin_hide',
      'boon_whisky',
    ]);
    expect(pips.map((p) => p.kind)).toEqual(['quirk', 'curse', 'boon']);
  });

  it('every kind in the pool resolves to a distinct accent colour', () => {
    const pips = buildSporranPipsForChronicle([
      'curse_heavy_legs',
      'boon_silver',
      'quirk_haggis_blooded',
    ]);
    const colours = new Set(pips.map((p) => p.color));
    expect(colours.size).toBe(3);
  });
});
