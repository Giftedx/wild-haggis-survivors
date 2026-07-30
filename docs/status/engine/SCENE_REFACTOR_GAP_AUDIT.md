# SCENE_REFACTOR_GAP_AUDIT — T401 running notes

Purpose: chronological log of slices extracted from `src/scenes/GameScene.ts`
during the T401 decomposition push, plus the remaining-debt notes that the
next dispatch should know about. One paragraph per slice, newest first.

The full plan lives in
`docs/archive/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` (T401 +
Exceptions sections); this file is a thinner running journal so a coordinator
doesn't have to re-read the plan to know what's already gone.

---

## 2026-04-26 — slice: run-start ceremony (Burns Night opening + platter spawn)

Extracted `installRunStartCeremony` to `src/scenes/game/runStartCeremony.ts`.
Replaces the inline block in `GameScene.create()` that scheduled the Gran-
opens-the-door banter (with curse-aware delay), the seasonal stinger swap
(Burns Night pipes / Hogmanay bells), and the single-shot Burns Night
haggis-platter spawn timer. Helper takes a thin adapter shape — caller
passes `scheduleSceneDelay` rather than the helper importing Phaser, so it
stays vitest-node-env-safe. 11 focused tests cover the gating matrix
(replay/resume short-circuit, curse-aware delay, seasonal stinger branches,
platter spawn-flag mid-flight reset guard, opt-out propagation). GameScene
LOC 3526 → 3502 (-24, plus one whole import block dropped).

Remaining T401 debt around this slice:

- `curse_start` banter (lines ~1263-1269 of `create()`) is still inline.
  Same shape (`time.delayedCall` + banter request) but different gating
  (`if (this.activeCurseKey)` rather than the ceremony's
  `!replay && !resume`). A future slice could fold both schedules into
  one `installRunStartBanters` helper if the gating story converges.
- Replay-recording / playback bridge (lines ~700-790 of `create()`,
  charter priority 2) untouched — touches the T1 replay determinism
  contract so warrants its own dedicated slice with the determinism
  test in the gate set.
- Telemetry begin / clip recorder install (lines ~1490-1545, charter
  priority 3) untouched — self-contained, low risk, good next pick.

## 2026-04-26 — slice: act intermission `onResolve` (not shipped)

The planned factory existed, but no source file imported it. The repository no
longer contains the unused module. The live callback remains in `actIntermissionLauncher.ts`.

## 2026-04-26 — slice: per-frame HUD coordinator (already shipped)

`updateRunHudFrame` in `src/scenes/game/updateRunHudFrame.ts`. Owns
the HUD-only portion of the frame update so `GameScene.update()`
delegates instead of inlining HP/XP/timer/relic-slot pushes.
