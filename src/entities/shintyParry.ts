/**
 * Shinty Parry — DESIGN_IDEAS §1 skill-layer mechanic.
 *
 * Shinty (camanachd) is the Highland stick-and-ball game; the parry
 * is the high-skill defensive flick that saves a face from a passing
 * caman. Mechanically a short timed window the player opens on demand:
 * any enemy projectile contacting the haggis during the window is
 * negated (no slow applied) and the player gets a brief iframe burst
 * to clear the threat zone. The window costs nothing to open, but the
 * cooldown keeps it from becoming a passive shield.
 *
 * Skill-expression sister to:
 *   - **Drift Mastery (G)** — burst spend of banked grip; offence + cancel.
 *   - **Whisky Breath (F)** — kill-stack AOE; offence on a streak.
 *   - **Stance (Q)**        — persistent posture; speed/drift trade.
 *   - **Shinty Parry (E)**  — *defensive* timed flick; this slice.
 *
 * State machine — three phases bookended by edges:
 *   - **idle**     — `windowRemainingMs == 0 && cooldownRemainingMs == 0`.
 *                    Pressing E opens the window and emits a cast edge.
 *   - **active**   — `windowRemainingMs > 0`. Any projectile that calls
 *                    `consumeParry()` is negated; the consume sets the
 *                    cooldown and closes the window.
 *   - **cooldown** — `cooldownRemainingMs > 0` (window already 0). E-press
 *                    is a no-op — the haggis is recovering its caman.
 *
 * Important contract: the window can close *either* by timing out (no
 * projectile arrived) *or* by being consumed (one projectile blocked).
 * Both paths fall into cooldown; the player can't open a fresh window
 * mid-cooldown. This stops the parry from devolving into a passive
 * shield against a continuous barrage — the player must read the
 * incoming shot and time the flick.
 *
 * Pure helper — no Phaser, no scene state. Caller (Player) supplies
 * the per-frame inputs and reads the result; the projectile-overlap
 * site (Enemy.fireNet) calls `consumeParry()` to query whether the
 * incoming hit lands. Replay-deterministic given identical input
 * streams (verified by parity test).
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §15 (camanachd / shinty);
 * DESIGN_IDEAS.md §1 ("Shinty Parry — a new weapon with a 350 ms
 * reflect window against projectiles. High-skill defensive layer.").
 * The "reflect" framing collapsed to *negate* in v1. v2 (shipped)
 * folds reflection in: every enemy projectile-overlap site snapshots
 * a `ParryReflectContext` before its cleanup and threads it through
 * `Player.tryParryProjectile` — a consumed parry both negates the
 * shot AND returns it at the shooter via `reflectShintyProjectile`
 * (state transition + velocity math here) and
 * `WeaponSystem.fireParryReflect` (materialisation + damage). The
 * return ball deals the negated shot's own damage, never crits, and
 * consumes no RNG — replay-deterministic by construction.
 */

/** Length of the active parry window in ms. Tuned for "reflexive flick"
 *  feel — short enough that mistiming costs you, long enough that the
 *  visible projectile telegraph (Enemy.fireNet's green orb) is parry-
 *  able if the player commits at the right moment. */
export const PARRY_WINDOW_MS = 350;

/** Cooldown after a parry (consumed or expired) before the player can
 *  open a fresh window. Long enough that mashing E doesn't pseudo-stun
 *  the entire ranged kit; short enough that a successful read-and-flick
 *  rhythm is sustainable when projectile cadence is good. */
export const PARRY_COOLDOWN_MS = 1500;

/** Iframe burst granted on a successful parry. Lets the player rotate
 *  out of the threat lane after a clean read without eating a follow-
 *  up melee hit on the same frame. Short — this is *parry feedback*,
 *  not a panic button. */
export const PARRY_IFRAMES_MS = 250;

export interface ShintyParryState {
  /** Time remaining in the active window, ms. 0 = window closed. */
  readonly windowRemainingMs: number;
  /** Time remaining in cooldown, ms. 0 = ready. */
  readonly cooldownRemainingMs: number;
}

export function createShintyParryState(): ShintyParryState {
  return { windowRemainingMs: 0, cooldownRemainingMs: 0 };
}

export interface ShintyParryTickInput {
  /** Real ms since previous tick. Use the scaled (pause-aware) delta
   *  so the window doesn't tick during level-up modals etc. */
  readonly dtMs: number;
  /** Edge on the parry input (E-tap). Caller debounces; this helper
   *  just acts on the down-edge. */
  readonly parryPressed: boolean;
}

export interface ShintyParryTickResult {
  readonly state: ShintyParryState;
  /** True only on the frame the cast edge fired — i.e. E was pressed
   *  while the helper was idle (not in window or cooldown). The caller
   *  plays the cast SFX / VFX on this edge. */
  readonly windowOpenedEdge: boolean;
  /** True while the active window is open (incl. the opening frame). */
  readonly isWindowActive: boolean;
}

/**
 * Advance the Shinty Parry state by one tick. Pure — same inputs,
 * same outputs. Caller drives the dtMs stream and the input edge;
 * replays produce byte-identical state progression.
 */
export function tickShintyParry(
  state: ShintyParryState,
  input: ShintyParryTickInput,
): ShintyParryTickResult {
  const dt = Math.max(0, input.dtMs);

  // Tick existing timers down. Window first (it's the shorter of the
  // two and may close on this frame); then cooldown.
  const windowAfter = Math.max(0, state.windowRemainingMs - dt);
  const cooldownAfter = Math.max(0, state.cooldownRemainingMs - dt);

  // E-edge logic. The window can only open from a fully idle state
  // (no active window, no cooldown). If either timer is still alive
  // post-tick, the press is a no-op. This is the single place that
  // gates "can I parry right now?" — the cooldown is what keeps the
  // mechanic from devolving into a passive shield.
  const canOpen = windowAfter <= 0 && cooldownAfter <= 0;
  if (input.parryPressed && canOpen) {
    return {
      state: {
        windowRemainingMs: PARRY_WINDOW_MS,
        cooldownRemainingMs: 0,
      },
      windowOpenedEdge: true,
      isWindowActive: true,
    };
  }

  return {
    state: {
      windowRemainingMs: windowAfter,
      cooldownRemainingMs: cooldownAfter,
    },
    windowOpenedEdge: false,
    isWindowActive: windowAfter > 0,
  };
}

export interface ShintyParryConsumeResult {
  readonly state: ShintyParryState;
  /** True if the incoming hit was negated by an active parry window;
   *  false otherwise (window not open or already on cooldown). */
  readonly consumed: boolean;
}

/**
 * Called from the projectile-overlap site (Enemy.fireNet) when a hit
 * lands. If the parry window is active, the projectile is negated and
 * the helper transitions to cooldown immediately (the parry is spent
 * even if more shots are inbound this frame — one window, one shot).
 *
 * Pure — no scene side effects. The caller is responsible for
 * destroying the projectile + applying iframes when `consumed` is
 * true; this helper only owns the state transition.
 */
export function consumeParry(state: ShintyParryState): ShintyParryConsumeResult {
  if (state.windowRemainingMs <= 0) {
    return { state, consumed: false };
  }
  return {
    state: {
      windowRemainingMs: 0,
      cooldownRemainingMs: PARRY_COOLDOWN_MS,
    },
    consumed: true,
  };
}

/** HUD accessor — true while the active window is open. */
export function isParryActive(state: ShintyParryState): boolean {
  return state.windowRemainingMs > 0;
}

/** HUD accessor — true while idle and ready to parry on next E-edge. */
export function isParryReady(state: ShintyParryState): boolean {
  return state.windowRemainingMs <= 0 && state.cooldownRemainingMs <= 0;
}

/** HUD accessor — fraction of cooldown elapsed [0..1]. 1 = ready,
 *  0 = just fired. Useful for a sweeping cooldown ring on the chip.
 *  Returns 1 when the window is active (no cooldown to display). */
export function parryCooldownFraction(state: ShintyParryState): number {
  if (state.windowRemainingMs > 0) return 1;
  if (state.cooldownRemainingMs <= 0) return 1;
  return 1 - state.cooldownRemainingMs / PARRY_COOLDOWN_MS;
}

export type ShintyProjectileOwner = 'enemy' | 'player';
export type ShintyReflectionRejectReason =
  | 'inactive'
  | 'cooldown'
  | 'immune'
  | 'not_enemy_projectile';

export interface ShintyReflectableProjectile {
  readonly owner: ShintyProjectileOwner;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly damage: number;
  /** False for boss/special shots that should be negated by bespoke wiring later, not reflected. */
  readonly reflectable: boolean;
}

export interface ShintyFacingVector {
  readonly x: number;
  readonly y: number;
}

export interface ShintyReflectedProjectile {
  readonly owner: 'player';
  readonly velocityX: number;
  readonly velocityY: number;
  readonly damage: number;
}

export interface ShintyProjectileReflectionInput {
  readonly projectile: ShintyReflectableProjectile;
  readonly facing: ShintyFacingVector;
}

/**
 * v2 wiring context — what a projectile-overlap site hands to
 * `Player.tryParryProjectile` so a consumed parry can return the shot.
 * Captured INSIDE the overlap callback BEFORE the site's `cleanup()`
 * destroys the projectile (post-destroy body reads are undefined
 * behaviour across Phaser versions). `sourceX/Y` is the firing enemy's
 * position at hit time — the return ball flies at where the shooter is
 * NOW, not where it fired from.
 */
export interface ParryReflectContext {
  readonly velocityX: number;
  readonly velocityY: number;
  readonly damage: number;
  readonly sourceX: number;
  readonly sourceY: number;
}

/** Stats key the reflected ball's damage is logged under. Not a
 *  `WeaponKey` — the Game Over damage table resolves it to its own
 *  "Returned shots" label, and the tartan top-weapon lookup falls back
 *  to the neutral palette on unknown keys by design. */
export const PARRY_REFLECT_STATS_KEY = 'shinty_parry';

/** Lifetime of the materialised return ball before it fizzles, ms.
 *  Matches the enemy shots' own 2 s despawn convention — long enough
 *  to cross a full screen back to the shooter. */
export const PARRY_REFLECT_TTL_MS = 2000;

export interface ShintyProjectileReflectionResult {
  readonly state: ShintyParryState;
  readonly reflected: boolean;
  readonly reason: ShintyReflectionRejectReason | null;
  readonly projectile: ShintyReflectedProjectile | null;
}

/**
 * Reflection core for Shinty Parry v2 — pure projectile math +
 * ownership transfer + the consume state transition. No Phaser groups,
 * no collision mutation, no scene wiring: `Player.tryParryProjectile`
 * calls this when the overlap site supplied a `ParryReflectContext`,
 * then hands the returned player-owned projectile to
 * `WeaponSystem.fireParryReflect` to materialise. The reflected ball
 * keeps the incoming speed and flies along the caller's facing vector
 * (in practice: player→shooter), falling back to a straight reverse
 * when facing is degenerate. Same inputs produce same outputs; there
 * is no RNG, wall-clock, or IO.
 */
export function reflectShintyProjectile(
  state: ShintyParryState,
  input: ShintyProjectileReflectionInput,
): ShintyProjectileReflectionResult {
  if (state.windowRemainingMs <= 0) {
    return {
      state,
      reflected: false,
      reason: state.cooldownRemainingMs > 0 ? 'cooldown' : 'inactive',
      projectile: null,
    };
  }

  if (input.projectile.owner !== 'enemy') {
    return { state, reflected: false, reason: 'not_enemy_projectile', projectile: null };
  }

  if (!input.projectile.reflectable) {
    return { state, reflected: false, reason: 'immune', projectile: null };
  }

  const speed = Math.hypot(input.projectile.velocityX, input.projectile.velocityY);
  const facingLen = Math.hypot(input.facing.x, input.facing.y);
  const velocityX = facingLen > 1e-6
    ? (input.facing.x / facingLen) * speed
    : -input.projectile.velocityX;
  const velocityY = facingLen > 1e-6
    ? (input.facing.y / facingLen) * speed
    : -input.projectile.velocityY;

  return {
    state: {
      windowRemainingMs: 0,
      cooldownRemainingMs: PARRY_COOLDOWN_MS,
    },
    reflected: true,
    reason: null,
    projectile: {
      owner: 'player',
      velocityX,
      velocityY,
      damage: input.projectile.damage,
    },
  };
}
