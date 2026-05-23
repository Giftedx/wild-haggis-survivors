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
  | 'each_uisge' | 'nicnevin' | 'the_laird' | 'hunter_general'
  | 'gordon_death' | 'tour_bus_death' | 'taxman_death'
  | 'each_uisge_death' | 'nicnevin_death' | 'the_laird_death' | 'hunter_general_death'
  | 'cursed' | 'ironmoor' | 'post_bell'
  | 'biome_bog' | 'biome_loch' | 'biome_pine' | 'biome_heather'
  | 'biome_coastal' | 'biome_haar' | 'biome_frost'
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

  // ── Victory fallbacks (single-tag) ─────────────────────────────
  { key: 'ui.weeTale.victory.fallback_a', requires: ['victory'] },
  { key: 'ui.weeTale.victory.fallback_b', requires: ['victory'] },

  // ── Victory by accomplishment ──────────────────────────────────
  { key: 'ui.weeTale.victory.epic', requires: ['victory', 'epic'] },
  { key: 'ui.weeTale.victory.cursed', requires: ['victory', 'cursed'] },
  { key: 'ui.weeTale.victory.ironmoor', requires: ['victory', 'ironmoor'] },
  { key: 'ui.weeTale.victory.taxman_kill', requires: ['victory', 'taxman'] },
  { key: 'ui.weeTale.victory.three_bosses', requires: ['victory', 'gordon', 'tour_bus', 'taxman'] },

  // ── v2 — universal {name}-bearing lines (tier-2) ───────────────
  // Picks ahead of the no-name fallbacks for any run that has a
  // generated haggis name (every shipping run does; legacy saves
  // without `name` collapse to the existing fallbacks above).
  { key: 'ui.weeTale.death.with_name_a', requires: ['death', 'has_name'] },
  { key: 'ui.weeTale.victory.with_name_a', requires: ['victory', 'has_name'] },

  // ── v2 — Cailleach (Gaelic-inflected stern-motherly elder) ─────
  // Voice register per `docs/VOICE_CARD.md` §"Cailleach (shipped)".
  // The mountain crone expects better of ye; she's never cruel.
  { key: 'ui.weeTale.variant.cailleach.death_baseline', requires: ['death', 'cailleach', 'has_name'] },
  { key: 'ui.weeTale.variant.cailleach.death_short', requires: ['death', 'cailleach', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.cailleach.victory_baseline', requires: ['victory', 'cailleach', 'has_name'] },
  { key: 'ui.weeTale.variant.cailleach.victory_taxman', requires: ['victory', 'cailleach', 'has_name', 'taxman'] },

  // ── v2 — Glaswegian (urban-aggressive, Limmy-bite) ─────────────
  // Voice register per `docs/VOICE_CARD.md` §"Glaswegian (shipped)".
  // Even Hearth lines have edge; the bite is affectionate.
  { key: 'ui.weeTale.variant.glaswegian.death_baseline', requires: ['death', 'glaswegian', 'has_name'] },
  { key: 'ui.weeTale.variant.glaswegian.death_short', requires: ['death', 'glaswegian', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.glaswegian.victory_baseline', requires: ['victory', 'glaswegian', 'has_name'] },
  { key: 'ui.weeTale.variant.glaswegian.victory_taxman', requires: ['victory', 'glaswegian', 'has_name', 'taxman'] },

  // ── v2 — Doric Quinie (Aberdeenshire fishing-village stoic) ────
  // Voice register per `docs/VOICE_CARD.md` §"Doric / Aberdonian
  // (candidate)". Sparing words; the sea minds its ain.
  { key: 'ui.weeTale.variant.doric_quinie.death_baseline', requires: ['death', 'doric_quinie', 'has_name'] },
  { key: 'ui.weeTale.variant.doric_quinie.death_long', requires: ['death', 'doric_quinie', 'has_name', 'long'] },
  { key: 'ui.weeTale.variant.doric_quinie.victory_baseline', requires: ['victory', 'doric_quinie', 'has_name'] },
  { key: 'ui.weeTale.variant.doric_quinie.victory_epic', requires: ['victory', 'doric_quinie', 'has_name', 'epic'] },

  // ── v2 — Burns's Wee Beastie (citational) ──────────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Burns's voice
  // (citational)" — every citation is verbatim Robert Burns,
  // contextually justified by the variant choice. See
  // `docs/C2_BURNS_PROVENANCE.md` for line provenance.
  { key: 'ui.weeTale.variant.burns_wee_beastie.death_baseline', requires: ['death', 'burns_wee_beastie', 'has_name'] },
  { key: 'ui.weeTale.variant.burns_wee_beastie.death_short', requires: ['death', 'burns_wee_beastie', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.burns_wee_beastie.victory_baseline', requires: ['victory', 'burns_wee_beastie', 'has_name'] },
  { key: 'ui.weeTale.variant.burns_wee_beastie.victory_epic', requires: ['victory', 'burns_wee_beastie', 'has_name', 'epic'] },

  // ── v3 — Moor Runner (Hearth + velocity) ──────────────────────
  // Hearth register; speed and momentum language. classic uses generics only.
  { key: 'ui.weeTale.variant.moor_runner.death_baseline', requires: ['death', 'moor_runner', 'has_name'] },
  { key: 'ui.weeTale.variant.moor_runner.death_short', requires: ['death', 'moor_runner', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.moor_runner.victory_baseline', requires: ['victory', 'moor_runner', 'has_name'] },
  { key: 'ui.weeTale.variant.moor_runner.victory_epic', requires: ['victory', 'moor_runner', 'has_name', 'epic'] },

  // ── v3 — Iron Belly (Hearth + stoic toughness) ─────────────────
  // Hearth register; spare, mythic. Iron / dented / absorbed language.
  { key: 'ui.weeTale.variant.iron_belly.death_baseline', requires: ['death', 'iron_belly', 'has_name'] },
  { key: 'ui.weeTale.variant.iron_belly.death_short', requires: ['death', 'iron_belly', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.iron_belly.victory_baseline', requires: ['victory', 'iron_belly', 'has_name'] },
  { key: 'ui.weeTale.variant.iron_belly.victory_taxman', requires: ['victory', 'iron_belly', 'has_name', 'taxman'] },

  // ── v3 — Glen Forager (Hearth + foraging/wilderness) ───────────
  // Hearth register; resourceful, observant. Pockets/haul/glen language.
  { key: 'ui.weeTale.variant.glen_forager.death_baseline', requires: ['death', 'glen_forager', 'has_name'] },
  { key: 'ui.weeTale.variant.glen_forager.death_short', requires: ['death', 'glen_forager', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.glen_forager.victory_baseline', requires: ['victory', 'glen_forager', 'has_name'] },
  { key: 'ui.weeTale.variant.glen_forager.victory_epic', requires: ['victory', 'glen_forager', 'has_name', 'epic'] },

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
  { key: 'ui.weeTale.variant.witch_hare.victory_baseline', requires: ['victory', 'witch_hare', 'has_name'] },
  { key: 'ui.weeTale.variant.witch_hare.victory_epic', requires: ['victory', 'witch_hare', 'has_name', 'epic'] },

  // ── v3 — Anticlockwise (wry mirror-subspecies) ─────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Anticlockwise (shipped)".
  // Dry wit; acknowledges its own wrongness without winking too hard.
  { key: 'ui.weeTale.variant.anticlockwise.death_baseline', requires: ['death', 'anticlockwise', 'has_name'] },
  { key: 'ui.weeTale.variant.anticlockwise.death_short', requires: ['death', 'anticlockwise', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.anticlockwise.victory_baseline', requires: ['victory', 'anticlockwise', 'has_name'] },
  { key: 'ui.weeTale.variant.anticlockwise.victory_taxman', requires: ['victory', 'anticlockwise', 'has_name', 'taxman'] },

  // ── v3 — Wee Ghostie (spectral/gentle) ────────────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Wee Ghostie (shipped)".
  // Hearth register with spectral thinness; small, surprised to still be here.
  { key: 'ui.weeTale.variant.wee_ghostie.death_baseline', requires: ['death', 'wee_ghostie', 'has_name'] },
  { key: 'ui.weeTale.variant.wee_ghostie.death_short', requires: ['death', 'wee_ghostie', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.wee_ghostie.victory_baseline', requires: ['victory', 'wee_ghostie', 'has_name'] },
  { key: 'ui.weeTale.variant.wee_ghostie.victory_epic', requires: ['victory', 'wee_ghostie', 'has_name', 'epic'] },

  // ── v3 — Laird (estate-Scots formality) ───────────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Laird (shipped)".
  // Landed gentry cadence; unhurried; mildly imperious; dry understatement.
  { key: 'ui.weeTale.variant.laird.death_baseline', requires: ['death', 'laird', 'has_name'] },
  { key: 'ui.weeTale.variant.laird.death_short', requires: ['death', 'laird', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.laird.victory_baseline', requires: ['victory', 'laird', 'has_name'] },
  { key: 'ui.weeTale.variant.laird.victory_taxman', requires: ['victory', 'laird', 'has_name', 'taxman'] },

  // ── v3 — Selkie (tidal/lyrical) ───────────────────────────────
  // Voice register per `docs/VOICE_CARD.md` §"Selkie (shipped)".
  // Between-worlds; paired opposites; never resolves cleanly.
  { key: 'ui.weeTale.variant.selkie.death_baseline', requires: ['death', 'selkie', 'has_name'] },
  { key: 'ui.weeTale.variant.selkie.death_short', requires: ['death', 'selkie', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.selkie.victory_baseline', requires: ['victory', 'selkie', 'has_name'] },
  { key: 'ui.weeTale.variant.selkie.victory_epic', requires: ['victory', 'selkie', 'has_name', 'epic'] },
  { key: 'ui.weeTale.variant.morningside.death_baseline', requires: ['death', 'morningside', 'has_name'] },
  { key: 'ui.weeTale.variant.morningside.death_short', requires: ['death', 'morningside', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.morningside.victory_baseline', requires: ['victory', 'morningside', 'has_name'] },
  { key: 'ui.weeTale.variant.morningside.victory_taxman', requires: ['victory', 'morningside', 'has_name', 'taxman'] },
  // Three drams deep and still swinging.
  { key: 'ui.weeTale.variant.drouthy.death_baseline', requires: ['death', 'drouthy', 'has_name'] },
  { key: 'ui.weeTale.variant.drouthy.death_short', requires: ['death', 'drouthy', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.drouthy.victory_baseline', requires: ['victory', 'drouthy', 'has_name'] },
  { key: 'ui.weeTale.variant.drouthy.victory_taxman', requires: ['victory', 'drouthy', 'has_name', 'taxman'] },
  // Every beat a footstep; the ceòl mòr rides this one.
  { key: 'ui.weeTale.variant.pibroch.death_baseline', requires: ['death', 'pibroch', 'has_name'] },
  { key: 'ui.weeTale.variant.pibroch.death_short', requires: ['death', 'pibroch', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.pibroch.victory_baseline', requires: ['victory', 'pibroch', 'has_name'] },
  { key: 'ui.weeTale.variant.pibroch.victory_taxman', requires: ['victory', 'pibroch', 'has_name', 'taxman'] },
  // Peedie as a standing stone; patient as the Ring o' Brodgar.
  { key: 'ui.weeTale.variant.orcadian.death_baseline', requires: ['death', 'orcadian', 'has_name'] },
  { key: 'ui.weeTale.variant.orcadian.death_short', requires: ['death', 'orcadian', 'has_name', 'short'] },
  { key: 'ui.weeTale.variant.orcadian.victory_baseline', requires: ['victory', 'orcadian', 'has_name'] },
  { key: 'ui.weeTale.variant.orcadian.victory_taxman', requires: ['victory', 'orcadian', 'has_name', 'taxman'] },
] as const;
