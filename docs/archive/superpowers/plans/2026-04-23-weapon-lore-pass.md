# C2 — Weapon lore pass implementation plan

> **STATUS:** M1 content SHIPPED 2026-04-24. 41 flavour leaves live across EN + SCS (8 weapons, 7 evolutions, 9 passives, 17 permanent upgrades). Parity fence `src/data/flavour.test.ts` enforces presence in both locales. UI render (ShopScene + PauseMenu hover panels) deferred to **M1.5 followup** — see bottom of file. Variants (14) authoring pending M2. Relics (18, already shipped via R1) C2-standard audit pending M3. External review gates (Scottish-native writer, Burns citation audit, Gaelic-phrase review) remain open per `CULTURAL_SENSITIVITIES_RESEARCH.md`.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. However — this plan is *mostly content authoring*; the subagent-driven flow applies to the data-wiring (adding `flavourKey` fields) + UI rendering; the *prose itself* is hand-authored by a writer per the discipline below.

**Goal:** Rewrite every weapon / passive / evolution / relic / permanent-upgrade / variant description with Dark-Souls-style implied-history flavour text per `docs/superpowers/specs/2026-04-23-weapon-lore-pass-design.md`. ~35–50 items depending on parallel flagship progress. 3 content-sprint milestones.

**Architecture:** Pure content authoring into existing i18n files. M1 shipped pure-i18n (no data-type `flavourKey` field — lookup is deterministic via `t('weapon.{key}.flavour')` etc., guarded by `src/data/flavour.test.ts`). UI rendering shows flavour text in italic, subordinate to mechanical text. No system changes required. Minimal engine work — the discipline is writing.

**Tech Stack:** TypeScript strict, Phaser 3.90+. Content tooling via existing i18n + parity fences.

**Commit cadence:** One commit per pool (e.g., all 8 weapons at once; all 7 evolutions at once). Each commit includes EN + SCS together. `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

**Branch:** `master`.

**Guardrails on every task:**
- Parity fence (`ui.banter.*` scoped for banter; `src/data/flavour.test.ts` scoped for flavour).
- Scottish-native reviewer + Burns-quotation source verification per `CULTURAL_SENSITIVITIES_RESEARCH.md`.
- No marketing voice. No factual errors. Voice consistency per writer.
- `npm test` green after each commit.
- `npm run lint` after multi-file changes.

---

## File structure

### New files

- `src/data/flavour.test.ts` — Vitest fence asserting every weapon/evolution/passive/permanent-upgrade key resolves a non-empty flavour leaf in EN and SCS. Replaces the proposed schema-level `flavourKey` field with a lookup + test combination.

### Modified files

| Path | Change | Status |
|------|--------|--------|
| `src/core/i18n.ts` | Added `weapon.*.flavour`, `evolution.*.flavour`, `permanentUpgrade.*.flavour`, new top-level `passive.*.flavour`. | ✅ M1 |
| `src/core/i18n.scs.ts` | Matching SCS pairs. | ✅ M1 |
| `src/data/flavour.test.ts` | Presence + parity fence. | ✅ M1 |
| `src/core/i18n.ts` (M2) | Variant lore (14 variants, augment existing `variant.*.flavor` tagline with additional Dark-Souls-style lore if scope expands — or re-voice the tagline field in-place). | ⏳ M2 |
| `src/data/relics.ts` / `src/core/i18n.ts` (M3) | R1 shipped with Dark-Souls-tier flavour already — M3 is an audit pass, not new authoring. | ⏳ M3 |
| `src/ui/UpgradeCardsUI.ts` | Render `flavour` in italic / smaller / lighter font, below `effect`. **Skipped in M1** — card layout is cramped (fixed tile width + desc font already auto-shrinks 14→11 to fit body). Anti-pattern per spec §7 "flavour overpowers mechanical info visually". Defer to M1.5 when space budget allows. | ⏳ M1.5 |
| `src/scenes/ShopScene.ts` | Hover-triggered flavour panel in the footer area (y=520–548 currently empty). | ⏳ M1.5 |
| `src/scenes/game/PauseMenu.ts` | Flavour in inventory tab via hover tooltip. | ⏳ M1.5 |

---

## Milestone plan

- **M1 — Weapons + evolutions + permanent upgrades + passives** — SHIPPED 2026-04-24. Core weaponry + meta-shop + passive curios. 41 items × 2 locales = 82 flavours.
- **M1.5 — UI render (ShopScene + PauseMenu)** — pending. Hover panel design so flavour reveals on demand without displacing mechanical descriptions.
- **M2 — Variants (14)** — 14 items × 2 locales. Cailleach uses Gaelic-inflected; Doric uses Doric vocabulary; Shetlander uses Shetlandic; Burns's Wee Beastie is Burns-citational.
- **M3 — Relics audit (18, R1 coord)** — R1 shipped with Dark-Souls-tier flavour; audit for voice consistency + cross-reference web against M1 lines (Wallace, Gran, Alloway, Burns, Culloden, Braemar, ceòl mòr, Urquhart).

Total shipped lines so far: **82** (41 items × 2 locales). Remaining: ~64 lines across variants + relic audit = **146 lines total** when the pass completes.

---

## M1 — Weapons + evolutions + permanent upgrades + passives (SHIPPED 2026-04-24)

### Task 1: Fence — flavour presence + locale parity

**Files:** `src/data/flavour.test.ts`.

- [x] **Step 1:** Create `src/data/flavour.test.ts` asserting every weapon/evolution/passive/permanent-upgrade key resolves a non-empty flavour leaf in EN and SCS. Uses `WEAPON_DEFS` / `PERMANENT_UPGRADES` / `EVOLUTION_RECIPES` / hardcoded `PassiveKey` list as source-of-truth.
- [x] **Step 2:** Chose pure-i18n over schema `flavourKey` field — simpler, no data-type churn, test enforces presence + parity in one file.
- [x] **Step 3:** Green (9/9 tests passing).

### Task 3: Weapon flavour authoring — 8 weapons

**Files:** `src/core/i18n.ts` + `src/core/i18n.scs.ts`.

- [x] **Step 1:** 8 EN weapon flavours per spec §3 (Thistle Shot, Bagpipe Blast, Caber Toss, Scotch Mist, Haggis Hurler, Nessie's Tentacle, Claymore, Bagpipes). Voice: martial-elegiac.
- [x] **Step 2:** 8 SCS pairs. "tha" (the), "bi" (by), "wi" (with), "fae" (from), "ower" (over), etc. per existing i18n.scs style.
- [ ] **Step 3:** Native-speaker review. Cross-reference audit already present (Viking/Killiecrankie, Braemar, Urquhart, Wallace/Falkirk, ceòl mòr).
- [x] **Step 4:** Parity fence green.

### Task 4: Evolution flavour authoring — 7 evolutions

- [x] **Step 1:** 7 EN flavours for Thistle Storm, Highland Fling, Highland Games, The Haar, Haggis Cannon, Nessie Unleashed, William Blade. Voice: legendary flourish.
- [x] **Step 2:** SCS pairs.
- [ ] **Step 3:** Burns-citation audit: William Blade references Wallace death in 1305 (factually correct). Thistle Storm references Alloway (Burns's birthplace — cross-ref with Burns variant). Cross-reference web present across 7 evolutions.

### Task 5: Permanent-upgrade flavour authoring — 17 upgrades

- [x] **Step 1:** 17 EN flavours for thick_hide, strong_legs, sharp_thistles, magnetic_personality, lucky_heather, drift_control, extra_choice, battle_hardened, weapon_training, crit_power, xp_boost, lucky_start, natural_recovery, revival, double_dash, treasure_magnet, dirk_hand. Voice: philosophical / generational (Gran's-wisdom pattern).
- [x] **Step 2:** SCS pairs.

### Task 9: Passive flavour authoring — 9 passives (folded into M1 from M2)

- [x] **Step 1:** 9 EN flavours for sporran, whisky_flask, kilt, tam_o_shanter, irn_bru, loch_water, thistle_crown, highland_shield, tartan_sash. Voice: domestic-mystical (croft-corner found objects).
- [x] **Step 2:** SCS pairs.
- [x] **Step 3:** Cross-reference web: kilt → Gran; tam_o_shanter → Burns + Alloway; highland_shield → Culloden targe; tartan_sash → Royal Stewart; thistle_crown → bairn of Thistle Shot.

### Task 6 + Task 7: External review gates (OPEN)

- [ ] **Task 6 Step 1:** Writer re-reads all 41 flavours aloud — voice consistency pass.
- [ ] **Task 6 Step 2:** Native Scottish-speaker review for tonal correctness (SCS idioms, Scots grammar).
- [ ] **Task 7 Step 1:** Verify every historical reference against `CULTURAL_SENSITIVITIES_RESEARCH.md` (Wallace, Falkirk 1298, Wallace death 1305, Culloden 1746, Killiecrankie 1689 — frame respectfully, no triumphalism).
- [ ] **Task 7 Step 2:** Verify any direct Burns quotation (none in M1 — Burns lore deferred to Burns's Wee Beastie variant, M2).

### Task 8: M1 ship gate

- [x] 41 items have complete flavour in EN + SCS.
- [x] Parity fence green (`src/data/flavour.test.ts` 9/9).
- [x] `npm run ci` green (lint + 3442 vitest + tsc + vite build).
- [x] Bundle delta: main ~+4 KB raw / ~+1.5 KB gzip; SCS chunk ~+4.5 KB raw / ~+1.5 KB gzip. Total ~3 KB gzip — within spec §8 budget.
- [ ] UI renders correctly at `uiScale 0.8× and 1.4×` — BLOCKED on M1.5 UI render.
- [x] Ship commit.

---

## M1.5 — UI render (pending)

ShopScene has an empty footer band at y=510–548 — ideal for a hover-triggered flavour line. PauseMenu's passive list block (line 301-310) can grow a tooltip on click/hover. UpgradeCardsUI at level-up is too cramped — skipped (anti-pattern risk per spec §7).

- [ ] ShopScene: on row hover, render `permanentUpgrade.{key}.flavour` in italic dusty-tan text at y=522, one-line max (truncate/wrap).
- [ ] PauseMenu: add a "hover for lore" tooltip to the passive summary block; renders `passive.{key}.flavour` under the mini-card.
- [ ] Consider adding weapon/evolution flavour to the Chronicle run-detail view (future).
- [ ] Add smoke tests: UI renders flavour at uiScale 0.8× / 1.4× without overlap.

---

## M2 — Variants (14 items)

### Task 10: Variant flavour authoring

- [ ] **Step 1:** 14 EN flavours for classic, moor_runner, iron_belly, glen_forager, surefoot, pipe_breath, laird, wee_ghostie, glaswegian, cailleach, anticlockwise, doric_quinie, peerie_shetlander, burns_wee_beastie. Variants already carry a short `variant.*.flavor` tagline — M2 either augments with a second lore field (`variant.*.lore`) or re-voices the tagline to Dark-Souls register. Decision: new `variant.*.lore` leaf, keep existing `flavor` tagline intact (don't break variant-panel render).
- [ ] **Step 2:** SCS pairs per variant's voice register.
- [ ] **Step 3:** Native-speaker review per variant voice.
- [ ] **Step 4:** Burns citations verified.

### Task 11: Burns-citation audit

- [ ] **Step 1:** Burns's Wee Beastie variant lore must include at least one direct Burns quotation (existing tagline already does — "Wee, sleekit, cow'rin, tim'rous beastie" from *To a Mouse*).
- [ ] **Step 2:** Source-verify against `The Canongate Burns` or equivalent authoritative edition.

### Task 12: Gaelic-phrase review

- [ ] **Step 1:** Cailleach, Peerie Shetlander fragments (Gaelic, Shetlandic/Norn) reviewed by native speaker.

### Task 13: Reviewer voice consistency pass

- [ ] **Step 1:** Writer re-reads all 14 flavours.

### Task 14: M2 ship gate

- [ ] 14 variants have complete lore.
- [ ] Parity fence (extend `flavour.test.ts` to include variants).
- [ ] `npm run ci:all` green.

---

## M3 — Relics audit (R1 coord)

### Task 15–18: Audit R1's shipped flavours against C2 standard

**Files:** `src/data/relics.ts`, `src/core/i18n.ts`, `src/core/i18n.scs.ts`.

- [ ] **Step 1:** Re-read all 18 relic flavours (R1 shipped) against C2 voice bar — implied history, cross-references to M1 lore (Gran, Bannockburn, Wallace, Alloway, Culloden, Braemar, ceòl mòr, Urquhart).
- [ ] **Step 2:** Revise any that read mechanical rather than mythic. Ensure ≥1 cross-reference per relic.
- [ ] **Step 3:** Cultural-sensitivities pass — Grave tonal register for any Glencoe/Clearances/Culloden reference.
- [ ] **Step 4:** Extend `flavour.test.ts` to include relics (R1 already has its own test at `src/data/relics.test.ts`; consolidate if possible).

---

## Final ship gate (C2 complete)

- [x] M1: 41 items EN + SCS.
- [ ] M1.5: UI render on Shop + Pause.
- [ ] M2: 14 variants EN + SCS.
- [ ] M3: 18 relics audited.
- [ ] Parity fence green across all pools.
- [ ] No historical / cultural inaccuracy.
- [ ] No Burns misattribution.
- [ ] Bundle delta ≤ +3 KB gzip total.
- [ ] Native-speaker review complete.
- [ ] Ship commit: `feat(lore): C2 — weapon lore pass complete`.

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
| Flavour overpowers mechanical info visually | UI tests at all uiScales; mechanical text remains primary. M1 skipped level-up cards for this reason. |
| Some items (e.g., Cailleach-connected Relics) read triumphalist | Grave tonal register check per CULTURAL_SENSITIVITIES. |
