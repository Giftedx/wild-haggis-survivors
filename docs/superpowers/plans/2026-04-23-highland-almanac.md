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

## M1 — DiscoveryLog + save schema

### Task 1: `DiscoveryLog` module scaffold

**Files:** `src/systems/DiscoveryLog.ts` + test.

- [ ] **Step 1:** Failing test: new `DiscoveryLog` has empty `beastiesSeen`, `routesVisited`, `findsAcquired`, `banterHeard`, `almanacVisits: 0`.
- [ ] **Step 2:** Implement plain-data class.
- [ ] **Step 3:** Commit: `feat(almanac): DiscoveryLog scaffold`.

### Task 2: `recordBeastieSeen` increment

- [ ] **Step 1:** Failing test: `recordBeastieSeen('kelpie', runId, now)` → `beastiesSeen.kelpie.seenCount === 1`; `firstSeenAt.runId === runId`.
- [ ] **Step 2:** Implement increment; `firstSeenAt` only set if absent.
- [ ] **Step 3:** Commit.

### Task 3: `recordBeastieKilled`, `recordRoutePicked`, `recordItemAcquired`, `recordBanterHeard`

- [ ] **Step 1:** Failing tests per method.
- [ ] **Step 2:** Implement four more methods mirroring the pattern.
- [ ] **Step 3:** Commit per pair.

### Task 4: Serialisation to/from JSON

- [ ] **Step 1:** Failing test: `DiscoveryLog.toJSON()` + `fromJSON()` round-trip.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Commit: `feat(almanac): DiscoveryLog serialisation`.

### Task 5: Save schema bump + retroactive seed

**Files:** `src/utils/save.ts`, tests.

- [ ] **Step 1:** Failing test: migration v{N} → v{N+1} adds empty `discoveryLog` field; `retroactiveSeedFromHistory(runHistory)` reconstructs approximate state.
- [ ] **Step 2:** Implement migration + seed function (scans `RunHistoryEntry` for bosses killed, routes picked, etc.).
- [ ] **Step 3:** Commit: `feat(save): schema bump — discoveryLog with retroactive seed`.

### Task 6: M1 ship gate

- [ ] All increments + migration tested.
- [ ] Retroactive seed handles pre-C1 saves gracefully.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(almanac): M1 — DiscoveryLog + save schema complete`.

---

## M2 — AlmanacScene scaffolding + Beasties book

### Task 7: `AlmanacScene` scene skeleton

**Files:** `src/scenes/AlmanacScene.ts` + smoke test.

- [ ] **Step 1:** Failing smoke test: scene launches without error.
- [ ] **Step 2:** Implement scene lifecycle + tab-bar with 4 tab placeholders.
- [ ] **Step 3:** Commit: `feat(almanac): AlmanacScene skeleton with 4 tabs`.

### Task 8: `BeastiesBook` renderer

**Files:** `src/scenes/almanac/BeastiesBook.ts`.

- [ ] **Step 1:** Failing test: `BeastiesBook.render(discoveryLog)` produces a list of entries, one per enemy in `enemies.ts`.
- [ ] **Step 2:** Implement; each entry shows name (or "???" if not seen), silhouette or sprite, kill count.
- [ ] **Step 3:** Commit.

### Task 9: Silhouette rendering for unseen

- [ ] **Step 1:** Failing smoke test: unseen beastie renders as outline-only in lowered opacity.
- [ ] **Step 2:** Implement silhouette shader (reuse existing outline system if any; else duotone tint to black).
- [ ] **Step 3:** Commit.

### Task 10: Entry expand/collapse

- [ ] **Step 1:** Failing smoke test: click entry → expanded view with lore, where-found, drop info.
- [ ] **Step 2:** Implement expanded card overlay.
- [ ] **Step 3:** Commit.

### Task 11: Enemy-first-seen wiring

**Files:** `src/systems/SpawnSystem.ts`, `src/entities/Enemy.ts`.

- [ ] **Step 1:** Failing test: enemy spawn records in `DiscoveryLog`.
- [ ] **Step 2:** Wire hook.
- [ ] **Step 3:** Enemy death also increments kill count.
- [ ] **Step 4:** Commit.

### Task 12: M2 ship gate + `e2e/almanac-navigation.spec.ts`

- [ ] E2E: enter Almanac → Beasties tab → entries visible; silhouettes visible for unseen.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(almanac): M2 — Beasties book complete`.

---

## M3 — Weys + Finds books

### Task 13: `WeysBook` renderer

- [ ] **Step 1:** Failing test: renders one entry per route in `routes.ts`.
- [ ] **Step 2:** Implement; each entry shows illustrated banner, first-picked, pick-count, lore.
- [ ] **Step 3:** Commit.

### Task 14: Route pick wiring

**Files:** `src/scenes/ActIntermissionScene.ts`.

- [ ] **Step 1:** Failing test: route pick records in DiscoveryLog.
- [ ] **Step 2:** Wire hook.
- [ ] **Step 3:** Commit.

### Task 15: `FindsBook` renderer

- [ ] **Step 1:** Failing test: renders entries per weapon, evolution, passive, relic, permanent upgrade.
- [ ] **Step 2:** Implement grid layout; tap expands.
- [ ] **Step 3:** Commit.

### Task 16: Item-acquired wiring

- [ ] **Step 1:** Failing test: picking up a passive records in DiscoveryLog.
- [ ] **Step 2:** Wire hooks in `PickupSpawner`, `LevelUpFlow`, `RelicSystem` (if R1 shipped).
- [ ] **Step 3:** Commit.

### Task 17: M3 ship gate

- [ ] Beasties + Weys + Finds all render.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(almanac): M3 — Weys + Finds books complete`.

---

## M4 — Banter book + rare-line teasing

### Task 18: `BanterBook` renderer

- [ ] **Step 1:** Failing test: renders one entry per banter pool with `lines heard: X of Y`.
- [ ] **Step 2:** Implement — shows progress per pool.
- [ ] **Step 3:** Commit.

### Task 19: Line-fired wiring

**Files:** `src/systems/BanterSystem.ts`.

- [ ] **Step 1:** Failing test: banter line fire records in DiscoveryLog.
- [ ] **Step 2:** Wire hook on `onLineFired`.
- [ ] **Step 3:** Commit.

### Task 20: Unheard-line teaser

- [ ] **Step 1:** Failing test: unheard line shows as "???" with trigger context hint.
- [ ] **Step 2:** Implement teaser row in expanded pool view.
- [ ] **Step 3:** Commit.

### Task 21: Rare-line marker + "Hear Again" button

- [ ] **Step 1:** Failing test: line with <1% fire-rate shows ✨ marker; "Hear Again" button triggers `BanterSystem.forceFire(key)`.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Commit.

### Task 22: M4 ship gate

- [ ] All 4 books functional.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(almanac): M4 — all 4 books complete`.

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
