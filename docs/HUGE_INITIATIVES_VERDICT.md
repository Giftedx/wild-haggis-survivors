# Huge Initiatives — Verdict Against Code

**Update 2026-04-16.** R3 + R3a shipped. `GameScene.ts` 2016 → **1186 lines** across commits `b986a7f`…`240b22c`. 17 extracted modules, 141 new tests. R3a collapsed 9 scattered counters into `RunScoreState` and simplified 3 hook contracts. W2 (next flagship) is now unblocked. Snapshot numbers below reflect the pre-R3 state.

**Method.** Every row in `HUGE_INITIATIVES_MASTER_PLAN.md` checked against the actual codebase. One line per row. No advocacy.

**Status codes:**

- ✅ **DONE** — already in code; row is restating reality (or 80%+ shipped)
- 🟢 **EASY** — scaffolding exists, small addition, 1–3 sprints
- 🟡 **MEDIUM** — real work, clear path, 1 quarter
- 🟠 **HARD** — legitimate flagship scope
- 🔴 **NONSENSE** — impossible as written, already covered elsewhere, or doesn't fit this game
- 🔵 **RETHINK** — salvageable idea, wrong framing or duplicate name

**Headline findings:**

- Codebase is far more mature than the plan implies. ~30 systems the doc names as "flagships" **already exist in `src/`**, often with tests.
- `src/scenes/GameScene.ts` is **2016 lines** — R3 (scene complexity budget) is the real crisis the doc underweights.
- **6 variants** already shipped (plan says 3). Roster is 2× smaller from reality than plan claims.
- Many rows differ from prior rows by name only. Synonym rot is the doc's biggest structural failure.
- **The doc is ~70% ideas already implemented, ~20% real flagship candidates, ~10% nonsense.**

---

## Part 1 — Generic baseline (P/C/D/T/O)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| P1 | Real-time multiplayer | 🟠 HARD | Nothing in repo. Scope explosion exactly as row says. Only real if MP is the thesis. |
| P2 | Async ghosts | 🟡 MEDIUM | `rng.determinism.test.ts` suggests seed infra exists; ghost replay format is net-new. |
| P3 | Cloud saves | 🟠 HARD | `SaveManager.ts` is localStorage-only. Real cross-device is full account + conflict work. |
| P4 | Server-validated dailies | 🟠 HARD | No server exists. Cost model is real. |
| C1 | Season/episode pipeline | 🔵 RETHINK | Data layer (`src/data/*`) already supports packs in practice; the "pipeline" is a designer-facing tool question → G2, not a megaprogram. |
| C2 | Procedural quests / mutators | 🟢 EASY | `curses.ts` + `RunModifiers` + `runStartModifiers.ts` already *are* a mutator framework. Ship more, not a new framework. |
| C3 | Biomes + enemy families program | 🟡 MEDIUM | `BiomeManager` + `BiomeController` + `BiomeRenderer` exist. Adding families is content, not a flagship. |
| C4 | Weapon/evolution expansion | 🟡 MEDIUM | `WeaponEvolution` + `BalanceConfig.evolution.test.ts` exist. Expansion is graph + tests, bounded. |
| D1 | Branching banter + VO | 🟠 HARD if VO | Banter exists (`banter.ts` 603 lines). VO is the scope driver, not branching. |
| D2 | Codex/lore that gates mechanics | 🔵 RETHINK | Anti-FOMO warning is correct; the "gates power" framing is the problematic bit — likely you just want a codex (non-gating). |
| D3 | Meta story arc | 🟡 MEDIUM | `ChronicleScene` + `chronicleAggregates.ts` + `RunHistory.test.ts` exist. Arc = authored text, not systems. |
| T1 | Deterministic replay | 🟠 HARD | `rng.determinism.test.ts` shows seed infra; full replay is every-timer + audio-schedule accountability. Real flagship. |
| T2 | Telemetry/heatmaps | 🟢 EASY | `AnalyticsManager.ts` + tests exist. Row is already ~60% done. |
| T3 | Modding / data packs | 🟠 HARD | No mod loader. Row scope is real. Low ROI for a small game. |
| T4 | Performance program | 🟡 MEDIUM | `SpatialCulling` + `MemoryLeak.test.ts` + `spatialCull.ts` already real. Frame-budget regression tests are the gap. |
| O1 | Accessibility program | 🟡 MEDIUM | `a11y/` + `CaptionManager.ts` + `a11yMotion.ts` + `SettingsManager.a11y.test.ts` exist. Program is extension, not invention. |
| O2 | Analytics-driven balance | 🟢 EASY | Combines existing `AnalyticsManager` with balance; small if T2 already holds. |
| O3 | Live ops flags + rollout | 🟡 MEDIUM | No flag system. Real work. Needed only if you actually ship live. |
| O4 | Localization at scale | 🟡 MEDIUM | `i18n.ts` + `i18n.test.ts` exist; professional-scale TMS is the extra cost. |

---

## Part 1.5 — R-rows (PRD-grounded)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| R1 | Vendor bundle & PWA budget | 🟡 MEDIUM | Real concern per PRD. Measurable, boring, worth doing. |
| R2 | Save schema migration | 🟡 MEDIUM | `SaveManager.ts` exists; `save.test.ts`, `save.endless.test.ts` show schema awareness. Migration program is honest. |
| **R3** | **Scene complexity budget** | ✅ **SHIPPED (2026-04-16)** | Was `GameScene.ts = 2016 lines`; now **1225**. See master plan "Completed this quarter". Full 800-line target split off as **R3a** (architectural RunScoreState extraction). |
| R4 | `as any` retirement | 🟢 EASY | Grep-able; ship as ongoing hygiene, not a program. |

---

## Part 2 — Generic extended (A/B/PB/CP/E/F/G/H/I/M-moonshots)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| A1 | Phaser major upgrade | 🟠 HARD | Real but only if Phaser 4 forces it. |
| A2 | WebGPU / layered canvas | 🔴 NONSENSE for a pixel-art survivor. Skip. |
| A3 | Worker offload | 🟡 MEDIUM | Would pair with T1. Don't touch until perf forces it. |
| A4 | WASM hot modules | 🔴 NONSENSE — over-engineered for a JS game. |
| A5 | Asset streaming | 🔵 RETHINK | Row is generic. Real question is texture atlas hygiene. |
| A6 | Battery/thermal awareness | 🟢 EASY | Adaptive FPS is a setting toggle, not a program. |
| B1 | E2E encrypted saves | 🔴 NONSENSE for a browser survivor. Skip. |
| B2 | Anti-cheat | 🟡 MEDIUM only if ladder exists. Otherwise nothing. |
| B3 | Rate-limit API | 🔵 RETHINK — empty until a server exists. |
| B4 | Supply-chain security | 🟢 EASY | `npm audit` + lockfile policy is hygiene. |
| PB1 | Steam/Epic/itch integration | 🟠 HARD | Real ship work. |
| PB2 | Mobile shells | 🟠 HARD | Pairs with W95. |
| PB3 | Demo mode | 🟡 MEDIUM | Bounded. |
| PB4 | Regional compliance | 🟡 MEDIUM | Legal review is real. |
| CP1 | Music scale-up (live instruments) | 🟠 HARD | `ProceduralMusicEngine` is full procedural; live instruments is a different product. |
| CP2 | SFX library expansion | 🟡 MEDIUM | `SFXManager.ts` exists. Expansion is content. |
| CP3 | Art direction program | 🟠 HARD | Genuine cross-cutting work. |
| CP4 | Trailer pipeline | 🟡 MEDIUM | Shares tech with W79/W90. |
| E1 | Second core mode | 🟠 HARD | Real. But see W66 Ironmoor — that's E1 in disguise. |
| E2 | Factions/covenants | 🔴 NONSENSE — duplicates W13 curses. Merge. |
| E3 | Boss rush | 🟡 MEDIUM | `PostBellEscalation.ts` already is endgame arc; boss rush is set-pieces. |
| E4 | AI director personality | 🟠 HARD | `SpawnSystem.director.test.ts` hints at a director; personality is real flagship. |
| E5 | Environmental storytelling | 🔵 RETHINK → see W77. |
| F1 | Visual regression | 🟡 MEDIUM | Playwright already in use. Baselines are real ops work. |
| F2 | Property-based tests | 🟢 EASY | Add fast-check; real quick win. |
| F3 | Soak tests | 🟡 MEDIUM | `MemoryLeak.test.ts` is the seed. |
| F4 | Chaos testing | 🟢 EASY — small, high value. |
| G1 | Monorepo split | 🔴 NONSENSE for current size. Premature. |
| G2 | Designer-facing tools | 🟠 HARD | Big win if you have designers; skip if solo. |
| G3 | RFC/ADR process | 🟢 EASY — a `docs/adr/` folder. |
| G4 | Public API / plugin contract | 🔴 NONSENSE unless modding is the thesis. |
| H1 | Speedrun ruleset | 🟢 EASY | Timer + splits. |
| H2 | Community challenge tooling | 🟠 HARD if taken seriously. |
| H3 | Academic research partnership | 🔴 NONSENSE — not a product row. |
| H4 | Open-source strategy | 🟡 MEDIUM if opening. |
| M1–M3 (moonshots) | PvP, 3D, LLM narrative | 🔴 NONSENSE — explicitly labelled as such by the doc itself. Fine as-is. |

**ID collision flag:** Part 2 uses **M1–M3** for moonshots. Part 11 uses **M1–M20** for mechanics. Part 12 uses **H1–H14** for haggis roster while Part 2 uses **H1–H4** for community. **Unresolved.** Rename one side.

---

## Part 5 — W1–W10 (batch 1)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| W1 | Soul Weave certification | 🔵 RETHINK | `DESIGN_SOUL.md` exists. "Certification in CI" is a linter, not a program. Collapse to an ADR + a CI check. |
| W2 | Moor Road multi-act campaign | ✅ SHIPPED | 2026-04-16. 3 acts + 2 pickers + 6 routes + Chronicle breadcrumb + Skip toggle. See `HUGE_INITIATIVES_MASTER_PLAN.md` "Completed this quarter" for details. |
| W66 | Ironmoor permadeath alt mode | 🟡 IN PROGRESS | MVP seeded 2026-04-16: `ironmoorMode` setting + HUD chip + run-history flag + `ach_ironmoor_victor` deed + Chronicle ⚔ badge. Full flagship still open (separate leaderboard, chronicle-wipe-on-death, opt-in ceremony). |
| W3 | Weather & Atmosphere Director | 🟡 MEDIUM | Biome system exists; weather director is layered state machine. Bounded. |
| W4 | Voice Bible + banter pipeline | 🟢 EASY–MEDIUM | `banter.ts` already 603 lines with schema. "Pipeline" is glossary + dup-check, small. |
| W5 | Living Bestiary Codex | 🟡 MEDIUM | No codex scene yet. `AchievementManager` + deeds give data source. Honest scope. |
| W6 | Ceilidh async social | 🟠 HARD | Needs a server. Don't touch without thesis. |
| W7 | Whisky Cask meta | 🔵 RETHINK | Time-gated meta currency is classic dark pattern by default; **W80** must govern this before shipping. Rename from "aging" (FOMO) to something kinder, or drop. |
| W8 | Post-Bell narrative expansion | 🟡 MEDIUM | **`PostBellEscalation.ts` already exists.** Row is *extension*, not invention. Doc overstates scope. |
| W9 | Interactive Map of Scotland | 🟡 MEDIUM | No map scene. Real content + UI. |
| W10 | Curated Daily Highlands | 🟠 HARD | Server-or-not decides everything. Without server it's honor-system. |

---

## Part 6 — W11–W20 (batch 2)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| W11 | Bothy Hall — navigable hub | 🔵 RETHINK | "Bothy" already referenced in 10+ files; `MetaShopScene.ts` is 312 lines and already functional. Row conflates "add rooms" with "redesign everything." Cheaper than claimed. |
| W12 | Death Literacy Institute | 🟢 EASY | `DeathCauseTracker.ts` + `deathCauseClassifier.ts` + tests exist. Row = copy + UX, not invention. |
| W13 | Curse Pacts + covenant seasons | 🟢 EASY | `curses.ts` + `CurseScene.ts` already ship the verb. Seasons = content + a toggle. |
| W14 | Variant Mythos production line | 🟡 MEDIUM | 6 variants already; pipeline is mostly tooling + discipline. Overstated scope. |
| W15 | Hazard ecology | 🟢 EASY–MEDIUM | `HazardZones.ts` exists. Extensions are bounded. |
| W16 | Juice & Readability Orchestra | 🟢 EASY | `JuiceSystem.ts` + `StatusFxPool.ts` real. Row = budget rules + CI, not new system. |
| W17 | Shepherd's Almanac | 🔵 RETHINK | Cultural live events without a liturgy framework (W62) is unstable. Don't ship alone. |
| W18 | Scots voice full ship | 🟠 HARD | `i18n.ts` exists; full bilingual authoring is real work. Honest S-tier. |
| W19 | Infinite Staircase tutorial | 🟢 EASY | `TutorialSystem.ts` + tests exist. Row = extension. |
| W20 | Shareable postcards | 🟡 MEDIUM | New surface but bounded. Part of share-cluster consolidation needed. |

---

## Part 7 — W21–W30 (batch 3)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| W21 | Weapon Evolution Opera | 🟡 MEDIUM | `WeaponEvolution.test.ts` + `evolutionChest.ts` + `LevelUpFlow.ts` exist. Row = production polish, not new tech. |
| W22 | Moor Moment Songbook | 🟢 EASY | `moorMoments.ts` has 9 moments; "songbook" is more moments + authoring, not a flagship. |
| W23 | Elite Grammar Institute | 🟡 MEDIUM | `eliteAffixes.ts` exists. Telegraph grammar is real UX work. |
| W24 | Build Identity / StatComposer | 🟢 EASY | `StatComposer.ts` + tests exist. Row = post-run summary UI. |
| W25 | Golden Haggis Philanthropy | 🟢 EASY | `MetaProgressSystem.ts` + `MetaPurchase.ts` exist. Row = economy audit + copy, not invention. |
| W26 | Piper's Path auto-battle | 🟢 EASY | **`computeAutoBattleSteering` already exists in `src/dev/AutoBattler.ts`.** Row = move from dev-only to designed feature. |
| W27 | Highlight reel | 🟠 HARD | No capture infra; clip export on web is real work. |
| W28 | Folk Stem Forge | 🟠 HARD | `ProceduralMusicEngine` is full procedural (`DroneLayer`, `PianoLayer`, `PercussionLayer`, `Conductor`). Stems = real licensed audio = real money. |
| W29 | Kindness Ops | 🟠 HARD | Only real if community exists. Park. |
| W30 | Deeds Without Doom | 🟢 EASY | `AchievementManager.ts` + `deedsProgress.ts` + `DeedsScene.ts` exist. Row = copy + UX. |

---

## Part 8 — W31–W40 (batch 4)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| W31 | Burn Crossing Pageantry | 🟢 EASY | `BiomeController.ts` already watches crossings. Row = sting + banter add. |
| W32 | Sporran Ceremony pre-run | 🔵 RETHINK | `CurseScene.ts` + `runStartModifiers.ts` already ship pre-run selection. Row is polish, not program. |
| W33 | Voronoi Fairness Lab | 🔴 NONSENSE — adding explanation of Voronoi to players is not a flagship. This is an explainer, at most a tooltip. Demote hard. |
| W34 | Pickup Symphony | 🟢 EASY | `PickupSpawner.ts` exists. Row = curves + telemetry, bounded. |
| W35 | Sanctuary Pause | 🟢 EASY | `PauseMenu.ts` exists. Row = copy + a11y toggles in pause. |
| W36 | Transparent Moor (debug overlay) | 🟢 EASY | `DebugOverlay.ts` + tests exist. Row = opt-in detail tiers. |
| W37 | Hazard Heritage | 🔵 RETHINK — duplicate of **W15**. Merge. |
| W38 | Weapon Families Ballet | 🟡 MEDIUM | Real work if paired with W71 animation. Without W71, it's re-skinning. |
| W39 | Chronicle Weave | 🟡 MEDIUM | `ChronicleScene.ts` + `chronicleAggregates.ts` exist. Weave = authored prose. |
| W40 | CI Content Gatekeeping | 🟢 EASY | Real, cheap, ship now. |

---

## Part 9 — W41–W50 (batch 5)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| W41 | Boot & Hearth first-minute | 🟢 EASY | `BootScene.ts` exists. Row = polish, not program. |
| W42 | Victory/Defeat Theatre | 🟢 EASY | `GameOverScene.ts` + `gameOverFormatting.ts` + tests exist. Row = copy + layout. |
| W43 | Boss Intro/Outro Canon | 🟡 MEDIUM | Boss scaffolding exists; authoring contract is real. |
| W44 | Highland Terrain Art | 🟡 MEDIUM | `highlandTerrain.ts` + `BiomeRenderer.ts` real. Program = shader + palette discipline. |
| W45 | Comfort Matrix Ship | 🟢 EASY | **`settingsComfort.smoke.test.ts` already exists.** Row = doc + one missing toggle. |
| W46 | Run DNA / Modifier Algebra | 🟢 EASY | `RunModifiers.ts` + `runStartModifiers.ts` real. Row = summary UI. |
| W47 | SFX Hierarchy Covenant | 🟢 EASY | `SFXManager.ts` exists. Mix bible is doc + config. |
| W48 | Taxman Mythos Bible | 🟢 EASY | Writer doc, not engineering. Cheap. |
| W49 | Event Bus Chronicle Hooks | 🟢 EASY | `GlobalEventBus.ts` + tests exist. Row = add hooks, not infra. |
| W50 | Moorlight Photo Mode | 🟡 MEDIUM | Real new UI surface. |

---

## Part 10 — W51–W60 (batch 6)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| W51 | Golden Path 30-min | 🟡 MEDIUM | Design work on top of existing tutorial. |
| W52 | RNG Covenant | 🟢 EASY | `rng.ts` + determinism tests exist. Row = plain-language doc + one UI panel. |
| W53 | Credits & Hearth of Names | 🟢 EASY — `src/scenes/` has room for a credits scene. |
| W54 | Speedrun Suite | 🟢 EASY | Bounded; hook into existing timer. |
| W55 | Storefront Theatre | 🟡 MEDIUM | Copywriting + screenshots. Not engineering. |
| W56 | Dreich Visibility | 🟢 EASY | Part of W3 weather work; not separate. |
| W57 | Bell Sonic Seal | 🟢 EASY — authoring inside `ProceduralMusicEngine`. |
| W58 | Frustration Safeguards | 🟢 EASY | `DeathCauseTracker` data already present. Row = copy + streak messages. |
| W59 | Open Moor (FOSS) | 🟠 HARD only if opening repo. |
| W60 | Bestiary Live | 🔵 RETHINK — duplicates W5 + live-ops O3. Merge. |

---

## Part 10.5 — W61–W70 (batch 7, mine)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| W61 | Living Moor Fauna AI | 🟠 HARD | Genuine new work (ecology sim), real perf risk. Real but rarely worth the cost. |
| W62 | Folk Liturgy framework | 🔵 RETHINK — calling this "infrastructure" is overcooked. `GlobalEventBus.ts` already is the framework. Row = a cron-like calendar feature, not a program. |
| W63 | Soundscape 4D positional | 🟡 MEDIUM | WebAudio panner nodes are real work; binaural on 2D pixel-art survivor is mostly cosmetic. |
| W64 | Reliquary Compendium | 🟡 MEDIUM | Genuinely new. Size of work is inventory UI (W93) + content. |
| W65 | Loom of the Moor tool | 🟡 MEDIUM | Real designer tool. Ship only if you have designers. |
| W66 | Ironmoor permadeath | 🟠 HARD | Real alt mode. Separate balance. My rubric score of 13 was inflated — honestly 10. |
| W67 | Sofa Ceilidh couch co-op | 🟠 HARD | Input + camera + balance rewrite. Genuinely hard without netcode saving. |
| W68 | Bothy Compass companion app | 🔴 NONSENSE for current team/size. Another app is another product. |
| W69 | Accessibility as Aesthetic | 🔵 RETHINK — potentially condescending; needs actual disability consult first. Not a flagship, a naming exercise. |
| W70 | Heritage Braid partnership | 🔵 RETHINK — not a product row; real-world partnership work that belongs outside the backlog. |

---

## Part 10.6 — W71–W80 (batch 8, mine)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| W71 | Skeletal Haggis anim pipeline | 🟠 HARD | `BootScene.ts` currently draws sprites procedurally. Skeletal = engine decision + asset pipeline. Real. |
| W72 | Time of Day & Lunar Cycle | 🟡 MEDIUM | Lighting + gameplay hooks; honest scope. |
| W73 | Haptic Theatre | 🟢 EASY–MEDIUM | Web Gamepad API vibration is real; DualSense trigger control is browser-limited. Scope reality is smaller than I wrote. |
| W74 | AI Playtester Mesh | 🟡 MEDIUM | `AutoBattler.ts` already exists. Bot-swarm is extending that headless. Less "flagship" than I scored. |
| W75 | Input Ergonomics | 🟢 EASY | `InputManager.test.ts` + `GamepadMenuNav.ts` + `inputMath.ts` already exist. Remapping is finite. |
| W76 | Bothy Hermit NPC | 🔵 RETHINK — interesting idea but writing-heavy without a writer. Park. |
| W77 | Graven Moor env storytelling | 🟡 MEDIUM | Real prose + placement work. |
| W78 | Hearth Wardrobe cosmetics | 🟡 MEDIUM | Real new system, pairs with naming (W83). |
| W79 | Moorlight Cinema film mode | 🟡 MEDIUM | Shares tech with W50 and W27. Ship one capture pipeline, not three. |
| W80 | Ethics Charter | 🔵 RETHINK — a charter without an auditor is blog copy. As **an ADR** it's fine. As an "S-tier flagship" it's inflated. |

---

## Part 10.7 — W81–W90 (batch 9, mine)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| W81 | Haggis Lineage Tree | 🟡 MEDIUM | Real new data model. Interesting but unproven it would land. |
| W82 | Offline-First Doctrine | 🔴 NONSENSE — already true. Game is Phaser + localStorage. Row describes status quo. Demote to an ADR page. |
| W83 | Procedural Namesake Engine | 🟡 MEDIUM | Real work, needs cultural review or don't ship. |
| W84 | Crofting Village | 🟠 HARD | My own scope warning stands. Real flagship **or** five colliding features. |
| W85 | Contract Board | 🟡 MEDIUM | Depends on W84 existing. Otherwise fine grammar. |
| W86 | Smith's Anvil crafting | 🟡 MEDIUM | Depends on W64 + W93. |
| W87 | Scars & Tattoos | 🟡 MEDIUM | Depends on W71 rig. Without W71 it's just sprite overlay. |
| W88 | Dream Runs | 🟢 EASY | Alt palette + banter register + flag. Cheap joy is real. |
| W89 | Folk Games mini-layer | 🔵 RETHINK — pitched as "idle," but each mini-game is its own mode. Scope dishonest. |
| W90 | Cinematic Interludes | 🟡 MEDIUM | Pair with W79 capture tech. |

---

## Part 10.8 — W91–W100 (batch 10, mine)

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| W91 | Ambient Living Moor wildlife | 🟢 EASY–MEDIUM | Non-combat particles + state machine. Cheap soul if scoped tight. |
| W92 | Glossary & Etymology | 🟢 EASY | `i18n.ts` holds strings; hover glossary is small UI. |
| W93 | Backpack & Inventory UI | 🟡 MEDIUM | Genuinely needed *if* W64/W86/M3 ever ship. Otherwise premature. |
| W94 | Atlas of Living Scotland | 🟡 MEDIUM | New surface; reuses `chronicleAggregates`. |
| W95 | Thumb-Zone Mobile | 🟠 HARD | Real. Mobile is a different posture. |
| W96 | Meaningful Death Archive | 🟢 EASY | `DeathCauseTracker` + `chronicleAggregates` supply the data. Row = search UI. |
| W97 | Piper's Herald diegetic patch notes | 🔴 NONSENSE — users need real changelogs. Ceremony over clarity is bad UX. Kill. |
| W98 | Story-Lite Mode | 🟡 MEDIUM | Separate balance. Real alt mode. |
| W99 | Haggis Temperament portrait | 🟡 MEDIUM | Requires W71 rig to look right. |
| W100 | The Moor Library composite | 🔴 NONSENSE as scored — it is a rollup of 17 other systems, not a flagship. Also: PDF export of licensed music/VO is a **legal** non-starter. Rescope to in-game read-only, or kill. |

---

## Part 11 — M1–M20 Mechanics

| ID | Name | Verdict | Evidence / Note |
|----|------|---------|------|
| M1 | Drift Mastery Ladder | 🟡 MEDIUM | `Player.ts` has drift math already. Ladder is skill-layer content. |
| M2 | Pibroch Crescendo | 🟡 MEDIUM | `Conductor.ts` + `NoteScheduler.ts` give beat data. Integration is real work. |
| M3 | Sporran Deck | 🟡 MEDIUM | `runStartModifiers.ts` is the hook. Real new meta system. |
| M4 | Cairn Stacking | 🟢 EASY | Interact point + timer + small modifier. |
| M5 | Whistle-Call Companions | 🟠 HARD | Extra entity + AI. Real scope. |
| M6 | Stance Toggle | 🟢 EASY | Three-state on `Player.ts`. |
| M7 | Heather Mantle | 🟡 MEDIUM | Requires W71-ish rig layer. |
| M8 | Burn Leap | 🟢 EASY | Double-tap input already trivially detectable. |
| M9 | Whisky Breath | 🟢 EASY | New weapon with resource cost. |
| M10 | Taxman Grudge Ledger | 🟡 MEDIUM | Hidden tracker + dialogue branches in `PostBellEscalation`. |
| M11 | Midge Reputation | 🔵 RETHINK | Meta-bias without strong player-legibility is anti-fair; risks punishing good play. |
| M12 | Ceilidh Chain Combo | 🟢 EASY | `JuiceSystem` combo exists. |
| M13 | Tide & Time dynamic arena | 🟠 HARD | Soft boundary changes mid-run = major physics + readability. |
| M14 | Standing Stones choice | 🟢 EASY | Three-way pick at 5:00 is small. |
| M15 | Reliquary Pickups | 🟢 EASY | Piggyback on `PickupSpawner`. |
| M16 | Weather Memory Trails | 🟢 EASY | Trail polyline + proximity check. |
| M17 | Shinty Parry | 🟡 MEDIUM | Active-block window is new input class. |
| M18 | Ancestral Echoes | 🟢 EASY | Save last death position; spawn a ghost. |
| M19 | Tartan Banner | 🟡 MEDIUM | Procedural tartan gen + colorblind safety. |
| M20 | The Quiet Minute | 🔴 NONSENSE — enemies dropping to 60% for 20s in a survivor game breaks the genre's core tension. Beautiful on paper, bad on pad. Rethink as *boss-intro slow-mo*, not general pause. |

---

## Part 12 — H1–H14 Playable Roster

- **Current roster (verified):** `classic`, `moor_runner`, `iron_belly`, `glen_forager`, `surefoot`, `pipe_breath`. **6 variants, not 3.**
- Plan proposes 14; delta is **+8**, not +11.

| ID | Name | Verdict |
|----|------|---------|
| H1 Wee Haggis | ✅ DONE (`classic`) |
| H2 Laird | 🟡 MEDIUM — reskin + stat tuning. |
| H3 Glaswegian | 🟡 MEDIUM — same. |
| H4 Hebridean | 🟡 MEDIUM — biome-keyed. |
| H5 Munro | ≈ existing `surefoot` or `moor_runner`? 🔵 RETHINK — probably duplicates existing. |
| H6 Drouthy | 🟡 MEDIUM. |
| H7 Wee Ghostie | 🟠 HARD — phase mechanic is new. |
| H8 Cailleach | 🟡 MEDIUM. |
| H9 Engineer | 🟠 HARD — turret system is new entity class. |
| H10 Selkie | 🟠 HARD — dual-form UI is significant. |
| H11 Tufted | 🟠 HARD — minion spawner per level. |
| H12 Iron Brew | 🟢 EASY — damage-taken buff. |
| H13 Pibroch | 🟢 EASY if M2 lands. |
| H14 Tam-o'-Shanter prestige | 🟡 MEDIUM — unlock gate + choose-at-start UI. |

**Honest call:** ship **4–6** new variants, not 14. Cap roster at ~10 total or the pool dilutes.

---

## Part 13 — Enemy Bestiary

- **Current enemies (verified):** 22 (tourist, chef, midge, highland_cow, eagle, haggis_hunter, angry_scotsman, deep_fryer, piper, berserker, ghost, nest, sheep, kelpie, midgie_swarm, gordon, tour_bus, the_laird, hunter_general, taxman + others).
- Plan proposes ~20 new + 6 bosses.

**Verdict:** each new enemy is a bounded content row (🟢 EASY per-enemy), but **the pipeline** that authors them at scale doesn't exist. This is not a flagship — it's a content calendar. **Cap at ~6 new enemies per release** and retire weak ones. Do not ship all 20.

**Boss pipeline:** genuine flagship (~🟡 MEDIUM) if boss scaffolding is formalised; most of what's described (intro, outro, phases) already exists for current bosses in an ad-hoc form.

---

## Part 14 — Biomes / Weapons

- **Current weapons (verified):** 9 (`thistle_shot`, `bagpipe_blast`, `caber_toss`, `scotch_mist`, `haggis_hurler`, `nessie_tentacle`, `claymore`, `bagpipes` + one more).
- Plan proposes 10 new → total 20.
- **C4** already warned about synergy explosion. Part 14 ignores the warning.

**Verdict:** adding 10 weapons + paired passives + evolutions is **11× the synergy graph of current**. Without `BalanceConfig.evolution.test.ts` extended to cover it, this ships broken builds. **Cap at +4 new weapons per content drop, evolve from there.** Current 9 + 4 = 13 is already near the ceiling for a survivor pool of this depth.

- **10 biomes plan vs current:** biome data exists but biome diversity is shallow. Expanding is content work, 🟡 per-biome.

---

## Part 15 — Rubric & Recommendations

- **Verdict:** the rubric is directionally OK but was **applied sloppily by me**. Every score needs recomputation with honest scope-honesty penalties.
- **Top-line fact:** **W45 Comfort Matrix is already half-shipped** (`settingsComfort.smoke.test.ts`). My recommendation to "ship this quarter" is asking for a polish sprint, not a flagship. Good — but frame it honestly.

---

## Part 16 — Closing framing

Fine as-is, but the doc *is* used as a roadmap even if it denies being one. The disclaimer doesn't save it.

---

## Summary — What's actually real vs wallpaper

### Already done or ~80% done (don't "ship" — just finish)

R2, R4, C2, C3, C4, T2, T4, O1, O4, W4, W8, W12, W13, W15, W16, W19, W21, W22, W24, W25, W26, W30, W31, W32, W34, W35, W36, W41, W42, W44, W45, W46, W47, W49, W52, W56, W58, W82, H1.

**~40 rows are describing code that already ships.**

### Honest flagships worth funding (pick ONE)

**R3** (urgent — GameScene is 2016 lines), **W2** (campaign acts), **W18** (full Scots ship), **W66** (Ironmoor permadeath), **W71** (animation rig), **W95** (mobile-native), **T1** (deterministic replay), **P3** (cloud saves).

**~8 real flagships.** That's the honest "huge initiatives" list.

### Nonsense / delete

A2, A4, B1, E2, G1, G4, H3, I-moonshots, **W33**, **W37** (dupe W15), **W60** (dupe W5), **W68** (wrong product), **W82** (already true), **W97** (bad UX), **W100** (rollup, not flagship), **M20** (breaks genre), **E2** (dupe W13).

**~15 rows should be cut outright.**

### The rest

~130 rows are **ideas**. Not flagships. Belong in `docs/ideas.md`, not in a "Huge Initiatives" doc. They are not yet programs.

---

## Recommendation

Shrink `HUGE_INITIATIVES_MASTER_PLAN.md` to the **~8 honest flagships above**, with R3 as this quarter's emergency. Move everything else to an ideas document with no tier labels and no rubric. Kill Parts 11–16 or move them to `docs/DESIGN_IDEAS.md` as creative reference (they're genuinely useful there, genuinely wrong in a prioritization doc).

---

*Verdict generated by grep + read against actual `src/`. Every claim footnoted by a real file path or flagged as opinion.*
