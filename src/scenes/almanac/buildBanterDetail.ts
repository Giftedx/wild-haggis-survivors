/**
 * C1 Highland Almanac — expanded detail view-model for one Banter pool.
 *
 * Pure — converts a `BanterPoolEntryVM` into the strings/i18n keys the
 * expanded panel draws. Tests lock the silhouette policy (unheard lines
 * never leak their authored text) and the trigger-hint fallback for
 * pools whose authored hint leaf isn't shipped yet.
 *
 * i18n contract:
 *   - `ui.almanac.banter_pool.<context>.label` — pool display name.
 *   - `ui.almanac.banter_pool.<context>.hint`  — trigger-context hint
 *     copy shown next to unheard ??? rows so the player knows *when*
 *     the line fires without spoiling *what* it says.
 *   - `ui.almanac.banter_tone_<tone>` — tone chip label.
 *   - Line text itself is the pool's own i18n key (e.g.
 *     `ui.banter.low_hp.a`) — that resolution happens in `BanterBook.ts`
 *     at render time.
 */

import type { BanterPoolEntryVM, BanterLineVM } from './buildBanterEntries';

export interface BanterHeardLineVM {
  readonly key: string;
  readonly tag: string | null;
  readonly hearCount: number;
  readonly firstHeardText: string | null;
}

export interface BanterUnheardLineVM {
  readonly key: string;
  readonly tag: string | null;
  /** Stable placeholder shown instead of the authored line. */
  readonly teaserText: string;
}

export interface BanterDetailVM {
  readonly titleKey: string;
  readonly titleFallback: string;
  readonly hintKey: string;
  readonly hintFallback: string;
  readonly toneLabelKey: string;
  readonly rare: boolean;
  readonly totalLines: number;
  readonly heardLines: number;
  readonly progressText: string;
  readonly heard: readonly BanterHeardLineVM[];
  readonly unheard: readonly BanterUnheardLineVM[];
}

const TEASER_TEXT = '???';

/** Hint fallbacks per context — shown if the authored `.hint` i18n leaf
 *  hasn't shipped yet. Phrased so they read as Gran-voice in-world
 *  gossip, not dev notes. */
const HINT_FALLBACK: Record<string, string> = {
  first_time: 'Fires the first time ye hit a milestone.',
  boss_warn: 'Fires when a boss is on approach.',
  low_hp: 'Fires when yir health dips low.',
  boss_down: 'Fires when ye fell a boss.',
  weapon_evolve: 'Fires when a weapon graduates tae its legendary form.',
  curse_start: 'Fires when ye pick a curse at the Croft door.',
  level_up: 'Fires on level up.',
  first_blood: 'Fires on the first kill of a run.',
  kill_streak: 'Fires when the culls stack up.',
  recover: 'Fires when ye claw health back after a dip.',
  biome_change: 'Fires when the moor shifts beneath ye.',
  moor_moment: 'Fires when the moor offers a wee painted beat.',
  idle: 'Fires in quiet stretches between fights.',
  act_intermission_enter: 'Fires when the Moor Road opens.',
  act_complete: 'Fires when an act closes oot.',
  route_picked: 'Fires when ye choose a road.',
  gran_commentary: 'Fires as Gran hovers at the edge o\' the run.',
  death_reflection: 'Fires on the death screen.',
  haggis_ambient: 'Fires while the wee beastie trots between scraps.',
  burns_citation: 'Fires when a moment echoes a Burns line.',
  reliquary_pick: 'Fires when ye lift a relic fae the moor.',
  enemy_ambient: 'Fires when a specific beastie wanders close.',
};

const GENERIC_FALLBACK_HINT = 'Fires in a specific moment. Keep wanderin.';

export function buildBanterDetail(entry: BanterPoolEntryVM): BanterDetailVM {
  const heard: BanterHeardLineVM[] = [];
  const unheard: BanterUnheardLineVM[] = [];
  for (const line of entry.lines) {
    if (line.heard) heard.push(toHeard(line));
    else unheard.push(toUnheard(line));
  }
  return {
    titleKey: `ui.almanac.banter_pool.${entry.context}.label`,
    titleFallback: formatFallbackTitle(entry.context),
    hintKey: `ui.almanac.banter_pool.${entry.context}.hint`,
    hintFallback: HINT_FALLBACK[entry.context] ?? GENERIC_FALLBACK_HINT,
    toneLabelKey: `ui.almanac.banter_tone_${entry.tone}`,
    rare: entry.rare,
    totalLines: entry.totalLines,
    heardLines: entry.heardLines,
    progressText: `${entry.heardLines} of ${entry.totalLines}`,
    heard,
    unheard,
  };
}

function toHeard(line: BanterLineVM): BanterHeardLineVM {
  return {
    key: line.key,
    tag: line.tag,
    hearCount: line.hearCount,
    firstHeardText: line.firstHeardAt && line.firstHeardAt.timestamp > 0 ? formatFirstHeard(line.firstHeardAt.timestamp) : null,
  };
}

function toUnheard(line: BanterLineVM): BanterUnheardLineVM {
  return { key: line.key, tag: line.tag, teaserText: TEASER_TEXT };
}

function formatFirstHeard(timestamp: number): string {
  try {
    return `First heard ${new Date(timestamp).toLocaleDateString()}`;
  } catch {
    return `First heard ${new Date(timestamp).toISOString().slice(0, 10)}`;
  }
}

function formatFallbackTitle(context: string): string {
  return context
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
