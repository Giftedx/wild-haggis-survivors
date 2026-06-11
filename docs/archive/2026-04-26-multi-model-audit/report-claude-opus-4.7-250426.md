# Wild Haggis Survivors — Pre-Release Critical Review

**Reviewer:** External QA / design / code audit
**Date:** 2026-04-25
**Branch:** `master` @ `40ec0d5` + 31 modified, 10 new (uncommitted)
**Method:** Static review; ran `npm run build`, `npm run lint`, vitest spot-checks via subagents. No live playtest performed.

---

## 1. Executive Summary

**Overall:** Late-alpha bordering on beta. The game has unusual design integrity (Glaswegian voice, drift mechanic, Soul charter discipline), genuinely impressive content breadth (8 weapons, 31 enemies, 18 relics, 30 runes, 14 variants, 22 banters, 6 routes, 4 biomes, Croft + Almanac + Chronicle hubs, Burns Night seasonal), and an above-industry test culture (4067 unit tests, 24 e2e specs, clean lint, clean tsc). It is *not* prototype-quality and *not* shovelware.

It is also **not ready to ship**. There is one feature-flagged-off system that the public-facing comms have already announced as live (Runes), one god-object whose growth is becoming load-bearing (`GameScene.ts` = 3,271 lines), one persistence robustness gap (silent localStorage quota), and a substantial uncommitted in-flight bundle (~700 lines, 5 themes) that addresses the most painful audit findings but has not yet been gated through CI as a green commit.

**Top strengths**
- Data-driven architecture: balance lives in `src/data/*.ts`, not scattered through scenes.
- Test discipline: 4067 unit tests, 24 e2e specs, lint+tsc clean, CI blocks merge on full `ci:all`.
- Persistence robustness: 3 storage systems (`whs_meta_save` v9, `whs_save` v17, `whs_game_settings` v1) with full migration chains, defensive coercion, JSON-parse try/catch.
- Accessibility intent: photosensitivity warning, colorblind LUT (4 modes), captions w/ scale, motion scale, reduce-flashing, banter frequency, planned Assist Mode.
- Game-feel research foundation: GAME_FEEL, MUSIC_ART_TECH, SCOTTISH, NARRATIVE, ACCESSIBILITY, CULTURAL research docs underwrite design decisions.

**Top weaknesses**
- **Rune card offers shipped as feature-flag OFF** (`src/data/upgrades.ts:56` `RUNE_CARD_OFFERS_ENABLED = false`). Memory + recent commits suggest the public framing is "U1 Runes shipped 2026-04-25." Player-facing reality: 30 rune defs exist but cards never appear in level-up pool. This is a release-trust risk.
- **`GameScene.ts` is 3,271 lines** and instantiates 15+ systems. Reset block in `create()` is the single point of failure for scene-reuse correctness.
- **Silent save failures** on quota-exceeded (`SaveManager.ts:510-517`, `save.ts:503-508`, `SettingsManager.ts:326-331`) — game continues, player thinks progress saved.
- **Resume robustness fixes** (relics, route timers, Act3 stretch, gamepad rebind, prompt nav) all live in uncommitted working tree. Until merged + CI-green, the publicly reachable build still has the old bugs.
- **Mobile/touch coverage** is shallow — `e2e/mobile-smoke.spec.ts` exists with one tap, no full joystick play. P4-12 hang fix is in but unverified on real device.
- **Gamepad has no e2e coverage** despite being a primary input.

**Release readiness verdict:** Polished enough to be cruel to ship rough. **Not ready** as-is. With the in-flight 5-theme bundle merged + 7 items from the §12 Must-Fix list cleared, this could ship to a friends-and-public beta in 1–2 weeks of focused work.

---

## 2. Project Map

**Engine / framework / language**
- Phaser 4 (just-migrated; `project_phaser4_status` notes 2026-04-23 cutover; render-node API change required `setUniform` rewrite — see `HaarFogRenderNode.ts`).
- TypeScript strict, ES module, path alias `@/*` → `src/*`.
- Vite (dev port 3000, preview port 4180). Vitest (node env). Playwright (chromium-desktop primary, +firefox/webkit/chromium-mobile).

**Entry points**
- `src/main.ts` — Phaser config (`fps: 60, fixedStep: true` for replay determinism), scene registration, render-node registration.
- `index.html` — single root canvas mount; query-flag dispatcher (`?devRelicStats=1`, `?export=sprites`, `?seed=…`, `?forceVariantKey=…`).
- `src/scenes/BootScene.ts` — generates ALL textures programmatically (no external image assets).

**Scene graph (18 scenes)**
```
Boot → MainMenu (hub) ─┬─ Menu (variant carousel) ─ Curse ─ Game ─┬─ ActIntermission (launched, paused)
                       │                                          ├─ GameOver ─ {MainMenu | Game | Shop | Croft}
                       ├─ MetaShop                                │
                       ├─ Settings ─ SettingsInput                │
                       ├─ Croft ──┬─ Menu                         │
                       │          ├─ Almanac ─ Chronicle (cycle)  │
                       │          └─ Game (resume)                │
                       ├─ Deeds                                   │
                       └─ Chronicle ─ Almanac ─ Game (rerun)      │
Dev: CombinationsPreviewScene
Pseudo-scenes (in-GameScene overlays): PauseMenu, LevelUpFlow, NodePromptUI
```

**Core systems** (`src/systems/**`, ~15 active)
- WeaponSystem (1163 LoC) · SpawnSystem (850) · XPSystem (318) · JuiceSystem (1190) · AudioSystem (1077) · TimeManager (239) · TutorialSystem (630) · DiscoveryLog (320) · RelicSystem (214) · RuneConditionSystem (143) · BanterSystem (175) · NodeMapSystem (312) · SeasonalEventManager (145) · BiomeManager / Renderer · ProceduralMusicEngine.

**Data** (`src/data/**`, ~180 entries)
- `weapons.ts` (8) · `enemies.ts` (31 + 4 bosses + final) · `eliteAffixes.ts` (7) · `upgrades.ts` (~50 cards across rarities) · `permanentUpgrades.ts` (16) · `relics.ts` (18) · `runes.ts` (30) · `routes.ts` (6) · `variants.ts` (14) · `curses.ts` (5) · `biomes.ts` (4+1) · `nodeBanks.ts` (6) · `moorMoments.ts` (17) · `banter.ts` (1657 LoC, 22 contexts) · `seasonal/*` (Burns Night).

**Persistence** — three independent localStorage keys:
- `whs_meta_save` v9 (`SaveManager.ts`) — meta progression, mid-run resume payload
- `whs_save` v17 (`utils/save.ts`) — gold, run history, variant unlocks, Almanac, runes seen
- `whs_game_settings` v1 (`SettingsManager.ts`) — 27 settings

**Tests** — 397 vitest files / 4067 tests (transform 19.88s); 24 Playwright specs; ~107 scene tests, ~77 system tests, ~38 UI tests.

**Build/CI** — `.github/workflows/ci.yml` runs `npm run ci:all` (lint + vitest + build + e2e 4-project matrix) on push & PR; blocks merge; `forbidOnly: true`.

**Inspectable but not run by me:** live game in browser, replay determinism long-soak, real mobile device, gamepad hardware.

---

## 3. Player Journey Review

| Stage | Likely behavior | Works | Fails / weak | Bugs / edges | Recommendation |
|---|---|---|---|---|---|
| **First launch** | Boot → photosensitivity splash → MainMenu | Splash dismissal persists via `photosensitivityWarningSeen`. BootScene generates textures (no asset stalls). | No FTUE narrative — player lands on a hub with Menu / Croft / MetaShop / Settings / Deeds / Chronicle / Almanac buttons. Cognitive overload for someone who hasn't seen the game. | Player may click Almanac/Chronicle first (empty until a run is finished) — confusing landing. | Gate Almanac, Chronicle, Croft, Deeds behind first-run-completion or fade them with a "complete a run" tooltip. |
| **Main Menu** | Choose Play / hub buttons / settings | Persistent suspended-run button (resume) is present per RunPersistenceBridge. | Hub button density (>5 buttons) for a brand-new player. Variant carousel is *behind* a separate `Menu` scene, not on MainMenu — extra click. | If `activeRun` save is corrupted past coercion, resume button may be visually present but error on click. | Surface variant choice on MainMenu directly; hide hubs until unlocked. |
| **Variant select** | `MenuScene` carousel | 14 variants, unlock tracking solid. | No tooltip explaining what a "variant" *is* on first encounter. | Selecting locked variant — verify `MenuScene` blocks pointer on locked tiles, doesn't just visually grey them. | Add a one-line tooltip: "Variants change starting stats and feel." |
| **Curse picker** | `CurseScene` 5 tiles + Clean Run | Bested markers visible. | "Curse" semantics not introduced — first-run player picks Clean Run by default but doesn't know what skipping costs. | Curse cycling rapidly → ensure no stale `pendingCurseKey` singleton across consecutive runs. | First-run: hide curses entirely. Surface after first victory. |
| **Tutorial / onboarding** | TutorialSystem fires hints on first events | Hints have unique keys (`shownHintKeys` Set), don't replay. Banter density honors `banterFrequency`. | Drift mechanic — the *core identity* — gets a hint but no in-context guided practice (e.g. a circle to walk into). | Hints stomp on each other if 2 first-time events fire in <hint-duration. | Build a 30-second drift micro-practice in the first run before enemies spawn. |
| **Early game (0–3 min)** | Wave timeline ramps; first weapon level → first level-up card | XP curve (BASE=12, SCALE=1.17), gem magnet, juice pops are all wired. | Level-up is *modal* but not *paused* — it's inline in GameScene per `LevelUpFlow.ts`. Animations + tweens keep running in background. | If a level-up fires the same frame as a boss-warning banter, cards may overlap with toast. | Pause via TimeManager during level-up like ActIntermission does, or document why inline is intentional. |
| **Mid game (3–10 min)** | Elites (10% post-2min), Moor Road act intermission on `gordon` boss kill, weapon evolutions | ActIntermission acquires TimeManager pause token correctly; route picks resolve cleanly via `RouteDef.modifierDeltas`. | Skip Intermissions setting silently picks `DEFAULT_ROUTE_ON_SKIP` without telling the player they got a route. | Bag-vs-cached-field divergence flagged in CLAUDE.md is real risk if a new route is added without matching setter. | Show a 1-second toast on skip: "Auto-picked: <route name>". |
| **Mid-late (10–17 min)** | `tour_bus` boss → act 2; `taxman` → victory | Boss spectacle via JuiceSystem boss pools. | Player-facing victory copy not reviewed in this audit. | `taxman` does NOT route through `onActComplete` per CLAUDE.md — verify victory path can't double-fire if player dies same frame as kill. | Test simultaneous death + boss kill; assert single resolution. |
| **Failure / death / retry** | GameOver scene | Defensive — null payload bounces to MainMenu (`GameOverScene.ts:47-66`). | Retry button → `Game` rerun does not re-enter Curse/Variant select; locked to last selection. Frustrating if player wants to switch variant. | Repeated retry mid-tween: stale animation refs from prior run. | Add "Change Variant" / "Change Curse" sub-options on GameOver. |
| **Pause / resume** | ESC → PauseMenu overlay | Pauses TimeManager; resume restores `gameTimeScale`. New uncommitted work fixes Act3 stretch + relic loss + route timer remainder on full-quit resume. | Pause does not visibly indicate which input mode is active (kbd vs gamepad vs touch). | Pause during ActIntermission: nested pause token? Verify TimeManager refcounting. | Show input glyph in PauseMenu corner. |
| **Save / load** | localStorage ×3 keys | Migration chains complete. Coercion exhaustive. Resume rehydrates Player + weapons + position + relics (post-fix). | Quota-exceeded is **silent** in all three managers. | Old build save loaded by future build → unknown fields silently dropped. Acceptable but undocumented. | Surface a toast on save-write exception. |
| **Returning player** | MainMenu shows lifetime stats; Chronicle shows history (≤20 runs) | History capped at 20, FIFO. | No "what's new since you last played" surface. Returning player sees nothing about Burns Night, new variants, etc. | Replay blob older-version: `replayDeterminism.test.ts` covers, but cross-version determinism not asserted. | Add a "Last patch" banner on MainMenu after version bump. |
| **Completion / win** | Victory state | Variant unlocks fire on victory criteria; Burns Night `burns_wee_beastie` requires victory inside seasonal window. | "Complete-the-Almanac" goal is implicit. Player has to discover the meta-collection on their own. | Burns Night window edge: device-local date check at run-start; what if midnight crosses mid-run? Spec it. | Give Almanac a progress badge on MainMenu (X / Y discovered). |
| **Endgame / replay** | 14 variants × 6 routes × 5 curses × runs unlocking 5 hidden achievements | Massive design surface. Procedural music + banter keeps run-to-run variety. | No daily-challenge UI (DailyChallengeState exists in save schema). | Endless mode (`bestEndlessSeconds` in save) has no scene path I could find. | Either ship endless or remove the field. |
| **Quitting** | Browser close / pagehide | `RunPersistenceBridge.registerMidRunHooks` snapshots `IRunState` on `pagehide` + `beforeunload`. | If quit fires during a tween-heavy frame, snapshot may capture mid-animation state. | Quit during ActIntermission: which token holds the pause? Confirm intermission resume works. | Add an integration test: launch ActIntermission → simulate pagehide → reload → assert intermission re-launches. |

---

## 4. Scene / Screen / State Audit

For brevity, only the scenes with non-trivial findings are detailed. Routine scenes (BootScene, MetaShop) are presented in summary.

### BootScene (`src/scenes/BootScene.ts`)
- **Purpose:** Generate every sprite texture programmatically; route to MainMenu (or Game if `?seed=` debug flag).
- **Issues:** None observed. Texture generation cost not measured (could be slow on low-end mobile — verify with mobile-marathon timings).
- **Severity:** Low. **Recommendation:** Add a "loading…" caption if generation >500ms.

### MainMenuScene
- **Issues:** Hub overload for first-time players (§3). Suspended-run button exists; verify it's hidden when `activeRun` is null.
- **Severity:** Medium. **Recommendation:** Gate hubs behind first-run completion.

### MenuScene (variant carousel)
- **Issues:** No locked-tile pointer block confirmed in audit. No variant tooltip.
- **Severity:** Medium.

### CurseScene
- **Issues:** Singleton `pendingCurseKey` for cross-scene comms — verify it's cleared on scene shutdown.
- **Severity:** Medium. **Recommendation:** Replace singleton with scene data payload (`scene.start('Game', { curse })`).

### GameScene (god object, 3,271 lines)
- **Issues:**
  - File size + 26 inbound imports = single point of architectural risk.
  - `create()` reset block is the only thing keeping scene-reuse correct after `scene.start('Game')`.
  - Music state machine drives off `updateMusicState()` per frame from GameScene loop — 1-frame divergence if biome/combo state mutates without invoking it.
  - `delta` cap of `Math.min(delta, 100)` is per CLAUDE.md but I did not verify it's applied in every system update call.
- **Severity:** High (architectural debt, not a player-facing bug yet).
- **Recommendation:** Extract `GameSceneOrchestrator` class; let GameScene be a thin Phaser shell. Defer to later release; flag in tech debt register.

### ActIntermissionScene
- **Issues:** Skip-Intermissions silent default route pick. Keyboard handler cleanup uses `events.once(SHUTDOWN)` — safe pattern; cleaner than UpgradeCards' window listener.
- **Severity:** Low. **Recommendation:** Toast on auto-picked route.

### ShopScene / MetaShopScene
- **Issues:** No empty-shop state confirmed; with 16 fully-purchasable items the shop never hard-empties (max-level cards stay visible at "MAX").
- **Severity:** Low.

### SettingsScene + SettingsInputScene
- **Issues:**
  - Locale change does `scene.stop() + scene.start()` — full restart. Verify `returnTo` payload survives the restart.
  - Assist Mode settings persisted but no UI exposure (`SettingsManager.ts:102-104` comment confirms).
- **Severity:** Medium. **Recommendation:** Either expose Assist Mode UI (with "experimental" tag) or remove the settings until A1 wires runtime effects.

### CroftScene (553 lines)
- **Issues:** Heavy `create()` reset block (lines 77–118). Timers (knittingTimer, hearthTimer, granBubbleTimer) removed via `.remove(false)` — confirm Phaser 4 semantics still detach listeners.
- **Severity:** Medium. **Recommendation:** Add a vitest scene-reuse smoke test that destroys + recreates Croft 5x and asserts no listener growth.

### AlmanacScene + ChronicleScene
- **Issues:** Cycle Almanac → Chronicle → Almanac (nested) could deep-stack scene starts. Verify `returnTo` payload doesn't accumulate.
- **Severity:** Medium.

### GameOverScene
- **Issues:** Retry locks to last variant/curse — no easy switch.
- **Severity:** Medium.

### NodePromptUI overlay
- **Issues (currently being fixed in uncommitted work):** Old code has weak keyboard / gamepad nav, accidental scrim-skip. New work adds focus nav, removes implicit skip.
- **Severity:** Critical until merged; Low after.

### LevelUpFlow / UpgradeCards overlay
- **Issues:**
  - Uses **window-level** keydown listener (`UpgradeCards.ts:~422`), unlike scene-scoped patterns elsewhere. Cleanup via `hide()` — every exit path must call it. Acceptable but fragile.
  - Inline (not paused) — animations continue underneath.
- **Severity:** Medium.

### PauseMenu overlay
- **Issues:** Ensure `togglePause(false)` always pairs with `pauseMenu.close()`. No visible audit failure but no test asserts the pairing.
- **Severity:** Medium.

### CombinationsPreviewScene (dev)
- **Issues:** Ensure not reachable in production build (no menu link, no query flag in shipped HTML).
- **Severity:** Low.

---

## 5. Bugs and Technical Risks

| # | Title | Location | Severity | Confidence | Player impact | Trigger | Suggested fix |
|---|---|---|---|---|---|---|---|
| B1 | Rune card offers feature-flagged off | `src/data/upgrades.ts:56` `RUNE_CARD_OFFERS_ENABLED = false` | **Critical** (release-trust) | Confirmed | Players who read changelog/marketing expecting runes will never see one in a level-up | Always | Flip flag and verify rune effects actually apply via RuneConditionSystem; OR remove rune messaging from public comms until M4 lands |
| B2 | Silent localStorage save failure | `SaveManager.ts:510-517`, `save.ts:503-508`, `SettingsManager.ts:326-331` | High | Confirmed | Player thinks gold/upgrades persisted; quits; data gone | localStorage quota exceeded, private browsing, third-party-cookies blocked | Toast "Save failed — clear browser cache or try again" + structured error in console |
| B3 | Resume drops relics, Act3 stretch, route timers | (Old code in `RunPersistenceBridge.ts`) | High | Confirmed (from internal audit `report-gpt5.5-250426.md`) | Player resumes mid-run, loses relics + route buffs, Act3 map reverts to Act1 | Quit + reopen mid-run | **Already fixed in uncommitted work — must merge** |
| B4 | Gamepad rebinds ignored at runtime | (Old `input.ts` polled hardcoded button indices) | High | Confirmed | Player rebinds dash to button 2; nothing happens | Use SettingsInput rebind | **Already fixed in uncommitted `gamepadAction.ts` — must merge** |
| B5 | NodePromptUI not navigable by keyboard/gamepad | (Old `NodePromptUI.ts`) | High | Confirmed | Controller players can't choose node options | Open any node prompt | **Already fixed in uncommitted `nodePromptNav.ts` — must merge** |
| B6 | Subscreens from Croft return to MainMenu | (Old behavior in CroftScene → Settings/Almanac/Chronicle) | Medium | Confirmed | Player at Croft opens Settings, hits Back, lands at MainMenu | Croft → subscreen → Back | **Already fixed via `returnTarget.ts` — must merge** |
| B7 | Assist Mode settings persist but no runtime effect | `SettingsManager.ts` lines for `assistMode*` | High (accessibility broken promise) | Confirmed | Toggling settings does nothing | Open Settings (if exposed) | Either wire effects or hide UI |
| B8 | GameScene god object | `src/scenes/GameScene.ts` (3,271 lines, 26 inbound imports) | Medium (debt) | Confirmed | None directly; latent risk for any new feature | Adding a new system requires touching GameScene | Extract orchestrator class post-release |
| B9 | Skip Intermissions silently picks default route | `GameScene.launchActIntermission` skip path | Medium | Confirmed | Player has no idea they got `up_the_brae` etc. | Settings → Skip Intermissions = on | Toast on auto-pick |
| B10 | Music genre state can lag 1 frame from biome change | `AudioSystem` + `GameScene.updateMusicState()` | Low | Likely | Brief music genre delay on biome cross | Frame after biome flip | Acceptable; document. |
| B11 | UpgradeCards uses window keydown listener | `src/ui/UpgradeCards.ts:~422` | Medium | Confirmed | Listener leak if `hide()` skipped on a code path | Untested error path during card resolve | Migrate to scene-scoped `keyboard.on()` with `events.once(SHUTDOWN)` cleanup like ActIntermission |
| B12 | `CroftScene` timer `.remove(false)` may leave listeners | `src/scenes/CroftScene.ts:77-118` | Medium | Possible | Memory growth across Croft re-entries | Visit Croft 20× | Verify Phaser 4 TimerEvent.remove cleans listeners; if not, add `.destroy()` |
| B13 | Pseudo-singletons (`pendingCurseKey`) for inter-scene comms | `CurseScene` ↔ `GameScene` | Medium | Likely | Stale curse may bleed into next run if not cleared on shutdown | Cycle Curse → Game → MainMenu → Curse fast | Replace with scene data payload |
| B14 | `bagpipes` weapon lacks evolution recipe | `EVOLUTION_RECIPES` in BalanceConfig | Low (intentional?) | Confirmed | "Get all 8 evolutions" is impossible if a player tries | Try to evolve bagpipes | Document as utility-only in Almanac; CLAUDE.md confirms intent |
| B15 | Replay blobs in run history can grow large (≤20 × ~500KB worst case) | `save.ts` runHistory | Low | Likely | Save quota exhausted → B2 fires | Long sessions with replays | Cap blob size or sample-replay |
| B16 | Phaser 4 RenderNodesConfig type mismatch (cast to unknown) | `src/main.ts` (in uncommitted diff) | Low | Confirmed | None now; latent for future Phaser updates | Phaser version bump | Track upstream; remove cast when types fixed |
| B17 | Daily Challenge schema in save but no UI | `SaveManager.ts` `dailyChallenge` field | Low | Confirmed | Dead schema field | N/A | Either ship UI or remove field & migration |
| B18 | `bestEndlessSeconds` / `bestIronmoorSeconds` in save but no Endless scene path found | `save.ts` | Low | Likely | Dead fields | N/A | Confirm and remove if dead |
| B19 | Mobile touch coverage shallow | `e2e/mobile-smoke.spec.ts` | Medium | Confirmed | Touch UX unverified beyond one tap | Real iPhone/Android device | Add full touch e2e or mark mobile as "experimental" in store listing |
| B20 | Gamepad has no e2e coverage | `e2e/**` | Medium | Confirmed | Gamepad bug could ship undetected despite unit tests | N/A | Add gamepad e2e via Playwright `dispatchEvent('gamepadconnected', ...)` |
| B21 | Boss `taxman` victory path not in `onActComplete` flow | per CLAUDE.md note | Medium | Likely | Race risk if player dies same frame as taxman kill — could double-resolve | Simultaneous death + boss kill | Add integration test asserting single resolution |
| B22 | TimeManager pause-token nesting during ActIntermission inside Pause | TimeManager + ActIntermissionScene | Medium | Possible | Player pauses, then act-intermission fires (timing edge): mismatched pause refcount | Trigger boss kill while paused | Refcount audit + test |
| B23 | Locale change `scene.stop() + start()` may drop returnTo payload | SettingsScene locale row | Low | Likely | Player at Croft → Settings → change locale → back to MainMenu instead of Croft | Test the path | Pass returnTo through restart |
| B24 | Long-session memory growth uncovered for un-Almanac arrays | `seenEnemies`, `firstTimeEventsFired`, `discoveryLog` | Low | Possible | Save bloat over hundreds of runs | Long-term play | Add periodic compaction |
| B25 | 161 weak-assertion tests (`toBeTruthy`/`toBeDefined`) | various `*.test.ts` | Low | Confirmed | False sense of coverage | N/A | Tighten in dedicated cleanup pass |
| B26 | report-gpt5.5-250426.md committed to repo root | `report-gpt5.5-250426.md` | Low | Confirmed | Internal audit doc shipped to git history | N/A | Move to `docs/superpowers/specs/` or .gitignore |

---

## 6. Game Design Critique

**Core loop** — Drift mechanic is the unique selling point. Strong identity. Weapons + level-up + evolution + permanent shop + variants + relics + runes + routes + curses + Croft = a loop with five orthogonal progression vectors. **Risk:** complexity ceiling. New player at MainMenu sees ~7 buttons. Veteran will love it; first-timer may bounce.

**Progression**
- Per-run: XP curve to 30, then echo cards every 1000 XP. Smooth.
- Cross-run: gold → 16 permanent upgrades + 14 variants + Almanac discovery + Croft trophies + Chronicle history. Excellent breadth.
- **Gap:** No mid-tier "unlock just for trying" — all unlocks gate behind victory or specific challenges. First 5 deaths feel flat. **Recommendation:** Sprinkle "First Death", "First Boss Damage", "First Evolution" cosmetic Croft mantel pieces.

**Difficulty curve** — Enemy HP +10%/min (rebalanced 0.05→0.10 per playtest comments in `enemies.ts`). Player damage scaling per level + permanent upgrades. Looks tuned via real data, not vibes. Elite spawn 10% post-2min adds edge. **Risk:** Curses + variants stack — without a difficulty preview, players in their first cursed run may bounce.

**Rewards**
- Level-up: 3 cards + 1 reroll. Good cadence.
- Boss kill: spectacle + intermission. Strong moment.
- Echo cards post-30: meaningful overflow loop.
- Relics: 18 across 3 rarities. Drop affinity per source. Satisfying.
- **Gap:** No mid-run gold sink. Gold accumulates only for between-runs. Adding an in-run shop node (Bargain) was attempted in `nodeBanks.ts` — verify it surfaces.

**Pacing** — Wave timeline ends at 1050s (~17.5 min). Final boss `taxman` is the cap. Long enough to feel earned, short enough to retry. **Risk:** Any single point of grinding tedium will be amplified by the 17-min run length. Need playtest data on minutes 8–12 (the typical "boring middle" of survivor games).

**Clarity**
- Drift mechanic explained in tutorial hint, but not practiced.
- Evolution recipe (lv5 weapon + matching passive) is **not surfaced in level-up cards** unless it appears as a legendary card. New players may never realize the system exists.
- Curses are picker tiles with no "first time" explanation.
- **Recommendation:** First-evolution-eligible card should include a tooltip "Evolution available!"

**Balance**
- 8 weapons, 7 evolve. Bagpipes is utility-only (intent per CLAUDE.md — disclose this in Almanac).
- `claymore` eDPS ~13.1 vs `bagpipe_blast` ~50 (per code comments). Two orders of difference. Compensated by claymore's huge per-hit dmg making it satisfying. Verify "feel" vs "math" with playtest.
- Permanent shop: `extra_choice` (800g, +33% card value), `revival` (600g) priced as power outliers. Sound design.

**Replayability** — Massive. 14 variants × 6 routes × 5 curses × 18 relics × 30 runes (when enabled) × seasonal Burns Night. Gated unlocks (`runs_in_coastal_only`, `burns_night_full_evo`) reward specialization. Strong.

**Player motivation** — Multiple meaningful goals: fastest time, most kills, all variants, full Almanac, cursed victories. Each addresses a different player archetype.

**Design weaknesses**
- FTUE is not a designed flow — it's "the hub minus locked things."
- No daily challenge UI despite save schema field.
- Endless mode bones in save schema with no scene path.
- Rune system shipped at the data layer but inert at runtime. Player-facing nothing.

**Top design recommendations**
1. Build a 30-second drift practice as the first-run gate. Drift is the identity; treat it like one.
2. Surface evolution-eligibility in level-up cards with a glyph.
3. Either ship runes (flip the flag, verify effect application end-to-end) or remove them from public messaging until U2.
4. Gate hubs (Croft, Almanac, Chronicle, MetaShop, Deeds) behind first run.
5. Add a 10-minute mark "second wind" beat in audio + minor reward to keep player engaged through the boring middle.

---

## 7. Game Feel Critique

Note: this is static analysis; I did not play the game.

**Controls / input**
- Keyboard + gamepad + touch all wired (gamepad rebind fix incoming). Drift mechanic is *the* feel signature.
- `delta` cap `Math.min(delta, 100)` per CLAUDE.md — protects against tab-backgrounding warps.
- Soft world boundaries (no hard walls) — kind, classy choice.

**Responsiveness**
- Arcade physics, fixed-step 60fps for replay determinism (`main.ts`). Good.
- Hit freeze 20ms via real `setTimeout` (not delayedCall) per CLAUDE.md — correct.
- Knockback divides by mass manually (per CLAUDE.md gotcha) — correct.

**Camera** — Pixel art, roundPixels, no antialiasing. Minimap exists. Camera framing not assessed.

**Feedback**
- JuiceSystem (1190 LoC) covers damage numbers, kill bursts, particle trails, hit freeze, boss death spectacle, combo counter, toast notifications.
- Reduce-particles + motion-scale + reduce-flashing settings — accessibility-aware juice. Excellent.
- AudioSystem throttles hit SFX via `lastHitTime` (per CLAUDE.md) — prevents AoE audio spam.

**Animation timing** — Not assessed visually.

**UI feel**
- HUD elements `setScrollFactor(0)` individually (not on container) — explicit Phaser bug workaround.
- Level-up card stagger via tickers — likely satisfying.
- Modal pattern is consistent (backdrops `setInteractive()`).

**Friction points** (hypothesized; needs playtest)
- Hub button density at MainMenu = decision paralysis.
- Reroll is one-per-level — generous, but undocumented in-flow.
- Skip-Intermissions = silent route pick = friction-removal that hides design.

**Recommendation** — Run a real-device 30-min playtest with screen recording. Mark every moment of "?" or "ugh" with a timestamp. Triage.

---

## 8. Art, UI, and Presentation Critique

**Visual consistency** — All sprites generated programmatically in `BootScene`. Single source = forced consistency. Strong.

**Style cohesion** — `ART_STYLE_BIBLE.md` defines 5 tonal palettes (Hearth/Wild/Fey/Grave/Wild Comedy). Disciplined. CLAUDE.md mandates palette check in PRs.

**Readability** — Pixel art mode + colorblind LUT (4 modes via SVG feColorMatrix per memory). Captions w/ scale. Pre-flagged accessibility-conscious.

**UI layout** — Multiple hubs (MainMenu, Croft) suggest a maturing interface. Risk: density vs clarity (§3, §6).

**Animation polish** — JuiceSystem prewarmed pools (impact 80, trails 60, bursts 50, boss particles 35) suggest tuned VFX scaling. Good.

**Effects** — F1 Haar fog shipped via Phaser 4 render-node infra (+1.8 KB gzip per memory). Shader registry open for palette swap, outline, dissolve. Solid foundation.

**Accessibility**
- Photosensitivity warning splash (one-shot, persisted). ✓
- Reduce-flashing setting wired to JuiceSystem alpha/duration caps. ✓
- Colorblind LUT (4 modes). ✓
- Captions w/ scale. ✓
- Motion scale (0–1). ✓
- Banter frequency (off/sparing/normal/chatty). ✓
- Assist Mode: **persisted but no UI, no runtime effect.** Promise broken. Either ship or hide.

**Placeholder / sloppy** — Internal QA ran `ActIntermissionScene.smoke.test.ts` checking for TODO/TBD/XXX/PLACEHOLDER markers in content. Zero violations. Repo TODO/FIXME count: 2 (both in the placeholder-detector test itself).

**Recommendation** — Wire Assist Mode now or hide it. Shipping a settings toggle that does nothing is the kind of small thing that erodes trust.

---

## 9. Narrative / Continuity Review

**Has narrative? Yes — substantial.**

The game ships in two locales: English reference + Scots (`scs`) overlay, with parity guards in CI (`i18n.locale.test.ts` enforces both SCS→EN one-way subset and EN→SCS for `ui.banter.*`). Scots is code-split via `ensureLocaleReady('scs')` — English-only players never download it. This is a serious localization architecture.

**Voice register** — `docs/VOICE_CARD.md` codifies Hearth (Still Game warmth) vs Edge (Limmy bite). Memory entry `feedback_voice_register` confirms registers are validated.

**Banter** — `data/banter.ts` is 1657 lines, 22 contexts, B1 Phase 1+2+3 shipped (memory entry: 324 leaves). Conditional, accessibility-aware (synthesized speech). Phase 4 gated on Gaelic review — appropriate caution.

**Continuity / consistency**
- `CULTURAL_SENSITIVITIES_RESEARCH.md` is consulted for Highland Clearances, Culloden, trademark, political framing. Disciplined.
- Burns Night seasonal event tied to real calendar. Tone check needed for non-Scottish audiences (does "Burns's Wee Beastie" land?).
- Variant unlock flavor texts not audited individually here — recommend a copy editor pass on all 14 unlock criteria descriptions.

**Tone risks**
- Glaswegian patter is the soul. Memory entries (`project_glaswegian_soul`, `feedback_voice_register`) confirm. **Risk:** without an in-game tonal warmth-vs-bite legend, a confused new player may misread Limmy-style enemy banter as random hostility instead of intentional comedy.
- Doric & Shetlandic variants ship with native-review blockers open per memory `project_v2_variants_status`. **Do not ship publicly until reviews land.**

**Text quality** — No dead text references found by codebase searches. i18n parity guard is the structural safety net.

**Recommendation**
- Block public ship on: Doric native review, Shetlandic native review, Burns Canongate audit (per memory `project_v2_variants_status` and `project_c2_lore_status`).
- Add a settings page line about voice registers ("Game uses Glaswegian patter — turn off banter under Settings > Audio").

---

## 10. Codebase Review

**Architecture** — Scene-based Phaser, with systems instantiated and orchestrated by `GameScene`. Data-driven via `src/data/*.ts`. Clean separation.

**Maintainability**
- Strict TS, lint clean, tsc clean.
- Tests deeply cover utility logic. Scene logic relies on smoke + e2e.
- Authoring conventions in CLAUDE.md (e.g. extract testable helpers from scenes due to Phaser-touches-window vitest quirk) — followed in new code (`actIntermissionResolve.ts`, `resumeNodeMapTarget.ts`, `returnTarget.ts`, `nodePromptNav.ts`).

**Coupling**
- `GameScene` is the gravity well (26 inbound imports). High debt.
- `WeaponSystem` mutated externally by GameScene every frame for damage/aoe/cooldown multipliers — tight coupling, but documented and consistent.
- `RuneEffectBag`, `TempBuffBag`, `RunModifiers` — bag-pattern for cross-cutting state. CLAUDE.md flags bag-vs-cached-field divergence as a known footgun (already cost the team once); guarded by typed `RouteModifierDeltaKey` set.

**Data flow** — Largely unidirectional: data → systems → scene → UI. Replay path is well-isolated (`replayDeterminism.test.ts`).

**State management**
- localStorage ×3 keys (segregated by concern).
- `RunPersistenceBridge` mediates mid-run snapshot.
- TimeManager owns time scale + pause refcount.
- Run state lives in `IRunState`, snapshot/restored on resume.

**Error handling**
- Save load: try/catch → defaults.
- Save write: try/catch → silent. (B2)
- Coercion: exhaustive per-field type guards.
- No global unhandled-rejection handler observed in `main.ts`.

**Save / load** — §11. Solid migration discipline. Silent quota is the one rough edge.

**Tests** — 4067 unit, 24 e2e. Above-industry. Weak-assertion sweep needed (B25). Gamepad e2e missing (B20). Mobile touch e2e shallow (B19).

**Performance risks**
- WeaponSystem's `cachedSortedEnemies[]` per-frame O(n log n) at 400 enemies — measure.
- 200 projectile pool, expanded to 350 per BalanceConfig — verify.
- JuiceSystem prewarmed pools — good.
- `GameScene.update()` likely the per-frame hot path — profile under heavy boss VFX.

**Technical debt**
- `GameScene` decomposition (B8).
- UpgradeCards window listener pattern (B11).
- Singleton inter-scene comms like `pendingCurseKey` (B13).
- Phaser 4 render-node type cast (B16).
- Dead-schema fields (DailyChallenge, Endless) (B17, B18).

**Recommended refactors (priority order)**
1. Migrate UpgradeCards to scene-scoped keyboard, matching ActIntermission pattern.
2. Decompose GameScene by extracting `GameOrchestrator`.
3. Replace `pendingCurseKey` singleton with scene data payload.
4. Add explicit save-failure event + UI consumer.
5. Tighten weak-assertion tests in a dedicated PR.

---

## 11. Edge Case Matrix

| Edge case | Area | Expected | Likely current | Risk | Test/fix |
|---|---|---|---|---|---|
| First launch, no save | Boot | Default save loaded silently | Works (defaults across all 3 systems) | Low | covered |
| Malformed JSON in save | Persistence | Default save loaded; toast? | Defaults loaded silently, no toast | Medium | Add toast |
| Quota exceeded on save write | Persistence | User warned | Silent fail | High | Add toast (B2) |
| Save schema v18 loaded by v17 build | Persistence | Coerce + drop unknown | Works (forward-compat) | Low | covered |
| Save schema v0 loaded by v17 build | Persistence | Migration chain or default | Default | Low | covered |
| Reload mid-run during ActIntermission | Resume | Resume into intermission | Unverified | Medium | Add test (§3 quitting) |
| Reload mid-run during Pause | Resume | Resume paused | Unverified | Medium | Add test |
| Reload mid-run with held relics | Resume | Relics restored | **Fixed in uncommitted** (B3) | Critical until merged | merge |
| Reload mid-run in Act 3 | Resume | Correct stretch map | **Fixed in uncommitted** (B3) | Critical until merged | merge |
| Reload mid-run with active route timer | Resume | Remaining time recalc | **Fixed in uncommitted** | Critical until merged | merge |
| Player dies same frame as boss kill | Game state | Single resolution | Untested (B21) | Medium | Add test |
| Player rebinds gamepad dash | Input | Live binding | **Fixed in uncommitted** (B4) | Critical until merged | merge |
| Player rebinds keyboard dash | Input | Live binding | Works (refreshKeyBindings) | Low | covered |
| Player connects gamepad mid-run | Input | Detected, usable | Unverified | Medium | Manual test |
| Player disconnects gamepad mid-run | Input | Falls back to keyboard | Unverified | Medium | Manual test |
| Mobile touch tap on level-up card | Input | Card selected | Likely works (1/2/3 shortcuts; tap not e2e tested) | Medium | Add e2e |
| Mobile virtual joystick during pause | Input | Joystick disabled | Unverified — overlay backdrop intercepts pointer | Medium | Add test |
| Tab backgrounded for 5 min | Time | Resume cleanly | `delta` cap protects | Low | covered |
| Browser tab close mid-run | Persistence | pagehide saves IRunState | Wired (RunPersistenceBridge) | Low | covered |
| Locale change mid-run | Settings | Strings re-resolve | Scene restart; returnTo may drop (B23) | Low | Test |
| Skip Intermissions = on, boss kill | Game | Auto-pick default route | Silent (B9) | Medium | Toast |
| Reroll then exit during reroll tween | UI | Tween cancelled cleanly | Untested | Low | Test |
| Open settings during level-up | UI | Blocked (modal owns input) | Likely works (backdrop interactive) | Low | Test |
| Croft → Settings → Back | Navigation | Returns to Croft | **Fixed in uncommitted** (B6) | Medium until merged | merge |
| Almanac → Chronicle → Almanac → Back | Navigation | Returns to MainMenu (or chained source) | Unverified — risk of stack accumulation | Medium | Test |
| Curse picked, run started, retry from GameOver | State | Same curse re-applied? | Locks to last selection (no re-pick) | Medium | UX choice |
| Burns Night midnight crosses mid-run | Seasonal | Clear policy | Unspecified | Low | Decide + test |
| Run history hits 20 entries | Persistence | FIFO drop oldest | Works (slice) | Low | covered |
| Replay blob > localStorage quota | Persistence | Older replays lost first | FIFO truncation; quota silent (B2) | Medium | Cap blob size |
| Variant unlocked mid-run | Progression | Unlock toast at run end | Unverified | Low | Test |
| All upgrades maxed in shop | Economy | Shop shows MAX | Likely works | Low | Confirm |
| 17-min full survival | Performance | Stable framerate | `marathon-smoke.spec.ts` covers | Low | covered |
| Window resize during play | Rendering | Letterbox / fluid | Unverified | Medium | Test |

---

## 12. Prioritized Fix List

### Must Fix Before Release

| # | Issue | Why | Effort | Impact | Owner |
|---|---|---|---|---|---|
| MF1 | **Merge the uncommitted resume / input / nav bundle (B3, B4, B5, B6)** | Critical resume bugs + input rebind silent failure + controller nav blockers; CI must go green | M | High | Code |
| MF2 | **Decide rune card flag (B1)** — flip to true with full effect verification, or remove rune messaging from public comms | Public-trust risk if shipping copy talks about runes that never appear | M | High | Design + Code |
| MF3 | **Wire or hide Assist Mode (B7)** | Accessibility settings that do nothing erode trust; pick one stance | S–M | High | Code + Design |
| MF4 | **Toast on save failure (B2)** | Players lose progress silently in private browsing / quota | S | High | Code |
| MF5 | **Block on Doric + Shetlandic + Burns Canongate native reviews** (per memory `project_v2_variants_status`, `project_c2_lore_status`) | Cultural-sensitivity exposure | External | High | Design |
| MF6 | **Test simultaneous boss-kill + death (B21)** | Possible double-resolve / softlock | S | High | QA + Code |
| MF7 | **Verify P4-13 mobile fix on real device** | mobile-smoke.spec.ts says hang investigated; trust real hardware not emulator | S | High | QA |
| MF8 | **Confirm `bagpipes` is documented as utility-only in Almanac** (B14) | "Get all evolutions" goal otherwise unwinnable | S | Medium | Design |

### Should Fix Before Release

| # | Issue | Why | Effort | Impact | Owner |
|---|---|---|---|---|---|
| SF1 | First-run flow gating hubs (§3, §6) | Decision paralysis at MainMenu | M | High | Design |
| SF2 | Drift micro-practice in first run | Drift is the soul; teach it | M | High | Design |
| SF3 | Skip-Intermissions toast (B9) | Hidden choice = invisible design | S | Medium | Code |
| SF4 | Evolution-eligibility glyph in level-up cards | Players miss the system | S | High | Code |
| SF5 | UpgradeCards migrate to scene-scoped keyboard (B11) | Listener-leak risk on edge paths | S | Medium | Code |
| SF6 | Gamepad e2e spec (B20) | Primary input untested end-to-end | M | Medium | QA |
| SF7 | Mobile touch e2e expansion (B19) | Touch UX unverified | M | Medium | QA |
| SF8 | Pause + Settings dedicated e2e specs | Coverage gap in critical UX | M | Medium | QA |
| SF9 | Replace `pendingCurseKey` singleton (B13) | Footgun for cross-run state bleed | S | Medium | Code |
| SF10 | Cap replay blob size or sample (B15) | Prevents quota exhaustion | M | Medium | Code |
| SF11 | Move `report-gpt5.5-250426.md` out of repo root (B26) | Internal audit doc shouldn't ship | XS | Low | Code |
| SF12 | "Last patch" banner on MainMenu | Returning player engagement | S | Medium | UI |
| SF13 | Almanac progress badge (X / Y discovered) | Surface meta-collection goal | S | Medium | UI |
| SF14 | "Change Variant" / "Change Curse" on GameOver | Friction reduction on retry | S | Medium | UI |
| SF15 | TimeManager pause-refcount audit + test (B22) | Edge-case pause integrity | M | Medium | Code |

### Nice to Have

| # | Issue | Why | Effort | Impact | Owner |
|---|---|---|---|---|---|
| NTH1 | GameScene decomposition (B8) | Long-term maintainability | L | Low (now) / High (later) | Code |
| NTH2 | Tighten 161 weak-assertion tests (B25) | Coverage quality | M | Low | QA |
| NTH3 | Daily Challenge UI or schema removal (B17) | Either ship or clean | M / S | Low | Design + Code |
| NTH4 | Endless mode UI or schema removal (B18) | Same | M / S | Low | Design + Code |
| NTH5 | First-5-deaths cosmetic Croft mantel pieces | Early-game motivation | S | Medium | Design |
| NTH6 | Music genre transition fade audit | 1-frame divergence — likely inaudible | XS | Low | Audio |
| NTH7 | Compaction policy for `seenEnemies`, `discoveryLog` (B24) | Long-term save bloat | S | Low | Code |
| NTH8 | Locale change preserves returnTo (B23) | Polish | S | Low | Code |
| NTH9 | CroftScene timer cleanup verification (B12) | Memory hygiene | S | Low | Code |
| NTH10 | Confirm `CombinationsPreviewScene` not reachable in prod | Defense | XS | Low | Code |

---

## 13. Test Plan

**Smoke**
1. Boot → MainMenu loads in <2s.
2. Start Game → see player + first wave within 2s.
3. Pause → Resume restores time scale.
4. Quit → reload → resume mid-run.
5. Settings change → persists across reload.

**Full playthrough**
1. Clean run, classic variant, default settings: complete in 17min, no errors.
2. Cursed run: each of 5 curses applied, one full run each.
3. Each variant once (14 runs).
4. Each route picked (6 routes × 2 acts).
5. Each weapon evolution (7 evolutions).
6. Each boss kill (4 named bosses + final).

**Regression**
1. Re-run all 24 e2e specs after every PR.
2. Run replay-determinism test after any physics/timing change.
3. Migrate save v17 → v18 → ... when bumped; assert no field drops.

**Save/load**
1. Empty save → defaults.
2. Malformed JSON → defaults.
3. v0/v1/...vN saves → migrate to current.
4. Quota-exceeded write → toast surfaces (post-MF4).
5. Mid-run quit + resume: classic, cursed, ironmoor, with relics, with route timer active, in Act 1/2/3.

**Input**
1. Keyboard rebind dash → works in run.
2. Gamepad rebind dash → works in run (post-MF1).
3. Gamepad connect/disconnect mid-run.
4. Mobile touch on every UI surface (pause, level-up, intermission, prompt, hubs).

**Scene transition**
1. Every navigation arrow in §2's graph.
2. Croft cycle: Croft → Settings → Back; Croft → Almanac → Chronicle → Back.
3. Locale change from each scene; verify returnTo preserved.

**Performance**
1. `marathon-smoke.spec.ts` (30-min soak, FPS + audio).
2. Heavy-boss VFX scene at 400 enemies + max projectiles.
3. Real-device mobile profile: iPhone SE-class, 30-min run.

**Settings**
1. Each of 27 settings: change → reload → persisted.
2. Each setting: observable runtime effect (or removed if not).

**Accessibility**
1. Photosensitivity warning splash: shows on first launch only.
2. Each colorblind LUT mode visible.
3. Captions on, scale 0.8/1.0/1.4.
4. Reduce-flashing on: confirm hard cap on alpha/duration.
5. Banter frequency: each of 4 settings.
6. Assist Mode: post-MF3 verification.

**Edge case**
1. From §11 matrix — automate the high-risk rows.

**Platform / build**
1. Chrome / Firefox / Safari desktop.
2. Mobile Safari + Mobile Chrome.
3. Vite production build size (current ~822 KB gzip total).
4. Cloudflare Pages deploy verifies (per memory `reference_deploy_cloudflare`).

---

## 14. Final Verdict

**What it does well**
- Identity. The drift mechanic + Glaswegian voice + Soul charter discipline produce a game that *feels intentional* in a genre full of asset-flip clones. This is the moat.
- Engineering culture. 4067 unit tests, 24 e2e, full-matrix CI, three migration chains, parity-fenced i18n, accessibility settings designed-in not bolted-on.
- Content density. 14 variants × 6 routes × 5 curses × 18 relics × 30 runes × 22 banters × seasonal events. The replay surface is genuinely large.
- Persistence robustness. Defensive coercion on every field, no silent data loss except on quota.

**What is most likely to make players quit**
1. Hub overload at MainMenu → "I don't know what to click" → bounce.
2. Drift confusion in first 60s → "controls feel broken" → bounce.
3. Missing runes despite (presumed) marketing → "false advertising" → review damage.
4. Silent save failure on resource-constrained browsers → "I lost my progress" → review damage.

**What feels unfinished or sloppy**
- Rune card flag off (B1).
- Assist Mode persisted but inert (B7).
- DailyChallenge + Endless schema fields with no UI (B17, B18).
- Internal audit doc committed to repo root (B26).
- 41 uncommitted files at session start (release hygiene).

**What should be fixed first**
The MF1–MF8 list. In order. MF1 is non-negotiable (the in-flight bundle clears 4 of the 5 highest-severity audit findings). MF2 (rune flag) is the trust gate. MF3 (Assist Mode) is a signal.

**Most improvement, least effort**
- Toast on save failure (MF4). 1 hour. High impact.
- Skip-Intermissions toast (SF3). 30 minutes. Medium impact.
- Evolution-eligibility glyph (SF4). Half day. High impact.
- Move report doc out of root (SF11). 1 minute. Low impact, but signals discipline.
- "Last patch" banner (SF12). Half day. Medium retention impact.

**Most improvement, more time**
- First-run flow + drift micro-practice (SF1, SF2). 3–5 days. Defines the FTUE identity. Highest single-feature ROI.
- GameScene decomposition (NTH1). 1–2 weeks. Pays back forever in feature velocity.
- Gamepad + mobile e2e expansion (SF6, SF7). 3–5 days. Closes the platform-trust gap.

**Bottom line.** This is a game with a soul, an architecture, a test culture, and content. It is not ready *today*. With one focused merge sprint (MF1–MF8 in 1 week) plus a follow-up week of SF1–SF8, it is ready for a public beta. The masterpiece bar requires the FTUE pass and the rune decision before "1.0."

---

End report.
