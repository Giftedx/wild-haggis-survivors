/**
 * Sporran Deck — card pool (DESIGN_IDEAS §1, Phase 0 + 1 + 1.5).
 *
 * Twelve cards across three families: 5 curses (wrap CURSES), 4 boons
 * (small positive), 3 quirks (mixed bidirectional). The 12th card
 * (`quirk_haggis_blooded`) lifted from Phase 2 deferral via the
 * `extraDamageMultiplier` post-spawn hook on `SporranCardApplyResult`
 * — sidesteps the missing `RunModifiers.damageMult` lever by routing
 * through the same Player-side application path the boon-shortbread
 * heal already uses.
 *
 * Curse cards delegate to `CURSES[i].apply(m)` so the curse-balance
 * singularity stays — no reimplementation. The CurseScene remains the
 * single-curse path for players who don't opt into Sporran. Boon and
 * quirk cards mutate the bag directly; their deltas are deliberately
 * smaller than first-footing's seasonal-blessing magnitudes (the
 * sporran is everyday luck, the first-footer is the year's blessing).
 *
 * Phase 1 authored i18n copy under the `sporran.*` root and lifted
 * the draft UI. Phase 2 = chronicle persistence (RunHistoryEntry
 * sporranPicks, schema bump v18→v19, replay-side pick replay).
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
 * Full pool — 12 cards (Phase 1.5: lifted `quirk_haggis_blooded` from
 * Phase 2 deferral). Order is stable for test readability;
 * `drawSporran` shuffles a copy so output is determinism-locked to
 * the RNG seed, not the array order.
 */
export const ALL_SPORRAN_CARDS: readonly SporranCard[] = [
  ...CURSE_CARDS,
  ...BOON_CARDS,
  ...QUIRK_CARDS,
];
