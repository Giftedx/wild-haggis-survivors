# V2 — Haggis Variants Pack (+3 new variants) design spec

**Date:** 2026-04-23
**Initiative:** V2 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Status:** Draft
**Prerequisite:** Variant #10 Cailleach shipped (2026-04-22). B1 Banter Push helpful but not strict blocker.

---

## 1. Problem statement

Roster shipped after Cailleach: 10 variants (classic, moor_runner, iron_belly, glen_forager, surefoot, pipe_breath, wee_ghostie, laird, glaswegian, cailleach). Cailleach's spec called this "the ceiling" — one more variant before the pool dilutes.

The research refresh re-opens that ceiling *deliberately*, because the deep Scottish doc (`SCOTTISH_RESEARCH_DEEP.md §14`) surfaced three distinct voice-registers that the current roster doesn't cover:

- **Doric** (Northeast Scotland, Aberdeenshire) — "Fit like?", quine/loon, fishing-village stoic. Distinct from both Glasgow and Edinburgh.
- **Shetlandic** (Norn-tinged, *peerie*, *du/dee*). Distinct from all mainland Scots dialects.
- **Burns-citational** (Ayrshire, literary). Voice through Burns's poetry, rather than a modern-Scots accent.

These three new variants would not *dilute* the pool — they'd *complete* Scotland's dialect spectrum on the roster. Current variants are all urban Glesga-leaning or ancient-mythic; there's no voice for the Northeast, the Northern Isles, or the literary canon.

### Player outcome

Three new ways to experience the moor, each with a distinct voice, stat profile, palette, and unlock path. Players hear regional Scotland represented as the living place it is — not just "Highlands + urban Glasgow."

### Why three, not one

Each is small (stat deltas + palette + banter). Doing three together lets the roster *answer* the research doc's findings at once. A follow-up variant drop is always possible, but this one completes the dialect-spectrum.

---

## 2. The three variants

### Variant 11: Doric Quinie

**Flavour.** Northeast Aberdeenshire fisher-village voice. Hardy, stoic, quick-witted. Fishing families' daughter. Uses Doric vocabulary heavily ("fit like?", "quinie", "loon", "min", "foos yer doos?").

**Stat profile vs classic:**

| Stat | Classic | Doric Quinie | Delta |
|---|---|---|---|
| Move speed | baseline | -5% | slightly steadier |
| Max HP | baseline | +8 | fisher-family constitution |
| Pickup radius | baseline | +15% | used to gathering |
| Damage | baseline | +5% | hard-working hands |

**Palette.**
- **Body:** `0x6a5a3a` (granite-peat mix) — Aberdonian granite echo.
- **Accent:** `0xd0d4e0` (pale silver-blue) — North Sea mist.
- **Kilt field:** `0x4a5a6a` (grey-blue granite).
- **Kilt stripe:** `0xc8a040` (aged gold, mainline palette anchor).
- **Kilt accent:** `0xf0e8d0` (oat-white).

Silhouette cue: slightly longer "fisherman's bonnet" tuft; upright posture.

**Voice register.** Fisher-village stoic. Fewer big emotions, more practical observation. Doric vocabulary throughout.

**Starting weapon.** Standard (Thistle Shot). Starts with the **Arbroath Smokie** as a free passive equivalent — +5% XP from pickups (themed: *smoked haddock in the sporran*).

**Unlock.** Complete a run without picking up any healing circles. *"The Doric way: survive on what you caught yesterday."* Gates on skill.

**Banter sample (EN):**
- Run start: *"Fit like, min. Long road ahead."*
- Combat win: *"Aye, that's that sorted."*
- Low HP: *"Oh, that's bowfin'. Keep movin'."*
- Boss warn: *"Ach, here's trouble."*
- Victory: *"Braw, min. Hame noo."*
- Death: *"Thon was a sair fecht. Again."*

**Banter sample (SCS):** (same 24 keys, Scots-Doric variant where relevant. Doric is already closer to Scots in vocabulary; parity is mostly trivial.)

---

### Variant 12: Peerie Shetlander

**Flavour.** Shetlandic — Norn-tinged Scots. Uses *du / dee* (thou/thee, preserved from Old Norse), *peerie* (small), Viking-heritage references. Quiet, lyrical, wind-weathered.

**Stat profile vs classic:**

| Stat | Classic | Peerie Shetlander | Delta |
|---|---|---|---|
| Move speed | baseline | +5% | used to wind |
| Max HP | baseline | -10 | *peerie* = wee, smaller-framed |
| Cold-hazard resist | — | 50% | northern constitution |
| Crit chance | baseline | +5% | weathered eye |
| Drift | baseline | -10% | sea-footed |

**Palette.**
- **Body:** `0x2a4a5a` (North Sea grey-blue).
- **Accent:** `0xe0d8c8` (bleached-driftwood).
- **Kilt field:** `0x3a5a4a` (moss + sea).
- **Kilt stripe:** `0xaa6030` (rust — old iron, Viking echo).
- **Kilt accent:** `0xe0d8c8` (matching body).

Silhouette cue: wisps of kelp at the collar; slight lean into (implied) wind.

**Voice register.** Shetlandic — the most distinct voice in the game. *Du/dee*, *peerie*, Norn loanwords (voe, mirry, skerry).

**Starting weapon.** Standard (Thistle Shot). Starts with **Up Helly Aa** flavoured variant passive — fire hazards deal 25% less damage, but move speed in cold biomes +5% (themed Viking-fire-festival).

**Unlock.** Complete a run in the coastal/loch biome cluster exclusively (never enter moor). *"The sea way home."* Gates on exploration choice.

**Banter sample (EN):**
- Run start: *"Peerie step noo, du. Wind's up."*
- Combat win: *"Aye, that's dee sorted."*
- Low HP: *"Keep tee rising, du."*
- Boss warn: *"Thon's a boorie comin'."*
- Victory: *"Hame tae the voe."*
- Death: *"Sea gave; sea takes."*

---

### Variant 13: Burns's Wee Beastie

**Flavour.** Ayrshire. The haggis that stepped out of Burns's *To a Mouse*. Tiny, trembling, noble-hearted. Speaks in poetic fragments — sometimes directly quoting Burns, sometimes paraphrasing with the same register.

**Stat profile vs classic:**

| Stat | Classic | Burns's Wee Beastie | Delta |
|---|---|---|---|
| Sprite scale | 1.0 | 0.85× | literally wee |
| Max HP | baseline | -15 | tiny-and-tim'rous |
| Crit chance | baseline | +20% | the wee beastie strikes precisely |
| Move speed | baseline | +10% | cow'rin, tim'rous, *fast* |
| XP gain | baseline | +15% | attentive to small things |

**Palette.**
- **Body:** `0xa08060` (mouse-brown echo).
- **Accent:** `0xf0e4c8` (poet's cream).
- **Kilt field:** `0x6a4030` (aged-ink).
- **Kilt stripe:** `0xc82830` (Ayrshire red — arterial).
- **Kilt accent:** `0xf0e4c8` (cream).

Silhouette cue: notably smaller than other variants (85% sprite scale). Tiny proportion reinforces *wee* identity.

**Voice register.** Burns citational — every banter line is a Burns quotation, close paraphrase, or written in his register. Accessible to non-readers: paraphrases use modern Scots; direct quotes italicised.

**Starting weapon.** Standard (Thistle Shot) + starts with **A Red, Red Rose** flavour passive — on crit, spawn a small thistle-bloom healing particle. Themed from the Burns poem.

**Unlock.** Complete Burns Night event (E1 flagship) with 100% weapon-evolution completion. *"Earned when the bard is honoured."* Deeply themed unlock path.

**Banter sample (EN):**
- Run start: *"Wee, sleekit, cow'rin, tim'rous beastie — on we go."*
- Combat win: *"The best-laid schemes hold, for now."*
- Low HP: *"Och, my breastie trembles."*
- Boss warn: *"Thou need na start awa sae hasty…"*
- Victory: *"Gie me ae spark o' Nature's fire."*
- Death: *"The present only toucheth thee, after all."*

All SCS translations for Burns variant are direct from his Scots originals (they're already in Scots). EN "translations" in banter are modernised where needed for comprehension.

---

## 3. Non-goals

- **No new core mechanic per variant.** Stat deltas + palette + voice + starter-passive. No unique abilities.
- **No Gaelic-only variant.** (Cailleach already covers Gaelic-inflected voice; a *Hebridean Gaelic-primary* variant is a future flagship, requires native speaker consultation — outside scope here.)
- **No variant-exclusive biomes.** All three can run any shipped biome.
- **No rostership past 13.** After these land, roster closes at 13 for 3-month review before any more.
- **No retroactive voice changes** to existing variants.
- **No variant-exclusive Relics.** (Relics drop to whomever kills the elite.)
- **No banter voice-over.** Text-only per B1.

---

## 4. Architecture

### Shared structure (per Cailleach precedent)

Each variant follows the shipped `cailleach` pattern almost exactly. Files per variant:

- Entry in `src/data/variants.ts` — `VariantDef` with stat deltas.
- Palette module `src/art/sprites/variants/{key}Palette.ts` — body + accent + kilt colours.
- Entry in `src/art/kiltPalette.ts` — kilt-specific palette.
- I18n keys in `src/core/i18n.ts` + `src/core/i18n.scs.ts` — 24 banter keys + display name + tagline + deed label.
- Achievement entry in `src/data/achievements.ts` for unlock deed.
- Starter-passive wired in `src/data/variants.ts` via existing `startWithPassives` field.

### Files to modify

- `src/data/variants.ts` — 3 new `VariantDef` entries, bump `VARIANT_COUNT` from 10 to 13.
- `src/data/variants.test.ts` — assert roster count 13; per-variant fence check.
- `src/data/achievements.ts` — 3 new unlock deeds (`ach_doric_unlock`, `ach_peerie_unlock`, `ach_burns_beastie_unlock`).
- `src/utils/save.ts` — extend `SaveData.unlocks` with new unlock counters as needed (e.g., `runsWithNoHealing: number`, `runsInCoastalOnly: number`, `burnsNightsWithEvolutions: number`). Schema v9 → **v10** (or later if other flagships bump first).
- `src/core/i18n.ts` + `src/core/i18n.scs.ts` — 3 variants × (24 banter + ~10 meta) keys × 2 locales = ~200 new keys.
- `src/art/kiltPalette.ts` — 3 new entries.

### New files (per variant)

- `src/art/sprites/variants/doricQuiniePalette.ts`
- `src/art/sprites/variants/peerieShetlanderPalette.ts`
- `src/art/sprites/variants/burnsWeeBeastiePalette.ts`

### Tests / fences

- `variantWireUp.test.ts` — 13-variant roster passes all fences.
- `i18n.locale.test.ts` — EN ↔ SCS parity for `ui.banter.{doric_quinie,peerie_shetlander,burns_wee_beastie}.*`.
- Per-variant save-unlock-counter migration tests.
- `e2e/variants-picker.spec.ts` (extend existing) — each new variant selectable when unlocked.

---

## 5. Consultation requirements

Per `CULTURAL_SENSITIVITIES_RESEARCH.md`:

- **Doric banter** — reviewed by a Northeast Scotland (Aberdeenshire / Moray / Angus) native before merge. Doric Phrases resource (`doricphrases.com`) as reference.
- **Shetlandic banter** — reviewed by a Shetland native. *Shetland ForWirds* (dialect body) may provide. Shetland dialect now has its own ISO 639-3 code (scz) — treat respectfully.
- **Burns quotations** — verify every direct quotation against a trustworthy Burns edition (*The Canongate Burns* recommended). No paraphrase is attributed directly to Burns if not his wording.

Consultation fees are budgeted per session. No variant ships without review.

---

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Dialect authenticity fails without consultation | Mandatory native-speaker review per above. Merge-blocker. |
| Burns variant feels pretentious | Keep banter accessible — every quote pairs with enough context that a non-Burns-reader still gets the feeling. Burns Night event ties unlock to an understandable achievement. |
| Voice collision (Doric and Glaswegian both "sharp") | Register differentiation: Glaswegian is *urban-abrupt*, Doric is *rural-stoic*. Distinct in tempo and vocabulary (quine vs bampot, min vs pal). Read-through-test. |
| Size variant (Burns's Wee Beastie at 0.85×) creates hitbox bugs | Regression test on all existing weapons, hazards, enemies with smaller hitbox. Hitbox scales with sprite scale already per `Player.onLevelUp` pattern. |
| 13-variant pool dilutes decision | Gate review: run-count-per-variant-picked telemetry. If any new variant is picked <3% after 1 month, retire or rework. |
| i18n ~200-key load | Phase alongside B1 Banter Push. |

---

## 7. Kill criteria

- **Variant wire-up tests** green for 13-variant roster.
- **i18n parity fence** green across all new banter leaves.
- **`npm run ci:all`** green.
- **Burns variant hitbox regressions** pass (sprite-scale doesn't break collision math).
- **Each variant's unlock condition** is measurable and reachable by 10%+ of players (too-rare gates are de facto unshipped).
- **Manual read-aloud check** of all new banter by authoring reviewer.

If any dialect-consultation review fails merge after 2 weeks of iteration, hold that variant back and ship the other two.

---

## 8. Cross-references

- `docs/superpowers/specs/2026-04-22-variant-cailleach-design.md` — template precedent.
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §14` — dialect geography.
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §15.3` — Burns canon.
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md §4.3` — dialect representation ethics.
- `docs/VOICE_CARD.md` — variant-scoped voices (now updated with Doric section).
- `docs/research/ROGUELITE_RESEARCH.md §Tier S1` — character-as-constraint multiplier rationale.

---

*Spec complete. Plan breaks into three parallel variant tracks, each ~4 tasks: palette + stat profile wire-up, i18n + banter authoring + consultation, unlock deed + save migration, variant-picker verification. Pace: one variant per sprint, three sprints total.*
