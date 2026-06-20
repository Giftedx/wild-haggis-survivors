/**
 * Nicnevin Wild Hunt — N1 Tier-2 Mythos boss #2 unique mechanic.
 *
 * Spec: `docs/archive/superpowers/specs/2026-04-28-boss-tier-2-mythos-design.md` §4.
 *
 * Behaviour: when Nicnevin's HP drops to 50 % (the existing boss enrage
 * threshold — see `Enemy.ts:1273` and `globalEventBus.emit('bossEnraged')`)
 * she triggers a 3 second pull where every XP gem on screen lerps toward
 * her instead of the player. After the pull window closes, the gems
 * scatter slightly and the cycle enters a 17 second cooldown before the
 * next pull begins. The cycle repeats until the boss dies.
 *
 * Implementation is split into a pure helper here (state machine + a
 * `tickWildHunt` driver) and an XPSystem hook (`setPullSourceOverride`,
 * `scatterAllGemsViaRng`). The split keeps the mechanic unit-testable
 * without spinning up a Phaser scene; tests live in
 * `nicnevinWildHunt.test.ts`.
 *
 * Determinism: the scatter step intentionally consumes a deterministic
 * RNG (seeded `runRng`) so byte-accurate replays still land identical
 * gem positions. See `replayDeterminism.test.ts`.
 */

export type WildHuntPhase = 'idle' | 'pulling' | 'cooldown';

export interface WildHuntState {
  phase: WildHuntPhase;
  /** Milliseconds remaining in the current phase. Counted down each tick. */
  timerMs: number;
}

/** Pull window length — gems lerp toward Nicnevin for this long. */
export const WILD_HUNT_PULL_MS = 3000;

/** Cooldown between pulls. Pull + cooldown sums to the spec's 20 s cycle. */
export const WILD_HUNT_COOLDOWN_MS = 17000;

export function createWildHuntState(): WildHuntState {
  return { phase: 'idle', timerMs: 0 };
}

/** Kick the cycle off — called on the first 50 % HP trigger. */
export function startWildHunt(state: WildHuntState): void {
  state.phase = 'pulling';
  state.timerMs = WILD_HUNT_PULL_MS;
}

/** Force the cycle back to idle — called when Nicnevin dies / scene resets. */
export function stopWildHunt(state: WildHuntState): void {
  state.phase = 'idle';
  state.timerMs = 0;
}

export interface WildHuntCallbacks {
  /** While set, XPSystem's per-frame magnet pulls toward this point
   *  instead of the player and player collection is suppressed. Pass
   *  `null` to release. */
  setPullSourceOverride(source: { x: number; y: number } | null): void;
  /** Apply a small deterministic scatter to every active gem. Called
   *  once at pull-end so the released gems read as flung from the
   *  Queen's grip. */
  scatterGems(): void;
  /** Hook for SFX / toast wiring; fires once at pull-start. Cycle
   *  start (very first pull) and re-procs both call this. */
  onPullStart(): void;
}

export interface WildHuntInputs {
  bossX: number;
  bossY: number;
  /** False once the boss has died or the scene reset; cycles cleanly
   *  to idle and releases the override on the next tick. */
  bossActive: boolean;
}

/**
 * Drive the Wild Hunt state machine forward by `delta` milliseconds.
 *
 * Tick contract:
 *  - `idle`     — no-op (await `startWildHunt` from the bossEnraged hook).
 *  - `pulling`  — keep the override pinned to (bossX, bossY); when timer
 *                 expires, release override + scatter gems + flip to
 *                 cooldown.
 *  - `cooldown` — count down; when timer expires, flip back to pulling
 *                 and call `onPullStart` (the bossEnraged hook does not
 *                 fire again, so re-procs are driven from here).
 *  - boss dead  — phase forced to idle, override released. No scatter.
 */
export function tickWildHunt(
  state: WildHuntState,
  delta: number,
  inputs: WildHuntInputs,
  cb: WildHuntCallbacks,
): void {
  if (!inputs.bossActive) {
    if (state.phase !== 'idle') {
      cb.setPullSourceOverride(null);
      state.phase = 'idle';
      state.timerMs = 0;
    }
    return;
  }

  if (state.phase === 'idle') return;

  state.timerMs -= delta;

  if (state.phase === 'pulling') {
    cb.setPullSourceOverride({ x: inputs.bossX, y: inputs.bossY });
    if (state.timerMs <= 0) {
      cb.setPullSourceOverride(null);
      cb.scatterGems();
      state.phase = 'cooldown';
      state.timerMs = WILD_HUNT_COOLDOWN_MS;
    }
    return;
  }

  if (state.phase === 'cooldown') {
    if (state.timerMs <= 0) {
      state.phase = 'pulling';
      state.timerMs = WILD_HUNT_PULL_MS;
      cb.onPullStart();
    }
    return;
  }
}
