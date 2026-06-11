# Wild Haggis Survivors — Pre-Release Critical Review

**Reviewer context:** Codebase map (908 `src` TS files, 239 scene-module files, 163 system files, 397 Vitest files, 24 Playwright specs), targeted reads of boot, menus, game shell, persistence, settings, curse flow, Croft hub, assist mode, debug hooks, and build output.

**Verified in review session:** `npm test` (4067 tests, all passed), `npm run build` (succeeded; Rollup warned about large chunks).

**Not verified:** Hands-on playthrough in a browser (no runtime UX validation beyond what tests/E2E imply).

---

## 1. Executive Summary

**Overall assessment:** This is a **feature-rich, unusually well-tested** Phaser 4 + TypeScript roguelite (Vampire Survivors–style) with procedural art, procedural music, W2 “Moor Road” node routing, relics, curses, replay recording, bilingual EN/Scots scaffolding, Croft hub, Chronicle/Almanac/Deeds, shaders (haar/fog), and a large automated test matrix. For an indie browser title it sits **closer to “near-polished engineering” than “prototype”**, but **player-facing cohesion and cognitive load** lag behind the raw system count, and **a few accessibility promises are only half-delivered**.

**Main strengths**

- Very broad **unit test coverage** (save schema, replay determinism, node map, combat helpers, i18n parity fences, etc.) and **many E2E smokes** under `e2e/`.
- **Data-driven** weapons, enemies, upgrades, routes, biomes, variants, curses; clear separation in `src/data/`.
- Thoughtful **docs and ADR-style comments** (fixed-step physics for replay, `TimeManager` vs real timers, scene reuse warnings).
- **Comfort/a11y direction** is real: colorblind canvas filter, photosensitivity splash, motion scale, captions, reduce flashing — not just lip service in `SettingsManager`.

**Main weaknesses**

- **`GameScene` is a monolith** (~3084 lines per line count) orchestrating dozens of subsystems — high regression and review cost.
- **Assist Mode** persists in settings and has reader APIs in `AssistMode.ts`, but **no gameplay call sites** (grep shows usage only in that module and its test) — either dead product surface or misleading for future UI.
- **First-time cognitive load**: curse pick → node map → acts → intermissions → relics → runes → variants → shop/croft/chronicle — strong for fans, steep for casuals.
- **Web delivery weight**: production build reports **~1.1 MB + ~1.66 MB** (minified JS) main chunks before gzip — fine for desktop, rough for poor mobile networks unless caching helps (PWA SW in prod adds another layer of “which version am I on?”).

**Highest-risk issues (product + tech)**

- **Trust/expectations:** Any setting that appears to help difficulty but does not wire through (Assist Mode readers unused) undermines trust if exposed later without wiring.
- **Scene reuse / stale state:** The codebase is explicitly aware (e.g. `CroftScene.create` reset block, CLAUDE warnings); **any new transient field** in large scenes is a softlock risk if not reset.
- **Complexity vs onboarding:** Tutorial is **minimal** (`TutorialSystem`: move → gem → level 2, plus one-shot banners); the **rest of the systems are learn-as-you-go**, which will lose some players.

**Release readiness:** **Shippable as a strong niche/browser title** if scope is “enthusiast roguelite”; **not** “casual mobile pick-up” without UX pass and bundle/perf targeting. Engineering quality is **above typical** for the genre; **holistic new-player UX** is the main gap.

---

## 2. Project Map

| Area | Detail |
|------|--------|
| **Engine** | Phaser 4, TypeScript, Vite 6, PWA (`vite-plugin-pwa`), Vitest, Playwright |
| **Entry** | `src/main.ts` — registers shaders, builds `Phaser.Game` config (Arcade physics, **fixedStep 60fps**, `Scale.RESIZE`, WebGL-first), scene list, canvas a11y in `postBoot` |
| **Boot / assets** | `BootScene.ts` — procedural texture bake (enemies, bosses, HUD, FX, noise for shaders), locale apply, branch to `MainMenu` or dev `Game` / `SpriteExport` |
| **Primary scenes (registered)** | `MainMenu`, `Menu`, `Croft`, `Game`, `ActIntermission`, `GameOver`, `Shop`, `MetaShop`, `Chronicle`, `Deeds`, `Almanac`, `Curse`, `Settings`, `SettingsInput`, `CombinationsPreview` (dev preview), plus export path |
| **Core gameplay** | `GameScene.ts` + `src/scenes/game/*` (pause, level-up flow, run lifecycle, node map target, persistence bridge, kill handler, hazards, relics UI hooks, etc.) |
| **Systems** | `SpawnSystem`, `WeaponSystem`, `XPSystem`, `JuiceSystem`, `NodeMapSystem`, `RelicSystem`, `BanterSystem`, `TutorialSystem`, `BiomeController` + `BiomeManager`, music `ProceduralMusicEngine`, shaders under `systems/shaders/`, a11y captions, `AssistMode` readers |
| **Entities** | `Player`, `Enemy`, projectiles, pickups, Fianna spirit, etc. |
| **Persistence** | **Two stores**: `src/utils/save.ts` (`whs_save`, schema v17 in file) for gold, upgrades, run history, discovery; `src/core/SaveManager.ts` for meta/progression + **`activeRun` mid-run resume** snapshot (`IRunState`) |
| **Settings** | `src/core/SettingsManager.ts` (`whs_game_settings`) — audio, motion, UI scale, locale, ironmoor, skip intermissions, telemetry, capture, colorblind, assist fields |
| **Input** | Keyboard/mouse/touch/gamepad in Phaser config; remapping in `SettingsInputScene` + `core/actions`, `utils/input.ts`, `input/gamepadAction.ts` |
| **Replay** | `src/replay/*` — recorder, input driver, blob v1/v2/v3, determinism tests |
| **Data** | `src/data/*` — weapons, enemies, upgrades, routes, nodes, variants, curses, relics, banter, biomes, runes, etc. |
| **Tests** | 397 Vitest files; extensive `*.test.ts` beside features; E2E in `e2e/` |
| **Unclear without play** | Exact *feel* of late-game balance, shader perf on low-end GPUs, and full menu flow ergonomics |

---

## 3. Player Journey Review

| Stage | What likely happens | Works (inferred + tests) | Weak / risky | Bugs/edge cases | Recommendations |
|------|---------------------|---------------------------|--------------|-----------------|-----------------|
| **First launch** | Boot bake → photosensitivity path possible → `MainMenu` | Boot is thorough; a11y hooks on canvas | Long boot on slow devices (many texture bakes) | Locale/async chunk race is acknowledged in comments | Progress indicator if bake > N ms |
| **Main menu** | Cozy parallax; stats; play / daily / meta / settings | Rich presentation in `MainMenuScene` | Many entry points — can overwhelm | Suspended-run resume branches add cognitive load | Progressive disclosure for first session |
| **Settings** | Comfort, sound, locale, colorblind, etc. | Strong option set in `ISettingsData` | Assist sub-features not wired to gameplay | Ironmoor confirm flow — test edge cases | Wire Assist or hide schema until wired |
| **Loadout (`Menu`)** | Variant carousel, perks summary, play | Data-driven variants | Variant rules opaque to new players | Carousel gamepad vs touch | Short “why this variant” tooltip |
| **Curse (`Curse`)** | Pick curse or clean run | Clear layout; `curses.ts` documents consume-once | Always-on choice — good for veterans, noise for FTUE | Module singleton `pendingCurse` — must always be consumed (code says it is) | Optional “remember clean run” for first hour |
| **Core run (`Game`)** | Move, drift, weapons auto-fire, XP, level-up cards, node map, biomes, bosses | Deep systems + tests for many edge cases | **Rule density** | Pause vs `scene.time` timers documented project-wide | FTUE cards that reference node map when it first appears |
| **Act intermission** | Route pick or skip via setting | `ActIntermissionScene` + `applyRouteModifierDeltas` + cache resync notes in CLAUDE | Skip setting bypasses narrative beats | Modifier cache desync class of bugs called out in docs | Automated test for each new `RouteModifierDeltaKey` |
| **Death / victory** | `GameOver` rich panel; seed copy; postcard | Defensive null payload → `MainMenu` | Panel complexity on small height | Hot-reload / missing payload | Croft as default return for established saves? (design) |
| **Between runs** | `Shop`, `Croft`, `Chronicle`, `MetaShop` | Croft reset discipline in `create()` | Many hubs — “where do I spend currency?” | `returnTarget` pattern — must stay consistent | Single “next recommended action” after first run |
| **Replay** | Chronicle → playback | ADR/tests | Non-goals documented — manage player expectations | Blob version skew | In-game “replay limitations” one-liner |

---

## 4. Scene / Screen / State Audit

**Boot (`Boot`)**  
- **Purpose:** Asset generation, validation, route to menu/quickplay.  
- **Issues:** Console `console.info` bake timings — minor noise in prod.  
- **Severity:** Low.  
- **Recs:** Gate verbose logs behind `import.meta.env.DEV`.

**Main menu (`MainMenu`)**  
- **Purpose:** Hub, daily/seed, meta entry.  
- **Issues:** High decoration + `reduceParticles` branches — good, but many code paths.  
- **Severity:** Low–Medium (maintenance).  

**Menu / loadout (`Menu`)**  
- **Purpose:** Variant selection, start run pipeline.  
- **Issues:** Transition flag `transitioning` — standard; ensure all exits set it consistently.  
- **Severity:** Medium if any new button bypasses fade.

**Curse (`Curse`)**  
- **Purpose:** Pre-run risk/reward.  
- **Issues:** Wind ambient start — must pair with shutdown (uses `stopAmbientWindOnShutdown` pattern elsewhere).  
- **Severity:** Low if shutdown is consistent.

**Game (`Game`)**  
- **Purpose:** Entire run.  
- **Issues:** Monolithic orchestration; debug hotkeys **always registered** (`registerDebugHotkeys` right after `Player` construction) but handlers no-op unless `globalThis.DEV_HOTKEYS` (`debugHotkeys.ts`). Listener churn on scene reuse unverified without stress test.  
- **Severity:** High (maintainability); Low–Medium (prod player unless flag set).

**Act intermission (`ActIntermission`)**  
- **Purpose:** W2 route choice modal.  
- **Issues:** `launch` vs `start` semantics — documented for tests/E2E.  
- **Severity:** Medium if any new overlay blocks input incorrectly.

**Game over (`GameOver`)**  
- **Purpose:** Results, unlocks, rerun, links.  
- **Issues:** Falls back to `MainMenu` if payload bad — safe but may feel like a “bug” to players.  
- **Severity:** Low UX.

**Shop (`Shop`)**  
- **Purpose:** Spend Golden Haggis.  
- **Issues:** `returnTo` fade pattern — consistent with other scenes.  

**Meta shop (`MetaShop`)**  
- **Purpose:** Meta progression shop (from menu).  
- **Issues:** Second economy layer — ensure copy explains difference from run gold.

**Chronicle / Almanac / Deeds**  
- **Purpose:** History, lore codex, achievements-style deeds.  
- **Issues:** Deep content surfaces; navigation must stay keyboard/gamepad clean (tests exist for almanac keyboard nav).  

**Croft (`Croft`)**  
- **Purpose:** Emotional hub, trophies, drove, seasonal props.  
- **Issues:** Commented “placeholder” rects still in draw order for some elements — may read unfinished visually.  
- **Severity:** Medium polish.

**Settings / SettingsInput**  
- **Purpose:** Options + remapping.  
- **Issues:** Locale change uses stop/start pattern — correct for Phaser but easy to get wrong when extending.  

**CombinationsPreview (dev)**  
- **Purpose:** Combination preview.  
- **Still in prod scene array** (`main.ts`).  
- **Severity:** Low security (gated by dev flag); Medium bundle hygiene.

---

## 5. Bugs and Technical Risks

| Title | Location | Sev | Confidence | Player impact | Repro idea | Suggested fix |
|-------|----------|-----|------------|---------------|------------|---------------|
| Assist Mode not applied in gameplay | `AssistMode.ts` unused outside self/tests; no calls from `Player`/`GameScene`/`TimeManager` | **High** (a11y promise) | **Likely** (static grep) | Players gain no benefit from future/exposed toggles | Toggle assist in storage (if UI added) — no effect | Wire readers into damage, iframes, timeScale, combo decay |
| `GameScene` monolith | `GameScene.ts` ~3084 lines | **Medium** (maint.) | **Confirmed** | Regressions, longer bugfix time | Any feature touch | Extract facades per domain (already partial in `scenes/game/`) |
| Debug keyboard listeners always attached | `GameScene.ts` + `debugHotkeys.ts` | **Low** | **Confirmed** | Theoretical overhead / duplicate handlers on reuse | Start many runs without full shutdown | Register only if `DEV_HOTKEYS` or `import.meta.env.DEV` |
| Large JS payload | Vite build output | **Medium** (platform) | **Confirmed** | Slow first load on mobile | Throttle network in DevTools | Split Phaser or lazy-load non-run scenes |
| Dual persistence models | `save.ts` + `SaveManager.ts` | **Medium** | **Confirmed** | Confusion during resume/migration bugs | Corrupt one key only | Document single “source of truth” diagram for contributors |
| Global curse pending state | `data/curses.ts` | **Low–Medium** | **Possible** if consume path breaks | Wrong curse next run | Abandon run mid-transition | Integration test for every entry to `Game` |

---

## 6. Game Design Critique

**Core loop:** Classic survivors loop (move, survive, scale build, chase XP) plus **Scottish flavor and drift** — differentiated mechanically from generic clones.

**Progression:** Layered: run-level upgrades, permanent shop, meta shop, variant unlocks, relics, node rewards, route modifiers — **strong for depth**, **risk of “spreadsheet stacking”** where players stop feeling each choice.

**Difficulty:** Curses, ironmoor, elite affixes, HP time scaling (`config.ts` comments show active balance iteration) — signals honest tuning work.

**Rewards:** Gold mult from curses, echo cards past max level (`XP.ECHO_XP_THRESHOLD`) — good anti-feel-bad for cap.

**Clarity:** Mechanics are **documented for developers** more than for players; in-game glossary is partially offset by Almanac but **not equivalent to a tutorial**.

**Replayability:** Seeds, daily, replay blobs, variant goals — **high**.

**Weaknesses:** Onboarding vs complexity mismatch; two shops may confuse; Moor Road adds **strategy layer** that VS players may not expect.

---

## 7. Game Feel Critique

**Controls:** Drift is intentional (`PLAYER.DRIFT_DEGREES`); tests cover movement/stats — **polarizing but on-brand**.

**Responsiveness:** Fixed-step physics + raw delta caps mentioned in project docs — good for determinism; ensure all “feel” systems respect the same time authority.

**Feedback:** `JuiceSystem`, combo milestones, boss HP tracker, damage numbers optional — **strong toolkit**.

**Camera:** Follow lerp 0.08, zoom 1.3 — likely readable; edge indicators exist.

**UI feel:** Many dedicated UI tests (HUD, minimap, upgrade cards) — suggests intentional tuning.

**Friction:** Level-up card noise, node prompts while combat continues — classic survivors tension; **assist speed not wired** means motor accessibility is only partial (motion scale exists elsewhere).

---

## 8. Art, UI, and Presentation Critique

**Consistency:** Single procedural pipeline from `BootScene` — **cohesive by construction**; avoids “asset pack mashup.”

**Readability:** Elite/boss/minimap legends called out in docs; high-contrast UI path.

**Croft:** Still carries **placeholder language** in comments and some placeholder rects — may read as “unfinished hub” compared to menu polish.

**Shaders:** Haar/fog — strong atmosphere; photosensitivity path attempts to cap risk — **verify** against real PEAT-style testing (not done here).

**Accessibility:** Colorblind matrix on canvas + UI toggles — good. **Assist gameplay** gap remains.

---

## 9. Narrative / Continuity Review

**Applicable:** Light narrative via **banter**, **Almanac**, **Chronicle**, seasonal events (e.g. Burns Night hooks in code), Gran/Croft voice flavor.

**Not a linear story RPG:** No branching quest graph to audit; continuity risks are **tone/register** (per `VOICE_CARD.md` intent) and **i18n parity** (enforced for banter subset in tests).

**Risk:** Copy volume in `data/banter` + routes — occasional **stale references** if features rename; mitigated by tests for some data files, not exhaustive literary edit.

---

## 10. Codebase Review

**Architecture:** Generally **modular data + systems**; **`GameScene` is the coupling hotspot** importing ~170 modules in the first 180 lines alone.

**Maintainability:** Excellent test corpus; **scene reuse discipline** explicitly coded in Croft; GameScene still risky.

**State:** `pendingCurse`, replay routes, run modifiers bags — **documented mutation patterns**; good for experts.

**Save/load:** Schema version 17 in `save.ts`, separate settings version — migration tests present (`save.test.ts` large).

**Performance risks (inferred):** ENEMY cap 400, projectile pool 200 (per CLAUDE), many animated enemies — **GC and update cost** depend on pooling discipline (pools exist for several systems).

**Technical debt markers:** Deprecated save audio booleans; multiple “Phase” comments; dev scenes in prod registration.

**Recommended refactors:** Continue extracting `GameScene` orchestration into facades; consider **lazy scene registration** for dev-only scenes.

---

## 11. Edge Case Matrix

| Edge case | Area | Expected | Likely current | Risk | Test/fix |
|-----------|------|----------|----------------|------|----------|
| Tab background huge `delta` | Game update | Capped / stable | Documented cap pattern | Medium | Playwright long-session |
| Physics paused, timers fire | Timers | Guarded | Project-wide guidance | High if missed | Grep for unguarded `delayedCall` |
| Resume run after app kill | SaveManager | Restore or fail safe | Tests for bridge | High | Corrupt `activeRun` blob |
| Skip intermissions | Settings | Default routes | `DEFAULT_ROUTE_ON_SKIP` | Medium | W2 E2E |
| Replay blob v1 vs v2 | Replay | Graceful | Tests exist | Medium | Version upgrade fixtures |
| Rapid scene mash | Menus | Ignore double starts | `transitioning` flags | Medium | Input debounce tests |
| Ultrawide / narrow | Scale RESIZE | HUD clamped | `getCameraViewport` usage | Medium | Visual E2E matrix |
| Assist toggles | Settings | Affect gameplay | **No-op in combat** | High | Wire or hide |
| `GameOver` missing payload | Scene | Safe exit | → `MainMenu` | Low | Log + Croft? |
| PWA update mid-run | SW | Soft refresh | `visibilitychange` ping | Low–Med | Manual QA |
| Dev hotkeys flag on in prod | Debug | Harmless | No-op handlers | Low | Document |

---

## 12. Prioritized Fix List

### Must fix before release (if targeting accessibility / trust)

- **Wire Assist Mode OR remove/hide persisted assist fields until wired** — `AssistMode.ts` / `SettingsManager` / gameplay integration. *Effort: Medium. Impact: High. Owner: Design + Code.*

### Should fix before release

- **Reduce first-run cognitive load** — progressive tutorial for node map + curse + relic prompt. *Effort: Medium. Impact: High. Owner: Design + UI.*
- **Bundle strategy** — address Vite chunk warning; target faster FMP on mobile. *Effort: Medium. Impact: High. Owner: Code.*
- **Croft placeholder cleanup** — visual “finished” pass. *Effort: Medium. Impact: Medium. Owner: Art + Code.*

### Nice to have

- Split `GameScene` along subsystem boundaries; lazy-load dev scenes. *Effort: Large. Impact: Medium. Owner: Code.*
- Contributor diagram for `save.ts` vs `SaveManager.ts`. *Effort: Small. Impact: Medium. Owner: Docs / onboarding.*

---

## 13. Test Plan

**Smoke:** E2E `smoke.spec.ts` + boot canvas a11y; run full `npm run ci:all` before release.

**Full playthrough:** Fresh save: MainMenu → first run → death → shop → second run → act boundary → optional victory path; repeat with Scots locale.

**Regression:** `npm test` (Vitest); `replayDeterminism.test.ts` after physics/input changes.

**Save/load:** Corrupt `localStorage` keys; migrate from minimal old fixtures; resume mid-run; ironmoor flag.

**Input:** Keyboard remap, gamepad (E2E `input-remap.spec.ts`), touch on mobile smoke.

**Scene transitions:** Rapid back/forward between Settings, Croft, Chronicle; `returnTarget` integrity.

**Performance:** 10+ minute run with enemy cap stress; Chrome performance panel; low-end GPU shader path.

**Settings:** Colorblind, reduce flashing, motion 0, captions — verify *visible* outcomes.

**Accessibility:** Photosensitivity splash; WCAG contrast on high-contrast mode spot-check.

**Edge:** Pause during intermission; level-up during boss death; skip intermissions ON/OFF.

**Platform:** PWA offline/open from home screen; cache bust after deploy.

---

## 14. Final Verdict

**Doing well:** Mechanical depth, cultural voice, engineering rigor (tests + replay + migrations), procedural cohesion, music/audio architecture, and honest documentation of Phaser pitfalls.

**Most likely to make players quit:** **Opaque systems early** (node map + economy layers + drift) without enough **guided mastery**; possible **load-time friction** on weak hardware; **genre fatigue** if moment-to-moment doesn’t feel distinct enough in the first 3 minutes (that part needs **live play** to judge).

**Unfinished / sloppy:** **Croft** still reads as partially scaffolded in code comments; **Assist Mode** is **unfinished product surface** relative to the comfort mission.

**Fix first:** **FTUE + clarity** (cheap win per retention) **or** **Assist wiring** if you market accessibility.

**Least effort / high impact:** **Short, contextual tooltips** at first curse, first node pick, first relic — no new systems.

**More time available:** **`GameScene` decomposition**, **bundle splitting**, full **mobile perf** pass, narrative polish pass on Almanac/banter for tone consistency.

---

**Verification summary:** Unit tests and production build were run successfully during the review session; the report is **code- and test-informed**, not a substitute for a full **blind playtest** session and **device matrix** QA.

**Report:** `report-composer-2-fast-250426.md` — Composer (cursor-agent composer-2-fast), 2026-04-26.
