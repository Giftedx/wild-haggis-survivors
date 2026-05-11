import { describe, expect, it } from 'vitest';
import {
  type WeeTaleContext,
  computeWeeTaleTags,
  pickWeeTale,
  weeTalePoolForContext,
  WEE_TALE_TEMPLATES,
} from './weeTale';

/**
 * Wee Tales — procedural prose epitaph at run end.
 *
 * The picker is a pure function: given a `WeeTaleContext` and an
 * `rngSample ∈ [0, 1)`, returns either an `{ i18nKey, params }`
 * descriptor (caller resolves through `t()`) or `null` when no
 * template matches the context. Determinism: same context + same
 * rngSample → same descriptor on every call.
 *
 * Tag-driven filter:
 *   - `requires` — every tag must be in the context tag-set.
 *   - `forbids` — none of these tags may be in the context tag-set.
 *
 * Weight: more-specific templates (longer `requires` list) win the
 * pool. The shipped catalogue mixes generic fallbacks (single tag)
 * with boss-specific + variant-specific leaves so a memorable run
 * gets a memorable line; a swarm-death run still gets *something*.
 */

function ctx(over: Partial<WeeTaleContext> = {}): WeeTaleContext {
  return {
    mode: 'death',
    variantKey: 'classic',
    timeSurvivedSec: 180,
    bossesKilled: [],
    deathSourceKey: undefined,
    routes: [],
    relics: [],
    biomes: ['bog'],
    ironmoor: false,
    curseKey: undefined,
    postBellSec: undefined,
    ...over,
  };
}

describe('computeWeeTaleTags', () => {
  it('tags victory runs with both mode + duration bucket', () => {
    const tags = computeWeeTaleTags(ctx({ mode: 'victory', timeSurvivedSec: 1500 }));
    expect(tags).toContain('victory');
    expect(tags).toContain('epic');
    expect(tags).not.toContain('death');
  });

  it('tags death runs and bucket short / long / epic by time', () => {
    expect(computeWeeTaleTags(ctx({ timeSurvivedSec: 90 }))).toContain('short');
    expect(computeWeeTaleTags(ctx({ timeSurvivedSec: 480 }))).toContain('long');
    expect(computeWeeTaleTags(ctx({ timeSurvivedSec: 1300 }))).toContain('epic');
  });

  it('tags by every boss kill so any boss-specific template can match', () => {
    const tags = computeWeeTaleTags(
      ctx({ mode: 'victory', bossesKilled: ['gordon', 'tour_bus', 'taxman'] }),
    );
    expect(tags).toContain('gordon');
    expect(tags).toContain('tour_bus');
    expect(tags).toContain('taxman');
    expect(tags).toContain('any_boss');
  });

  it('tags no_boss when bosses list is empty', () => {
    expect(computeWeeTaleTags(ctx({ bossesKilled: [] }))).toContain('no_boss');
  });

  it('tags ironmoor, cursed, post_bell when those flags are set', () => {
    const tags = computeWeeTaleTags(
      ctx({ ironmoor: true, curseKey: 'heavy_legs', postBellSec: 30 }),
    );
    expect(tags).toContain('ironmoor');
    expect(tags).toContain('cursed');
    expect(tags).toContain('post_bell');
  });

  it('tags the variant key so variant-specific lines can match', () => {
    expect(computeWeeTaleTags(ctx({ variantKey: 'cailleach' }))).toContain('cailleach');
    expect(computeWeeTaleTags(ctx({ variantKey: 'witch_hare' }))).toContain('witch_hare');
  });
});

describe('weeTalePoolForContext', () => {
  it('excludes templates whose `requires` is not satisfied by the context tag-set', () => {
    const pool = weeTalePoolForContext(ctx({ mode: 'death', timeSurvivedSec: 90 }));
    // No template tagged `victory` should appear in a death-run pool.
    expect(pool.every((t) => !(t.requires ?? []).includes('victory'))).toBe(true);
  });

  it('excludes templates whose `forbids` is hit by the context tag-set', () => {
    const taxmanCtx = ctx({ mode: 'death', deathSourceKey: 'taxman', bossesKilled: ['gordon', 'tour_bus'] });
    const taxmanTags = computeWeeTaleTags(taxmanCtx);
    // Sanity — context tagging includes 'taxman_death'.
    expect(taxmanTags).toContain('taxman_death');
    const pool = weeTalePoolForContext(taxmanCtx);
    // Any template that forbids `taxman_death` should NOT be in the pool.
    expect(pool.every((t) => !(t.forbids ?? []).includes('taxman_death'))).toBe(true);
  });

  it('always returns at least one template — the death + victory fallback families cover every context', () => {
    const pool = weeTalePoolForContext(
      ctx({ mode: 'death', timeSurvivedSec: 5, bossesKilled: [], biomes: [] }),
    );
    expect(pool.length).toBeGreaterThan(0);

    const vp = weeTalePoolForContext(
      ctx({ mode: 'victory', timeSurvivedSec: 1500, bossesKilled: ['taxman'] }),
    );
    expect(vp.length).toBeGreaterThan(0);
  });
});

describe('pickWeeTale', () => {
  it('returns a non-null descriptor for any valid context', () => {
    const pick = pickWeeTale(ctx(), 0.5);
    expect(pick).not.toBeNull();
    expect(typeof pick?.i18nKey).toBe('string');
  });

  it('is deterministic — same context + same rngSample yields the same descriptor', () => {
    const c = ctx({ mode: 'victory', bossesKilled: ['taxman'], timeSurvivedSec: 1500 });
    const a = pickWeeTale(c, 0.31415);
    const b = pickWeeTale(c, 0.31415);
    expect(a).toEqual(b);
  });

  it('different rngSamples can yield different descriptors when the pool has > 1 template', () => {
    const c = ctx({ mode: 'death', timeSurvivedSec: 180 });
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const pick = pickWeeTale(c, i / 50);
      if (pick) seen.add(pick.i18nKey);
    }
    // Most contexts should have at least 2 viable templates — the death
    // baseline pool ships with several fallbacks so the player doesn't
    // see the same line on every wipe.
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  it('substitutes context-derived params: time (mm:ss), variant, source, boss', () => {
    const c = ctx({
      mode: 'death',
      timeSurvivedSec: 754,
      variantKey: 'classic',
      deathSourceKey: 'gordon',
      bossesKilled: ['gordon'],
    });
    const pick = pickWeeTale(c, 0.42);
    expect(pick).not.toBeNull();
    // Time is mm:ss, no leading 0 on minutes — 754 sec = 12:34.
    expect(pick!.params.time).toBe('12:34');
  });

  it('biases toward more-specific templates: a taxman-death context should preferentially hit the taxman line, not a generic death line', () => {
    const c = ctx({
      mode: 'death',
      deathSourceKey: 'taxman',
      bossesKilled: ['gordon', 'tour_bus'],
      postBellSec: 60,
      timeSurvivedSec: 1560,
    });
    // Sample across the whole [0,1) range so the bias becomes visible.
    let taxmanHits = 0;
    const samples = 200;
    for (let i = 0; i < samples; i++) {
      const pick = pickWeeTale(c, (i + 0.5) / samples);
      if (pick?.i18nKey.includes('taxman')) taxmanHits++;
    }
    // Loose bound — most picks should be taxman-flavoured given how
    // specific the context is (taxman + post-bell + epic). The exact
    // ratio depends on the catalogue weights; > 50 % is the floor.
    expect(taxmanHits).toBeGreaterThan(samples / 2);
  });
});

describe('WEE_TALE_TEMPLATES catalogue', () => {
  it('every template has a non-empty i18n key', () => {
    for (const tmpl of WEE_TALE_TEMPLATES) {
      expect(tmpl.key).toMatch(/^ui\.weeTale\.[a-z0-9_.]+$/);
    }
  });

  it('every template has a unique i18n key', () => {
    const keys = WEE_TALE_TEMPLATES.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('contains at least one death + one victory fallback (single-tag families)', () => {
    const deathFallbacks = WEE_TALE_TEMPLATES.filter(
      (t) => (t.requires ?? []).length === 1 && (t.requires ?? []).includes('death'),
    );
    const victoryFallbacks = WEE_TALE_TEMPLATES.filter(
      (t) => (t.requires ?? []).length === 1 && (t.requires ?? []).includes('victory'),
    );
    expect(deathFallbacks.length).toBeGreaterThan(0);
    expect(victoryFallbacks.length).toBeGreaterThan(0);
  });
});
