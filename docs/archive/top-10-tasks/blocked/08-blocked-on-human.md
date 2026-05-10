# Prompt #8 (C2 Lore Completion) — Blocked on Human Reviewers

Charter: `docs/top-10-tasks/08-c2-weapon-lore-completion.md`.

The autonomous pass on 2026-04-26 (commit chain on branch `worktree-agent-ac94e5d40000208a5`) closed Sub-tasks A, B (partial), D, E. Sub-task C is **fully gated on human native-speaker review**. This file lists every reviewer-ask in one place.

## Reviewer asks

### 1. Doric (Northeast Scotland) native review

- **Source list:** `docs/C2_DIALECT_REVIEW.md` Doric section.
- **Scope:** 4 primary lore leaves + ~5 secondary banter samples.
- **Reviewer profile:** native Doric speaker, Aberdeenshire/Banffshire/Moray. Channel: University of Aberdeen Elphinstone Institute, Doric Books CIC, or a published Doric author (Sheena Blackhall is the gold standard).
- **Estimated time:** 1.5h.
- **Output:** verdict per line + any rewrite suggestions, returned as edits to `docs/C2_DIALECT_REVIEW.md` and a sign-off entry in `docs/C2_LORE_REVIEW.md`.
- **Action on receipt:** C2 owner applies edits in a follow-up commit, runs `npm run ci`, captures Soul Check + Voice Card pass.

### 2. Shetlandic (Northern Isles) native review

- **Source list:** `docs/C2_DIALECT_REVIEW.md` Shetlandic section.
- **Scope:** 5 primary lore leaves + ~4 secondary banter samples.
- **Reviewer profile:** native Shetland Scots speaker. Channels: Shetland ForWirds, Shetland Library local-history outreach, or a Shetland-resident author (Jen Hadfield, Christine De Luca, Robert Alan Jamieson).
- **Estimated time:** 1.5h.
- **Output:** as above.
- **Action on receipt:** as above.

### 3. Burns provenance — punctuation-only deferred items

Three Burns banter lines have minor punctuation drift from the Kinsley critical edition. Three substantive content drifts have already been corrected in this pass; these three remain at the editorial discretion of a Burns specialist reviewer:

- **F-Burns-1** `ui.banter.burns_citation.loch_moment.a` — Burns ends "How can ye bloom sae fresh and fair" with `!`; shipped uses `?`.
- **F-Burns-2** `ui.banter.burns_citation.loch_moment.b` — Burns punctuates "Flow gently, sweet Afton! amang thy green braes."; shipped uses comma.
- **F-Burns-4** `ui.banter.burns_citation.charge.b` — Burns hyphenates "traitor-knave"; shipped drops hyphen.

- **Source list:** `docs/C2_BURNS_PROVENANCE.md`.
- **Reviewer profile:** Burns specialist or Burns-night recitation expert. Channels: Burns Canongate (Hogg + Noble eds.), Glasgow University Centre for Robert Burns Studies, a Burns Heritage Park Alloway curator. The B1 Phase 4 review channel is the same one — co-ordinate.
- **Estimated time:** 30 minutes.
- **Output:** punctuation-restore decision per line.
- **Action on receipt:** if reviewer says "restore Burns's MS punctuation", apply 3-line edit in same commit pattern as F-Burns-3/5/6 (already shipped).

### 4. Voice Card "Lore" register documentation

The C2 voice audit (`docs/C2_VOICE_AUDIT.md`) treats the existing 103 leaves as the de-facto Lore register definition. The Voice Card itself does not yet name a "Lore" voice. Once C2 fully ships (post-native-review), the Voice Card author should add a Lore section that codifies what this audit found:

- Third-person omniscient, present-or-historic-present.
- 2–3 sentence prose, dense, Dark-Souls cadence.
- Cross-references at least one other item where natural.
- Sits between Hearth and Grave on the tonal spectrum (Hearth-warmth tolerated on Common-tier relics; Grave-cold tolerated on Culloden / Highland Clearance lore).
- Avoids: literary Highland prose ("Outlander register"); explicit second-person; banter creep above the relic-Common authorised line.

This is **NOT a blocker for shipping C2** — it's a Voice Card maintenance follow-up. Owner: docs maintainer. Estimated 30 minutes.

## Tracking

When a reviewer signs off any of items 1–4, append a row to `docs/C2_LORE_REVIEW.md` (charter Acceptance Criteria). Until all 4 sign-offs land, this `blocked/` file remains in place and the C2 charter remains formally open.
