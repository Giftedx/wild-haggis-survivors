import { describe, expect, it } from 'vitest';
import {
  buildSporranPipsForChronicle,
  formatSporranPicksForChronicle,
} from './chronicleSporranPips';
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
    expect(pips).toHaveLength(3);
    expect(pips[0]).toMatchObject({
      kind: 'curse',
      color: SPORRAN_KIND_ACCENT.curse,
      cardId: 'curse_heavy_legs',
    });
    expect(pips[1]).toMatchObject({
      kind: 'boon',
      color: SPORRAN_KIND_ACCENT.boon,
      cardId: 'boon_silver',
      nameKey: 'sporran.boon.silver.name',
    });
    expect(pips[2]).toMatchObject({
      kind: 'quirk',
      color: SPORRAN_KIND_ACCENT.quirk,
      cardId: 'quirk_haggis_blooded',
      nameKey: 'sporran.quirk.haggis_blooded.name',
    });
  });

  it('threads each pickable card id to its i18n nameKey', () => {
    const pips = buildSporranPipsForChronicle([
      'boon_whisky',
      'rare_taxman_grudge',
      'seasonal_st_andrews_saltire',
    ]);
    expect(pips.map((p) => p.nameKey)).toEqual([
      'sporran.boon.whisky.name',
      'sporran.rare.taxman_grudge.name',
      'sporran.seasonal.st_andrews_saltire.name',
    ]);
  });

  it('uses a fallback descriptor for renamed / removed card ids', () => {
    const pips = buildSporranPipsForChronicle([
      'boon_silver',
      'curse_obsolete_xyz',
      'boon_coal',
    ]);
    expect(pips.map((p) => p.cardId)).toEqual(['boon_silver', 'curse_obsolete_xyz', 'boon_coal']);
    expect(pips[1]).toMatchObject({
      nameKey: 'sporran.chronicle.unknown_name',
      effectKey: 'sporran.chronicle.unknown_effect',
      isFallback: true,
    });
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
describe('formatSporranPicksForChronicle', () => {
  const resolve = (key: string): string => {
    const labels: Record<string, string> = {
      'ui.chronicle.sporran_summary_prefix': 'Sporran',
      'sporran.boon.silver.name': 'Silver Sixpence',
      'sporran.boon.coal.name': "Lump o' Coal",
      'sporran.chronicle.unknown_name': 'Old charm',
      'sporran.chronicle.unknown_effect': 'ink faded',
      'sporran.chronicle.effect.boon_silver': '+10% gold',
      'sporran.chronicle.effect.boon_coal': 'softer hits',
    };
    return labels[key] ?? key;
  };

  it('returns compact picked card names and effects with removed-id fallback', () => {
    const summary = formatSporranPicksForChronicle([
      'boon_silver',
      'removed_card_from_old_save',
      'boon_coal',
    ], resolve);

    expect(summary).toEqual({
      rowText: "Sporran: Silver Sixpence (+10% gold) · Old charm (ink faded) · Lump o' Coal (softer hits)",
      tooltipText: [
        'Sporran',
        'Silver Sixpence — +10% gold',
        'Old charm — ink faded',
        "Lump o' Coal — softer hits",
      ].join('\n'),
    });
  });

  it('returns null when there are no picked cards to show', () => {
    expect(formatSporranPicksForChronicle(undefined, resolve)).toBeNull();
    expect(formatSporranPicksForChronicle([], resolve)).toBeNull();
  });
});
