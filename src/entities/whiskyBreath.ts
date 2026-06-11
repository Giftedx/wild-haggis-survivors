/**
 * Whisky Breath — DESIGN_IDEAS §1 mechanic.
 *
 * The wee beastie collects whisky-stack momentum through clean kills;
 * a deliberate exhale spends the stack as a short, hot AOE pulse
 * around the haggis. Mechanically a meta-currency for the kill
 * stream — rewards the player for sustaining a streak without
 * coupling to combo/XP, which already incentivise other behaviours.
 *
 * Cycle:
 *   - Each non-boss kill banks +1 stack (cap at `STACKS_MAX = 12`).
 *   - Pressing W when stacks ≥ `BREATH_STACKS_REQUIRED` (8) consumes
 *     the entire stack and fires a one-frame burst flag (the caller
 *     applies AOE damage in scene-space; this helper just decides
 *     when the burst fires and how big the kicker is).
 *   - Burst is a one-tick edge — `burstFiredEdge: true` for the frame
 *     of consumption, then `false`. No lingering "burst active"
 *     timer; the AOE is applied in a single pass.
 *
 * Pure helper — no Phaser, no scene state. Same shape as
 * `driftMastery.ts`; replay-deterministic given identical input
 * streams (verified by the parity test).
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §13.6 (whisky as cultural
 * libation); DESIGN_IDEAS.md §1 ("Whisky Breath — collect stacks;
 * hold to breathe a short cone of fire that leaves a burn puddle").
 *
 * Slice scope: the cone-of-fire / puddle is deferred — this slice
 * ships the AOE-around-self version (lighter on system surface,
 * preserves the kill→breath rhythm without new pickup or hazard
 * types). The puddle can graduate later via a separate hook.
 */

/** Stack cap — spending one full charge mid-run leaves enough kills
 *  to start banking the next cycle without the player ever feeling
 *  bored of "almost there". */
export const STACKS_MAX = 12;
/** Minimum stacks required to fire a burst. Below this, W presses
 *  no-op so the player can't spam tiny pops. */
export const BREATH_STACKS_REQUIRED = 8;
/** Burst radius in pixels — wider than the haggis hitbox, narrower
 *  than the screen, comparable to bagpipe_blast level-2. */
export const BREATH_RADIUS_PX = 110;
/** Base damage applied to every enemy inside the radius on burst.
 *  Scales linearly with stacks consumed: damage = base × (stacks /
 *  required), so a full-stack breath at 12 stacks deals 1.5× of an
 *  at-threshold burst. */
export const BREATH_BASE_DAMAGE = 18;

export interface WhiskyBreathState {
  /** Banked stacks 0..STACKS_MAX. */
  readonly stacks: number;
}

export function createWhiskyBreathState(): WhiskyBreathState {
  return { stacks: 0 };
}

export interface WhiskyBreathTickInput {
  /** Number of non-boss kills observed THIS tick (delta, not total). */
  readonly killsThisFrame: number;
  /** Edge on the breath-fire input (player tapped W). Caller debounces. */
  readonly breathPressed: boolean;
}

export interface WhiskyBreathBurst {
  /** Damage to apply to every enemy in the radius on this burst. */
  readonly damage: number;
  /** Burst radius (px) — caller iterates enemy group within this. */
  readonly radius: number;
  /** Stacks consumed for this burst — useful for VFX scaling. */
  readonly stacksSpent: number;
}

export interface WhiskyBreathTickResult {
  readonly state: WhiskyBreathState;
  /** True only on the frame of consumption; false otherwise. */
  readonly burstFiredEdge: boolean;
  /** Burst params when `burstFiredEdge` is true; null otherwise. */
  readonly burst: WhiskyBreathBurst | null;
}

/**
 * Advance the Whisky Breath state by one tick. Pure — same input,
 * same output. Caller buffers the kill stream (subscribe to
 * `weaponSystem.events.on('enemyKilled', …)`) and the input edge,
 * passes both as a snapshot.
 */
export function tickWhiskyBreath(
  state: WhiskyBreathState,
  input: WhiskyBreathTickInput,
): WhiskyBreathTickResult {
  const banked = Math.max(0, Math.floor(input.killsThisFrame));
  let stacks = Math.min(STACKS_MAX, state.stacks + banked);

  if (input.breathPressed && stacks >= BREATH_STACKS_REQUIRED) {
    const stacksSpent = stacks;
    const damage = Math.round(BREATH_BASE_DAMAGE * (stacksSpent / BREATH_STACKS_REQUIRED));
    stacks = 0;
    return {
      state: { stacks },
      burstFiredEdge: true,
      burst: {
        damage,
        radius: BREATH_RADIUS_PX,
        stacksSpent,
      },
    };
  }

  return {
    state: { stacks },
    burstFiredEdge: false,
    burst: null,
  };
}

/** HUD accessor — true while the player has enough stacks to fire. */
export function isBreathReady(state: WhiskyBreathState): boolean {
  return state.stacks >= BREATH_STACKS_REQUIRED;
}
