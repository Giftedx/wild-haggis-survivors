/**
 * Dash-strike trigger — pure helper that gates a weapon's bonus
 * "fire-on-dash" path (DESIGN_IDEAS §5 — Stag Antler).
 *
 * The Stag Antler weapon auto-fires its `arc_sweep` baseline like
 * any other weapon, but ALSO fires a juicier bonus arc the moment a
 * dash starts — the haggis lowers his head and gores. This helper
 * owns the two pieces of state the weapon needs:
 *
 *   1. The rising-edge detector for `isDashing` (so the bonus fires
 *      ONCE on dash-start, not every frame the dash is active).
 *   2. A separate per-weapon cooldown so a player who happens to
 *      have +2 dash charges + a refresh route doesn't auto-spam the
 *      bonus arc — the weapon's own pace caps the burst rate.
 *
 * Pure / replay-deterministic. No Phaser, no scene state. Caller
 * (`WeaponSystem.update`) supplies inputs and acts on the returned
 * `shouldFire` flag.
 *
 * Sister to the other DESIGN_IDEAS §1 / §5 input-gated helpers —
 * driftMastery, whiskyBreath, stanceToggle, shintyParry — all of
 * which expose a tiny edge-driven state machine the caller drives.
 */

export interface DashStrikeState {
  /** True last frame's `isDashing` value — drives rising-edge detection. */
  prevDashing: boolean;
  /** Milliseconds remaining before the bonus arc may fire again. */
  cooldownRemainingMs: number;
}

export interface DashStrikeTickInput {
  /** Live `isDashing` value from Player. */
  isDashing: boolean;
  /** Frame delta in ms (caller is responsible for time-scaling — the
   *  helper itself is unit-agnostic about wall-clock vs scaled time). */
  deltaMs: number;
  /** Cooldown to apply when the bonus arc fires. Caller's choice
   *  lets the weapon spec the cadence (Stag Antler ships 1500 ms;
   *  Monarch's Charge evolution ships 1300 ms — slightly snappier
   *  to reward the king-stag fantasy). */
  cooldownMsOnFire: number;
}

export interface DashStrikeTickResult {
  /** True for exactly one frame when a dash starts and cooldown is
   *  ready. Caller fires the bonus arc on this edge. */
  shouldFire: boolean;
}

/** Build a fresh state. Caller initialises one per weapon-slot that
 *  uses the dash-strike fork (today: stag_antler only). */
export function createDashStrikeState(): DashStrikeState {
  return { prevDashing: false, cooldownRemainingMs: 0 };
}

/**
 * Tick the trigger one frame. Mutates `state` in place (matches the
 * sibling-helper pattern used by driftMastery + shintyParry — keeps
 * caller's per-frame allocation at zero).
 *
 * Order of operations:
 *   1. Tick down cooldown (clamped at 0; never negative — a fresh
 *      dash arriving with cooldown 0 fires immediately, no debt).
 *   2. Detect rising edge of `isDashing` (false → true).
 *   3. If edge AND cooldown is 0 → set shouldFire and reload cooldown.
 *   4. Stamp `prevDashing` for next frame's edge detection.
 *
 * If the dash starts WHILE cooldown is still draining, the edge is
 * silently swallowed — the weapon's pace caps the burst rate. This
 * is intentional: a player with +2 dash charges + a refresh route
 * shouldn't be able to bonus-arc every dash.
 */
export function tickDashStrike(
  state: DashStrikeState,
  input: DashStrikeTickInput,
): DashStrikeTickResult {
  if (state.cooldownRemainingMs > 0) {
    state.cooldownRemainingMs = Math.max(
      0,
      state.cooldownRemainingMs - input.deltaMs,
    );
  }

  const risingEdge = !state.prevDashing && input.isDashing;
  const shouldFire = risingEdge && state.cooldownRemainingMs === 0;
  if (shouldFire) {
    state.cooldownRemainingMs = Math.max(0, input.cooldownMsOnFire);
  }

  state.prevDashing = input.isDashing;
  return { shouldFire };
}

/** Reset cooldown + edge memory. Called by WeaponSystem on
 *  scene-restart so a stale cooldown from the prior run can't gate
 *  the first dash of a fresh run. */
export function resetDashStrike(state: DashStrikeState): void {
  state.prevDashing = false;
  state.cooldownRemainingMs = 0;
}
