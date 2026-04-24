# C1 — Highland Almanac implementation plan

> **STATUS:** Draft.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Ship the four-book Almanac discovery-log meta system per `docs/superpowers/specs/2026-04-23-highland-almanac-design.md`. 5 milestones.

**Architecture:** Pure `DiscoveryLog` state module tracks what the player has seen across runs. `AlmanacScene` renders four books with tab navigation. Discovery wiring hooks into `SpawnSystem` (enemy first-seen), `ActIntermissionScene` (route picks), `PlayerInventory` (item acquisitions), `BanterSystem` (banter line fires). Save schema adds `discoveryLog: DiscoveryLog`.

**Tech Stack:** TypeScript strict, Phaser 3.90+, Vitest, Playwright.

**Commit cadence:** One commit per TDD cycle. `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.

**Branch:** `master`.

**Guardrails on every task:**
- `npm test` green after each step.
- `npm run lint` after multi-file changes.
- No `as any`. Zero TODO/FIXME.
- All tracking is pure (testable without Phaser).
- Screen reader + keyboard navigation verified per ACCESSIBILITY §6.

---

## File structure

### New files

| Path | Purpose |
|------|---|
| `src/systems/DiscoveryLog.ts` | Pure state: increments, serialisation, retroactive seed from runHistory. |
| `src/systems/DiscoveryLog.test.ts` | Unit tests. |
| `src/scenes/AlmanacScene.ts` | Main scene. Tab navigation. |
| `src/scenes/almanac/BeastiesBook.ts` | Book 1 renderer. |
| `src/scenes/almanac/WeysBook.ts` | Book 2 renderer. |
| `src/scenes/almanac/FindsBook.ts` | Book 3 renderer. |
| `src/scenes/almanac/BanterBook.ts` | Book 4 renderer. |
| `src/ui/AlmanacEntryUI.ts` | Reusable entry card. |
| `e2e/almanac-navigation.spec.ts` | Playwright smoke. |

### Modified files

| Path | Change |
|------|--------|
| `src/utils/save.ts` | Schema bump. Add `discoveryLog: DiscoveryLog`. Retroactive seed on load. |
| `src/utils/save.test.ts` | Migration + seed tests. |
| `src/systems/SpawnSystem.ts` | Record enemy first-seen on spawn. |
| `src/entities/Enemy.ts` | Record kill-count on death. |
| `src/scenes/ActIntermissionScene.ts` | Record route pick. |
| `src/systems/BanterSystem.ts` | Record banter line fire. |
| `src/scenes/CroftScene.ts` (H1) | Bookshelf entry point. |
| `src/scenes/ChronicleScene.ts` | Alt entry point. |
| `src/scenes/MenuScene.ts` | Main menu entry if H1 not shipped. |
| `src/core/i18n.ts` + `.scs.ts` | ~100 UI keys + beastie lore entries × 2 locales. |

---

## Milestone plan

- **M1 — DiscoveryLog + save schema** (tasks 1–6). Pure module + schema migration + retroactive seed. Ship gate: all increments tested; migration passes fixtures.
- **M2 — AlmanacScene scaffolding + Beasties book** (tasks 7–12). Scene + tab UI + first book. Ship gate: `e2e/almanac-navigation.spec.ts` shows Beasties tab rendering.
- **M3 — Weys + Finds books** (tasks 13–17). Two more books. Ship gate: all three books render; entries expand correctly.
- **M4 — Banter book + rare-line teasing** (tasks 18–22). Book 4 + heard-count display + rare-line "???" placeholders. Ship gate: full 4-book functional.
- **M5 — Croft integration + polish** (tasks 23–26). Bookshelf in Croft (if H1 shipped); fallback entry via Chronicle/MenuScene. Ship gate: all entry points work; accessibility verified.

---

## M1 — DiscoveryLog + save schema ✓ shipped 2026-04-24

### Task 1: `DiscoveryLog` module scaffold

- [x] **Step 1:** Failing test: new `DiscoveryLog` has empty `beastiesSeen`, `routesVisited`, `findsAcquired`, `banterHeard`, `almanacVisits: 0`.
- [x] **Step 2:** Implement plain-data module (pure functional, immutable — matches `save.ts` style so HUDs can later shallow-compare for dirty checks).
- [x] **Step 3:** Commit: `feat(almanac): DiscoveryLog scaffold (C1 M1 Task 1)` — `e9103ab`.

### Task 2: `recordBeastieSeen` increment

- [x] **Step 1:** Failing tests cover first-seen seeding, increment immutability of `firstSeenAt`, multi-beastie tracking, input-log non-mutation, empty-key no-op.
- [x] **Step 2:** Implement increment; `firstSeenAt` only set if absent.
- [x] **Step 3:** Commit — `0f2db5c`.

### Task 3: `recordBeastieKilled`, `recordRoutePicked`, `recordItemAcquired`, `recordBanterHeard`

- [x] **Step 1:** Failing tests per method — mirrors Task 2 patterns.
- [x] **Step 2:** Implement four more methods + `BANTER_HEAR_COUNT_CAP = 1000` per spec §8 save-size mitigation.
- [x] **Step 3:** Bundled single commit rather than per-pair — pattern was identical across the four and splitting would have been churn — `2fd5220`.

### Task 4: Serialisation to/from JSON

- [x] **Step 1:** Round-trip + defensive-coercion tests.
- [x] **Step 2:** `discoveryLogToJSON` (effectively identity) + `discoveryLogFromJSON` with coercers mirroring save.ts's `coerceRunHistoryEntry` — drops malformed entries, defaults missing subsections, clamps `hearCount` to cap on revive.
- [x] **Step 3:** Commit — `d77fa73`.

### Task 5: Save schema bump + retroactive seed

**Files:** `src/utils/save.ts`, `src/systems/DiscoveryLog.ts`, tests.

- [x] **Step 1:** Failing tests cover v7→v8 retro-seed from runHistory, round-trip preservation, malformed-log coercion, no-seed-when-present guard.
- [x] **Step 2:** `SAVE_SCHEMA_VERSION = 8`; `migrateV7ToV8` is a pure version bump; the real work is in `finalizeSaveCandidate.coerceDiscoveryLog` — retro-seed when `discoveryLog` is absent from the candidate, `discoveryLogFromJSON` when present. `RetroHistoryEntry` interface keeps `DiscoveryLog.ts` decoupled from save.ts (no circular import).
- [x] **Step 3:** Commit — `1aae9ef`.

**Seed scope — honest pre-v8 reconstruction.** From pre-v8 `RunHistoryEntry` we can rebuild `routesVisited` (each entry has `routes`) and the weapon slice of `findsAcquired` (each entry has `weaponKeys`). We **cannot** rebuild `beastiesSeen` (run summaries track aggregate `bossKills`, not which bosses; non-boss enemies aren't tracked at all) or `banterHeard` (no prior tracking). Those start empty post-v8 and fill forward from first in-game encounter, per spec §8 "seen before your first journal entry" framing.

### Task 6: M1 ship gate

- [x] All increments + migration tested (31 DiscoveryLog + 82 save tests).
- [x] Retroactive seed handles pre-C1 saves gracefully.
- [x] `npm run ci` green (lint + 3098 vitest + build). Full `ci:all` verified post-slice.
- [x] Commit: `feat(almanac): M1 — DiscoveryLog + save schema complete`.

---

## M2 — AlmanacScene scaffolding + Beasties book ✓ shipped 2026-04-24

### Task 7: `AlmanacScene` scene skeleton

- [x] **Step 1:** Pure `tabNavigation` helper (4-book ordered key list, wrap/cycle, i18n label path). Failing unit test then green.
- [x] **Step 2:** `AlmanacScene` renders header + 4-tab bar + body placeholder + back/ESC. Scene registered in `main.ts`. i18n keys under `ui.almanac.*` (EN only — Scots overlay can land later; EN→SCS fence is banter-scoped).
- [x] **Step 3:** Commit — `083fc4d`.

### Task 8: `BeastiesBook` renderer

- [x] **Step 1:** Pure `buildBeastiesEntries` builds the ordered VM (regulars by `appearsAt`, bosses by `spawnTimeSec`, with per-key `texture` + `displayName` + seen/kill-count from the log).
- [x] **Step 2:** `renderBeastiesBook` draws a 6×6 grid — progress pill, sprite cells, kill-count chips, boss star. AlmanacScene dispatches the Beasties tab to it.
- [x] **Step 3:** Commit — `f4b0f8b`.

### Task 9: Silhouette rendering for unseen

- [x] **Step 1:** Pure `resolveBeastieDisplay` maps entry → `{ tint, alpha, displayName, isSilhouette }`. Pinned: silhouette tint ≤ `0x404040` (shadow, not pure black — preserves outline); alpha ∈ (0.25, 1); name overridden to `???`.
- [x] **Step 2:** BeastiesBook applies `setTint` + alpha via the helper and adds a name label under each cell. Real name on seen, `???` on silhouette.
- [x] **Step 3:** Commit — `f9fb3f3`.

### Task 10: Entry expand/collapse

- [x] **Step 1:** Pure `expandState` (`toggleExpanded`, `closeExpanded`) + `buildBeastieDetail` (title/lore/where-found/kill-count/first-seen VM). Unseen entries never leak the real name or timing cue.
- [x] **Step 2:** BeastiesBook cells become interactive; renderer stamps an overlay panel (scrim + card + × close) when `expandedKey` matches. Per-tab expand state persists across tab flips within a scene visit.
- [x] **Step 3:** Commit — `8ed19c2`.

### Task 11: Enemy-first-seen + kill wiring

**Files:** `src/utils/save.ts`, `src/systems/SpawnSystem.ts`, `src/scenes/game/EnemyKillHandler.ts`.

- [x] **Step 1:** `bumpBeastieSeen(key, runId, ts)` — writes only on the cross-run first-encounter transition; mirrors the `bumpSeenEnemy` pattern. SpawnSystem captures `run:${seed}` as the runId at construction and fires the bump from both `notifyEnemyAmbient` (regulars) and `spawnBoss` (bosses bypass the ambient path but still seed the DiscoveryLog).
- [x] **Step 2:** `bumpBeastieKilled(key)` batches into an in-memory Map + autoflushes every 64 kills. `flushBeastieKills()` drains the buffer; RunLifecycle calls it on both victory + death before `recordRun`. Per-kill `loadSave/writeSave` round-trips pushed the marathon enemy-pool slope 2% over threshold (1.53 → 0.97 after batching).
- [x] **Step 3:** Commit — `ac05b38`.

### Task 12: M2 ship gate + `e2e/almanac-navigation.spec.ts`

- [x] E2E drives the scene manager directly (Phaser renders to canvas, no DOM-text assertions): launch Almanac, Beasties tab live, switch to Weys, expand tourist, ESC → MainMenu. Mirrors `w2-moor-road.spec.ts` pattern.
- [x] `npm run ci:all` green: lint + 3137 vitest + build + 49 e2e across chromium / firefox / webkit / mobile.
- [x] Commit — `610814a`.

---

## M3 — Weys + Finds books ✓ shipped 2026-04-24

### Task 13: `WeysBook` renderer

- [x] **Step 1:** Pure builder + detail VMs (`buildWeysEntries`, `buildWeyDetail`) with vitest coverage of ordering, pick-count formatting, and unpicked-route silhouette policy.
- [x] **Step 2:** Two-column grid (slot A / slot B) with slot-tinted banners standing in for route artwork. Click expands a detail overlay with description, pick count, and first-walked date. Mirrors BeastiesBook chrome.
- [x] **Step 3:** Commit — `7907aaf`.

### Task 14: Route pick wiring

**Files:** `src/utils/save.ts`, `src/scenes/GameScene.ts`.

- [x] **Step 1:** `bumpRoutePicked(key, runId, ts)` mirrors `bumpBeastieSeen` shape — best-effort localStorage write that increments `pickCount` and seeds `firstPickedAt` on first call. Test coverage in `save.test.ts` — first-call + repeat + empty-key + cross-key scenarios.
- [x] **Step 2:** `GameScene.launchActIntermission.onResolve` fires the bump from the common resolver so both UI-pick and skip-default paths feed the DiscoveryLog. Run id sourced from `discoveryRunId()` (folds `runRng.seed` into the same `run:${seed}` shape SpawnSystem uses).
- [x] **Step 3:** Commit — `bfdb13e`.

### Task 15: `FindsBook` renderer

- [x] **Step 1:** Pure builder + detail VMs (`buildFindsEntries`, `buildFindDetail`) sourcing from `WEAPON_DEFS`, `EVOLUTION_RECIPES`, `PASSIVE_CARDS`, `PERMANENT_UPGRADES`, `RELIQUARY_CURIOS`. Vitest coverage of category ordering, pluralised count copy, unacquired silhouette policy, and starter-weapon inclusion.
- [x] **Step 2:** Single grid (6 cols × N rows) spanning all five categories with category-tinted accent stripe per cell so the page reads "weapon block / passive block / permanent block" without scanning every label. Click expands the same scrim+panel chrome with a category badge under the title.
- [x] **Step 3:** Commit — `efc0e65` (alongside Task 16, single ship surface).

### Task 16: Item-acquired wiring

- [x] **Step 1:** `bumpItemAcquired(key, runId, ts)` lands beside `bumpRoutePicked` in `save.ts` with vitest coverage.
- [x] **Step 2:** Four call sites — `LevelUpFlow.apply` (`add_weapon`, `add_passive`, `evolve_weapon`), `ShopScene.purchaseUpgrade` (runId `'shop'`), `GameScene.reliquary.onPick` (runId `discoveryRunId`). LevelUpFlow takes a new `getDiscoveryRunId` hook so it can stamp the firstAcquiredAt entry with the same `run:${seed}` shape.
- [x] **Step 3:** Commit — `efc0e65`.

### Task 17: M3 ship gate

- [x] Beasties + Weys + Finds all render via the AlmanacScene tab branch. Banter tab still falls through to the `coming_soon` placeholder until M4.
- [x] `npm run ci:all` green: 3170 vitest tests + 49 Playwright specs.
- [x] Commit — this commit.

---

## M4 — Banter book + rare-line teasing ✓ shipped 2026-04-24

### Task 18: `BanterBook` renderer

- [x] **Step 1:** `buildBanterEntries.test.ts` + `buildBanterDetail.test.ts` lock the VM (one entry per pool, ordered by priority descending, `lines heard: X of Y`).
- [x] **Step 2:** Implement — `buildBanterEntries.ts` / `buildBanterDetail.ts` / `BanterBook.ts` renderer + i18n chrome + AlmanacScene tab wiring.
- [x] **Step 3:** Commit — `859a42e`.

### Task 19: Line-fired wiring

**Files:** `src/systems/BanterSystem.ts`.

- [x] **Step 1:** `BanterSystem.test.ts › onLineFired` describe block — fires once per sink emission, dropped on rate-limit / missing translation, exceptions swallowed.
- [x] **Step 2:** Add `onLineFired?: (evt) => void` to `BanterSystemOptions`; GameScene wires it to `bumpBanterHeard`.
- [x] **Step 3:** Commit — `8bd7c51`.

### Task 20: Unheard-line teaser

- [x] **Step 1:** `buildBanterDetail.test.ts` locks the teaser partition (every unheard line → `???`, tags survive, heard+unheard partitions the total).
- [x] **Step 2:** Implement — teaser rows + overflow chip below the heard block in the expanded panel (capped at 8 rows).
- [x] **Step 3:** Commit — `8e9caff`.

### Task 21: Rare-line marker + "Hear Again" button

- [x] **Step 1:** `buildBanterEntries.test.ts` locks the `rare` flag passthrough for pool-level rare pools (first_time / burns_citation / reliquary_pick).
- [x] **Step 2:** `✨` prefix on the row label, expanded title, and heard rows of rare pools; `↻` per-line Hear Again button wired through `opts.onHearAgain` → AlmanacScene-local rehearsal toast (decoupled from GameScene's BanterSystem instance).
- [x] **Step 3:** Commit — `acce00d`.

### Task 22: M4 ship gate

- [x] All 4 books functional.
- [x] `npm run ci:all` green (3189 vitest + 49 e2e passed, 4 skipped).
- [x] Commit: `feat(almanac): M4 — Banter book complete`.

---

## M5 — Croft integration + polish

### Task 23: Croft bookshelf entry (if H1 shipped)

**Files:** `src/scenes/CroftScene.ts`.

- [ ] **Step 1:** Failing smoke test: clicking bookshelf in Croft navigates to AlmanacScene.
- [ ] **Step 2:** Wire interaction.
- [ ] **Step 3:** If H1 not yet shipped, fallback: `MenuScene.addAlmanacButton()`.
- [ ] **Step 4:** Commit.

### Task 24: ChronicleScene alt entry

- [ ] **Step 1:** Failing smoke test: Chronicle has "View Almanac" button.
- [ ] **Step 2:** Wire.
- [ ] **Step 3:** Commit.

### Task 25: Accessibility polish

- [ ] **Step 1:** Failing test: keyboard tab navigates tabs; enter expands entries; escape closes.
- [ ] **Step 2:** Implement keyboard focus.
- [ ] **Step 3:** Verify screen-reader reads all entries in order.
- [ ] **Step 4:** Commit.

### Task 26: M5 ship gate + launch

- [ ] All entry points working.
- [ ] Keyboard + screen reader verified.
- [ ] Bundle delta ≤ +60 KB gzip.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(almanac): C1 — Highland Almanac shipped`.

---

## Risk-watch

| Signal | Response |
|---|---|
| Save size bloat from banter hear-counts | Cap hear-count at 1000 beyond that just flag. |
| Retroactive seed fragile | Defaults to empty if scan fails; no data loss. |
| Players miss Almanac entry point | If using H1 bookshelf, also add MenuScene → ChronicleScene alt entry. |
| Silhouette rendering inconsistent | Reuse F1 outline shader infra where available; fallback to tint-to-black. |
