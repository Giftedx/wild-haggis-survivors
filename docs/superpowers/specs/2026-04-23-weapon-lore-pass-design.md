# C2 — Weapon lore pass (Dark-Souls-style item flavour) design spec

**Date:** 2026-04-23
**Initiative:** C2 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md` — polish ticket, not flagship)
**Status:** Draft
**Prerequisite:** None strict. Depends on R1 Relics shipping first to include Relic lore; can partial-ship otherwise.

---

## 1. Problem statement

WHS's weapon, passive, and evolution descriptions are currently *mechanical*: "fast-firing projectile", "area-of-effect pulse", "+15% damage". Functional; readable; soulless.

`NARRATIVE_RESEARCH.md §3.3` argues — with Dark Souls as the canonical case — that item flavour text is the *densest* storytelling channel in games that want rich worlds. Dark Souls hides a 40-hour-JRPG's worth of lore in 4-line item descriptions. Players read inventory; therefore lore lands without demanding attention.

WHS has ~35 items that deserve Dark-Souls treatment:
- 8 base weapons.
- 7 weapon evolutions.
- 5 future unions (if shipped).
- 9 passive curios.
- 13 permanent meta upgrades.
- 15–20 Relics (R1 prereq).

Each needs 1–3 sentences of implied-history flavour with cross-referential texture. Current *mechanical* descriptions remain — they're pinned in `effectKey` — but new `flavourKey` entries sit alongside them.

### Player outcome

Every item the player picks up, hovers, or reads has *weight*. A Claymore isn't just "a heavy melee weapon"; it's "too heavy for any creature save a legend. William Wallace is said to have wielded one, though a haggis wouldn't know the difference." The moor's history hides in the inventory.

### Why this is a polish ticket, not a flagship

It's writing work, not engineering work. ~35 items × ~50 words = ~1,750 words of tight prose. Handled by one writer in one sprint alongside banter authoring. No system changes required — just new `flavourKey` entries alongside existing `effectKey`.

**But:** the *impact* is large. This flagship-adjacent work is the kind of polish that takes a good roguelite to masterpiece.

---

## 2. The writing standard

### Voice

Per `VOICE_CARD.md` + `NARRATIVE_RESEARCH.md §3.3 (Miyazaki-isms)`:

- **Formal, mythic, sad.** Not conversational. Not contemporary.
- **Scottish-rooted.** Names, places, references.
- **Ambiguous.** 30% unsaid. Players fill gaps.
- **Cross-referential.** Item A's description *references* item B in a way that implies a story.
- **Short.** 1–3 sentences. Maximum 40 words per description.

### Format template

```
[Short sentence establishing what the item is or does — tonal, not mechanical.]
[Middle sentence implying history — naming a person, place, or event — ambiguously.]
[Optional third sentence tying back or tying forward — often a quiet note.]
```

### Cross-reference rule

Each item's flavour text should reference *at least one other item's subject* either directly or obliquely. Over the full catalogue, this creates a web of implied story. Example chains:

- **Thistle Shot** mentions *a crofter's bairn* who weaponised thistles after a Viking's misfortune.
- **Tartan Sash** mentions *a bairn's shoulders* where it was first pinned.
- **Bronze Clasp** (Relic) mentions *a plaid at Bannockburn* the bairn's daughter might have pinned.
- **Wallace Sword** (future) mentions *the Falkirk grief* Bronze Clasp also carries.

No explicit "Item A + Item B = lore unlock". Just *named echoes* across descriptions.

### Tonal modulation per item type

- **Weapons** → martial-elegiac. Mourn the weapon's history.
- **Passives (curios)** → domestic-mystical. Found in croft-corners.
- **Evolutions** → legendary flourish. Darker, rarer tone.
- **Unions** (future) → mythic capstone. Heaviest voice.
- **Relics** → cross-period, object-biographical. Like museum captions by a melancholy poet.
- **Permanent upgrades** → philosophical, generational. Gran's wisdom pattern.

---

## 3. Sample rewrites

### Weapons

**Thistle Shot (current):** "A fast-firing thistle projectile that pierces enemies."

**Thistle Shot (new):**
*"First thrown by a crofter's bairn who'd watched a Viking bare his sole on a thistle. 'If it kept a kingdom,' she reasoned, 'it might keep me.' Every thistle since remembers her."*

---

**Bagpipe Blast (current):** "Releases an area-of-effect pulse of sound around the haggis."

**Bagpipe Blast (new):**
*"A note held too long. The drone has a name — no piper recalls it. The beasties scatter, as they did at Killiecrankie."*

---

**Caber Toss (current):** "Hurls a heavy tapered log that pierces enemies."

**Caber Toss (new):**
*"Two-and-twenty feet of pine, tossed end-over-end for form, not distance. The judge at Braemar is never impressed. The haggis practices anyway."*

---

**Scotch Mist (current):** "Leaves a damaging trail of mist behind the haggis."

**Scotch Mist (new):**
*"A trick of weather. A trick of poets. The mist 'scotches' what it passes. Some say the word means nothing; some say it means everything."*

---

**Haggis Hurler (current):** "Bouncing projectile — throws haggis that ricochet off edges."

**Haggis Hurler (new):**
*"The old sport. Lorne Coltart threw one sixty-six metres, in 2011. A wild haggis throws itself further, given cause."*

---

**Nessie's Tentacle (current):** "90-degree arc sweep of loch-tentacle."

**Nessie's Tentacle (new):**
*"She's never been seen whole. A wrinkle of the loch's surface. A shadow at Urquhart. The tentacle is what's visible; the rest is what's believed."*

---

**Claymore (current):** "Two-handed broadsword — slow, heavy, high damage."

**Claymore (new):**
*"Too heavy for any creature save a legend. Wallace is said to have wielded one, though a haggis wouldn't know the difference. The blade remembers Falkirk. It does not forgive it."*

---

**Bagpipes (current):** "Aura that damages nearby enemies."

**Bagpipes (new):**
*"Drones older than speech. In the Highland tongue they are the 'great music' — ceòl mòr. Enemies who know the old tunes keep their distance. Those who don't, learn."*

### Evolutions

**Thistle Storm (from Thistle Shot + Thistle Crown):**
*"A hundred thistles where there was one. The bairn grew old; the thistles did not. She is buried in Alloway; her garden is everywhere."*

**Highland Fling (from Bagpipe Blast + Irn-Bru):**
*"The dance steps are three centuries old; the drum beneath them older still. The Fling is not a fling at all — it is a promise, kept."*

**The Haar (from Scotch Mist + Loch Water):**
*"Sea-fog named for the east coast, where Aberdeen fishermen watch it come. It lifts on its own time. The visibility is a courtesy."*

**Highland Games (from Caber Toss + Whisky Flask):**
*"Twenty-two pounds of hammer; one-fourteen of stone; one haggis wielding the catalogue. The Braemar Gathering would have concerns."*

**Haggis Cannon (from Haggis Hurler + Loch Water):**
*"Every shot is a haggis; every haggis an eulogy. The range improves with practice; the flavour does not."*

**Nessie Unleashed (from Nessie's Tentacle + Thistle Crown):**
*"She is visible, for a moment. The moment ends badly for whomever she was looking at."*

**William Blade (from Claymore + Tartan Sash):**
*"Blessed in his name, not his possession. Wallace never held it; the blade has pretended otherwise since 1305."*

### Passives (curios)

**Sporran (current):** "+15% luck."
**Sporran (new):** *"Capacious beyond reason. Gran insists it's just well-organised. It holds the day's pickings and, sometimes, things the haggis doesn't remember collecting."*

**Whisky Flask (current):** "+20% AoE."
**Whisky Flask (new):** *"Filled from a distillery that was drowned when the dam went up. The ten-year-old lasts forever. It is not quite the same as the ten-year-old one can buy."*

**Kilt (current):** "+15% max HP."
**Kilt (new):** *"The great kilt, the feileadh mòr — eighteen feet of wool, belted at the waist and thrown over the shoulder. Gran pinned it. Gran mends it."*

**Tam o' Shanter (current):** "+10% speed."
**Tam o' Shanter (new):** *"Red toorie on a flat bonnet, named for Burns's drunk, who rode past Alloway Kirk one winter and saw what he oughtn't have. The haggis rides lighter."*

**Irn-Bru (current):** "+20% attack speed."
**Irn-Bru (new):** *"Cumbernauld's contribution to the canon. 1901. The recipe is secret; the caffeine is real. The orange stains of it have been known to save marriages."*

**Loch Water (current):** "+25% pickup radius."
**Loch Water (new):** *"Drawn from a burn that feeds into a loch that no-one names. Peat-dark. Cold. The haggis holds it close; so does whatever else is in it."*

**Thistle Crown (current):** "+crit, +thorns."
**Thistle Crown (new):** *"Woven by the bairn who invented the Thistle Shot. Gran says it has never been removed; the haggis is not sure who is wearing whom."*

**Highland Shield (current):** "Death save once per run."
**Highland Shield (new):** *"Round, lime-wood, oxhide-faced. The targe at Culloden. It saved some and not others. The haggis carries one anyway."*

**Tartan Sash (current):** "+8% damage; Claymore evolution trigger."
**Tartan Sash (new):** *"Royal Stewart, by the design — though the wearer has no right to it. The moor does not mind. The sash is proud to be worn."*

### Permanent meta upgrades (samples)

**Thick Hide (current):** "+max HP per level."
**Thick Hide (new):** *"Passed down. Each generation thickens a little. The haggis in the shop mirror looks weathered; Gran says that's just the light."*

**Strong Legs (current):** "+speed per level."
**Strong Legs (new):** *"Hill-walked since before memory. The uphill leg is shorter than the downhill. Or the other way. It depends on which side of the hill."*

**Sharp Thistles (current):** "+damage per level."
**Sharp Thistles (new):** *"Selection takes place in the soil. Each year's crop grows pricklier. Gran composts the herbaceous; the haggis composts the rest."*

**Lucky Heather (current):** "+luck per level."
**Lucky Heather (new):** *"White heather, found in the peat below where a shepherd fell in 1820. Still fragrant. Still lucky — though not for him."*

*(Pattern continues for remaining 9 permanent upgrades. Full text authored during execution.)*

### Relics (15–20; R1 prereq)

Worked examples in `docs/superpowers/specs/2026-04-23-relics-third-tier-design.md §3`.

---

## 4. Non-goals

- **Not rewriting mechanical descriptions.** `effectKey` stays: "+10% damage" etc. The flavour sits *alongside* in `flavourKey`.
- **Not adding new items.** Only existing items + items from parallel flagships (R1 Relics, V2 Variants).
- **Not interactive lore (clickable to expand).** Just text.
- **Not player-authored lore.** No mod system for item text.
- **Not UI redesign.** Item card UI shows flavour text in an existing sub-area (currently empty for most items); no major UI work.
- **Not voice-over.** Text only.
- **Not localised beyond EN + SCS.** Scots pairing follows existing i18n discipline.
- **Not explicit plot.** Flavour is implied history, not a timeline. Readers piece it together.

---

## 5. Architecture

### Files to modify

- `src/core/i18n.ts` — add `flavourKey` strings under existing item trees:
  - `ui.weapons.{weaponKey}.flavour` — 8 weapons.
  - `ui.evolutions.{key}.flavour` — 7 evolutions.
  - `ui.passives.{key}.flavour` — 9 passives.
  - `ui.permanentUpgrades.{key}.flavour` — 13 upgrades.
  - `ui.relics.{key}.flavour` — 15–20 relics (R1 prereq).
  - `ui.variants.{variantKey}.flavour` — 13 variants (V2 prereq).
- `src/core/i18n.scs.ts` — matching SCS translations.
- `src/data/weapons.ts` — `WeaponDef` extends with `flavourKey: string`.
- `src/data/upgrades.ts` — `UpgradeCard` extends with `flavourKey: string`.
- `src/data/permanentUpgrades.ts` — similar.
- `src/data/relics.ts` (R1 new file) — already has `flavourKey`.
- `src/data/variants.ts` — `VariantDef` extends with `flavourKey: string` (if not already present).
- `src/ui/UpgradeCardsUI.ts` — render `flavourKey` text in italic / lighter font, below `effectKey`.
- `src/scenes/ShopScene.ts` — show flavour on meta-upgrade hover.
- `src/scenes/game/PauseMenu.ts` — show flavour in inventory tab.

### No new files

Pure content. All existing infrastructure.

### Tests / fences

- `i18n.locale.test.ts` — EN ↔ SCS parity extension to all new `flavour` leaf keys.
- `items.test.ts` — every shipped item has a `flavourKey` defined.
- Manual review: one writer reviews all flavour text in one pass for voice consistency.

### Bundle delta

- **~2 KB gzip** for 35 flavour texts × 2 locales. Negligible.

---

## 6. Writing process

### Author discipline

- **One primary writer** for the whole pass. Voice drift ruins the effect.
- **Two-hour block per 10 items.** Write, step away, return, edit. Aim for ~20-30 words per description.
- **Cross-reference pass after first draft.** Identify items that don't name-drop another item; rewrite to include at least one echo.
- **Read-aloud pass.** Every flavour text read aloud. Does it sit in the mouth?
- **Scottish-native review.** Scottish writer confirms voice (per `CULTURAL_SENSITIVITIES_RESEARCH.md`).
- **Burns-citation audit.** Any direct Burns quotation verified against source edition.

### SCS translation

- Scots translation alongside English. Doesn't have to be literal — capture the *feeling* in Scots.
- Uses existing Scots vocabulary conventions from Phase B (yir, nae, dinnae, tae, ken, wee).
- Gaelic phrases (Cailleach-adjacent items) reviewed by native speaker.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Voice drift across 35 descriptions | Single writer. Two-pass review. |
| Lore contradictions (item A says X, item B says not-X) | Cross-reference pass. Writer maintains a one-page "lore bible" of named people / places / events for consistency. |
| Flavour text overpowers mechanical info | Flavour is visually subordinate — italic, lighter weight, smaller font. Mechanical text (`effectKey`) stays primary. |
| SCS translations thin | Scots pairing is *creative paraphrase*, not literal. Native-speaker pass ensures it reads Scots-natural. |
| Burns misquotation | All direct quotations verified against an authoritative edition. Paraphrases marked as such. |
| Cultural misstep (e.g., Culloden-related flavour read as triumphalist) | `CULTURAL_SENSITIVITIES_RESEARCH.md` review of any history-adjacent flavour. |
| Dead-end lore hooks (items imply a story that never gets told) | Intentional per Dark-Souls standard. Don't resolve; don't be internally contradictory. |
| Players miss the flavour (because they skim) | That's fine. Dark Souls players do too. The lore rewards the attentive; doesn't punish the casual. |

---

## 8. Kill criteria

- **All 35+ items** (weapons, evolutions, passives, upgrades, relics, variants) have `flavourKey` populated in EN + SCS.
- **i18n parity fence** green for all new leaves.
- **`npm run ci:all`** green.
- **Manual review pass** by one author + one reviewer flags zero voice-consistency issues.
- **No historical / cultural inaccuracy** (verified against `CULTURAL_SENSITIVITIES_RESEARCH.md` and research docs).
- **Bundle delta** ≤ +3 KB gzip.

If any item's flavour can't be written to the voice standard within one sprint, retain the default (empty flavour or mechanical-only) for that item and ship rest. Don't ship half-polished flavour.

---

## 9. Cross-references

- `docs/research/NARRATIVE_RESEARCH.md §3.3 (Dark Souls), §6.2 (item descriptions), §8.2 (WHS map)` — strategic rationale + technique.
- `docs/VOICE_CARD.md` — voice registers (flavour text sits in a slightly-different formal-mythic register than banter).
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §6` — historical references (Wallace, Bannockburn, Falkirk, Culloden).
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §15.3 (Burns canon)` — for direct quotations.
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` — review gate for any history-adjacent flavour.
- R1 Relics spec — Relics already have flavour text authored; C2 just ensures consistency across categories.

---

*Spec complete. Plan is a single-sprint content sprint: M1 weapons + evolutions (15 items), M2 passives + upgrades (22 items), M3 relics + variants (~35 items). Each milestone = write pass + review pass + SCS pairing. Author: one writer; reviewer: Scottish-native collaborator.*
