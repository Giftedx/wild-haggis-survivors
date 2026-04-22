# Variant #10 — Cailleach design spec

**Date:** 2026-04-22
**Scope:** Tenth and final playable haggis variant. Closes the roster at the ~10-variant ceiling flagged in DESIGN_IDEAS §2 and HUGE_INITIATIVES_VERDICT Part 12.

---

## 1. Problem statement

Roster today: classic, moor_runner, iron_belly, glen_forager, surefoot, pipe_breath, wee_ghostie, laird, glaswegian (9). Every existing variant occupies a clear mechanical / tonal register:

| Register | Variant |
|---|---|
| Baseline | classic |
| Fast / mobile | moor_runner |
| Tank | iron_belly |
| Pickup-focused | glen_forager |
| Drift-mastery | surefoot |
| Music-themed | pipe_breath |
| Ethereal | wee_ghostie |
| Posh / dignified | laird |
| Urban / aggressive | glaswegian |

Missing: **mythic / elder / wise-woman**. Scottish folklore is dense with this archetype (Cailleach = old-woman spirit, winter hag, shaper of mountains), and VERDICT marked H8 Cailleach as 🟡 MEDIUM — genuine work, clear identity.

Shipping #10 closes the ceiling: adding an 11th dilutes the variant pool (see DESIGN_IDEAS §2 warning: "one slot left before the pool dilutes").

### Player outcome

A slower, XP-rich playstyle that rewards patience and wisdom — contrast to the fast/urban/tank registers already on the menu. Unlocks after a player has walked through the dark side of the game (cursed victories), so it feels EARNED as reward for mastery of difficulty, not just time-in-game.

---

## 2. Identity

### Stat profile (vs classic baseline)

| Stat | Classic | Cailleach | Delta |
|---|---|---|---|
| Move speed | baseline | -15% | slower, deliberate |
| Max HP | baseline | +10 | elder constitution |
| XP pickup radius | baseline | +35% | wisdom draws the world in |
| Crit chance | baseline | +8% | precision of age |
| Drift | baseline | unchanged | still a haggis — keeps the game's core |

Numbers pinned in the plan. The stat profile reads as "wise crone who sees the lay of the land": slower to move, more of the moor comes to her.

### Palette

- **Body**: `0x3a4f3a` (deep forest teal-green) — shifts away from the browns + greys of other variants
- **Accent**: `0xd4d0c0` (silver-white) — crone hair / moss edge
- **Kilt field**: `0x2a4a2a` (moss green) — fittingly mythic
- **Kilt stripe**: `0x8a2828` (rowan-berry red) — the only warm tone, draws the eye
- **Kilt accent**: `0xd4d0c0` (silver-white) — matches body accent

Distinct from existing palettes: no variant currently leads with deep teal-green or silver-white.

### Sprite cues

- Longer wispy hair/fur tufts at the crown (suggesting age)
- Slight posture tilt — head angled forward like someone peering at weather
- A small rowan-berry pip near the ear (deed-gated detail, reinforces the mythic unlock)

Implemented via the existing `haggisComposition` layer system — no new rig, no new animation.

### Voice register

Between Still Game warmth (the hearth-tone default) and Limmy bite (the edge register). Cailleach's banter leans:

- Gaelic-inflected ("dè do bheachd" / "cò às a tha thu")
- Stern-but-fond rebukes ("awa' wi' ye")
- Dark humour about death, weather, and the long view ("ah've seen worse winters")
- Soft wisdom at decision points ("the moor chooses its own, pet")
- Never cheap jokes; always earned

Not Gaelic-only — uses Glesga-inflected English with occasional Gaelic words woven in. Accessible to English-only players while honouring the folklore.

---

## 3. Unlock condition

**"Walked through the veil three times"** — unlock after completing 3 cursed-victory runs (any curse, any variant).

**Why this gate**:
- Gates on skill (cursed runs are harder)
- Gates on thematic weight (Cailleach is the winter hag; you earn her by surviving hard seasons)
- Maps to existing infrastructure: `RunHistoryEntry.curseKey` + `mode: 'victory'` already tracked

Counter for the unlock lives in `SaveManager.unlocks` under a new field `cursedVictoriesCompleted`, incremented on victory with a non-null `curseKey`. Unlock triggers at 3.

**Stretch**: if the count is already 3+ when the player finishes any future cursed victory, no-op (unlock sticks). If someone has save data from before this ships, grant retroactively at load time (scan `runHistory` for past matches, then count). Graceful for existing players.

---

## 4. Banter scope

24 EN keys + 24 SCS keys across 6 sub-pools. Matches the existing variant banter pattern (per `feedback_finish_the_job` session notes on Glaswegian: "24 EN + 24 SCS across six sub-pools" is the proven shape).

Sub-pools (4 keys each):
1. `run_start` — what Cailleach says when leaving the bothy
2. `combat_win` — small victory beat
3. `combat_hurt` — low HP reaction (Limmy-bite lean here — Cailleach is sharper when wounded)
4. `boss_warn` — what she says when a boss horn sounds
5. `victory` — moor survived
6. `death` — compassionate, informative — never shaming per DESIGN_SOUL

Parity guard (`src/core/i18n.locale.test.ts`) enforces EN ↔ SCS mirroring. Authoring must be Scots-voiced, not machine-translated — memory `reference_glesga_comedy_vault` + `feedback_voice_register` as the voice coach.

---

## 5. Non-goals

- **No new core mechanic** — Cailleach ships with stat deltas + palette + banter only. No "freeze-on-kill" winter-hag ability or similar. Following Laird/Glaswegian precedent: identity first, mechanical expansion later if it earns a follow-up.
- **No rig work** — sprites procedural via existing `haggisComposition` drawers (body, kilt, accessory atlas). No animation beyond the shared player wobble + outline post-process.
- **No new biome / hazard / enemy**. She walks the same moor.
- **No Gaelic-only lines** — every Gaelic touch pairs with English context so non-Gaelic speakers aren't locked out.
- **No retroactive voice changes to existing variants** — Cailleach's register is her own.
- **No ceiling shift** — after Cailleach, adding an 11th variant requires a retrospective first (revisit diluting the pool). Not this pass.

---

## 6. Architecture

### Files to create

- `src/art/sprites/variants/cailleachPalette.ts` — body + accent + kilt palette constants (reusing the palette-module pattern from `glaswegianPalette.ts` or equivalent)

### Files to modify

- `src/data/variants.ts` — add `VariantDef` for `cailleach`
- `src/data/variants.test.ts` or `variantWireUp.test.ts` — roster count assertion bump (9 → 10)
- `src/data/achievements.ts` (or wherever deed unlocks live) — add `ach_cailleach_unlock` deed + condition + grant path
- `src/utils/save.ts` — add `cursedVictoriesCompleted` unlock counter field + coercion + migration default `0` + retroactive seed from `runHistory`
- `src/utils/save.test.ts` — tests for new field + migration
- `src/core/i18n.ts` — add Cailleach EN strings (display name, tagline, banter 24 keys, deed label)
- `src/core/i18n.scs.ts` — matching SCS strings
- `src/scenes/MenuScene.ts` (variant picker) — no code change expected; the picker iterates over VARIANTS already. Visual verification only.
- `src/art/kiltPalette.ts` — add `cailleach` entry with the moss-green field + rowan-red stripe + silver accent

### Tests / fences the variant must clear

- `variantWireUp.test.ts` — every `VARIANTS` entry has sprite key, palette, description, unlock condition, banter keys in all 6 pools
- i18n parity (EN ↔ SCS for `ui.banter.cailleach.*`)
- Unlock counter migration (saves without field default to 0; saves with past cursed victories seed retroactively)

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Banter reads machine-translated | Author from memory (voice register + comedy vault). Each key reviewed against "does Still Game / Limmy actually say something like this?" test |
| Stat delta breaks balance | Deltas are small (-15% speed, +10 HP, +35% pickup, +8% crit). No mechanic adds — just numbers. Within existing variant spread (Laird is +20% HP, Glaswegian is +18% dmg). |
| Retroactive unlock miscounts old saves | Scan runHistory at load time once, cache result. If scan fails, default to 0 (player re-earns). |
| Unlock gate feels punitive | 3 cursed victories ≈ 30-60 min of focused play for a skilled player. Laird/Glaswegian have similar-scale gates. |
| Palette clashes with existing kilts | Moss-green + rowan-red is unique to Cailleach. Verified against existing 9 kilt palettes. |

---

## 8. Kill criteria

- **variantWireUp.test.ts passes** with 10-variant roster
- **i18n parity test passes** with all new `ui.banter.cailleach.*` keys mirrored
- **`npm run ci:all`** green (lint + 2920+ vitest + build + e2e)
- **Manual visual check**: Cailleach selectable from variant picker, sprite reads as mythic/elder (not same-as-classic), deed unlocks on 3 cursed victories

If any fails, revert the variant commit range — game is unaffected.

---

*Spec complete. Next: `writing-plans` with 8 bite-sized tasks.*
