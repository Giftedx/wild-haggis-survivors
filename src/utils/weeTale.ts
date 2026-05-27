/**
 * Wee Tales — procedural prose epitaph at run end.
 *
 * A pure function pair: `computeWeeTaleTags(context)` derives a tag-
 * set from a `WeeTaleContext`; `pickWeeTale(context, rngSample)`
 * returns an `{ i18nKey, params }` descriptor that the caller
 * resolves through `t()`. The caller (Game Over scene) supplies a
 * seed-derived `rngSample ∈ [0, 1)` so the same run always closes
 * with the same line — the wee tale is part of the run's identity,
 * not a re-roll on every game-over render.
 *
 * Selection algorithm:
 *   1. Tag the context (mode, duration bucket, boss roster, variant,
 *      ironmoor / curse / post-bell, death source).
 *   2. Filter the catalogue: keep templates whose `requires` is a
 *      subset of the tag-set AND whose `forbids` is disjoint.
 *   3. Weight by specificity — more required tags = higher weight,
 *      so a memorable run gets a memorable line; a generic swarm
 *      death still gets a kindly baseline.
 *   4. Sample the weighted pool with `rngSample`.
 *
 * Voice register: Hearth-warm for victory, Hearth-grave for death
 * (per `docs/VOICE_CARD.md`). NO maudlin / saccharine; the moor is
 * kind without pity. NO competitive framing; the haggis is the
 * protagonist, not the player's avatar to brag with.
 *
 * Architectural note: the picker is i18n-agnostic — it returns the
 * key + params and lets the caller resolve. That keeps the unit
 * tests independent of locale state and makes Scots overlay parity
 * a content authoring concern rather than an engine concern.
 */
import type { VariantKey } from '../data/variants';
import type { BiomeId } from '../data/biomes';
import { formatClockTime } from './formatClockTime';

export interface WeeTaleContext {
  readonly mode: 'victory' | 'death';
  readonly variantKey: VariantKey;
  readonly timeSurvivedSec: number;
  /** Boss enemy keys in kill order. Empty for non-boss runs. */
  readonly bossesKilled: readonly string[];
  /** Enemy key that landed the killing blow (death runs only). */
  readonly deathSourceKey?: string;
  /** Route keys picked across the run's act intermissions. */
  readonly routes: readonly string[];
  /** Relic keys held at run end. */
  readonly relics: readonly string[];
  /** Biome ids the player walked across this run. */
  readonly biomes: readonly BiomeId[];
  readonly ironmoor: boolean;
  /** Curse key if a curse was active; undefined / empty = clean run. */
  readonly curseKey?: string;
  /** Seconds spent past the 25-minute bell (post-bell endless tail). */
  readonly postBellSec?: number;
  /**
   * Procedurally generated haggis run-name (e.g. "Lachlan Beag"). Used
   * for the `{name}` slot in variant-voiced templates and the tier-2
   * universal lines. Empty / missing on legacy saves; the synthetic
   * `has_name` tag gates which templates reference the slot, so an
   * empty name never renders as a literal "{name}".
   */
  readonly runName?: string;
}

/**
 * Closed union of every tag the catalogue is permitted to reference.
 * Adding a new tag here without a corresponding clause in
 * `computeWeeTaleTags` is a compile-time guarded miss (no template
 * will ever match the new tag).
 */
export type WeeTaleTag =
  | 'victory' | 'death'
  | 'short' | 'long' | 'epic'
  | 'no_boss' | 'any_boss'
  | 'gordon' | 'tour_bus' | 'taxman'
  | 'each_uisge' | 'nicnevin' | 'the_laird' | 'nuckelavee' | 'hunter_general' | 'earl_beardie' | 'black_douglas'
  | 'cailleach_boss' | 'storm_cailleach' | 'twin_stones' | 'wicker_haggis' | 'nessie' | 'auld_reekie'
  | 'gordon_death' | 'tour_bus_death' | 'taxman_death'
  | 'each_uisge_death' | 'nicnevin_death' | 'the_laird_death' | 'nuckelavee_death' | 'hunter_general_death' | 'earl_beardie_death' | 'black_douglas_death'
  | 'cailleach_boss_death' | 'storm_cailleach_death' | 'twin_stones_death' | 'wicker_haggis_death' | 'nessie_death' | 'auld_reekie_death'
  | 'cursed' | 'ironmoor' | 'post_bell'
  | 'biome_bog' | 'biome_loch' | 'biome_pine' | 'biome_heather'
  | 'biome_coastal' | 'biome_haar' | 'biome_frost'
  | 'biome_cairngorm' | 'biome_glen_coe' | 'biome_clyde_shipyard'
  | 'biome_black_bog' | 'biome_ben_nevis' | 'biome_glasgow_close'
  | 'biome_fingals_cave' | 'biome_callanish' | 'biome_trossachs'
  | 'biome_edinburgh_old_town' | 'biome_cairngorm_woods' | 'biome_orkney'
  | 'biome_corryvreckan' | 'biome_shetland_voe' | 'biome_skye_fairy_pool'
  | 'biome_hebridean_shore'
  | 'has_name'
  | VariantKey;

export interface WeeTaleTemplate {
  /** i18n dot-path resolved by the caller through `t(key, params)`. */
  readonly key: string;
  /** Tags ALL of which must be in the context tag-set. */
  readonly requires?: readonly WeeTaleTag[];
  /** Tags NONE of which may be in the context tag-set. */
  readonly forbids?: readonly WeeTaleTag[];
  /** Base weight before specificity bonus. Default 1. */
  readonly weight?: number;
}

/** Time bucket thresholds — seconds. */
const SHORT_THRESHOLD_SEC = 180;     // 3:00
const LONG_THRESHOLD_SEC = 720;      // 12:00
const EPIC_THRESHOLD_SEC = 1200;     // 20:00

/**
 * Derive the tag-set for a context. Pure: no module-level state, no
 * randomness, no i18n. The union of every clause's output should be
 * a subset of the `WeeTaleTag` union type — adding a tag below
 * without extending the union (or a template `requires` clause
 * without extending the tagger) drifts the picker silently, so the
 * two surfaces are kept in lockstep by tests.
 */
export function computeWeeTaleTags(ctx: WeeTaleContext): Set<WeeTaleTag> {
  const tags = new Set<WeeTaleTag>();
  tags.add(ctx.mode);

  // Duration buckets — non-overlapping. A run that lasts exactly the
  // boundary value counts as the lower bucket (e.g. 180 s = `short`).
  if (ctx.timeSurvivedSec >= EPIC_THRESHOLD_SEC) tags.add('epic');
  else if (ctx.timeSurvivedSec > LONG_THRESHOLD_SEC) tags.add('long');
  else if (ctx.timeSurvivedSec <= SHORT_THRESHOLD_SEC) tags.add('short');
  else tags.add('long');

  // Boss roster — every boss killed this run gets its own tag plus
  // an `any_boss` umbrella so umbrella templates can match without
  // the picker needing to OR across every specific key.
  if (ctx.bossesKilled.length === 0) {
    tags.add('no_boss');
  } else {
    tags.add('any_boss');
    for (const b of ctx.bossesKilled) {
      // The cast is intentional — we tag every boss key the run
      // produced, even if it isn't in the closed union (future-proof
      // for new bosses without a template). The catalogue only
      // references the known seven.
      tags.add(b as WeeTaleTag);
    }
  }

  // Death source — separate tag namespace so a "taxman killed you"
  // template doesn't accidentally match a "you killed the taxman"
  // run. The suffix `_death` is the discriminator.
  if (ctx.mode === 'death' && typeof ctx.deathSourceKey === 'string' && ctx.deathSourceKey.length > 0) {
    tags.add(`${ctx.deathSourceKey}_death` as WeeTaleTag);
  }

  if (ctx.ironmoor) tags.add('ironmoor');
  if (typeof ctx.curseKey === 'string' && ctx.curseKey.length > 0) tags.add('cursed');
  if (typeof ctx.postBellSec === 'number' && ctx.postBellSec > 0) tags.add('post_bell');
  // Synthetic — gates templates that interpolate the `{name}` slot.
  // Templates without `has_name` in their requires never see the slot,
  // so an empty / missing runName never renders as literal "{name}".
  if (typeof ctx.runName === 'string' && ctx.runName.length > 0) {
    tags.add('has_name');
  }

  // Variant — every run has exactly one. Direct add (the
  // VariantKey union is part of `WeeTaleTag`).
  tags.add(ctx.variantKey);

  for (const b of ctx.biomes) {
    tags.add(`biome_${b}` as WeeTaleTag);
  }

  return tags;
}

/**
 * Filter the catalogue down to templates whose tag constraints are
 * satisfied by the context tag-set. Order in the returned array
 * matches the catalogue's authoring order (stable for replay
 * determinism).
 */
export function weeTalePoolForContext(ctx: WeeTaleContext): WeeTaleTemplate[] {
  const tags = computeWeeTaleTags(ctx);
  return WEE_TALE_TEMPLATES.filter((tmpl) => {
    const requires = tmpl.requires ?? [];
    for (const r of requires) {
      if (!tags.has(r)) return false;
    }
    const forbids = tmpl.forbids ?? [];
    for (const f of forbids) {
      if (tags.has(f)) return false;
    }
    return true;
  });
}

export interface WeeTalePick {
  readonly i18nKey: string;
  readonly params: Readonly<Record<string, string | number>>;
}

/**
 * Sample one template from the context's filtered pool, then build
 * the substitution params. Returns `null` only when the catalogue
 * has no matching template AT ALL — the shipped catalogue ensures
 * that's impossible (death + victory fallback families always
 * match), but the null return type keeps callers honest if a future
 * authoring slip empties the pool.
 */
export function pickWeeTale(ctx: WeeTaleContext, rngSample: number): WeeTalePick | null {
  const pool = weeTalePoolForContext(ctx);
  if (pool.length === 0) return null;

  // Weight: base × 4^specificity. Specificity = # of required tags.
  // Exponential curve so a tier-3 template (~64) decisively beats
  // tier-2 (~16) which decisively beats the tier-1 fallbacks (~4),
  // even when the fallback family has more entries authored. This
  // matches the design intent: a memorable run (e.g. Taxman kill,
  // post-bell, cursed) should consistently get a memorable line.
  const weights = pool.map((tmpl) => {
    const base = tmpl.weight ?? 1;
    const specificity = (tmpl.requires ?? []).length;
    return base * Math.pow(4, specificity);
  });
  const total = weights.reduce((s, w) => s + w, 0);

  const sample = clamp01(rngSample) * total;
  let acc = 0;
  let picked = pool[pool.length - 1]!;
  for (let i = 0; i < pool.length; i++) {
    acc += weights[i]!;
    if (sample <= acc) {
      picked = pool[i]!;
      break;
    }
  }

  return {
    i18nKey: picked.key,
    params: buildTemplateParams(ctx),
  };
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x >= 1) return 0.9999999;
  return x;
}

/**
 * Build the i18n substitution params shared across every template.
 * The catalogue only references slot names that the run context can
 * fill — `{time}`, `{variant}`, `{boss}`, `{source}`. A template
 * that mentions an unfilled slot will resolve the literal slot
 * marker (e.g. `{boss}`) at render time, which the parity test
 * catches.
 *
 * `time` uses mm:ss without zero-padding the minutes (matches
 * `formatClockTime`). `boss` is the LAST boss killed (memorable
 * close); `source` is the killer enemy key (death runs).
 */
function buildTemplateParams(ctx: WeeTaleContext): Record<string, string | number> {
  const params: Record<string, string | number> = {
    time: formatClockTime(Math.max(0, Math.floor(ctx.timeSurvivedSec))),
    variant: ctx.variantKey,
  };
  if (ctx.bossesKilled.length > 0) {
    params.boss = ctx.bossesKilled[ctx.bossesKilled.length - 1]!;
  }
  if (ctx.deathSourceKey) {
    params.source = ctx.deathSourceKey;
  }
  if (typeof ctx.runName === 'string' && ctx.runName.length > 0) {
    params.name = ctx.runName;
  }
  return params;
}

/**
 * The wee tale catalogue.
 *
 * Authoring rules (per `docs/VOICE_CARD.md`):
 *   - Hearth-grave for death; Hearth-warm for victory.
 *   - No maudlin "rest in peace" lines — the moor is kind without
 *     pity.
 *   - No competitive framing — the player isn't bragging.
 *   - 1–2 sentences max; the panel has limited room.
 *   - `{slot}` substitutions only for slots `time` / `variant` /
 *     `boss` / `source`; resolution + display-name lookup happens at
 *     render time in the scene.
 *
 * Order: generic fallbacks first (so authoring order matches the
 * specificity ramp), then per-boss / per-variant flavour leaves.
 */
export const WEE_TALE_TEMPLATES: readonly WeeTaleTemplate[] = [
  // ── Death fallbacks (single-tag) ───────────────────────────────
  { key: 'ui.weeTale.death.fallback_a', requires: ['death'] },
  { key: 'ui.weeTale.death.fallback_b', requires: ['death'] },
  { key: 'ui.weeTale.death.fallback_c', requires: ['death'] },

  // ── Death by time bucket ──────────────────────────────────────
  { key: 'ui.weeTale.death.short_a', requires: ['death', 'short'] },
  { key: 'ui.weeTale.death.long_a', requires: ['death', 'long'] },
  { key: 'ui.weeTale.death.epic_a', requires: ['death', 'epic'] },

  // ── Death by killer (act-resolver bosses are the memorable ones) ──
  { key: 'ui.weeTale.death.taxman', requires: ['death', 'taxman_death'] },
  { key: 'ui.weeTale.death.gordon', requires: ['death', 'gordon_death'] },
  { key: 'ui.weeTale.death.tour_bus', requires: ['death', 'tour_bus_death'] },
  // Tier-3 — the Taxman by definition is the post-bell boss, but
  // having a dedicated line for "taxman + post-bell" lifts the
  // specificity tier so the Taxman gets the closing word on any run
  // he finishes (most expected; matches the lore framing).
  { key: 'ui.weeTale.death.taxman_postbell', requires: ['death', 'taxman_death', 'post_bell'] },

  // Orcadian mythos — died to the Nuckelavee.
  { key: 'ui.weeTale.death.nuckelavee', requires: ['death', 'nuckelavee_death'] },

  // Glamis ghost — dealt tae by Earl Beardie.
  { key: 'ui.weeTale.death.earl_beardie', requires: ['death', 'earl_beardie_death'] },

  // Post-bell border raider — the hush came.
  { key: 'ui.weeTale.death.black_douglas', requires: ['death', 'black_douglas_death'] },

  // Loch-horse — got too close to the beautiful thing.
  { key: 'ui.weeTale.death.each_uisge', requires: ['death', 'each_uisge_death'] },

  // Queen of the Unblessed — her parliament sat in judgement.
  { key: 'ui.weeTale.death.nicnevin', requires: ['death', 'nicnevin_death'] },

  // The Laird — auld deeds, auld rights, no title for the haggis.
  { key: 'ui.weeTale.death.the_laird', requires: ['death', 'the_laird_death'] },

  // The Hunt — the quarry ran out of moor.
  { key: 'ui.weeTale.death.hunter_general', requires: ['death', 'hunter_general_death'] },

  // ── Victory fallbacks (single-tag) ─────────────────────────────
  { key: 'ui.weeTale.victory.fallback_a', requires: ['victory'] },
  { key: 'ui.weeTale.victory.fallback_b', requires: ['victory'] },

  // ── Victory by accomplishment ──────────────────────────────────
  { key: 'ui.weeTale.victory.epic', requires: ['victory', 'epic'] },
  { key: 'ui.weeTale.victory.cursed', requires: ['victory', 'cursed'] },
  { key: 'ui.weeTale.victory.ironmoor', requires: ['victory', 'ironmoor'] },
  { key: 'ui.weeTale.victory.taxman_kill', requires: ['victory', 'taxman'] },
  { key: 'ui.weeTale.victory.three_bosses', requires: ['victory', 'gordon', 'tour_bus', 'taxman'] },

  // Loch-horse defeated — the haggis kept its skin.
  { key: 'ui.weeTale.victory.each_uisge_kill', requires: ['victory', 'each_uisge'] },

  // Queen of the Unblessed dissolved — the moor breathes again.
  { key: 'ui.weeTale.victory.nicnevin_kill', requires: ['victory', 'nicnevin'] },

  // The Laird went doon — the haggis disputes the deed.
  { key: 'ui.weeTale.victory.the_laird_kill', requires: ['victory', 'the_laird'] },

  // The Hunt hunted — the quarry went home.
  { key: 'ui.weeTale.victory.hunter_general_kill', requires: ['victory', 'hunter_general'] },

  // Orcadian mythos — Nuckelavee beaten on the way to the Taxman.
  { key: 'ui.weeTale.victory.nuckelavee_kill', requires: ['victory', 'nuckelavee'] },

  // Glamis ghost — Earl Beardie's cards scattered on the moor.
  { key: 'ui.weeTale.victory.earl_beardie_kill', requires: ['victory', 'earl_beardie'] },

  // Post-bell border raider — the lullaby proved a lie.
  { key: 'ui.weeTale.victory.black_douglas_kill', requires: ['victory', 'black_douglas'] },

  // Cailleach Gauntlet — died in the ritual (the seven cairns went dark).
  { key: 'ui.weeTale.death.cailleach_boss', requires: ['death', 'cailleach_boss_death'] },

  // Cailleach Gauntlet won — the Stormcrown taken.
  { key: 'ui.weeTale.victory.cailleach_boss_kill', requires: ['victory', 'cailleach_boss'] },

  // Storm Cailleach (post-bell Tier-3) — haar/ice/hail defeated the haggis.
  { key: 'ui.weeTale.death.storm_cailleach', requires: ['death', 'storm_cailleach_death'] },

  // Storm Cailleach defeated — the gale unravelled.
  { key: 'ui.weeTale.victory.storm_cailleach_kill', requires: ['victory', 'storm_cailleach'] },

  // Twin Stones (post-bell) — the circle closed on the haggis.
  { key: 'ui.weeTale.death.twin_stones', requires: ['death', 'twin_stones_death'] },

  // Twin Stones defeated — the heartstone goes cold.
  { key: 'ui.weeTale.victory.twin_stones_kill', requires: ['victory', 'twin_stones'] },

  // Wicker Haggis (post-bell) — the tribute consumed the haggis.
  { key: 'ui.weeTale.death.wicker_haggis', requires: ['death', 'wicker_haggis_death'] },

  // Wicker Haggis defeated — the ceremony survived its subject.
  { key: 'ui.weeTale.victory.wicker_haggis_kill', requires: ['victory', 'wicker_haggis'] },

  // Nessie (post-bell) — the loch claimed the haggis.
  { key: 'ui.weeTale.death.nessie', requires: ['death', 'nessie_death'] },

  // Nessie defeated — the loch got its creature back.
  { key: 'ui.weeTale.victory.nessie_kill', requires: ['victory', 'nessie'] },

  // Auld Reekie Ghaist (urban) — the lamp-ghost consumed the haggis.
  { key: 'ui.weeTale.death.auld_reekie', requires: ['death', 'auld_reekie_death'] },

  // Auld Reekie defeated — the Old Town close exhales.
  { key: 'ui.weeTale.victory.auld_reekie_kill', requires: ['victory', 'auld_reekie'] },

  // ── v2 — universal {name}-bearing lines (tier-2) ───────────────
  // Picks ahead of the no-name fallbacks for any run that has a
  // generated haggis name (every shipping run does; legacy saves
  // without `name` collapse to the existing fallbacks above).
  { key: 'ui.weeTale.death.with_name_a', requires: ['death', 'has_name'] },
  { key: 'ui.weeTale.victory.with_name_a', requires: ['victory', 'has_name'] },

  // ── v2 — Biome-contextual lines (tier-2: death/victory + biome) ──
  // No `has_name` — these are landscape/atmosphere lines, not personalised.
  // Tier-2 weight keeps them below variant-voiced tier-3 lines in the pool.
  { key: 'ui.weeTale.death.biome_bog', requires: ['death', 'biome_bog'] },
  { key: 'ui.weeTale.victory.biome_bog', requires: ['victory', 'biome_bog'] },
  { key: 'ui.weeTale.death.biome_loch', requires: ['death', 'biome_loch'] },
  { key: 'ui.weeTale.victory.biome_loch', requires: ['victory', 'biome_loch'] },
  { key: 'ui.weeTale.death.biome_pine', requires: ['death', 'biome_pine'] },
  { key: 'ui.weeTale.victory.biome_pine', requires: ['victory', 'biome_pine'] },
  { key: 'ui.weeTale.death.biome_heather', requires: ['death', 'biome_heather'] },
  { key: 'ui.weeTale.victory.biome_heather', requires: ['victory', 'biome_heather'] },
  { key: 'ui.weeTale.death.biome_coastal', requires: ['death', 'biome_coastal'] },
  { key: 'ui.weeTale.victory.biome_coastal', requires: ['victory', 'biome_coastal'] },
  { key: 'ui.weeTale.death.biome_haar', requires: ['death', 'biome_haar'] },
  { key: 'ui.weeTale.victory.biome_haar', requires: ['victory', 'biome_haar'] },
  { key: 'ui.weeTale.death.biome_frost', requires: ['death', 'biome_frost'] },
  { key: 'ui.weeTale.victory.biome_frost', requires: ['victory', 'biome_frost'] },
  { key: 'ui.weeTale.death.biome_cairngorm', requires: ['death', 'biome_cairngorm'] },
  { key: 'ui.weeTale.victory.biome_cairngorm', requires: ['victory', 'biome_cairngorm'] },
  { key: 'ui.weeTale.death.biome_glen_coe', requires: ['death', 'biome_glen_coe'] },
  { key: 'ui.weeTale.victory.biome_glen_coe', requires: ['victory', 'biome_glen_coe'] },
  { key: 'ui.weeTale.death.biome_clyde_shipyard', requires: ['death', 'biome_clyde_shipyard'] },
  { key: 'ui.weeTale.victory.biome_clyde_shipyard', requires: ['victory', 'biome_clyde_shipyard'] },
  // Black Bog + Ben Nevis — added 2026-05-24 with those biome ships.
  { key: 'ui.weeTale.death.biome_black_bog', requires: ['death', 'biome_black_bog'] },
  { key: 'ui.weeTale.victory.biome_black_bog', requires: ['victory', 'biome_black_bog'] },
  { key: 'ui.weeTale.death.biome_ben_nevis', requires: ['death', 'biome_ben_nevis'] },
  { key: 'ui.weeTale.victory.biome_ben_nevis', requires: ['victory', 'biome_ben_nevis'] },
  // Glasgow Close — added 2026-05-24.
  { key: 'ui.weeTale.death.biome_glasgow_close', requires: ['death', 'biome_glasgow_close'] },
  { key: 'ui.weeTale.victory.biome_glasgow_close', requires: ['victory', 'biome_glasgow_close'] },
  // B7 biomes — Fingal's Cave, Callanish, Trossachs.
  { key: 'ui.weeTale.death.biome_fingals_cave', requires: ['death', 'biome_fingals_cave'] },
  { key: 'ui.weeTale.victory.biome_fingals_cave', requires: ['victory', 'biome_fingals_cave'] },
  { key: 'ui.weeTale.death.biome_callanish', requires: ['death', 'biome_callanish'] },
  { key: 'ui.weeTale.victory.biome_callanish', requires: ['victory', 'biome_callanish'] },
  { key: 'ui.weeTale.death.biome_trossachs', requires: ['death', 'biome_trossachs'] },
  { key: 'ui.weeTale.victory.biome_trossachs', requires: ['victory', 'biome_trossachs'] },
  // B8 biomes — Edinburgh Old Town, Cairngorm Woods, Orkney.
  { key: 'ui.weeTale.death.biome_edinburgh_old_town', requires: ['death', 'biome_edinburgh_old_town'] },
  { key: 'ui.weeTale.victory.biome_edinburgh_old_town', requires: ['victory', 'biome_edinburgh_old_town'] },
  { key: 'ui.weeTale.death.biome_cairngorm_woods', requires: ['death', 'biome_cairngorm_woods'] },
  { key: 'ui.weeTale.victory.biome_cairngorm_woods', requires: ['victory', 'biome_cairngorm_woods'] },
  { key: 'ui.weeTale.death.biome_orkney', requires: ['death', 'biome_orkney'] },
  { key: 'ui.weeTale.victory.biome_orkney', requires: ['victory', 'biome_orkney'] },
  // B9 biomes — Corryvreckan, Shetland Voe, Skye Fairy Pool.
  { key: 'ui.weeTale.death.biome_corryvreckan', requires: ['death', 'biome_corryvreckan'] },
  { key: 'ui.weeTale.victory.biome_corryvreckan', requires: ['victory', 'biome_corryvreckan'] },
  { key: 'ui.weeTale.death.biome_shetland_voe', requires: ['death', 'biome_shetland_voe'] },
  { key: 'ui.weeTale.victory.biome_shetland_voe', requires: ['victory', 'biome_shetland_voe'] },
  { key: 'ui.weeTale.death.biome_skye_fairy_pool', requires: ['death', 'biome_skye_fairy_pool'] },
  { key: 'ui.weeTale.victory.biome_skye_fairy_pool', requires: ['victory', 'biome_skye_fairy_pool'] },
  // Hebridean Shore — machair + Atlantic light + grey seals.
  { key: 'ui.weeTale.death.biome_hebridean_shore', requires: ['death', 'biome_hebridean_shore'] },
  { key: 'ui.weeTale.victory.biome_hebridean_shore', requires: ['victory', 'biome_hebridean_shore'] },

  // ── v2 — Cailleach (Gaelic-inflected stern-motherly elder) ─────
  // Voice register per `docs/VOICE_CARD.md` §"Cailleach (shipped)".
  // The mountain crone expects better of ye; she's never cruel.
  { key: 'ui.weeTale.variant.cailleach.death_baseline', requires: ['death', 'cailleach', 'has_name'] },
  { key: 'ui.weeTale.variant.cailleach.death_short', requires: ['death', 'cailleach', 'has_name', 'short'] },
  // Tier-4 — Cailleach variant died to the Cailleach boss. Two winters met.
  { key: 'ui.weeTale.variant.cailleach.death_cailleach_boss', requires: ['death', 'cailleach', 'has_name', 'cailleach_boss_death'] },
  { key: 'ui.weeTale.variant.cailleach.victory_baseline', requires: ['victory', 'cailleach', 'has_name'] },
  { key: 'ui.weeTale.variant.cailleach.victory_taxman', requires: ['victory', 'cailleach', 'has_name', 'taxman'] },
  // Tier-4 — Cailleach variant won the Gauntlet. She walked into her own storm.
  { key: 'ui.weeTale.variant.cailleach.victory_cailleach_boss', requires: ['victory', 'cailleach', 'has_name', 'cailleach_boss'] },

  // ── v2 — Glaswegian (urban-aggressive, Limmy-bite) ─────────────
  // Voice register per `docs/VOICE_CARD.md` §"Glaswegian (shipped)".
  // Even Hearth lines have edge; the bite is affectionate.
  { key: 'ui.weeTale.variant.glaswegian.death_baseline', requires: ['death', 'glaswegian', 'has_name'] },
  { key: 'ui.weeTale.variant.glaswegian.death_short', requires: ['death', 'glaswegian', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.glaswegian.victory_baseline', requires: ['victory', 'glaswegian', 'has_name'] },
  { key: 'ui.weeTale.variant.glaswegian.victory_taxman', requires: ['victory', 'glaswegian', 'has_name', 'taxman'] },
  // Tier-4 — Glasgow wit meets the Nuckelavee. The look didn't work.
  { key: 'ui.weeTale.variant.glaswegian.death_nuckelavee', requires: ['death', 'glaswegian', 'has_name', 'nuckelavee_death'] },

  // ── v2 — Doric Quinie (Aberdeenshire fishing-village stoic) ────
  // Voice register per `docs/VOICE_CARD.md` §"Doric / Aberdonian
  // (candidate)". Sparing words; the sea minds its ain.
  { key: 'ui.weeTale.variant.doric_quinie.death_baseline', requires: ['death', 'doric_quinie', 'has_name'] },
  { key: 'ui.weeTale.variant.doric_quinie.death_long', requires: ['death', 'doric_quinie', 'has_name', 'long'] },
  { key: 'ui.weeTale.variant.doric_quinie.victory_baseline', requires: ['victory', 'doric_quinie', 'has_name'] },
  { key: 'ui.weeTale.variant.doric_quinie.victory_epic', requires: ['victory', 'doric_quinie', 'has_name', 'epic'] },
  // Tier-4 — The quinie watched his dogs aw afternoon; should've watched him.
  { key: 'ui.weeTale.variant.doric_quinie.death_hunter_general', requires: ['death', 'doric_quinie', 'has_name', 'hunter_general_death'] },

  // ── v2 — Peerie Shetlander (Shetlandic, Norse-inflected, sea-stoic) ─
  // "da" (the), "du" (you/thou), "peerie" (small), "voe" (fjord-inlet),
  // "skerry" (rocky reef). Terse; sea imagery; stoic without sentiment.
  { key: 'ui.weeTale.variant.peerie_shetlander.death_baseline', requires: ['death', 'peerie_shetlander', 'has_name'] },
  { key: 'ui.weeTale.variant.peerie_shetlander.death_short', requires: ['death', 'peerie_shetlander', 'has_name', 'short'] },
  // Tier-4 — Shetland's Nuckelavee is a sea-creature. Knowing the name
  // is not protection; the legend is older than the name.
  { key: 'ui.weeTale.variant.peerie_shetlander.death_nuckelavee', requires: ['death', 'peerie_shetlander', 'has_name', 'nuckelavee_death'] },
  { key: 'ui.weeTale.variant.peerie_shetlander.victory_baseline', requires: ['victory', 'peerie_shetlander', 'has_name'] },
  { key: 'ui.weeTale.variant.peerie_shetlander.victory_epic', requires: ['victory', 'peerie_shetlander', 'has_name', 'epic'] },

  // ── v2 — Burns's Wee Beastie (citational) ──────────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Burns's voice
  // (citational)" — every citation is verbatim Robert Burns,
  // contextually justified by the variant choice. See
  // `docs/C2_BURNS_PROVENANCE.md` for line provenance.
  { key: 'ui.weeTale.variant.burns_wee_beastie.death_baseline', requires: ['death', 'burns_wee_beastie', 'has_name'] },
  { key: 'ui.weeTale.variant.burns_wee_beastie.death_short', requires: ['death', 'burns_wee_beastie', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.burns_wee_beastie.victory_baseline', requires: ['victory', 'burns_wee_beastie', 'has_name'] },
  { key: 'ui.weeTale.variant.burns_wee_beastie.victory_epic', requires: ['victory', 'burns_wee_beastie', 'has_name', 'epic'] },
  // Tier-4 — Burns's wee beastie met the Earl's card table. Best-laid schemes.
  { key: 'ui.weeTale.variant.burns_wee_beastie.death_earl_beardie', requires: ['death', 'burns_wee_beastie', 'has_name', 'earl_beardie_death'] },

  // ── v3 — Moor Runner (Hearth + velocity) ──────────────────────
  // Hearth register; speed and momentum language. classic uses generics only.
  { key: 'ui.weeTale.variant.moor_runner.death_baseline', requires: ['death', 'moor_runner', 'has_name'] },
  { key: 'ui.weeTale.variant.moor_runner.death_short', requires: ['death', 'moor_runner', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.moor_runner.victory_baseline', requires: ['victory', 'moor_runner', 'has_name'] },
  { key: 'ui.weeTale.variant.moor_runner.victory_epic', requires: ['victory', 'moor_runner', 'has_name', 'epic'] },
  // Tier-4 — The fastest haggis on the moor was still running when the Hunt-General closed the chase.
  { key: 'ui.weeTale.variant.moor_runner.death_hunter_general', requires: ['death', 'moor_runner', 'has_name', 'hunter_general_death'] },

  // ── v3 — Iron Belly (Hearth + stoic toughness) ─────────────────
  // Hearth register; spare, mythic. Iron / dented / absorbed language.
  { key: 'ui.weeTale.variant.iron_belly.death_baseline', requires: ['death', 'iron_belly', 'has_name'] },
  { key: 'ui.weeTale.variant.iron_belly.death_short', requires: ['death', 'iron_belly', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.iron_belly.victory_baseline', requires: ['victory', 'iron_belly', 'has_name'] },
  { key: 'ui.weeTale.variant.iron_belly.victory_taxman', requires: ['victory', 'iron_belly', 'has_name', 'taxman'] },
  // Tier-4 — Iron bent at the last — but it took the Nuckelavee eleven hits to find the crease.
  { key: 'ui.weeTale.variant.iron_belly.death_nuckelavee', requires: ['death', 'iron_belly', 'has_name', 'nuckelavee_death'] },

  // ── v3 — Glen Forager (Hearth + foraging/wilderness) ───────────
  // Hearth register; resourceful, observant. Pockets/haul/glen language.
  { key: 'ui.weeTale.variant.glen_forager.death_baseline', requires: ['death', 'glen_forager', 'has_name'] },
  { key: 'ui.weeTale.variant.glen_forager.death_short', requires: ['death', 'glen_forager', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.glen_forager.victory_baseline', requires: ['victory', 'glen_forager', 'has_name'] },
  { key: 'ui.weeTale.variant.glen_forager.victory_epic', requires: ['victory', 'glen_forager', 'has_name', 'epic'] },
  // Tier-4 — The Glen Forager met the Hunter-General's party. The quarry had a larder; the general had rifles.
  { key: 'ui.weeTale.variant.glen_forager.death_hunter_general', requires: ['death', 'glen_forager', 'has_name', 'hunter_general_death'] },

  // ── v3 — Surefoot (Hearth + balance/footing) ───────────────────
  // Hearth register; careful, confident. Ground/footing/stumble language.
  { key: 'ui.weeTale.variant.surefoot.death_baseline', requires: ['death', 'surefoot', 'has_name'] },
  { key: 'ui.weeTale.variant.surefoot.death_short', requires: ['death', 'surefoot', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.surefoot.victory_baseline', requires: ['victory', 'surefoot', 'has_name'] },
  { key: 'ui.weeTale.variant.surefoot.victory_epic', requires: ['victory', 'surefoot', 'has_name', 'epic'] },

  // ── v3 — Pipe Breath (Hearth + musical/breath) ─────────────────
  // Hearth register; sound/drone/reed language. Breath as metre.
  { key: 'ui.weeTale.variant.pipe_breath.death_baseline', requires: ['death', 'pipe_breath', 'has_name'] },
  { key: 'ui.weeTale.variant.pipe_breath.death_short', requires: ['death', 'pipe_breath', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.pipe_breath.victory_baseline', requires: ['victory', 'pipe_breath', 'has_name'] },
  { key: 'ui.weeTale.variant.pipe_breath.victory_epic', requires: ['victory', 'pipe_breath', 'has_name', 'epic'] },

  // ── v3 — Witch's Hare (Gowdie confession-Scots) ────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Witch's Hare (shipped)".
  // Named for Margaret Gowdie; older Scots grammar; terse, breathless.
  { key: 'ui.weeTale.variant.witch_hare.death_baseline', requires: ['death', 'witch_hare', 'has_name'] },
  { key: 'ui.weeTale.variant.witch_hare.death_short', requires: ['death', 'witch_hare', 'has_name', 'short'] },
  // Tier-4 — Isobel Gowdie's hare met the Queen of the Unblessed.
  { key: 'ui.weeTale.variant.witch_hare.death_nicnevin', requires: ['death', 'witch_hare', 'has_name', 'nicnevin_death'] },
  { key: 'ui.weeTale.variant.witch_hare.victory_baseline', requires: ['victory', 'witch_hare', 'has_name'] },
  { key: 'ui.weeTale.variant.witch_hare.victory_epic', requires: ['victory', 'witch_hare', 'has_name', 'epic'] },

  // ── v3 — Anticlockwise (wry mirror-subspecies) ─────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Anticlockwise (shipped)".
  // Dry wit; acknowledges its own wrongness without winking too hard.
  { key: 'ui.weeTale.variant.anticlockwise.death_baseline', requires: ['death', 'anticlockwise', 'has_name'] },
  { key: 'ui.weeTale.variant.anticlockwise.death_short', requires: ['death', 'anticlockwise', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.anticlockwise.victory_baseline', requires: ['victory', 'anticlockwise', 'has_name'] },
  { key: 'ui.weeTale.variant.anticlockwise.victory_taxman', requires: ['victory', 'anticlockwise', 'has_name', 'taxman'] },
  // Tier-4 — The Each-Uisge spirals clockwise in the loch. The anticlockwise haggis and the loch-horse, opposed.
  { key: 'ui.weeTale.variant.anticlockwise.death_each_uisge', requires: ['death', 'anticlockwise', 'has_name', 'each_uisge_death'] },

  // ── v3 — Wee Ghostie (spectral/gentle) ────────────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Wee Ghostie (shipped)".
  // Hearth register with spectral thinness; small, surprised to still be here.
  { key: 'ui.weeTale.variant.wee_ghostie.death_baseline', requires: ['death', 'wee_ghostie', 'has_name'] },
  { key: 'ui.weeTale.variant.wee_ghostie.death_short', requires: ['death', 'wee_ghostie', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.wee_ghostie.victory_baseline', requires: ['victory', 'wee_ghostie', 'has_name'] },
  { key: 'ui.weeTale.variant.wee_ghostie.victory_epic', requires: ['victory', 'wee_ghostie', 'has_name', 'epic'] },
  // Tier-4 — The wee ghostie met Nicnevin. Even ghosts need rank in the Queen's court.
  { key: 'ui.weeTale.variant.wee_ghostie.death_nicnevin', requires: ['death', 'wee_ghostie', 'has_name', 'nicnevin_death'] },

  // ── v3 — Laird (estate-Scots formality) ───────────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Laird (shipped)".
  // Landed gentry cadence; unhurried; mildly imperious; dry understatement.
  { key: 'ui.weeTale.variant.laird.death_baseline', requires: ['death', 'laird', 'has_name'] },
  { key: 'ui.weeTale.variant.laird.death_short', requires: ['death', 'laird', 'has_name', 'short'] },
  // Tier-4 — The Laird variant died to The Laird boss. The estate claimed its ain.
  { key: 'ui.weeTale.variant.laird.death_the_laird', requires: ['death', 'laird', 'has_name', 'the_laird_death'] },
  { key: 'ui.weeTale.variant.laird.victory_baseline', requires: ['victory', 'laird', 'has_name'] },
  { key: 'ui.weeTale.variant.laird.victory_taxman', requires: ['victory', 'laird', 'has_name', 'taxman'] },

  // ── v3 — Selkie (tidal/lyrical) ───────────────────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Selkie (shipped)".
  // Between-worlds; paired opposites; never resolves cleanly.
  { key: 'ui.weeTale.variant.selkie.death_baseline', requires: ['death', 'selkie', 'has_name'] },
  { key: 'ui.weeTale.variant.selkie.death_short', requires: ['death', 'selkie', 'has_name', 'short'] },
  // Tier-4 — The selkie met the Each-Uisge. Two water-creatures; the wrong one surfaced.
  { key: 'ui.weeTale.variant.selkie.death_each_uisge', requires: ['death', 'selkie', 'has_name', 'each_uisge_death'] },
  { key: 'ui.weeTale.variant.selkie.victory_baseline', requires: ['victory', 'selkie', 'has_name'] },
  { key: 'ui.weeTale.variant.selkie.victory_epic', requires: ['victory', 'selkie', 'has_name', 'epic'] },
  { key: 'ui.weeTale.variant.morningside.death_baseline', requires: ['death', 'morningside', 'has_name'] },
  { key: 'ui.weeTale.variant.morningside.death_short', requires: ['death', 'morningside', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.morningside.victory_baseline', requires: ['victory', 'morningside', 'has_name'] },
  { key: 'ui.weeTale.variant.morningside.victory_taxman', requires: ['victory', 'morningside', 'has_name', 'taxman'] },
  // Tier-4 — The Morningsider disputed the Laird's deed. Quietly, firmly, then not at all.
  { key: 'ui.weeTale.variant.morningside.death_the_laird', requires: ['death', 'morningside', 'has_name', 'the_laird_death'] },
  // Three drams deep and still swinging.
  { key: 'ui.weeTale.variant.drouthy.death_baseline', requires: ['death', 'drouthy', 'has_name'] },
  { key: 'ui.weeTale.variant.drouthy.death_short', requires: ['death', 'drouthy', 'has_name', 'short'] },
  // Tier-4 — The drunk haggis strayed near the water. The loch-horse waits for that.
  { key: 'ui.weeTale.variant.drouthy.death_each_uisge', requires: ['death', 'drouthy', 'has_name', 'each_uisge_death'] },
  { key: 'ui.weeTale.variant.drouthy.victory_baseline', requires: ['victory', 'drouthy', 'has_name'] },
  { key: 'ui.weeTale.variant.drouthy.victory_taxman', requires: ['victory', 'drouthy', 'has_name', 'taxman'] },
  // Every beat a footstep; the ceòl mòr rides this one.
  { key: 'ui.weeTale.variant.pibroch.death_baseline', requires: ['death', 'pibroch', 'has_name'] },
  { key: 'ui.weeTale.variant.pibroch.death_short', requires: ['death', 'pibroch', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.pibroch.victory_baseline', requires: ['victory', 'pibroch', 'has_name'] },
  { key: 'ui.weeTale.variant.pibroch.victory_taxman', requires: ['victory', 'pibroch', 'has_name', 'taxman'] },
  // Tier-4 — The pibroch played into the Cailleach's storm. The storm played louder.
  { key: 'ui.weeTale.variant.pibroch.death_cailleach_boss', requires: ['death', 'pibroch', 'has_name', 'cailleach_boss_death'] },
  // Peedie as a standing stone; patient as the Ring o' Brodgar.
  { key: 'ui.weeTale.variant.orcadian.death_baseline', requires: ['death', 'orcadian', 'has_name'] },
  { key: 'ui.weeTale.variant.orcadian.death_short', requires: ['death', 'orcadian', 'has_name', 'short'] },
  // Tier-4 — Orcadian haggis fell to the Nuckelavee. The island's own beast.
  { key: 'ui.weeTale.variant.orcadian.death_nuckelavee', requires: ['death', 'orcadian', 'has_name', 'nuckelavee_death'] },
  { key: 'ui.weeTale.variant.orcadian.victory_baseline', requires: ['victory', 'orcadian', 'has_name'] },
  { key: 'ui.weeTale.variant.orcadian.victory_taxman', requires: ['victory', 'orcadian', 'has_name', 'taxman'] },
  // From the machair's edge — water-born, shore-wise.
  { key: 'ui.weeTale.variant.hebridean.death_baseline', requires: ['death', 'hebridean', 'has_name'] },
  { key: 'ui.weeTale.variant.hebridean.death_short', requires: ['death', 'hebridean', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.hebridean.victory_baseline', requires: ['victory', 'hebridean', 'has_name'] },
  { key: 'ui.weeTale.variant.hebridean.victory_taxman', requires: ['victory', 'hebridean', 'has_name', 'taxman'] },
  // Tier-4 — Island variant meets the loch-horse. Knew every sea-mood — not this one.
  { key: 'ui.weeTale.variant.hebridean.death_each_uisge', requires: ['death', 'hebridean', 'has_name', 'each_uisge_death'] },
  // Dunted to glory — accumulates damage bonus per hit taken.
  { key: 'ui.weeTale.variant.iron_brew.death_baseline', requires: ['death', 'iron_brew', 'has_name'] },
  { key: 'ui.weeTale.variant.iron_brew.death_short', requires: ['death', 'iron_brew', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.iron_brew.victory_baseline', requires: ['victory', 'iron_brew', 'has_name'] },
  { key: 'ui.weeTale.variant.iron_brew.victory_taxman', requires: ['victory', 'iron_brew', 'has_name', 'taxman'] },
  // Tier-4 — The Nuckelavee doesnae drink. {name} offered a swig anyway.
  { key: 'ui.weeTale.variant.iron_brew.death_nuckelavee', requires: ['death', 'iron_brew', 'has_name', 'nuckelavee_death'] },
  // Gran's Best — fierce at the low end; Gran's voice throughout.
  { key: 'ui.weeTale.variant.grans_best.death_baseline', requires: ['death', 'grans_best', 'has_name'] },
  { key: 'ui.weeTale.variant.grans_best.death_short', requires: ['death', 'grans_best', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.grans_best.victory_baseline', requires: ['victory', 'grans_best', 'has_name'] },
  { key: 'ui.weeTale.variant.grans_best.victory_taxman', requires: ['victory', 'grans_best', 'has_name', 'taxman'] },
  // Tier-4 — Gran's shortbread vs the Winter Queen's cold. {name} had nae third option.
  { key: 'ui.weeTale.variant.grans_best.death_cailleach_boss', requires: ['death', 'grans_best', 'has_name', 'cailleach_boss_death'] },
  // The Pict — ancient warrior; no shop, relies on the moor's drops.
  { key: 'ui.weeTale.variant.the_pict.death_baseline', requires: ['death', 'the_pict', 'has_name'] },
  { key: 'ui.weeTale.variant.the_pict.death_short', requires: ['death', 'the_pict', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.the_pict.victory_baseline', requires: ['victory', 'the_pict', 'has_name'] },
  { key: 'ui.weeTale.variant.the_pict.victory_taxman', requires: ['victory', 'the_pict', 'has_name', 'taxman'] },
  // Tier-4 — The Pict met the Hunter-General. Woad-marked versus pith-helmeted; oldest soldier, newest officer.
  { key: 'ui.weeTale.variant.the_pict.death_hunter_general', requires: ['death', 'the_pict', 'has_name', 'hunter_general_death'] },
  // The Jacobite — Flora's Plaid; for the Cause; tragic-romantic.
  { key: 'ui.weeTale.variant.jacobite.death_baseline', requires: ['death', 'jacobite', 'has_name'] },
  { key: 'ui.weeTale.variant.jacobite.death_short', requires: ['death', 'jacobite', 'has_name', 'short'] },
  // Tier-4 — The Jacobite met Good Sir James Douglas. Old Scotland versus older Scotland.
  { key: 'ui.weeTale.variant.jacobite.death_black_douglas', requires: ['death', 'jacobite', 'has_name', 'black_douglas_death'] },
  { key: 'ui.weeTale.variant.jacobite.victory_baseline', requires: ['victory', 'jacobite', 'has_name'] },
  { key: 'ui.weeTale.variant.jacobite.victory_taxman', requires: ['victory', 'jacobite', 'has_name', 'taxman'] },
  // Tam-o'-Shanter — Burns's reckless horseman; prestige; Alloway road.
  { key: 'ui.weeTale.variant.tam_o_shanter.death_baseline', requires: ['death', 'tam_o_shanter', 'has_name'] },
  { key: 'ui.weeTale.variant.tam_o_shanter.death_short', requires: ['death', 'tam_o_shanter', 'has_name', 'short'] },
  // Tier-4 — Tam met Earl Beardie's cards on the Glamis road. Burns found this one too.
  { key: 'ui.weeTale.variant.tam_o_shanter.death_earl_beardie', requires: ['death', 'tam_o_shanter', 'has_name', 'earl_beardie_death'] },
  { key: 'ui.weeTale.variant.tam_o_shanter.victory_baseline', requires: ['victory', 'tam_o_shanter', 'has_name'] },
  { key: 'ui.weeTale.variant.tam_o_shanter.victory_taxman', requires: ['victory', 'tam_o_shanter', 'has_name', 'taxman'] },
  // The Engineer — Scotland's great builders; the turret; two shooters on the moor.
  { key: 'ui.weeTale.variant.engineer.death_baseline', requires: ['death', 'engineer', 'has_name'] },
  { key: 'ui.weeTale.variant.engineer.death_short', requires: ['death', 'engineer', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.engineer.victory_baseline', requires: ['victory', 'engineer', 'has_name'] },
  { key: 'ui.weeTale.variant.engineer.victory_taxman', requires: ['victory', 'engineer', 'has_name', 'taxman'] },
  // Tier-4 — The weather model was right. The engineer had a turret. The Cailleach had winter.
  { key: 'ui.weeTale.variant.engineer.death_cailleach_boss', requires: ['death', 'engineer', 'has_name', 'cailleach_boss_death'] },
  // Tier-4 — The turret logged every hit on the Nuckelavee. The haggis still lost.
  { key: 'ui.weeTale.variant.engineer.death_nuckelavee', requires: ['death', 'engineer', 'has_name', 'nuckelavee_death'] },
  // The Tufted Haggis — the pup; two on the moor; companion familiar.
  { key: 'ui.weeTale.variant.tufted.death_baseline', requires: ['death', 'tufted', 'has_name'] },
  { key: 'ui.weeTale.variant.tufted.death_short', requires: ['death', 'tufted', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.tufted.victory_baseline', requires: ['victory', 'tufted', 'has_name'] },
  { key: 'ui.weeTale.variant.tufted.victory_taxman', requires: ['victory', 'tufted', 'has_name', 'taxman'] },
  // Tier-4 — The pup knew better about loch-horses. {name} followed anyway.
  { key: 'ui.weeTale.variant.tufted.death_each_uisge', requires: ['death', 'tufted', 'has_name', 'each_uisge_death'] },
  // Tier-4 — The pup hid under the table. {name} did not.
  { key: 'ui.weeTale.variant.tufted.death_earl_beardie', requires: ['death', 'tufted', 'has_name', 'earl_beardie_death'] },
] as const;
