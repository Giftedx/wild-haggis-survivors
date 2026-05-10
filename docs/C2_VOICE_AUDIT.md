# C2 Voice Consistency Audit — 2026-04-26

Charter: `docs/archive/top-10-tasks/08-c2-weapon-lore-completion.md` Sub-task A.

Reviewer: Agent 8 (autonomous, single-writer pass).

Source: every shipped `flavour` leaf in `src/core/i18n.ts` and `src/core/i18n.scs.ts` as of 2026-04-26 (commit `cf613ac`).

## Voice register (Lore tier)

`docs/VOICE_CARD.md` does not yet name an explicit "Lore" register. The C2 design spec (2026-04-23) specifies *Grave-leaning Hearth* — historic tone, gentle warmth, occasional dry remark. Implication > exposition (Dark Souls / Hollow Knight per `NARRATIVE_RESEARCH.md` §3.3). 1–4 sentence dense prose with at least one of: name, place, or event. Cross-references to other items where natural.

The Voice Card *will* gain a "Lore voice" anchor once C2 ships in full; this audit treats the existing 89 leaves as the de-facto register definition. Anything that drifts from it gets flagged.

## Inventory

| Scope | EN leaves | SCS leaves | EN→SCS parity |
|---|---|---|---|
| `weapon.*.flavour` | 8 | 8 | green |
| `evolution.*.flavour` | 7 | 7 | green |
| `passive.*.flavour` | 9 | 9 | green |
| `permanentUpgrade.*.flavour` | 17 | 17 | green |
| `variant.*.lore` | 14 | 14 (lore key, separate from `flavor`) | green via `flavour.test.ts` |
| `relics.*.flavour` | 18 | 18 | green |
| `runes.*.flavour` | 30 | 0 | **GAP — EN-only by spec comment** |
| **Total** | **103** | **73** | 30-leaf delta (runes) |

The `103` count expands the memory's `55 items lored` figure (memory snapshot was M3-era; M4 + M4.5 + relic ship + rune ship landed 2026-04-24/25 and pushed coverage). Memory is updated in this pass.

## Voice register checks (single-writer consistency)

### Pass 1 — POV / tense

The lore register established by the M1 weapon set uses **third-person omniscient, present-or-historic-present**. Commits drift around this. Findings:

1. `weapon.thistle_shot.flavour` — past + present mix ("First thrown… reasoned… remembers her"). On-register; this is the original Dark-Souls-ified seed example from `NARRATIVE_RESEARCH.md` §3.3. Keep as-is.
2. `permanentUpgrade.dirk_hand.flavour` — "The dirk was worn inside the sleeve. The hand learned where to find it. So did every weapon since." Three-clause cadence is the lore signature. Keep.
3. `permanentUpgrade.weapon_training.flavour` — "The first thistle fires cleaner than it used to. Not from practice — from the ones fired before, remembering." Cross-references `weapon.thistle_shot`. Strong. Keep.
4. `relics.oatcake_stash.flavour` — "One for each knee. Never knew when ye'd need 'em." Drops to **second person colloquial** ("ye'd"). Drift toward Hearth-banter register. **Borderline — lore register accepts the chatty close on Common-tier relics per the relic comment block.** Flag noted; keep, but watch for further banter creep.
5. `relics.whisky_dram.flavour` — "A wee sip for the road. Don't let Gran see." Same pattern; on-register for Common tier (warm, domestic).
6. `relics.damp_tinder.flavour` — "Won't burn for anything. Not for want of trying." Same. Common tier domestic.
7. `relics.bronze_clasp.flavour` — "A brooch once pinned a plaid at Bannockburn. The plaid is gone." Two-sentence Dark-Souls cadence. Strong.
8. `relics.bodhran_skin.flavour` — "Tight as bone. Hum it to test the tuning." Imperative second person. Borderline; lore register tolerates one bare imperative on Uncommon items. Keep.

**Verdict:** voice is consistent across 100/103 leaves. Three borderline cases (`oatcake_stash`, `whisky_dram`, `damp_tinder`) sit on the warm-domestic line that the relic comment block explicitly authorises for Common tier — not drift, deliberate.

### Pass 2 — length

Lore lines run 2–3 sentences (charter target). Histogram of word counts:

- 8–15 words: 18 leaves (mostly Common-tier relics + 4 runes)
- 16–25 words: 41 leaves (the bulk; matches charter target)
- 26–40 words: 36 leaves (weapons, evolutions, variant `lore`)
- 41+ words: 8 leaves (variant `lore` blocks for Cailleach, Burns Wee Beastie, Doric Quinie, Peerie Shetlander, Glaswegian, Iron Belly, Surefoot, Anticlockwise)

**Outliers:** none above 60 words. The variant `lore` leaves are intentionally longer (per V2 spec — variant unlock screens carry the most lore weight). No rewrite required.

### Pass 3 — cross-reference web

Charter requires cross-references. Audit of explicit cross-links:

- `weapon.thistle_shot` ↔ `passive.thistle_crown` ("woven by the bairn who invented the Thistle Shot") — explicit, two-way, strong.
- `weapon.claymore` ↔ `evolution.william_blade` — both reference Wallace, Falkirk. Reinforced.
- `passive.tam_o_shanter` ↔ Burns / Alloway — Burns provenance audited separately (see `C2_BURNS_PROVENANCE.md`).
- `permanentUpgrade.dirk_hand` → `permanentUpgrade.weapon_training` (chain: dirk → first thistle remembers) — implied via "every weapon since" / "ones fired before, remembering". Strong.
- `relics.lucky_heather_sprig` ↔ `permanentUpgrade.lucky_heather` — both name the 1820 shepherd. Explicit, two-way.
- `relics.cairn_stone` → `runes.cairn_rune` — both name walker's cairn / standing stone. Implicit but coherent.
- `relics.fingals_horn` — Staffa, eight centuries silent. **Orphan** — no other item references Fingal. Acceptable (Fingal's Cave is a real-world public-domain anchor, doesn't need a partner).
- `relics.stone_of_destiny_shard` — "splinter the size of a thumbnail. Nobody noticed it missing." **Orphan.** Acceptable (stand-alone wink at the 1950 Stone theft).
- `runes.kirkyard_rune` → "after the bell" — implicitly references W2 post-Taxman state, which Almanac glossary defines.
- `runes.lairds_rune` → `variant.laird` — both name "lairds". Implicit.
- `evolution.thistle_storm.flavour` — "She is buried in Alloway; her garden is everywhere." — references the Thistle Shot bairn. Strong cross-link.

**Cross-reference gaps to keep an eye on (no rewrite required, just note):**

- `relics.midgie_repellent.flavour` — "Formula lost. The bottle refills on its own between runs." Solo, no link. Could later cross-reference an enemy (`midge_swarm`).
- `runes.frost_rune.flavour` — "Tight, angular. The kind a hand makes when the hand is shaking." No place anchor; reads more *Hollow Knight* (mood-only) than Dark Souls. Defer to next pass.
- `runes.haar_rune.flavour` — "A fisherman's mark, carved the night his boat came home empty." Strong solo. No partner.

### Pass 4 — anti-pattern sweep (per `CULTURAL_SENSITIVITIES_RESEARCH.md` §5)

- **Buckfast / Irn-Bru trademark genericisation.** `passive.irn_bru.flavour` names "Cumbernauld's contribution to the canon. 1901." Cumbernauld + 1901 + "the recipe is secret; the caffeine is real" — this is Irn-Bru by name. Per §5.2, A.G. Barr protects the Irn-Bru trademark aggressively in commercial contexts. **Flagged for legal review at commercial release;** does not block this audit (in-game name use elsewhere already shipped).
- **Buckfast** — no flavour leaf references Buckfast directly. `buckfast_ned` enemy is shipped per memory; no lore key needs rewrite.
- **Sectarianism** — no flavour line references Celtic/Rangers, Protestant/Catholic conflict, or sectarian-coded colour. Clean.
- **Highland Clearances** — no flavour line names the Clearances directly. Closest: `passive.kilt.flavour` ("the great kilt, the feileadh mòr — eighteen feet of wool, belted at the waist…") — historical-neutral. Clean.
- **Culloden** — `passive.highland_shield.flavour` ("The targe at Culloden. It saved some and not others.") — handles the trauma per §2.3 (acknowledge, don't romanticise; "saved some and not others" carries the loss). On-register.
- `runes.storm_rune.flavour` — "Cut on a post after Culloden. The post was struck by lightning three winters running." Acknowledges Culloden as backdrop; lightning detail is invented but historically-anchored. On-register per §2.3 (Jacobite memory is fair territory if not romanticised).
- **Living-person likeness.** Burns is dead (1796) — public domain, no risk. No flavour line names Limmy, Janey Godley, or other living figures. Clean.
- **Outlander prose drift** — Voice Card §Anti-Patterns warns against "literary Highland" ("dry bracken", "by the ancient stones I remember"). Closest borderline: `permanentUpgrade.natural_recovery.flavour` — "The peat closes over a wound the way it closes over a bog-body: slowly, and without comment." Mythic + dry remark = on-register. Not Outlander prose. Clean.
- **"Och aye"** — zero hits. Clean.

### Pass 5 — Hearth/Edge banter creep

Lore lines should sit *between* Hearth and Grave (Voice Card spectrum). They are not banter. Banter creep flags:

- `permanentUpgrade.double_dash.flavour` — "Two breaths between, instead of one. The second one is for Gran." Mentions Gran (warm). Borderline-Hearth, but the cadence ("instead of one. The second one is for Gran.") is lore not banter. Keep.
- `relics.whisky_dram.flavour` — "A wee sip for the road. Don't let Gran see." Tilts most toward Hearth banter. Common-tier relic comment authorises. Keep.

**Verdict on creep:** none above the relic-comment authorised threshold.

## Findings — rewrites recommended (none blocking ship)

This audit does NOT identify any leaf that needs immediate rewrite. The 103-leaf catalogue is on-register and consistent. Three borderline domestic-warm closes on Common-tier relics are explicitly permitted by the in-file design comment (`src/core/i18n.ts` lines 3376–3381) and represent register modulation, not drift.

**Recommended next-pass rewrites (if a Pass 6 is commissioned):**

1. `runes.frost_rune.flavour` — could gain a place-anchor ("Tight, angular. **Cut on the lintel of the house at Achnacarry**, the kind a hand makes when the hand is shaking."). Defer.
2. `relics.midgie_repellent.flavour` — could pull in `midge_swarm` enemy. Defer.
3. `runes.fastburn_rune.flavour` — "The dancer's mark. Cut into a kilt-pin in three strokes, at speed." Could cross-reference `runes.ceilidh_chain_rune` more explicitly (both ceilidh-anchored). Defer.

None of these are register failures. They are **reinforcement opportunities** for a future cross-reference densification pass. Per memory `feedback_followups_become_tasks`, recording them here as deferred tasks rather than handwaving:

- **F1 (deferred).** Densify cross-references on rune flavour leaves — frost, fastburn, lairds. Estimated 30 minutes.
- **F2 (deferred).** Cross-link `midgie_repellent` ↔ `midge_swarm`. Estimated 15 minutes.

Both are voice-polish, not register failures. Filed as next-pass work.

## Conclusion

Voice is **consistent and on-register across 103/103 shipped lore leaves**. No commits required for Sub-task A.

Sub-task A status: **PASSED — no rewrites land in this pass**.
