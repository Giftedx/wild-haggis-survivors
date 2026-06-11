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

/**
 * v2 — variant-voiced lines + `{name}` slot.
 *
 * The closed `WeeTaleTag` union grew by one literal (`has_name`), the
 * tagger fires it when `ctx.runName` is non-empty, and 18 new
 * templates were appended to the catalogue (2 universal + 4 each for
 * Cailleach / Glaswegian / Doric Quinie / Burns's Wee Beastie). The
 * picker's `4^specificity` weighting routes name-bearing runs to the
 * variant-voiced line over the no-name fallback automatically.
 */
describe('v2 — has_name tag', () => {
  it('fires when runName is a non-empty string', () => {
    expect(computeWeeTaleTags(ctx({ runName: 'Lachlan Beag' }))).toContain('has_name');
  });

  it('does not fire when runName is the empty string', () => {
    expect(computeWeeTaleTags(ctx({ runName: '' }))).not.toContain('has_name');
  });

  it('does not fire when runName is missing entirely', () => {
    expect(computeWeeTaleTags(ctx({}))).not.toContain('has_name');
  });
});

describe('v2 — {name} slot', () => {
  it('pickWeeTale populates params.name when runName is set', () => {
    const pick = pickWeeTale(
      ctx({ mode: 'victory', timeSurvivedSec: 600, runName: 'Cailleach Bheag' }),
      0.5,
    );
    expect(pick).not.toBeNull();
    expect(pick!.params.name).toBe('Cailleach Bheag');
  });

  it('pickWeeTale omits params.name when runName is empty', () => {
    const pick = pickWeeTale(
      ctx({ mode: 'victory', timeSurvivedSec: 600, runName: '' }),
      0.5,
    );
    expect(pick).not.toBeNull();
    expect(pick!.params.name).toBeUndefined();
  });
});

describe('v2 — variant routing', () => {
  function variantRoutesToOwnPool(variantKey: 'cailleach' | 'glaswegian' | 'doric_quinie' | 'burns_wee_beastie') {
    const c = ctx({
      mode: 'victory',
      variantKey,
      timeSurvivedSec: 600,
      runName: 'Test Beastie',
    });
    let variantHits = 0;
    const samples = 200;
    for (let i = 0; i < samples; i++) {
      const pick = pickWeeTale(c, (i + 0.5) / samples);
      if (pick?.i18nKey.startsWith(`ui.weeTale.variant.${variantKey}.`)) variantHits++;
    }
    return { variantHits, samples };
  }

  it('routes Cailleach victory runs predominantly to Cailleach-voiced lines', () => {
    const { variantHits, samples } = variantRoutesToOwnPool('cailleach');
    // Tier-2 variant baseline (weight 16) beats tier-1 fallbacks (4)
    // and ties with other tier-2 victory lines, but the variant filter
    // prunes most of those. Expect a strong majority.
    expect(variantHits).toBeGreaterThan(samples / 2);
  });

  it('routes Glaswegian victory runs predominantly to Glaswegian-voiced lines', () => {
    const { variantHits, samples } = variantRoutesToOwnPool('glaswegian');
    expect(variantHits).toBeGreaterThan(samples / 2);
  });

  it('routes Doric Quinie victory runs predominantly to Doric-voiced lines', () => {
    const { variantHits, samples } = variantRoutesToOwnPool('doric_quinie');
    expect(variantHits).toBeGreaterThan(samples / 2);
  });

  it('routes Burns\'s Wee Beastie victory runs predominantly to Burns-citational lines', () => {
    const { variantHits, samples } = variantRoutesToOwnPool('burns_wee_beastie');
    expect(variantHits).toBeGreaterThan(samples / 2);
  });

  it('Cailleach + Taxman victory routes to the tier-3 cailleach.victory_taxman line', () => {
    // Use a Taxman-only boss roster so the tier-4 `three_bosses` line
    // (which requires `gordon` + `tour_bus` + `taxman`) is out of the
    // pool. That isolates the Cailleach variant line as the dominant
    // tier-4 route and the assertion measures specificity weighting
    // rather than competition between two correct tier-4 lines.
    const c = ctx({
      mode: 'victory',
      variantKey: 'cailleach',
      timeSurvivedSec: 1500,
      bossesKilled: ['taxman'],
      runName: 'Cailleach Bheag',
    });
    let taxmanLineHits = 0;
    const samples = 200;
    for (let i = 0; i < samples; i++) {
      const pick = pickWeeTale(c, (i + 0.5) / samples);
      if (pick?.i18nKey === 'ui.weeTale.variant.cailleach.victory_taxman') taxmanLineHits++;
    }
    // Tier-4 (cailleach + victory + has_name + taxman) at weight 256
    // vs tier-3 cailleach baseline (64) + tier-2 with_name / epic /
    // taxman_kill (16 each) + tier-1 fallbacks (4 each). The Cailleach
    // taxman line should win a clear majority.
    expect(taxmanLineHits).toBeGreaterThan(samples / 2);
  });

  it('Cailleach + three-boss victory splits between cailleach.victory_taxman and three_bosses (both tier-4)', () => {
    // Documents the intended design: a Cailleach run that kills all
    // three bosses has two correct tier-4 routes — the variant-voiced
    // Cailleach Taxman line AND the generic three-boss accomplishment
    // line. Both are good closers for that run; variety beats forced
    // determinism. The picker splits the tier-4 weight between them.
    const c = ctx({
      mode: 'victory',
      variantKey: 'cailleach',
      timeSurvivedSec: 1500,
      bossesKilled: ['gordon', 'tour_bus', 'taxman'],
      runName: 'Cailleach Bheag',
    });
    let tier4Hits = 0;
    const samples = 200;
    for (let i = 0; i < samples; i++) {
      const pick = pickWeeTale(c, (i + 0.5) / samples);
      if (
        pick?.i18nKey === 'ui.weeTale.variant.cailleach.victory_taxman'
        || pick?.i18nKey === 'ui.weeTale.victory.three_bosses'
      ) {
        tier4Hits++;
      }
    }
    // The two tier-4 lines together should dominate the pool — their
    // combined weight (512) vs the next-best tier-3 (64) means tier-4
    // wins the vast majority of picks.
    expect(tier4Hits).toBeGreaterThan(samples * 0.7);
  });

  it('Burns citation templates never match a non-Burns variant', () => {
    const c = ctx({
      mode: 'death',
      variantKey: 'classic',
      bossesKilled: ['gordon'],
      runName: 'Some Other Beastie',
    });
    const pool = weeTalePoolForContext(c);
    expect(pool.every((t) => !t.key.startsWith('ui.weeTale.variant.burns_wee_beastie.'))).toBe(true);
  });

  it('universal {name} death line beats the no-name death fallback when runName is set', () => {
    // Plain death run, generic context — only differentiator is runName.
    const c = ctx({
      mode: 'death',
      variantKey: 'classic',
      timeSurvivedSec: 400, // long-bucket, not short / epic
      bossesKilled: [],
      runName: 'Wee Test',
    });
    let withNameHits = 0;
    const samples = 200;
    for (let i = 0; i < samples; i++) {
      const pick = pickWeeTale(c, (i + 0.5) / samples);
      if (pick?.i18nKey === 'ui.weeTale.death.with_name_a') withNameHits++;
    }
    // tier-2 (death + has_name) at weight 16 vs three tier-1 death
    // fallbacks at weight 4 each + tier-2 long_a (16). The with_name
    // line should account for a clear plurality of picks.
    expect(withNameHits).toBeGreaterThan(samples / 6);
  });
});
