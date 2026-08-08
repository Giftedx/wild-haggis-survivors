/**
 * T401 slice 5 — Curse application + composed-stats derivation for
 * GameScene.
 *
 * Pulls the paired "consume pending curse → mutate `runModifiers` →
 * derive `composedStats`" block out of `GameScene.create()` into a pure
 * helper so the resolution rules are testable in isolation. The block
 * sits between the replay-mode resolution (slice 4) and the
 * `installReplayRecording` call (also slice 4) — slice 5 closes the
 * gap by extracting the connective logic that consumes the v2 playback
 * blob's `curseKey` field, the player's pre-run curse pick, and the
 * meta-upgrade base stats, and produces:
 *
 *   1. A reset-to-defaults `RunModifiers` bag with at most one curse
 *      `apply()` called against it (mutating the moveSpeed/spawn/dmg
 *      multipliers per the curse table).
 *   2. The resolved `activeCurseKey` (or null when no curse applied).
 *   3. `consumePending: true` when `pendingCurseKey` was read — caller
 *      MUST null the field so a recycled scene instance does not
 *      re-apply the same curse on next run-start.
 *   4. The composed `ComposedPlayerStats` sheet the Player constructor
 *      reads: either a snapshot from the v2 blob (replay determinism)
 *      or a freshly-derived sheet with curse multipliers folded in.
 *
 * Resolution precedence (preserved from the pre-extraction code):
 *   - Playback-with-curseKey → ALWAYS apply that curse, even on
 *     resumed runs or daily attempts. Replay determinism wins; the
 *     captured blob's curseKey is ground truth.
 *   - Otherwise (record / off mode), apply `pendingCurseKey` on any
 *     non-daily run. Resumed runs supply the saved curse key because
 *     this helper creates a fresh modifier bag. Daily runs use a fixed
 *     rule set so seed equivalence holds.
 *   - In all paths the helper emits `GLOBAL_CURSE_STARTED` exactly once
 *     when (and only when) a curse was successfully applied. Same
 *     contract as the pre-extraction emit.
 *
 * `composedStats` precedence (also preserved):
 *   - When the v2 blob carries a `composedStats` snapshot, splat it
 *     onto `baseStats` so the replayed run uses the EXACT sheet the
 *     recorder saw. BALANCE.player constants come from `baseStats`
 *     because they're build-level (dash, hitbox, etc.).
 *   - Otherwise, derive a sheet by spreading `baseStats` and applying
 *     the just-mutated `runModifiers.moveSpeedMult` to `speed` and
 *     `runModifiers.startHpRatio` to `maxHp` (rounded, ≥ 1).
 *
 * No Phaser imports — safe under vitest's default node env (CLAUDE.md
 * Phaser-imports-break-vitest rule). The helper uses
 * `globalEventBus.emit` directly because GlobalEventBus is itself
 * Phaser-import-free; the precedent is `wireSceneEventBus.ts`, which
 * also calls into the bus from a pure helper.
 *
 * Bag-vs-cached-field divergence (CLAUDE.md): this helper writes into a
 * fresh `defaultModifiers()` bag — the caller assigns the returned bag
 * onto `this.runModifiers`. Curse application here happens BEFORE the
 * spawn/weapon/etc. systems read their cached `spawnIntervalMult` /
 * `weaponCooldownMult` fields, so no setter resync is required at this
 * boundary. (Compare with W2 `routeModifierDeltas`, where setter calls
 * are mandatory because systems already cached at run-start.) Tests
 * pin this assumption via the order assertion in the test suite.
 */
import { defaultModifiers, type RunModifiers } from '../../core/RunModifiers';
import { getCurseByKey, type CurseKey } from '../../data/curses';
import { globalEventBus } from '../../core/GlobalEventBus';
import type { ComposedPlayerStats } from '../../core/StatComposer';
import type { ReplayBlobV2Meta } from '../../replay/replayBlobV2';

export interface ApplyCurseAndComposeStatsInput {
  /** The curse key from the GameScene init payload or resume snapshot.
   *  Read once, then the caller nulls the field so it cannot bleed
   *  into a recycled scene instance. The helper signals consumption
   *  via the `consumePending` result flag. May be null/undefined when
   *  the player did not pick a curse pre-run. Typed as `string` (not
   *  `CurseKey`) because the GameScene init parser widens unknown
   *  payloads here; `getCurseByKey` does the runtime narrowing and
   *  returns `null` on unknown values (the unit test pins this
   *  data-drift safety path). */
  pendingCurseKey: string | null | undefined;
  /** True when the run is being resumed from an active-run save.
   *  The value does not block curse application because each call
   *  creates a fresh modifier bag. */
  resumeRun: boolean;
  /** True when the run is a daily attempt. Daily runs use a fixed
   *  rule set (seed equivalence) and do not honor user curse picks.
   *  v2 playback still wins for determinism. */
  runIsDaily: boolean;
  /** The v2 sub-shape returned by `installReplayPlayback`. When
   *  non-null AND it carries `curseKey`, the helper applies that
   *  curse regardless of `resumeRun` / `runIsDaily` — replay
   *  determinism is the override. */
  playbackV2: ReplayBlobV2Meta | null;
  /** Pre-curse stat sheet from `StatComposer.getPlayerStats(metaSave)`.
   *  Used as the base for both the snapshot-override path (v2 spread)
   *  and the live-derive path (curse multipliers folded). */
  baseStats: ComposedPlayerStats;
}

export interface ApplyCurseAndComposeStatsResult {
  /** Fresh `defaultModifiers()` bag with the resolved curse's
   *  multipliers folded in. Caller assigns onto `this.runModifiers`.
   *  Mutated in-place by the curse's `apply` callback per CurseDef
   *  contract. */
  runModifiers: RunModifiers;
  /** The CurseKey of the applied curse, or null when no curse was
   *  applied. Caller assigns onto `this.activeCurseKey`. */
  activeCurseKey: CurseKey | null;
  /** True when the helper read `pendingCurseKey`. Caller MUST null
   *  its own field on true to prevent the curse from re-applying on
   *  scene reuse (the same scene instance is restarted on retry —
   *  CLAUDE.md "Scene reuse" rule). The flag is set whenever the
   *  field was non-null on input, regardless of whether the curse
   *  ended up actually being applied (e.g. during v2 playback the
   *  field is consumed but its value is ignored). */
  consumePending: boolean;
  /** The composed stat sheet `Player` reads at construction. Either
   *  a v2 snapshot splat onto `baseStats`, or `baseStats` with curse
   *  multipliers folded into `speed` / `maxHp`. */
  composedStats: ComposedPlayerStats;
}

/**
 * Resolve the run's curse + composed stats in one pass.
 *
 * Order of operations is load-bearing:
 *   1. Reset `runModifiers` to defaults (any prior run's bag is
 *      discarded — scene reuse safety).
 *   2. Read & null-out `pendingCurseKey` semantically (caller owns
 *      the actual field write; we surface `consumePending`).
 *   3. Apply the resolved curse to the fresh modifier bag (if any).
 *   4. Derive `composedStats` AFTER step 3 so the live-derive path
 *      sees the curse-mutated multipliers.
 *
 * Step 4's order dependency on step 3 is the reason this slice was
 * worth extracting as a pair — splitting curse-apply from
 * stat-derive would have invited a future bug where someone reads
 * `runModifiers.moveSpeedMult` before the curse mutated it. Tests
 * pin the order with an assertion that
 * `result.composedStats.speed === baseStats.speed * 0.88` for
 * `heavy_legs`.
 */
export function applyCurseAndComposeStats(
  input: ApplyCurseAndComposeStatsInput,
): ApplyCurseAndComposeStatsResult {
  const runModifiers = defaultModifiers();
  let activeCurseKey: CurseKey | null = null;
  // `consumePending` is sticky on `pendingCurseKey` being set, even when
  // the value is ignored (v2 playback path). This matches the
  // pre-extraction `this.pendingCurseKey = null` unconditional clear:
  // the field is consumed before the branching logic.
  const consumePending = input.pendingCurseKey != null;

  if (input.playbackV2 && input.playbackV2.curseKey) {
    const curse = getCurseByKey(input.playbackV2.curseKey);
    if (curse) {
      curse.apply(runModifiers);
      activeCurseKey = curse.key;
      globalEventBus.emit('GLOBAL_CURSE_STARTED', { curseKey: curse.key });
    }
  } else if (!input.runIsDaily) {
    const curse = getCurseByKey(input.pendingCurseKey ?? null);
    if (curse) {
      curse.apply(runModifiers);
      activeCurseKey = curse.key;
      globalEventBus.emit('GLOBAL_CURSE_STARTED', { curseKey: curse.key });
    }
  }

  // v2 playback: the snapshot captured at record-time overrides the
  // live meta-upgrade stat composition so the replayed run uses the
  // exact sheet the recorder saw. BALANCE.player constants (dash etc.)
  // come from `baseStats` as before — they're build-level.
  const composedStats: ComposedPlayerStats = input.playbackV2?.composedStats
    ? { ...input.baseStats, ...input.playbackV2.composedStats }
    : {
        ...input.baseStats,
        speed: input.baseStats.speed * runModifiers.moveSpeedMult,
        maxHp: Math.max(
          1,
          Math.round(input.baseStats.maxHp * runModifiers.startHpRatio),
        ),
      };

  return { runModifiers, activeCurseKey, consumePending, composedStats };
}
