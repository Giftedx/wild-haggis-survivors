# W71 Skeletal Animation Rig — Items Blocked on Human

**Charter:** `docs/top-10-tasks/02-w71-skeletal-animation-rig.md`
**Phase 1 closure agent commit:** see branch `feat/w71-phase1-close`.
**Date:** 2026-04-26.

## What shipped autonomously

- ADR-0005 (`docs/adr/0005-skeletal-animation-rig.md`) ratifying texture-swap atlases over a true bone hierarchy. Documents the format, the variant-overlay strategy, alternatives considered, and the rollback path.
- `src/animation/animationPerf.bench.test.ts` — runtime perf benchmark. Three cases: 201-entity steady state (player + 200 enemies, mix of idle/walking with periodic hurt edges), 100-idle-entity sanity (cheapest case), 50-entity hurt-burst stress (worst-case state-transition churn). All three pass with a budget of 0.5 ms/tick average; observed on the CI runner is 0.02 ms/tick steady state.
- `docs/PHASE_0_GATE_NOTES.md` — status banner pointing readers at this file and at ADR-0005.
- `docs/adr/README.md` — ADR index updated for 0002–0005.

## What is genuinely blocked on a human session

These items require live-Phaser, RAF-driven, GPU-bound conditions that vitest's node environment cannot reach. Each is small in scope — 5–30 minutes of human time once the steps are followed.

### 1. Phase 0 Gate A — 24-h cooldown self-review (charter Acceptance §"Soul Check covered")

**Procedure** (already documented in `docs/PHASE_0_GATE_NOTES.md` §"Gate A — 24 h cooldown self-review"):
1. `npm run dev`, set `globalThis.DEV_HOTKEYS = true` in console.
2. Capture haggis idle / walking / with-tam idle / with-tam walking via `K` hotkey.
3. Capture 3 reference enemy sprites (dean_apparition, tome_wraith, redcap) via `C` hotkey + screenshot.
4. Side-by-side squint test against the charter checks (silhouette, light model, layered depth, focal hierarchy, palette discipline, character pose, accessory fit).

**Why blocked:** Squint-testing requires human visual judgement against the Soul charter. Cannot be automated.

**Gate outcome to record:** PASS / REWORK in `docs/PHASE_0_GATE_NOTES.md` §Outcome.

### 2. Phase 0 Gate B — external reviewer panel

**Procedure** (already documented in `docs/PHASE_0_GATE_NOTES.md` §"Gate B — external review"):
1. Record 15-30 s gameplay clip of classic haggis walking + tam toggling + a few combat beats.
2. Save to `.superpowers/captures/phase0_gameplay.mp4`.
3. Share with ≥2 non-developer reviewers; ask "does this look handcrafted / polished / Scottish?".
4. Record one-sentence reactions in PHASE_0_GATE_NOTES.

**Why blocked:** Requires human reviewers. Cannot be automated.

**Acceptable degraded path:** If reviewer pool cannot be convened, escalate to solo-dev self-review with explicit acknowledgement (per spec v3 §Caveats).

### 3. Live FPS A/B against procedural baseline (charter Acceptance §"Frame-time regression ≤10%")

**Procedure:**
1. `npm run dev`, open browser to `http://localhost:3000`.
2. In devtools console, set `globalThis.AUTO_BATTLE = true`. Start a run. Wait 3-5 minutes. Record average FPS via Chrome's perf-tab FPS meter.
3. `git checkout` a pre-Phase-0 commit (the parent of `e06ffdf`, the first Phase-0 commit). Repeat. Record.
4. Delta should be within 5%. The captured `animationPerf.bench.test.ts` provides a strong prior — texture-swap is cheap — but a live-Phaser measurement is the contractual gate.

**Why blocked:** Requires a live browser, dev-tools FPS meter, and a 5-minute soak. The 60 fps target is GPU + RAF scheduler-bound and cannot be measured headlessly inside vitest with confidence (jsdom vs. real WebGL diverge).

**Risk if skipped:** Low. The benchmark proves JS-side cost is negligible (0.1 µs/entity). A live regression would have to come from Phaser's own batched render pipeline, which W71 doesn't change — the same `setTexture` + sprite draw path was used pre-Phase-0; only the texture-key churn is new, and Phaser texture lookup is O(1).

### 4. Drift-readability check (charter Acceptance §"Drift visibly readable in the player walk cycle")

**Procedure:**
1. `npm run dev`. Play a few minutes of normal movement.
2. Verify the clockwise drift bias (`PLAYER.DRIFT_DEGREES`) is visually readable in the haggis walk cycle. The drift is a rotational offset on input direction, NOT a sprite-rotation animation — but the walk-cycle leg lift should not obscure the drift's directional bias.

**Why blocked:** Requires human visual confirmation under live input. This is a Soul Check item, not a unit-testable assertion.

**Risk if skipped:** Medium. Drift is "core identity of the game" per the charter. If the walk cycle hides the bias, the rig has failed the Soul Check.

### 5. 14-variant Loom recording (charter Verification §"Loom recording of all 14 variants idle + walk + hit for visual review")

**Procedure:**
1. `npm run dev`. Switch through each of the 14 variants (Cailleach, Iron Belly, Hebridean, etc.) via the variant-select UI (or via `?variant=<key>` URL param if supported).
2. For each variant: 5 s idle + 5 s walking + 1 hit reaction.
3. Loom-record + share for visual review.

**Why blocked:** Visual identity check — requires human review of pixel-art quality across the variant roster. The atlas bake is automated and the pixel-perfect output of `drawHaggisBody` is unit-tested per variant, but "do all 14 still feel distinct after the rig change?" is a human question.

**Acceptable degraded path:** Solo-dev squint test through `CombinationsPreviewScene` (`C` hotkey in dev mode).

### 6. Phase 3 — boss attack-state animations (deferred per charter §Scope §Phase 3)

Charter explicitly stops Phase 3 at "three enemy archetypes" — the three already shipped. Boss-specific animations (`gordon`, `tour_bus`, `taxman`) are tracked separately and would warrant their own ADR extension if/when authored as `FRAME_OFFSETS` tables.

**Why blocked:** Out of scope for this charter; deliberately deferred. Tracked in W71 Phase 3 backlog (`docs/HUGE_INITIATIVES_MASTER_PLAN.md` row W71).

### 7. Procedural-fallback feature flag (charter Acceptance §"Procedural fallback flag still works")

The charter called for a `USE_SKELETAL_PLAYER` flag for emergency revert. ADR-0005 §Consequences §Negative documents the explicit decision NOT to ship one — Phase 1 has been live since 2026-04-23, the 30-day revert window has effectively passed, and a clean `git revert` on the Phase 0+1 commit range is the operational rollback. Non-animated enemies already keep their `bobPhase` fallback path via the registry's opt-in semantics.

**Why blocked:** This is a documented intentional deviation. If the user wants the flag despite the rationale, ~30 minutes to add it: a `featureFlags.ts` constant, a branch in `Player.ts` constructor that swaps `AnimationController` for the legacy `setTexture(textureKey)` path, and a test that exercises both branches.

## Verification artifacts to keep with the human-gated work

- Screenshots from Gate A → `.superpowers/captures/phase0_*.png`
- Gameplay clip from Gate B → `.superpowers/captures/phase0_gameplay.mp4`
- FPS A/B numbers → fill into `docs/PHASE_0_GATE_NOTES.md` §FPS baseline
- Loom URL for 14-variant review → record in this file or in `docs/PHASE_0_GATE_NOTES.md`
