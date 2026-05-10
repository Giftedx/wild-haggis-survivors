# E1 — Seasonal events + Burns Night implementation plan

> **STATUS:** SHIPPED 2026-04-24. All four milestones complete:
> - **M1** — `SeasonalEventManager` + pure date-math + Burns Night window + `RunHistoryEntry.seasonalEvent` + Chronicle stamp.
> - **M2** — run-start bagpipe stinger + Gran banter swap to `seasonal_event`; one-off haggis-platter pickup (full heal + 60s +30% damage buff + burns_citation banter); tightened Burns's Wee Beastie unlock gate to `burns_night_full_evo` (save v14 → v15, new counter `burnsNightFullEvoRunsCompleted`); Playwright clock-mocked smoke spec.
> - **M3** — Croft seasonal props (shipped alongside H1 via `seasonalProps.ts` — haggis platter on the table, Address card on the mantel, bloomed thistle).
> - **M4** — Conductor piper accent (gated on Burns + combat intensity + 22 s cooldown); `SeasonalEventBanner` HUD on Menu + Croft; `disableSeasonalEvents` opt-out short-circuits every surface.
>
> 3761 unit tests + 27 e2e green on chromium-desktop. Bundle delta vs. pre-M1: ~+2 KB gzip (well under the +30 KB budget).
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Ship real-world-date-gated seasonal events framework + first event (Burns Night) per `docs/superpowers/specs/2026-04-23-seasonal-events-burns-night-design.md`. 4 milestones.

**Architecture:** `SeasonalEventManager` queries device-local date at boot + scene transitions. Event definitions in `src/data/seasonalEvents.ts` with date windows + effects. Burns Night effects: croft decoration (H1 dep), run-start ceremony, haggis-platter pickup, variant unlock gate, Chronicle stamp, music-layer activation. `disableSeasonalEvents` opt-out setting.

**Tech Stack:** TypeScript strict, Phaser 3.90+, Vitest, Playwright.

**Commit cadence:** One commit per TDD cycle. `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.

**Branch:** `master`.

**Guardrails on every task:**
- `npm test` green after each step.
- Pure date logic; tests pass `now` explicitly (no global Date in hot paths).
- No `as any`. Zero TODO/FIXME.
- Content warnings respected for sensitive future events (Culloden — per CULTURAL_SENSITIVITIES).

---

## File structure

### New files

| Path | Purpose |
|------|---|
| `src/data/seasonalEvents.ts` | Event definitions (Burns Night + scaffolding for Hogmanay, etc.). |
| `src/data/seasonalEvents.test.ts` | Shape assertions. |
| `src/systems/SeasonalEventManager.ts` | Date-check, activation, event-state querying. |
| `src/systems/SeasonalEventManager.test.ts` | Calendar edge-cases. |
| `src/systems/seasonal/burnsNightEffects.ts` | Burns Night specific effect handlers. |
| `src/systems/seasonal/burnsNightEffects.test.ts` | Effect-specific tests. |
| `src/ui/SeasonalEventBanner.ts` | HUD banner. |
| `e2e/burns-night-smoke.spec.ts` | Playwright with clock-mock. |

### Modified files

| Path | Change |
|------|--------|
| `src/main.ts` | Register `SeasonalEventManager` + initialize at boot. |
| `src/scenes/BootScene.ts` | Call `SeasonalEventManager.tick()` before scene flow. |
| `src/scenes/CroftScene.ts` (H1) | Apply Burns Night props. |
| `src/scenes/GameScene.ts` | Check active events; apply run-level effects. |
| `src/systems/music/Conductor.ts` | Piper-layer activation during Burns Night. |
| `src/data/banter.ts` | `seasonal_event` pool (B1 coordination). |
| `src/core/i18n.ts` + `.scs.ts` | ~70 keys × 2 locales. |
| `src/data/variants.ts` | Burns's Wee Beastie gates on event window + evolution count (V2 coordination). |
| `src/utils/save.ts` | `seasonalEventsSeen` + `burnsNightRunsCompleted` counters. Schema bump. |
| `src/scenes/ChronicleScene.ts` | Burns Night badge on event-window runs. |
| `src/core/SettingsManager.ts` | Add `disableSeasonalEvents: boolean` default false. |

---

## Milestone plan

- **M1 — Framework scaffolding + calendar** (tasks 1–8). `SeasonalEventManager` + date math + event registry. Ship gate: calendar edge cases pass; no runtime failures on any date.
- **M2 — Burns Night effects** (tasks 9–16). Run-start ceremony, haggis-platter pickup, variant-unlock gate, chronicle stamp, i18n. Ship gate: e2e with mocked clock shows effects active.
- **M3 — Croft integration** (tasks 17–20, H1 dep). Seasonal props at Croft. Ship gate: Burns Night props render in Croft.
- **M4 — Music layer + launch** (tasks 21–24). Piper activation in Conductor + banner + settings opt-out. Ship gate: full Burns Night experience.

---

## M1 — Framework scaffolding + calendar

### Task 1: `SeasonalEventDef` interface

**Files:** `src/data/seasonalEvents.ts` + test.

- [ ] **Step 1:** Failing test: `SEASONAL_EVENTS.burns_night.dateWindow.startMonth === 1`.
- [ ] **Step 2:** Define interface + Burns Night entry (Jan 18 – Feb 1).
- [ ] **Step 3:** Commit: `feat(seasonal): SeasonalEventDef types + Burns Night entry`.

### Task 2: `SeasonalEventManager.isActive` pure check

**Files:** `src/systems/SeasonalEventManager.ts` + test.

- [ ] **Step 1:** Failing test: `isSeasonalEventActive('burns_night', new Date('2027-01-25')) === true`; `isSeasonalEventActive('burns_night', new Date('2027-06-15')) === false`.
- [ ] **Step 2:** Implement — accepts `now` explicitly.
- [ ] **Step 3:** Green.
- [ ] **Step 4:** Commit.

### Task 3: Multi-event stacking (year-boundary edge)

- [ ] **Step 1:** Failing test: `isSeasonalEventActive('hogmanay', new Date('2027-01-02')) === true` (window crosses year boundary Dec 28 – Jan 3).
- [ ] **Step 2:** Handle wrap-around correctly.
- [ ] **Step 3:** Commit.

### Task 4: `activeSeasonalEvents` list

- [ ] **Step 1:** Failing test: on Jan 30, both Burns Night and Imbolc return from active list.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Commit.

### Task 5: Register in `main.ts`

- [ ] **Step 1:** Failing smoke test: `SeasonalEventManager` initialises at game boot.
- [ ] **Step 2:** Wire.
- [ ] **Step 3:** Commit.

### Task 6: `disableSeasonalEvents` setting

**Files:** `src/core/SettingsManager.ts`.

- [ ] **Step 1:** Failing test: setting default false; respects toggle.
- [ ] **Step 2:** Add setting.
- [ ] **Step 3:** Commit.

### Task 7: Save schema — `seasonalEventsSeen`, `burnsNightRunsCompleted`

- [ ] **Step 1:** Failing test: migration defaults fields.
- [ ] **Step 2:** Add fields.
- [ ] **Step 3:** Commit.

### Task 8: M1 ship gate

- [ ] Calendar edge cases covered.
- [ ] Framework registered.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(seasonal): M1 — framework scaffolding complete`.

---

## M2 — Burns Night effects

### Task 9: Run-start ceremony

**Files:** `src/systems/seasonal/burnsNightEffects.ts` + test.

- [ ] **Step 1:** Failing test: when Burns Night active, `beforeRunStart()` returns ceremony config (pipes-in stinger + ceremonial-shuffle animation trigger).
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Wire in `GameScene.create()`.
- [ ] **Step 4:** Commit.

### Task 10: Haggis-platter pickup

- [ ] **Step 1:** Failing test: when Burns Night active, one haggis-platter pickup spawns in first 3 nodes of a run.
- [ ] **Step 2:** Wire spawn in node system (M1 dep) or baseline `PickupSpawner`.
- [ ] **Step 3:** On collision: heal full HP + 60s damage buff + banter line.
- [ ] **Step 4:** Commit.

### Task 11: Variant unlock gate (V2 coordination)

- [ ] **Step 1:** Failing test: Burns's Wee Beastie unlock requires run-completion during event with all 8 weapons at L5.
- [ ] **Step 2:** Wire counter `burnsNightRunsCompleted` increment on qualifying run-end.
- [ ] **Step 3:** Deed `ach_burns_beastie_unlock` on count >=1.
- [ ] **Step 4:** Commit.

### Task 12: Chronicle Burns Night stamp

**Files:** `src/scenes/ChronicleScene.ts`.

- [ ] **Step 1:** Failing smoke test: runs completed during event window show "Burns Night" badge.
- [ ] **Step 2:** Wire display.
- [ ] **Step 3:** Commit.

### Task 13: i18n Burns Night strings

- [ ] **Step 1:** Author 70+ EN keys + 70+ SCS keys (banter in `seasonal_event` pool per B1, prompts, labels).
- [ ] **Step 2:** Parity fence green.
- [ ] **Step 3:** Commit.

### Task 14: Content warning (stretch — for future Culloden event)

- [ ] **Step 1:** Failing test: `contentWarnings` setting on; Culloden event displays warning before activation.
- [ ] **Step 2:** Scaffold (event-specific warning key; Culloden event data).
- [ ] **Step 3:** Commit.

### Task 15: e2e with mocked clock

**Files:** `e2e/burns-night-smoke.spec.ts`.

- [ ] **Step 1:** Failing Playwright test: mock system clock to Jan 25; verify pipes-in ceremony triggers; haggis-platter spawns; Chronicle shows badge.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Commit.

### Task 16: M2 ship gate

- [ ] All Burns Night effects functional with mocked clock.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(seasonal): M2 — Burns Night effects complete`.

---

## M3 — Croft integration (H1 dep)

### Task 17: Seasonal prop sprites

**Files:** `src/art/sprites/croft/thistle.ts` (3 states: default/bloomed/wilted), `src/art/sprites/croft/haggisPlatter.ts`, `src/art/sprites/croft/burnsAddressCard.ts`.

- [ ] **Step 1:** Failing tests per drawer.
- [ ] **Step 2:** Implement 3 programmatic drawers.
- [ ] **Step 3:** Commit per drawer.

### Task 18: CroftScene prop application

**Files:** `src/scenes/CroftScene.ts`.

- [ ] **Step 1:** Failing smoke test: when Burns Night active, haggis-platter + Address card + blooming thistle appear.
- [ ] **Step 2:** Wire per-active-event prop application.
- [ ] **Step 3:** Commit.

### Task 19: Gran banter on croft-entry (B1 coordination)

- [ ] **Step 1:** Gran's croft-entry banter during Burns Night uses Burns-citational pool.
- [ ] **Step 2:** Wire banter trigger priority override.
- [ ] **Step 3:** Commit.

### Task 20: M3 ship gate

- [ ] Props render correctly when event active; removed when inactive.
- [ ] Gran Burns banter fires.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(seasonal): M3 — Croft Burns Night props complete`.

---

## M4 — Music layer + launch

### Task 21: Conductor Piper-layer activation

**Files:** `src/systems/music/Conductor.ts`.

- [ ] **Step 1:** Failing test: when Burns Night active, combat music more frequently activates pipe-lead layer.
- [ ] **Step 2:** Wire; gate on `SeasonalEventManager.isActive('burns_night')`.
- [ ] **Step 3:** Commit.

### Task 22: Seasonal event banner (HUD notification)

**Files:** `src/ui/SeasonalEventBanner.ts`.

- [ ] **Step 1:** Failing smoke test: banner appears on CroftScene entry during active event.
- [ ] **Step 2:** Implement subtle banner ("🕯 Burns Night is live").
- [ ] **Step 3:** Commit.

### Task 23: Opt-out setting wire

- [ ] **Step 1:** Failing test: when `disableSeasonalEvents: true`, no effects activate.
- [ ] **Step 2:** `SeasonalEventManager.activeSeasonalEvents()` returns empty when setting on.
- [ ] **Step 3:** Commit.

### Task 24: M4 ship gate + launch

- [ ] All Burns Night effects live.
- [ ] Opt-out works.
- [ ] Bundle delta ≤ +30 KB gzip.
- [ ] `npm run ci:all` green.
- [ ] Ship commit: `feat(seasonal): E1 — seasonal events + Burns Night shipped`.

---

## Follow-up events (post-launch data additions)

Each future event is a data entry + ~10–20 banter lines + ~3–5 sprites. One event per sprint after launch:
- **Hogmanay** (Dec 28 – Jan 3).
- **Imbolc** (Jan 30 – Feb 3).
- **St Andrew's Day** (Nov 27 – Dec 3).
- **Up Helly Aa** (last Tue January ± 3 days).
- **Beltane** (Apr 28 – May 4).
- **Samhain** (Oct 28 – Nov 3).
- **Culloden anniversary** (Apr 13 – Apr 19, *Grave-tone only per CULTURAL_SENSITIVITIES §2.3*).

---

## Risk-watch

| Signal | Response |
|---|---|
| Device clock wrong | Acceptable cost; events occasionally fire off-calendar. |
| Culloden content-warning not respected | Gate event activation on `contentWarnings` setting; show pre-warning. |
| Burns quotation misattribution | Source-verified per B1 authoring discipline. |
| Bundle bloat with future events | Data + few sprites per event; <20 KB each. |
