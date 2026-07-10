/**
 * Taxman Grudge Ledger — DESIGN_IDEAS §1 silent-tracker mechanic.
 *
 * The Taxman is the run's final boss; his ledger tracks WHO finished
 * his elites and bosses, and HOW. Every elite or boss the player puts
 * down banks one entry: the world-space distance between player and
 * enemy at the moment of death, and the player's HP fraction at the
 * moment of death. At victory the helper judges the pattern of
 * finishes and returns a verdict — `coward`, `bruiser`, `precise`,
 * `reckless`, or `even` — that drives the Taxman's end-of-run
 * dialogue (the `taxman_grudge` banter pool, priority 85). The
 * pool's keysByTag carries one sub-pool per verdict.
 *
 * Pure helper — no Phaser, no scene state, no RNG. Caller (GameScene
 * wiring) subscribes to `WeaponSystem.events.on('eliteOrBossFinished',…)`,
 * snapshots `(distancePx, hpFraction, wasBoss)` at the kill site, and
 * pushes them in via `recordGrudgeFinish`. Replay-deterministic — the
 * verdict is a pure function of the recorded finish stream, and the
 * stream itself is replay-deterministic because both `enemy.x/y` and
 * `player.x/y` are deterministic at any tick of an arcade-fixed-step
 * physics world driven by a recorded input stream (T1 replay contract).
 *
 * The event fires for ALL elite/boss finishes — weapon-damage path
 * (WeaponSystem.dealDamage) AND external paths routed through
 * `Enemy.emitKillEvents` (hazard / DoT / drown / `DEBUG.killCurrentBoss`).
 * The Taxman judges the result, not the weapon: a boss drowned in a
 * peat pit is still a finish, and the player's HP fraction + position
 * at the moment of death still tells the same story.
 *
 * Skill-expression sister to Drift Mastery (G burst), Whisky Breath
 * (F burst), Stance (Q posture), Shinty Parry (E flick): grudge is
 * not a player-input mechanic at all. It is a *silent observer*
 * whose verdict colours the closing line. v1 fires only on victory
 * (the Taxman dies last, so his ledger speaks last); on player
 * death the cause-aware `death_reflection` pool keeps the headline.
 *
 * Refs: SCOTTISH_RESEARCH.md §1.4 (the Taxman as folkloric figure
 * — Earl Beardie / devil-as-auditor lineage); DESIGN_IDEAS.md §1
 * ("Taxman Grudge Ledger — silent tracker of how you finish elites/
 * bosses; end-of-game dialogue shifts accordingly. Hidden state;
 * save schema care.").  v1 kept state per-run only. v2 (shipped):
 * boss finishes weigh double in the verdict medians, and each victory
 * verdict is banked to `save.grudgeVerdictsLifetime` (schema v24, via
 * `bumpGrudgeVerdict`) — the dominant lifetime verdict colours Gran's
 * Croft greeting (`src/scenes/croft/grudgeGreeting.ts`). Word gets
 * round the glen.
 */

/** Verdict returned by `judgeGrudge`. Each maps to a `keysByTag`
 *  sub-pool on the `taxman_grudge` banter pool. */
export type GrudgeVerdict = 'coward' | 'bruiser' | 'precise' | 'reckless' | 'even';

/** Per-finish snapshot stored in the ledger. v2: boss finishes weigh
 *  `GRUDGE_BOSS_WEIGHT`× in the verdict medians — the Taxman cares more
 *  about how you finished the ones that mattered. */
export interface GrudgeFinish {
  /** World-space distance from player to enemy at the moment of kill,
   *  in pixels. Clamped non-negative on record. */
  readonly distancePx: number;
  /** Player HP fraction at the moment of kill. Clamped to [0, 1] on
   *  record. */
  readonly hpFraction: number;
  /** True if the killed enemy was a boss. v2: boss finishes contribute
   *  `GRUDGE_BOSS_WEIGHT` samples to the verdict medians instead of 1. */
  readonly wasBoss: boolean;
}

export interface GrudgeLedgerState {
  /** Append-only buffer of finishes in the order they happened. */
  readonly finishes: GrudgeFinish[];
}

/** Minimum number of recorded finishes before the verdict promotes off
 *  `even`. A run with fewer than this hasn't given the Taxman enough
 *  ledger to judge a pattern — he stays neutral. */
export const GRUDGE_MIN_FINISHES = 3;

/** Median distance (px) at or above which the verdict is `coward`. The
 *  game's typical aggro-bubble is ~300 px; sustained kills past that
 *  threshold are clearly long-range play. */
export const GRUDGE_COWARD_DISTANCE_PX = 280;

/** Median distance (px) at or below which the verdict is `bruiser`.
 *  Player hitbox + enemy hitbox sit around 30–60 px combined; ≤ 100 px
 *  median means most kills landed in the squeeze zone. */
export const GRUDGE_BRUISER_DISTANCE_PX = 100;

/** Median HP fraction at or above which the verdict is `precise`. The
 *  player finished bosses/elites at near-full health most of the time
 *  — clean reads, no panic. */
export const GRUDGE_PRECISE_HP_FRAC = 0.85;

/** Median HP fraction at or below which the verdict is `reckless`. The
 *  player closed every important kill on the brink — daring play, or
 *  sloppy spacing. */
export const GRUDGE_RECKLESS_HP_FRAC = 0.30;

/** v2 — how many median samples a boss finish contributes (elites
 *  contribute 1). The Taxman's ledger is about the kills that mattered;
 *  a boss finish says twice as much about the player's pattern as an
 *  elite finish. `GRUDGE_MIN_FINISHES` still counts raw ledger entries,
 *  not weighted samples — two boss kills alone stay `even`. */
export const GRUDGE_BOSS_WEIGHT = 2;

export function createGrudgeLedger(): GrudgeLedgerState {
  return { finishes: [] };
}

/**
 * Clear the ledger in place. Used by `resetTransientRunState` between
 * runs because Phaser reuses the scene instance (and therefore the
 * field) — re-allocating the buffer would orphan the captured ref the
 * weapon-event listener installed at scene boot. In-place clear keeps
 * the listener's closure pointing at a live, empty buffer.
 */
export function clearGrudgeLedger(state: GrudgeLedgerState): void {
  (state.finishes as GrudgeFinish[]).length = 0;
}

/**
 * Append one elite/boss finish to the ledger. Mutates the state in
 * place — the caller should treat the state as a per-run buffer that
 * lives in scene fields, not a persistent value object. Inputs are
 * clamped to defensive ranges (no negative distance, hp ∈ [0, 1]) so
 * a flaky upstream measurement can't wedge the verdict math.
 */
export function recordGrudgeFinish(
  state: GrudgeLedgerState,
  finish: GrudgeFinish,
): void {
  (state.finishes as GrudgeFinish[]).push({
    distancePx: Math.max(0, finish.distancePx),
    hpFraction: Math.max(0, Math.min(1, finish.hpFraction)),
    wasBoss: finish.wasBoss,
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Expand the finish stream into weighted median samples — boss
 *  finishes repeat `GRUDGE_BOSS_WEIGHT` times, elites once. Exact
 *  weighted median via duplication; the stream is small (a run's
 *  elite/boss kills), so the allocation is trivial. */
function weightedSamples(
  finishes: readonly GrudgeFinish[],
  pick: (f: GrudgeFinish) => number,
): number[] {
  const out: number[] = [];
  for (const f of finishes) {
    const weight = f.wasBoss ? GRUDGE_BOSS_WEIGHT : 1;
    for (let i = 0; i < weight; i++) out.push(pick(f));
  }
  return out;
}

/**
 * Compute the verdict from the current ledger.
 *
 * Order of precedence (first match wins):
 *   1. `precise`  — median HP fraction ≥ `GRUDGE_PRECISE_HP_FRAC`.
 *   2. `reckless` — median HP fraction ≤ `GRUDGE_RECKLESS_HP_FRAC`.
 *   3. `coward`   — median distance ≥ `GRUDGE_COWARD_DISTANCE_PX`.
 *   4. `bruiser`  — median distance ≤ `GRUDGE_BRUISER_DISTANCE_PX`.
 *   5. `even`     — fallback.
 *
 * HP-extreme wins over distance-extreme because finishing unhurt OR
 * on-the-brink reflects pacing under pressure — the more singular
 * trait. Distance is incidental to weapon choice; HP fraction is
 * earned. Below `GRUDGE_MIN_FINISHES` the ledger is too thin to
 * judge — returns `even`.
 *
 * v2: medians are boss-weighted — each boss finish contributes
 * `GRUDGE_BOSS_WEIGHT` samples. The min-finishes gate still counts raw
 * entries so a thin ledger can't be promoted by weighting alone.
 */
export function judgeGrudge(state: GrudgeLedgerState): GrudgeVerdict {
  const f = state.finishes;
  if (f.length < GRUDGE_MIN_FINISHES) return 'even';
  const medHp = median(weightedSamples(f, (x) => x.hpFraction));
  const medDist = median(weightedSamples(f, (x) => x.distancePx));
  if (medHp >= GRUDGE_PRECISE_HP_FRAC) return 'precise';
  if (medHp <= GRUDGE_RECKLESS_HP_FRAC) return 'reckless';
  if (medDist >= GRUDGE_COWARD_DISTANCE_PX) return 'coward';
  if (medDist <= GRUDGE_BRUISER_DISTANCE_PX) return 'bruiser';
  return 'even';
}
