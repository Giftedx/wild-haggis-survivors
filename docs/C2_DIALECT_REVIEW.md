# C2 Doric & Shetlandic Native-Speaker Review — 2026-04-26

Charter: `docs/archive/top-10-tasks/08-c2-weapon-lore-completion.md` Sub-task C.

This doc identifies every shipped lore / flavour / banter line written in **Doric** (Northeast Scotland — Aberdeenshire) or **Shetlandic / Norn-influenced Shetland Scots**, and presents them for native-speaker review.

Per `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` §3.3 (Northern Isles) and §4.3 (regional dialect representation), regional dialects deserve native review before commercial release. The V2 Variants pass (memory: `project_v2_variants_status.md`) flagged the same gates open; this doc consolidates the C2 candidates with V2's pending list so a single reviewer pass covers both.

## Reviewer profile sought

- **Doric:** A native Doric speaker from Aberdeenshire / Banffshire / Moray, ideally a fishing-community background. Bonus: published in Doric (Sheena Blackhall, Jackie Kay's *The Adoption Papers* preface, or comparable). University of Aberdeen's Elphinstone Institute is a referral channel.
- **Shetlandic:** A native Shetland Scots speaker. Reference: Shetland ForWirds (the Shetland dialect organisation), or a Shetland-resident author (Jen Hadfield, Robert Alan Jamieson, Christine De Luca). Norn fragments are extinct — modern Shetland Scots carries Norn-derived vocabulary, which is what we use.

## Candidate lines — Doric (Northeast / Aberdeenshire)

The shipped Doric content has two surfaces: variant lore (2 leaves) and `doric_quinie` banter (multiple sub-pools). Lore is the C2 audit scope; banter is included for context since the same reviewer covers both.

### Variant lore (C2 / V2 — primary review target)

| Key | Line as shipped | Reviewer ask |
|---|---|---|
| `variant.doric_quinie.name` (EN) | "Doric Quinie" | Confirm "Quinie" (girl/young woman) is the natural register here vs "Quine" (cf. Voice Card §Vocabulary which lists both). The diminutive "-ie" reads as warm; flag if Northeast speakers find it patronising. |
| `variant.doric_quinie.flavor` (EN) | "Nor'-east fisher-family wee beastie. Granite constitution, quick een, a heid for the haar. Fit like, min?" | Confirm "wee" is acceptable Doric (Doric tends to *wee* less than Glasgow Scots; cf. *peerie* in Shetland, *peedie* in Orkney — Northeast keeps *wee* but uses it less). Confirm "Fit like, min?" is well-formed (literally "What like, [my] man" — common greeting). |
| `variant.doric_quinie.lore` (EN) | "Fae the nor'-east, whaur the land drops tae the sea an the sea disnae forgive. Granite constitution, an een for the haar rollin aff Aiberdeen. Fit like, min?" | Same checks as `flavor`. Plus: "haar rollin aff Aiberdeen" — confirm "aff" (off) reads naturally vs "fae" (from). |
| `variant.doric_quinie.flavor` (SCS) | "Fae tha nor'-east, whaur tha land draps tae tha sea an tha sea disnae forgive. Granite constitution, an een for tha haar rollin aff Aiberdeen. Fit like, min?" | Confirm SCS pair reads as a *Doric speaker writing in Scots*, not a Glasgow speaker mimicking Doric. Specifically: is "tha" the right article (Doric prefers *the*; *tha* is more universal Scots / Glasgow). Reviewer to flag for orthography correction if needed. |
| `variant.doric_quinie.lore` (SCS) | (matches EN; see above) | As above. |

### Doric banter pool (V2 / B1 — secondary review)

These ship under `ui.banter.*.doric_quinie.*`. Reviewer is asked to flag any of these as off-register; they are NOT in C2 scope but consolidating saves a reviewer-pass.

| Sub-pool | Sample line | Reviewer ask |
|---|---|---|
| `low_hp.doric_quinie.c` | "Doon tae the bone, quinie. Grit teeth." | Idiom check. Is "doon tae the bone" the natural Doric form, or would a native render this "doon tae the marra" or similar? |
| `pickup.doric_quinie.c` | "That's thon settled, quinie." | "Thon" (that yonder) — confirm Doric usage; *thon* is widespread in Northeast Scots but reviewer should flag if it sounds off-register for a young woman speaker. |
| `kill.doric_quinie.d` | "Fishin's fine the day, quinie." | The fishing metaphor is variant-on-theme; reviewer asked whether real Doric speakers from fishing villages would say this or find it tourist-coded. |
| `level_up.doric_quinie.b` | (line at L1294 — see file) | Sense check. |
| `boss_warn.doric_quinie.a` | (line at L1538) | Sense check. |

## Candidate lines — Shetlandic (Northern Isles)

### Variant lore (C2 / V2 — primary review target)

| Key | Line as shipped | Reviewer ask |
|---|---|---|
| `variant.peerie_shetlander.name` (EN) | "Peerie Shetlander" | Confirm "peerie" (small/wee) is the natural Shetland word; *peedie* is Orcadian, distinct. |
| `variant.peerie_shetlander.flavor` (EN) | "Fae the northern isles — Norn-tinged, peerie, sea-footed. The voe remembers ye, du. The wind's already up." | Confirm: (a) "voe" (a long narrow inlet) is correct Shetland-English, not Norwegian-English. (b) "du" (you, sing.) is correct Shetlandic intimate-pronoun usage. (c) "Norn-tinged" — confirm modern Shetlanders accept this phrasing about their own dialect (Norn is extinct; Shetland Scots is descendant + influenced). Some Shetlanders prefer "Shetland Scots" without the Norn framing; reviewer to flag if needed. |
| `variant.peerie_shetlander.lore` (EN) | "Fae the northern isles, whaur Norn is still whispered in bairns' names. Peerie — wee — but wind-tempered. The voe minds ye; du'll mind it back." | Same checks as `flavor`. Plus: "Norn is still whispered in bairns' names" — *bairns* is Universal Scots; Shetland uses *bairns* freely so this reads natural. Confirm. |
| `variant.peerie_shetlander.flavor` (SCS) | (close paraphrase of EN) | Confirm SCS pair reads as a Shetlander writing in Shetland Scots, not Glaswegian mimicking Shetland. Specifically the orthography of "tha" (article) — Shetland uses *da* for *the* in some registers. Reviewer to advise. |
| `variant.peerie_shetlander.lore` (SCS) | (close paraphrase of EN) | As above. |

### Shetlandic banter pool (V2 / B1 — secondary review)

| Sub-pool | Sample line | Reviewer ask |
|---|---|---|
| `low_hp.peerie_shetlander.a` | "Peerie step noo, du. Wind's up." | Idiom check. |
| `kill.peerie_shetlander.b` | "Caught aff the lee side. Peerie quick." | "Lee side" is sailing/Shetland natural. Confirm. |
| `pickup.peerie_shetlander.b` | "Peerie blades, mony o them." | Sense check. |
| `level_up.peerie_shetlander.b` | "Peerie gains stack. Aye, mirry." | "Mirry" — Shetlandic for *merry*. Confirm. |

## What is NOT in this review

- **Glasgow / Universal Scots flavour leaves** — covered by W18 Phase B Scots overlay shipped 2026-04-18; do not need Northeast/Shetland review.
- **Cailleach (Gaelic-inflected) banter** — separate review, gated on `project_b1_phase1_status` Phase 4 Gaelic review.
- **Burns citations** — separate review (`docs/C2_BURNS_PROVENANCE.md` Sub-task B); Burns wrote in Lallans + Ayrshire Scots, not Doric or Shetlandic.

## Process

1. Reviewer reads each row.
2. For each line, verdict: **VERIFIED / MINOR-EDIT-SUGGESTED / REWRITE / FLAG-CULTURAL-ISSUE**.
3. Suggested edits returned as inline diff or rewrite.
4. C2 owner applies edits in a follow-up commit; review sign-off recorded in `docs/C2_LORE_REVIEW.md` (per charter Acceptance Criteria).

## Status

**HUMAN-GATED.** Tracked in `docs/archive/top-10-tasks/blocked/08-blocked-on-human.md`.

This audit lists 9 primary-target lines (Doric: 4, Shetlandic: 5) plus an estimated 20+ banter pool lines pulled in for one-pass reviewer convenience. Estimated reviewer time: 1.5h per dialect.

Sub-task C status: **CANDIDATES IDENTIFIED, BLOCKED ON HUMAN REVIEWERS.**
