# Huge Initiatives — Master Plan & Backlog

**Purpose.** This document catalogs **large programs of work** that require **planning, research, and sustained thinking**—not single PRs. Use it to prioritize, sequence, and avoid half-starting incompatible efforts.

**How to use.**

1. **Pick one flagship** per quarter (or per major milestone)—“do ALL” in parallel will diffuse quality.
2. For each initiative, run a **spike** (time-boxed prototype) on the **riskiest unknown** before full commitment.
3. Attach **success metrics** and **non-goals** when an initiative graduates from “idea” to “project.”
4. For initiatives grounded in this game’s **moor fantasy, voice, music, and soul charter**, see **Part 5** (W1–W10), **Part 6** (W11–W20), **Part 7** (W21–W30), **Part 8** (W31–W40), **Part 9** (W41–W50), and **Part 10** (W51–W60).
5. Before funding fantasy-scale rows, check **Part 1.5** (PRD-grounded foundations) and **Part 3.5** (overlap clusters—avoid duplicate flagship owners).

**Legend.**

- **Tier S** — Multi-month, cross-cutting, often needs dedicated design doc + phased delivery.
- **Tier A** — Large but bounded; still needs explicit plan and verification strategy.
- **Tier B** — Significant; can sometimes ship incrementally behind flags.

**Honest scope & how to read this.**

- This file mixes **near-term ship risks** (see Part 1.5), **genre-generic backlogs** (Parts 1–2), and **Wild Haggis–shaped pillars** (Parts 5–10). Not every row deserves equal attention—without a **now / next / parking lot** split, the backlog becomes motivational wallpaper.
- **ID hygiene:** Part 1 uses **C** and **D** for *content* and *depth*. Part 2’s *distribution* and *creative* rows use **PB** and **CP** prefixes so IDs stay unambiguous (see Part 2 header note).
- **Small-team rule of thumb:** run **at most one flagship megaprogram** per quarter (or milestone), plus **small** PRD-grounded work (bundle, saves, typing) that does not pretend to be a “pillar.” Everything else is **parking lot** until a flagship completes or dies.
- **PRD alignment:** concrete risks called out in `docs/PRD.md` (bundle/PWA, save schema, scene complexity, `as any` clusters) map to **Part 1.5**—fund those before fantasizing about netcode or hub worlds unless the product thesis explicitly demands otherwise.

---

## Part 1 — Initiatives from the baseline roadmap (all previously suggested)

These are the themes already identified as “huge”; each is expanded with typical sub-areas so nothing is hand-waved. **IDs `C1–C4` and `D1–D3` below are Part 1 only** (not Part 2 `PB` / `CP`).

### 1. Online & platform

| ID | Initiative | Tier | Why it’s huge | Planning / research focus |
|----|------------|------|----------------|---------------------------|
| P1 | **Real-time multiplayer (co-op)** | S | Authority, latency, cheat surface, Phaser scene lifecycle across peers | Lockstep vs host-authoritative; snapshot interpolation; disconnect/rejoin; bandwidth budgets |
| P2 | **Async multiplayer (ghosts / async challenges)** | A | Fair comparison without real-time sync | Seed + input log format; leaderboard integrity; anti-tamper |
| P3 | **Cloud saves & cross-device** | S | Conflict resolution, privacy, offline UX | CRDT vs last-write-wins; encryption at rest; account system choice |
| P4 | **Server-validated daily / seeded runs** | S | Client can lie; fairness for competitive dailies | Minimal verification protocol; replay hash; cost model for server |

### 2. Content & systems at scale

| ID | Initiative | Tier | Why it’s huge | Planning / research focus |
|----|------------|------|----------------|---------------------------|
| C1 | **Season / episode content pipeline** | S | Volume of authored content + balance drift | Data schema for “content packs”; tooling for designers; deprecation rules |
| C2 | **Procedural quests / run mutators framework** | S | Combinatorial explosion; readability; bugs | Mutator algebra; UI budget; test matrix per mutator |
| C3 | **New biomes + enemy families as a program** | A | Art, audio, balance, i18n all move together | Biome “contract” (mechanics + visuals + music cues) |
| C4 | **Weapon / evolution expansion pass** | A | Synergy explosion with existing passives | Synergy graph; automated “broken combo” detection in tests |

### 3. Depth without bloat

| ID | Initiative | Tier | Why it’s huge | Planning / research focus |
|----|------------|------|----------------|---------------------------|
| D1 | **Narrative + voice layer (branching banter)** | S | Writing volume, VO budget, loc | Pipeline: script → keys → recording/TTS → QA |
| D2 | **Codex / lore that changes mechanics** | S | Fairness: knowledge gates power | Unlock rules; anti-FOMO design; save compatibility |
| D3 | **Meta story arc across runs** | A | Spoilers, pacing, player agency | Opt-in story mode vs evergreen runs |

### 4. Technical foundation

| ID | Initiative | Tier | Why it’s huge | Planning / research focus |
|----|------------|------|----------------|---------------------------|
| T1 | **Deterministic replay system** | S | Every float, timer, and async path must be accountable | Input+log format; desync debugger; what’s in scope (audio?) |
| T2 | **Balance heatmaps / telemetry (privacy-preserving)** | A | Ethics + signal quality | Event schema; opt-in; aggregation; bias toward action |
| T3 | **Modding or data-only content packs** | S | Validation, versioning, security | Schema validators; sandbox; signing packs |
| T4 | **Performance program (frame budget, pools, profiling)** | A | Survivors scale = entity count | Instrumentation; budgets; regression tests on FPS |

### 5. Product, accessibility & operations

| ID | Initiative | Tier | Why it’s huge | Planning / research focus |
|----|------------|------|----------------|---------------------------|
| O1 | **Accessibility as a program (not toggles only)** | S | Motor, vision, cognitive, seizure risk; Phaser constraints | WCAG mapping where applicable; user testing; per-feature acceptance |
| O2 | **Analytics-driven balance** | A | Wrong metrics optimize the wrong fun | Hypothesis-driven experiments; guardrails |
| O3 | **Live ops: flags, staged rollout, kill switches** | A | Ops culture + code architecture | Config service vs build-time flags; rollback playbooks |
| O4 | **Localization at professional scale** | A | Pluralization, context, voice budget | TMS integration; string freeze process; pseudo-locale QA |

---

## Part 1.5 — PRD-grounded foundations (easy to underrate vs. the fantasy backlog)

*These are **not** glamorous, but they match recurring risks and acceptance criteria in `docs/PRD.md`. They are the usual prerequisite—or parallel “thin slice”—before megaprograms that touch saves, scenes, or ship size.*

| ID | Initiative | Tier | Summary |
|----|------------|------|---------|
| **R1** | **Vendor bundle & PWA precache budget** | A | Phaser vendor chunk, app chunk, precache size—explicit budgets, subset-import spikes, tradeoffs documented. |
| **R2** | **Save schema evolution & migration program** | A | `SAVE_SCHEMA_VERSION` discipline, migration tests, forward compatibility for meta/chronicle/hub features. |
| **R3** | **Scene complexity budget (GameScene et al.)** | B | Guardrails so extracted systems stay extracted; avoid god-scene regression; aligns with PRD modularization wins. |
| **R4** | **Typed pool teardown & `as any` retirement** | B | Replace pool/entity escape hatches with narrow helpers; shrink production `as any` cluster called out in PRD. |

---

## Part 2 — Additional huge initiatives (expanded research backlog)

*These go beyond the baseline list. Each is a candidate “major program” if you choose to fund it.*

**Part 2 ID note:** Sections **Distribution, platform & business** use **`PB1–PB4`** (not Part 1 `C1–C4`). **Creative production pipelines** use **`CP1–CP4`** (not Part 1 `D1–D3`). Sections **A, B, E–F, G–I** keep their existing lettered IDs; **`C`/`D` in Part 1 remain the only baseline `C`/`D`.**

### A. Engine, client architecture & performance

| ID | Initiative | Tier | Summary |
|----|------------|------|---------|
| A1 | **Phaser / major engine upgrade migration** | S | Version jumps can touch every scene, input pipeline, and plugin; needs migration guide + visual regression. |
| A2 | **Render path split: WebGPU or layered canvas** | S | Survivor VFX + pixel art assumptions; huge QA surface. |
| A3 | **Worker offload (physics, pathing, spatial queries)** | S | Determinism vs replay initiative; message passing design. |
| A4 | **WASM hot modules** (RNG, sim, compression) | A | Build pipeline + debug symbols + browser fallbacks. |
| A5 | **Asset streaming & memory budget** | A | Large texture atlases, audio decode timing, mobile RAM. |
| A6 | **Battery / thermal awareness** (laptops, handheld browsers) | B | Adaptive FPS, optional “eco mode.” |

### B. Networking, security & integrity (beyond co-op)

| ID | Initiative | Tier | Summary |
|----|------------|------|---------|
| B1 | **End-to-end encrypted cloud saves** | A | Key management UX; account recovery story. |
| B2 | **Anti-cheat for competitive modes** (even PvE ladders) | S | Threat model: save edit, speedhack, replay injection. |
| B3 | **Rate-limited API + abuse handling** | A | If any server exists—bots, DDoS basics. |
| B4 | **Supply-chain security program** | A | npm audits, lockfile policy, SBOM for releases, signed builds. |

### C. Distribution, platform & business

| ID | Initiative | Tier | Summary |
|----|------------|------|---------|
| PB1 | **Steam / Epic / itch: full integration** | S | Achievements, cloud, DLC hooks, depots, build channels. |
| PB2 | **Mobile shells** (Capacitor/Tauri/WebView) + store compliance | S | Touch, safe areas, backgrounding, IAP if ever added. |
| PB3 | **Demo / trial mode** with save export | A | Economy isolation; spoiler boundaries. |
| PB4 | **Regional compliance** (GDPR, age gates, telemetry disclosures) | A | Legal review; cookie/consent UX on web. |

### D. Creative production pipelines

| ID | Initiative | Tier | Summary |
|----|------------|------|---------|
| CP1 | **Full music production scale-up** (live instruments, stems) | A | Budget, rights, adaptive middleware integration. |
| CP2 | **SFX library expansion + category mix standards** | B | Loudness targets; HDR audio; priority ducking rules. |
| CP3 | **Art direction program: cohesive skin sets** | A | Palette locks, enemy read silhouette rules, shader policy. |
| CP4 | **Trailer & marketing asset pipeline** | A | Capture rig, deterministic camera paths, logo/legal slates. |

### E. Game design “big swings”

| ID | Initiative | Tier | Summary |
|----|------------|------|---------|
| E1 | **Second core mode** (e.g. endless tower, defense objective, roguelike “acts”) | S | New win conditions touch UI, music, spawn director, meta. |
| E2 | **Faction / covenant system** (mutually exclusive run-long modifiers) | A | Balance matrix; explanation burden. |
| E3 | **Boss rush / curated set-pieces** | A | Hand-authored arenas; cutscene/tooling. |
| E4 | **Difficulty beyond numeric scaling** (AI director personality) | S | Explainable to player; testable; seed-stable. |
| E5 | **Environmental storytelling layer** (optional discoverables) | B | Writing + map hooks without combat noise. |

### F. Quality, testing & reliability

| ID | Initiative | Tier | Summary |
|----|------------|------|---------|
| F1 | **Visual regression for Phaser UI** (Playwright + screenshots) | A | Flaky baseline management; per-OS baselines. |
| F2 | **Property-based tests for economy & progression** | A | Invariants: gold conservation, no negative XP, etc. |
| F3 | **Soak tests & long-run memory profiling** | A | Pool leaks, WebAudio nodes, texture retention. |
| F4 | **Chaos testing** (randomized event order, tab background, clock skew) | B | Hardens resume/pause/audio activation paths. |

### G. Tooling, monorepo & engineering culture

| ID | Initiative | Tier | Summary |
|----|------------|------|---------|
| G1 | **Monorepo split: `engine` vs `content` packages** | S | Versioning story; consumer dev experience. |
| G2 | **Designer-facing content tools** (validators, preview, diff) | A | Reduces reliance on engineers for balance tweaks. |
| G3 | **RFC process + architecture decision records (ADRs)** | B | Scales contributors without losing coherence. |
| G4 | **Public API surface & plugin contract** | A | If modding or forks matter. |

### H. Community, research & ecosystem

| ID | Initiative | Tier | Summary |
|----|------------|------|---------|
| H1 | **Speedrun & category ruleset** (splits, IL, seed categories) | B | In-game timer modes; rules committee. |
| H2 | **Community challenge tooling** (weekly seed bot, Discord integration) | A | Ops + moderation + abuse. |
| H3 | **Academic / design research partnership** (difficulty curves, readability) | B | Ethics, IRB if human subjects. |
| H4 | **Open-source strategy** (license, governance, contributor agreement) | A | If ever opening the repo. |

### I. “Moonshots” (often ill-advised unless core thesis)

| ID | Initiative | Tier | Summary |
|----|------------|------|---------|
| M1 | **PvP survivors** | S | Balance, netcode, griefing—usually a different game. |
| M2 | **Full 3D pivot or alternate camera** | S | Rebuild risk. |
| M3 | **Procedural full narrative** (LLM-driven in run) | S | Safety, quality, performance, brand risk. |

---

## Part 3 — Suggested sequencing heuristics (not prescriptive)

1. **Foundation before scale:** replay determinism, save migration, and perf budgets amplify everything else (see **R2**, **T1**, **T4**, Part 1.5).
2. **Ship integrity before competitive features:** if dailies matter, server validation or explicit “unverified” tiers (**P4**).
3. **Accessibility early** if you care about reach—retrofits cost more than designing in.
4. **Multiplayer last** unless multiplayer *is* the product—scope explosion.
5. **Community/competitive tension:** curated dailies (**W10**) and Ceilidh-style social layers (**W6**) still need **fairness and moderation** design early, even if realtime **P1** ships late—do not pretend sequencing item 4 absolves you of abuse/spoofing planning.

---

## Part 3.5 — Redundancy & overlap (intentional clusters—merge in planning, not in parallel ownership)

These rows are **related**; running them as several “flagships” without a single owner creates thrash. Pick **one lead per cluster** when prioritizing. **Batches 1–2** seeded the first clusters; **batches 3–4** added weapons, ceremony, chronicle, and CI overlaps; **batch 5** adds boot/end-of-run, boss pipeline, terrain, Comfort matrix, SFX covenant, Taxman IP, event-bus API, and photo capture; **batch 6** adds onboarding golden path, RNG honesty, credits, speedrun suite, storefront, visibility, bell audio, in-run frustration safeguards, open-source contributor framing, and live bestiary seasons.

### Clusters (batches 1–2 + cross-cutting)

| Cluster | Rows | Notes |
|---------|------|--------|
| **Atmosphere & pressure directors** | W3, W15, **E4** | Weather/atmosphere vs hazard “grammar” vs abstract AI director—same readability and tuning problem at different layers. |
| **Voice, variant SKU, localization** | W4, W14, **Part 1 D1**, **O4**, **W18** | One authoring + QA pipeline; **W18** is largely **O4** with Scots constraints—phase or single program. |
| **Player coaching & teaching** | W12, W19, **Part 1 D3** | Death literacy vs tutorial staircase vs meta arc—one “mentorship” UX owner (**W39** below extends this). |
| **Covenants & run-long rules** | W13, **E2** | Named pacts vs generic faction system—same matrix math and explanation burden. |
| **Soul, juice, accessibility** | W1, W16, **O1** | Who owns flash policy, motion, contrast, and “noise budget”? Align before shipping **W16**. |
| **Meta place vs map fantasy** | W11, W9 | Both spend menu/nav budget; sequence hub (**W11**) before or with map (**W9**) to avoid duplicate “between-run” work. |
| **Variant SKU vs evolution opera** | W14, **W21** | **W14** owns **character fantasy**; **W21** owns **vertical power moments**—same audio/banter budget; one production calendar. |
| **Share & export surfaces** | W20, **W24**, **W27** | Postcards, build cards, and highlight clips must not become three siloed share UIs—one owner for “export affordances.” |
| **Music identity & stems** | W3, **W28**, **CP1** | Atmosphere director vs folk stem forge vs generic music scale-up—**W28** defines the **in-game contract**; **CP1** is studio/recording scale. |

### Clusters (batches 3–4—additions)

| Cluster | Rows | Notes |
|---------|------|--------|
| **Weapons & power fantasy** | **W21**, **W38**, **Part 1 C4** | Evolution opera + weapon families ballet + baseline “weapon / evolution expansion”—**one combat identity owner** or you ship three competing visions of weapons. |
| **Hazard land & lore** | **W15**, **W37** | Hazard ecology/grammar vs peat/heather **canon**—same surfaces (`HazardZones`, biomes); split only if one row stays mechanical and one stays narrative. |
| **Chronicle, meta story & exports** | **W20**, **W39**, **Part 1 D3** | Postcards, chronicle weave, meta arc—**one writer + save-size budget**; **W24** build cards sit next to this via the share cluster. |
| **Moor rhythm & “moment” budget** | **W3**, **W22**, **W31** | Weather director vs moor songbook vs burn crossing pageantry—shared **frequency/noise** cap; banter/music collision rules (**W22**). |
| **Ceremony & between-run feel** | **W32**, **W31**, **W35** | Sporran ceremony, biome crossings, sanctuary pause—**one “feel” owner** for ritual without stacking modal fatigue. |
| **Community safety, fairness & ops** | **W6**, **W10**, **W29**, **H2** | Ceilidh, curated dailies, kindness ops, Discord/challenge tooling—**moderation + fairness** design once, not per feature. |
| **Meta generosity & economy ethics** | **W7**, **W25** | Whisky cask aging vs golden haggis philanthropy—players experience **one** meta economy story; align pity/FOMO language. |
| **Quality gates & definition of done** | **W1**, **W40**, **F1**, **R4** | Soul weave certification, CI content gatekeeping, visual regression, typed pool/`as any` retirement—risk of **three competing “green CI”** definitions; unify policy (warn vs block). |

### Clusters (batch 5—additions)

| Cluster | Rows | Notes |
|---------|------|--------|
| **First impression & pre-run ritual** | **W41**, **W32** | Boot/hearth vs sporran ceremony—**one** “welcome to the moor” owner (load + handoff). |
| **Failure surfaces: coaching vs scenes** | **W42**, **W12** | Defeat/victory **theatre** vs ongoing **death literacy**—same copy discipline; avoid contradicting tone. |
| **Boss spectacle stack** | **W43**, **W23**, **W8** | Boss intro/outro canon vs elite grammar vs post-bell expansion—**W43** is encounter **pipeline**; **W8** is arc **depth**. |
| **Ground vs hazards** | **W44**, **W15**, **W37** | Terrain art direction vs hazard ecology vs peat/heather canon—shared **readability under combat**. |
| **Comfort: settings vs pause** | **W45**, **W35**, **W1** | Comfort matrix ship vs sanctuary pause vs soul weave—**W45** is **settings + doc + CI**; **W35** is **in-run**. |
| **Audio stack** | **W47**, **W28**, **CP2** | SFX covenant vs folk stems vs generic SFX scale-up—**one** loudness/priority policy. |
| **Taxman narrative** | **W48**, **W8** | Mythos bible supports post-bell program—writer continuity, not two Taxmen. |
| **Reactive hooks** | **W49**, **W22**, **W39** | Event bus API vs moor songbook vs chronicle weave—**event schema** owner or content forks. |
| **Capture & share** | **W50**, **W20**, **W27** | Photo mode vs postcards vs highlight reel—**share surface** owner (see earlier cluster). |

### Clusters (batch 6—additions)

| Cluster | Rows | Notes |
|---------|------|--------|
| **Onboarding stack** | **W51**, **W19**, **W41**, **W32** | Golden path (first ~30m) vs lifelong tutorial vs boot vs sporran—**one** onboarding owner or the first hour feels stitched from four products. |
| **RNG & run definition** | **W52**, **W46**, **W33** | Seed honesty vs modifier algebra vs Voronoi fairness—**player-facing** RNG story vs **internal** validation. |
| **Ship & discoverability** | **W55**, **PB1**, **CP4** | Storefront theatre vs platform integration vs trailer pipeline—**one** external-facing story per release. |
| **Readability under weather** | **W56**, **W3**, **W16** | Dreich visibility vs atmosphere director vs juice orchestra—**silhouette policy** once. |
| **Bell audio spine** | **W57**, **W8**, **W28** | Bell sonic seal vs post-bell arc vs folk stems—**W57** is **ear identity** for the bell moment specifically. |
| **Fairness: meta vs moment** | **W58**, **W25**, **W12** | In-run frustration safeguards vs golden haggis philanthropy vs death literacy—same **kind** tone, different systems. |
| **Credits & community** | **W53**, **W59**, **H4** | Hearth of names vs Open Moor vs open-source strategy—legal + gratitude + governance together. |
| **Bestiary & content seasons** | **W60**, **W5**, **W17**, **Part 1 C3** | Live bestiary vs codex vs almanac vs biome/enemy program—**one** “what we’re highlighting this month” owner. |
| **Speedrun & competition UX** | **W54**, **W33**, **H1**, **W10** | Timer suite vs cartography lab vs rules vs dailies—competitive clarity without five HUD modes. |

---

## Part 4 — Next steps when you pick a flagship

For whichever initiative you elevate:

1. **Problem statement** — player outcome + business/art outcome.
2. **Non-goals** — what you will not solve in v1.
3. **Spike plan** — 1–2 weeks, exit criteria.
4. **Verification** — tests, metrics, or review gates.
5. **Dependency map** — links to other rows in this file (use **unambiguous IDs**: Part 1 `C1` vs Part 2 `PB1`, etc.).
6. **Success metric or kill criterion** — at least one falsifiable outcome (e.g. retention, comprehension, support burden, perf budget) or an explicit **stop** condition if the spike fails—otherwise the initiative stays folklore.

---

## Part 5 — Wild Haggis–specific megaprograms (batch 1: W1–W10)

These are **large, game-shaped** initiatives tuned to *Wild Haggis Survivors*: moor fantasy, warm Scots-tinged voice, procedural music, biomes, post-bell escalation, chronicle/deeds, and the kindness-in-friction soul charter. They intentionally overlap existing rows (A–I) but name **product pillars** you could fund as flagship programs.

| ID | Initiative | Tier | Why it’s “huge” | Planning focus | Ties to repo / soul |
|----|------------|------|-----------------|----------------|---------------------|
| **W1** | **Soul Weave certification** — measurable `DESIGN_SOUL.md` gates per surface | A | Culture + tooling + release discipline; every feature must pass “moor kindness,” banter safety, and readability—not one-off reviews. | Lintable copy rules; banter duplicate/tone checks; accessibility + contrast budgets in CI; “soul regression” checklist per milestone. | `docs/DESIGN_SOUL.md`; BanterSystem; UI/copy. |
| **W2** | **The Moor Road — multi-act campaign spine** | S | Reframes the game from “one endless arena” to optional **chapters** with between-act choices, persistent modifiers, and narrative payoffs without abandoning the core loop. | Act boundaries; save schema; variant unlock pacing; how Taxman/post-bell interact per act. | RunLifecycle, RunHistory, variants, PostBellEscalation. |
| **W3** | **Highland Weather & Atmosphere Director** | A | One **director** ties fog, rain, midge pressure, spawn curves, and music stems into a coherent “living moor” instead of independent toggles. | Unified state machine; perf budget; BiomeManager + ProceduralMusicEngine + SpawnSystem contracts. | BiomeManager, ProceduralMusicEngine, SpawnSystem. |
| **W4** | **Glesga Voice Bible + Banter cinematic pipeline** | S | Writers’ room scale: glossary, context matrix, trigger hygiene, **optional VO**, and QA tools (duplicates, tone drift, spoiler leaks). | Authoring workflow; BanterContext weight tables; tooling for non-engineers; localization hooks if Scots ↔ English toggles expand. | BanterSystem, moor moments, PRD voice goals. |
| **W5** | **Living Bestiary & Haggis Mythology Codex** | B | Cross-links enemies, elites, bosses, deeds, chronicle entries, and unlockable **lore** with optional mechanical hints (without spoiling discovery). | Data model for codex pages; unlock rules; UI depth; anti-spoiler UX. | Enemy definitions, Chronicle, Deeds, achievements. |
| **W6** | **Ceilidh Session layer** (local / async social framing) | A | Scottish social fantasy: named sessions, shared seed etiquette, milestone toasts, optional **async relay** (“pass the sporran”)—community without mandatory realtime PvP. | Privacy; abuse reporting; session IDs; intersects **P1–P4** (online/fairness), **PB1–PB4** (store/shells/compliance), **H2** (community tooling)—sequence does not remove need for fairness design. | Seeds, dailies, **H2**. |
| **W7** | **Whisky Cask meta progression** | B | Long-horizon meta that **ages** (runs or real-time caps) unlocking cosmetics, curios, or tartans—economy design to avoid predatory FOMO while rewarding return visits. | Anti-exploit caps; clarity of “what ages”; store ethics; migration if timers change. | Meta-shop, cosmetics, golden haggis economy. |
| **W8** | **Bell / Post-Bell narrative expansion** | S | Multiple **endgame fates**, secret phases, music acts, and chronicle integration so the Taxman arc feels like a authored conclusion—not a single spike. | Boss scripting budget; music act transitions; save compatibility; difficulty equity. | PostBellEscalation, Taxman, ProceduralMusicEngine. |
| **W9** | **Interactive Map of Scotland (meta geography)** | B | Unlock regions on a stylized map that weight biomes, variants, or moor moments—travel fantasy + clarity of “what’s new” after each run. | Map art pipeline; unlock graph; avoids empty map syndrome. | Variants, biomes, deeds, run history summaries. |
| **W10** | **Curated Daily Highlands** — moderated challenge authoring | A | Elevate seeds/dailies into a **curated** program: mutator presets, validation sandbox, curator tools, and clear player-facing rules—ties community ops to soul charter. | Moderation workflow; exploit review; fairness layers (**P4** if competitive integrity matters), telemetry schema (**T2** / **O2** opt-in), anti-cheat posture (**B2**) if ladders are serious. | Daily/seed systems, **H2**, **P4**, **T2**. |

**Sequencing note (batch 1):** W2, W4, and W8 are likely **multi-year** if taken seriously; W1 and W3 raise quality for everything else; W5–W7 and W9–W10 deepen retention and community without requiring netcode first.

---

## Part 6 — Wild Haggis megaprograms (batch 2: W11–W20)

**Intent.** This second wave deliberately pushes on **systems that already exist but are “thin slices”**—coaching after failure, hazards as ecology, curses as authored seasons, tutorial as lifelong mentorship, exportable chronicles, and a serious **Scots language ship**—so the work is not generic “more content,” but **infrastructure + culture + production** at flagship scale. Together with Part 5, this batch completes **W1–W20** (Parts 7–10 continue with **W21–W60**).

| ID | Initiative | Tier | Why it’s “huge” | Planning focus | Ties to repo / soul |
|----|------------|------|-----------------|----------------|---------------------|
| **W11** | **Bothy Hall — navigable meta hub** | S | Turns Shop / MetaShop from **menus into a place**: rooms, inspectables, micro-vignettes, and “cozy between storms” as a **spatial** experience—without abandoning fast reruns. | Scene graph vs lightweight 2.5D; what is mandatory vs optional per session; save hooks for hub state; performance on web. | Meta flow in PRD; soul principle *cozy between storms* (`DESIGN_SOUL.md`). |
| **W12** | **Death Literacy Institute** — compassionate after-action | A | Scales `DeathCauseTracker` + classifier into a **player-trusted coach**: trends, plain-language tips, and hope-forward copy—**never** shame metrics. | Privacy (local-first); copy governance; which stats are actionable vs anxiety-inducing; integration with game over + chronicle. | `DeathCauseTracker`, `deathCauseClassifier`, `DESIGN_SOUL` failure/recovery. |
| **W13** | **Curse Pacts & covenant seasons** | S | Elevates `curses` from opt-in knobs to **named covenant lines** with rotating **seasonal** families, UI ritual (CurseScene depth), and balance matrices that don’t explode combinatorics. | Season cadence; deprecation; “pact identity” art/audio; test matrix per pact × variant. | `curses.ts`, `CurseScene`; overlaps **Part 1 C1/C2** (content + mutators); see **E2**. |
| **W14** | **Variant Mythos production line** | A | Each variant ships as a **complete fantasy SKU**: splash moment, stinger hooks in `ProceduralMusicEngine`, dedicated banter sub-pools, deed/chronicle entries—factory pipeline, not one-offs. | Asset budget; VO scope; definition of “done” per variant; avoids content starvation on old variants. | Variants, BanterSystem, PRD P4 banter authoring. |
| **W15** | **Hazard ecology & moor grammar** | A | Grows `HazardZones` + biome controller into a **readable environmental language**: more hazard archetypes, biome-tied placement rules, and teaching surfaces so hazards feel like **the land**, not random circles. | Art readability; fairness with melee builds; DeathCause attribution consistency. | `HazardZones`, `BiomeController`, `DeathCauseTracker`. |
| **W16** | **Juice & Readability Orchestra** | A | A program—not a tweak—unifying `JuiceSystem`, `StatusFxPool`, camera shake, boss hitstop, and **a11y** (flash density, motion scale interactions) under one **score** with budgets and CI smoke paths. | Priority rules when VFX stacks; seizure-risk policy; performance vs juice; “soul” without noise. | `JuiceSystem`, `StatusFxPool`, Comfort panel / captions. |
| **W17** | **Shepherd’s Almanac** — cultural live seasons | B | Ethically researched **Scottish calendar** beats (e.g. Burns, Highland summer, winter light) as authored live events: respectful sourcing, moderation, and clear opt-out—**not** cynical FOMO. | Cultural consultation; legal/trademark sensitivity; regional inclusivity inside Scotland; ops playbook. | Live ops (O3), W10 curation, soul charter warmth. |
| **W18** | **Scots voice edition (full bilingual ship)** | S | Makes deferred “second locale” in PRD a **flagship**: Scots + English parity for UI, banter keys, and glossary affordances—optionally staged (UI first, banter later). | TMS/process; translator brief aligned to Glesga voice; pluralization; QA matrix; optional VO scope creep control. | `i18n.ts`, PRD deferred localization, W4 glossary overlap. |
| **W19** | **Infinite Staircase tutorial & contextual mentorship** | A | `TutorialSystem` becomes a **lifelong** coach: triggers tied to deaths, curses accepted, first-time biome crosses, and deed milestones—always kind, never blocking flow for veterans. | Frequency caps; reset on new players; accessibility of tips; test harness for trigger DAG. | `TutorialSystem`, Tutorial tests, W12 death literacy. |
| **W20** | **Shareable Run Chronicle & moor postcards** | B | Run history / chronicle becomes **export artifacts**: postcard images, short generated blurbs from templates + run facts, privacy toggles, and anti-harassment defaults for shared links. | Template safety; PII; image pipeline; moderation if URLs are public; share card performance on mobile web. | `ChronicleScene`, run history, telemetry opt-in (PRD P5). **Non-goal:** free-form procedural narrative in-run (**M3**)—keep blurbs **template- and data-bound**. |

**Sequencing note (batch 2):** W11 and W13 are **structural**—they change how players inhabit the game between runs. W12, W16, and W19 are **quality multipliers** that compound. W18 is its own **multi-quarter** program if taken as “full” rather than phased. W15 and W20 reward teams who already invested in clarity (death causes, chronicle). W14 and W17 are **content throughput** programs—fund them only when pipelines exist.

---

## Part 7 — Wild Haggis megaprograms (batch 3: W21–W30)

**Intent.** Batch 3 targets **gaps** the first two batches circle but do not own: **weapon evolution** as a flagship emotional beat, **moor moments** as a composable content product, **elite/boss readability** as a discipline, **build identity** (StatComposer) as player pride, **auto-battle** as an intentional strategy layer, **music stems** as Scottish folk identity, **economy ethics** beyond aging cosmetics, **highlight sharing** lighter than full replay, **community kindness** as ops, and **deeds** framed without toxic completionism. Together with **Parts 8–10**, **W1–W60** are the Wild Haggis megaprogram set—still pick **one flagship** at a time.

| ID | Initiative | Tier | Why it’s “huge” | Planning focus | Ties to repo / soul |
|----|------------|------|-----------------|----------------|---------------------|
| **W21** | **Weapon Evolution Opera** | S | Level-up and **evolution** become the run’s **emotional spine**—choreographed juice, banter slots (PRD P4: evolution + curse beats), and clarity so choices feel like theatre, not spreadsheets. | Priority bands for `LevelUpFlow` / `UpgradeCards`; evolution-specific banter keys; animation/audio budget per tier; avoids overlap with **W14** (variant SKU) by owning **vertical power moments**. | `LevelUpFlow`, BanterSystem, `JuiceSystem`, PRD P4. |
| **W22** | **Moor Moment Songbook** | A | `moorMoments` graduate from clever triggers to a **composer pipeline**: seasonal packs, collision rules vs banter/music, preview tooling, and deprecation—**beats as shippable content**. | Authoring UX for non-engineers; test matrix vs `GLOBAL_RUN_TIME_SEC`; frequency governance vs Gabby banter. | `moorMoments`, BanterSystem, `ProceduralMusicEngine`. |
| **W23** | **Elite Grammar & Telegraphing Institute** | A | `eliteAffixes` + boss cadence as **readability science**: color/silhouette grammar, telegraph windows, melee fairness—so difficulty is **learnable**, not merely higher numbers. | Affix combinatorics caps; screen-reader/caption hooks for elites; ties to **W16** (juice budgets). | `eliteAffixes`, `Enemy`, boss scripts, soul *kindness in friction*. |
| **W24** | **Build Identity & StatComposer Showcase** | B | Post-run and meta surfaces that celebrate **what you built**: StatComposer-driven **“ken o’ the run”** summaries, deed hooks for oddball builds, optional share strings—**pride in mastery** without leaderboard poison. | What stats are legible vs spoilery; save fields; overlap with **W20** (export chooses snapshot vs build card). | StatComposer, deeds, achievements, `DESIGN_SOUL` mastery. |
| **W25** | **Golden Haggis Philanthropy Layer** | A | **Economy ethics** distinct from **W7** (aging cask): transparent pity/soft caps, new-player dignity, anti-exploit clarity, and honest copy for meta currency—**generosity as design**, not just balance. | Simulations; UI surfacing; store ethics if real money ever appears; migration safety. | Meta-shop, golden haggis, `DESIGN_SOUL` non-transactional tone. |
| **W26** | **Piper’s Path — auto-battle & steering pillar** | B | `computeAutoBattleSteering` + time-scale become a **designed** band: accessibility path, optional “conductor” mastery, and tutorial honesty—**not** a hidden crutch or dev-only joke. | Difficulty scaling when auto; input fairness; docs + maybe deeds for “hands-off” clears. | GameScene auto-battle hooks, `TutorialSystem`, a11y. |
| **W27** | **Run Theatre — highlight reel & seed moments** | B | Lighter than **T1** full replay: **deterministic highlight extraction** (seed + timestamps → clip/GIF/WebM) for boss kills, bell moments, near-deaths—feeds sharing adjacent to **W20** without claiming full determinism replay. | Storage size; privacy; what’s worth auto-cutting; falls back gracefully on web. | Run history, `RunLifecycle`, chronicle. |
| **W28** | **Folk Stem Forge** | S | `ProceduralMusicEngine` gets **authored Scottish folk stem families**, boss-phase swaps, and recording rights pipeline—**sonic identity** as a program, not one-off tracks. Overlaps **CP1**; this row is the **game contract** (when stems change, what breaks). | Stem count vs bundle **R1** budget; middleware; Wwise/WebAudio limits; **W8** music acts. | `ProceduralMusicEngine`, post-bell, biomes. |
| **W29** | **Kindness Ops — community charter & safety** | A | Productized **moderation** for **W6**/**W10**: reporting hooks, rate limits, clear rules, escalation playbooks—**moor kindness** as ops, not Discord hope. | Minors; GDPR; what ships in-client vs web; ties **PB4** compliance. | Ceilidh/dailies, soul charter, **H2**. |
| **W30** | **Deeds Without Doom** | B | Achievements/deeds framed to **avoid FOMO shame**: missable policy, compassionate copy, “good enough” celebration—psychology of collection aligned with **DESIGN_SOUL** failure/recovery. | Anti-dark-pattern review; Steam/API constraints if applicable; chronicle integration. | Achievements, deeds, `ChronicleScene`. |

**Sequencing note (batch 3):** **W21** and **W28** are **showcase** programs—high cost, high identity. **W23** and **W25** improve **fairness and trust** for everyone. **W22** needs tooling maturity. **W27**/**W24**/**W20** should share one **“share surface”** owner to avoid three competing export UIs. **W29** before scaling **W6**/**W10** if community grows. **W26** is safe to spike small. **W30** is often underestimated—involve UX copy early.

---

## Part 8 — Wild Haggis megaprograms (batch 4: W31–W40)

**Intent.** Batch 4 focuses on **moments and infrastructure** that batches 1–3 name but rarely **own**: **biome crossings** as pageantry, **pre-run ritual**, **Voronoi fairness** for seeds, **pickup pacing** as an instrument, **pause** as sanctuary, **debug transparency** as player trust, **hazard heritage** tied to land, **weapon motion language**, **chronicle as long-arc narrative**, and **CI/content gatekeeping** so soul does not regress silently.

| ID | Initiative | Tier | Why it’s “huge” | Planning focus | Ties to repo / soul |
|----|------------|------|-----------------|----------------|---------------------|
| **W31** | **Burn Crossing Pageantry** | A | `BiomeController` boundaries become **set-pieces**: sting + banter + optional caption on region change—**joy in motion** when the moor shifts, not a silent palette swap. | Frequency caps vs noise; performance; integration with **W22** moor moments and **W28** stems. | `BiomeController`, BanterSystem, `ISceneContext.getCurrentBiomeId`. |
| **W32** | **Sporran Ceremony — pre-run loadout theatre** | A | Menu → Game handoff as **ritual**: variant + curse + meta modifiers presented with clarity, warmth, and veteran **skip** paths—identity in the first seconds (`DESIGN_SOUL` run start). | Scene timing; save of “don’t show again”; coordinate splash/VO production with **W14** (variant SKU) if both ship. | Menu → Game flow, `CurseScene`, variants, soul *run start*. |
| **W33** | **Voronoi Fairness & Moor Cartography Lab** | B | Voronoi biomes as **seed-legible**: explainable zone layout for curious players, optional **tournament / daily** fairness language—**not** full esports, but “why this seed feels fair or spicy.” | Visualization cost; what to expose without spoilers; ties **W10** daily curation. | `BiomeManager`/Voronoi, seeds, **H1** speedrun categories (optional). |
| **W34** | **Pickup Symphony** | A | `PickupSpawner` + XP/gold economy as a **pacing program**: curves, droughts, bursts, and telemetry hooks (**T2**) so pickups feel **composed**, not accidentally noisy. | Balance vs readability; mobile web perf; death cause correlation (gold starvation?). | `PickupSpawner`, XP loop, PRD P5 observability. |
| **W35** | **Sanctuary Pause** | B | `PauseMenu` as **comfort HQ**: fast a11y toggles, caption/banter controls, calm copy, “take a breath” framing—**cozy between storms** without leaving the run. | Input focus; what belongs in pause vs **Comfort** settings; **W16** flash policy. | `PauseMenu`, Comfort panel, captions, BanterSystem frequency. |
| **W36** | **Transparent Moor (player trust mode)** | B | Evolve `DebugOverlay` into opt-in **trust surfaces** (pool depth, tween pressure, music lookahead—PRD P5)—honesty for curious players, **not** a shame readout. | Abuse surface (spoils secrets?); tiered detail; keybind policy. | `DebugOverlay`, `ProceduralMusicEngine`, PRD P5. |
| **W37** | **Hazard Heritage — peat, burn & heather canon** | A | Named hazard **families** beyond generic zones: lore-readable **peat bog**, **gorse**, **heather** patterns tying **W15** to biome identity and chronicle—land remembers. | Art/SFX budget; fairness vs melee; **DeathCause** consistency. | `HazardZones`, `BiomeController`, chronicle/deeds. |
| **W38** | **Weapon Families Ballet** | S | `WeaponSystem` families as **motion languages**: distinct animation, SFX, screen-safe rules, and evolution hooks so weapons feel like **characters**, not interchangeable DPS tubes. | Cross-weapon balance; **W21** evolution beats; pool/VFX load (**R1**, **W16**). | `WeaponSystem`, `JuiceSystem`, `LevelUpFlow`. |
| **W39** | **Chronicle Weave — run history as long arc** | A | Run history / chronicle becomes **motifs across runs**: callbacks, recurring phrases, gentle continuity—opt-in **meta story** without blocking evergreen play (**Part 1 D3**, WH-flavored). | Spoiler policy; save size; writer pipeline vs **W20** postcards. | `ChronicleScene`, run history, deeds. |
| **W40** | **CI & Content Gatekeeping** | A | Automation that **protects soul**: i18n smoke, banter schema validity, layout regression hooks, optional soul checklist in CI—**W1** at industrial scale; **G2**-adjacent. | Flake management; what blocks release vs warns; contributor UX. | `npm test`, `AGENTS.md`, BanterSystem data, **F1** visual regression. |

**Sequencing note (batch 4):** **W38** is a **combat identity** flagship—pairs naturally with **W21**/**W23**. **W31**/**W32**/**W35** polish **feel** for cheap relative wins if scoped. **W33** is niche—fund only if seeds/dailies are a public sport. **W40** pays rent early for small teams. **W37** needs art/audio headroom. **W34**/**W36** want **T2**/**R1** alignment before deep investment.

---

## Part 9 — Wild Haggis megaprograms (batch 5: W41–W50)

**Intent.** Batch 5 rounds out **surfaces the backlog rarely owns as flagships**: **boot and first impression**, **game over / victory compassion**, **boss encounter production**, **terrain as art identity**, the **Comfort matrix** (PRD P3), **run modifier algebra**, **SFX mix covenant**, **Taxman IP**, **event-bus narrative API**, and **photo capture** for sharing—each Wild Haggis–native, each easy to confuse with adjacent rows unless Part 3.5 clusters are respected.

| ID | Initiative | Tier | Why it’s “huge” | Planning focus | Ties to repo / soul |
|----|------------|------|-----------------|----------------|---------------------|
| **W41** | **Boot & Hearth — first-minute charter** | A | Boot → Menu → run entry as **one authored promise**: splash law, load honesty, perf budget, no dead air—extends `DESIGN_SOUL` *run start* **backward** into the first 60s. | Cold-load vs revisit; PWA precache interaction (**R1**); skip paths for veterans; no placeholder soul. | `BootScene`, `MenuScene`, PRD build/PWA. |
| **W42** | **Victory & Defeat Compassion Theatre** | A | `GameOverScene` + victory paths as **compassion theatre**: copy, layout, chronicle handoff, golden haggis tone—**failure informative**, celebration human—distinct from **W12** (ongoing coaching). | Grammar of “why”; overlap with **W30** deed tone; test smoke per PRD acceptance. | Game over / victory UI, `DESIGN_SOUL` failure & progression beats. |
| **W43** | **Boss Intro & Outro Canon** | S | Every boss encounter ships a **production contract**: intro/outro ritual, banter slots, juice budget, caption policy—**PRD** boss smoke becomes a **pipeline**, not ad-hoc scenes. | Tooling for designers; **W23** telegraph grammar; **W8** post-bell scope agreements. | Boss flows, BanterSystem, `JuiceSystem`, PRD manual smoke. |
| **W44** | **Highland Terrain Art Direction** | A | `createHighlandTerrain` / moor floor as **visual identity program**: palette locks, parallax/shader rules, perf vs beauty—**craft coherence** for the ground you fight on. | Art vs **R1**; readability under **W16** VFX; biome tint coordination (**W31**). | `highlandTerrain`, `BiomeRenderer`, biomes. |
| **W45** | **Comfort Matrix Ship** | A | Delivers PRD P3: **documented** Comfort panel + every knob in one matrix, designer-facing doc in `DESIGN_SOUL`, and CI smoke (motion off + high contrast + captions + banter off through boss)—**O1** as a shippable program. | SettingsManager/version gates; not duplicating **W35** (in-run pause)—**Comfort** is settings-first. | Comfort panel, `CaptionManager`, PRD P3, **W1** soul overlap. |
| **W46** | **Run DNA & Modifier Algebra** | B | `RunModifiers` + variants + curses as **composable, validated algebra**: “what this run is” summaries, safe previews, fewer impossible combos—feeds **W10**/**W33**/**W32**. | Schema migration (**R2**); UI one-liners; test matrix size. | `RunModifiers`, `defaultModifiers`, curses, variants. |
| **W47** | **SFX Hierarchy & Mix Covenant** | A | `SFXManager` + category rules as **one mix bible**: ducking, loudness caps, priority when 50 enemies scream—**CP2**-adjacent but **this** row is the **in-game contract** when balance shifts. | HDR vs web; **W16** clarity; boss sting vs pickup ping. | `SFXManager`, combat feedback, soul *joy in motion*. |
| **W48** | **Taxman Mythos Bible** | B | Character **IP** for the Taxman: voice rules, visual grammar, what can never be joked about, cross-chronicle consistency—supports **W8** without owning all engineering. | Writer lock; spoiler tiers; localization hooks (**W18**). | Taxman, PostBellEscalation, chronicle. |
| **W49** | **Event Bus Chronicle Hooks** | A | `globalEventBus` milestones (`GLOBAL_RUN_TIME_SEC`, kills, biome crosses) as a **stable narrative API** for banter, chronicle, achievements—reactive story without spaghetti scenes. | Versioning events; perf; docs for content authors; **W22** collision rules. | `globalEventBus`, BanterSystem, `ChronicleScene`. |
| **W50** | **Moorlight Photo Mode** | B | In-run **capture**: pause/slow “moorlight” framing for screenshots—feeds **W20**/**W27** share loops without replacing postcards; privacy (hide seed UI?). | Input; **W16** flash during capture; storage; falls back if web GPU weak. | Pause, camera, share cluster (**W20**, **W27**). |

**Sequencing note (batch 5):** **W43** and **W44** are **high visibility**—players feel them every run. **W45** is **foundational** if a11y is a brand promise. **W41**/**W42** are **soul ROI** if scoped (avoid gold-plating boot). **W47** pairs with **W28**/**CP2**—sequence audio programs. **W49** should land **before** scaling reactive content (**W22**, **W39**). **W50** shares an owner with **share surfaces** (Part 3.5). **W46** is leverage for curators (**W10**). **W48** is **cheap narrative insurance** before **W8** deepens.

---

## Part 10 — Wild Haggis megaprograms (batch 6: W51–W60)

**Intent.** Batch 6 adds **trust, ship, and spotlight** programs: a **golden onboarding path**, **RNG honesty**, **credits as ceremony**, **speedrun-ready UX**, **storefront voice**, **visibility under dreich weather**, **bell as sonic seal**, **in-run frustration kindness**, **open-moor contributors**, and **live bestiary seasons**—each distinct from prior batches but overlapping Part 3.5 clusters.

| ID | Initiative | Tier | Why it’s “huge” | Planning focus | Ties to repo / soul |
|----|------------|------|-----------------|----------------|---------------------|
| **W51** | **Golden Path — first thirty minutes** | A | Curated **onboarding runway**: first curse, biome cross, and level-up framed as one intentional arc—tighter than **W19** (lifelong tips) and deeper than **W41** (first minute only). | Pacing; skip for alts; telemetry on drop-off (**T2**); **W32** handoff. | `TutorialSystem`, `CurseScene`, `BiomeController`, soul *run start*. |
| **W52** | **RNG Covenant — seed honesty charter** | A | Player-facing **trust** in randomness: what is seeded, pity surfaces, reroll rules—without gifting exploits—pairs **W46** internals with **plain language**. | Copy + UI; competitive disclosure (**W10**); ties **W33** seed literacy. | Seeds, `RunModifiers`, fairness tone. |
| **W53** | **Credits & Hearth of Names** | B | Credits + attribution as **ceremony**—libs, fonts, music, testers, consultants—**craft coherence** in the scroll, not a punitive wall of text. | Legal completeness; scroll perf on web; **W18** translator credits. | Credits scene, OSS deps, soul *pride in craft*. |
| **W54** | **Highland Timer & Speedrun Suite** | B | In-game **timer**, splits, seed copy to clipboard, category hooks—**H1** as a **mode**, not a forum post. | Input chord; pause rules; **W33** fairness language optional. | Speedrun, **H1**, daily/seed culture. |
| **W55** | **Moor Market Stall — storefront theatre** | A | Steam / itch / web **store presence** with moor voice: capsule, short pitch, tags, “what is this game”—**PB1**-shaped but **Wild Haggis**-written; hooks **CP4** trailer moments. | Regional store copy; age rating copy; screenshot discipline. | Store pages, marketing, soul warmth. |
| **W56** | **Dreich & Drenched — visibility program** | A | Fog, rain, and particles vs **silhouette readability**: when the moor is miserable, combat stays **readable**—interfaces **W3** weather with **W16** clarity rules. | Contrast under weather; **W45** high-contrast path; perf (**R1**). | Weather VFX, `JuiceSystem`, biomes. |
| **W57** | **Bell Sonic Seal** | A | Bell and post-bell transitions as **audio trademark**: sting grammar, ear-safe peaks, handoff to **ProceduralMusicEngine**—**W8**/**W28** spine for the **ear**. | Loudness; seizure/audio comfort; boss overlap **W43**. | Bell moments, `ProceduralMusicEngine`, post-bell. |
| **W58** | **Frustration Safeguards (in-run)** | B | **Moment-to-moment** kindness when RNG hurts: streak messaging, optional micro-clarity (“avoidable vs rude”), no shaming—**W25** is **meta economy**; this is **the fight**. | Anti-exploit; overlap **W12** tone; death cause hooks. | `DeathCauseTracker`, combat UX, soul *failure informative*. |
| **W59** | **Open Moor — contributor program** | B | If **FOSS** or community PRs: **H4** with moor rules—CLA, credit in **W53**, review kindness—pairs **W40** CI policy. | License; security review; contributor onboarding doc. | **H4**, `AGENTS.md`, governance. |
| **W60** | **Haggis Bestiary Live** | A | **Rotating enemy spotlight** seasons with short commentary (blog-sized or in-codex)—live ops + **Part 1 C3** enemy program without replacing **W5** codex depth. | Spoilers; balance hype; **W17** seasonal cadence optional. | Enemies, deeds, live ops (**O3**). |

**Sequencing note (batch 6):** **W55**/**W53** matter on **ship days**. **W51**/**W52** reduce churn and trust issues early. **W56**/**W57** need audio/art headroom—coordinate **W28**/**W47**. **W54** is optional unless speedrun is a channel. **W59** only if repo opens. **W60** feeds content marketing—pair with **W5**/**W17** owners.

---

*Document generated as a planning artifact. Update in place as initiatives split, merge, or ship.*
