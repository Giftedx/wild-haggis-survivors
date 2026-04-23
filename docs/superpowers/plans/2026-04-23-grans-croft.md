# H1 — Gran's Croft implementation plan

> **STATUS:** Draft.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Ship `CroftScene` persistent hub per `docs/superpowers/specs/2026-04-23-grans-croft-design.md`. 3 milestones.

**Architecture:** New `CroftScene` sits between `MenuScene` and `GameScene`. Programmatic sprites for Gran, hearth, mantelpiece, photo wall, drove, wireless, bookshelf. Trophy state read from `SaveData.unlocks.bossKillCounts`, `firstRouteVisits`, `firstBossKills`. Interaction routes to existing scenes (Start Run / Shop / Settings / Chronicle / Almanac / Variant picker). Seasonal props auto-swap per active event (needs E1 infra; fallback to no-props if E1 not shipped).

**Tech Stack:** TypeScript strict, Phaser 3.90+, Vitest, Playwright.

**Commit cadence:** One commit per TDD cycle. `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.

**Branch:** `master`.

**Guardrails on every task:**
- `npm test` green after each step.
- `npm run lint` after multi-file changes.
- No `as any`. Zero TODO/FIXME.
- Sprites must be programmatic (extend `BootScene` pattern); no external image assets.
- Scene transition latency < 500ms on target hardware.

---

## File structure

### New files

| Path | Purpose |
|------|--|
| `src/scenes/CroftScene.ts` | Main scene — draws composition + handles interaction. |
| `src/scenes/CroftScene.smoke.test.ts` | Headless scene-load smoke. |
| `src/scenes/croft/CroftComposition.ts` | Pure layout helper (element positions). |
| `src/scenes/croft/CroftComposition.test.ts` | Layout-math tests. |
| `src/scenes/croft/CroftTrophies.ts` | Pure trophy-tier computation from save state. |
| `src/scenes/croft/CroftTrophies.test.ts` | Trophy state logic. |
| `src/scenes/croft/CroftInteractionRouter.ts` | Element → scene routing. |
| `src/scenes/croft/CroftMusic.ts` | Music-layer config for croft. |
| `src/art/sprites/croft/gran.ts` | Gran sprite drawer. |
| `src/art/sprites/croft/hearth.ts` | Hearth fire drawer. |
| `src/art/sprites/croft/mantelpiece.ts` | Trophy slots. |
| `src/art/sprites/croft/photoWall.ts` | Photo slot drawer. |
| `src/art/sprites/croft/drove.ts` | Variant silhouettes. |
| `src/art/sprites/croft/wireless.ts` | Radio sprite. |
| `src/art/sprites/croft/bookshelf.ts` | Almanac book prop. |
| `src/art/sprites/croft/windowView.ts` | Biome backdrop. |
| `src/art/sprites/croft/cuppa.ts` | Table + teacup. |
| `src/art/sprites/croft/thistle.ts` | Window-box thistle (seasonal bloom states). |
| `e2e/croft-smoke.spec.ts` | Playwright smoke. |

### Modified files

| Path | Change |
|------|--------|
| `src/scenes/BootScene.ts` | Register croft sprite atlases. |
| `src/scenes/MenuScene.ts` | "Enter Croft" primary action; "Start Run" relegated to within-croft. |
| `src/utils/save.ts` | Schema bump. Add `unlocks.bossKillCounts`, `firstBossKills`, `firstRouteVisits`, `cursedVictoriesByBoss`. |
| `src/utils/save.test.ts` | Migration + retroactive-seed tests. |
| `src/data/variants.ts` | Add `silhouetteSpritePath` field per variant. |
| `src/data/banter.ts` | `gran_commentary` pool (per B1) powers Gran croft banter. |
| `src/core/i18n.ts` + `.scs.ts` | ~60 keys × 2 locales (banter, hover labels, prompts). |
| `docs/PRD.md` | Note CroftScene. |

---

## Milestone plan

- **M1 — Scene scaffolding + Gran** (tasks 1–10). New CroftScene, programmatic sprites, Gran, hearth, always-available actions (Start Run, Shop, Settings, Chronicle). Ship gate: players can enter Croft, start a run, return.
- **M2 — Trophy system + save migration** (tasks 11–18). Mantelpiece + photo wall populate from save state. Retroactive seed for existing players. Ship gate: old saves reconstruct trophies correctly.
- **M3 — Drove + seasonal props** (tasks 19–24). Variant silhouettes + seasonal event hooks + accessibility polish. Ship gate: full scene with all elements.

---

## M1 — Scene scaffolding + Gran

### Task 1: `CroftComposition` layout helper

**Files:** `src/scenes/croft/CroftComposition.ts` + test.

- [ ] **Step 1:** Failing test: `layoutCroft({ uiScale: 1.0, width: 1280, height: 720 }).gran.x === 640`.
- [ ] **Step 2:** Implement pure layout function returning element positions.
- [ ] **Step 3:** Commit: `feat(croft): CroftComposition layout helper`.

### Task 2: `CroftScene` scaffold

**Files:** `src/scenes/CroftScene.ts` + smoke test.

- [ ] **Step 1:** Failing smoke test: scene launches without error.
- [ ] **Step 2:** Implement scene lifecycle (init, preload, create) using composition helper.
- [ ] **Step 3:** Commit: `feat(croft): CroftScene scaffold`.

### Task 3: Gran sprite drawer

**Files:** `src/art/sprites/croft/gran.ts`.

- [ ] **Step 1:** Failing test: `drawGran(graphics)` produces sprite with distinct silhouette.
- [ ] **Step 2:** Implement — seated Gran, knitting animation (2-3 idle frames).
- [ ] **Step 3:** Commit.

### Task 4: Hearth fire drawer

- [ ] **Step 1:** Failing test: `drawHearth()` produces 4-frame loop.
- [ ] **Step 2:** Implement particle flicker.
- [ ] **Step 3:** Commit.

### Task 5: Interaction router

**Files:** `src/scenes/croft/CroftInteractionRouter.ts`.

- [ ] **Step 1:** Failing test: `route('start_run').target === 'GameScene'`; `route('shop').target === 'ShopScene'`.
- [ ] **Step 2:** Implement router mapping elements → scene-transition calls.
- [ ] **Step 3:** Commit.

### Task 6: Croft music config

**Files:** `src/scenes/croft/CroftMusic.ts`.

- [ ] **Step 1:** Failing test: `CroftMusic.configure(musicEngine)` sets Conductor to pibroch-soft layer.
- [ ] **Step 2:** Implement — reduced intensity, warm-pad dominant.
- [ ] **Step 3:** Commit.

### Task 7: MenuScene → CroftScene transition

**Files:** `src/scenes/MenuScene.ts`.

- [ ] **Step 1:** Failing smoke test: "Enter Croft" button → CroftScene.
- [ ] **Step 2:** Replace current "Start Run" primary with "Enter Croft".
- [ ] **Step 3:** Commit.

### Task 8: Always-available actions in CroftScene

- [ ] **Step 1:** Failing smoke tests: Start Run / Shop / Settings / Chronicle buttons route to correct scene.
- [ ] **Step 2:** Implement buttons calling router.
- [ ] **Step 3:** Commit.

### Task 9: Return-from-GameScene lands in CroftScene

**Files:** `src/scenes/GameScene.ts` exit path.

- [ ] **Step 1:** Failing smoke test: run-end returns to CroftScene (not MenuScene).
- [ ] **Step 2:** Wire. (Originally went to MenuScene.)
- [ ] **Step 3:** Commit.

### Task 10: M1 ship gate + `e2e/croft-smoke.spec.ts`

- [ ] E2E: enter Croft → click Start Run → die → return to Croft.
- [ ] Scene transition < 500ms verified.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(croft): M1 — scaffolding + Gran + actions complete`.

---

## M2 — Trophy system + save migration

### Task 11: Schema bump with retroactive seed

**Files:** `src/utils/save.ts`, tests.

- [ ] **Step 1:** Failing test: migration adds empty `unlocks.bossKillCounts`, `firstBossKills`, `firstRouteVisits`, `cursedVictoriesByBoss`.
- [ ] **Step 2:** Implement migration. Retroactive seed scans `runHistory` for past boss kills + route visits, reconstructs counts.
- [ ] **Step 3:** Green.
- [ ] **Step 4:** Commit: `feat(save): schema bump — Croft trophy counters + retroactive seed`.

### Task 12: `CroftTrophies` pure module

**Files:** `src/scenes/croft/CroftTrophies.ts` + test.

- [ ] **Step 1:** Failing test: `computeTrophyTier('gordon', saveState).tier === 'none' | 'first' | 'tenth' | 'cursed'`.
- [ ] **Step 2:** Implement: first = killed once; tenth = killed 10+; cursed = killed during cursed run.
- [ ] **Step 3:** Commit.

### Task 13: Mantelpiece drawer

**Files:** `src/art/sprites/croft/mantelpiece.ts`.

- [ ] **Step 1:** Failing test: drawer accepts `TrophyState[]` and renders trophy sprite or empty slot per boss.
- [ ] **Step 2:** Implement. Per-boss trophy art per spec §3 (Gordon's ladle, Tour Bus wheel, etc.).
- [ ] **Step 3:** Commit.

### Task 14: Photo wall drawer

- [ ] **Step 1:** Failing test: drawer accepts `RouteKey[]` (visited routes) and renders polaroids.
- [ ] **Step 2:** Implement with fade-from-sepia on-first-pick.
- [ ] **Step 3:** Commit.

### Task 15: Boss-kill hook increments counter

**Files:** `src/scenes/game/handleBossDeath.ts`.

- [ ] **Step 1:** Failing test: on-boss-kill increments `bossKillCounts[bossKey]`.
- [ ] **Step 2:** Wire hook. Also set `firstBossKills` if first-ever.
- [ ] **Step 3:** Commit.

### Task 16: Route-pick hook records first visit

- [ ] **Step 1:** Failing test: on-route-pick adds to `firstRouteVisits`.
- [ ] **Step 2:** Wire in `ActIntermissionScene`.
- [ ] **Step 3:** Commit.

### Task 17: Trophy click commentary

- [ ] **Step 1:** Failing test: clicking a trophy fires Gran banter line (priority 30 `gran_commentary`).
- [ ] **Step 2:** Wire interaction.
- [ ] **Step 3:** Commit.

### Task 18: M2 ship gate

- [ ] Existing save fixtures produce correct trophies after seed.
- [ ] Boss-kill and route-pick hooks work in live run.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(croft): M2 — trophy system complete`.

---

## M3 — Drove + seasonal props + polish

### Task 19: Drove silhouettes

**Files:** `src/art/sprites/croft/drove.ts`.

- [ ] **Step 1:** Failing test: drove shows silhouettes only for unlocked variants.
- [ ] **Step 2:** Implement. Click silhouette → select for next run.
- [ ] **Step 3:** Commit.

### Task 20: Variant picker integration

- [ ] **Step 1:** Failing smoke test: drove click → variant selected in run-start flow.
- [ ] **Step 2:** Wire.
- [ ] **Step 3:** Commit.

### Task 21: Seasonal props (E1 dependency)

- [ ] **Step 1:** Failing test: `SeasonalEventManager.getActiveEvents()` drives which croft props appear.
- [ ] **Step 2:** If E1 not shipped: props gated behind feature flag (default off).
- [ ] **Step 3:** Burns Night haggis-platter on table + Address card on wall + thistle-bloom.
- [ ] **Step 4:** Hogmanay, Beltane, Samhain props per spec §3 (land when E1 ships).
- [ ] **Step 5:** Commit.

### Task 22: Bookshelf Almanac entry (C1 dependency)

- [ ] **Step 1:** Failing smoke test: click bookshelf → open AlmanacScene.
- [ ] **Step 2:** Wire.
- [ ] **Step 3:** If C1 not shipped: bookshelf greyed-out with "Coming soon" label.
- [ ] **Step 4:** Commit.

### Task 23: Accessibility polish

- [ ] **Step 1:** Keyboard navigation + tab order for all interactive elements.
- [ ] **Step 2:** Alt-text on trophies (screen-reader friendly).
- [ ] **Step 3:** Gran banter respects `captionsEnabled`.
- [ ] **Step 4:** Commit.

### Task 24: M3 ship gate + launch

- [ ] Full scene with Gran, hearth, mantelpiece, photo wall, drove, wireless, window, bookshelf, table.
- [ ] Bundle delta ≤ +80 KB gzip verified.
- [ ] `e2e/croft-smoke.spec.ts` green.
- [ ] Playtest: players return to Croft after ≥3 runs (≥50%).
- [ ] `npm run ci:all` green.
- [ ] Ship commit: `feat(croft): H1 — Gran's Croft complete`.

---

## Risk-watch

| Signal | Response |
|---|---|
| Scene transition >500ms | Pre-warm sprite atlases in BootScene; reduce parallax layers. |
| Bundle bloat >+80KB gzip | Trim decorative elements; tier-upgrades as sprite-swaps not full redraws. |
| Players miss Croft (quit-to-menu after run) | Lean in on Gran banter; trophy additions pulse once on entry. |
| Trophy state fails retroactive seed | Migration defaults to empty state; no data loss. |
| E1 seasonal props not shipped | Feature-flag off; croft shows no seasonal decoration until E1 lands. |
| C1 Almanac not shipped | Bookshelf greyed out; labelled "Coming soon". |
