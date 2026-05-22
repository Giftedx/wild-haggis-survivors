# Wild Haggis Survivors — PRD / Roadmap

**Scope:** Stability, maintainability, and shipping velocity without changing core gameplay feel.

## Current Snapshot (2026-05-22)

### Stack

- **Engine:** Phaser **4.0** + Vite 6 + TypeScript 6 + Vitest 3 (migrated 2026-04-23, see memory `project_phaser4_status` and `docs/superpowers/plans/2026-04-23-phaser4-migration.md`).
- **Game version:** `2.4.2` (`package.json`).
- **Game loop:** Boot → Menu (variants) → Game (survivors loop + biomes + curses + post-bell endless + W2 Moor Road acts + M1 multi-node graph) → Shop / MetaShop. CroftScene is the persistent hub between runs (H1, shipped 2026-04-24).
- **Persistence:**
  - `whs_save` (legacy combined save) — schema `SAVE_SCHEMA_VERSION = 23` (see `src/utils/save/schema.ts`). Migration chain since 2026-05-10: v18→v19 `RunHistoryEntry.sporranPicks` (S1 Phase 2 chronicle persistence), v19→v20 `beithirCuresLifetime`, v20→v21 `clootieWagersLifetime`, v21→v22 `cairnBlessingsLifetime` (DESIGN_IDEAS §1 mechanic-counter trio gating `*_first` banter sub-pools), v22→v23 `livingWorldUnlocks` (WLW Phase 2 companions roster — defaults `['sheepdog']` for pre-v23 saves).
  - `whs_meta_save` (`SaveManager`) — `CURRENT_SAVE_VERSION = 9` (see `src/core/SaveManager.ts`).
  - `whs_game_settings` (`SettingsManager`) — settings schema v1.
- **Tests:** 511 vitest files; 5435 test cases (verified 2026-05-22 via `npm test`).
- **Weapons:** 15 base families (14 with paired-passive evolutions; `bagpipes` utility-only). `EVOLUTION_RECIPES.length = 14`. `BURNS_EVOLUTION_THRESHOLD = 10` (frozen — the Pibroch Hammer carve-out at WLW Phase 2 means the recipe count drifts above the achievement gate by design; see `src/core/BalanceConfig.ts` rationale block).
- **Biomes:** 9 (`bog`, `loch`, `pine`, `heather`, `coastal`, `haar`, `frost`, `cairngorm`, `glen_coe`). **Hazards:** 9 (`peat_pit`, `falling_slate`, `burn_water`, `loose_scree`, `tidal_wrack`, `slick_cobble`, `rime_patch`, `wind_shear`, `highland_mist`). **Passives:** 16.
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
| **A1** Accessibility foundation | 🟡 M2–M6 shipped 2026-04-24; **M1 PEAT audit human-gated** (see `docs/A1_PEAT_AUDIT.md`). 2026-05-10 mitigations: `reduceFlashing` defaulted **ON**, first-launch photosensitivity splash, README disclosure of unaudited status (`docs/REVIEW.md` C5 closure). |
| **W71** Skeletal animation rig | 🟡 Phase 0 prototype shipped 2026-04-22; Phase 1 enemy animation + Phase 2 secondary motion shipped 2026-04-23 (memory `project_w71_phase2_status`). Full rig still open. |
| **B5** Biomes charter | ✅ Phases 0–2 shipped 2026-04-29/30 (Seawrack `a160662`, Haar `4c97626`, Frost `24c9301`); Phase 3 Edinburgh blocked on cultural consultation. |
| **B6** Highland Horrors content drop | ✅ Shipped 2026-05-12 (`c50403c`). 2 biomes (Cairngorm plateau + Glen Coe), 2 hazards (wind_shear + highland_mist), 3 weapon families (Dirk Dance → Dirk Flurry, Granny's Curse → Banshee Wail, Wallace Sword → Freedom Blade), 3 passives (Gillie's Edge / Widow's Shawl / Stirling Medal). Fences ratcheted: 15 weapons / 14 recipes / 16 passives / 9 hazards / 9 biomes. Playtester pass 2026-05-13 (`5d5827d` — v2.4.1: gamepad input, sheep pool, discard confirm, damage curve, post-bell hint). Dirk Flurry single-pass hot loop + post-cap echo polish 2026-05-14 (`1e32b72` — v2.4.2). E2E smoke coverage backfilled 2026-05-22. |
| **W95** Mobile rework | ⏳ Not started — playtest matrix at `docs/MOBILE_DEVICE_TEST_MATRIX.md` pending hardware. |
| **W27** Capture & share | 🟡 Phase 0 postcard prototype shipped 2026-04-17/18; Phase 2 screenshot + rolling clip export + audio tap + clipboard path shipped 2026-04-22/26. 2026-05-11 reliability hardening added MP4 fallback + extension-correct filenames + unsupported-browser feedback. **W82 seed-share URLs shipped 2026-05-11** — Game Over "↗ share this run" → clipboard URL; recipient skips menu and starts with sharer's seed + variant + curse (`src/utils/sharedRunUrl.ts`, BootScene router, banner toast). **W82 V2 same day**: challenge-mode URLs add `t` (seconds survived) + `o` (`v` victory / `d` death) so the recipient banner reads "↗ Shared run · <variant> · <curse> · 12:34 to beat / outlast" — Hearth-voice tail, defensive parse drops malformed challenges. **W82 Phase 3 same day**: boss-kill highlights — `ClipRecorder.snapshot()` lifts a non-destructive copy of the rolling buffer into `GameScene.bossKillHighlight` at every boss kill (latest-only), and a "🎬 Save <boss> kill" link on Game Over downloads it as `whs_highlight_<variant>_<boss>_<mm-ss>_<date>.<webm|mp4>`. Recorder keeps rolling for future kills. Unified share surface (one button that produces postcard + clip + share URL together) still open. **2026-05-11 (same day): Wee Tales** — italic procedural prose epitaph closes every run as a footer below the Game Over action row. Pure picker (`src/utils/weeTale.ts`) filters a 17-template catalogue by tag-set, weights matches by 4^specificity, returns an `{ i18nKey, params }` descriptor; scene resolves enemy keys to display names via `getEnemyDisplayName` and feeds the result through `t()`. Hearth voice — grave-warm death, warm-without-bragging victory. EN + SCS parity fenced at `i18n.locale.test.ts`. Seed-deterministic (sub-RNG branched off `runSeed` ^ magic). E2E at `e2e/wee-tale.spec.ts`. |
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

- **Codebase restructure (2026-04-30)** — Phases 0–7 SHIPPED by 2026-05-09; T401 GameScene decomposition is the historical chain that fed it (3526 → 1819 LOC at the 2026-05-10 baseline). Current GameScene **2021 LOC** (hard-ceilinged at 2200; per-file ratchet retired 2026-05-10 — see [`docs/LOC_BUDGET.md`](LOC_BUDGET.md) + [`docs/REVIEW.md` C2](REVIEW.md)). ≤1200 facade-rewrite target remains out of scope. Highland Horrors B6 + Croft mobile polish pushed it +180 LOC; ceiling has 179 LOC of headroom.
- **Croft mobile / interior polish (2026-05-14)** — `75f810d` mobile bottom-anchored action board + ledger panels + interior dressings.
- **Cultural review gates** — Doric + Shetlandic native-speaker review (`docs/C2_DIALECT_REVIEW.md`), Burns Kinsley + Canongate audit (`docs/C2_BURNS_PROVENANCE.md`), 8 Gaelic banter leaves flagged.

### Next flagship slot — declared polish / content phase (2026-05-09)

**Lead-dev decision:** No flagship picked. The project is in a polish + content-density phase until one of the re-open triggers in [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) Q8 fires. Rationale:

- A1 PEAT, native cultural review, W95 mobile device matrix, and P3 cloud-save humans-in-the-loop work all need real human action a solo dev can't self-execute.
- Today's mechanics ship sprint (12 features) shows momentum is in mechanics + content, not flagship infrastructure.
- Codebase restructure shipped Phases 0–7 on the same day; the ≤1200 GameScene facade target is explicitly out-of-scope.
- A flagship without owner + non-goals + kill criterion is an idea, not a flagship (master plan rule).

**P3 architectural ratification (2026-05-09):** ADR-0006 promoted from `.draft.md` → `.md`; Cloudflare Workers + D1 + magic-link via Resend is the locked architectural choice. P3 itself stays parked behind privacy-policy text + Cloudflare account provisioning humans-in-the-loop work.

---

*Older snapshots and the closed P1–P5 priority queue were trimmed 2026-05-22 — they're recoverable via `git log -- docs/PRD.md` if needed. The flagship pipeline view lives in [`HUGE_INITIATIVES_MASTER_PLAN.md`](HUGE_INITIATIVES_MASTER_PLAN.md).*
