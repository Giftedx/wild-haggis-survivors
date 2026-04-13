/**
 * Pure classifier for post-death reflection. Consumes the DeathCauseTracker
 * snapshot + final game-time and returns one `DeathCause` tag with a stable
 * `sourceKey` reference when a specific enemy dealt the killing blow or
 * dominated recent damage.
 *
 * Priority order is intentional — when multiple patterns apply, the tag we
 * pick is the one that gives the most *useful* takeaway tip:
 *
 *   hazard > boss_crushed > elite_kill > one_shot > same_killer
 *      > swarmed > low_hp_neglect > unlucky
 *
 * e.g. a player who neglected HP for a long stretch AND got one-shot by a
 * boss: the boss hit is more actionable advice than "retreat sooner".
 */
import type { DamageEvent } from '../systems/DeathCauseTracker';
import { HAZARD_SOURCE_KEY } from '../systems/DeathCauseTracker';

export type DeathCauseTag =
  | 'hazard'
  | 'boss_crushed'
  | 'elite_kill'
  | 'one_shot'
  | 'same_killer'
  | 'swarmed'
  | 'low_hp_neglect'
  | 'unlucky';

export interface DeathCause {
  tag: DeathCauseTag;
  /** Enemy key most associated with this cause (for tip interpolation). null for swarmed/hazard/low_hp_neglect/unlucky. */
  sourceKey: string | null;
  /** Optional: how many hits the offending source landed in the relevant window. */
  hitsFromSource?: number;
}

export interface ClassifierInput {
  events: readonly DamageEvent[];
  lastHealthyAtSec: number;
  /** Game-time at death (seconds). */
  deathGameTimeSec: number;
}

/** Last-3-seconds window considered for swarm/same-killer detection. */
const RECENT_WINDOW_SEC = 3;
/** HP fraction threshold for "one-shot by a heavy hit". */
const ONE_SHOT_FRACTION = 0.5;
/** Seconds the player must have sat below 30% HP to earn a low-HP-neglect tag. */
const LOW_HP_WINDOW_SEC = 8;

export function classifyDeath(input: ClassifierInput): DeathCause {
  const { events, lastHealthyAtSec, deathGameTimeSec } = input;

  if (events.length === 0) {
    return { tag: 'unlucky', sourceKey: null };
  }

  const last = events[events.length - 1];

  // 1. Hazard — last hit was a map hazard.
  if (last.sourceIsHazard) {
    return { tag: 'hazard', sourceKey: null };
  }

  // 2. Boss crushed — last fatal hit was from a boss.
  if (last.sourceIsBoss) {
    return { tag: 'boss_crushed', sourceKey: last.sourceKey };
  }

  // 3. Elite kill — last fatal hit was an elite enemy.
  if (last.sourceIsElite) {
    return { tag: 'elite_kill', sourceKey: last.sourceKey };
  }

  // 4. One-shot — the last damage took >= 50% of the player's max HP.
  if (last.maxHpAfter > 0 && last.amount / last.maxHpAfter >= ONE_SHOT_FRACTION) {
    return { tag: 'one_shot', sourceKey: last.sourceKey };
  }

  // Derive the RECENT_WINDOW_SEC window from events.
  const windowStart = deathGameTimeSec - RECENT_WINDOW_SEC;
  const recent = events.filter((e) => e.gameTimeSec >= windowStart);

  // 5. Same killer — 3+ hits from the same (non-hazard) source in recent window.
  const counts = new Map<string, number>();
  for (const e of recent) {
    if (e.sourceIsHazard) continue;
    counts.set(e.sourceKey, (counts.get(e.sourceKey) ?? 0) + 1);
  }
  let topKey: string | null = null;
  let topCount = 0;
  for (const [key, count] of counts) {
    if (count > topCount) { topCount = count; topKey = key; }
  }
  if (topKey && topCount >= 3) {
    return { tag: 'same_killer', sourceKey: topKey, hitsFromSource: topCount };
  }

  // 6. Swarmed — 3+ distinct non-hazard sources landed hits in recent window.
  if (counts.size >= 3) {
    return { tag: 'swarmed', sourceKey: null };
  }

  // 7. Low HP neglect — player sat below 30% HP for LOW_HP_WINDOW_SEC+ seconds.
  const secondsBelowHealthy = Math.max(0, deathGameTimeSec - lastHealthyAtSec);
  if (secondsBelowHealthy >= LOW_HP_WINDOW_SEC) {
    return { tag: 'low_hp_neglect', sourceKey: null };
  }

  // 8. Default.
  return { tag: 'unlucky', sourceKey: null };
}

/**
 * i18n key selector for the "what happened" headline (one line describing
 * the cause — e.g. "A Highland Cow cornered ye").
 */
export function headlineKeyFor(cause: DeathCause): string {
  return `ui.gameOver.whit_headline_${cause.tag}`;
}

/**
 * i18n key selector for the takeaway tip (one short actionable line).
 * Each cause has a single tip for stability — no RNG between runs so the
 * same death type reads the same way each time.
 */
export function tipKeyFor(cause: DeathCause): string {
  return `ui.gameOver.whit_tip_${cause.tag}`;
}

export { HAZARD_SOURCE_KEY };
