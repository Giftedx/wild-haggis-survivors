/**
 * Race the Beithir — DESIGN_IDEAS §1 mechanic.
 *
 * The Beithir is an Argyll viper-style serpent of Highland folklore;
 * its sting was famously cured only by water that had run *under a
 * bridge* (or, by another telling, by killing the beast itself).
 * Survival lore turned a dangerous bite into a small ritual: get to
 * fresh running water, fast.
 *
 * Mechanic: a Beithir's "fang" projectile applies a *sting* that opens
 * an 8 s race window. The HUD shows a draining bar; a hearth-edge toast
 * names the race. While stung the player is otherwise unimpaired (no
 * speed slow, no DoT) — the punishment is *deferred*. Three resolutions:
 *
 *   1. Touch a heal patch — folkloric "running water under a bridge".
 *      Sting cures, no damage, small relief banter.
 *   2. Kill the Beithir — the beast's death cleanses. Sting cures, no
 *      damage, a different banter that lands the agency beat.
 *   3. Timer expires — the venom commits. The player takes a slice of
 *      max-HP damage (30 %, floor 25). No instant kill, but a real
 *      bite — the kind of damage you scramble to recover from.
 *
 * The 8 s window is tuned so the heal-patch race is *just* possible:
 * standard heal patches sit ~600–900 px from a typical mid-run player
 * position, and base move-speed is ~150 px/s. 8 s × 150 = 1200 px of
 * pure-line travel; obstacle avoidance and Beithir kiting drop the
 * effective reach to ~700–900 px, which lines up with the heal-patch
 * spread. A patient player can race; a careless one eats the bite.
 *
 * Re-stinging during an active race REFRESHES the timer to full but
 * does NOT compound damage — the venom is a single status, not a
 * stack. This protects the mechanic from becoming a death trap when
 * multiple Beithirs are on screen (a rare but possible late-run case).
 *
 * Pure helper — no Phaser, no scene state. Caller (Player.update +
 * the heal-zone tick + Enemy.die for kill-cures) supplies events and
 * receives a state transition + edge flags. Replay-deterministic
 * given identical input streams (T1 contract, ADR-0002 Phase 3).
 *
 * Sister to:
 *   - Shinty Parry (`src/entities/shintyParry.ts`) — defensive flick.
 *   - Drift Mastery (`src/entities/driftMastery.ts`) — burst-spend.
 *   - Whisky Breath (`src/entities/whiskyBreath.ts`) — kill-stack burst.
 *   - Stance Toggle (`src/entities/stanceToggle.ts`) — persistent posture.
 *   - Clootie Wager (`src/entities/clootieRagWager.ts`) — landmark trade.
 *
 * Refs: SCOTTISH_RESEARCH.md §1.2 (Beithir folklore — Argyll viper /
 * Highland serpent; cure via running water under a bridge OR by
 * killing the beast); DESIGN_IDEAS.md §1 ("Race the Beithir — on
 * sting by a Beithir enemy, a race-timer appears; reach a healing
 * circle before it expires or take massive damage. Diegetic hazard.").
 */

/** Total race window — 8 s. See file header for tuning rationale. */
export const RACE_DURATION_MS = 8000;

/**
 * Bonus race time when the stinging Beithir is elite — 3 extra seconds.
 * An elite Beithir is harder to kill (gold hp-ish but also swift/relentless)
 * so the kill-cure path needs more room to be viable. The heal-patch race
 * is unaffected by the Beithir's elite status, so we only extend the window
 * rather than bifurcating the mechanic.
 */
export const RACE_DURATION_ELITE_BONUS_MS = 3000;

/**
 * Damage on expire as a fraction of run-base max-HP. 30 % is "real
 * bite, not a kill" — classic (100 HP) eats 30, laird (130) eats 39,
 * iron-belly (115) eats 34. Pairs with the floor below for the
 * sub-85-HP variants (wee_ghostie 75, glaswegian 80) where 30 % would
 * barely bruise.
 */
export const RACE_EXPIRE_DAMAGE_FRACTION = 0.30;

/**
 * Floor on the expire damage. Below ~85 HP the fraction undershoots
 * the "felt as a real bite" threshold; 25 keeps the venom honest.
 * Note the floor can exceed `maxHp * fraction` for very-low-HP
 * variants — that's intended. The Beithir doesn't scale its venom
 * down for the small ones (wee_ghostie 75 HP still eats 25, not 22).
 */
export const RACE_EXPIRE_DAMAGE_MIN = 25;

/**
 * State machine. Idle = no active race. Stung = race timer running.
 * Discriminated-union shape mirrors Shinty Parry's `idle | active |
 * cooldown` so the Player integration site stays familiar.
 */
export type RaceTheBeithirState =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'stung';
      readonly remainingMs: number;
      /**
       * The full window this sting opened with (8 s standard, 11 s elite).
       * Carried so `stingRemainingFraction` divides by the actual window
       * rather than the constant — otherwise an elite sting's bar clamps
       * to full for the first ~3 s instead of draining from the start.
       */
      readonly durationMs: number;
    };

/** Initial state — no race running. */
export function initialBeithirState(): RaceTheBeithirState {
  return { kind: 'idle' };
}

/**
 * Result of a `tickBeithir(state, deltaMs)` step.
 * `expiredEdge` fires exactly once on the frame where the timer
 * hits zero — caller applies `computeStingExpireDamage(maxHp)` then.
 */
export interface BeithirTickResult {
  readonly state: RaceTheBeithirState;
  readonly expiredEdge: boolean;
}

/**
 * Advance the race timer by `deltaMs`. No-op when idle. On the frame
 * where the remaining time crosses zero, returns `{ state: idle,
 * expiredEdge: true }` — the caller is responsible for applying the
 * expire damage and any banter/SFX side-effects.
 */
export function tickBeithir(
  state: RaceTheBeithirState,
  deltaMs: number,
): BeithirTickResult {
  if (state.kind !== 'stung') return { state, expiredEdge: false };
  // Clamp negative deltas (slow-mo / rewind paths) so a backwards tick can
  // never grow the timer above its window — matches tickShintyParry /
  // tickDriftMastery, which both open with `const dt = Math.max(0, ...)`.
  const dt = Math.max(0, deltaMs);
  const remaining = state.remainingMs - dt;
  if (remaining <= 0) {
    return { state: { kind: 'idle' }, expiredEdge: true };
  }
  return {
    state: { kind: 'stung', remainingMs: remaining, durationMs: state.durationMs },
    expiredEdge: false,
  };
}

/**
 * Result of an `applyBeithirSting(state)` call.
 * `appliedEdge` is true on first sting (idle → stung) and false on a
 * refresh (stung → stung). Caller fires the onset SFX + banter only on
 * the edge so a barrage of stings doesn't spam the audio bus.
 */
export interface BeithirApplyResult {
  readonly state: RaceTheBeithirState;
  readonly appliedEdge: boolean;
}

/**
 * Sting hits. From idle, transitions to stung with a full-duration
 * timer and `appliedEdge: true`. From stung, refreshes the timer to
 * full but reports `appliedEdge: false` — the venom is a single
 * status, not a stack.
 *
 * `durationMs` overrides the default window — callers pass
 * `RACE_DURATION_MS + RACE_DURATION_ELITE_BONUS_MS` when the stinging
 * Beithir is elite. The helper stays pure: it doesn't read the enemy.
 *
 * Assist Mode invincibility short-circuits the bite: even though the
 * sting itself is status-setup (no immediate damage), it commits a
 * future damage payload on expire. Refusing to start the timer is
 * cleaner than letting it run with the commit gated — the HUD would
 * otherwise show a race that "doesn't matter". Sister to
 * `PlayerHitResolver.handle`'s `isInvincibilityEnabled()` short-circuit.
 */
export function applyBeithirSting(
  state: RaceTheBeithirState,
  isPlayerInvincible: boolean = false,
  durationMs: number = RACE_DURATION_MS,
): BeithirApplyResult {
  if (isPlayerInvincible) return { state, appliedEdge: false };
  const refreshed: RaceTheBeithirState = { kind: 'stung', remainingMs: durationMs, durationMs };
  if (state.kind === 'stung') return { state: refreshed, appliedEdge: false };
  return { state: refreshed, appliedEdge: true };
}

/**
 * Result of a `cureBeithirSting(state)` call.
 * `curedEdge` is true only when there was an active sting to cure;
 * false on a no-op call (no race running).
 */
export interface BeithirCureResult {
  readonly state: RaceTheBeithirState;
  readonly curedEdge: boolean;
}

/**
 * Cure an active sting — used by both the heal-patch overlap (running
 * water under a bridge) and the Beithir-kill hook (slay the beast).
 * The two callers carry different banter sub-pools but share the same
 * state transition.
 */
export function cureBeithirSting(state: RaceTheBeithirState): BeithirCureResult {
  if (state.kind !== 'stung') return { state, curedEdge: false };
  return { state: { kind: 'idle' }, curedEdge: true };
}

/** True while the race is running. */
export function isStung(state: RaceTheBeithirState): boolean {
  return state.kind === 'stung';
}

/**
 * HUD readout — fraction [0..1] of timer remaining. 1.0 = just stung,
 * 0.0 = about to expire. Used by the HUD chip to drive the draining
 * bar fill. Returns 0 when idle so the chip can render an empty bar
 * during cooldown / not-stung states. Divides by the sting's own
 * `durationMs` so an elite (11 s) window drains from full just like a
 * standard (8 s) one, rather than stalling at full for the first ~3 s.
 */
export function stingRemainingFraction(state: RaceTheBeithirState): number {
  if (state.kind !== 'stung') return 0;
  return Math.max(0, Math.min(1, state.remainingMs / state.durationMs));
}

/**
 * Compute the integer expire damage from run-base max-HP. Floor of the
 * fractional product, with `RACE_EXPIRE_DAMAGE_MIN` as a hard floor so
 * very low-HP variants still feel the bite. Pure — same input, same
 * output; no RNG. Mirrors `computeWagerHpCost` from `clootieRagWager`.
 */
export function computeStingExpireDamage(runBaseMaxHp: number): number {
  if (runBaseMaxHp <= 0) return RACE_EXPIRE_DAMAGE_MIN;
  return Math.max(
    RACE_EXPIRE_DAMAGE_MIN,
    Math.floor(runBaseMaxHp * RACE_EXPIRE_DAMAGE_FRACTION),
  );
}
