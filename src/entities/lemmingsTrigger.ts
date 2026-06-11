/**
 * Lemmings Easter Egg trigger — DESIGN_IDEAS §13 Scottish-games-lineage homage.
 *
 * Stand idle in a cliff-edge biome (coastal) for 90 s and a tiny pixel-line
 * of lemmings walks across the screen, falls off the edge with the iconic
 * "OH NO!" SFX, and a hearth toast: "The lemmings remember ye." A love-letter
 * to DMA Design (Dundee 1991, then Rockstar North) — Scotland's foundational
 * games studio. Once-per-variant lifetime trigger: each haggis variant earns
 * the parade once, then it never fires again for that variant.
 *
 * Pure helper — no Phaser, no scene state. Caller (GameScene → tickFrameWorld
 * via the LemmingsEasterEgg orchestrator) drives the per-frame inputs and
 * receives a result describing whether the parade should fire this frame.
 * Replay-deterministic given identical input streams.
 *
 * State machine — three phases:
 *   - **idle (gated)**       — `variantAlreadyFired` true OR `state.fired`
 *                              true. Never accumulates. The parade has been
 *                              earned (lifetime) or is mid-celebration (run).
 *   - **idle (resetting)**   — biome != coastal OR player moving. `idleMs`
 *                              clamps to 0. The 90 s window is *continuous* —
 *                              any interruption forces a fresh count.
 *   - **accumulating**       — biome == coastal AND player still AND not yet
 *                              fired. Accumulates dtMs each frame. On crossing
 *                              the threshold, emits `triggeredEdge: true` once
 *                              and latches `fired: true` (so the next call is
 *                              a no-op even before the orchestrator persists).
 *
 * Why "continuous-90s, full-reset" rather than a depleting timer with grace:
 * the easter egg is a reward for *standing still* — the joke depends on it.
 * A grace window would let a player cheese the trigger by walking briefly to
 * grab a coin and coming back. The cleaner rule is: stand still or start over.
 *
 * Why coastal-only: per ART_STYLE_BIBLE / B5 charter, coastal is the cliff-
 * edge biome (cliffs, foam, seabirds). Lemmings 1991 was about cliff-falls
 * — the parade reads as part of the moor only at a coastal edge.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §21 (Scottish games-lineage); DESIGN_IDEAS
 * §13 ("Lemmings easter egg — if the player stands idle in a cliff-edge biome
 * for 90 seconds, a tiny line of pixel lemmings walks across the screen, falls
 * off the edge with the iconic OH NO! SFX, and a toast: 'The lemmings remember
 * ye.' Reserved once-per-variant trigger.").
 */

/** Biome the trigger watches for. Coastal is the cliff-edge biome per
 *  B5 charter / ART_STYLE_BIBLE. Other biomes (loch, pine, bog, …) don't
 *  read as "cliff" — the visual joke wouldn't land. */
export const LEMMINGS_BIOME_ID = 'coastal';

/** Idle window required before the parade fires. 90 s is the spec — long
 *  enough that no normal play hits it, short enough that an AFK-watching
 *  player notices the moment when it does. */
export const LEMMINGS_IDLE_THRESHOLD_MS = 90_000;

export interface LemmingsTriggerState {
  /** Time spent idle in coastal biome this run, ms. Resets to 0 on
   *  movement or biome change — the window is continuous. */
  readonly idleMs: number;
  /** Once-per-run latch. Set true on the frame the trigger fires; the
   *  orchestrator owns variant-lifetime persistence (the helper's job
   *  is just to stop emitting more edges this run). */
  readonly fired: boolean;
}

export function createLemmingsTriggerState(): LemmingsTriggerState {
  return { idleMs: 0, fired: false };
}

export interface LemmingsTriggerInput {
  /** Real ms since previous tick. Use the *scaled* delta from
   *  `tickFrameHeader` — paused frames must not tick the timer
   *  (otherwise a pause-menu camp completes the count). */
  readonly dtMs: number;
  /** Active biome at the player's position. Null when no biome is
   *  resolved yet (run-start frame); treated as "wrong biome". */
  readonly biomeId: string | null;
  /** Caller's "is the player still?" verdict. The helper doesn't take a
   *  velocity threshold — Player owns its own movement model and may
   *  define stillness differently per stance / dash / leap. Caller
   *  passes the decision in cooked. */
  readonly playerStill: boolean;
  /** Lifetime gate — true if THIS variant has already fired the parade
   *  in some past run (read from save). The helper short-circuits and
   *  never accumulates; the parade is reserved once-per-variant. */
  readonly variantAlreadyFired: boolean;
}

export interface LemmingsTriggerResult {
  readonly state: LemmingsTriggerState;
  /** True only on the frame the trigger fires (idleMs crosses
   *  threshold). Caller plays the parade + persists the lifetime flag
   *  on this edge. */
  readonly triggeredEdge: boolean;
  /** True while the timer is actively counting up. Useful for a debug
   *  HUD readout; the production HUD never displays this (the easter
   *  egg is meant to be discovered, not telegraphed). */
  readonly isAccumulating: boolean;
  /** Fraction of threshold reached, [0..1]. 1 = just fired this frame. */
  readonly progress: number;
}

/**
 * Advance the lemmings trigger by one tick. Pure — same inputs, same
 * outputs. Caller drives `dtMs` (scaled), the active biome id, and the
 * stillness verdict; replays produce byte-identical state progression.
 */
export function tickLemmingsTrigger(
  state: LemmingsTriggerState,
  input: LemmingsTriggerInput,
): LemmingsTriggerResult {
  // Gate 1: already fired (this run latch OR this variant lifetime). The
  // parade is once-per-variant — once awarded, the helper is permanently
  // dormant for that variant on every subsequent run.
  if (state.fired || input.variantAlreadyFired) {
    return {
      state,
      triggeredEdge: false,
      isAccumulating: false,
      progress: 0,
    };
  }

  // Gate 2: wrong biome OR moving → full reset. The condition is
  // *continuous* — any interruption forces a fresh count. This is the
  // discipline that keeps the easter egg honest; a player who tries to
  // game it by walking briefly loses their progress.
  const inBiome = input.biomeId === LEMMINGS_BIOME_ID;
  if (!inBiome || !input.playerStill) {
    if (state.idleMs === 0) return {
      state,
      triggeredEdge: false,
      isAccumulating: false,
      progress: 0,
    };
    return {
      state: { idleMs: 0, fired: false },
      triggeredEdge: false,
      isAccumulating: false,
      progress: 0,
    };
  }

  // Accumulate. dtMs is the scaled delta — paused frames feed 0 here and
  // don't tick. Negative deltas are guarded (Phaser's first frame sometimes
  // hands a slightly-negative value during scene reuse).
  const dt = Math.max(0, input.dtMs);
  const next = state.idleMs + dt;

  if (next >= LEMMINGS_IDLE_THRESHOLD_MS) {
    return {
      state: { idleMs: LEMMINGS_IDLE_THRESHOLD_MS, fired: true },
      triggeredEdge: true,
      isAccumulating: false,
      progress: 1,
    };
  }

  return {
    state: { idleMs: next, fired: false },
    triggeredEdge: false,
    isAccumulating: true,
    progress: next / LEMMINGS_IDLE_THRESHOLD_MS,
  };
}

/** Save accessor — has this variant ever earned the lemmings parade?
 *  Caller passes the save's `lemmingsSeenForVariant` array and the active
 *  variant key. Pure; no save-IO inside the helper. */
export function hasVariantSeenLemmings(
  seenForVariant: readonly string[],
  variantKey: string,
): boolean {
  return seenForVariant.includes(variantKey);
}

/** Save mutator — append the variant key (no-op if already present).
 *  Returns a fresh array per immutable-update convention; caller writes
 *  it back into the save record. */
export function markVariantSeenLemmings(
  seenForVariant: readonly string[],
  variantKey: string,
): readonly string[] {
  if (seenForVariant.includes(variantKey)) return seenForVariant;
  return [...seenForVariant, variantKey];
}
