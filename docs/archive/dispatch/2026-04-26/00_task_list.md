# Top 10 Autonomous Task Ledger

**Generated:** 2026-04-26
**Repo:** `C:\Users\aggis\hlooper\wild-haggis-survivors`
**Basis:** project-wide static scan of tracked source, E2E tests, configuration, prior `docs/archive/top-10-2026-04-26-batch/` dispatch log, `docs/superpowers/plans/INDEX.md`, the triple-audit execution plan (`docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md`), research docs, and current hotspot metrics.

**Scan evidence (2026-04-26 dispatch):** ~953 `*.ts` files under `src/`, ~32 under `e2e/`, ~151 Markdown files under `docs/`; `src/scenes/GameScene.ts` was ≈ **3,304** lines at dispatch time (integration hub; prior “~3500” was rounded).

> **Updated 2026-04-26 (later same day):** working-tree truth has moved on. `GameScene.ts` is now **3,521 LOC** after subsequent HUD / pause / run-identity wiring (not regression — extracted helpers landed alongside additions). The implementation-status snapshot for every task is in `docs/dispatch/2026-04-26/Execution_Log.md` under "Post-audit implementation snapshot". Per-task charters under `docs/dispatch/2026-04-26/task_NN.md` each carry a "Status as of 2026-04-26 (post-audit)" header pointing at current artifacts. **Read those before treating the dispatch table below as a to-do list.**

The previous `docs/archive/top-10-2026-04-26-batch/` package was reconciled into `master`. This ledger is a fresh current-state dispatch set, not a replay of the old charters.

## Dispatch Table

| # | Filename | Task | Primary Impact | Expected Agent Shape | Main Write Scope |
|---|---|---|---|---|---|
| 1 | `task_01.md` | GameScene decomposition phase 2 | Lower regression risk in the ~3.3k-line integration hub | Refactor slice, zero behavior change | `src/scenes/GameScene.ts`, `src/scenes/game/*`, focused tests |
| 2 | `task_02.md` | DOM-visible focus accessibility layer | Close the largest remaining accessibility architecture gap for canvas menus | New helper layer plus one critical menu adoption | `src/ui/*`, selected scenes, E2E/tests |
| 3 | `task_03.md` | Assist Mode runtime wiring and unhide decision | Turn scaffolded accessibility settings into real gameplay effects or keep them safely hidden | Gameplay integration slice | `src/systems/accessibility/*`, `src/scenes/SettingsScene.ts`, `src/entities/Player.ts`, `src/systems/JuiceSystem.ts`, tests |
| 4 | `task_04.md` | First-run drift micro-practice | Teach the signature control feel before players mistake drift for broken input | FTUE gameplay/tutorial slice | `src/systems/TutorialSystem.ts`, `src/scenes/game/*`, `src/core/SaveManager.ts` or save helpers, tests/E2E |
| 5 | `task_05.md` | Mobile hardware readiness and touch affordance pass | Reduce remaining mobile risk before human T203 device testing | E2E plus UI affordance/documentation slice | `e2e/*mobile*`, `src/ui/*`, `docs/status/mobile/MOBILE_*` |
| 6 | `task_06.md` | Cultural review gating and reviewer packet | Prevent unreviewed Doric, Shetlandic, Gaelic, or Burns-sensitive copy from shipping unnoticed | Data audit and release gate | `docs/status/cultural/CULTURAL_*`, `docs/status/cultural/*REVIEW*`, selected data tests |
| 7 | `task_07.md` | Photosensitivity and PEAT capture harness | Turn human PEAT work into a repeatable capture and risk-prep pipeline | Script/E2E/docs slice | `e2e/*`, `scripts/*`, `docs/status/a11y/A1_*`, `src/core/a11yMotion.ts` if needed |
| 8 | `task_08.md` | Cloud save backend spike and local integration seam | Move P3 from pure client contracts toward a concrete backend path | Backend scaffold or emulator plus contract tests | `src/cloud/*`, `docs/adr/0006*`, optional `cloudflare/` or `server/` scaffold |
| 9 | `task_09.md` | Visual regression and bundle budget gate | Make layout and load regressions visible in CI-friendly output | QA harness and budget doc | `e2e/visual-regression.spec.ts`, `vite.config.ts`, `scripts/*`, docs |
| 10 | `task_10.md` | Current-run identity and clarity panel | Help players parse variants, curses, routes, relics, runes, and act state | UI clarity slice | `src/scenes/game/PauseMenu.ts`, `src/ui/HUD.ts`, `src/scenes/GameOverScene.ts`, i18n/tests |

## Recommended pickup order

The dispatch table treats all 10 as parallel work. In practice they're not equal. **If you can only pick one task this session, use this guide.** Estimates assume a focused agent with full context.

| Time budget | Pick | Why |
|---|---|---|
| **~1 hr (atomic, low-risk)** | [task_09](task_09.md) | Bundle-budget script + baselines already exist (`scripts/check-bundle-budget.mjs`). Wiring it into `npm run ci` / `ci:all` is a small, contained edit with clear verification. |
| **~2–3 hr (player-facing)** | [task_04](task_04.md) | Drift micro-practice mostly shipped. Remaining: touch-primary skip path + minor unit-test gaps on the timeout/complete tick path. Touch-only edits, well-bounded. |
| **~2–3 hr (player-facing)** | [task_10](task_10.md) | Pause-menu run identity already emits variant + runes. Remaining: GameOver / Chronicle parity for routes/relics/act/runes/variant on the run-summary card. Pure helper + i18n. |
| **~half-day (architecture)** | [task_01](task_01.md) | GameScene decomposition phase 2 — extract ONE more domain slice (next candidates: node-map lifecycle, run-start ceremony, replay bridge). Behavior-preserving, test-covered. Largest engineering ROI. |
| **~half-day (a11y depth)** | [task_02](task_02.md) | DOM focus layer next adoption: `CurseScene` is the natural follow-up after `GameOverScene`. Helper exists, pattern is proven. |
| **~half-day (a11y / replay)** | [task_03](task_03.md) | Assist Mode timing-help + invincibility wired. Open: replay determinism with `assistModeGameSpeed`, decision on whether to expose game-speed at all. Touches replay blob — review carefully. |
| **~full-day (infra spike)** | [task_08](task_08.md) | HTTP client + integration test exist; spike work is a Cloudflare Worker + D1 scaffold with local mock for `httpCloudSaveClient` integration. Auth + privacy still product-decision-gated. |
| **~full-day (a11y harness)** | [task_07](task_07.md) | Reduce-flashing OFF/ON spec landed; extending the harness to capture standardized OBS-style clips or static flash budgets is the next slice. PEAT itself stays human-gated. |
| **Human-gated (agents prep packets, can't close)** | [task_05](task_05.md), [task_06](task_06.md) | T203 mobile real-device pass requires hardware. Cultural review requires named native speakers / Burns scholar. Agents make the gates precise + repeatable but cannot sign off. |

### Quick reasoning

- **task_09 first** if you want a fast, safe, visible win that hardens release discipline.
- **task_01 first** if you have time for one big slice — it unblocks every future slice and the largest hotspot stays the largest hotspot until something extracts.
- **task_04 / task_10 first** if the priority is player-facing polish over engineering debt.
- **Skip task_05 / task_06** unless you can produce real human review evidence — the docs/code already make these gates explicit and CI-enforced.

**Don't run two flagships in parallel.** Pick one, ship it, verify, then pick the next.

## Selection Rationale

The top complexity and impact clusters are no longer the same as the previous top-10 dispatch. Runes are now live, the old accessibility and mobile slices landed, and several P0 trust issues were closed. The remaining hard work is dominated by:

- **Architecture:** `src/scenes/GameScene.ts` remains the largest integration risk at about 3.3k lines, even after prior extraction work (`updateRunHudFrame` and related extractions documented in `docs/status/engine/SCENE_REFACTOR_GAP_AUDIT.md`).
- **Accessibility depth:** photosensitivity, remapping, captions, colorblind modes, and partial Assist infrastructure exist, but DOM-visible focus and full Assist runtime behavior remain unfinished.
- **New-player clarity:** the codebase now has rich systems, but first-session teaching and current-run explanation lag behind the feature count.
- **Human-gated quality:** mobile real-device testing, cultural review, and PEAT cannot be fully automated, but agents can make those gates precise, repeatable, and hard to ignore.
- **Infra future:** cloud saves exist as client contracts and ADR drafts, not a real backend flow.
- **Release discipline:** visual regression and bundle gates are partially present but not yet enforceable enough to catch regressions early.

## Future Considerations

### Architectural Debt

- `GameScene.ts`, locale tables, save migration code, `GameOverScene`, `SettingsScene`, `HUD`, `JuiceSystem`, `WeaponSystem`, and `SpawnSystem` are the dominant line-count hotspots. Keep future work in pure helpers and domain modules wherever possible.
- Scene reuse remains a load-bearing Phaser 4 gotcha. Every new transient field in a Scene needs an explicit create/reset/shutdown story and a test when feasible.
- The project now has several cross-run and per-run state bags: saves, active runs, run modifiers, relics, runes, temp buffs, replay metadata, route state, and node outcomes. Future persistence work should prefer a single documented owner per state field.
- The i18n source files are very large. Future content additions should consider generated or segmented locale modules if authoring speed or review noise becomes painful.
- Tests are numerous and valuable, but some high-level promises still need E2E or integration coverage: first-run teaching, full controller-only flows, touch UI interactions, and replay/history invariants after new features.

### Networking and Infrastructure

- The game is still offline-first. Cloud save work must preserve local play as the default and should not make startup or saves depend on a network round trip.
- P3 cloud saves currently have envelope/conflict/client contracts and a draft Cloudflare Workers + D1 recommendation, but no production backend, auth, privacy policy, or deployment flow.
- Server-backed daily challenges, leaderboards, or telemetry should not be slipped in as part of cloud saves. They are separate product decisions with privacy and anti-cheat implications.
- Build artifacts, `node_modules/`, `dist/`, and secrets must stay uncommitted. Any backend scaffold should keep `.env*` examples safe and ignored.

### Future Planning Observations

- The strongest immediate player-facing ROI is likely first-run clarity plus run identity surfacing, not adding more content.
- The strongest engineering ROI is continued `GameScene` thinning, but only in behavior-preserving slices with tests.
- Human gates should be tracked as release criteria, not hidden in blocked notes: T203 mobile hardware, Doric/Shetlandic review, Burns review, Gaelic fragment review, PEAT, disability consultant review, and blind playtest.
- Major future flagships still worth preserving in the roadmap are W95 mobile-native posture, P3 cloud saves, deeper accessibility, and any eventual content-pack cadence. Run one flagship at a time.

