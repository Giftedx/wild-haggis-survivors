# Wild Haggis Survivors — PRD / Roadmap

**Scope:** Stability, maintainability, and shipping velocity without changing core gameplay feel.

## Current Snapshot (2026-05-11)

### Stack

- **Engine:** Phaser **4.0** + Vite 6 + TypeScript 6 + Vitest 3 (migrated 2026-04-23, see memory `project_phaser4_status` and `docs/superpowers/plans/2026-04-23-phaser4-migration.md`).
- **Game version:** `2.3.2` (`package.json`).
- **Game loop:** Boot → Menu (variants) → Game (survivors loop + biomes + curses + post-bell endless + W2 Moor Road acts + M1 multi-node graph) → Shop / MetaShop. CroftScene is the persistent hub between runs (H1, shipped 2026-04-24).
- **Persistence:**
  - `whs_save` (legacy combined save) — schema `SAVE_SCHEMA_VERSION = 19` (see `src/utils/save/schema.ts`; v19 added Sporran chronicle persistence, 2026-05-10).
  - `whs_meta_save` (`SaveManager`) — `CURRENT_SAVE_VERSION = 9` (see `src/core/SaveManager.ts`).
  - `whs_game_settings` (`SettingsManager`) — settings schema v1.
- **Tests:** 488 vitest files; 5194 test cases (verified 2026-05-11 via `npm test`).
- **Weapons:** 11 (10 with paired-passive evolutions; bagpipes utility-only). `BURNS_EVOLUTION_THRESHOLD = EVOLUTION_RECIPES.length` (derived; see `src/core/BalanceConfig.ts`).
- **TODO/FIXME markers in production:** zero.
- **Production `as any` count:** zero (residual hits are doc-comment self-references).

### Flagship status (15 of 20 shipped; 2 partial; 3 deferred)

| ID | Flagship | State (as of 2026-05-08) |
|---|---|---|
| **W2** Moor Road | ✅ Shipped 2026-04-16 |
| **W18** Bilingual SCS | ✅ Shipped 2026-04-18 (Phase A + B; banter parity fence locks future additions) |
| **W66** Ironmoor | ✅ Shipped 2026-04-16 |
| **T1** Deterministic replay | ✅ Shipped 2026-04-17/18 (3 phases, see `project_t1_replay_status`) |
| **F1** Shader pipeline + Haar | ✅ Shipped 2026-04-24 |
| **H1** Gran's Croft | ✅ Shipped 2026-04-24 |
| **M1** Moor Road multi-node | ✅ Shipped 2026-04-24 + all 8 follow-ups (F1–F8) |
| **C1** Highland Almanac | ✅ Shipped 2026-04-24 (`9bd56cd`) |
| **R1** Relics third tier | ✅ Shipped 2026-04-24 (`214e9ce`) — all 18 effects live |
| **V2** Variants pack | ✅ Shipped 2026-04-24 (14-roster); 15th variant Witch's Hare added 2026-04-28 |
| **U1** Runes | ✅ Shipped 2026-04-25 (30 runes); B5 Phases 0/1a/1b/2 grounded 31/31 except `edinburgh_rune` |
| **E1** Seasonal events + Burns Night | ✅ Shipped 2026-04-24 (4 milestones; cohort grew 5→8 events 2026-04-29) |
| **C2** Weapon lore pass | ✅ Shipped (truth-up 2026-04-26 — actual lore footprint 103 EN leaves; 30 SCS rune overlays + flavour parity fence). Native + Burns review still open. |
| **A1** Accessibility foundation | 🟡 M2–M6 shipped 2026-04-24; **M1 PEAT audit human-gated** (see `docs/A1_PEAT_AUDIT.md`). |
| **W71** Skeletal animation rig | 🟡 Phase 0 prototype shipped 2026-04-22; Phase 1 enemy animation + Phase 2 secondary motion shipped 2026-04-23 (memory `project_w71_phase2_status`). Full rig still open. |
| **B5** Biomes charter | ✅ Phases 0–2 shipped 2026-04-29/30 (Seawrack `a160662`, Haar `4c97626`, Frost `24c9301`); Phase 3 Edinburgh blocked on cultural consultation. |
| **W95** Mobile rework | ⏳ Not started — playtest matrix at `docs/MOBILE_DEVICE_TEST_MATRIX.md` pending hardware. |
| **W27** Capture & share | 🟡 Phase 0 postcard prototype shipped 2026-04-17/18; Phase 2 screenshot + rolling clip export + audio tap + clipboard path shipped 2026-04-22/26. 2026-05-11 reliability hardening added MP4 fallback + extension-correct filenames + unsupported-browser feedback. **W82 seed-share URLs shipped 2026-05-11** — Game Over "↗ share this run" → clipboard URL; recipient skips menu and starts with sharer's seed + variant + curse (`src/utils/sharedRunUrl.ts`, BootScene router, banner toast). **W82 V2 same day**: challenge-mode URLs add the sharer's outcome (`t` + `o` params) so the recipient banner reads "↗ Shared run · ... · 12:34 to beat / outlast" — Hearth-voice tail, defensive parse drops malformed challenges. **W82 Phase 3 same day**: boss-kill highlights — `ClipRecorder.snapshot()` lifts a non-destructive copy of the rolling buffer into `GameScene.bossKillHighlight` at every boss kill (latest-only), and a "🎬 Save <boss> kill" link on Game Over downloads it as `whs_highlight_<variant>_<boss>_<mm-ss>_<date>.<webm|mp4>`. Recorder keeps rolling for future kills. Unified share surface (one button that produces postcard + clip + share URL together) still open. **2026-05-11 (same day): Wee Tales** — italic procedural prose epitaph closes every run as a footer below the Game Over action row. Pure picker (`src/utils/weeTale.ts`) filters a 17-template catalogue by tag-set, weights matches by 4^specificity, returns an `{ i18nKey, params }` descriptor; scene resolves enemy keys to display names via `getEnemyDisplayName` and feeds the result through `t()`. Hearth voice — grave-warm death, warm-without-bragging victory. EN + SCS parity fenced at `i18n.locale.test.ts`. Seed-deterministic (sub-RNG branched off `runSeed` ^ magic). E2E at `e2e/wee-tale.spec.ts`. |
| **P3** Cloud saves | ⏳ Worker + D1 backend prototype shipped via top-10 #3 (2026-04-27); UX + conflict resolution + privacy/legal humans-in-the-loop still open ([`ADR-0006`](adr/0006-cloud-save-backend.md) **Accepted** 2026-05-09 — architecture only). |
| **B1** Banter density push | ✅ All phases (1–5) shipped 2026-04-26; native Gaelic review on 8 leaves still open. |

### 2026-05-09 mechanics ship sprint

A solo-dev sprint shipped 13 features in one day, twelve from `docs/DESIGN_IDEAS.md` §1+§3+§5+§11+§13 plus a thirteenth pre-run system foundation (Sporran Deck Phase 0). All carry STATUS markers in memory (`project_<name>_status`) and are reflected in `CLAUDE.md` "Key Mechanics". Sprint commits between today's session start and tip:

| Item | Source | Commit | Notes |
|---|---|---|---|
| N1 Nicnevin | DESIGN_IDEAS §3 | `c93cb3c` | Wild-Hunt gem-pull boss; Solway Remnant cultural-review-gated |
| Cairn Stacking pickup | DESIGN_IDEAS §1 | `e3c3455` | 3-stone heal+magnet boon |
| Stance Toggle (Q) | DESIGN_IDEAS §1 | `611ca51` | loose/braced/reeling persistent posture |
| Shinty Parry (E) | DESIGN_IDEAS §1 | `12357dc` | 350ms negate window vs enemy projectiles |
| Clootie Wager landmark | DESIGN_IDEAS §1 | `a6da306` | Walk-through wages 12% max-HP for run-long boon |
| Taxman Grudge Ledger | DESIGN_IDEAS §1 | `50623c8` | Silent finish-tracker → Taxman victory line verdict |
| Lemmings easter egg | DESIGN_IDEAS §13 | `58664e7` | 90s coastal idle → DMA Design 1991 cliff-fall homage |
| Shinty Stick + Caman Storm evolution | DESIGN_IDEAS §1+§5 | (today) | 9th weapon + 8th evolution |
| Race the Beithir | DESIGN_IDEAS §1+§3 | `9f6a694` | Venom-fang opens 8s heal-or-kill race |
| Sgian Dubh + Sgian Geal evolution | DESIGN_IDEAS §5 | `92a0e2a` | 10th weapon + 9th evolution; forced-crit |
| Stag Antler + Monarch's Charge | DESIGN_IDEAS §5 | `805e03c` | 11th weapon + 10th evolution; dash-strike fork |
| Field Note Pickup | DESIGN_IDEAS §11 | `8e9487d` | haggis_hunter Foundation notebook page |
| Sporran Deck Phase 0 | DESIGN_IDEAS §1 (S1) | `eabe2a6` | Pure helper + 11-card pool + 20 tests; pre-run 7-card draft, no runtime wiring yet |

`BURNS_EVOLUTION_THRESHOLD` lifted 7→8→9→10 across the four weapon ships.

### Active fronts

- **Codebase restructure (2026-04-30)** — Phases 0–7 SHIPPED by 2026-05-09; T401 GameScene decomposition is the historical chain that fed it (3526 → 1819 LOC at the 2026-05-10 baseline). Current GameScene **1841 LOC** (hard-ceilinged at 2200; per-file ratchet retired 2026-05-10 — see [`docs/LOC_BUDGET.md`](LOC_BUDGET.md) + [`docs/REVIEW.md` C2](REVIEW.md)). ≤1200 facade-rewrite target remains out of scope.
- **Cultural review gates** — Doric + Shetlandic native-speaker review (`docs/C2_DIALECT_REVIEW.md`), Burns Kinsley + Canongate audit (`docs/C2_BURNS_PROVENANCE.md`), 8 Gaelic banter leaves flagged.

### Next flagship slot — declared polish / content phase (2026-05-09)

**Lead-dev decision:** No flagship picked. The project is in a polish + content-density phase until one of the re-open triggers in [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) Q8 fires. Rationale:

- A1 PEAT, native cultural review, W95 mobile device matrix, and P3 cloud-save humans-in-the-loop work all need real human action a solo dev can't self-execute.
- Today's mechanics ship sprint (12 features) shows momentum is in mechanics + content, not flagship infrastructure.
- Codebase restructure shipped Phases 0–7 on the same day; the ≤1200 GameScene facade target is explicitly out-of-scope.
- A flagship without owner + non-goals + kill criterion is an idea, not a flagship (master plan rule).

**P3 architectural ratification (2026-05-09):** ADR-0006 promoted from `.draft.md` → `.md`; Cloudflare Workers + D1 + magic-link via Resend is the locked architectural choice. P3 itself stays parked behind privacy-policy text + Cloudflare account provisioning humans-in-the-loop work.

---

## Previous snapshot (2026-04-23 — research + planning pass complete)

**2026-04-23 delivered:** Research phase complete (8 deep docs, ~150k words) across roguelite patterns, Scottish content ×2, game feel, music/art tech, accessibility, cultural sensitivities, narrative design. Foundational docs refreshed. Master plan updated with 10 new flagship rows + 1 polish ticket. **11 design specs** drafted at `docs/superpowers/specs/2026-04-23-*.md` + **11 execution plans** at `docs/superpowers/plans/2026-04-23-*.md`. Research-corpus index at `docs/research/README.md`. Two new ADRs (0003 ShaderRegistry, 0004 SeasonalEventManager).

---

## Previous snapshot (2026-04-17)

- **Stack:** Phaser 3.90 + Vite 6 + TypeScript 6 + Vitest 3
- **Game loop:** Boot → Menu (variants) → Game (survivors loop + biomes +
  curses + post-bell endless + W2 Moor Road acts) → Shop (Golden
  Haggis meta) / MetaShop
- **Persistence:** localStorage save with schema migration
  (`SAVE_SCHEMA_VERSION = 4`, W2-routes bump) + `SettingsManager`
  with independent version gate
- **Tests:** 232 files, 2325 tests, full green
- **Build:** `npm run build` clean (~6.2s); vendor-phaser chunk
  ~1.48MB (gzip ~340KB), app chunk ~679KB (gzip ~190KB)
- **Lint:** `npm run lint` clean (zero errors)
- **CI:** `.github/workflows/ci.yml` + `deploy.yml` present
- **TODO/FIXME markers:** zero (in production code)
- **Scene reach-through (`this.scene as unknown`)**: **0** — fully
  retired. ISceneContext extended with optional `caption`,
  `requestBanter`, `getCurrentBiomeId`, `getSecondsPastBell` surfaces.
- **Production `as any` count:** **0** (17 → 0 since last PRD; two
  residual hits are doc-comment self-references in
  `LevelUpFlow.ts` / `PickupSpawner.ts`, not real casts).
- **Real timers (setTimeout/setInterval) outside tests:** 7 files
  — tightly scoped cluster: audio (AudioSystem, audioContext),
  music (ProceduralMusicEngine, NoteScheduler), TimeManager
  `scheduleRealTime` wrapper, FilmGrainOverlay, main.ts bootstrap.
- **PWA precache:** 2116 KiB (7 entries).
- **Systems shipped since last PRD:**
  - **W2 Moor Road** (2026-04-16) — 3 acts, 2 pickers, 6 routes,
    `RunActState`, `ActIntermissionScene`, Skip Intermissions opt-out,
    Chronicle route breadcrumb, Playwright smoke, Glesga voice pass,
    bilingual Scots strings, four resume-correctness bug fixes
    (bag-vs-cached-field, actState replay on resume, Ironmoor
    mid-run toggle lock, abandon-vs-pagehide auto-save race).
  - **W66 Ironmoor** (2026-04-16) — opt-in permadeath alt mode,
    separate `bestIronmoorSeconds` leaderboard, chronicle-wipe-on-
    death, ironmoor run_start/run_end telemetry flag.
  - **W18 Bilingual (Scots / English)** Phase A + Phase B v1
    (2026-04-16 → 2026-04-17) — `LOCALES` map, `setLocale`,
    populated `SCS_STRINGS` across UI shell, toasts, decision
    moments, loadout, bosses, biomes, tutorial; parity regression
    test. Banter pool still deferred (closed via Phase B 2026-04-18 — see [`docs/archive/BANTER_GAPS.md`](archive/BANTER_GAPS.md)).
  - **Analytics / portal telemetry** (2026-04-17) — six-commit pass:
    variant/curse/ironmoor/daily/deathCause tags on run_start /
    run_end, weapon_evolved + achievement_unlocked +
    codex_first_cull + global_shop_purchase + route_picked
    subscribers. `AnalyticsManager.test.ts` 10 → 28 tests.
  - **Palette / colour-token consolidation** (2026-04-17 commit
    e020928) — `COLORS_CSS.BLACK` route 10 pure-black text strokes;
    chronicle row + menu + settings palette tests.
  - **Core systems previously noted:** a11y (motion scale, high
    contrast, captions, banter frequency), biomes (Voronoi moor
    regions), curses (opt-in run modifiers → bonus gold), post-bell
    endless mode, meta shop, run history / chronicles,
    DeathCauseTracker / classifier, Achievements, TutorialSystem,
    StatusFxPool, DebugOverlay, BiomeController, PauseMenu,
    PickupSpawner, LevelUpFlow, RunLifecycle, HazardZones,
    BanterSystem, ProceduralMusicEngine.

## Priority Queue

### P1 — Lifecycle & Typing Finish-Work ✅ CLOSED
- [x] **Kill the last 7 scene reach-throughs** (`this.scene as unknown`).
  Done 2026-04-13.
- [x] **Audit the 17 production `as any`** escape hatches. Done
  2026-04-17 — production count now 0; pool teardown helper plus
  typed narrowing adopted across GameScene, LevelUpFlow,
  PickupSpawner, input, XPSystem, WeaponSystem, UpgradeCards,
  SpawnSystem. The only remaining `as any` hits in `src/` are two
  self-referential doc comments (`LevelUpFlow.ts`,
  `PickupSpawner.ts`) explaining the retirement.

### P2 — Bundle & Asset Budget
- [x] Phaser vendor chunk is 1.48MB ungz. Investigate whether
  `phaser/src/phaser-core.js` (or build-time subset imports) can
  drop unused subsystems (we use Arcade physics, zero Tilemaps,
  zero Matter). **Done 2026-04-17.** Vite `resolve.alias`
  swaps `phaser` for the prebuilt `phaser/dist/phaser-arcade-physics.js`
  (Matter + Box2D dropped). Vendor chunk 1481.77 KB → 1362.90 KB
  (-118.87 KB uncompressed, -34.83 KB gzip). Combined with the
  Scots lazy-load, PWA precache dropped 2117 → 1965 KiB (-152 KiB).
  Runtime verified: MainMenu renders clean, no console errors,
  all 2336 tests pass.
- [x] PWA precache reports 2116 KiB — confirm that's acceptable
  for install-on-visit, or move large assets out of precache.
  **Resolved 2026-04-17: acceptable — and subsequently reduced.**
  Every byte is required on the first frame so runtime-caching
  would break offline-from-first-visit. The other two P2 items
  did most of the work: Scots lazy-load (-37 KiB from precache)
  plus Phaser arcade-physics subset (-115 KiB from precache) —
  total precache is now 1965 KiB, a 152 KiB drop from the
  original 2117 KiB without sacrificing the offline guarantee.
- [x] App chunk climbed 500 KB → 679 KB over the W2 / W66 / W18 pass.
  Investigate whether the Scots overlay + route data can be
  lazy-loaded (currently eager via `EN_STRINGS` / `SCS_STRINGS`
  imports). **Done 2026-04-17.** SCS_STRINGS extracted to
  `src/core/i18n.scs.ts`, lazy-loaded via `ensureLocaleReady`
  on locale switch. App chunk 679.74 KB → 641.68 KB (-38 KB,
  -14 KB gzip). PWA precache 2117 KiB → 2080 KiB (Scots chunk
  excluded via `workbox.globIgnores`). English-only players —
  the default — never download the Scots dictionary.

### P3 — Accessibility Finish-Work
- [x] Exercise the Comfort panel end-to-end in CI via a smoke test:
  motionScale=0 + highContrastUi + captions + banter=off through
  one full boss encounter. Done 2026-04-17 —
  `e2e/comfort-smoke.spec.ts` (commit 5696ddb).
- [x] Document the a11y matrix in `docs/DESIGN_SOUL.md` so designers
  can see every knob at a glance. Done 2026-04-17.

### P4 — Content Authoring Velocity
- [x] The `banter.ts` sub-pool schema is tag-driven — land a
  one-page "how to add a new boss / variant voice" note so future
  content drops don't require engine diffs. Done 2026-04-17 —
  `docs/BANTER_AUTHORING.md` (commit c621b09).
- [x] Consider extending banter to **weapon evolution moments** and
  **curse acceptance** — both have narrative weight and the
  priority slots are open (30-50 range).
  **Shipped pre-PRD-snapshot — `weapon_evolve` pool at priority
  65 with 8 weapon sub-tags, `curse_start` pool at priority 59
  with 5 curse sub-tags; triggers wired in `LevelUpFlow.ts:250`
  and `GameScene.ts:716`.** Verified 2026-04-17.
- [x] Finish **W18 Phase B — banter Scots overlay**. Done 2026-04-18 —
  294 leaf keys translated across generic + per-boss + per-variant +
  per-weapon + per-curse + per-biome + per-route sub-pools. Voice
  register per `feedback_voice_register` (Still Game hearth default,
  Limmy edge for boss warnings / low-HP / decision moments). Parity
  guard in `src/core/i18n.locale.test.ts` enforces every EN banter
  leaf has a Scots translation. See `docs/archive/BANTER_GAPS.md`.

### P5 — Observability
- [x] Ship a telemetry toggle (opt-in) for run-completion distribution
  + death-cause histogram. Done 2026-04-17 — see "Analytics /
  portal telemetry" under shipped systems.
- [x] DebugOverlay exists — surface active pool sizes, tween count,
  scheduled-music-events lookahead depth behind a keybind. Done
  2026-04-17 (commit 199083f).

## Acceptance Criteria (each queue item)

- `npm run lint` clean
- `npm test` 2325+ passing
- `npm run build` green
- No new `as any`, no new scene reach-through
- Manual smoke: pause, level-up modal, victory/death, scene restart,
  biome-cross, boss intro/outro, low-HP band, curse acceptance, W2
  act intermission, Ironmoor opt-in

## Deferred / Not This Pass

- Locales beyond English + Scots (infrastructure is ready; not
  committing to a third locale's maintenance burden yet).
- Cloud save (tracked as flagship P3 in the master plan).
- Gamepad rebinding UI (covered by A1 Accessibility foundation).

---

## 2026-04-23 flagship pipeline (from research pass)

Ten new flagships queued in `docs/HUGE_INITIATIVES_MASTER_PLAN.md`,
each with a design spec at `docs/superpowers/specs/2026-04-23-*.md`
and an execution plan at `docs/superpowers/plans/2026-04-23-*.md`:

| ID | Flagship | Tier | One-line |
|----|----------|------|----------|
| **A1** | Accessibility foundation | S | PEAT audit + colorblind modes + remapping + captions expansion + reduceFlashing + Assist Mode scaffold |
| **B1** | Banter Density Push | S | ~780 leaf keys across 9 pools (Gran, haggis ambient, enemy flavour, Cailleach, Burns, moor moments, death reflections, first-time, seasonal) |
| **R1** | Relics (third progression tier) | A | 18 handcrafted Relics with 3-slot cap; drop from elites/bosses/legendary chests |
| **V2** | Haggis Variants Pack | A | +3 new variants (Doric Quinie, Peerie Shetlander, Burns's Wee Beastie) — roster 10→13 |
| **F1** | Shader pipeline + Haar fog | A | `ShaderRegistry` infra + first signature shader; ADR-0003 |
| **H1** | Gran's Croft (hub that grows) | S | Persistent between-runs scene accumulating trophies + photos + drove + seasonal props |
| **M1** | Moor Road multi-node expansion | S | 7 node types per act (Encounter/Shrine/Trader/Hidden/Bargain/Rest/Elite); replay v3 |
| **U1** | Rune upgrades (rule-stack tier) | A | 30 Runes — conditional rules not flat stats (Balatro/Isaac pattern) |
| **E1** | Seasonal events + Burns Night | S | Calendar-date-gated event framework; Burns Night first event; ADR-0004 |
| **C1** | Highland Almanac | A | 4-book discovery log (Beasties/Weys/Finds/Banter) with silhouette teasing |
| **C2** | Weapon lore pass | — | Dark-Souls-style implied-history flavour across ~50 items (polish ticket, not flagship) |

**Rule-of-thumb preserved:** at-most-one flagship at a time. Sequence order
recommended by research: A1 → B1 → R1 → V2 → F1 → C1 → H1 → M1 → U1 → E1 → C2.
