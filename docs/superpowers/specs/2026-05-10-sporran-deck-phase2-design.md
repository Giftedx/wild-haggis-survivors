# Sporran Deck Phase 2 — chronicle persistence + replay-side pick replay

**Date:** 2026-05-10
**Initiative:** S1 Phase 2. Direct continuation of `2026-05-09-sporran-deck-design.md` (Phase 0 + 1 + 1.5 shipped).
**Status:** ✅ Shipped 2026-05-10 — see "Shipping note" below for the v3-in-place vs v4-bump deviation. Phase 3 pool expansion shipped same day in `f514cb8`.
**Word count:** ~1,800
**Prerequisite:** Phase 0 (`eabe2a6`) + Phase 1 (`6275720`) + Phase 1.5 12th card (`a5043e5`) + Phase 1.5 DOM-focus mirror (`d3221b8`) all shipped on master.

---

## Shipping note (truth-up 2026-05-11)

The body below is the design as originally drafted. Two deviations from the implementation that landed:

1. **Replay blob versioning.** The spec proposed bumping to `ReplayBlobV4` with a new codec module. Implementation extended `ReplayBlobV3` in place with an optional `sporranPicks?: readonly string[]` field (see the v3 module docstring + `src/replay/ReplayRecorder.test.ts` `describe('ReplayRecorder S1 Phase 2 (sporranPicks)')`). Reason: the new field is purely additive and back-compat-shaped, so the v3 → v4 ladder argument in §4 below was redundant for this slice. Sister-shape held; the version ladder rationale stays valid for the next state-affecting addition.
2. **Save schema version.** The spec planned `SAVE_SCHEMA_VERSION 18 → 19` solely for `sporranPicks`. By ship time the schema chain had already moved beyond v19 for other features; `sporranPicks` rode along on the broader migration pass rather than triggering its own bump. Current `SAVE_SCHEMA_VERSION` is **22** (see `src/utils/save/schema.ts`); `sporranPicks` is read/written through `src/utils/save/history.ts` `coerceRunHistoryEntry`.

Shipping commits (in order):

| Commit | Surface |
|---|---|
| `e183bcb` | Phase 2 — chronicle persistence + replay-side pick replay |
| `b658b8d` | Chronicle row pip strip — surface drafted picks per run |
| `f514cb8` | Phase 3 — pool expansion (deed / seasonal / variant gates) |
| `8d92dfa` | DOM-focus restore-target fix unblocking the SporranScene a11y path |
| `1c3dd31` | Chronicle pip-strip hover tooltip — surface card names |
| `e77fda3` | RunHistoryRecorder two-store split clarification (trinity-by-design) |

The "Draft — no code yet" status line above is the original spec status and is left in the prose as decision history; the frontmatter status is the source of truth.

---

## 1. Problem statement

Phase 1.5 closed all the player-facing seams — the player can draft a hand, keep three cards, hit confirm, and the modifier deltas + post-spawn hooks ride into `GameScene` correctly. The Phase 1 spec deferred two pieces of the contract to Phase 2:

1. **Chronicle persistence.** A run's picks vanish at run-end. The Chronicle records `curseKey`, `routes`, `relics`, `nodeOutcomes`, `seasonalEvent`, even the haggis cosmetic name — but not what the player drafted from the sporran. Returning players have no record of which mixed posture brought a victory; the run's identity is incomplete.
2. **Replay-side pick replay.** T1 deterministic replay reproduces inputs frame-by-frame, but `applySporranPicks` mutates `RunModifiers` BEFORE the input stream starts. A replay of a sporran run today applies *no* picks — the recording has no field to carry them, so the playback bag is the un-modified default. Same seed + same inputs ≠ same outcome on a sporran run.

Both are silent gaps. Neither will *crash* a run. Both quietly make the run's footprint dishonest.

### Player outcome

After Phase 2 ships:
- A run played through the Sporran shows up in Chronicle with the three picked card IDs (icon strip + tooltip-style breakdown).
- A run replay reproduces the picked posture exactly. The bag mutation runs before the first frame, in pick order, indistinguishable from the original run.
- A pre-Phase-2 saved replay still loads (its blob has no sporran field; the replay just reproduces a no-sporran run, which is what the player did at the time).

---

## 2. Design risks

**Risk 1 — Save migration regression.**
v18 → v19 adds an optional `RunHistoryEntry.sporranPicks?: string[]`. The migration is a pure version bump (sister to v15 → v16's optional `nodeOutcomes`). The risk is the coercer on existing entries: `coerceRunHistoryEntry` already filters unknown / malformed fields, but adding sporran needs an explicit pass. **Mitigation:** add `sporranPicks?: readonly string[]` to the coercer with the same defensive shape as `weaponKeys` (filter non-strings, drop empty entries) and a paired test.

**Risk 2 — Replay version explosion.**
Replay blobs are at v3 already (v1 base, v2 curse+routes+composedStats, v3 nodeOutcomes). Adding sporran picks would push to v4. The risk is "every system gets a version bump" → unbounded blob versioning. **Mitigation:** v4 is justified because (a) this is the LAST major run-shape field that affects state (cosmetic names + seasonal event don't); (b) v4 stays additive (single optional field) and reuses every parse helper from v1; (c) the `ReplayBlobAny` union pattern absorbs new versions without changing call-sites (sister: how v3 layered cleanly on top of v1+v2 in `ReplayBlobAny`). Future bumps for non-state fields go on v4 too — sporran is the trigger but the version doesn't reset to v4 for every future addition.

**Risk 3 — Replay-side apply ordering.**
On playback, `applySporranPicks` must run at the same point in the GameScene init as during recording — between the curse pass and seasonal pass, before SpawnSystem caches `spawnIntervalMult`. Phase 1's `buildSporranRunStartPlan` already sits at this point in `GameScene.create()`. **Mitigation:** the playback path reads `pendingSporranIds` from the replay blob (instead of from the init payload) but routes through the same helper. Single source of truth; no playback-only code.

**Risk 4 — RunHistoryEntry size.**
A `string[]` of three short IDs is ~50 bytes, negligible. The `MAX_RUN_HISTORY = 20` cap stays unchanged. `REPLAY_HISTORY_CAP = 5` is unchanged. No quota pressure.

**Risk 5 — Coercion on legacy entries that look like they have sporran picks but don't.**
A pre-Phase-2 entry with `sporranPicks: undefined` is the ground truth state today. The coercer must distinguish "absent" (legacy run, no picks) from "empty array" (user opted out at the picker — an empty array isn't currently constructible since `commitPicks` requires 3 picks, but defensively still distinguish). **Mitigation:** keep `sporranPicks` as optional; absent ⇒ no Sporran-picker path used. Empty array is normalised to absent (`!arr.length`) in the coercer to match the GameScene init payload's "null on empty" canonicalisation.

**Risk 6 — Chronicle UI surface explosion.**
Adding picks to the run-history card crowds an already-busy card. **Mitigation:** Phase 2 ships data + minimal UI surface — one icon strip (3 small card-kind chips) below the existing weapons row, no tooltip / hover detail. Phase 3 may add a hover panel; that's a UI polish iteration with no schema impact.

---

## 3. Implementation map

### Files (all changes additive — no rewrites)

#### Save state chain (per CONTRIBUTING.md §"Save state chain")

- **`src/utils/save/schema.ts`** — `SAVE_SCHEMA_VERSION = 18 → 19`.
- **`src/utils/save/types.ts`** — extend `RunHistoryEntry`:
  ```ts
  /**
   * S1 Phase 2 — Sporran Deck picks (3 of 7 drawn cards). Absent on
   * runs that did not go through the SporranScene path; coercion drops
   * stale / unknown IDs so a renamed card in a future release doesn't
   * corrupt past entries. v19 addition.
   */
  sporranPicks?: readonly string[];
  ```
  Also extend `RunHistoryContext` with the same field (optional, passed through from `GameScene` to `RunHistoryRecorder`).
- **`src/utils/save/migrations.ts`** — add `migrateV18ToV19(raw: SaveRecord): SaveRecord` (pure version bump, no retroactive seed possible) + thread through the switch in `migrateSave`. Coercer in `coerceRunHistoryEntry` adds the `sporranPicks` filter using the same `coerceStringArray`-style pattern as `weaponKeys`, but kept as a private helper `coerceSporranPicks(raw, knownIds)` that drops IDs not in `ALL_SPORRAN_CARDS`.
- **`src/utils/save/migrations.test.ts`** — new test: pre-v19 entry round-trips clean with `sporranPicks` absent; v19 entry with sporran picks round-trips identically; v19 entry with stale ID has it dropped.

#### Replay chain (per CONTRIBUTING.md §"State RNG / replay chain")

- **`src/replay/replayBlobV4.ts`** (new) — sister to `replayBlobV3.ts`. Adds:
  ```ts
  export const REPLAY_BLOB_V4_VERSION = 4 as const;

  export interface ReplayBlobV4Meta extends ReplayBlobV3Meta {
    /** Ordered sporran picks (3 IDs) if the run took the SporranScene path. */
    sporranPicks?: readonly string[];
  }

  export interface ReplayBlobV4 extends ReplayBlobV4Meta {
    version: typeof REPLAY_BLOB_V4_VERSION;
    frameCount: number;
    frames: ReplayFrame[];
  }
  ```
  + `createEmptyReplayBlobV4` + `serializeReplayV4` + `deserializeReplayV4` + `isReplayBlobV4` mirroring v3 shape exactly. Reuses `parseReplayBaseMeta` + `parseReplayFrames` + the v3 helpers (`coerceRoutes` + `coerceNodeOutcomes`); adds local `coerceSporranPicks` validating against `ALL_SPORRAN_CARDS`.
- **`src/replay/replayBlob.ts`** — extend `ReplayBlobAny` to include `ReplayBlobV4`; extend `isReplayBlobAny` accordingly. Pre-v4 readers continue rejecting v4 blobs by version mismatch (no partial-compat shim — same lock as v1/v2/v3).
- **`src/replay/replayBlobV4.test.ts`** (new) — coverage: v4 serialize/deserialize round-trip, v4 with absent sporran round-trips, v4 with stale-ID gets it dropped, v4 with `[]` normalises to absent.
- **`src/replay/replayDeterminism.test.ts`** — extend the existing determinism regression to cover sporran picks: record a run with picks → replay → assert identical `RunModifiers` mutation + identical post-spawn hp / damage-mult.

#### Recording side (`src/scenes/game/replayBridgeInstall.ts`)

- `installReplayRecording` already takes `seed`, `variantKey`, `build`, `curseKey`, `composedStats`. Add `sporranPicks?: readonly string[]`. The recorder builds a v4 blob when `sporranPicks` is non-empty AND nodeOutcomes are present (or `sporranPicks` alone — see §4 versioning ladder); otherwise drops back to v3 / v2 / v1 per the existing layered pattern.
- **`src/scenes/GameScene.ts`** — `installReplayRecording` call site adds `sporranPicks: this.pendingSporranIds`. Single line; sister-shape to the existing `curseKey: this.activeCurseKey` field passing.

#### Playback side (`src/replay/ReplayInput.ts`)

- The `pendingSporranIds` payload field is already optional on `GameSceneInitDataInput` (Phase 1 work). When the init payload carries a `replay` blob and the blob is v4 with `sporranPicks`, `parseGameSceneInitData` overrides `pendingSporranIds` with the blob's array (same precedence rule as `curseKey`: replay wins). Touch only `gameSceneInitData.ts` — `parseGameSceneInitData` extracts `sporranPicks` from the blob in the existing `if (data.replay && isReplayBlobAny(data.replay))` branch.
- **`src/scenes/gameSceneInitData.test.ts`** — new tests: v4 blob with sporran overrides caller-passed array; v4 blob without sporran clears caller-passed array (consistency with curse handling); v3 blob preserves caller-passed (no sporran field on v3 to read from).

#### Run history recording

- **`src/scenes/game/RunPersistenceBridge.ts`** (or wherever `RunHistoryContext` is built — likely `runHistoryContextBuilder.ts` if extracted) — add `sporranPicks: this.pendingSporranIds ?? undefined` to the context.
- **`src/scenes/game/RunHistoryRecorder.ts`** — pass-through to `RunHistoryEntry` (sister field to `routes` / `nodeOutcomes`).

#### Chronicle UI

- **`src/scenes/ChronicleScene.ts`** (or its row builder under `src/scenes/chronicle/`) — render a 3-icon strip on entries where `sporranPicks` is present. Icon comes from the kind chip palette (`SPORRAN_KIND_ACCENT` from `sporranTileLayout.ts`) — three small coloured pips per card kind. Hover/tooltip out of scope; Phase 3 work.
- **`src/core/i18n/sporran.ts`** + **`src/core/i18n.scs/sporran.ts`** — add `chronicle.label` ("Sporran picks") for the row label. Curse / boon / quirk chip tooltips reuse existing keys.

### i18n parity chain (per CONTRIBUTING.md §"i18n parity chain")

Single new EN+SCS leaf: `sporran.chronicle.label`. SCS→EN parity walk catches missing entries; manually add SCS at the same commit.

### CLAUDE.md / DESIGN_IDEAS / spec / memory truth-up

- `CLAUDE.md` Sporran Deck Key Mechanics row — bump phase declaration to Phase 2 + cite v19 schema and v4 replay blob.
- `DESIGN_IDEAS.md §1` row — same bump.
- `2026-05-09-sporran-deck-design.md` Status header — Phase 2 shipped.
- `2026-05-10-sporran-deck-phase2-design.md` (this file) Status header — shipped.
- `project_sporran_deck_status.md` memory file — Phase 2 entry. Open follow-ups list shrinks (Phase 2 chronicle + replay closed; Phase 3 pool expansion still open).

---

## 4. Replay-blob versioning ladder

The v3 → v4 jump deserves a one-line justification because it sets the precedent for future bumps:

| v | Adds | Rationale |
|---|------|-----------|
| 1 | base (frames + seed + variant + build) | T1 ship |
| 2 | curseKey + routes + composedStats | T1 Phase 3 |
| 3 | nodeOutcomes | M1 multi-node |
| 4 | sporranPicks | **this spec** — last major state-affecting run-shape field |

After v4, future blob bumps go on v4 (additive optional fields) until a frame-shape or semantics change (gamepad face buttons, alternative input encodings) forces v5. Sporran is the *trigger* for v4, not the only thing that lives there.

---

## 5. Test coverage map

| Gate | Test |
|---|---|
| Migration v18 → v19 | `migrations.test.ts` — round-trip; pre-v19 absent; v19 present; v19 with stale ID dropped |
| Replay v4 codec | `replayBlobV4.test.ts` — round-trip; absent sporran; stale ID drop; empty array normalisation |
| Replay determinism | `replayDeterminism.test.ts` — record sporran run + replay + identical RunModifiers + identical Player hp/damageMul |
| Init payload precedence | `gameSceneInitData.test.ts` — v4 blob overrides caller-passed; v4 absent clears caller-passed; v3 preserves caller-passed |
| Run history coercion | `migrations.test.ts` (existing file) — `coerceSporranPicks` filters non-strings + unknown IDs |
| i18n parity | existing `i18n.locale.test.ts` SCS→EN walk catches new keys |

Estimated +12-16 unit assertions. Bundle delta < 1 KB gzip (typed parser + new file).

---

## 6. Pre-ship 5-question gate (per CONTRIBUTING.md)

1. **Filters cleared?** Stand-the-test (mirrors v3 shape exactly) ✓ ; ultra-efficient (no per-frame allocation; one `Array.filter` at coercion time) ✓ ; secure (defensive ID coercion, same pattern as `weaponKeys`) ✓ ; technically impressive (composes with replay blob layer + save migration chain + sporran helper) ✓ ; minimal slop (no premature feature flag, no defensive try/catch, three optional fields) ✓ .
2. **Chains walked?** Save chain (9 steps): bump version, migration, types, NO bumper (only mid-session writers need bumpers — sporran picks are write-once), NO query helper (single Chronicle reader is fine inline), history coercion update, migration test, NO i18n add for picks themselves (cards already have keys), declare cosmetic-only carve-out for the cosmetic chronicle icons. Replay chain (5 steps): runRng usage unchanged (no new gameplay rolls), RNG-stream order unchanged, fixed-step unchanged, determinism test extended, replay status declared.
3. **Invariants surfaced?** Schema v19 announces in CLAUDE.md mechanic entry. Replay v4 announces in same entry. RNG-stream order untouched (sporran picks consumed from init payload, not generated by runRng).
4. **Verification proof?** TBD — at ship: quote `npm run ci` output + replay round-trip log.
5. **Soul Check passed?** Player-facing surface is the chronicle icon strip — Hearth tone (echoes `firstFooting` toast already shipped). N/A for the data plumbing.

---

## 7. Phase boundaries

What this spec ships:
- Save schema v19 with optional `RunHistoryEntry.sporranPicks`.
- Replay blob v4 with optional `sporranPicks`.
- Recording-side capture from `pendingSporranIds`.
- Playback-side override via `parseGameSceneInitData` precedence.
- Chronicle row icon strip (3 kind-coloured pips).
- EN + SCS i18n for the chronicle label.
- All coercer + replay determinism tests.

What this spec does NOT ship (deferred):
- Chronicle hover/tooltip detail panel (Phase 3 polish).
- Pool expansion (rare deed-gated, seasonal date-gated, variant-keyed cards) — separate Phase 3 spec.
- URL `?sporran=1` auto-route flag (Phase 1 spec mentioned it, never shipped, low value vs the CurseScene link).
- Balance / telemetry pass — needs telemetry surface that doesn't exist yet; future phase.
- Almanac integration — sporran has no canonical "discovery log" entry per card today (vs runes / weapons that do); deferred until pool expands.

---

## 8. Dispatch brief

This spec doubles as a dispatch brief. A subagent should be able to run end-to-end without escalation by walking sections 3 → 5 in order. Every file path is canonical; every sister-pattern reference points to existing live code. The "additive only, no rewrites" constraint keeps the blast radius bounded — every change is either (a) a new file, (b) a new optional field, or (c) a single-line addition to a parameter object.

Estimated session size: 2–3 hours including verification + memory truth-up.

---

*Spec lock. Phase 2 implementation follows.*
