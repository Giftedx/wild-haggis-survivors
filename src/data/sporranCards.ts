/**
 * Sporran Deck — card pool (DESIGN_IDEAS §1, Phase 0 + 1 + 1.5 + 2 + 3).
 *
 * Phase 0–1.5: 12 original base cards (5 curses + 4 boons + 3 quirks). Curse
 * cards delegate to `CURSES[i].apply(m)` so the curse-balance singularity
 * stays — no reimplementation. The CurseScene remains the single-curse
 * path for players who don't opt into Sporran. Boon and quirk cards
 * mutate the bag directly; their deltas are deliberately smaller than
 * first-footing's seasonal-blessing magnitudes (the sporran is everyday
 * luck, the first-footer is the year's blessing).
 *
 * Phase 2: chronicle persistence + replay v4 (no card additions).
 *
 * Current pool layers Hearth-register comforts onto the original 12,
 * then keeps three gated families —
 * - 2 deed-gated rares (`rare_*`) — past-victories or cursed-runs threshold
 * - seasonal-date-gated (`seasonal_*`) — only drawable while a
 *   matching SeasonalEvent window is open
 * - 2 variant-keyed (`variant_*`) — only drawable when the matching
 *   variant is selected
 *
 * Gates evaluate via `filterEligibleSporranCards(pool, ctx)` from
 * `systems/sporranDeck.ts`. The 15 ungated cards stay available; the
 * gated cards conditionally appear, so a fresh-save player at default
 * variant gets the common 15-card pool; a Witch's-Hare player on Burns
 * Night sees the matching earned extras too.
 */

import type { SporranCard } from '../systems/sporranDeck';
import { CURSES } from './curses';

const curseByKey = new Map(CURSES.map((c) => [c.key, c]));

/**
 * Wrap an existing CURSES entry as a sporran card. The card delegates
 * to the curse's own `apply` so the gold-bonus + penalty math stays
 * single-source. Sporran's curse cards REUSE the curse i18n keys —
 * Phase 1 may author dedicated `sporran.curse.*` keys later, but Phase
 * 0 saves the copy duplication.
 */
function wrapCurse(curseKey: string, cardId: string): SporranCard {
  const def = curseByKey.get(curseKey as never);
  if (!def) {
    throw new Error(`sporranCards: unknown curse key '${curseKey}'`);
  }
  return {
    id: cardId,
    kind: 'curse',
    nameKey: def.nameKey,
    descKey: def.descKey,
    apply: (m) => {
      def.apply(m);
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  };
}

/** 5 curse cards — direct wrappers of CURSES. */
const CURSE_CARDS: readonly SporranCard[] = [
  wrapCurse('heavy_legs', 'curse_heavy_legs'),
  wrapCurse('thin_hide', 'curse_thin_hide'),
  wrapCurse('restless_spirits', 'curse_restless_spirits'),
  wrapCurse('empty_larder', 'curse_empty_larder'),
  wrapCurse('windless_pipes', 'curse_windless_pipes'),
];

/**
 * 4 boon cards — small positive levers, no gold change. Deliberately
 * smaller than first-footing's gifts so the sporran reads as everyday
 * luck rather than a Hogmanay blessing.
 */
const BOON_CARDS: readonly SporranCard[] = [
  {
    id: 'boon_shortbread',
    kind: 'boon',
    nameKey: 'sporran.boon.shortbread.name',
    descKey: 'sporran.boon.shortbread.desc',
    apply: () => ({ extraStartingHpHeal: 20, extraDamageMultiplier: 0 }),
  },
  {
    id: 'boon_whisky',
    kind: 'boon',
    nameKey: 'sporran.boon.whisky.name',
    descKey: 'sporran.boon.whisky.desc',
    apply: (m) => {
      m.spawnIntervalMult *= 1.05;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
  {
    id: 'boon_coal',
    kind: 'boon',
    nameKey: 'sporran.boon.coal.name',
    descKey: 'sporran.boon.coal.desc',
    apply: (m) => {
      m.damageTakenMult *= 0.97;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
  {
    id: 'boon_silver',
    kind: 'boon',
    nameKey: 'sporran.boon.silver.name',
    descKey: 'sporran.boon.silver.desc',
    apply: (m) => {
      m.goldMult *= 1.10;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
];

/**
 * 3 quirk cards — bidirectional, no gold. `quirk_haggis_blooded`
 * threads its +damage delta through the post-spawn
 * `extraDamageMultiplier` hook rather than the modifier bag, since
 * `RunModifiers` doesn't expose a damage-mult lever (damage-mult is
 * Player-side, applied during weapon resolution). The trade is +12 %
 * damage with a 12 % bigger hit when the moor lands — the haggis
 * runs hot, the moor reads hot back.
 */
const QUIRK_CARDS: readonly SporranCard[] = [
  {
    id: 'quirk_light_step',
    kind: 'quirk',
    nameKey: 'sporran.quirk.light_step.name',
    descKey: 'sporran.quirk.light_step.desc',
    apply: (m) => {
      m.moveSpeedMult *= 1.05;
      m.damageTakenMult *= 1.05;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
  {
    id: 'quirk_hardy_breath',
    kind: 'quirk',
    nameKey: 'sporran.quirk.hardy_breath.name',
    descKey: 'sporran.quirk.hardy_breath.desc',
    apply: (m) => {
      m.startHpRatio *= 1.10;
      m.moveSpeedMult *= 0.97;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
  {
    id: 'quirk_haggis_blooded',
    kind: 'quirk',
    nameKey: 'sporran.quirk.haggis_blooded.name',
    descKey: 'sporran.quirk.haggis_blooded.desc',
    apply: (m) => {
      // +12 % damage, +12 % damage taken — runs hot, moor reads hot.
      m.damageTakenMult *= 1.12;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0.12 };
    },
  },
];

/**
 * Hearth-register cards — ungated everyday comforts that read warmer
 * than the deed / seasonal / variant cards. Small mixed profiles keep
 * them in the common draft without crowding out curse stakes.
 */
const HEARTH_CARDS: readonly SporranCard[] = [
  {
    id: 'hearth_kettle_on',
    kind: 'boon',
    nameKey: 'sporran.hearth.kettle_on.name',
    descKey: 'sporran.hearth.kettle_on.desc',
    // A cuppa before the bell: modest immediate safety, no quirk cost.
    apply: () => ({ extraStartingHpHeal: 18, extraDamageMultiplier: 0 }),
  },
  {
    id: 'hearth_grans_shawl',
    kind: 'quirk',
    nameKey: 'sporran.hearth.grans_shawl.name',
    descKey: 'sporran.hearth.grans_shawl.desc',
    apply: (m) => {
      // Wrapped up warm: hits land softer, but the feet are less eager.
      m.damageTakenMult *= 0.93;
      m.moveSpeedMult *= 0.96;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
  {
    id: 'hearth_banked_ember',
    kind: 'quirk',
    nameKey: 'sporran.hearth.banked_ember.name',
    descKey: 'sporran.hearth.banked_ember.desc',
    apply: (m) => {
      // Keep the fire ready: faster weapon rhythm, paid for with a
      // smaller starting heart pool.
      m.weaponCooldownMult *= 0.95;
      m.startHpRatio *= 0.94;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
];

/**
 * Phase 3 — 2 deed-gated rares. Both unlock from lifetime stats already
 * tracked on `VariantProgressSnapshot` (no new save fields). `rare_*`
 * naming sister to the existing `curse_*` / `boon_*` / `quirk_*` so the
 * coercion regex (`^[a-z_]+$`) keeps holding.
 *
 * Voice register (Hearth/Edge per VOICE_CARD): both lean Edge — these
 * are scars from past runs, not first-footer warmth.
 */
const RARE_DEED_CARDS: readonly SporranCard[] = [
  {
    id: 'rare_taxman_grudge',
    kind: 'quirk',
    nameKey: 'sporran.rare.taxman_grudge.name',
    descKey: 'sporran.rare.taxman_grudge.desc',
    eligibility: { type: 'deed', condition: { type: 'victories', required: 1 } },
    apply: (m) => {
      // +20% gold, -10% starting HP. Carried home a grudge after the
      // first Taxman fall; rest of the moor takes notice.
      m.goldMult *= 1.20;
      m.startHpRatio *= 0.90;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
  {
    id: 'rare_witchs_thread',
    kind: 'quirk',
    nameKey: 'sporran.rare.witchs_thread.name',
    descKey: 'sporran.rare.witchs_thread.desc',
    eligibility: { type: 'deed', condition: { type: 'cursed_victories', required: 5 } },
    apply: (m) => {
      // Stronger version of haggis_blooded — gated on five cursed
      // wins. +14% damage, +14% damage taken. Spool unwound from a
      // witch's coat; bites both ways.
      m.damageTakenMult *= 1.14;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0.14 };
    },
  },
];

/**
 * Phase 3 — 2 seasonal-date-gated cards. Only drawable while the named
 * SeasonalEvent window is open (per `getActiveSeasonalEventKey`). Sister
 * to first-footing seasonal blessings but small-stakes (sporran-everyday
 * vs Hogmanay-blessing magnitudes).
 */
const SEASONAL_CARDS: readonly SporranCard[] = [
  {
    id: 'seasonal_burns_dram',
    kind: 'boon',
    nameKey: 'sporran.seasonal.burns_dram.name',
    descKey: 'sporran.seasonal.burns_dram.desc',
    eligibility: { type: 'seasonal', eventKey: 'burns_night' },
    // +20 starting HP + +5% damage. The Bard pours one for the road.
    apply: () => ({ extraStartingHpHeal: 20, extraDamageMultiplier: 0.05 }),
  },
  {
    id: 'seasonal_samhain_lantern',
    kind: 'boon',
    nameKey: 'sporran.seasonal.samhain_lantern.name',
    descKey: 'sporran.seasonal.samhain_lantern.desc',
    eligibility: { type: 'seasonal', eventKey: 'samhain' },
    apply: (m) => {
      // Spawn rate slowed 5%, +15 starting HP. Turnip lantern keeps a
      // wee folk-ward over the moor.
      m.spawnIntervalMult *= 1.05;
      return { extraStartingHpHeal: 15, extraDamageMultiplier: 0 };
    },
  },
  {
    id: 'seasonal_hogmanay_coal',
    kind: 'quirk',
    nameKey: 'sporran.seasonal.hogmanay_coal.name',
    descKey: 'sporran.seasonal.hogmanay_coal.desc',
    eligibility: { type: 'seasonal', eventKey: 'hogmanay' },
    apply: (m) => {
      // Coal from the dark first-footer: warmth keeps the fingers nimble
      // (+8% faster weapon fire), but the Hogmanay gloaming bites back
      // (+7% damage taken). Distinct from the run-start Hogmanay blessing
      // which rolls a broader first-footing gift.
      m.weaponCooldownMult *= 0.92;
      m.damageTakenMult *= 1.07;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
  {
    id: 'seasonal_beltane_spark',
    kind: 'quirk',
    nameKey: 'sporran.seasonal.beltane_spark.name',
    descKey: 'sporran.seasonal.beltane_spark.desc',
    eligibility: { type: 'seasonal', eventKey: 'beltane' },
    apply: (m) => {
      // Beltane fire-walker: carry the flame (+12% damage) but the
      // crossing costs — start with less heart (−8% HP pool).
      m.startHpRatio *= 0.92;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0.12 };
    },
  },
  {
    id: 'seasonal_st_andrews_saltire',
    kind: 'boon',
    nameKey: 'sporran.seasonal.st_andrews_saltire.name',
    descKey: 'sporran.seasonal.st_andrews_saltire.desc',
    eligibility: { type: 'seasonal', eventKey: 'st_andrews' },
    apply: (m) => {
      // A saltire ribbon from the winter market: just enough lift to
      // steady the hooves and soften the first scrape. St Andrew's only.
      m.moveSpeedMult *= 1.04;
      m.damageTakenMult *= 0.98;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
];

/**
 * Phase 3 — 2 variant-keyed cards. Only drawable when the matching
 * variant is selected. Tone matches the variant's voice register
 * (Cailleach = Fey-Edge, Glaswegian = Hearth-with-grit per Voice Card).
 */
const VARIANT_CARDS: readonly SporranCard[] = [
  {
    id: 'variant_cailleach_frost',
    kind: 'quirk',
    nameKey: 'sporran.variant.cailleach_frost.name',
    descKey: 'sporran.variant.cailleach_frost.desc',
    eligibility: { type: 'variant', variantKey: 'cailleach' },
    apply: (m) => {
      // +8% damage, ×0.95 move-speed. The hag's breath rims the spear
      // but slows the foot.
      m.moveSpeedMult *= 0.95;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0.08 };
    },
  },
  {
    id: 'variant_glaswegian_buckie',
    kind: 'quirk',
    nameKey: 'sporran.variant.glaswegian_buckie.name',
    descKey: 'sporran.variant.glaswegian_buckie.desc',
    eligibility: { type: 'variant', variantKey: 'glaswegian' },
    apply: (m) => {
      // +6% damage, ×1.06 damage-taken. Buckie under yer arm — ready
      // for onybody, but yer guard slips.
      m.damageTakenMult *= 1.06;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0.06 };
    },
  },
  {
    id: 'variant_witch_hare_familiar',
    kind: 'quirk',
    nameKey: 'sporran.variant.witch_hare_familiar.name',
    descKey: 'sporran.variant.witch_hare_familiar.desc',
    eligibility: { type: 'variant', variantKey: 'witch_hare' },
    apply: (m) => {
      // Isobel Gowdie's familiar rides the pocket: +10% damage, but the
      // binding asks a tithe — start with 10% less HP.
      m.startHpRatio *= 0.90;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0.10 };
    },
  },
  {
    id: 'variant_selkie_sealskin',
    kind: 'quirk',
    nameKey: 'sporran.variant.selkie_sealskin.name',
    descKey: 'sporran.variant.selkie_sealskin.desc',
    eligibility: { type: 'variant', variantKey: 'selkie' },
    apply: (m) => {
      // The sealskin gives speed (+9% move) but the tide keeps its own
      // rhythm — weapon fire slows 6% (the seal doesn't rush the hunt).
      m.moveSpeedMult *= 1.09;
      m.weaponCooldownMult *= 1.06;
      return { extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
    },
  },
];

/**
 * Full pool — 26 cards across five families:
 * - 15 base (Phase 0–1.5: 5 curses + 4 boons + 3 quirks; Hearth: 3)
 * - 2 deed-gated rares (Phase 3)
 * - 5 seasonal-gated (Phase 3: burns_dram, samhain_lantern; Phase 4: hogmanay_coal, beltane_spark; St Andrew's follow-up: st_andrews_saltire)
 * - 4 variant-keyed (Phase 3: cailleach_frost, glaswegian_buckie; Phase 4: witch_hare_familiar, selkie_sealskin)
 *
 * Order is stable for test readability; `drawSporran` shuffles a copy
 * so output is determinism-locked to the RNG seed, not the array order.
 * Eligibility filter (`filterEligibleSporranCards`) reduces the pool
 * to the drawable subset before the shuffle — the gated cards are
 * absent from the draw when the context fails their gate.
 */
export const ALL_SPORRAN_CARDS: readonly SporranCard[] = [
  ...CURSE_CARDS,
  ...BOON_CARDS,
  ...QUIRK_CARDS,
  ...HEARTH_CARDS,
  ...RARE_DEED_CARDS,
  ...SEASONAL_CARDS,
  ...VARIANT_CARDS,
];

/**
 * Stable ID set derived from `ALL_SPORRAN_CARDS`. Sister to `RELIC_KEYS`
 * — used by `coerceRunHistoryEntry` (S1 Phase 2) to drop stale picks
 * from older saves so a renamed or removed card never poisons the
 * Chronicle. Frozen so callers can't mutate at the import boundary.
 */
export const SPORRAN_CARD_IDS: ReadonlySet<string> = new Set(
  ALL_SPORRAN_CARDS.map((c) => c.id),
);
