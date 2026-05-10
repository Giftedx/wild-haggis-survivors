# W2 — The Moor Road (Design Spec)

**Status:** draft, awaiting review
**Date:** 2026-04-16
**Initiative:** W2 — flagship (per `docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Prerequisite:** R3a shipped (commit `240b22c`) — `RunScoreState` extraction unblocked W2.

---

## 1. Premise

Reframe the existing endless run as **three escalation phases** ("acts") with **two between-act choice surfaces** ("pickers"). Acts piggyback on three of the four boss boundaries the SpawnSystem director already produces — they do not introduce new bosses, new spawn states, or new SpawnSystem coupling.

**Boss → act mapping (uses existing `BOSSES` table in `src/data/enemies.ts`):**

| Act | Boss | Spawn time | Action on boss kill |
|-----|------|-----------|---------------------|
| 1 | `gordon` (Gordon the Chef) | 5:00 | Launch picker A |
| 2 | `tour_bus` (The Tour Bus) | 10:00 | Launch picker B |
| 3 | `the_laird` (The Laird) | 15:00 | Trigger existing victory bell |
| post-bell | `hunter_general` (Haggis Hunter General) | 20:00 | Unchanged — existing post-bell content |

Each picker offers three perceptible mid-run choices that change what the player sees on screen within ~30 seconds (healing zone adds, spawn-rate changes, healing burst, treasure-chest forcing, elite spawn density). Choices write to `RunModifiers` for in-run effect and to `RunHistoryEntry.routes` for Chronicle recall. They never persist as gameplay unlocks (no dark-pattern meta progression).

The flagship is opt-out via accessibility setting (Skip Intermissions) — survivor-genre veterans who reject flow breaks remain unaffected.

## 2. Non-goals

- **Not a replacement for endless.** Post-bell endless extension stays. Acts end at boss kills; the third boss kill = current victory bell.
- **Not a story mode.** No linear narrative, no character arcs, no cutscenes. Three short act-intro captions and six route descriptions are the entire prose surface beyond banter.
- **Not new bosses.** Reuses three of the four existing bosses (`gordon`, `tour_bus`, `the_laird`); `hunter_general` post-bell appearance is untouched.
- **Not new SpawnSystem state.** Acts read time and boss-kill events passively; SpawnSystem director is unchanged.
- **Not meta progression.** Routes log to Chronicle for narrative recall only. No unlocks, no aging currency, no FOMO.
- **Not a separate scene flow.** GameScene remains the run loop; ActIntermissionScene is a paired modal pattern (mirrors how CurseScene relates to MenuScene).

## 3. Architecture

### 3.1 Scene flow (delta from current)

```
BootScene → MenuScene → GameScene → [ActIntermissionScene ↔ GameScene] → ShopScene
                                    └ paired modal, fires after boss 1, boss 2
```

ActIntermissionScene is `scene.launch`-paired with GameScene (not `scene.start`), so GameScene's instance, physics world, and entity state survive the intermission. GameScene pauses physics via `TimeManager.request('ACT_INTERMISSION', { pausePhysics: true, timeScale: 0 })` for the duration. Released when picker resolves.

### 3.2 New / modified files

| Path | Status | Purpose |
|------|--------|---------|
| `src/scenes/game/RunActState.ts` | new | State machine: `currentAct: 1\|2\|3`, `actStartTimeSec`, `pickerHistory: RoutePick[]`. Mirrors `RunScoreState` pattern (~80 lines + tests). |
| `src/core/RunModifiers.ts` | extend | Add `routePicks: RoutePick[]` (append-only). Defaults `[]`. |
| `src/scenes/game/RunLifecycle.ts` | extend | Emit `onActComplete(actNumber)` callback after boss kill. Hook for ActIntermissionScene launch. Existing post-bell logic untouched. |
| `src/scenes/ActIntermissionScene.ts` | new | Paired modal scene. Renders three route cards, accepts pick, resolves to GameScene. ~150 lines + smoke test. |
| `src/data/routes.ts` | new | Six `RouteDef` entries. Pure data: route key, label i18n key, description i18n key, modifier deltas, on-resume callbacks. |
| `src/utils/save.ts` | schema bump | `SAVE_SCHEMA_VERSION` 3 → 4. `RunHistoryEntry.routes?: RoutePick[]` (optional, missing = `[]`). |
| `src/ui/Chronicle*` (existing) | extend | "Moor Road log" panel reads `routes` from history entries. |
| `src/data/banter.ts` | extend | New trigger keys: `act_intermission_enter`, `route_picked.{routeKey}`. ~15 new lines. |
| `src/core/SettingsManager.ts` | extend | Add `skipActIntermissions: boolean` (default `false`). |
| `src/core/i18n.ts` (en + scs) | extend | Six route labels, six route descriptions, three act-intro captions, one settings label. |

### 3.3 Data shapes (TypeScript)

```ts
// src/data/routes.ts
export type RouteKey =
  | 'up_the_brae' | 'round_the_loch' | 'through_the_kirkyard'  // picker A
  | 'stand_yer_ground' | 'run_for_the_hills' | 'buckie_pitstop'; // picker B

export type PickerSlot = 'A' | 'B';

export interface RouteDef {
  readonly key: RouteKey;
  readonly slot: PickerSlot;
  readonly labelKey: string;       // i18n: routes.<key>.label
  readonly descKey: string;        // i18n: routes.<key>.desc
  readonly modifierDeltas: Partial<RunModifiers>; // applied additively where sensible
  readonly onResume?: (ctx: RouteResumeContext) => void; // healing, chest seeding, hazard spawn
}

// Passed to onResume — gives a route access to the systems it needs without
// the route definition having to import the whole scene graph.
export interface RouteResumeContext {
  readonly player: Player;
  readonly hazardZones: HazardZones;
  readonly pickupSpawner: PickupSpawner;
  readonly spawnSystem: SpawnSystem;
  readonly timeManager: TimeManager;
  readonly runRng: RNG;
}

// src/scenes/game/RunActState.ts
export interface RoutePick {
  readonly slot: PickerSlot;
  readonly routeKey: RouteKey;
  readonly atGameTimeSec: number;
  /** True when the pick was applied automatically by the Skip Intermissions setting. */
  readonly defaultedBySetting: boolean;
}
```

### 3.4 Picker timing

- Picker A: launched on `gordon` boss kill (~5:00). Triggered by `RunLifecycle.onActComplete(1)`.
- Picker B: launched on `tour_bus` boss kill (~10:00). Triggered by `RunLifecycle.onActComplete(2)`.
- `the_laird` boss kill (~15:00) triggers the existing victory bell — no picker.
- `hunter_general` (~20:00) post-bell appearance unchanged.

### 3.5 SpawnSystem isolation

SpawnSystem reads `RunModifiers.spawnIntervalMult` already. Routes that change spawn rate (e.g. `run_for_the_hills`) write to that field — SpawnSystem code unchanged. Routes that affect drop rates (e.g. `up_the_brae` extra evolution chest) interact with the existing chest-spawn timer in `installTreasureChestTimer.ts`. Routes that affect zones reuse the existing `HazardZones` healing-circle/lava-patch primitives — no new zone types in v1.

**New wiring (additive):** `EnemyKillHandler` already increments `RunScoreState.bossKillCount` on boss death. M1 adds a single forwarding callback in `EnemyKillHandler` (or its hooks): when the killed enemy is a boss whose key matches `gordon` or `tour_bus`, fire `RunLifecycle.onActComplete(1\|2)` after the existing counter increment. The `the_laird` kill continues to flow to the existing victory path (untouched). No new state in SpawnSystem; the new code is a ~5-line dispatch in the kill handler.

### 3.6 Persistence

Per-run: `RunModifiers.routePicks: RoutePick[]` lives in memory, written to history at run end alongside other run summary fields.

Across-run: `RunHistoryEntry.routes?: RoutePick[]` is optional in the schema. Migration v3 → v4: existing entries default `routes: []`. No data lost; readers handle absent field.

The Chronicle "Moor Road log" panel renders each entry's route trail as breadcrumbs ("Brae → Pit-stop"). Pure recall surface — no gameplay interaction.

## 4. Routes (content)

### Picker A (after boss 1)

| Key | Label (en) | Effect |
|-----|------------|--------|
| `up_the_brae` | "Up the brae" | Elite spawn weight ×1.5 for act 2. Next treasure-chest spawn forced golden (reuses existing `spawnGoldenChest` path — 60s after resume at the latest). |
| `round_the_loch` | "Round the loch" | Heal 25% of max HP. Two extra healing circles spawn in act 2 via `HazardZones` healing primitive. |
| `through_the_kirkyard` | "Through the kirkyard" | `spawnIntervalMult` ×0.70 (denser spawns) for 90s after resume, released on timer. Elite `haggis_hunter` add at 60s after resume via direct SpawnSystem call. |

### Picker B (after boss 2)

| Key | Label (en) | Effect |
|-----|------------|--------|
| `stand_yer_ground` | "Stand yer ground" | XP gem density ×2 for first 30s of act 3. No hazard adds. |
| `run_for_the_hills` | "Run for the hills" | `spawnIntervalMult` ×0.75 (faster spawns) for act 3. Heal 50% + refresh dash charges. |
| `buckie_pitstop` | "Buckie pit-stop" | 15s spawn pause on resume. Reroll bank +1. Act 3 enemy HP ×1.10. |

Glesga voice copy lives in `src/core/i18n.ts` under `routes.<key>.label` and `routes.<key>.desc` (en + scs). Voice register: Still Game warmth default, slight Limmy bite for higher-cost routes per `feedback_voice_register.md`.

## 5. Accessibility — Skip Intermissions

`SettingsManager.skipActIntermissions: boolean` (default `false`).

When true, `RunLifecycle.onActComplete(n)` skips `ActIntermissionScene.launch` and instead applies a deterministic default route (the lowest-cost option for that picker — `round_the_loch` for A, `stand_yer_ground` for B) and writes the pick to history with a `defaultedBySetting: true` flag for Chronicle clarity.

Setting toggle lives in the existing comfort settings panel (alongside other flow-affecting toggles). Surfaces in the level-up flow tutorial copy on first run.

## 6. Banter integration

Three new trigger families in `src/data/banter.ts`:

- `act_intermission_enter` — fires once on intermission launch. 3 variants × 2 acts = 6 lines.
- `route_picked.{routeKey}` — fires on resume after picker resolves. 2 variants × 6 routes = 12 lines.
- `act_complete.{actN}` — short outbound line on boss kill. Reuses existing `boss_down` banter context (verified present in `src/data/banter.ts`); 2 variants × 2 acts = 4 lines.

Total new banter lines: ~22. Existing `banter.ts` already 603 lines and pattern-tested — additions follow the same shape.

## 7. Kill criterion

**Original criterion ("act-1 retention ≤ baseline endless retention after four playtest rounds") was un-runnable** — game has no retention telemetry, runs in offline localStorage.

**Replacement criterion. SHELVE W2 if any of these trigger after 5 playtest sessions across 3 players:**

1. **Route monotony.** ≥80% of post-tutorial runs pick the same route at picker A → choice is fake.
2. **Completion regression.** Run-start → victory-bell completion rate drops more than 15% vs. baseline pre-W2 `runHistory` (compute baseline from history entries with `routes` absent or empty) → pickers crater flow.
3. **Skip-rate spike.** >60% of players enable `skipActIntermissions` after one or more runs → feature is unwanted.

All three signals derive from existing `runHistory` shape plus a one-bit setting. No new telemetry pipeline. Falsifiable.

## 8. Vertical-slice milestones

Three increments, each independently shippable and falsifiable.

### M1 — engine seam + picker A
- `RunActState.ts` + tests
- `ActIntermissionScene.ts` + smoke test
- Picker A only (3 routes from `up_the_brae`, `round_the_loch`, `through_the_kirkyard`)
- Picker B no-ops (act 2 → 3 transition silent)
- Save schema v3 → v4 migration + tests
- Banter triggers for picker A only
- Skip-intermissions setting wired

**Decision gate:** 3 internal playtests. Does picker A feel right? If completion regression already triggers here, pause and rethink before M2.

### M2 — picker B + rhythm
- Picker B added with 3 routes
- Banter triggers for picker B
- Chronicle Moor Road log panel (read-only display of route history)
- 3 more internal playtests

**Decision gate:** Full kill criterion check (all three signals). Pass → M3. Fail → shelve.

### M3 — polish
- Glesga voice pass on all 18 strings (6 routes × 2 fields + 3 act-intro + 3 misc)
- Scots translation pass
- Chronicle log polish (icons, ordering)
- E2E smoke test covering picker A → picker B → victory
- Settings panel UX pass on Skip Intermissions toggle copy

## 9. Risks held in writing

- **Genre fit risk.** Survivor-likes do not have act structure (VS, Brotato, Halls of Torment all forgo it). Hedged by skip setting; even with 50% skip rate, half the audience gets value and the other half is unaffected.
- **Picker A is load-bearing.** If the first picker feels intrusive in M1 testing, the whole flagship dies. M1 exists exactly to surface this fast — sub-week kill signal.
- **Chronicle log is post-hoc framing, not value prop.** The value prop is mid-run perceptible choice. Log adds care without bloat but cannot rescue weak pickers.
- **Schema bump is one-way.** v3 → v4 cannot rollback gracefully (older clients will fail to read v4). Standard for this codebase per existing migration pattern.
- **Authoring lane is real but bounded.** ~470 words new prose (vs. earlier 3000-word over-estimate that nearly killed the flagship). Voice pass concentrated in M3 to avoid mid-build copy churn.

## 10. Out of scope (parking lot)

- Dynamic route unlocking (e.g. completing a route 5× unlocks a 4th option per picker). Reconsider if W2 ships and engagement is high.
- Picker C in act 3 (rejected — home stretch must stay uninterrupted).
- Multi-run modifiers (route taken last run affects this run). Reconsider for W66 Ironmoor.
- Route-specific boss variants. Out of scope for v1; reuses base bosses.

## 11. Downstream unlocks

Per master plan dependency notes:
- **W66 (Ironmoor permadeath alt mode)** — reuses act/chapter break pattern for permadeath checkpoints.
- **W18 (Scots / English bilingual ship)** — gets ~18 new strings (6 routes × 2 fields, 3 act captions, 3 settings/UI) + ~22 banter lines for the translation pipeline.
- **W39 (Chronicle Weave)** — Moor Road log gives authored prose hooks for chronicle tone variation.

## 12. Open questions for spec review

(None blocking — all decisions made. Listed for reviewer scrutiny.)

- Is the "deterministic default route on skip" the right call, or should skipped intermissions apply NO modifier? (Current choice: apply default — preserves Chronicle log integrity.)
- Should picker timing be boss-kill-triggered (current) or time-triggered (e.g. exactly at 6:00 / 11:00)? Boss-trigger handles SpawnSystem variance; time-trigger is more predictable for speedruns. Current: boss-trigger.
- Should the same route be selectable across consecutive runs, or should we soft-discourage repetition (e.g. dim the icon)? Current: free repetition. Route monotony shows up in kill criterion.
