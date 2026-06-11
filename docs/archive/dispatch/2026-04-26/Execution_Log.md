# Top 10 Autonomous Dispatch — Execution Log

**Coordinator session:** 2026-04-26 (reconciliation run)  
**Workspace:** `C:\Users\aggis\hlooper\wild-haggis-survivors`  
**Ledger:** `docs/dispatch/2026-04-26/00_task_list.md`  
**Prompts:** `docs/dispatch/2026-04-26/task_01.md` … `docs/dispatch/2026-04-26/task_10.md`

## Phase 1 — Project-wide scan and preparation

| Step | Status | Notes |
|------|--------|--------|
| Global audit | **Complete** | Counts: ~953 `src/**/*.ts`, ~32 `e2e/**/*.ts`, ~151 `docs/**/*.md`; `GameScene.ts` ≈ 3,304 LOC; gap audits and triple-audit plan on disk. |
| Top 10 isolation | **Complete** | Dispatch table unchanged in intent; ledger refreshed with scan evidence and accurate GameScene size. |
| `00_task_list.md` | **Complete** | Includes dispatch table, rationale, Future Considerations. |
| `task_01.md`–`task_10.md` | **Complete** | Each file is a standalone agent system prompt (mission, context, scope, constraints, deliverables, verification). |

## Phase 2 — Dispatch policy (workspace safety)

**Parallel autonomous *implementation* agents on a single working tree are not run:** they would contend on `GameScene.ts`, i18n, settings, and shared tests and would likely produce conflicting diffs.

**Executed instead:** one coordinator-ordered batch of **read-only audit agents** (one per task), each instructed to read its `docs/task_NN.md`, **not modify files**, and return status vs mission, evidence paths, next steps, and blockers. Full implementation remains for serial human- or agent-led runs (e.g. git worktrees per `AGENTS.md` / worktree skill).

## Dispatch queue — read-only audit batch (2026-04-26)

| # | Prompt file | Agent mode | Status |
|---|-------------|------------|--------|
| 1 | `docs/dispatch/2026-04-26/task_01.md` | Read-only audit | Dispatched |
| 2 | `docs/dispatch/2026-04-26/task_02.md` | Read-only audit | Dispatched |
| 3 | `docs/dispatch/2026-04-26/task_03.md` | Read-only audit | Dispatched |
| 4 | `docs/dispatch/2026-04-26/task_04.md` | Read-only audit | Dispatched |
| 5 | `docs/dispatch/2026-04-26/task_05.md` | Read-only audit | Dispatched |
| 6 | `docs/dispatch/2026-04-26/task_06.md` | Read-only audit | Dispatched |
| 7 | `docs/dispatch/2026-04-26/task_07.md` | Read-only audit | Dispatched |
| 8 | `docs/dispatch/2026-04-26/task_08.md` | Read-only audit | Dispatched |
| 9 | `docs/dispatch/2026-04-26/task_09.md` | Read-only audit | Dispatched |
| 10 | `docs/dispatch/2026-04-26/task_10.md` | Read-only audit | Dispatched |

### Human interventions required (standing)

- **T203:** real mobile hardware evidence (see `docs/status/mobile/MOBILE_DEVICE_TEST_MATRIX.md`).
- **Cultural / dialect / Burns / Gaelic:** native or contracted reviewer sign-off; agents organize gates only.
- **PEAT:** human PEAT tool pass; agents may only automate capture prep.
- **Cloud production:** auth, privacy, deployment, and product decisions outside spike scope.

## Prior session artifact (archived note)

An earlier log recorded overlapping "Running" worker names and a 6-worker cap from a different runtime. This file supersedes that snapshot for the coordinator session above. Historical detail: prior task 5 (mobile smoke/matrix) completion notes may still appear in git history or `docs/archive/top-10-2026-04-26-batch/Execution_Log_2026-04-26-batch.md` (renamed from `Execution_Log.md` to disambiguate from this file).

## Final status summary (coordinator)

| # | Task (short) | Audit batch |
|---|----------------|-------------|
| 1 | GameScene decomposition phase 2 | Dispatched read-only |
| 2 | DOM-visible focus layer | Dispatched read-only |
| 3 | Assist Mode runtime / unhide | Dispatched read-only |
| 4 | First-run drift micro-practice | Dispatched read-only |
| 5 | Mobile readiness / touch | Dispatched read-only |
| 6 | Cultural review gating / packet | Dispatched read-only |
| 7 | PEAT capture harness | Dispatched read-only |
| 8 | Cloud save backend spike | Dispatched read-only |
| 9 | Visual regression / bundle gate | Dispatched read-only |
| 10 | Current-run identity panel | Dispatched read-only |

**Implementation completion:** not claimed in this session; see subagent completion notifications for per-task audit narratives, or run tasks serially with write access when ready.

---

## Read-only audit results (2026-04-26) — subagent summaries

| # | Headline finding |
|---|------------------|
| **1** | T401: `updateRunHudFrame` extracted; largest remaining blocks are `create()` (~950 LOC), `finalizeNodeVisit` (~460 LOC), run-start ceremony, replay bootstrap. Top next slices: node-map resolution, ceremony coordinator, replay bridge. |
| **2** | `domFocusLayer.ts` + GameOver adoption + Vitest + `A1_DOM_FOCUS_LAYER.md` shipped; **no E2E** for the layer. Next adoption: **CurseScene** (then NodePromptUI, then Settings). |
| **3** | Invincibility, post-dash grace, combo window **wired**; game speed **scaffold only**. **Replay risk:** Assist not snapshotted in replay blob—settings-time divergence possible. |
| **4** | Drift micro-practice **largely shipped** (`driftPractice.ts`, TutorialSystem, E2E `drift-practice.spec.ts`); 12s cap; **Enter-only skip** may miss touch-primary; minor test gaps on timeout/complete through full tick path. |
| **5** | Strong `chromium-mobile` smoke + viewport reflow + touch target units; T203 still human. **High-ROI:** visible dash-zone discoverability + reflow assertion for that zone. |
| **6** | **CI-enforced** cultural gate via `CULTURAL_REVIEW_STATUS.json` + `culturalReviewStatus.test.ts`; packet is SOT for humans. Gaps: regex/manifest dual spec; non-manifest sensitive copy out of scope; some C2 doc process drift vs packet. |
| **7** | Code hooks (`a11yMotion`, `haarA11y`, Juice) solid; **A1_PEAT_AUDIT** rows still human `_PEAT pending_`; no paired reduceFlashing OFF/ON capture spec or audit “harness” column yet. Suggested: Playwright PEAT sample pair + runbook. |
| **8** | **`src/cloud/*`** typed client + envelope + conflict + `Memory`/`Noop` tests; **no HTTP/Worker/mock integration**; settings `cloudSaveOptIn` + preview query gate. Spike work remains. |
| **9** | Visual specs write PNGs, no baselines; Vite only **warns** on chunk size. **Suggested gate:** post-build gzip budget script vs documented baselines in CI. |
| **10** | Pause already surfaces routes/relics/act (partial); **variant** missing in pause; **runes** nowhere in pause/HUD/game over; GameOver payload lacks routes/relics/act/runes vs Chronicle. **Best surface:** extend pause run-identity first. |

---

## Post-audit implementation snapshot — 2026-04-26 (later same day)

The read-only audit table above captured state at dispatch time. After the audit returned, implementation work continued on most charters. The snapshot below grounds each task against current working-tree truth so a future agent can read "what shipped since the audit" without re-running it.

All entries below are **uncommitted** as of this update — verify against `git status` and `git log` before relying on the table. Source paths use the working-tree path; `??` items are untracked, `M` items are modified-tracked.

| # | Task | Audit verdict (above) | Current state (this update) | New artifacts |
|---|------|----------------------|----------------------------|---------------|
| 1 | GameScene phase 2 | `updateRunHudFrame` extracted | Plus `actIntermissionOnResolve` extracted. `GameScene.ts` ≈ **3521 LOC** (ledger's 3304 was correct at dispatch; growth came from later HUD/pause wiring, not regression). | `src/scenes/game/updateRunHudFrame.ts` (??) + test, `src/scenes/game/actIntermissionOnResolve.ts` (??) |
| 2 | DOM focus layer | helper + GameOver, no E2E | Unchanged from audit; CurseScene / NodePromptUI / Settings adoptions still pending; no Playwright accessibility smoke yet. | (no new files) |
| 3 | Assist Mode runtime | invincibility/iframe/combo wired, no replay snapshot | Replay snapshot helper added (assist + comfort fields captured into v2/v3 blobs). Settings exposes a single Off → Timing → Invincible preset row. Game speed still hidden. | `src/replay/assistReplaySnapshot.ts` (??), `src/scenes/settingsAssistMode.ts` (??) + test, `src/replay/replayBlobV2.ts` / `replayBlobV3.ts` (M) |
| 4 | Drift micro-practice | shipped at `src/systems/driftPractice.ts` | Unchanged; touch-primary skip path still gated on Enter; minor test coverage gaps for timeout/complete through the full tick path. | (no new files) |
| 5 | Mobile readiness | strong smoke + reflow; T203 still human | Mobile specs modified for tighter assertions; `MOBILE_DEVICE_TEST_MATRIX.md` clarifies preflight + acceptance rules. Real-device rows still `_pending_`. | `e2e/mobile-smoke.spec.ts` (M), `e2e/mobile-viewport-reflow.spec.ts` (M), `docs/status/mobile/MOBILE_DEVICE_TEST_MATRIX.md` (M) |
| 6 | Cultural review gating | CULTURAL_REVIEW_STATUS.json + Vitest gate shipped | Packet doc + JSON manifest + Vitest enforcement live. Four gates `blocked_until_review`: Doric, Shetlandic, Burns/Canongate, Gaelic+Cailleach. C2 docs cross-link the packet as SOT. | `docs/status/cultural/CULTURAL_REVIEW_PACKET.md` (??), `docs/status/cultural/CULTURAL_REVIEW_STATUS.json` (??), `src/data/culturalReviewStatus.test.ts` (??) |
| 7 | PEAT capture harness | code hooks, no paired capture spec | Reduce-flashing OFF/ON paired Playwright spec now exists; `A1_PEAT_AUDIT.md` calls it out as automated prep (not a PEAT substitute). 25 audit rows still `_PEAT pending_`. | `e2e/peat-reduce-flashing-pair.spec.ts` (??), `docs/status/a11y/A1_PEAT_AUDIT.md` (M), `src/core/a11yMotion.ts` (M), `src/systems/JuiceSystem.ts` (M) |
| 8 | Cloud save backend | client + envelope only; no HTTP | HTTP client + integration-test seam landed: `signInForTest` (Vitest-only), GET/PUT `/v1/envelope`, status→reason mapping. No Worker / D1 scaffold yet. | `src/cloud/httpCloudSaveClient.ts` (??) + integration test |
| 9 | Visual regression / bundle gate | Vite warns only | Post-build gzip budget script lives at `scripts/check-bundle-budget.mjs`. Baselines (vendor-phaser ≤ 390 KB gzip, index ≤ 285 KB gzip) measured 2026-04-26. Wire to CI / `npm run ci:all` is still TODO. Visual baselines still PNG-only. | `scripts/check-bundle-budget.mjs` (??) |
| 10 | Run identity panel | pause partial; variant + runes missing | `pauseStats` now emits variant + rune lines (gated by data-present thresholds). Act / route / relic lines already shipped. GameOver / Chronicle parity still open. | `src/scenes/game/pauseStats.ts` (M) + test, `src/scenes/game/PauseMenu.ts` (M), `src/ui/HUD.ts` (M), `src/ui/UpgradeCards.ts` (M) |

### Standing human-gated items (unchanged)

- **T203:** real mobile-device evidence per `docs/status/mobile/MOBILE_DEVICE_TEST_MATRIX.md`.
- **Doric / Shetlandic / Burns / Gaelic+Cailleach:** human review per `docs/status/cultural/CULTURAL_REVIEW_PACKET.md`; CI test fails on `ship_release` without evidence.
- **PEAT:** human PEAT-tool desktop pass over the 25 rows in `docs/status/a11y/A1_PEAT_AUDIT.md`.
- **Cloud save:** auth, privacy policy, deployment flow are product decisions outside the spike.

### How to re-verify this snapshot

```bash
git status --short
git log --oneline -5
wc -l src/scenes/GameScene.ts
ls src/scenes/game/
ls src/cloud/
ls e2e/
ls scripts/
```

If any line in the table above contradicts what you observe, treat the working tree as truth and update this section, not the audit table above it.

---

## Backlog-drain dispatch — 2026-04-26 (evening)

After the post-audit snapshot landed, all ten task entries were committed (commits `b3bec32` … `a220f76`). A coordinator-driven backlog-drain pass began with the orchestrator prompt at `docs/prompts/orchestrator-backlog-drain.md`. Tier-A parallel batch (different scopes) and Tier-B serial batch (GameScene contention) follow the orchestrator's rules.

### Tier-A round 1 — shipped to `master`

| Charter | Commit | What landed |
|---|---|---|
| `task_09` (T310 wire-up) | `4fb95ce` | `npm run ci` chain now runs `lint → test → build → budget → flash-budget`. Bundle gate (vendor-phaser ≤ 390 KB gzip, index ≤ 285 KB gzip) and flash gate enforced on every CI / PR. New `npm run budget` alias. Flash-budget header docstring truthed-up. |
| **P1.4** (bagpipes utility-only copy) | `72778be` | Burns deed `ach_burns_beastie_unlock.description` was promising "every weapon in its evolved form" — bagpipes never evolves; reworded to "all seven legends forged" in EN + SCS. Removed dead `ui.banter.first_time.evo_bagpipes` orphans (no `BANTER_POOLS` source). 3 new evolution-test fences guard against regression. |

### Tier-B serial — shipped to `master`

| Charter | Commit | What landed |
|---|---|---|
| `task_01` slice 3 — run-start ceremony | `10adb90` | Burns Night / Hogmanay seasonal stinger + Gran banter + Burns Platter spawn schedule extracted from `GameScene.create()` into `src/scenes/game/runStartCeremony.ts` (Phaser-import-free, scheduleSceneDelay thunk). 11 vitest cover gating matrix. GameScene 3526 → 3502 LOC. |
| `task_10` — chronicle act chip | `f93d311` | `formatActReachedChip(routes)` adds `↟ Act N` chip to Chronicle run-history rows (was implicit in route-breadcrumb arrow count). GameOver was already at parity. EN+SCS string. Runes deferred — would need RunHistoryEntry schema bump. |
| `task_02` adoption #2 — NodePromptUI DOM focus | `8daf2f7` | DOM mirror for the node-event prompt: `role=dialog`, aria-label = title, aria-describedby = body, one button per option labelled `"{label} — {subLabel}"` so price chips / HP costs reach assistive tech in one announcement. CurseScene was already adoption #1; per dispatch rule, pivoted to next priority. |
| `task_02` adoption #3 — SettingsScene DOM focus | `b6143cf` | 22-row per-row mirror. Slider value folded into label (`"Master volume — 80%"`), toggle state echoed (`"Captions — ON"`), cycle current label exposed (`"Language — English (Glesga)"`). Section headers + keybind capture deferred. |

### Tier-B items already shipped — skipped per hard-no rule

After dispatch landed, several Tier-B items in the orchestrator's serial list turned out to be already implemented in `master`. Verified by reading the source directly; banner in `report-backlog-consolidated-250426.md` was stale relative to `git log`.

| Item | Evidence |
|---|---|
| `task_04` drift micro-practice — touch-primary skip | `src/systems/TutorialSystem.ts:507-510` already wires `scene.input.on('pointerdown', ...)` alongside the keyboard handler; `driftPractice.test.ts` already covers timeout/complete/skip-priority/full-poll/mid-window cases. |
| `task_02` adoption #1 — CurseScene DOM focus | `src/scenes/curseDomFocusActions.ts` + 7 vitest + `e2e/curse-dom-focus.spec.ts` all pre-shipped. |
| **P0.4** — save failure UX | T131 fully shipped: `src/utils/saveFailure.ts` `emitSaveFailure` invoked from all four save paths (legacy/meta/settings/active_run), `src/scenes/game/wireSceneEventBus.ts:55-57` listens for `GLOBAL_SAVE_FAILED` and toasts via `i18n.save_failed` (Hearth-warm: "The cairn won't take it…"). |
| **P1.1** — boss kill vs death same frame | T201 fully shipped: `src/scenes/game/RunLifecycle.ts:288-295` calls `invalidatePendingVictoryTicker()` + forces `victoryPending = false` at top of `handleDeath()`. `onPlayerHitZero` early-returns on `victoryPending`. Test coverage in `RunLifecycle.test.ts`. |
| **P1.5** — gamepad E2E | T202 fully shipped at `e2e/gamepad.spec.ts` — synthetic pad via `addInitScript`, asserts d-pad-right movement + button-0 dash. |

### Tier-B not dispatched (product-gated or out of scope)

- `task_03` — Assist Mode game-speed expose-vs-hide decision still requires product call. Replay-snapshot helper for assist + comfort fields is already shipped; only the UX surface decision is open.

### Spawn-tasks created this session

- **Back-fill GameOverScene DOM focus mirror** — sub-agent confirmed `docs/status/a11y/A1_DOM_FOCUS_LAYER.md` claims GameOver as first adopter aspirationally; the scene file does NOT actually import the helper. CurseScene + NodePromptUI + SettingsScene are the live adopters. Either back-fill the GameOverScene adoption or correct the doc. (Chip showing in user UI for spawn.)

### Standing follow-ups surfaced this session

- **`Player.di.test.ts` flake under high vitest concurrency** — passes isolated, times out at 5 s under full 425-file parallel transform. Pre-existing on `master`. Suggested fix: `timeout: 30_000` on the test, or hoist `await import('./Player')` outside the test body. Track as `T420`. **CLOSED** — shipped 2026-04-27 (commit `7411a41`).
- **SettingsInputScene keybind capture DOM mirror** — sub-scene launched from rebind row needs a different DOM gesture (announce "press a key for X" + temporary press-listener bridge). Next adoption candidate after the GameOver back-fill. **CLOSED** — shipped 2026-04-27 as T407 adoption #5 (commit `59d7143`).
- **Visual-regression PNG baselines still missing thresholded comparison** — covered by existing `T408` in `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md`; not in scope of T310. **CLOSED** — shipped 2026-04-27 (commits `75c374e` + `98cb76a` + `9c69d1d` + `5efff0c`).

---

## Backlog-drain dispatch — 2026-04-27 (continuation)

Coordinator session resumed against the same orchestrator brief at `docs/prompts/orchestrator-backlog-drain.md`. Worked the residual list flagged by the prior session.

### Tier-A round 2 — shipped to `master` (parallel single-message dispatch)

| Charter | Commit | What landed |
|---|---|---|
| `T420` (Player.di.test.ts flake) | `7411a41` | Per-test `{ timeout: 30_000 }` on the DI test; comment cites T420 ledger entry. Test still asserts `throws /TimeManager/i`. Three gates green. |
| `task_08` (Cloudflare Worker + D1 + miniflare) | `3fac689` | New `cloudflare/` workspace dir: wrangler.toml, schema/0001_initial.sql, src/{worker,routes,auth,d1Adapter,types}.ts, 30 tests (18 unit + 12 integration via miniflare against the real `HttpCloudSaveClient`). Root `npm:test:cloud` script delegates. ADR-0006 spike-outcome section appended. **Two Worker scaffolds now coexist** (`server/worker/` from earlier P3 spike + `cloudflare/` from this slice) — T423 will pick which graduates at deploy time. Offline-first untouched, no production-leak surface. |
| `T407` adoption #5 — SettingsInputScene keybind capture DOM mirror | `59d7143` | Phaser-free `settingsInputDomFocusActions.ts` + 18-test cover; scene installs/teardowns DOM layer with capture-mode swap ("Press a key for Move up primary keyboard. Escape to cancel." while capturing). 18 row buttons + Reset + Back. New EN+SCS i18n keys under `ui.inputRebind.a11y.*`. Playwright smoke at `e2e/settings-input-dom-focus.spec.ts`. SettingsInput stays lazy-loaded. |

### Tier-B serial — shipped to `master`

| Charter | Commit | What landed |
|---|---|---|
| `T401` phase 2 slice 4 — replay bridge extraction | `fdde63f` | `src/scenes/game/replayBridgeInstall.ts` (268 LOC, 5 pure functions) + `replayBridgeInstall.test.ts` (364 LOC, 21 tests). GameScene 3502 → 3464 LOC (-38). Replay blob shape **untouched** — no v2/v3 migration. `replayDeterminism.test.ts` byte-identical (7/7 pass). Behaviour preserved across all 5 touchpoints (init, teardown, record-pump, playback-pump, reset). |
| `T408` thresholded visual-regression diff gate | `75c374e` + `98cb76a` + `9c69d1d` | `expect(canvas).toHaveScreenshot()` layered on top of existing design-verify writes. Per-scene thresholds: MainMenu 5%, Croft 30% (Croft's hearth-fire + Gran-pulse measured 14% natural variance, 30% covers 1-2 more animation tiers without flake but still trips on 50%+ layout regressions). 4 baseline PNGs committed (`-win32` only; chromium-desktop only). Three Playwright runs green back-to-back. |
| `T409` linux-baseline missing → win32 platform gate | `5efff0c` | The T408 baselines are `-win32` only; CI runs on `ubuntu-latest`. Gated `compareDiff` to `process.platform === 'win32'` so linux runners still execute design-verify writes but skip the thresholded compare until linux baselines are regenerated. Spec header documents the regen procedure. |

### Tier-B not dispatched (product-gated or human-gated, unchanged from prior session)

- `task_03` Assist Mode game-speed expose-vs-hide — product decision
- `task_05` T203 mobile real-device — human hardware
- `task_06` cultural review (Doric / Shetlandic / Burns / Gaelic+Cailleach) — native review
- `task_07` PEAT 25-row desktop pass — human PEAT tool
- `task_08` cloud save **auth + privacy + deploy** — product decisions; spike scaffold is shipped, deploy path not in scope

### New follow-ups surfaced this session

- **T409** — regenerate VR baselines on linux + drop the `process.platform === 'win32'` guard in `e2e/visual-regression.spec.ts`. Easiest path: one-off CI artifact pull from a `--update-snapshots` run, or local docker-desktop linux container. Until done, the diff gate runs on Windows dev machines only.
- **T410** — webkit + firefox VR baselines. Per-engine DPR/GPU variance means engine-specific baseline sets. Punted as out of scope.
- **T421** — replace `signInForTest` in `HttpCloudSaveClient` with real magic-link flow (token issuance, single-use enforcement, replay defence, `/auth/request` rate-limit, OWASP review).
- **T422** — privacy policy + opt-in flow + soft-delete window for cloud saves.
- **T423** — pick which Worker scaffold graduates (`server/worker/` vs new `cloudflare/`). Deploy pipeline (`wrangler publish`, secrets, real `database_id`, custom domain, monitoring).
- **T424** — D1 schema migration runner beyond `0001_initial.sql`.
- **T425 (candidate)** — broaden the T420-style `{ timeout: 30_000 }` pattern to other concurrency-flake-prone tests. Sub-agents observed `animationPerf.bench.test.ts`, `MetaProgress.airgap`, `Player.runeBag` flaking under heavy CPU load; second runs always cleared. Same root cause as T420. Three more `it(..., { timeout: 30_000 }, ...)` calls would close the flake window.

### Open hazards / risks (one-line callouts)

- **`-win32` VR baselines only** — see T409 above. Mitigated for now, but the gate has a hole on linux until baselines land.
- **Two Cloudflare Worker scaffolds coexist** (`server/worker/` + `cloudflare/`) — T423 picks at deploy time. Tests cover both paths; runtime collision impossible because game bundle never imports either.
- **Worktree leftover at `.claude/worktrees/practical-bassi-a8c53d/`** — appears to be from the prior multi-agent dispatch that already reconciled. Safe to prune; not blocking.

### Standing human-gated items (carried forward unchanged)

- **T203:** real mobile-device evidence per `docs/status/mobile/MOBILE_DEVICE_TEST_MATRIX.md`.
- **Doric / Shetlandic / Burns / Gaelic+Cailleach:** human review per `docs/status/cultural/CULTURAL_REVIEW_PACKET.md`.
- **PEAT:** human PEAT-tool desktop pass over the 25 rows in `docs/status/a11y/A1_PEAT_AUDIT.md`.
- **Cloud save:** auth, privacy policy, deployment flow are product decisions outside the spike (T421-T423).
- **Assist Mode game-speed:** expose vs hide is a product decision (`task_03`).

---

## Backlog-drain dispatch — 2026-04-28 (continuation)

Coordinator session resumed against the same orchestrator brief. Same hard-no list, same dispatch policy.

### Tier-A round 3 — shipped to `master` (parallel single-message dispatch)

| Charter | Commit | What landed |
|---|---|---|
| `T425` (broaden T420 timeout pattern) | `5064b22` | Per-test `{ timeout: 30_000 }` applied to three more concurrency-flake-prone vitest cases, mirroring T420 commit `7411a41`. Targets: `animationPerf.bench.test.ts` (steady-state per-tick cost), `MetaProgress.airgap.test.ts` (WeaponSystem dynamic import), `Player.runeBag.test.ts` (six rune-bag fold tests, beforeEach does heavy `await import('./Player')`). No body / assertion / hook changes. None of the three reproduced the flake on the agent's quiet-machine pre-fix run; pre-emptive fix matches the T420 posture. |
| `T410` (webkit + firefox VR baselines) | `d0202a5` | 6 new baseline PNGs committed (2 webkit-desktop-win32, 4 firefox-desktop-win32 — webkit mobile is `test.skip(browserName === 'webkit', …)` so 2 PNGs short of full matrix). Per-engine threshold helper: chromium MainMenu 5% / Croft 30%; webkit + firefox bumped to MainMenu 15% / Croft 40% (+10pp absolute) to absorb cross-engine GPU/DPR variance. `process.platform === 'win32'` gate kept (T409 still open for OS coverage). Three back-to-back playwright runs across all three engines green. |
| `T401` slice 5 — curse + composedStats extraction | `217b482` | `src/scenes/game/applyCurseAndComposeStats.ts` (185 LOC, 5 typed inputs / 4 typed outputs, no Phaser imports) + `applyCurseAndComposeStats.test.ts` (368 LOC, 16 tests). GameScene 3464 → 3439 LOC (-25). Replay determinism byte-identical (7/7 `replayDeterminism.test.ts`). Order-of-operations preserved: curse-apply mutates `runModifiers` BEFORE composedStats reads `moveSpeedMult` / `startHpRatio`. `globalEventBus.emit('GLOBAL_CURSE_STARTED', …)` fires once and only once per applied curse. Bag-vs-cached-field doctrine respected — helper writes into a fresh `defaultModifiers()` bag, caller assigns onto `this.runModifiers` BEFORE SpawnSystem / WeaponSystem cache. **Slice 5 picked candidate C (lowest risk) over A (node-map lifecycle, ~70-90 LOC) and B (run-end shutdown, ~60 LOC)** — A's teardown spans two methods with divergent error-handling shapes (`resetTransientRunState` bare destroy vs `registerShutdownCleanup` try/catch), B couples to ~30 scene fields, both inflate the deps surface. C was self-contained. Slices 6 candidates: A and B carried forward. |

### Hazard surfaced + reconciled mid-dispatch

Three Tier-A agents committed to the same working tree in parallel. T410's reconciliation logic (`git reset --soft HEAD~1` + `git restore --staged .`) inadvertently dropped the T425 commit — its diff persisted in the working tree but the commit object was gone. Coordinator caught the discrepancy via `git log --oneline -5` cross-check against the agents' reported SHAs (T425 reported `26ae01df` but only `217b482` and `d0202a5` were in `git log`). T425 re-committed cleanly at `5064b22`. **Lesson:** when dispatching parallel agents that all touch `git`, coordinator must cross-check each agent's reported SHA against actual `git log` after Tier-A returns — a soft-reset by one agent can erase another's commit even when their file scopes don't overlap.

### Tier-B not dispatched this session

| Charter | Reason |
|---|---|
| `T409` (linux VR baselines) | **BLOCKED — Docker Desktop / WSL2 backend failed to start.** Error `0x800705aa` (Windows: "insufficient system resources to complete the requested service") from `wsl.exe --import-in-place` against `f:\docker\wsl\dockerdesktopwsl\main\ext4.vhdx`. Docker CLI version reported (29.1.3) but daemon couldn't bring up its embedded distro. Agent dispatched but cancelled before any commit. T409 stays open until WSL backend is restored OR until a CI artifact-pull workflow is set up as alternate path. The win32-only gate in `e2e/visual-regression.spec.ts` remains in place. |
| Worktree cleanup `practical-bassi-a8c53d` | Partial — `git worktree prune` cleared the ref, but the empty directory at `.claude/worktrees/practical-bassi-a8c53d/` couldn't be removed (`rmdir: Device or resource busy` — Windows file lock from another process holding the path open). Cosmetic residue only; no git impact. |

### New follow-ups surfaced this session

- **T426 — empty directory leftover at `.claude/worktrees/practical-bassi-a8c53d/`.** Windows file-lock prevented removal. Try again from a clean shell or after Claude Code restart.
- **T427 — alternate path for T409 if Docker Desktop / WSL stays broken.** GitHub Actions `--update-snapshots` workflow with artifact upload + manual download + commit. Avoids the local docker dependency entirely.
- **Slice 6 candidates** (carried from slice 5):
  - **A. Node-map lifecycle** — `nodeMapSystem` + `nodeMapUI` + `nodePromptUI` + `nodeWaveTracker` install/teardown. Estimated ~70-90 LOC drop. Requires consolidating two destruction call sites with divergent error-handling.
  - **B. Run-end shutdown cleanup** — `registerShutdownCleanup` arrow + ~50 try/catch destroy walls. Estimated ~60 LOC drop. Each silenced error path must be preserved one-for-one.

### Open hazards / risks (one-line callouts)

- **WSL2 backend broken on host.** `0x800705aa` from `wsl.exe --import-in-place`. Affects T409 and any other docker-dependent local workflow (e.g. miniflare D1 integration tests run on host node, so unaffected; but any future linux-container test would block). Standing remediation outside the dispatch scope.
- **Per-engine VR thresholds may be over-loose.** Webkit + firefox at MainMenu 15% / Croft 40% absorb GPU variance but would not catch a 10% layout regression. Tighten when each engine has 5+ stable runs of evidence.
- **Slice 6 LOC payoff lower than slice 5's risk-adjusted pick suggests.** Candidate A (node-map) has the highest LOC payoff but the highest extraction risk. Future sessions should weigh whether a Tier-B charter's risk profile is worth the LOC drop or whether GameScene phase 2 should declare itself sufficiently decomposed at sub-3500 LOC.
- **T427 ships the workflow only — T409 closure still requires a manual artifact-pull.** `.github/workflows/regenerate-vr-baselines.yml` (`workflow_dispatch` trigger) regenerates linux baselines on-demand and uploads them as `vr-baselines-linux` (14-day retention). The user must run the workflow, download the artifact, unzip into `e2e/visual-regression.spec.ts-snapshots/`, commit the new `*-linux.png` PNGs explicitly (`git add e2e/visual-regression.spec.ts-snapshots/*-linux.png`), then drop the `process.platform === 'win32'` gate in `e2e/visual-regression.spec.ts` in a follow-up commit. Workflow header docstring documents the full sequence.

### Standing human-gated items (carried forward unchanged from prior session)

- **T203:** real mobile-device evidence per `docs/status/mobile/MOBILE_DEVICE_TEST_MATRIX.md`.
- **Doric / Shetlandic / Burns / Gaelic+Cailleach:** human review per `docs/status/cultural/CULTURAL_REVIEW_PACKET.md`.
- **PEAT:** human PEAT-tool desktop pass over the 25 rows in `docs/status/a11y/A1_PEAT_AUDIT.md`.
- **Cloud save:** auth, privacy policy, deployment flow are product decisions outside the spike (T421-T423).
- **Assist Mode game-speed:** expose vs hide is a product decision (`task_03`).

### Round 4 — additional Tier-A parallel batch (2026-04-28 same session, post-T427)

After T427 landed, recon on user-prompted P2 candidates surfaced two were already shipped:

| Candidate | Status | Evidence |
|---|---|---|
| **P2.12** debug hotkeys gated to DEV / flag | already shipped | `src/scenes/dev/debugHotkeys.ts:5-13` documents the T312 two-stage gate (`import.meta.env.DEV` registration check + per-handler `isDevHotkeysEnabled()` runtime check). Production bundles tree-shake the body. |
| **P2.5** locale change preserves `returnTo` | already shipped | `src/scenes/SettingsScene.ts:1008` (locale cycle) and `:1207` (reset path) both pass `returnTargetData(this.returnTo)` to `scene.start('Settings', …)`. Comment at `:157` documents the preservation contract. |

Two real charters dispatched in parallel with explicit anti-collision briefs (per `feedback_parallel_agent_git_collision` memory: brief each agent to NEVER soft-reset, only `git add <explicit-paths>`).

| Charter | Commit | What landed |
|---|---|---|
| `T401` slice 6 — run-end shutdown extraction | `ddc4704` | `src/scenes/game/runEndShutdown.ts` (511 LOC, Phaser-import-free helper) + `runEndShutdown.test.ts` (702 LOC, 22 cases). GameScene 3439 → 3418 LOC (-21). Dep-shape Option B: `RunEndShutdownDeps` carries 18 typed setter callbacks for the destroy/null pairs (refs are read for `.destroy()`, then nulled via the setter — preserves the per-line destroy/null order one-for-one within the `events.once('shutdown')` listener). Every silenced-catch preserved. Replay determinism byte-identical (7/7). Three throw-and-continue tests pin partial-init safety. Slice 7 candidate: A (node-map lifecycle ~70-90 LOC). |
| `P2.15` strengthen weak `toBeTruthy()` assertions | `5c7a5b8` | 22 `toBeTruthy()` occurrences across 9 vitest files replaced with shape-asserting alternatives: `toMatchObject`, `toBeInstanceOf(Array) + length > 0`, `toMatch(/regex/)`, `typeof === 'string' + length > 0`, `toContain` over canonical literal lists, `not.toBeNull() + tagName/id` for DOM nodes. No production code touched. Strictly tighter assertions — each new check subset-implies the original `toBeTruthy()` for current values but rejects empty-string / wrong-type / malformed-shape regressions. Defensive Phaser-stub-fallback pattern in `Player.runeBag.test.ts` was excluded by charter. |

Parallel dispatch went clean: cross-check of agent-reported SHAs against `git log` confirmed both commits intact, no soft-reset disturbance. The anti-collision briefs (paste-in instruction: "DO NOT soft-reset HEAD~1 if you see unrelated working-tree changes — those belong to the other agent") worked.

Reconciliation gates on master (post-round-4):
- `npm run lint` — clean
- `npm test` — 434 files / 4530 tests passed (was 433 / 4508 — slice 6 added 22)
- `npm run build` — 7.29s; vendor-phaser 374.43 KB gzip (under 390 KB), index 271.25 KB gzip (under 285 KB)
- GameScene LOC ratchet: 3502 (slice 3 baseline) → 3464 (slice 4) → 3439 (slice 5) → 3418 (slice 6). Cumulative drop -84 LOC across 4 slices.

### Round 5 — slice 7 (node-map lifecycle), Tier-B serial

| Charter | Commit | What landed |
|---|---|---|
| `T401` slice 7 — node-map lifecycle extraction | `532a0a7` | `src/scenes/game/nodeMapLifecycle.ts` (193 LOC) + `nodeMapLifecycle.test.ts` (403 LOC, 21 tests). Helper exports `installNodeMap(deps)` + `tearDownNodeMap(deps)`. Both `resetTransientRunState` AND `runEndShutdown.ts` now call `tearDownNodeMap(...)` instead of inlining destroys. Option A: helper provides mechanism only, callers retain error policy — `resetTransientRunState` calls bare so partial-init failures still surface in dev; `runEndShutdown` wraps in try/catch matching its silenced-catch policy. Replay determinism byte-identical 7/7. E2E node-map specs (`w2-moor-road.spec.ts`, `moor-road-nodes.spec.ts`) green 3/3. |

**Honest LOC accounting:** slice 7 grew GameScene by +10 LOC (3418 → 3428). The Option A setter-callback boilerplate (`setNodeMapUI: (ui) => { this.nodeMapUI = ui; }` × 2 fields × 2 call sites) ate the LOC win that the slice 6 follow-up note had projected (~70-90 LOC drop). The slice still delivers value via:
- Cohesive lifecycle contract (install + teardown live together with documented ordering)
- 21-case unit-test coverage of install order, teardown order, scene-reuse double-install, error propagation
- Trigger-listener closure semantics formalized (`onNodeTrigger?` callback, never eager-captures `nodePromptUI`)
- Slice 8 micro-candidate identified by the agent: `interactivePromptIndex` (primitive) could move into a node-map state object alongside `suppressNextNodeMapRoll`, but is below the LOC threshold to justify a slice on its own

**Cumulative LOC ratchet:** 3502 (slice 3) → 3464 (slice 4) → 3439 (slice 5) → 3418 (slice 6) → 3428 (slice 7). Cumulative -74 LOC across 5 slices. Slice 7 reversed -10 LOC; cumulative still strongly positive.

**Slice 7 alternate-shape note for any future revisit:** to claw the LOC back, a refactor could replace the setter callbacks with a structural-type host parameter (`tearDownNodeMap(scene: NodeMapHost)` where the helper mutates `scene.nodeMapUI = null` directly through a structural type). Smaller call sites at the cost of more Phaser-coupling on the helper. Not undertaken in slice 7 because the cohesion contract was already delivered and rework risk outweighed the marginal LOC win.

Reconciliation gates on master (post-round-5):
- `npm run lint` — clean
- `npm test` — 435 files / 4551 tests passed (was 434 / 4530 — slice 7 added 21)
- `npm run build` — 7.98s; vendor-phaser 374.43 KB gzip, index 271.58 KB gzip (both under budget)
- `npx vitest run src/replay/replayDeterminism.test.ts` — 7/7 byte-identical
- E2E node-map specs — `w2-moor-road.spec.ts` + `moor-road-nodes.spec.ts` 3/3 green
