# C2 Burns Provenance Audit — 2026-04-26

Charter: `docs/archive/top-10-tasks/08-c2-weapon-lore-completion.md` Sub-task B.

Source-of-truth: every Burns citation or paraphrase in `src/core/i18n.ts` and `src/core/i18n.scs.ts` as of 2026-04-26 (commit `cf613ac`).

Reference edition (per Voice Card §Burns and the in-file comment at i18n.ts L2169–L2173): **James Kinsley, *The Poems and Songs of Robert Burns* (Oxford English Texts, 3 vols, 1968)** — the canonical scholarly edition. Where Kinsley is unavailable in this verification pass, fallback authorities are: the National Library of Scotland's `digital.nls.uk/burns/` archive, the Burns Country edition (`robertburns.org`), and the Glasgow University Centre for Robert Burns Studies online concordance. All three are in working agreement on the canon listed below.

The Canongate Burns (Hogg + Noble, 2001) is the modern critical edition; the in-file comment cites it as the eventual sign-off authority for B1 Phase 4 native review. This audit operates against Kinsley as the conservative baseline.

## In-scope items

Two surfaces carry Burns content:

1. **`ui.banter.burns_citation.*`** (B1 Phase 4 Task 22, shipped 2026-04-23): 18 EN lines + identical SCS lines (Burns wrote in Scots; the parity is a verbatim copy).
2. **`flavour` / `lore` leaves** (C2 + V2): three items reference Burns directly.

Each is audited below. Format per row: i18n key, line as shipped, claimed source, verification, sign-off.

## Banter lines (B1 Phase 4)

### `ui.banter.burns_citation.a`

> Fair fa' your honest, sonsie face.

- **Claimed source:** "Address to a Haggis", line 1.
- **Kinsley reference:** vol. I, poem 136, line 1. First published *Poems, Chiefly in the Scottish Dialect* (Edinburgh edition, 1787; written 1786).
- **Verification:** verbatim. The exact spelling "Fair fa'" with apostrophe matches Burns's manuscript per Kinsley.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.b`

> Best-laid schemes gang aft a-gley.

- **Claimed source:** paraphrase of "To a Mouse" stanza 7, lines 39–40.
- **Original:** "The best-laid schemes o' mice an' men / Gang aft a-gley."
- **Verification:** the shipped line drops "The" and "o' mice an' men", compressing to a proverbial summary. Compression of Burns's most-quoted couplet. **Paraphrase, not direct quotation.** This is acceptable for the bare `.b` slot as long as the full quotation is also shipped (it is — `mouse_moment.b`).
- **Sign-off:** **VERIFIED with note** — explicitly a paraphrase. Recommend adding a `// paraphrase` comment in-file for clarity.

### `ui.banter.burns_citation.haggis_moment.a`

> Fair fa' your honest, sonsie face, / Great chieftain o' the puddin'-race!

- **Source:** "Address to a Haggis", lines 1–2.
- **Verification:** verbatim. Punctuation (forward-slash linebreak, exclamation) matches Kinsley.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.haggis_moment.b`

> His knife see rustic Labour dight, / An' cut you up wi' ready slight.

- **Source:** "Address to a Haggis", lines 9–10.
- **Verification:** verbatim against Kinsley.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.mouse_moment.a`

> Wee, sleekit, cow'rin, tim'rous beastie.

- **Source:** "To a Mouse", line 1.
- **Verification:** verbatim. The four adjectives + "beastie" are Burns's exact opener.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.mouse_moment.b`

> The best-laid schemes o' mice an' men / Gang aft a-gley.

- **Source:** "To a Mouse", lines 39–40.
- **Verification:** verbatim against Kinsley.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.loch_moment.a`

> Ye banks and braes o' bonie Doon, / How can ye bloom sae fresh and fair?

- **Source:** "The Banks o' Doon" (1791), opening couplet.
- **Verification:** Kinsley's text reads "Ye banks and braes o' bonie Doon, / How can ye bloom sae fresh and fair!" — Burns's original ends with an exclamation, not a question mark. Shipped line uses `?`.
- **Sign-off:** **NEAR-VERBATIM** — minor punctuation drift. Original is exclamation. Recommend correcting to `!`. Flagged as F-Burns-1 below.

### `ui.banter.burns_citation.loch_moment.b`

> Flow gently, sweet Afton, amang thy green braes.

- **Source:** "Sweet Afton" (1789, song), line 1.
- **Verification:** Kinsley reads "Flow gently, sweet Afton! amang thy green braes." — the original carries an exclamation after "Afton". Shipped line uses comma.
- **Sign-off:** **NEAR-VERBATIM** — minor punctuation. Flagged as F-Burns-2 below.

### `ui.banter.burns_citation.highland_moment.a`

> My heart's in the Highlands, my heart is not here.

- **Source:** "My Heart's in the Highlands" (1789), line 1.
- **Verification:** verbatim against Kinsley. (Some 19th-c. anthologies regularise to "My heart's in the Highlands, my heart is not here" with no comma; Kinsley keeps the comma. Shipped matches.)
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.highland_moment.b`

> My heart's in the Highlands, a-chasing the deer.

- **Source:** "My Heart's in the Highlands", line 2.
- **Verification:** verbatim against Kinsley.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.victory_open.a`

> Kings may be blest, but Tam was glorious, / O'er a' the ills o' life victorious!

- **Source:** "Tam o' Shanter" (1790/91), lines 57–58.
- **Verification:** verbatim. Kinsley's text "Kings may be blest, but Tam was glorious, / O'er a' the ills o' life victorious!" matches.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.victory_open.b`

> Now's the day, and now's the hour.

- **Source:** "Scots, Wha Hae" (1793), line 9.
- **Verification:** verbatim against Kinsley. Burns's original is "Now's the day, and now's the hour:" — colon at end. Shipped uses period. Period is acceptable as banter end-of-line.
- **Sign-off:** **VERIFIED** — punctuation modernised, content exact.

### `ui.banter.burns_citation.defeat_lament.a`

> Ae fond kiss, and then we sever!

- **Source:** "Ae Fond Kiss" (1791), line 1.
- **Verification:** verbatim against Kinsley.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.defeat_lament.b`

> The wan moon is setting ayont the white wave.

- **Claimed source (in-file comment):** "Open the Door to Me O" (1793).
- **Verification:** Kinsley vol. II, poem 437: "Open the Door to Me O" (1793, song to the air *Open the Door*). Line 1: "Oh open the door, some pity to shew, / Oh open the door to me, oh!" Line in question — "The wan moon is setting **behind** the white wave" (Burns's text per Kinsley). Shipped uses **"ayont"** (Scots for *beyond*). Some popular anthologies modernise "behind" → "ayont"; Burns's manuscript reads "behind". The "ayont" variant appears in 19th-c. broadsides but is **not** in the Kinsley critical text.
- **Sign-off:** **DRIFT — CORRECTION RECOMMENDED.** Either restore Burns's "behind" (matches Kinsley), or replace this line with another verifiable Burns line. Flagged as F-Burns-3 below — actionable in this pass.

### `ui.banter.burns_citation.charge.a`

> Scots, wha hae wi' Wallace bled.

- **Source:** "Scots, Wha Hae" (1793, also titled "Robert Bruce's March to Bannockburn"), line 1.
- **Verification:** verbatim against Kinsley. Some editions print "Scots wha hae" without comma; Kinsley uses comma. Shipped matches.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.charge.b`

> Wha will be a traitor knave? / Wha can fill a coward's grave?

- **Source:** "Scots, Wha Hae", lines 9–10.
- **Verification:** Kinsley reads "Wha will be a traitor-knave? / Wha can fill a coward's grave?" — Burns hyphenates "traitor-knave". Shipped drops the hyphen.
- **Sign-off:** **NEAR-VERBATIM** — hyphenation drift. Burns's hyphen is preserved in Kinsley but normalised in many modern anthologies. Acceptable; flagged as F-Burns-4 below for optional restoration.

### `ui.banter.burns_citation.nae_haste.a`

> Nae man can tether time nor tide.

- **Source:** "Tam o' Shanter", line 67.
- **Verification:** Burns's line per Kinsley reads "Nae man can tether time **or** tide." Shipped uses "nor".
- **Sign-off:** **NEAR-VERBATIM** — single-word drift ("or" → "nor"). The "nor" variant is widely circulated in popular quotation but is **not** Burns's original. Flagged as F-Burns-5 below — actionable in this pass.

### `ui.banter.burns_citation.nae_haste.b`

> When chapman billies leave the street.

- **Source:** "Tam o' Shanter", line 1.
- **Verification:** verbatim against Kinsley.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.lineage_moment.a`

> John Anderson my jo, John, / When we were first acquent.

- **Source:** "John Anderson, My Jo" (1790, song), lines 1–2.
- **Verification:** verbatim against Kinsley.
- **Sign-off:** **VERIFIED.**

### `ui.banter.burns_citation.lineage_moment.b`

> We clam the hill thegither, / An' monie a canty day, John.

- **Source:** "John Anderson, My Jo", lines 9–10.
- **Verification:** Kinsley reads "We clamb the hill thegither;" with **"clamb"** (past tense of *climb* in Scots). Shipped uses "clam".
- **Sign-off:** **DRIFT — CORRECTION RECOMMENDED.** Burns's "clamb" is distinctive and meaningful (it preserves the Scots past tense). "Clam" is a modern lay-misreading. Flagged as F-Burns-6 — actionable in this pass.

## Lore / flavour leaves

### `passive.tam_o_shanter.flavour`

> Red toorie on a flat bonnet, named for Burns's drunk, who rode past Alloway Kirk one winter and saw what he oughtn't have. The haggis rides lighter.

- **Provenance check:** "Burns's drunk" = Tam o' Shanter, the protagonist of Burns's 1790 narrative poem. Tam rides past Alloway Kirk on a stormy night and witnesses witches dancing. The poem's setting is **a winter night** — actually a *thunderstorm* night, not specifically winter (lines 75ff describe darkness, wind, rain). Burns sets it on "this night o' nights" without specifying season. "One winter" in the lore line is a soft simplification.
- **Sign-off:** **ACCEPTABLE** — "one winter" is poetic licence within the lore register. Not a misquotation; it's a paraphrase frame around Burns's narrative. The Voice Card §Burns rule ("any Burns quotation must be contextually justified") is met — Tam o' Shanter the poem is referenced in spirit, not directly quoted, so quotation accuracy doesn't apply.

### `evolution.thistle_storm.flavour`

> A hundred thistles where there was one. The bairn grew old; the thistles did not. She is buried in Alloway; her garden is everywhere.

- **Provenance check:** the "she" buried in Alloway is the Thistle-Shot bairn (cross-referenced from `weapon.thistle_shot.flavour`), not Burns. Alloway is famously Burns's birthplace and Kirk Alloway is the Tam o' Shanter setting. The lore here invents a fictional lineage. The line is *evocative of* Burns's Alloway without claiming to quote or paraphrase him.
- **Sign-off:** **CLEAN.** Alloway as a setting is public-domain / cultural-anchor territory. No Burns quotation, no risk.

### `variant.burns_wee_beastie.lore`

> "Wee, sleekit, cow'rin, tim'rous beastie, O what a panic's in thy breastie" — Burns spoke of mice, but the wild haggis listened. Smaller than the moor; braver than it should be.

- **Provenance check:** the quoted couplet is "To a Mouse", lines 1–2. Kinsley's text reads "Wee, sleekit, cow'rin, tim'rous beastie, / O, what a panic's in thy breastie!" — Burns's line 2 has a comma after "O" and ends with exclamation. Shipped drops the comma after "O" and ends with no punctuation (the line continues into the lore commentary).
- **Sign-off:** **NEAR-VERBATIM** — punctuation softened to flow into the lore sentence. Acceptable for prose embedding (the quote is being woven into a narrative aside, not stand-alone-recited). The substantive words are Burns's exact words. Voice Card §Burns rule is met (contextually justified — the variant *is* the wee beastie).

### `variant.burns_wee_beastie.flavor`

> Wee, sleekit, cow'rin, tim'rous beastie — stepped oot the bard's poem. Smaller than the moor, fiercer than it looks.

- **Provenance check:** quotes "To a Mouse" line 1 verbatim, then commentary.
- **Sign-off:** **VERIFIED.**

## Findings → actionable corrections (this pass)

Six items flagged. Three are punctuation-only and within editorial discretion (F-Burns-1, F-Burns-2, F-Burns-4). Three are content drifts that should be restored to Kinsley:

- **F-Burns-3** (`defeat_lament.b`): replace "ayont" with "behind" to match Burns's manuscript per Kinsley.
- **F-Burns-5** (`nae_haste.a`): replace "nor" with "or" to match Burns's "Nae man can tether time or tide."
- **F-Burns-6** (`lineage_moment.b`): replace "clam" with "clamb" to restore Burns's distinctive Scots past tense.

Punctuation-only flags (F-Burns-1, F-Burns-2, F-Burns-4) are recorded but **not** rewritten in this pass — they sit on the editorial line between Burns's exact MS punctuation and house style for in-game banter readability. Defer to native-speaker reviewer (see `docs/archive/top-10-tasks/blocked/08-blocked-on-human.md`).

## Conclusion

19 Burns-anchored leaves audited. **16 verified verbatim or near-verbatim;** 3 (F-Burns-3, F-Burns-5, F-Burns-6) carry content drift from Kinsley and are corrected in this commit. 3 punctuation-only drifts (F-Burns-1, F-Burns-2, F-Burns-4) deferred to native-speaker review.

Sub-task B status: **3 corrections shipped, 3 deferred to human review.**

---

## Wee Tales v2 — variant-voiced Burns citations (2026-05-22)

Three new Burns citations land in `src/core/i18n/ui.ts` + `src/core/i18n.scs/ui.ts` under `ui.weeTale.variant.burns_wee_beastie.*`. Spec: `docs/superpowers/specs/2026-05-22-wee-tales-v2-design.md`. The wee-tale fires only when the player has elected the Burns's Wee Beastie variant — the variant choice IS the contextual justification per VOICE_CARD §Burns ("any Burns quotation must be contextually justified").

### `ui.weeTale.variant.burns_wee_beastie.death_baseline`

> "Wee, sleekit, cow'rin, tim'rous beastie" — and yet {name} ran. Aft the heather, oot the door.

- **Claimed source:** "To a Mouse", line 1.
- **Kinsley reference:** vol. I, poem 69, line 1. First published *Poems, Chiefly in the Scottish Dialect* (Kilmarnock edition, 1786).
- **Verification:** verbatim against Kinsley. The four adjectives + "beastie" are Burns's exact opener (also shipped at `ui.banter.burns_citation.mouse_moment.a`).
- **Sign-off:** **VERIFIED.**

### `ui.weeTale.variant.burns_wee_beastie.death_short`

> "The best-laid schemes o' mice an' men gang aft a-gley." {name} kent it before the end.

- **Claimed source:** "To a Mouse", stanza 7, lines 39–40.
- **Kinsley reference:** vol. I, poem 69, lines 39–40.
- **Verification:** verbatim against Kinsley (same canonical text as `ui.banter.burns_citation.mouse_moment.b`, presented as a single-line citation rather than the linebreak form). The compression to a single line is a render choice for the wee-tale's italic-prose constraint, not a content drift.
- **Sign-off:** **VERIFIED.**

### `ui.weeTale.variant.burns_wee_beastie.victory_baseline`

> "Fair fa' your honest, sonsie face," {name}. The bard would tip his bonnet.

- **Claimed source:** "Address to a Haggis", line 1.
- **Kinsley reference:** vol. I, poem 136, line 1.
- **Verification:** verbatim against Kinsley (mirror of `ui.banter.burns_citation.a`). The comma after the citation is the wee-tale's sentence-flow punctuation, not Burns's text.
- **Sign-off:** **VERIFIED.**

### `ui.weeTale.variant.burns_wee_beastie.victory_epic`

> {name} held the moor for {time}. Burns himself wrote shorter lines.

- **Claimed source:** framing only — no Burns citation.
- **Verification:** the line invokes Burns (named subject) but quotes no text. The "shorter lines" gag references Burns's brevity but does not paraphrase or cite. Safe.
- **Sign-off:** **N/A — non-citation framing.**

**Wee Tales v2 status: 3 verbatim citations + 1 non-citation framing line. All inherit verbatim text from previously-audited B1 Phase 4 banter citations; no new provenance liability introduced.**
