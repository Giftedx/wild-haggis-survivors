# Spec — Cloud Save Conflict-Resolution UX

**Date:** 2026-04-26
**Status:** Draft (awaiting stakeholder approval; tracked in
`docs/top-10-tasks/blocked/03-blocked-on-human.md` item 4).
**Charter:** `docs/top-10-tasks/03-p3-cloud-saves.md` §Phase 2.2
**Decision matrix:** `docs/P3_BACKEND_DECISION_MATRIX.md`

## Context

P3 ships cloud save sync for the existing `whs_save` payload (schema
v17). The charter mandates Last-Writer-Wins (LWW) for v1, with a UX hook
that shows the player a "you have a newer save on another device,
restore?" dialog if the cloud version is newer than the local at sign-in.

This is "kindness over correctness" territory. Players who play on
multiple devices will hit this. If we silently overwrite their local
progress with stale cloud data, or vice versa, we'll burn trust on the
first sync — and trust is the only thing the cloud feature has to sell.

The Soul Charter (`docs/DESIGN_SOUL.md`) anchors voice and tone. The
Voice Card (`docs/VOICE_CARD.md`) puts account UX firmly in the **Hearth**
register: warm, plain, no Edge. Burns Night flourishes are out of place
here; this is a "Gran-explains-it" moment.

## Goals

1. Never silently lose progress.
2. Resolve correctly in the common case (no actual conflict — one device
   is just newer) without prompting.
3. Show the player a clear, calm choice when there's real ambiguity.
4. The player can always **opt out** of cloud sync mid-flow if they
   change their mind.
5. Implementation is testable as a pure module before any Phaser
   integration.

## Non-goals

- **Three-way merge** (combining changes from both saves). Multi-week
  work; brittle; charter rejects.
- **Real-time multi-device editing** (CRDTs, OT). Single-player game,
  one writer at a time, no need.
- **Server-side conflict resolution.** All decision logic runs
  client-side; the Worker is dumb storage.

## Decision: Last-Writer-Wins, surfaced

The four cases at sign-in (or first sync after sign-in):

### Case A — `in-sync`

Cloud envelope `lastModified === local.lastModified` (same `deviceId`,
or different deviceIds with bit-identical payloads). No prompt; toast
"Cloud save up to date" and proceed.

### Case B — `local-newer`

Cloud `lastModified < local.lastModified`. Player has been playing
offline (or on another device that hadn't synced yet) and the local is
fresher. **Push local → cloud silently.** Toast "Cloud save updated".

### Case C — `remote-newer`

Cloud `lastModified > local.lastModified` AND local
`lastModified` is **older than 60 seconds before** cloud's. Cloud is
genuinely newer; local was a stale start-up state. **Pull cloud → local
silently.** Toast "Restored from cloud — welcome back".

> The 60-second buffer prevents harmless clock skew between devices
> from ever showing the conflict dialog. If both saves were modified
> within 60 seconds of each other, treat as `conflict-ambiguous` (next
> case) — but in practice this only happens on near-simultaneous edits
> across devices, which is the exact case we want to surface.

### Case D — `conflict-ambiguous`

Anything else, e.g.:

- Both saves were modified within 60 seconds of each other on different
  devices.
- Different deviceIds AND a non-trivial gameplay-state divergence
  (different `totalKills`, different unlocks).
- Either side has the `forceConflictPrompt: true` envelope flag (escape
  hatch for testing + edge cases).

→ **Show the dialog.**

## Conflict dialog — visual + copy

```
┌─────────────────────────────────────────────────────┐
│   Twa wee saves, hen — which is yer right one?      │ Hearth voice
│                                                     │
│   ┌──────────────────┐   ┌──────────────────┐       │
│   │  This device     │   │  The cloud       │       │
│   │  ───────────     │   │  ───────────     │       │
│   │  Last played:    │   │  Last played:    │       │
│   │  Today, 14:23    │   │  Yesterday,      │       │
│   │                  │   │  21:47           │       │
│   │                  │   │                  │       │
│   │  Total kills:    │   │  Total kills:    │       │
│   │  4,210           │   │  4,180           │       │
│   │                  │   │                  │       │
│   │  Variants: 11    │   │  Variants: 11    │       │
│   │  Almanac: 142    │   │  Almanac: 138    │       │
│   │                  │   │                  │       │
│   │  [ Use this one ]│   │  [ Use this one ]│       │
│   └──────────────────┘   └──────────────────┘       │
│                                                     │
│           [ Take me back, I'll think ]              │ ← cancel
└─────────────────────────────────────────────────────┘
```

### Copy notes (Voice Card-aligned)

- **Header:** "Twa wee saves, hen — which is yer right one?" (Hearth
  register, Glesga register-default).
- **Card titles:** "This device" / "The cloud" — neutral, no jargon.
- **Field labels:** plain English ("Last played", "Total kills",
  "Variants", "Almanac"). No version numbers, no `lastModified` ISO
  strings — humans don't read those.
- **Buttons:** "Use this one" — symmetric across both cards. Avoids
  "keep" vs "discard" framing (which implies the unchosen save is
  destroyed; see preservation note below).
- **Cancel:** "Take me back, I'll think" — leaves sign-in but does NOT
  force a pick.

### Preservation guarantee (anti-loss)

When the player picks one side, the **other side is archived, not
deleted**, for 7 days. Recovery path:

- Settings → Account → "Saves on file" → list with "Restore" button per
  archived snapshot.
- Toast on the chosen-side commit: "Saved your other one safely — find
  it in Settings if you change your mind."

This makes the choice low-stakes and matches the kindness charter.
Implementation: append the loser to a circular buffer in D1
(`save_archive` table, max 5 per user, prune on overflow).

## Edge cases

| Scenario | Behaviour |
|---|---|
| Player hits **Cancel** | Stay signed in; do not write anything to cloud or local; show small "Cloud sync paused" indicator in MenuScene corner. Player can rerun via "Sync now" button or sign out. |
| Player hits Cancel **then signs out** | Local untouched; cloud envelope unchanged. Next sign-in re-runs the dialog (cloud will now be older relative to local edits, so likely Case B). |
| Cloud has corrupt envelope | Treat as `local-newer`, overwrite cloud. Log to audit table. Show no UI — invisible self-heal. |
| Local has corrupt envelope (rare; T131 catches most) | Treat as `remote-newer`, restore from cloud. Toast "Restored from cloud (local save was unreadable)". |
| Local payload schema version > cloud payload schema version | Cloud is older from before a migration. Local wins (Case B); push local → cloud post-migration. |
| Local payload schema version < cloud payload schema version | Cloud was written by a newer client. **Refuse to overwrite local with newer-schema data; refuse to push local with older schema.** Toast "Update the game to sync — open Settings → About to check version." This is rare but matters: a forward-migration only client can't safely accept a back-migration. |
| Network failure mid-sync | Local unchanged; toast "Sync failed — try again later." Retry on next sign-in or app foreground. |
| Multiple browsers, same account, all online | First-write-wins per second; LWW makes second-writer's payload override the first. With 60-second tolerance, racy double-edit is the only path to the conflict dialog — acceptable. |

## Module shape

Pure module: `src/cloud/cloudSaveConflict.ts` (no Phaser).

```typescript
export type ConflictVerdict =
  | { kind: 'in-sync' }
  | { kind: 'local-newer' }      // push local → cloud
  | { kind: 'remote-newer' }     // pull cloud → local
  | { kind: 'conflict-ambiguous'; localSummary: SaveSummary; remoteSummary: SaveSummary };

export interface SaveSummary {
  lastModifiedISO: string;
  totalKills: number;
  variantsUnlocked: number;
  almanacEntries: number;
}

export function detectCloudSaveConflict(
  local: CloudSaveEnvelope,
  remote: CloudSaveEnvelope,
  opts?: { tolerantWindowMs?: number },
): ConflictVerdict;

export function summarizeForConflictDialog(
  envelope: CloudSaveEnvelope,
): SaveSummary;
```

Phaser dialog scene (`CloudSaveConflictScene`) consumes the verdict +
summaries; never imports the inner save shape. This keeps the dialog
testable in isolation and lets future schema changes (v18, v19, …)
update the summary without touching the scene.

## Testability

Vitest covers `detectCloudSaveConflict` and `summarizeForConflictDialog`
exhaustively:

- Each case (A–D) gets a dedicated test.
- Edge cases above are individually expressed as `it('refuses to push older schema to cloud', ...)` etc.
- `MemoryCloudSaveClient` is the test double for the storage layer.

Playwright e2e (added when backend lands):

1. Sign in → no cloud → push local. (Case B baseline.)
2. Modify on Chrome → sign in on Firefox → restore. (Case C.)
3. Modify on both within 30s → sign in → conflict dialog. (Case D.)
4. Pick "this device" → verify cloud overwritten + archive entry exists.
5. Pick "cancel" → verify nothing changed.

## Soul check

- **Warmth** — yes, copy is on the player's side; no save is ever
  silently lost. ✓
- **Clarity** — yes, the dialog shows what each save *is*, not what
  version number it is. ✓
- **Tone** — Hearth register; Gran-explains. ✓
- **Voice** — passes Voice Card; Hearth, no Edge bleed. ✓
- **Moment-stack** — sign-in is not a "Great Moment" but the conflict
  resolution is a small one (recovery + reassurance). 7-ingredient
  recipe is overkill here; the moment delivers on (anticipation:
  small, since dialog is rare) + (clarity: yes) + (kindness: yes,
  preservation guarantee). ✓
- **Kindness** — yes; archive-not-delete + cancel-without-loss. ✓

## Risks

| Risk | Mitigation |
|---|---|
| Player picks the "wrong" side and loses progress mentally even if recoverable | Toast on commit explicitly mentions Settings recovery; "Saves on file" UI is reachable in 2 clicks from MenuScene. |
| Conflict dialog stops sign-in flow if player isn't sure | Cancel is always present; sign-in succeeds without committing a pick. |
| Confusing for first-time cloud users | First-time sign-in path goes Case B (no remote yet) — they'll never see the dialog on day one. The dialog only triggers on multi-device flows where the player already understands what cloud sync means. |
| Voice copy ages poorly / Glesga register lands wrong with non-UK players | Header copy is locale-aware via existing `t()` system; Scots/EN/future locales each get their own register-appropriate phrasing. |

## Implementation order (when unblocked)

1. Pure module + Vitest (in this branch — already shipping non-backend infra).
2. `CloudSaveConflictScene` Phaser scene (depends on Worker existing).
3. Settings → Saves on file UI.
4. Playwright e2e.
5. Voice review pass on copy with maintainer.
