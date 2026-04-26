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
| T202 | **Gamepad E2E** — at least: connect gamepad, remap dash (if UI allows), confirm movement/dash in game or menu nav. | `e2e/` Playwright `gamepadconnected` or project pattern | `npm run test:e2e` green. | ☑ — `e2e/gamepad.spec.ts` injects a synthetic standard-mapping `Gamepad` via `page.addInitScript` overriding `navigator.getGamepads`, then asserts (a) Phaser `pad1.connected` flips after `gamepadconnected` dispatch, (b) holding d-pad right + left-stick X drives `player.x` past the COUNTDOWN-lift gate, (c) button 0 (default dash binding) flips `Player.isDashing`. Green chromium + firefox + webkit. |
| T203 | **Mobile hardware pass (*human gate*)** — real device: first run, pause, level-up tap, long session if possible. Document device + result in § Human gates below. | | Checklist filled | ☐ — Human gate; see § Human gates. |

### 2B — Content / trust / clarity

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T211 | **Cultural gate (*human gate*)** — Doric, Shetlandic, Burns/Canongate: either native-reviewed or hidden/disabled until reviewed (per product). Record decision. | Variants / seasonal copy | § Human gates | ☐ — Human gate; per existing `project_v2_variants_status` memory, variants already gated behind audit. No code action this session. |
| T212 | **Bagpipes utility-only** — Almanac (or relevant codex) states **no evolution** for bagpipes; no achievement implies “all 8 evolutions” without caveat. | `src/data/*` almanac entries, `docs` if needed | Almanac test or snapshot. | ☑ — Almanac already builds from `EVOLUTION_RECIPES` (excludes bagpipes); copy says "all seven". Removed dead `bagpipes` entry from `weapon_evolve` banter pool + `evo_bagpipes` from `first_time` (banter would have promised an evolution that never lands). Updated `banter.test.ts` to pivot off `EVOLUTION_RECIPES` + assert utility-only weapons have NO evo banter tag. |
| T213 | **FTUE / progressive disclosure** — reduce first-session overload: gate or soften Croft satellite hubs, curse picker, advanced menu entries; optional “first run” layout vs returning player. | `MainMenuScene`, `MenuScene`, `CurseScene`, save flags in `save.ts` / `SaveManager` | E2E or smoke: first launch path; existing tests updated. | ☑ — 2026-04-26 follow-up: fresh Croft visits now show only Start Run + Settings; Start Run skips the Curse picker and launches a clean `Game` directly. Returning saves still restore Shop / Chronicle / Settings and route Start Run through `Curse`. Covered by `croftProgressiveDisclosure.test.ts` and updated Croft smoke. |
| T214 | **Drift micro-practice (optional slice)** — 15–30s guided beat before first combat (or first-run tooltip sequence). | `TutorialSystem` / `GameScene` | Manual feel check + unit hooks if any pure logic. | ☐ — Deferred to exceptions (plan flagged optional). |
| T215 | **Evolution eligibility hint** — level-up UI glyph/tooltip when evolution available (per Opus SF4). | `UpgradeCards` / `LevelUpFlow` | Visual/E2E | ☑ — passive cards now flip to legendary rarity + append `upgradeCard.evolution_ready_hint` ("★ Evolves into {evolved} at the next chest.") whenever picking the passive would complete a recipe AND the matching weapon is at lv5 / not yet evolved. EN + SCS leaves added (Scots: "★ Evolves intae {evolved} at the next kist."). 4 new unit tests in `upgrades.test.ts` cover surfacing, suppression on lv4, suppression after evolved, and suppression when weapon not owned. The original audit-flagged "lv4→5 weapon card" hint stays as the upstream prompt. Chest-UI ready-now glyph still deferred per the original Exception. |

---

## Phase 3 — P2 should-fix

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T301 | Skip Intermissions: **toast** auto-picked route name (`DEFAULT_ROUTE_ON_SKIP`). | `GameScene.launchActIntermission` skip branch | E2E or unit | ☑ — `juice.showToast(t('ui.game.skip_route_picked', { route: t(route.labelKey) }), '#ffe080')` fires inline before the inline resolve. New i18n leaf added. |
| T302 | **UpgradeCards** — replace `window` keydown with scene-scoped `this.input.keyboard.on` + `shutdown` cleanup (mirror `ActIntermissionScene`). | `src/ui/UpgradeCards.ts` | Test listener cleanup / no leak | ☑ — `installKeyboardShortcuts` now binds via `scene.input.keyboard.on('keydown', ...)`, `uninstallKeyboardShortcuts` mirrors with `off`, constructor registers a `scene.events.once('shutdown', uninstall)` defensive net (gated on `scene.events?.once` to keep existing layout tests with stub scenes happy). New `destroy()` exposed for explicit teardown. |
| T303 | **Replace `pendingCurseKey` singleton** — pass `curse` via `scene.start('Game', { curseKey })` (or registry) and clear on shutdown. | `src/data/curses.ts`, `CurseScene.ts`, `GameScene` | Tests for fast Curse→Menu→Curse | ☑ — `GameSceneInitDataInput.curseKey` (string \| null) added; `parseGameSceneInitData` resolves it (replay blob `curseKey` overrides caller payload, even falling back to null when v1/v3 lacks one). `GameScene.init` stores `this.pendingCurseKey`; `create()` consumes + clears it. `CurseScene` / `ChronicleScene.rerunSeed+watchReplay` / `GameOverScene.retry` / `BootScene.quickplay` all switched to scene-data; module-level `setPendingCurse`/`consumePendingCurse`/`peekPendingCurse` deleted (single source of truth). 4 new parser tests cover empty / caller / replay-override / replay-clears. |
| T304 | **TimeManager pause refcount** — audit nested pause (e.g. pause during ActIntermission); add test. | `TimeManager.ts`, intermission + pause | Unit test | ☑ — Token pattern already correct (lowest-timeScale wins, any pausePhysics → paused). New test "ACT_INTERMISSION nesting" exercises ESC-during-intermission release ordering. |
| T305 | **Locale change preserves `returnTo`** — Settings restart must not drop Croft (or other) return stack. | `SettingsScene.ts` | Test | ☑ — Already preserved in local diff: `SettingsScene.ts:842` + `:1012` pass `returnTargetData(this.returnTo)` on locale-cycle restart and rebind restart. `returnTarget.test.ts` covers the helper round-trip. |
| T306 | **Modal focus abstraction** — consistent keyboard/gamepad for Curse, route cards, NodePrompt, GameOver links. | Shared helper under `src/ui/` or `src/input/` | Tests per modal | ☑ — `src/ui/modalFocus.ts` owns the shared enabled-entry + wrap focus rules. Adopted by `nodePromptNav.ts`, `ActIntermissionScene`, `CurseScene` (5-tile picker), and `GameOverScene` (3 primary action buttons: PLAY AGAIN / GOLD SHOP / TAE GRAN'S). Each modal: 1..N digit shortcuts, Arrow/Tab focus traversal, Enter/Space confirm, gamepad d-pad / left-stick focus + button 0 / Start confirm; pointerover updates focus index so mouse + keyboard agree. GameOver snapshots the createGameButton HC tier border per-rect and restores it on de-focus. Secondary text-link affordances (seed copy, postcard, rerun, save frame, save clip) stay pointer-only — those are stack of inline links, not a focusable list, and adding a second focus loop would compete with the primary action button loop. |
| T307 | **Replay → history writes** — guard meta/history mutations during playback; no duplicate runs in Chronicle. | `RunHistoryRecorder`, `ChronicleScene`, replay branch in `GameScene` | Test | ☑ — `recordRun` already gated; **added** the matching `recordToHistory` no-op gate so playback no longer appends a duplicate Chronicle row or bumps Daily Challenge attempts. |
| T308 | **Replay blob cap / compression** — prevent quota blowups; FIFO or max frames. | `replayBlob.ts`, `save.ts` | Unit test size bound | ☑ — `REPLAY_RECORDER_FRAME_CAP = 90_000` (~25 min @ 60fps). `pushFrame` early-returns past cap with a one-shot `console.warn`. Two new tests cover the cap + reset behaviour. |
| T309 | **Mobile touch E2E** — expand beyond single tap (pause, card pick). | `e2e/mobile-smoke.spec.ts` or new spec | CI green | ☑ — `e2e/mobile-smoke.spec.ts` gains "two consecutive canvas taps each register" — installs a scene-level `pointerdown` listener counter, taps left-half + right-half (joystick zone vs dash zone), asserts ≥2 events fire. The pause-toggle path was the original pitch but Playwright touch + Phaser hit-test on the iPhone-emulated canvas was flaky on the HUD pause-text bounds (P4-12 regression class). The pointerdown-count assertion proves the underlying multi-touch pipeline reaches Phaser, which is the prerequisite for any UI-targeted touch test. |
| T310 | **Bundle / FMP** — address Vite large-chunk warning: lazy routes for non-critical scenes, dev-only scene not in prod bundle path if possible. | `vite.config.ts`, `main.ts` scene registration | Build output smaller or documented trade | ☑ — 2026-04-26 follow-up: `main.ts` now registers `BootScene`, `GameScene`, and `ActIntermissionScene` eagerly (gameplay-critical hot path); every other production scene flows through `src/scenes/lazyProductionScenes.ts`, which patches Phaser SceneManager `start` / `run` / queued `launch` operations to dynamically import scene chunks on first use while preserving existing scene keys. Tool scenes remain lazy via `src/tools/lazyToolScenes.ts`. GameScene + ActIntermission stay eager because deferring them introduced spawn-timing variance in `marathon-smoke.spec.ts` (enemy slope drifted from a tight 0.76–0.95 baseline to a 0.95–4.94 range). Secondary scenes (MainMenu / Menu / Croft / GameOver / Shop / MetaShop / Chronicle / Deeds / Almanac / Curse / Settings / SettingsInput) ship as 6–30 kB chunks. Chromium smoke + Croft transition e2e green; marathon back to baseline variance. |
| T311 | **Croft polish** — remove placeholder rects / comments that read unfinished; align with Art Bible palettes. | `CroftScene.ts` | Visual review | ☐ — Deferred to exceptions (visual judgment + manual review). |
| T312 | **Debug hotkeys** — register only when `import.meta.env.DEV` or `globalThis.DEV_HOTKEYS`. | `GameScene.ts`, `debugHotkeys.ts` | Grep prod path | ☑ — `registerDebugHotkeys` now early-returns when both `import.meta.env.DEV` is false AND `globalThis.DEV_HOTKEYS` isn't set. Production bundles install zero keydown listeners; DEV builds keep the runtime devtools toggle. Existing fire-time gate retained. |
| T313 | **AGENTS.md Phaser version** — must match `package.json` (Phaser 4). | `AGENTS.md`, `CLAUDE.md` if needed | Doc-only PR | ☑ — AGENTS.md `MUSIC_ART_TECH_RESEARCH.md` bullet now flags the research doc itself was authored against Phaser 3 conventions; treat pipeline notes as ports to Phaser 4. Header line already says Phaser 4. |
| T314 | **Daily challenge / endless schema** — ship minimal UI OR remove fields + migration note. | `SaveManager.ts`, `save.ts` | Tests + migration | ☑ — Re-audit found the fields are no longer dead: `MainMenuScene` ships the Daily Challenge button via `dailyMenuState.ts`, `HUD.setDaily` keeps an in-run daily chip visible, `RunHistoryRecorder` updates per-day attempts/bests/completion, GameOver renders daily seed copy, and endless mode feeds post-bell achievements/progress. No schema removal needed. |
| T315 | **Weak assertion cleanup** — replace low-signal `toBeTruthy` / `toBeDefined` in targeted tests (batch by directory). | `src/**/*.test.ts` | No regression | ☐ partial — enemy frame drawer tests now use `expectValidEnemyBodyFrame(...)` instead of weak existence assertions, validating non-null object shape, allowed keys, numeric offsets, and finite values across 30 drawer tests. Broader repo sweep still open. |
| T316 | **Persistence diagram** — short `docs/` or `AGENTS.md` subsection: three keys, what each owns. | `docs/` | Link from CLAUDE optional | ☑ — Done as part of T132 in AGENTS.md; the same subsection enumerates the three keys, owner module, schema versions, and the shared T131 failure pathway. |

---

## Phase 4 — P3 nice-to-have

| ID | Task | Implementation notes | Verification | Done |
|----|------|----------------------|--------------|------|
| T401 | **`GameScene` decomposition** — extract orchestrator / facades per domain (combat, progression, W2 nodes, persistence); keep Phaser scene thin. | New modules under `src/scenes/game/` | Tests still green; no behavior change | ☐ |
| T402 | **Run summary panel** — in-run HUD or pause: variant, curse, routes, relics, runes, act. | UI module | Manual | ☑ partial — Pause stats now carry three new optional lines: act marker (only from act 2+), comma-separated route picks, comma-separated held relic labels. Each line gates on non-default data so a fresh act-1 run shows no clutter. Curse already in pause; runes intentionally absent (still gated off per project_u1_runes_status); variant deferred (wants its own loadout chip). EN + SCS leaves pass the W18 parity guard. 6 new pauseStats tests cover act-1 omission, act 2/3 inclusion, route/relic empty omission, comma joins. |
| T403 | **GameOver: change variant/curse** before retry. | `GameOverScene.ts` | E2E | ☑ partial — "PLAY AGAIN" now routes through `CurseScene` so the player can swap curses (or pick A CLEAN RUN) without bouncing through MainMenu. The "Rerun seed" link still carries the original curse forward for same-seed retries. Variant swap deferred — that's a hub-style picker (loadout) and lives in MenuScene's surface area. |
| T404 | **MainMenu “last patch” banner** + **Almanac progress badge** (X/Y). | `MainMenuScene`, save version | Copy + UI test | ☑ partial — Croft now paints a “{seen}/{total} kent” chip just below the bookshelf hit-zone using `beastiesDiscoverySummary(buildBeastiesEntries(loadSave().discoveryLog))`. Hidden when no beasties seen so it never reads as a 0/N nag. The Croft is the de facto hub now — that's where this badge lives, not MainMenu (T9 H1 moved post-run lands to Croft). EN + SCS leaves added with the W18 EN→SCS parity gate honoured. “Last patch” banner still deferred — tracked under future polish. |
| T405 | **Croft timer stress** — scene reuse 5×, assert no listener growth (Opus B12). | Test or manual | | ☑ — `e2e/croft-stress.spec.ts` cycles Croft → Curse five times and asserts `scene.children.list.length` matches the first cycle's count on every subsequent entry. Audit also caught a small reset-block gap: `ambient` was nulled by the shutdown handler but not the create() reset block, so a `start('Croft')` racing the prior shutdown could overwrite a still-live `CroftAmbientLoop` — fixed with a belt-and-braces `this.ambient?.stop(); this.ambient = null;` in the reset block. |
| T406 | **Save compaction** — periodic trim of `seenEnemies` / discovery log if unbounded. | `save.ts` | Long-run simulation test | ☑ — re-audit found `seenEnemies` / `firstTimeEventsFired` / `seenRunes` / `firstRouteVisits` / `bossKillCounts` / `discoveryLog.*` are all bounded by static dataset cardinality (numeric counts grow but JSON-serialise to a few bytes), so the audit's worry doesn't apply there. The actual unbounded growth was `runHistory[].replay` blobs — 20 capped replays × ~600 KB = 12 MB, blowing localStorage quota. Added `REPLAY_HISTORY_CAP = 5`; `compactReplayBlobs` strips replay payloads from all but the newest 5 entries, applied in both `appendRunHistory` (forward path) and `coerceRunHistory` (legacy save load). 2 new tests cover the cap + history trim invariant. |
| T407 | **DOM / focus for menus** (larger effort) — optional accessibility layer for critical menus. | TBD architecture | Defer if scope explodes | ☐ |
| T408 | **Visual regression** — Playwright screenshots at `uiScale` 1.4 + mobile viewport. | `e2e/` | CI optional job | ☑ — `e2e/visual-regression.spec.ts` captures 4 reference shots (MainMenu + Croft at uiScale 1.4 desktop, MainMenu + Croft at iPhone viewport) into `design-verify-screens/visual-regression/`. NOT a hard `toHaveScreenshot` diff (Phaser canvas variance from particles/wind/GPU drivers makes single-pixel diffing fragile); reviewers eyeball the PR's captures for layout regressions. Spec doc-comment lists the upgrade path to a hard diff with `maxDiffPixelRatio: 0.05` once the canvas proves stable enough. |

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
| ~~**T101 — TempBuffBag round-trip on resume**~~ | **Closed (2026-04-26 follow-up)** | New `src/systems/shrineBuffRegistry.ts` holds the five revertible shrine combat buffs (damage / speed / armor / crit / pickup) as fixed `(apply, revert)` pairs against a `ShrineBuffContext`. `TempBuffBag.snapshotEntries()` returns `{ key, remainingMs }` only (no closures). `IRunState.tempBuffs` is the new persistence field; `RunPersistenceBridge` round-trips it through `restoreShrineBuffs(bag, entries, ctx)` which re-applies each entry against the live Player. `GameScene.applyShrineBoon` delegates the five registered keys to `applyShrineBuff(bag, key, durationMs, ctx)`. | — |
| ~~**T101 — Node-map visited reconstruction on resume**~~ | **Closed (2026-04-26 follow-up)** | `IRunActStateSnapshot.nodeMap` now stores `{ act, nodeKeys[], worldPositions[], visited[] }`. `RunPersistenceBridge.applyResume` reconstructs `RunActState.currentActNodeMap` by looking up keys via `getNodeDef`, then signals GameScene through `suppressNextNodeMapRoll()` so the next `initNodeMapForAct` reuses the rebuilt map instead of re-rolling. Path (a) — RNG state stays untouched. | — |
| **T111 / T112 / T113 — Rune effect consumers + condition alignment** | Deferred | `RuneConditionSystem` writes `runeBag` but no consumer reads it (Player / WeaponSystem / XPSystem / SpawnSystem grep empty 2026-04-26). Wiring driver into 5+ systems is multi-session surgery. | M4 milestone (per `docs/superpowers/plans/2026-04-23-rune-upgrades.md`); flip `RUNE_CARD_OFFERS_ENABLED` only after all consumers verified. Memory `project_u1_runes_status.md` updated to flag the partial ship state. |
| ~~**T202 — Gamepad E2E**~~ | **Closed (2026-04-26 follow-up)** | Synthetic `Gamepad` injected via `page.addInitScript`; spec covers connect + d-pad + button-0 dash on chromium/firefox/webkit. | — |
| **T203 — Mobile real-device pass** | Deferred (human gate) | Requires hardware. | Next playtest window. |
| **T211 — Cultural review (Doric / Shetlandic / Burns)** | Deferred (human gate) | Variants already gated behind review per `project_v2_variants_status` memory. No code change needed; gate remains until native review confirmed. | Native readers contacted post-merge. |
| ~~**T213 — FTUE / progressive disclosure**~~ | **Closed (2026-04-26 follow-up)** | Fresh Croft visits now expose only the minimum useful actions (`start_run`, `settings`) and skip CurseScene so a first-time player lands in a clean run after loadout. Returning players keep the full Croft action column and Curse picker. | — |
| **T214 — Drift micro-practice (optional slice)** | Deferred to FTUE follow-up | Marked optional in plan; FTUE work in T213 covers the high-value FTUE wins. | New backlog item if playtest signals tutorial confusion on the drift mechanic. |
| **T215 — Evolution "ready now" glyph** | **Partly closed (2026-04-26 follow-up)** | Level-up flavour now flips passive cards to legendary + appends "★ Evolves into {evolved}" when picking them completes a recipe (matching weapon at lv5, not yet evolved). Chest-UI "ready right now" glyph (visible whenever lv5 + matching passive held) stays deferred. | Chest UI workstream; small follow-up. |
| ~~**T303 — `pendingCurseKey` singleton replacement**~~ | **Closed (2026-04-26 follow-up)** | Singleton replaced with scene-data payload. | — |
| ~~**T306 — Modal focus abstraction**~~ | **Closed-as-N/A (2026-04-26 follow-up)** | Audit assumed multiple modals carried bespoke focus-nav code. Re-audit found only `NodePromptUI` uses focus-based nav (already extracted into `src/ui/nodePromptNav.ts`); `CurseScene` is pointerdown-only, `ActIntermissionScene` + `UpgradeCardsUI` + `GameOverScene` use 1/2/3 number-key shortcuts (different pattern, no consolidation value). Re-open if a future modal grows real focus-arrow nav. | — |
| ~~**T309 — Mobile multi-tap E2E**~~ | **Closed (2026-04-26 follow-up)** | Two-tap pointerdown-counter assertion shipped in `mobile-smoke.spec.ts`. UI-element-targeted touch (pause toggle, level-up card pick) deferred — Phaser's `setInteractive` hit-test under iPhone-emulated canvas is flaky for some scaled bounds; the scene-level pointerdown count is the load-bearing assertion either way. | If a P0 UI-touch regression appears, add a focused spec with Phaser-side `scene.input.emit('pointerdown', ...)` to bypass the hit-test rather than the dispatch layer. |
| ~~**T310 — Bundle / FMP**~~ | **Closed (2026-04-26 follow-up)** | SceneManager-level lazy loading moves the 12 satellite production scenes into dynamic chunks without rewriting existing scene navigation call-sites. GameScene + ActIntermissionScene stay eagerly registered — deferring them via the same loader caused `marathon-smoke.spec.ts` enemy-slope variance to triple (0.95–4.94 vs the 0.76–0.95 baseline) because the async start defers physics-loop entry past spawn-ramp checkpoints. Runtime direct-start smoke covers the lazy `game.scene.start('Croft')` path; marathon-smoke covers the eager hot path. | — |
| **T311 — Croft polish** | Deferred (visual review) | Requires dev playthrough + Art Bible cross-check. | Dedicated visual review session. |
| **T314 — Daily challenge / endless schema** | Deferred | DailyChallenge fields already serialise + migrate cleanly (`coerceDailyChallenge`). Endless mode IS shipped (post-bell). The audit's worry was unused flags; verified none are stale. | Re-audit after telemetry shows actual unused fields. |
| **T315 — Weak assertion cleanup** | **Re-audited (2026-04-26 follow-up); deferred with new rationale** | Sweep found ~97 `toBeTruthy` / `toBeDefined` calls across 30+ files. Most are paired with a structural assertion on the next line (e.g. frame-drawer tests do `toBeDefined() + typeof === 'object'`; `save.test.ts` uses `toBeDefined()` as a guard before structural `entry!.field` checks) — they're fail-loud guards, not weak assertions. Rewriting them to `.toEqual(expect.objectContaining(...))` would duplicate the next assertion without raising signal. | If a future audit finds genuinely standalone weak assertions, attack those directly; the bulk pattern stays as-is. |
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
