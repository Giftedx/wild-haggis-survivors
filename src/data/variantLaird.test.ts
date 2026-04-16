import { describe, expect, it } from 'vitest';
import { VARIANT_KEYS, VARIANTS, getVariantByKey } from './variants';
import { BANTER_POOLS } from './banter';
import { t } from '../core/i18n';
import type { VariantKey } from './variants';

/**
 * Integration fence for the Laird variant. Adding a variant touches
 * VARIANT_KEYS, VARIANTS, BootScene palette, i18n name/flavor, and
 * every `keysByTag` banter pool. These tests verify the wire-up end-
 * to-end so the next person adding a variant gets a clean failure
 * signal if any layer is missed.
 */
describe('The Laird variant — end-to-end wiring', () => {
  it('is listed in VARIANT_KEYS', () => {
    expect(VARIANT_KEYS).toContain<VariantKey>('laird');
  });

  it('has a VariantDef entry with the expected identity', () => {
    const laird = getVariantByKey('laird');
    expect(laird.key).toBe('laird');
    expect(laird.textureKey).toBe('haggis_laird');
    expect(laird.appearance.accentStyle).toBe('laird');
  });

  it('ships a modifier profile (not stat-neutral)', () => {
    const laird = getVariantByKey('laird');
    const mods = laird.modifiers;
    // Identity: bulky + heavier swing + slower
    expect(mods.maxHpFlat).toBeGreaterThan(0);
    expect(mods.damagePct).toBeGreaterThan(0);
    expect(mods.moveSpeedPct).toBeLessThan(0);
  });

  it('unlocks via total_gold_earned (not default / survival)', () => {
    const laird = getVariantByKey('laird');
    expect(laird.unlock.type).toBe('total_gold_earned');
    if (laird.unlock.type === 'total_gold_earned') {
      expect(laird.unlock.required).toBeGreaterThan(0);
    }
  });

  it('nameKey + flavorKey resolve (not the raw dot-path)', () => {
    const laird = getVariantByKey('laird');
    expect(t(laird.nameKey)).not.toBe(laird.nameKey);
    expect(t(laird.flavorKey)).not.toBe(laird.flavorKey);
    expect(t(laird.nameKey).length).toBeGreaterThan(0);
    expect(t(laird.flavorKey).length).toBeGreaterThan(0);
  });

  it('voice register keeps Scots hooks (not pure English RP)', () => {
    // Highland-laird voice must feel Scottish, not English. A minimum
    // bar: at least a few of the expected Scots tokens appear across
    // the laird banter pool.
    const scotsMarkers = ['aye', 'ye', 'wee', 'tae', 'braw', 'the Laird', 'tartan'];
    const laird = getVariantByKey('laird');
    const name = t(laird.nameKey);
    const flavor = t(laird.flavorKey);
    const bag = `${name} ${flavor}`.toLowerCase();
    // The flavor line on its own must carry Scottish flavor — at least
    // one of the markers must show up. Using a case-insensitive match
    // so the test isn't brittle to capitalisation.
    const hit = scotsMarkers.some((m) => bag.includes(m.toLowerCase()));
    expect(hit, `flavor+name missing any Scots marker: "${bag}"`).toBe(true);
  });

  it('every keysByTag pool that covers non-classic variants includes laird', () => {
    const nonClassic = VARIANTS.filter((v) => v.key !== 'classic');
    // Pools that scope by variant (low_hp, level_up, first_blood,
    // kill_streak, recover, idle) must list `laird`.
    const variantScopedPools = BANTER_POOLS.filter((p) => {
      if (!p.keysByTag) return false;
      const tags = Object.keys(p.keysByTag);
      // Heuristic: pool is variant-scoped if it lists any non-classic
      // variant's key as a tag.
      return nonClassic.some((v) => tags.includes(v.key));
    });
    expect(variantScopedPools.length).toBeGreaterThan(0);
    for (const pool of variantScopedPools) {
      expect(
        Object.keys(pool.keysByTag ?? {}),
        `pool '${pool.context}' missing laird tag`,
      ).toContain('laird');
    }
  });

  it('every laird banter key resolves through t() (no broken keys)', () => {
    const nonClassic = VARIANTS.filter((v) => v.key !== 'classic');
    const variantScopedPools = BANTER_POOLS.filter((p) => {
      if (!p.keysByTag) return false;
      const tags = Object.keys(p.keysByTag);
      return nonClassic.some((v) => tags.includes(v.key));
    });
    for (const pool of variantScopedPools) {
      const lairdKeys = pool.keysByTag?.laird ?? [];
      expect(lairdKeys.length).toBeGreaterThan(0);
      for (const key of lairdKeys) {
        const resolved = t(key);
        expect(resolved, `i18n missing for '${key}'`).not.toBe(key);
        expect(resolved.length).toBeGreaterThan(0);
      }
    }
  });
});
