# Wild Haggis Survivors Deep Audit Report

Date: 2026-04-25

Scope: audit-only static and test-assisted review of the full repository. No code or configuration changes were made as part of the audit.

Verification performed:

- `npm test -- --run` passed: 392 test files, 4047 tests.
- `npm run lint` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` and Playwright E2E were not run because they produce build/test artifacts and the audit was constrained to no project modifications.

## 1. Executive Summary

Overall assessment: the project is substantially more complete than a prototype. It has a strong identity, broad unit coverage, coherent data-driven content, and unusually serious accessibility intent. It is not release-ready because several player-visible systems are only partially integrated or are missing resume/runtime wiring.

Main strengths:

- Distinct Scottish folk-survivor identity with Croft, Gran, routes, curses, banter, relics, and almanac framing.
- Broad automated test base with over 4000 passing unit tests.
- Strong save migration and data-coercion posture.
- Good architecture instincts in many pure helper modules and extracted systems.
- Strong accessibility effort: photosensitivity warning, captions, high contrast, colorblind filters, UI scale, reduced flashing, motion settings.

Main weaknesses:

- `GameScene` remains a large integration god object and is where the highest-risk bugs concentrate.
- Active-run resume does not serialize newer run systems such as runes, relics, node maps, node outcomes, temp buffs, and route side-effect state.
- Runes are player-visible but not consumed by Player, WeaponSystem, XP, Spawn, gold, or pickup systems.
- Gamepad rebinding is saved in settings but runtime input still polls hardcoded buttons.
- Onboarding exposes too many meta systems before the player has learned the baseline game.

Highest-risk issues:

- Critical: resume can corrupt or lose run state after routes, nodes, relics, or runes.
- High: rune cards can be selected but most effects do nothing.
- High: controller players can rebind inputs and see no gameplay effect.
- High: route side effects with timers/cached multipliers are not resumable.

Release readiness: near-alpha to beta quality technically, but not release-ready. The foundation is strong, but trust-breaking integration gaps must be fixed before public release.

## 2. Project Map

Engine/framework:

- Phaser `^4.0.0`, TypeScript, Vite, Vitest, Playwright, PWA plugin.
- Note: `AGENTS.md` says Phaser 3, but `package.json` declares Phaser 4. This documentation mismatch should be corrected.

Main entry points:

- `src/main.ts`: Phaser game config, scene list, fixed-step Arcade physics, PWA registration, canvas ARIA attributes, shader registry.
- `src/scenes/BootScene.ts`: procedural texture baking, locale application, photosensitivity warning, global systems startup.
- `vite.config.ts`, `playwright.config.ts`, `package.json`: build/test/E2E configuration.

Key scenes/screens/states:

- `BootScene`: splash, generated assets, warning, quickplay/dev export.
- `MainMenuScene`: main hub, resume/fresh run, daily challenge, settings, seed/rerun links.
- `MenuScene`: variant/loadout selection.
- `CroftScene`: Gran's Croft hub, start run, shop, chronicle, settings, trophies.
- `CurseScene`: curse or clean-run pre-run picker.
- `GameScene`: core runtime.
- `ActIntermissionScene`: Moor Road route picker after act bosses.
- `GameOverScene`: victory/death results, stats, rerun, shop, menu.
- `ShopScene` and `MetaShopScene`: permanent progression economies.
- `ChronicleScene`, `AlmanacScene`, `DeedsScene`: history, codex, achievements.
- `SettingsScene`, `SettingsInputScene`: accessibility/audio/input settings.

Core systems:

- Player/input: `src/entities/Player.ts`, `src/utils/input.ts`, `src/input/InputMapper.ts`.
- Combat/spawn: `src/systems/WeaponSystem.ts`, `src/systems/SpawnSystem.ts`, `src/entities/Enemy.ts`.
- Progression: `src/systems/XPSystem.ts`, `src/scenes/game/LevelUpFlow.ts`, `src/data/upgrades.ts`.
- Run lifecycle: `src/scenes/game/RunLifecycle.ts`, `RunExitComposer.ts`, `RunPersistenceBridge.ts`, `RunHistoryRecorder.ts`.
- Moor Road: `src/data/routes.ts`, `src/systems/NodeMapSystem.ts`, `src/data/nodeBanks.ts`, `src/ui/NodePromptUI.ts`.
- Relics: `src/systems/RelicSystem.ts`, `src/systems/relics/RelicEffectDriver.ts`.
- Runes: `src/data/runes.ts`, `src/systems/runes/*`.
- Audio/music: `src/systems/AudioSystem.ts`, `src/systems/music/*`.
- UI/juice: `src/systems/JuiceSystem.ts`, `src/ui/*`, `src/scenes/game/PauseMenu.ts`.
- Persistence: `src/utils/save.ts`, `src/core/SaveManager.ts`, `src/core/SettingsManager.ts`.

Unclear or not fully inspectable:

- Browser feel, animation timing, and layout polish were not verified visually in this pass.
- Playwright E2E was not run under the audit-only constraint.
- Build output was not regenerated.

## 3. Player Journey Review

| Stage | What likely happens | What works | What fails or feels weak | Recommendations |
|---|---|---|---|---|
| First launch | Boot splash, photosensitivity warning, MainMenu. | Strong safety posture and identity. | Many menu choices appear before the player knows the game. | Add a first-run streamlined "Start clean run" path. |
| Main menu | Resume/new run, daily, settings, seed/rerun. | Useful for returning players. | Advanced tools compete with primary play. | De-emphasize daily/seed/rerun until after first completed run. |
| Loadout | Variant carousel and stats. | Sidegrade framing and unlock progress are clear. | "Play" routes to Croft, not gameplay. | Rename the action or collapse Menu/Croft path. |
| Croft | Hub with Gran, trophies, shop, chronicle, settings. | Strong warmth and identity. | Related subscreens often return to MainMenu instead of Croft. | Pass a `returnTo` target into subscreens. |
| Curse picker | Player chooses curse or clean run. | Clear risk/reward idea. | Too early for first-time players. | Lock or soft-hide curses until the player has seen baseline play. |
| Early game | FTUE teaches move, auto-fire, dash, XP, drift. | Paused overlay prevents missing basics. | Does not teach objective, bosses, routes, relics, runes, nodes. | Add staged contextual tips for first boss, route, node, relic, rune. |
| Core loop | Move, kill, collect, level, evolve, survive bosses, bank gold. | Solid survivor structure with strong flavor. | System density can blur strategic goals. | Add concise HUD explanations of current route/relic/rune effects. |
| Mid-game | Act routes, nodes, relics, curses, banter, bosses. | High variety. | Resume and route state risks can break continuity. | Fix persistence before relying on this as a selling point. |
| Failure/retry | Death/victory screen with stats, gold, shop, replay/rerun. | Failure tone is compassionate and informative. | Replay/watch paths need stronger meta-write guards. | Add E2E for replay completion and history invariants. |
| Returning player | Resume offered from MainMenu. | Resume feature exists. | Resume is currently a high-risk broken flow. | Treat resume as a release blocker. |

## 4. Scene / Screen / State Audit

| Scene/state | Purpose | Issues found | Edge cases | Severity | Recommendations |
|---|---|---|---|---|---|
| Boot | Generate textures, apply locale, show warning, start globals. | Runtime procedural bake cost, Phaser 3/4 doc mismatch. | Texture validation repair can hide missing asset process issues. | Low | Correct docs and profile boot on low-end devices. |
| MainMenu | Entry hub. | Too many advanced affordances early. | One-click abandon/start-fresh flow can surprise players. | Medium | Separate first-run and returning-player menu layout. |
| Menu | Variant/loadout. | Button naming does not match destination. | Back/forward relationship with Croft is conceptually muddled. | Medium | Clarify whether Menu or Croft owns pre-run selection. |
| Croft | Warm hub. | Back routing and subscreen returns are inconsistent. | Entering Chronicle/Settings from Croft returns to MainMenu. | Medium | Make Croft a true parent hub with return target state. |
| Curse | Pre-run difficulty wager. | Too much before baseline run. | Keyboard/gamepad navigation coverage is not obvious. | Medium | Gate curses or default-focus clean run. |
| Game | Core runtime. | Resume/runes/input integration gaps; god object. | Closing tab mid-run after route/relic/rune can alter the run. | Critical | Fix persistence and split integration controllers. |
| ActIntermission | Route cards after act bosses. | No undo/back; route side effects not fully resumable. | Skip setting can mask route comprehension. | High | Persist route effects and add route-history HUD. |
| GameOver | Run result and retry/shop navigation. | Replay mode appears guarded for gameplay save but not all history writes. | Missing payload falls back to MainMenu. | Medium | Guard all meta writes during replay playback. |
| Shop/MetaShop | Long-term upgrades. | Two economy/save surfaces add complexity. | Storage failure silently drops writes. | Medium | Show best-effort save failure messaging. |
| Chronicle | Run history/codex link/replay. | Back target is MainMenu even when launched from Croft. | Replay completion path may pollute meta history. | Medium | Add return target and replay-history invariant tests. |
| Almanac/Deeds | Collection and achievement browsing. | Canvas-only accessibility limits. | Keyboard nav varies by screen. | Medium | Add consistent focus model and return target. |
| Settings | Comfort/audio/accessibility. | Assist Mode controls are scaffold-only. | Player can enable invincibility with no effect. | Medium | Hide or implement. |
| SettingsInput | Keyboard/gamepad rebinding. | Gamepad rebinding is not read by gameplay input. | Controller users lose trust. | High | Runtime should use `gamepadBindings`. |

## 5. Bugs and Technical Risks

| Title | Location/file/system | Severity | Confidence | Player impact | Reproduction idea | Suggested fix |
|---|---|---|---|---|---|---|
| Active-run resume omits newer run systems | `src/core/SaveManager.ts`, `src/scenes/game/RunPersistenceBridge.ts` | Critical | Confirmed | Closing/reopening a run can lose relics, runes, node progress, temp buffs, and timed route effects. | Pick a relic/rune/node reward, close tab, resume. | Extend `IRunState` and bridge collection/hydration for relics, runes, nodes, temp buffs, route timers. |
| Resume may restore Act 2/3 while node map remains Act 1 | `GameScene.create()`, `RunPersistenceBridge.applyResume()` | Critical | Likely | Player can be sent to or shown the wrong Moor Road node path. | Save after first intermission, reload, inspect node UI and triggers. | Rebuild correct act/stretch map after resume or persist exact map. |
| Rune rewards do not affect gameplay | `GameScene.tickRuneSystem`, `runeEffects.ts`, missing consumers | High | Confirmed | Special reward cards appear meaningful but do nothing. | Pick a rune and compare damage/pickups/gold/weapon stats. | Wire a `RuneEffectDriver` into Player, WeaponSystem, XP, Spawn, pickups, gold, and pulse drains. |
| Many rune conditions are impossible | `runeConditions.ts`, `biomes.ts`, `GameScene.tickRuneSystem` | High | Confirmed | Dead cards enter the rune pool. | Inspect rune context: many fields are hardcoded false/null; live biomes do not match rune biome IDs. | Align conditions with live data or remove unavailable runes from card pool. |
| Piper Rune checks wrong weapon | `runeConditions.ts: weapon_bagpipes` | Medium | Confirmed | Text says bagpipes, code checks `bagpipe_blast`. | Equip `bagpipes` and pick Piper Rune. | Check `bagpipes`, or change copy/data to match `bagpipe_blast`. |
| Gamepad rebinding is ignored by gameplay | `SettingsInputScene.ts`, `src/utils/input.ts` | High | Confirmed | Rebinding controller dash/pause does not work. | Rebind dash to another gamepad button and start a run. | Poll configured `gamepadBindings` instead of hardcoded buttons 0, 7, and 9. |
| Assist Mode settings are not wired | `AssistMode.ts`, `SettingsScene.ts`, `SettingsManager.ts` | Medium | Confirmed | Invincibility/game speed/iframes/combo options mislead players. | Turn on Assist invincibility and take lethal damage. | Hide rows until implemented, or wire every reader into runtime. |
| Route side effects are not resumable | `routes.ts`, `RunPersistenceBridge.ts` | High | Likely | Route buffs/debuffs can disappear, restart, or become permanent across resume. | Pick `stand_yer_ground` or `through_the_kirkyard`, close tab during timer, resume. | Serialize active route side-effect state and remaining duration. |
| Croft subscreens return to MainMenu | `SettingsScene.ts`, `ChronicleScene.ts`, `AlmanacScene.ts`, `DeedsScene.ts` | Medium | Confirmed | Player feels kicked out of the hub. | Enter Settings from Croft, press Back. | Add scene data `returnTo` and use it for back buttons. |
| Node prompt has weak non-pointer support and accidental skip risk | `NodePromptUI.ts` | Medium | Confirmed | Keyboard/controller players can get stuck; clicking scrim refuses rewards. | Trigger shrine/trader node without mouse. | Add focus navigation and explicit Leave button/cancel handling. |
| Replay blobs may pressure localStorage | `replayBlob.ts`, `save.ts` | Medium | Possible | Long recorded runs can exceed storage quota and silently lose saves. | Enable record mode and finish a long run. | Cap frame count, compress frames, or store only short clips/manual replays. |
| Immediate service worker updates can surprise active tabs | `main.ts` | Low | Possible | PWA update during long session can create stale/refresh confusion. | Keep game open across deploy, resume later. | Test update lifecycle and consider player-visible refresh prompt. |

## 6. Game Design Critique

Core loop:

- The baseline loop is strong: move, auto-fire, collect XP, choose upgrades, evolve weapons, beat bosses, bank gold, unlock variants.
- The best design assets are the haggis drift identity, warm failure framing, Scottish voice, Croft meta hub, and route/relic build variety.

Progression:

- Long-term progression has many surfaces: Shop, MetaShop, variants, achievements, Chronicle, Almanac, Deeds, run history, discovery log.
- This is motivating for engaged players but too fragmented for first-time players.
- Two save systems reinforce the fragmentation from a code perspective.

Difficulty:

- Baseline survivor difficulty is likely understandable.
- Curses, routes, node bargains, relics, runes, Ironmoor, post-bell, and daily runs add many difficulty modifiers.
- The player needs clearer "what changed this run" summaries.

Rewards:

- Weapon upgrades and evolutions are conventional and readable.
- Runes are currently the most dangerous reward type because they are presented as special but are not functionally integrated.
- Relics and node rewards need resume-safe persistence to remain trustworthy.

Pacing:

- First run currently risks front-loading too many concepts.
- Mid-game likely has enough events but may feel noisy unless the player can parse which systems matter.

Replayability:

- Strong on paper: variants, curses, routes, daily, seeded reruns, relics, runes, replay.
- Replayability depends on fixing functional trust gaps first.

Suggested design improvements:

- First run should be clean, fast, and low-concept.
- Unlock curses after one run, routes after first boss, relic explanations after first drop, runes after the rune system is fully functional.
- Add a run identity panel: variant, curse, route picks, relics, runes, current act, next boss.

## 7. Game Feel Critique

Controls/input:

- Movement drift is distinctive but risky. `PLAYER.DRIFT_DEGREES = 5` makes the character intentionally veer.
- Drift can feel like input error unless taught before or immediately when first felt.
- Dash has thoughtful fallback direction and invulnerability.
- Touch input uses left joystick/right dash zone, but the right-zone affordance may be invisible to new mobile players.

Responsiveness:

- Player update intentionally uses raw delta for movement during slow motion, while cooldowns/timers use scaled delta. This is a good feel decision.
- Fixed-step Arcade physics supports deterministic replay and stable collisions.

Feedback:

- Damage numbers, particles, screen shake, toasts, captions, music changes, boss bars, minimap, and edge indicators create strong feedback.
- The downside is visual/audio overload during high enemy counts.

Camera:

- World bounds and minimap help navigation.
- Need visual verification for ultrawide, narrow, and mobile landscape layouts.

Friction points:

- Button/action naming and scene transitions can feel indirect.
- Modal input support is inconsistent.
- Resume can damage feel by making the run state feel unreliable.

## 8. Art, UI, and Presentation Critique

Visual consistency:

- The procedural pixel-art approach is cohesive and avoids generic placeholder style in many areas.
- Palette constants and UI helpers improve consistency.

Readability:

- The game risks dense HUD/menu presentation rather than weak art direction.
- Monospace text, small labels, multiple panels, route cards, node widgets, minimap, captions, and toasts can compete.

UI layout:

- Many screens have responsive clamps and high UI-scale work, but the number of hand-tuned layouts means regressions remain likely.
- Need visual regression coverage for `uiScale=1.4`, mobile landscape, and small desktop windows.

Accessibility:

- Strong comfort settings exist.
- Major gap: canvas UI is not truly screen-reader navigable despite canvas `role="application"` and ARIA label.
- Gamepad/keyboard accessibility is incomplete in interactive modals.

Recommendations:

- Add a global focus/navigation abstraction for every menu/modal.
- Add visual regression screenshots at common accessibility settings.
- Keep critical instructions plain and concise even when flavor copy is dialect-rich.

## 9. Narrative / Continuity Review

The game has meaningful narrative texture rather than a linear plot. Croft, Gran, banter, routes, relics, curses, and the almanac create a strong world.

Strengths:

- Warm, compassionate failure tone.
- Strong local identity without feeling like generic fantasy reskinning.
- Gran/Croft framing gives meta progression emotional grounding.

Issues:

- Some rune lore describes unavailable world states: fog, cold, coastal, urban, dusk, cairns, water hazards.
- Piper Rune text/mechanics mismatch breaks fiction/mechanics consistency.
- Too much lore/mechanics density can obscure practical goals.

Recommendations:

- Treat every player-facing term as a contract. If a rune says "urban places", an urban place must exist or the rune should not ship.
- Keep first-time objective copy in plain English/Scots-light register.
- Use Almanac for deeper flavor, not required gameplay comprehension.

## 10. Codebase Review

Architecture:

- Many systems are sensibly extracted and testable.
- Pure helper tests are a major strength.
- `GameScene.ts` remains too large and too central. It owns too many systems, state transitions, hooks, save bridges, runtime UI flows, and effect integrations.

Maintainability:

- The broad hooks pattern reduces direct `as any` reach-through but creates large dependency surfaces.
- Comments sometimes promise integration that code does not provide, especially rune consumers.
- Two save systems create cross-save reasoning risk.

State management:

- Scene reuse is understood and reset logic is explicit.
- Newer systems are not fully represented in active-run snapshots.
- Runtime systems that mutate caches or schedule timers need resumable state contracts.

Error handling:

- Save failures are often swallowed for play continuity.
- That is safe for crashes but bad for player trust if progress silently fails.

Tests:

- Unit coverage is excellent.
- Missing category: cross-system "visible player promise is true" tests.
- Missing category: resume snapshots after every mid-run system.

Recommended refactors:

- Extract a `RunResumeState` owner that includes all per-run systems.
- Extract rune runtime integration into a system with explicit consumers.
- Extract modal input/focus navigation shared by Curse, Route, NodePrompt, Settings, GameOver.
- Add a save-surface map documenting which fields live in `whs_save` vs `whs_meta_save`.

## 11. Edge Case Matrix

| Edge case | Area affected | Expected behavior | Likely current behavior | Risk level | Suggested test/fix |
|---|---|---|---|---|---|
| Close tab after picking a rune | Runes/resume | Rune remains active after resume | Rune lost | Critical | Persist `ownedRuneIds` and active rune effects |
| Close tab after picking a relic | Relics/resume | Relic inventory restored | Relic lost | Critical | Persist relic slots and one-shot active state |
| Close tab in Act 2 node path | Moor Road/resume | Same path and cursor | Act state restored, map likely wrong | Critical | Persist/rebuild node map state |
| Close tab during route timed buff | Routes/resume | Remaining duration restored | Buff lost or wrong duration | High | Serialize timed route effects |
| Rebind gamepad dash | Input | New button dashes | Hardcoded buttons still dash | High | Use `gamepadBindings` in `InputManager` |
| Enable Assist invincibility | Settings/combat | Player cannot die | No effect | Medium | Hide or implement |
| Click outside shrine/trader prompt | Nodes/UI | Intentional cancel | Accidental refusal | Medium | Explicit Leave confirmation |
| Replay reaches end | Replay/history | No new progress/history writes | Gameplay save guarded, meta history likely not fully guarded | Medium | Guard `recordToHistory` in replay |
| Corrupt gameplay save | Persistence | Safe fallback and player messaging | Safe fallback, mostly silent | Low | Add toast/log surface for lost save |
| Corrupt activeRun | Persistence | Resume disabled safely | Likely disabled/fallback | Low | Add MainMenu message |
| High UI scale on GameOver | UI | Buttons readable/clickable | Hand clamps likely okay but need visual proof | Medium | Screenshot regression |
| Mobile touch first run | Input/onboarding | Player sees joystick/dash affordance | Dash zone may be invisible | Medium | Add mobile hint overlay |
| Pausing during node prompt | Modal state | One owner of pause | Prompt owns time, pause gated incompletely for NODE_PROMPT | Medium | Add `NODE_PROMPT` to pause blocking tokens if needed |
| Long replay recording | Save quota | Save stays reliable | JSON blob may exceed quota | Medium | Compress/cap replay |
| PWA update during long run | Platform | No interruption/surprise | Immediate SW update may alter next load | Low | E2E/manual long-session deploy test |

## 12. Prioritized Fix List

### Must Fix Before Release

| Issue | Why it matters | Estimated effort | Impact | Suggested owner |
|---|---|---|---|---|
| Complete active-run resume serialization. | Prevents reward/state loss and broken acts. | Large | High | Code/QA |
| Wire rune effects or remove rune offers. | Visible rewards must be truthful. | Large | High | Code/Design |
| Fix gamepad rebinding runtime. | Controller accessibility and trust. | Medium | High | Code/QA |
| Add resume integration tests for relics/runes/nodes/routes. | Current tests miss the riskiest seams. | Medium | High | QA/Code |
| Persist route side-effect timers/caches. | Prevents changed difficulty after resume. | Medium-Large | High | Code |

### Should Fix Before Release

| Issue | Why it matters | Estimated effort | Impact | Suggested owner |
|---|---|---|---|---|
| Align rune conditions with live world states. | Removes dead cards and lore mismatch. | Medium | High | Design/Code |
| Hide or implement Assist Mode. | Avoids misleading accessibility promises. | Small-Medium | Medium | UI/Code |
| Fix Croft return targets. | Makes hub navigation coherent. | Small | Medium | UI |
| Add keyboard/gamepad navigation to NodePrompt, Curse, Route, and GameOver links. | Prevents input dead ends. | Medium | Medium | UI/Code |
| Simplify first-run path. | Improves onboarding and retention. | Medium | High | Design/UI |
| Add visual regression checks for high UI scale/mobile. | Catches readability regressions. | Medium | Medium | QA/UI |

### Nice to Have

| Issue | Why it matters | Estimated effort | Impact | Suggested owner |
|---|---|---|---|---|
| Split `GameScene` into runtime controllers. | Lowers regression risk. | Large | Medium | Code |
| Compress replay blobs. | Avoids localStorage pressure. | Medium | Medium | Code |
| Add DOM-backed accessibility surfaces for menus. | Improves nonvisual access. | Large | Medium | UI |
| Add player-facing save failure messaging. | Improves trust when storage fails. | Small | Medium | UI/Code |
| Add a current-run explanation panel. | Helps players parse route/relic/rune/build state. | Medium | Medium | UI/Design |

## 13. Test Plan

Smoke tests:

- Boot to MainMenu.
- First-run photosensitivity warning.
- Start clean run.
- Pause/resume.
- Die and reach GameOver.
- Play Again.
- Enter Shop, Settings, Chronicle, Almanac, Deeds, Croft.

Full playthrough tests:

- Clean run to Gordon, route picker, Tour Bus, second route picker, Act 3 bosses, Taxman victory.
- Post-bell entry and death after post-bell.
- Cursed victory.
- Ironmoor death and victory.

Regression tests:

- Rune pick changes expected stat/effect.
- Relic pick changes expected stat/effect.
- Route pick changes expected modifier and persists.
- Node prompt options apply correct outcomes.

Save/load tests:

- Resume after each of: level-up, weapon evolution, route pick, node prompt, relic pickup, rune pickup, Act 2, Act 3, low HP, boss active.
- Corrupt `whs_save`.
- Corrupt `whs_meta_save`.
- Newer schema.
- Storage quota failure.

Input tests:

- Keyboard rebinding in gameplay.
- Gamepad rebinding in gameplay.
- Gamepad pause in gameplay and menus.
- Touch joystick and dash zone.
- Keyboard-only modal completion.

Scene transition tests:

- Rapid Start/Back clicks.
- Pause during countdown, level-up, node prompt, route picker, death slow-mo.
- Quit run during active route effect.
- Replay completion returns to Chronicle without writes.

Performance tests:

- 15-minute normal run.
- 30-minute marathon if intended.
- 400 enemy cap.
- Max particles vs reduced particles.
- WebGL shaders on/off.
- Mobile viewport.
- Tab background and resume delta clamp.

Settings tests:

- Reduce flashing visibly caps flashes.
- Motion scale changes effect intensity.
- Captions appear and scale.
- UI scale 1.4 remains readable.
- Assist Mode rows are hidden or functional.

Accessibility tests:

- Colorblind filter applied at boot and on change.
- High contrast UI.
- Keyboard-only route through settings and run start.
- Gamepad-only route through run start and node prompt.
- Photosensitivity warning cannot be accidentally skipped.

Build/platform tests:

- `npm run build`.
- `npm run test:e2e`.
- Chromium desktop.
- Firefox desktop.
- WebKit desktop.
- Chromium mobile.
- PWA update lifecycle.

## 14. Final Verdict

What the game does well:

- It has a clear soul: warm, odd, Scottish, haggis-first, and mechanically ambitious.
- It has enough systems for real replayability.
- It has strong automated unit coverage and many thoughtful engineering patterns.
- It treats accessibility and failure tone more seriously than most small browser games.

What is most likely to make players quit:

- Trust breaks from rewards/settings that do not work.
- Resume changing or losing a run.
- Too many systems before the player understands the baseline.
- Dense UI and modal input gaps, especially for controller/mobile players.

What feels unfinished or sloppy:

- Rune tier integration.
- Assist Mode wiring.
- Gamepad rebinding runtime.
- Croft/subscreen navigation.
- Resume support for newer systems.

What should be fixed first:

- Active-run resume completeness.
- Rune effects and rune condition validity.
- Gamepad rebinding runtime.
- Route side-effect persistence.

Best low-effort improvement:

- Hide scaffold-only Assist Mode rows and gate curses/runes until the game can teach and support them cleanly.

Best high-effort improvement:

- Build a complete run-state ownership layer that serializes all active per-run systems and removes resume responsibility from scattered scene hooks.

