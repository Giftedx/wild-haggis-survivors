# Cultural Review Packet - Release Gate

Updated: 2026-04-26  
Machine-readable status: `docs/status/cultural/CULTURAL_REVIEW_STATUS.json`  
CI guard: `src/data/culturalReviewStatus.test.ts`

## Contents

1. [Purpose](#purpose) — what this doc gates and why
2. [Release Rule](#release-rule) — how a gate moves from blocked to shippable
3. [Gate Summary](#gate-summary) — at-a-glance status table
4. [What Can Ship Today](#what-can-ship-today) — internal vs public release
5. [Reviewer Instructions](#reviewer-instructions) — verdict vocabulary + workflow
6. [Gate Details](#gate-details) — Doric, Shetlandic, Burns, Gaelic/Cailleach asks
7. [Status Update Template](#status-update-template) — exact JSON to paste in
8. [What the CI Guard Enforces](#what-the-ci-guard-enforces) — promotion checklist for the agent applying edits

## Purpose

This is the single reviewer-facing entry point for cultural release gates. It consolidates the open Doric, Shetlandic, Gaelic/Cailleach, and Burns/Canongate review work from:

- `docs/C2_DIALECT_REVIEW.md`
- `docs/C2_BURNS_PROVENANCE.md`
- `docs/C2_VOICE_AUDIT.md`
- `docs/archive/BANTER_GAPS.md`
- `docs/archive/superpowers/plans/2026-04-24-v2-variants-followups.md`
- `docs/archive/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` T211
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md`
- `docs/research/SCOTTISH_RESEARCH.md`
- `docs/research/SCOTTISH_RESEARCH_DEEP.md`

The JSON file is the line manifest. It lists every current i18n key in each gate and is checked against the live EN and SCS locale trees by Vitest. Reviewers can use those keys to locate exact text in `src/core/i18n.ts` and `src/core/i18n.scs.ts`; contributors must update the JSON whenever gated copy changes.

The CI guard at `src/data/culturalReviewStatus.test.ts` enforces three guarantees:

1. **Drift fence** — any culturally-sensitive line in the live EN tree (variant.\*, ui.banter.\* under reviewed sub-pools, seasonalEvent.\*) must be filed in the manifest under the correct gate. A new Doric banter line that doesn't appear in the manifest fails CI.
2. **Ownership fence** — every `lineKey` must match the regex pattern owned by the gate it lives under. A Burns line filed under `doric_quinie_dialect` fails CI.
3. **Evidence fence** — `releaseDecision: ship_release` requires `status: approved` AND a non-empty `reviewEvidence` record with reviewerRole, ISO date, evidenceRef, and outcome. Marking `status: approved` without evidence also fails (catches the half-flip case).

## Release Rule

No public release should mark any gate as ready while `releaseDecision` is `blocked_until_review`.

To unblock a gate:

1. Get the required human review. Do not invent or infer approval.
2. Apply any requested copy edits in a follow-up change.
3. Add review evidence to `docs/status/cultural/CULTURAL_REVIEW_STATUS.json` with reviewer role, date, and evidence reference.
4. Change `status` to `approved` and only then change `releaseDecision` to `ship_release`.
5. Run `npm test` and `npm run build`.

The CI guard fails if a gate is changed to `ship_release` without `status: approved` and review evidence.

## Gate Summary

| Gate | Status | Release decision | Reviewer |
|---|---|---|---|
| Doric Quinie dialect | Needs human review | Blocked until review | Native Doric / Northeast Scots speaker |
| Peerie Shetlander dialect | Needs human review | Blocked until review | Native Shetland Scots / Shetlandic speaker |
| Burns / Canongate editorial | Kinsley checked; Canongate/editorial pending | Blocked until review | Burns-literate Scots literary editor or scholar |
| Gaelic fragments and Cailleach sensitivity | Needs human review | Blocked until review | Native Gaelic speaker plus Scottish folklore/sensitivity reviewer |

## What Can Ship Today

Internal QA and normal development builds can continue with the current content, because this pass does not change runtime behavior.

For public or commercial release, all four gates are still blocked unless the affected surfaces are hidden or disabled in a separate product decision. Content outside the JSON manifest is not newly blocked by this packet.

## Reviewer Instructions

Use verdicts consistently:

- `VERIFIED` - line can ship as written.
- `MINOR_EDIT_SUGGESTED` - reviewer suggests a small wording, spelling, punctuation, or orthography change.
- `REWRITE` - line is off-register or inaccurate enough that it needs replacement.
- `FLAG_CULTURAL_ISSUE` - line raises a sensitivity, dignity, or community-representation concern.

For each flagged line, return the i18n key, verdict, and suggested replacement or rationale. Keep suggested replacements scoped to the same surface; do not broaden into unrelated copy rewrites.

## Gate Details

### Doric Quinie

Manifest gate: `doric_quinie_dialect`

Scope:

- `variant.doric_quinie.*`
- Doric-tagged variant banter in `low_hp`, `level_up`, `first_blood`, `kill_streak`, `recover`, and `idle`
- `ui.banter.first_time.variant_doric_quinie_unlocked.*`

Ask:

- Confirm `Quinie` vs `Quine` for a warm playable-variant name.
- Confirm `fit like`, `min`, `thon`, `quate`, `haar`, `Aiberdeen`, and fishing-family metaphors.
- Confirm the SCS overlay does not read as generic Glasgow Scots with Doric words sprinkled on top.

### Peerie Shetlander

Manifest gate: `peerie_shetlander_dialect`

Scope:

- `variant.peerie_shetlander.*`
- Shetlandic-tagged variant banter in `low_hp`, `level_up`, `first_blood`, `kill_streak`, `recover`, and `idle`
- `ui.banter.first_time.variant_peerie_shetlander_unlocked.*`

Ask:

- Confirm `peerie`, `du`, `voe`, `skerry`, `mirry`, and maritime phrasing.
- Confirm the Norn/Shetland Scots framing is respectful and not overclaimed.
- Confirm SCS lines avoid flattening Shetlandic into mainland Scots.

### Burns / Canongate

Manifest gate: `burns_canongate_editorial`

Scope:

- `ui.banter.burns_citation.*`
- Burns's Wee Beastie variant lore and variant-tagged banter
- Burns Night seasonal-event banter and event UI
- `variant.unlock.burns_night_full_evo`

Ask:

- Verify direct quotations and paraphrases against The Canongate Burns.
- Confirm the Kinsley-based corrections in `docs/C2_BURNS_PROVENANCE.md` remain acceptable.
- Confirm punctuation/editorial drift decisions.
- Confirm Burns is contextually justified and not used as decorative prestige.

Known deferred items from `docs/C2_BURNS_PROVENANCE.md`:

- `ui.banter.burns_citation.loch_moment.a` - punctuation drift from original exclamation.
- `ui.banter.burns_citation.loch_moment.b` - punctuation drift after "Afton".
- `ui.banter.burns_citation.charge.b` - optional restoration of "traitor-knave".

### Gaelic / Cailleach

Manifest gate: `gaelic_cailleach_sensitivity`

Scope:

- Cailleach variant lore and variant-tagged banter
- `ui.banter.cailleach_whisper.*`
- Samhain and Beltane seasonal-event banter and event UI

Ask:

- Confirm every Gaelic fragment and its surrounding English/Scots context.
- Confirm the Cailleach reads as stern, motherly, ancient, and not villainous or generic witch-coded.
- Confirm Samhain and Beltane treatment is respectful and avoids turning living or revived traditions into spooky decoration.

Gaelic fragments specifically flagged in source comments:

- `a chiall`
- `mo nighean`
- `is fada an oidhche`
- `tog ort`
- `cha mhór`
- `a ghaoil`
- `gabh air do shocair`
- `sgrìobhte sa chloich`

## Status Update Template

Two sequential changes promote a gate from blocked to shippable. Both must land in the same commit (or the CI guard at `src/data/culturalReviewStatus.test.ts` will fail):

**Step 1.** Append a `reviewEvidence` record into the relevant gate's `reviewEvidence` array in `docs/status/cultural/CULTURAL_REVIEW_STATUS.json`:

```json
{
  "reviewerRole": "Native Doric speaker, Aberdeenshire fishing community",
  "reviewerScope": "doric_quinie_dialect",
  "date": "2026-MM-DD",
  "evidenceRef": "private-review-note path or PR link or issue ref",
  "outcome": "VERIFIED" 
}
```

Field rules:

- `reviewerRole` — describe the reviewer's qualification, not their personal name unless they have explicitly consented to credit. CI requires non-empty.
- `reviewerScope` — must equal the gate's `id` (e.g. `doric_quinie_dialect`). The CI guard pins this to prevent evidence drift across gates.
- `date` — ISO `YYYY-MM-DD`, the day review was completed. CI fails on free-text dates.
- `evidenceRef` — pointer to the audit trail. Acceptable: a `docs/status/cultural/REVIEWS/` private note path, a private GitHub issue link, or a commit hash that recorded the review. CI requires non-empty.
- `outcome` — terse verdict summary: `VERIFIED`, `MINOR_EDIT_SUGGESTED—applied`, `REWRITE—applied`, or `FLAG_CULTURAL_ISSUE—escalated`.

**Step 2.** Once the evidence row is in place, change the gate's `status` from `needs_human_review` (or `partially_verified_needs_editorial_review`) to `approved`, and `releaseDecision` from `blocked_until_review` to `ship_release`. Both edits in one commit.

**Step 3.** Run the verification gate locally before pushing:

```bash
npm test -- src/data/culturalReviewStatus.test.ts
npm run build
```

The targeted test runs in under a second and tells you exactly which guard would fail. Don't push if it doesn't pass.

Do not add reviewer personal names unless the reviewer has agreed to be credited.

## What the CI Guard Enforces

`src/data/culturalReviewStatus.test.ts` runs on every PR via `npm run ci`. It will block merge if:

| Failure mode | What the test catches | Fix |
|---|---|---|
| Drift | A new Doric/Shetlandic/Burns/Cailleach line appears in `src/core/i18n.ts` but not in the manifest | Add the lineKey to the matching gate's `lineKeys` array. Don't unblock the gate. |
| Misfile | A lineKey is filed in the wrong gate (Burns line under Doric, etc.) | Move it to the gate whose regex pattern it matches. |
| Half-flip | `status` set to `approved` without `reviewEvidence` populated | Either record evidence, or revert `status` to its prior value. |
| Premature ship | `releaseDecision: ship_release` without `status: approved` AND non-empty evidence | Don't try. Get the review first. |
| Stale source doc | A `sourceDocs` path no longer exists on disk | Update the path or remove the broken reference. |
| Duplicate ownership | A lineKey appears under two gates | Pick exactly one gate. |
| SCS missing | A manifest key resolves in EN but not SCS | Add the SCS overlay before adding the key to the manifest. |
| Banter not wired | A `ui.banter.*` manifest key isn't in `BANTER_KEYS` | Add the pool entry in `src/data/banter.ts` or remove the manifest entry. |

Each failure includes the offending key in its assertion message so the agent applying edits sees the exact fix in the test output.

