# C2 — Weapon lore pass implementation plan

> **STATUS:** Draft.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. However — this plan is *mostly content authoring*; the subagent-driven flow applies to the data-wiring (adding `flavourKey` fields) + UI rendering; the *prose itself* is hand-authored by a writer per the discipline below.

**Goal:** Rewrite every weapon / passive / evolution / relic / permanent-upgrade / variant description with Dark-Souls-style implied-history flavour text per `docs/superpowers/specs/2026-04-23-weapon-lore-pass-design.md`. ~35–50 items depending on parallel flagship progress. 3 content-sprint milestones.

**Architecture:** Pure content authoring into existing i18n files. Data schema extends with `flavourKey` alongside existing `effectKey`. UI rendering shows flavour text in italic, subordinate to mechanical text. No system changes required. Minimal engine work — the discipline is writing.

**Tech Stack:** TypeScript strict, Phaser 3.90+. Content tooling via existing i18n + parity fences.

**Commit cadence:** One commit per pool (e.g., all 8 weapons at once; all 7 evolutions at once). Each commit includes EN + SCS together. `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.

**Branch:** `master`.

**Guardrails on every task:**
- Parity fence (`ui.banter.*` scoped; `ui.weapons.*` etc. not currently scoped but *should be* — see Task 1).
- Scottish-native reviewer + Burns-quotation source verification per `CULTURAL_SENSITIVITIES_RESEARCH.md`.
- No marketing voice. No factual errors. Voice consistency per writer.
- `npm test` green after each commit.
- `npm run lint` after multi-file changes.

---

## File structure

### New files

*(None.)*

### Modified files

| Path | Change |
|------|--------|
| `src/core/i18n.ts` | Add `flavourKey` strings: `ui.weapons.*.flavour`, `ui.evolutions.*.flavour`, `ui.passives.*.flavour`, `ui.permanentUpgrades.*.flavour`, `ui.relics.*.flavour` (R1 coord), `ui.variants.*.flavour` (V2 coord). |
| `src/core/i18n.scs.ts` | Matching SCS. |
| `src/core/i18n.locale.test.ts` | Extend parity fence scope to include new `flavour` leaves. |
| `src/data/weapons.ts` | `WeaponDef.flavourKey: string` field. |
| `src/data/upgrades.ts` | `UpgradeCard.flavourKey: string` field for evolutions + passives. |
| `src/data/permanentUpgrades.ts` | Similar. |
| `src/data/relics.ts` (if R1 shipped) | Already has `flavourKey`. |
| `src/data/variants.ts` | `VariantDef.flavourKey` (if not present). |
| `src/ui/UpgradeCardsUI.ts` | Render `flavourKey` in italic / smaller / lighter font, below `effectKey`. |
| `src/scenes/ShopScene.ts` | Show flavour on meta-upgrade hover. |
| `src/scenes/game/PauseMenu.ts` | Show flavour in inventory tab. |

---

## Milestone plan

- **M1 — Weapons + evolutions + permanent upgrades** (tasks 1–8). Core weaponry + meta-shop. ~28 items × 2 locales = 56 flavours. Ship gate: all weapons + evolutions + permanent-upgrades have flavour; UI renders correctly.
- **M2 — Passives + variants** (tasks 9–14). 9 passives + 13 variants (V2 coord). ~22 items × 2 locales = 44 flavours. Ship gate: pooling complete.
- **M3 — Relics** (tasks 15–18, R1 coord). 15–20 Relics. ~20 items × 2 locales = 40 flavours. Ship gate: full item catalogue has lore.

Total estimated flavour lines: ~140 EN + 140 SCS. Within writing budget of one intense content sprint per milestone.

---

## M1 — Weapons + evolutions + permanent upgrades

### Task 1: Schema + parity fence extension

**Files:** `src/data/weapons.ts`, `src/data/upgrades.ts`, `src/data/permanentUpgrades.ts`, `src/core/i18n.locale.test.ts`.

- [ ] **Step 1:** Failing test: `WeaponDef.flavourKey` type required.
- [ ] **Step 2:** Add `flavourKey` field to each data shape. Default empty string initially.
- [ ] **Step 3:** Extend parity fence to enforce `*.flavour` keys have SCS pairs.
- [ ] **Step 4:** Green.
- [ ] **Step 5:** Commit: `feat(lore): schema extensions + parity fence scope`.

### Task 2: UI rendering in UpgradeCardsUI

**Files:** `src/ui/UpgradeCardsUI.ts`.

- [ ] **Step 1:** Failing smoke test: card displays `flavourKey` text in italic, lighter weight, below `effectKey`.
- [ ] **Step 2:** Implement rendering.
- [ ] **Step 3:** Commit: `feat(lore): UpgradeCardsUI renders flavour text`.

### Task 3: Weapon flavour authoring — 8 weapons

**Files:** `src/core/i18n.ts` + `src/core/i18n.scs.ts`.

- [ ] **Step 1:** Author 8 EN weapon flavours per spec §3 (Thistle Shot, Bagpipe Blast, Caber Toss, Scotch Mist, Haggis Hurler, Nessie's Tentacle, Claymore, Bagpipes).
- [ ] **Step 2:** Pair 8 SCS. Scots voice.
- [ ] **Step 3:** Native-speaker review. Cross-reference audit (each item name-drops at least one other item's subject).
- [ ] **Step 4:** Parity fence green.
- [ ] **Step 5:** Commit: `content(lore): 8 weapon flavours (EN + SCS)`.

### Task 4: Evolution flavour authoring — 7 evolutions

- [ ] **Step 1:** Author 7 EN flavours for Thistle Storm, Highland Fling, Highland Games, The Haar, Haggis Cannon, Nessie Unleashed, William Blade.
- [ ] **Step 2:** Pair SCS.
- [ ] **Step 3:** Burns-citation audit: William Blade references Wallace via the Claymore chain. Cross-reference web present.
- [ ] **Step 4:** Commit: `content(lore): 7 evolution flavours`.

### Task 5: Permanent upgrade flavour authoring — 13 upgrades

- [ ] **Step 1:** Author 13 EN flavours for thick_hide, strong_legs, sharp_thistles, lucky_heather, drift_control, battle_hardened, magnetic_personality, extra_choice, weapon_training, crit_power, xp_boost, lucky_start, natural_recovery.
- [ ] **Step 2:** Pair SCS.
- [ ] **Step 3:** Per-upgrade: philosophical / generational voice (Gran's-wisdom pattern).
- [ ] **Step 4:** Commit: `content(lore): 13 permanent-upgrade flavours`.

### Task 6: Reviewer voice pass

- [ ] **Step 1:** Writer reviews all 28 flavours aloud, checks voice consistency.
- [ ] **Step 2:** Native Scottish-speaker reviews for tonal correctness.
- [ ] **Step 3:** Commit fixes if any.

### Task 7: Cultural / historical accuracy pass

- [ ] **Step 1:** Verify every historical reference against `CULTURAL_SENSITIVITIES_RESEARCH.md` (Wallace, Bannockburn, Falkirk, Culloden should be framed respectfully).
- [ ] **Step 2:** Verify every direct Burns quotation against authoritative edition.
- [ ] **Step 3:** Commit any corrections.

### Task 8: M1 ship gate

- [ ] 28 items have complete flavour in EN + SCS.
- [ ] Parity fence green.
- [ ] UI renders correctly at `uiScale 0.8× and 1.4×`.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(lore): M1 — weapons + evolutions + permanent upgrades flavour complete`.

---

## M2 — Passives + variants

### Task 9: Passive flavour authoring — 9 passives

- [ ] **Step 1:** Author 9 EN flavours for sporran, whisky_flask, kilt, tam_o_shanter, irn_bru, loch_water, thistle_crown, highland_shield, tartan_sash.
- [ ] **Step 2:** Pair SCS.
- [ ] **Step 3:** Per-passive: domestic-mystical (croft-corner found objects).
- [ ] **Step 4:** Reviewer pass.
- [ ] **Step 5:** Commit: `content(lore): 9 passive flavours`.

### Task 10: Variant flavour authoring — 13 variants (V2 coord)

- [ ] **Step 1:** Author 13 EN flavours for classic, moor_runner, iron_belly, glen_forager, surefoot, pipe_breath, wee_ghostie, laird, glaswegian, cailleach, doric_quinie, peerie_shetlander, burns_wee_beastie.
- [ ] **Step 2:** Pair SCS per variant's voice register. Cailleach uses Gaelic-inflected; Doric uses Doric vocabulary; Burns's Wee Beastie is Burns-citational.
- [ ] **Step 3:** Native-speaker review per variant voice.
- [ ] **Step 4:** Burns citations verified.
- [ ] **Step 5:** Commit: `content(lore): 13 variant flavours`.

### Task 11: Specific Burns-citation audit

- [ ] **Step 1:** Burns's Wee Beastie variant flavour must include at least one direct Burns quotation.
- [ ] **Step 2:** Source-verify against `The Canongate Burns` or equivalent authoritative edition.
- [ ] **Step 3:** Commit if corrections.

### Task 12: Gaelic-phrase review

- [ ] **Step 1:** Cailleach, Peerie Shetlander, any Gaelic/Shetlandic fragments reviewed by native speaker.
- [ ] **Step 2:** Commit.

### Task 13: Reviewer voice consistency pass

- [ ] **Step 1:** Writer re-reads all 22 flavours.
- [ ] **Step 2:** Commit fixes.

### Task 14: M2 ship gate

- [ ] 22 passive + variant items have complete flavour.
- [ ] Parity fence green.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(lore): M2 — passives + variants flavour complete`.

---

## M3 — Relics (R1 coord)

### Task 15: Verify R1 Relic flavours are in place

**Files:** `src/data/relics.ts`, `src/core/i18n.ts`, `src/core/i18n.scs.ts`.

- [ ] **Step 1:** Failing test: every Relic has `flavourKey` populated with EN + SCS.
- [ ] **Step 2:** Audit R1's shipped flavours against C2 standard (implied history, cross-references, Dark-Souls tone).
- [ ] **Step 3:** Revise if any are mechanical rather than mythic.
- [ ] **Step 4:** Commit: `content(lore): Relic flavour audit + revisions`.

### Task 16: Relic cross-reference audit

- [ ] **Step 1:** Map Relic flavours against weapon/passive chain: Bronze Clasp → plaid at Bannockburn → Wallace Sword's Falkirk.
- [ ] **Step 2:** Ensure ≥1 cross-reference per Relic.
- [ ] **Step 3:** Commit revisions.

### Task 17: Cultural-sensitivities pass

- [ ] **Step 1:** Per `CULTURAL_SENSITIVITIES_RESEARCH.md`, review any Relic flavour that references historical trauma (Glencoe, Clearances, Culloden) for Grave tonal register only.
- [ ] **Step 2:** Commit any corrections.

### Task 18: M3 ship gate + launch

- [ ] All 15–20 Relics have complete, voice-consistent, culturally-audited flavour.
- [ ] Parity fence green.
- [ ] Bundle delta ≤ +3 KB gzip (verified).
- [ ] `npm run ci:all` green.
- [ ] Ship commit: `feat(lore): C2 — weapon lore pass complete (Dark-Souls-style flavour across all items)`.

---

## Final ship gate (C2 complete)

- [ ] All 40–50 items (weapons, evolutions, passives, upgrades, variants, relics) have `flavourKey` populated in EN + SCS.
- [ ] Parity fence green.
- [ ] No historical / cultural inaccuracy.
- [ ] No Burns misattribution.
- [ ] UI renders flavour subordinate to mechanical text at all uiScales.
- [ ] Bundle delta ≤ +3 KB gzip.
- [ ] Ship commit.

---

## Authoring discipline (reminder)

- **One writer** for the whole pass. Voice drift ruins the effect.
- **Two-hour block per 10 items.** Write, step away, return, edit.
- **Read-aloud pass** after each block.
- **Cross-reference web** — every item name-drops ≥1 other item's subject.
- **Ambiguity is a feature.** 30% unsaid.
- **Never over-explain.**
- **Consistent voice** — formal-mythic-sad; no conversational; no contemporary.

---

## Risk-watch

| Signal | Response |
|---|---|
| Voice drift across items | Single writer. Two-pass review. |
| Historical inaccuracy | Cultural review gate; `CULTURAL_SENSITIVITIES_RESEARCH.md` as checklist. |
| Burns misquotation | Source-verified before merge. |
| Gaelic / Shetlandic fragments unreviewed | Native-speaker review = merge-blocker. |
| SCS translations thin / literal | Writer paraphrases in Scots idiom, not word-for-word. |
| Flavour overpowers mechanical info visually | UI tests at all uiScales; mechanical text remains primary. |
| Some items (e.g., Cailleach-connected Relics) read triumphalist | Grave tonal register check per CULTURAL_SENSITIVITIES. |
