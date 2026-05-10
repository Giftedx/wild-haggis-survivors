/**
 * Sporran Deck — card pool (DESIGN_IDEAS §1, Phase 0 + 1 + 1.5 + 2 + 3).
 *
 * Phase 0–1.5: 12 base cards (5 curses + 4 boons + 3 quirks). Curse
 * cards delegate to `CURSES[i].apply(m)` so the curse-balance singularity
 * stays — no reimplementation. The CurseScene remains the single-curse
 * path for players who don't opt into Sporran. Boon and quirk cards
 * mutate the bag directly; their deltas are deliberately smaller than
 * first-footing's seasonal-blessing magnitudes (the sporran is everyday
 * luck, the first-footer is the year's blessing).
 *
 * Phase 2: chronicle persistence + replay v4 (no card additions).
 *
 * Phase 3 (this file): pool grows 12 → 18 with three gated families —
 * - 2 deed-gated rares (`rare_*`) — past-victories or cursed-runs threshold
 * - 2 seasonal-date-gated (`seasonal_*`) — only drawable while a
 *   matching SeasonalEvent window is open
 * - 2 variant-keyed (`variant_*`) — only drawable when the matching
 *   variant is selected
 *
 * Gates evaluate via `filterEligibleSporranCards(pool, ctx)` from
 * `systems/sporranDeck.ts`. The 12 base cards stay un-gated; the draw
 * always sees them. The 6 Phase 3 cards conditionally appear, so a
 * fresh-save player at default variant gets the original 12-card pool;
 * a Witch's-Hare player on Burns Night sees up to 18.
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
];

/**
 * Full pool — 18 cards across four families:
 * - 12 base (Phase 0–1.5: 5 curses + 4 boons + 3 quirks)
 * - 2 deed-gated rares (Phase 3)
 * - 2 seasonal-gated (Phase 3)
 * - 2 variant-keyed (Phase 3)
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
