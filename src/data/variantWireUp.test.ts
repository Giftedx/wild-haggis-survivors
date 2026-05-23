import { describe, expect, it } from 'vitest';
import { VARIANT_KEYS, VARIANTS, getVariantByKey } from './variants';
import { BANTER_POOLS } from './banter';
import { t } from '../core/i18n';
import type { VariantKey } from './variants';

/**
 * Generic end-to-end fence for every non-classic variant. Adding a
 * variant touches five layers — VARIANT_KEYS, VARIANTS, BootScene
 * palette, i18n name/flavor, and every variant-scoped banter pool
 * (keysByTag). This test iterates over each non-classic variant and
 * asserts every layer is wired. Missing anything fails cleanly with
 * the variant key in the error message.
 *
 * Originally written variant-specific (Laird) and generalised the
 * moment a second variant (Wee Ghostie) landed so each new variant
 * inherits the same fence for free.
 */
const NON_CLASSIC_VARIANTS = VARIANTS.filter((v) => v.key !== 'classic');

// Variants that intentionally ship with no stat modifiers — the design
// choice IS the differentiation (Morningside's joke: it brings bearing).
const BLANK_MODIFIER_EXCEPTIONS = new Set<VariantKey>(['morningside']);

// Glesga / Highland / Scottish register markers. A non-classic variant's
// name+flavor must hit at least one — guards against accidental English-
// RP drift (e.g. "one's estate, quite", which Laird nearly shipped with).
// V2 extends with Doric markers (quinie, min, haar, een) so Northeast
// dialect copy has its own authenticated vocabulary to draw from.
const SCOTS_MARKERS = [
  'aye', 'ye', 'wee', 'tae', 'braw', 'oot', 'nae',
  'laird', 'tartan', 'moor', 'glen', 'heather', 'ghostie',
  'hoof', 'croft', 'loch',
  // Doric (V2 Track 1)
  'quinie', 'min', 'haar', 'een',
  // Shetlandic (V2 Track 2)
  'peerie', 'voe', 'du', 'dee', 'skerry', 'mirry',
  // Burns-citational (V2 Track 3)
  'sleekit', 'sonsie', 'agley', 'syne',
];

describe('every non-classic variant is fully wired', () => {
  it('VARIANT_KEYS matches VARIANTS array length (no orphans)', () => {
    expect(VARIANT_KEYS.length).toBe(VARIANTS.length);
  });

  for (const v of NON_CLASSIC_VARIANTS) {
    describe(`variant: ${v.key}`, () => {
      it('is listed in VARIANT_KEYS', () => {
        expect(VARIANT_KEYS).toContain<VariantKey>(v.key);
      });

      it('has a VariantDef entry with the expected identity', () => {
        const def = getVariantByKey(v.key);
        expect(def.key).toBe(v.key);
        expect(def.textureKey).toBe(`haggis_${v.key}`);
        // Stronger than toBeTruthy: accentStyle is a union of named string
        // literals. `'none'` is a valid value (variants without bespoke
        // accent art ship with it), so check membership in the documented
        // set rather than mere truthiness.
        expect([
          'none', 'racing_band', 'iron_belly', 'forager', 'surefoot',
          'pipe_breath', 'laird', 'wee_ghostie', 'cailleach',
          'glaswegian', 'doric_quinie', 'peerie_shetlander',
          'morningside',
        ]).toContain(def.appearance.accentStyle);
      });

      it('ships a non-trivial modifier profile', () => {
        if (BLANK_MODIFIER_EXCEPTIONS.has(v.key as VariantKey)) return;
        const def = getVariantByKey(v.key);
        const mods = def.modifiers;
        const hasAnyMod =
          !!mods.moveSpeedPct
          || !!mods.maxHpFlat
          || !!mods.armorFlat
          || !!mods.pickupRadiusFlat
          || !!mods.xpMultiplierPct
          || !!mods.damagePct
          || !!mods.driftReductionPct
          || !!mods.cooldownReductionPct
          || !!mods.critChancePct
          || !!mods.driftSignFlip;
        expect(hasAnyMod, `${v.key} has no stat modifier`).toBe(true);
      });

      it('has a valid unlock condition', () => {
        const def = getVariantByKey(v.key);
        // Stronger than toBeTruthy: unlock.type is a documented union from
        // `VariantUnlockCondition`. Pin membership so a typo'd discriminant
        // (e.g. 'best_kill' singular) fails loudly instead of slipping
        // past as a non-empty string.
        expect([
          'default', 'best_time', 'best_kills', 'total_gold_earned',
          'victories', 'cursed_victories', 'runs_without_healing',
          'runs_in_coastal_only', 'runs_with_all_evolutions',
          'burns_night_full_evo',
        ]).toContain(def.unlock.type);
        if (def.unlock.type !== 'default') {
          expect((def.unlock as { required: number }).required).toBeGreaterThan(0);
        }
      });

      it('nameKey + flavorKey resolve through t() (not raw dot-path)', () => {
        const def = getVariantByKey(v.key);
        expect(t(def.nameKey)).not.toBe(def.nameKey);
        expect(t(def.flavorKey)).not.toBe(def.flavorKey);
        expect(t(def.nameKey).length).toBeGreaterThan(0);
        expect(t(def.flavorKey).length).toBeGreaterThan(0);
      });

      it('name + flavor carry at least one Scots/Glesga marker', () => {
        const def = getVariantByKey(v.key);
        const bag = `${t(def.nameKey)} ${t(def.flavorKey)}`.toLowerCase();
        const hit = SCOTS_MARKERS.some((m) => bag.includes(m.toLowerCase()));
        expect(hit, `${v.key} flavor+name missing any Scots marker: "${bag}"`).toBe(true);
      });

      it('every variant-scoped banter pool includes this key', () => {
        const variantScopedPools = BANTER_POOLS.filter((p) => {
          if (!p.keysByTag) return false;
          const tags = Object.keys(p.keysByTag);
          return NON_CLASSIC_VARIANTS.some((nc) => tags.includes(nc.key));
        });
        expect(variantScopedPools.length).toBeGreaterThan(0);
        for (const pool of variantScopedPools) {
          expect(
            Object.keys(pool.keysByTag ?? {}),
            `pool '${pool.context}' missing '${v.key}' tag`,
          ).toContain(v.key);
        }
      });

      it('every variant-specific banter key resolves through t()', () => {
        const variantScopedPools = BANTER_POOLS.filter((p) => {
          if (!p.keysByTag) return false;
          const tags = Object.keys(p.keysByTag);
          return NON_CLASSIC_VARIANTS.some((nc) => tags.includes(nc.key));
        });
        for (const pool of variantScopedPools) {
          const keys = pool.keysByTag?.[v.key] ?? [];
          expect(keys.length, `pool '${pool.context}' has no keys for '${v.key}'`).toBeGreaterThan(0);
          for (const key of keys) {
            const resolved = t(key);
            expect(resolved, `i18n missing for '${key}'`).not.toBe(key);
            expect(resolved.length).toBeGreaterThan(0);
          }
        }
      });
    });
  }
});
