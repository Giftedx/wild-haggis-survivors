/**
 * Sporran Deck — card pool (DESIGN_IDEAS §1, S1 Phase 0).
 *
 * Eleven cards across three families: 5 curses (wrap CURSES), 4 boons
 * (small positive), 2 quirks (mixed bidirectional). One quirk
 * (`quirk_haggis_blooded`) is deferred to Phase 2 because it needs a
 * `damageMult` lever on RunModifiers that doesn't exist today (damage
 * mult lives Player-side, applied during weapon resolution).
 *
 * Curse cards delegate to `CURSES[i].apply(m)` so the curse-balance
 * singularity stays — no reimplementation. The CurseScene remains the
 * single-curse path for players who don't opt into Sporran. Boon and
 * quirk cards mutate the bag directly; their deltas are deliberately
 * smaller than first-footing's seasonal-blessing magnitudes (the
 * sporran is everyday luck, the first-footer is the year's blessing).
 *
 * Phase 1 authors i18n copy under the `sporran.*` root and lifts the
 * draft UI. Phase 2 adds the deferred quirk + chronicle persistence.
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
      return { extraStartingHpHeal: 0 };
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
    apply: () => ({ extraStartingHpHeal: 20 }),
  },
  {
    id: 'boon_whisky',
    kind: 'boon',
    nameKey: 'sporran.boon.whisky.name',
    descKey: 'sporran.boon.whisky.desc',
    apply: (m) => {
      m.spawnIntervalMult *= 1.05;
      return { extraStartingHpHeal: 0 };
    },
  },
  {
    id: 'boon_coal',
    kind: 'boon',
    nameKey: 'sporran.boon.coal.name',
    descKey: 'sporran.boon.coal.desc',
    apply: (m) => {
      m.damageTakenMult *= 0.97;
      return { extraStartingHpHeal: 0 };
    },
  },
  {
    id: 'boon_silver',
    kind: 'boon',
    nameKey: 'sporran.boon.silver.name',
    descKey: 'sporran.boon.silver.desc',
    apply: (m) => {
      m.goldMult *= 1.10;
      return { extraStartingHpHeal: 0 };
    },
  },
];

/**
 * 2 quirk cards — bidirectional, no gold. The third quirk
 * (`quirk_haggis_blooded`) is deferred to Phase 2 (needs damageMult on
 * RunModifiers).
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
      return { extraStartingHpHeal: 0 };
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
      return { extraStartingHpHeal: 0 };
    },
  },
];

/**
 * Full Phase 0 pool — 11 cards. Order is stable for test readability;
 * `drawSporran` shuffles a copy so output is determinism-locked to the
 * RNG seed, not the array order.
 */
export const ALL_SPORRAN_CARDS: readonly SporranCard[] = [
  ...CURSE_CARDS,
  ...BOON_CARDS,
  ...QUIRK_CARDS,
];
