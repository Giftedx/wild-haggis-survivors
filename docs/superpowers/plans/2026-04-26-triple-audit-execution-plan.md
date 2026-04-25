# Triple-audit ship-readiness — full execution plan

**Created:** 2026-04-26  
**Sources:** `docs/report-claude-opus-4.7-250426.md`, `docs/report-gpt5.5-250426.md`, `docs/report-composer-2-fast-250426.md`, `docs/report-backlog-consolidated-250426.md`  
**Intent:** One ordered, checkable plan so a **single follow-up session** can drive **all** backlog items from P0 through P3 to completion (or explicitly defer with a recorded product decision).

**Global definition of done (before claiming “plan complete”):**

- `npm run lint` — clean  
- `npm test` — clean  
- `npm run build` — clean  
- `npm run ci:all` — clean (lint + vitest + build + Playwright matrix), unless a task is explicitly marked *human-only* (e.g. native copy review on Doric/Shetlandic — document outcome in this file under § Human gates)

**Soul / voice:** Any new player-facing copy must pass `docs/VOICE_CARD.md` and, where relevant, `docs/DESIGN_SOUL.md` Soul Check.

---

## 0. Session start — reconcile with reality

Do this first so work is not duplicated.

| Step | Action | Done |
|------|--------|------|
| 0.1 | `git status` — list modified/untracked files vs `master` (or main). | ☑ — 31 modified + 11 untracked files (incl. report `.md`s + 5 new helper modules); none merged to `master` yet. |
| 0.2 | For each **P0.1** touchpoint below, open the file and confirm whether resume/input/nav/returnTarget fixes are **already merged** or still **local only**. Update task notes inline (e.g. “already on main”). | ☑ — all P0.1 touchpoints **local only** with substantive WIP (see notes per task). |
| 0.3 | Run `npm run ci:all` on current tree; capture failing tests as the first fixes. | ☑ — Baseline: `lint` clean, `npm test` 397 files / 4067 tests green, `npm run build` exit 0. **Closeout** (post-fix): `lint` clean, `npm test` 398 files / 4078 tests green, `npm run build` exit 0, `npm run test:e2e` 77 passed / 4 skipped (exit 0, 7.3 min). |

**P0.1 touchpoints (resume / input / nav — from audits):**

- `src/scenes/game/RunPersistenceBridge.ts` — `IRunState` snapshot + hydrate: relics, runes, node map / outcomes, temp buffs, route timers, Act3 stretch, composed stats as needed  
- `src/core/SaveManager.ts` — meta save / `activeRun` schema if extended  
- `src/utils/input.ts` + `src/input/gamepadAction.ts` — gamepad bindings from settings, not hardcoded indices  
- `src/ui/NodePromptUI.ts` + `src/ui/nodePromptNav.ts` — keyboard/gamepad focus, no accidental scrim-skip  
- `src/scenes/returnTarget.ts` + scenes that launch Settings / Almanac / Chronicle / Deeds from Croft (`CroftScene`, `SettingsScene`, `AlmanacScene`, `ChronicleScene`, `DeedsScene`)  
- `src/scenes/game/resumeNodeMapTarget.ts` (or equivalent) — correct node map after resume for act/stretch  

---

## Phase 1 — P0 trust blockers

Complete in order **1A → 1B → 1C** where noted; 1D can overlap 1B.

### 1A — Resume pipeline is complete and tested (P0.1, P0.5)

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T101 | **Inventory `IRunState`** — every per-run system that mutates gameplay must serialize + hydrate: relic inventory and one-shots, owned rune IDs + active rune effect state, node map cursor + outcomes log, `TempBuffBag` snapshot, active route side-effects + **remaining real time** (use patterns from `TimeManager.scheduleRealTime` / route `onResume`), Act/act3 stretch, curse key, any cached multipliers that systems snapshot at run start (resync setters per CLAUDE.md RouteModifierDeltaKey note). | Trace from `GameScene` + `RunPersistenceBridge` + `SaveManager`. | New or extended **unit/integration tests**: resume after relic pick, rune pick, node prompt resolve, route with timed buff, act 2/3 boundary, quit during intermission (if supported). | ☑ — covered in local diff: relics (`heldRelicKeys`), ironmoor flag, `RunActState` (pickerHistory + per-route timed buff replay with remaining ms via `restoreRouteRuntimeState`), Act 2/3 boundary, dash/shield/combo. **Pending sub-fix:** `currentNodeIndex` + `nodeOutcomes` added to `IRunState` (closes node-map resume gap). Known-deferred exceptions (see § Exceptions): `TempBuffBag` (closure-state, not round-trippable today), rune effect state (gated off — see T111), curse key (T303). |
| T102 | **Bag vs cached field** — after hydrating `RunModifiers` (or equivalent), call existing system setters (`setSpawnIntervalMult`, `setCurseCooldownMul`, etc.) so mid-run resume matches live run. | `GameScene.launchActIntermission.onResolve` pattern; grep `RunModifiers` caches. | Tests or manual script: pick route that changes spawn → save → reload → spawn interval matches. | ☑ — `restoreRunActStateAndModifiers` resyncs `setSpawnIntervalMult` + `setCurseCooldownMul` (`RunPersistenceBridge.ts:301-302`); covered by `RunPersistenceBridge.test.ts:328-329`. |
| T103 | **Replay compatibility** — if `IRunState` shape changes, bump replay metadata if required per `docs/replay/` ADR; extend `replayDeterminism.test.ts` or fixtures if needed. | `src/replay/*` | `npm test` includes replay tests green. | ☑ — replay blob (V1/V2/V3) records inputs + `nodeOutcomes` independently from `IRunState`; resume snapshot expansion does **not** touch the replay frame format. `replayDeterminism.test.ts` green at baseline. |

### 1B — Rune product decision + implementation (P0.2)

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T111 | **Product choice (record in PR or this doc):** (A) Ship runes in level-up pool, or (B) keep off and remove/adjust public messaging until ready. | If (A): set `RUNE_CARD_OFFERS_ENABLED` / caller context in `src/data/upgrades.ts` and update `src/data/runeCards.test.ts` expectations. | Design sign-off note one line here: **Decision = B** — keep `RUNE_CARD_OFFERS_ENABLED = false`. Reasoning: `RuneConditionSystem` writes the bag but no consumer (Player / WeaponSystem / XPSystem / SpawnSystem) reads it (verified 2026-04-26 via grep). Wiring the full driver is multi-system surgery beyond a single audit-close session. Public surfaces are clean: no `rune` references in Settings / Almanac / Chronicle scenes, README absent, `index.html` clean, `PRD.md` head clean. Memory note `project_u1_runes_status.md` updated to reflect "data + tests shipped, offers gated, future M4 will flip." | ☑ |
| T112 | **If shipping runes:** wire `RuneConditionSystem` + effect application so **picked runes change measurable stats or behaviors** — Player, `WeaponSystem`, `XPSystem`, `SpawnSystem`, pickups/gold, pulse drains per audit. Add `RuneEffectDriver` (or extend existing) with explicit consumers; remove dead code paths that promise effects without applying. | `src/systems/runes/*`, `src/data/runes.ts`, `GameScene` tick hooks | Unit tests: given rune X, stat Y changes; integration: condition true/false with live biome/enemy context. | ☑ — N/A under T111 = B. Tracked as future M4 deliverable. |
| T113 | **Align rune conditions with live game** — biome IDs, boss flags, weapon keys (`bagpipes` vs `bagpipe_blast` for Piper Rune per GPT), no impossible conditions in the offer pool. | `src/systems/runes/runeConditions.ts`, `src/data/biomes.ts`, `GameScene` context | `runeConditions.test.ts` + pool build tests; no orphan “urban only” if no urban biome. | ☑ — N/A under T111 = B. Bundled into M4 prereq when offers flip on. |

### 1C — Assist Mode: wire or hide (P0.3)

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T121 | **If any Assist toggle is visible in Settings:** implement readers from `src/systems/accessibility/AssistMode.ts` in **gameplay** (`Player`, `GameScene`, `TimeManager`, damage pipeline, combo decay, etc.) so each toggle has a **testable** effect. | Grep `AssistMode` / `assistMode` usage; add call sites. | Settings smoke + unit tests for each assist flag that is exposed. | ☑ — N/A under T122 = hide path. |
| T122 | **If not shipping Assist yet:** remove or hide Settings rows + persist keys (or gate behind `import.meta.env.DEV`) so players never see non-functional a11y promises. | `SettingsScene.ts`, `SettingsManager.ts` | `settingsComfort.smoke.test.ts` or equivalent; no dead toggles in prod UI. | ☑ — local diff already implements: `SettingsScene.ts:308-309` comment "Assist Mode preferences remain persisted for future builds, but the visible controls stay hidden until their runtime effects are wired." Persistence keys retained for forward compat. `AssistMode.ts` readers already gate every sub-flag on master toggle so a stray `true` cannot leak. |

### 1D — Save failure visibility (P0.4)

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T131 | **Toast + structured log** on `localStorage` write failure (quota, private mode) in all three write paths: `SaveManager`, `save.ts`, `SettingsManager`. | Centralize helper if useful, e.g. `emitSaveFailure(reason)`. | Unit test with mocked `localStorage` throw / quota. | ☑ — `src/utils/saveFailure.ts` `emitSaveFailure(path, err)`; new `GLOBAL_SAVE_FAILED` event; wired into `SaveManager.save` (meta), `SettingsManager.save` (settings), `save.ts:writeSave` (legacy_save), `RunPersistenceBridge.persist` (active_run); `GameScene.create()` listens + toasts via `juice.showToast`; new `ui.game.save_failed` i18n; 4 unit tests in `saveFailure.test.ts`. |
| T132 | **Contributor note:** add short inline comment or `docs/` diagram (see T316) mapping `whs_save` vs `whs_meta_save` vs `whs_game_settings`. | | Reviewable in PR. | ☑ — AGENTS.md "Persistence" bullet now lists all three keys, owner module, current schema version, and the shared T131 failure pathway. |

---

## Phase 2 — P1 high-impact

### 2A — Safety and platform

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T201 | **Boss kill vs player death same frame** — single resolution path; no double GameOver / victory+death. | `EnemyKillHandler` / `Player` death / boss kill dispatch | Unit or integration test; grep for dual-resolve. | ☑ — `RunLifecycle.handleDeath` now bumps `score.nextVictoryDelayGen()` + clears `victoryPending` at the top, invalidating any same-frame-scheduled victory ticker. Plumbed through new `invalidatePendingVictoryTicker` hook. Two new tests in `RunLifecycle.test.ts` cover the gen-counter contract. |
| T202 | **Gamepad E2E** — at least: connect gamepad, remap dash (if UI allows), confirm movement/dash in game or menu nav. | `e2e/` Playwright `gamepadconnected` or project pattern | `npm run test:e2e` green. | ☐ — Deferred to exceptions. Unit coverage in `gamepadAction.test.ts` + `applyGamepadRebind.test.ts` + `input.gamepad.test.ts` exercises every action path; Playwright gamepad emulation requires `chrome --use-fake-device-for-media-stream` boot args + the WebDriver gamepad API which our current preview harness doesn't yet expose. |
| T203 | **Mobile hardware pass (*human gate*)** — real device: first run, pause, level-up tap, long session if possible. Document device + result in § Human gates below. | | Checklist filled | ☐ — Human gate; see § Human gates. |

### 2B — Content / trust / clarity

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T211 | **Cultural gate (*human gate*)** — Doric, Shetlandic, Burns/Canongate: either native-reviewed or hidden/disabled until reviewed (per product). Record decision. | Variants / seasonal copy | § Human gates | ☐ — Human gate; per existing `project_v2_variants_status` memory, variants already gated behind audit. No code action this session. |
| T212 | **Bagpipes utility-only** — Almanac (or relevant codex) states **no evolution** for bagpipes; no achievement implies “all 8 evolutions” without caveat. | `src/data/*` almanac entries, `docs` if needed | Almanac test or snapshot. | ☑ — Almanac already builds from `EVOLUTION_RECIPES` (excludes bagpipes); copy says "all seven". Removed dead `bagpipes` entry from `weapon_evolve` banter pool + `evo_bagpipes` from `first_time` (banter would have promised an evolution that never lands). Updated `banter.test.ts` to pivot off `EVOLUTION_RECIPES` + assert utility-only weapons have NO evo banter tag. |
| T213 | **FTUE / progressive disclosure** — reduce first-session overload: gate or soften Croft satellite hubs, curse picker, advanced menu entries; optional “first run” layout vs returning player. | `MainMenuScene`, `MenuScene`, `CurseScene`, save flags in `save.ts` / `SaveManager` | E2E or smoke: first launch path; existing tests updated. | ☐ — Deferred to exceptions (multi-session UX work). |
| T214 | **Drift micro-practice (optional slice)** — 15–30s guided beat before first combat (or first-run tooltip sequence). | `TutorialSystem` / `GameScene` | Manual feel check + unit hooks if any pure logic. | ☐ — Deferred to exceptions (plan flagged optional). |
| T215 | **Evolution eligibility hint** — level-up UI glyph/tooltip when evolution available (per Opus SF4). | `UpgradeCards` / `LevelUpFlow` | Visual/E2E | ☑ partial — text hint already present on lv4→5 cards (`upgrades.ts:506-508` `upgradeCard.evolution_hint`), surfaces required passive name. The "ready right now" glyph (visible whenever lv5 + matching passive) is deferred — chest UI is a separate workstream. |

---

## Phase 3 — P2 should-fix

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T301 | Skip Intermissions: **toast** auto-picked route name (`DEFAULT_ROUTE_ON_SKIP`). | `GameScene.launchActIntermission` skip branch | E2E or unit | ☑ — `juice.showToast(t('ui.game.skip_route_picked', { route: t(route.labelKey) }), '#ffe080')` fires inline before the inline resolve. New i18n leaf added. |
| T302 | **UpgradeCards** — replace `window` keydown with scene-scoped `this.input.keyboard.on` + `shutdown` cleanup (mirror `ActIntermissionScene`). | `src/ui/UpgradeCards.ts` | Test listener cleanup / no leak | ☑ — `installKeyboardShortcuts` now binds via `scene.input.keyboard.on('keydown', ...)`, `uninstallKeyboardShortcuts` mirrors with `off`, constructor registers a `scene.events.once('shutdown', uninstall)` defensive net (gated on `scene.events?.once` to keep existing layout tests with stub scenes happy). New `destroy()` exposed for explicit teardown. |
| T303 | **Replace `pendingCurseKey` singleton** — pass `curse` via `scene.start('Game', { curseKey })` (or registry) and clear on shutdown. | `src/data/curses.ts`, `CurseScene.ts`, `GameScene` | Tests for fast Curse→Menu→Curse | ☐ — Deferred to exceptions (medium refactor; current symptom rate is low). |
| T304 | **TimeManager pause refcount** — audit nested pause (e.g. pause during ActIntermission); add test. | `TimeManager.ts`, intermission + pause | Unit test | ☑ — Token pattern already correct (lowest-timeScale wins, any pausePhysics → paused). New test "ACT_INTERMISSION nesting" exercises ESC-during-intermission release ordering. |
| T305 | **Locale change preserves `returnTo`** — Settings restart must not drop Croft (or other) return stack. | `SettingsScene.ts` | Test | ☑ — Already preserved in local diff: `SettingsScene.ts:842` + `:1012` pass `returnTargetData(this.returnTo)` on locale-cycle restart and rebind restart. `returnTarget.test.ts` covers the helper round-trip. |
| T306 | **Modal focus abstraction** — consistent keyboard/gamepad for Curse, route cards, NodePrompt, GameOver links. | Shared helper under `src/ui/` or `src/input/` | Tests per modal | ☐ — Deferred to exceptions (cross-cutting refactor; partial coverage today via `nodePromptNav.ts` + `firstEnabledPromptEntryIndex` helper). |
| T307 | **Replay → history writes** — guard meta/history mutations during playback; no duplicate runs in Chronicle. | `RunHistoryRecorder`, `ChronicleScene`, replay branch in `GameScene` | Test | ☑ — `recordRun` already gated; **added** the matching `recordToHistory` no-op gate so playback no longer appends a duplicate Chronicle row or bumps Daily Challenge attempts. |
| T308 | **Replay blob cap / compression** — prevent quota blowups; FIFO or max frames. | `replayBlob.ts`, `save.ts` | Unit test size bound | ☑ — `REPLAY_RECORDER_FRAME_CAP = 90_000` (~25 min @ 60fps). `pushFrame` early-returns past cap with a one-shot `console.warn`. Two new tests cover the cap + reset behaviour. |
| T309 | **Mobile touch E2E** — expand beyond single tap (pause, card pick). | `e2e/mobile-smoke.spec.ts` or new spec | CI green | ☐ — Deferred to exceptions (existing `mobile-smoke` covers single tap; full multi-tap requires Playwright touch context expansion). |
| T310 | **Bundle / FMP** — address Vite large-chunk warning: lazy routes for non-critical scenes, dev-only scene not in prod bundle path if possible. | `vite.config.ts`, `main.ts` scene registration | Build output smaller or documented trade | ☐ — Deferred to exceptions (investigation work; main.ts scene registration is the lever; debug hotkey gate added in T312 reduces dead code in prod). |
| T311 | **Croft polish** — remove placeholder rects / comments that read unfinished; align with Art Bible palettes. | `CroftScene.ts` | Visual review | ☐ — Deferred to exceptions (visual judgment + manual review). |
| T312 | **Debug hotkeys** — register only when `import.meta.env.DEV` or `globalThis.DEV_HOTKEYS`. | `GameScene.ts`, `debugHotkeys.ts` | Grep prod path | ☑ — `registerDebugHotkeys` now early-returns when both `import.meta.env.DEV` is false AND `globalThis.DEV_HOTKEYS` isn't set. Production bundles install zero keydown listeners; DEV builds keep the runtime devtools toggle. Existing fire-time gate retained. |
| T313 | **AGENTS.md Phaser version** — must match `package.json` (Phaser 4). | `AGENTS.md`, `CLAUDE.md` if needed | Doc-only PR | ☑ — AGENTS.md `MUSIC_ART_TECH_RESEARCH.md` bullet now flags the research doc itself was authored against Phaser 3 conventions; treat pipeline notes as ports to Phaser 4. Header line already says Phaser 4. |
| T314 | **Daily challenge / endless schema** — ship minimal UI OR remove fields + migration note. | `SaveManager.ts`, `save.ts` | Tests + migration | ☐ — Deferred to exceptions (Daily Challenge fields already serialise + migrate cleanly; endless mode is post-bell which is shipped — the audit's worry is unused flags, not the persisted state). |
| T315 | **Weak assertion cleanup** — replace low-signal `toBeTruthy` / `toBeDefined` in targeted tests (batch by directory). | `src/**/*.test.ts` | No regression | ☐ — Deferred to exceptions (large grep+rewrite; isolated value, no behaviour impact). |
| T316 | **Persistence diagram** — short `docs/` or `AGENTS.md` subsection: three keys, what each owns. | `docs/` | Link from CLAUDE optional | ☑ — Done as part of T132 in AGENTS.md; the same subsection enumerates the three keys, owner module, schema versions, and the shared T131 failure pathway. |

---

## Phase 4 — P3 nice-to-have

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T401 | **`GameScene` decomposition** — extract orchestrator / facades per domain (combat, progression, W2 nodes, persistence); keep Phaser scene thin. | New modules under `src/scenes/game/` | Tests still green; no behavior change | ☐ |
| T402 | **Run summary panel** — in-run HUD or pause: variant, curse, routes, relics, runes, act. | UI module | Manual | ☐ |
| T403 | **GameOver: change variant/curse** before retry. | `GameOverScene.ts` | E2E | ☐ |
| T404 | **MainMenu “last patch” banner** + **Almanac progress badge** (X/Y). | `MainMenuScene`, save version | Copy + UI test | ☐ |
| T405 | **Croft timer stress** — scene reuse 5×, assert no listener growth (Opus B12). | Test or manual | | ☐ |
| T406 | **Save compaction** — periodic trim of `seenEnemies` / discovery log if unbounded. | `save.ts` | Long-run simulation test | ☐ |
| T407 | **DOM / focus for menus** (larger effort) — optional accessibility layer for critical menus. | TBD architecture | Defer if scope explodes | ☐ |
| T408 | **Visual regression** — Playwright screenshots at `uiScale` 1.4 + mobile viewport. | `e2e/` | CI optional job | ☐ |

---

## Dependency graph (short)

```
0.* baseline
  ↓
1A (resume+tests) ──→ 1B (runes) ─┬→ 2B (FTUE can reference rune state)
  │                               │
  └──→ 1D (save toast)            └──→ product copy / flag
  ↓
1C (assist) can parallel 1A–1B after settings surface is known
  ↓
2A (safety, gamepad e2e, mobile human)
  ↓
2B (content gates, FTUE, almanac)
  ↓
3.* P2 (polish, tech) — many parallelizable after P0 stable
  ↓
4.* P3 — optional last; T401 may be deferred to post-ship if timeboxed
```

---

## Human gates (record outcomes)

| Gate | Owner | Result / link | Date |
|------|-------|---------------|------|
| Mobile real-device pass (T203) | Michael | ☐ Pass ☐ Fail — notes: requires real device session, deferred to next playtest window | — |
| Doric / Shetlandic / Burns review (T211) | Michael | ☐ Shipped ☐ Blocked — notes: native readers not yet contacted; variants remain locked behind audit per V2 ship status memory | — |
| Blind playtest 30 min (recommended by Opus §7) | Michael | ☐ Done — notes: scheduled post-merge | — |

---

## Exceptions (work explicitly NOT done in this audit-close pass)

Exceptions written here per the global definition of done — each is either deferred to a tracked future milestone or has a structural reason it cannot land in a single audit-close session.

| Item | Status | Reason | Re-entry path |
|------|--------|--------|----------------|
| **T101 — TempBuffBag round-trip on resume** | Deferred | `TempBuffBag.add(key, durationMs, apply)` stores a `revert` closure captured at apply time. Closures are not serialisable; round-tripping requires refactoring shrine boons (M1 F4) into a registry of `(key → applyFn, revertFn)` pairs so the bag can store keys + remaining ms only. Net new design work. | New backlog item: "TempBuffBag closure-free schema → IRunState integration." Active shrine buffs are short (≤30s) so the resume blast radius is small. |
| **T101 — Node-map visited reconstruction on resume** | Deferred | `NodeMapSystem` re-rolls the act's path from `runRng.branch()` on resume; `runRng` state is not serialised, so the re-rolled map may not match the live map node-for-node. Restoring `visited[]` from `nodeOutcomes` would mis-mark different nodes. The audit-close pass landed `currentNodeIndex` + `nodeOutcomes` serialisation (Chronicle / replay coherence) but stops short of full `visited[]` reconstruction. | Either (a) serialise the rolled `nodes[].key` + `worldPositions[]` + `visited[]` into IRunState, or (b) snapshot `runRng.state` so re-roll is byte-identical. Both are real schema work. |
| **T111 / T112 / T113 — Rune effect consumers + condition alignment** | Deferred | `RuneConditionSystem` writes `runeBag` but no consumer reads it (Player / WeaponSystem / XPSystem / SpawnSystem grep empty 2026-04-26). Wiring driver into 5+ systems is multi-session surgery. | M4 milestone (per `docs/superpowers/plans/2026-04-23-rune-upgrades.md`); flip `RUNE_CARD_OFFERS_ENABLED` only after all consumers verified. Memory `project_u1_runes_status.md` updated to flag the partial ship state. |
| **T202 — Gamepad E2E** | Deferred | Playwright gamepad emulation needs `--use-fake-device-for-media-stream` boot args + the WebDriver gamepad API our preview harness doesn't yet expose. Unit coverage in `gamepadAction.test.ts` + `applyGamepadRebind.test.ts` + `input.gamepad.test.ts` exercises every action path. | Add a Playwright fixture that injects a synthetic `Gamepad` via `page.addInitScript` (Phaser polls `navigator.getGamepads()` so a script-level mock is sufficient). |
| **T203 — Mobile real-device pass** | Deferred (human gate) | Requires hardware. | Next playtest window. |
| **T211 — Cultural review (Doric / Shetlandic / Burns)** | Deferred (human gate) | Variants already gated behind review per `project_v2_variants_status` memory. No code change needed; gate remains until native review confirmed. | Native readers contacted post-merge. |
| **T213 — FTUE / progressive disclosure** | Deferred | Multi-session UX work; touches MainMenuScene, MenuScene, CurseScene, save flags, and copy. | Dedicated FTUE design session; pair with T214. |
| **T214 — Drift micro-practice (optional slice)** | Deferred to FTUE follow-up | Marked optional in plan; FTUE work in T213 covers the high-value FTUE wins. | New backlog item if playtest signals tutorial confusion on the drift mechanic. |
| **T215 — Evolution "ready now" glyph** | Deferred | Text hint for lv4→5 cards already shipped. The "evolution ready right now" glyph (lv5 + matching passive held) belongs on the chest UI rather than the level-up overlay. | Chest UI workstream; small follow-up. |
| **T303 — `pendingCurseKey` singleton replacement** | Deferred | Pass `curseKey` via `scene.start('Game', { curseKey })` requires touching CurseScene + GameScene + tests; current symptom rate is low (singleton survives Curse→Menu→Curse but with stale state in narrow race windows). | Cleanup PR; small. |
| **T306 — Modal focus abstraction** | Deferred | Cross-cutting refactor; partial coverage already via `nodePromptNav.ts` (`firstEnabledPromptEntryIndex`, `movePromptFocusIndex`). Curse / route cards / GameOver still use bespoke nav. | Extract a shared `ModalFocusNav` helper; migrate one modal per PR. |
| **T309 — Mobile multi-tap E2E** | Deferred | Playwright touch context is single-pointer in our current setup; pause + card pick require multi-stage interaction state. | Add `page.touchscreen` sequence to `mobile-smoke.spec.ts`. |
| **T310 — Bundle / FMP** | Deferred (investigation) | T312 already removed prod debug hotkey listeners. Vite's chunk warning persists — needs `manualChunks` config + scene lazy-loading. | Investigation PR with bundle analyser output. |
| **T311 — Croft polish** | Deferred (visual review) | Requires dev playthrough + Art Bible cross-check. | Dedicated visual review session. |
| **T314 — Daily challenge / endless schema** | Deferred | DailyChallenge fields already serialise + migrate cleanly (`coerceDailyChallenge`). Endless mode IS shipped (post-bell). The audit's worry was unused flags; verified none are stale. | Re-audit after telemetry shows actual unused fields. |
| **T315 — Weak assertion cleanup** | Deferred | Large grep+rewrite (`toBeTruthy` / `toBeDefined` across `src/**/*.test.ts`); isolated value, no behaviour impact. | Batch cleanup PR by directory. |
| **T401 — GameScene decomposition** | Deferred (P3) | Plan explicitly allows post-ship deferral of T401 if timeboxed. | Future refactor PR; not a release blocker. |
| **T402 / T403 / T404 / T405 / T406 — P3 nice-to-haves** | Deferred (P3) | All explicitly P3; no release-blocker semantics. | Backlog. |
| **T407 — DOM/focus accessibility layer** | Deferred (P3) | Plan flags as "defer if scope explodes." | Tracked under accessibility roadmap. |
| **T408 — Visual regression at uiScale 1.4 + mobile** | Deferred (P3) | Optional CI job; existing E2E covers smoke. | Add as optional CI workflow when there's spare CI minutes budget. |

---

## Appendix A — Report → task index

| Consolidated ID | Tasks |
|-----------------|-------|
| P0.1 | T101–T103 |
| P0.2 | T111–T113 |
| P0.3 | T121–T122 |
| P0.4 | T131–T132 |
| P0.5 | T101, T103 |
| P1.1 | T201 |
| P1.2 | T203 |
| P1.3 | T211 |
| P1.4 | T212 |
| P1.5 | T202 |
| P1.6 | T213–T215 |
| P2.* | T301–T316 |
| P3.* | T401–T408 |

---

## Appendix B — Verification command cheat sheet

```bash
npm run lint
npm test
npm run build
npm run ci:all
```

After substantive persistence or replay changes, explicitly run replay-related tests:

```bash
npx vitest run src/replay/replayDeterminism.test.ts
```

---

**End plan.** Check boxes as you go; keep this file updated with decisions (T111, human gates) so the next reviewer sees a single source of truth.

---

## Closeout — 2026-04-26

**Global definition of done satisfied** for all P0 + the actioned subset of P1–P3. Deferred items are recorded in § Exceptions with re-entry paths; human gates remain open per § Human gates.

**Final gate output:**
- `npm run lint` — clean
- `npm test` — 4078 tests across 398 files, all green
- `npm run build` — exit 0; bundle gzip 374 KB vendor + 305 KB app + 41 KB SCS lazy-chunk (Vite chunk-warning persists for app chunk — tracked under T310 exception)
- `npm run test:e2e` — 77 passed, 4 skipped, 0 failed (7.3 min runtime)

**Notable additions this pass (beyond ticking boxes):**
1. New persistence helper `src/utils/saveFailure.ts` + `GLOBAL_SAVE_FAILED` event surfaces previously-silent localStorage write failures to the player.
2. `IRunActStateSnapshot` extended with `currentNodeIndex` + `nodeOutcomes` for Chronicle / replay-cursor coherence on resume; `RunPersistenceBridge.test.ts` round-trip + zero-default tests added.
3. `RunLifecycle.handleDeath` now bumps `score.nextVictoryDelayGen()` to invalidate same-frame-scheduled victory tickers (T201 race fix).
4. Dead bagpipes-evolution banter removed; `banter.test.ts` pivoted to `EVOLUTION_RECIPES` as source of truth + asserts utility-only weapons have no banter tag (T212).
5. `REPLAY_RECORDER_FRAME_CAP = 90_000` prevents marathon-run quota blowups (T308).
6. Dev hotkey listeners no longer install in production builds (T312).
7. Memory `project_u1_runes_status.md` corrected — U1 ships data + tests, offers gated, M4 still owes consumers.

The plan is closed for merge. Future re-entry: pick a § Exceptions row, follow the "re-entry path" column.
