# Prompt #8 — C2 Weapon Lore Pass Completion

## Goal

Complete the C2 weapon-lore pass started 2026-04-24. Memory: M1 + M1.5 + M2 + M3 shipped; 55 of the target 80–120 items have EN+SCS Dark-Souls-style implied-history lore (cross-referential, 2–3 sentences). Native + Burns review still open. Remaining: 25–65 items to lore (depending on final target), native-language audit, Burns Canongate cross-check, ShopScene hover render polish.

Estimated 1–2 person-weeks of authoring + audit + hookup.

## Why this is #8

`docs/HUGE_INITIATIVES_MASTER_PLAN.md` §C2 marks lore pass as A-tier polish. Players see this lore on hover in Almanac (#C1) + ShopScene + on weapon evolution prompts. Half-finished lore reads worse than no lore — a quarter of the inventory speaks like Dark Souls; the rest reads stat-sheet-flat. Closing C2 cleans that visible gap.

## Source documents

1. `docs/superpowers/specs/2026-04-23-weapon-lore-pass-design.md` — design spec.
2. `docs/superpowers/plans/2026-04-23-weapon-lore-pass.md` — execution plan.
3. `docs/HUGE_INITIATIVES_MASTER_PLAN.md` §C2.
4. `docs/research/NARRATIVE_RESEARCH.md` §3.3 (Dark Souls / Hollow Knight implied-history pattern).
5. `docs/VOICE_CARD.md` (lore voice register — quieter, more historic, sits between Hearth and Grave).
6. `docs/research/SCOTTISH_RESEARCH_DEEP.md` (full Scottish reference; cross-pulls per item).
7. `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` §11.2 Burns; rest as relevant.
8. `src/data/weapons.ts` — weapon data + lore field.
9. `src/data/permanentUpgrades.ts`, `src/data/relics.ts` (or wherever) — passives + relics need lore too.
10. ShopScene hover render — already shipped per memory ("ShopScene hover render"). Cross-check.

## Scope

### Phase 1 — Inventory census + target set
1. Pull a list of all current items across categories:
   - Weapons (8 base + 7 evolved = 15)
   - Passives (~7 paired + utility = ~10)
   - Relics (18 from R1, per memory)
   - Runes (30 from U1, per memory)
   - Permanent upgrades (count from `permanentUpgrades.ts`)
   - Variants (14 from V2, per memory — variants get lore in their unlock screens)
2. Mark each as **lored / not lored / partial** based on existing data.
3. Confirm target — `docs/HUGE_INITIATIVES_MASTER_PLAN.md` quotes 80–120 items. With shipped items 55, remaining is somewhere in 25–65. Decide a number based on which categories matter most (default: lore weapons → relics → variants → passives → runes → permanent upgrades, until 100 or full coverage).

### Phase 2 — Authoring
For each unlored item:
1. **2–3 sentence implied-history.** Avoid stat description; lore is "who made this, what they were doing, why it carries that name". Cross-reference other items where possible (one of the 7 evolution lores can refer to the partnered passive's lore; relics can refer to people/places already in Almanac).
2. **EN first, SCS overlay second.** Voice register sits in Grave-leaning Hearth — historic tone, gentle warmth, occasional dry remark.
3. **Cite sources.** For Burns-related items, reference `SCOTTISH_RESEARCH_DEEP.md` §6 Burns canon. For Highland Clearance items, reference §5. For Cailleach lore, §3.1.
4. **Cross-cultural sensitivity.** Highland Clearances + Culloden + religious sectarianism handled per `CULTURAL_SENSITIVITIES_RESEARCH.md`.
5. **Avoid contradictions** — keep a small ledger of established lore facts to prevent drift.

### Phase 3 — Native + Burns audit
1. **SCS native review.** Send Scots overlays to a Scots-fluent reviewer (memory: V2 native reviews and B1 Cailleach Gaelic review are open; coordinate same channels).
2. **Burns audit.** Burns canon items (Wee Beastie variant, any Burns weapon evolution, Burns Night-themed relics) — Burns Canongate or local Burns Suppers consultant audit.
3. **Doric / Shetlandic** if any new items reference those dialects — same gates as V2.

### Phase 4 — UI hookup
1. **ShopScene hover** — already shipped per memory; smoke-test all newly-added lore renders.
2. **Almanac entry** — C1 Almanac books cross-reference items; ensure new lore propagates to Beasties/Weys/Finds/Banter books.
3. **Level-up card hover** — lore peek on long-hover (or tap-and-hold mobile, per W95).
4. **Run-summary view** — items collected during run get a roll-call with one-line lore tease.

## Sub-tasks

1. Census + target-set decision.
2. Authoring batch 1 (10 items) → SCS overlay → review.
3. Authoring batch 2–6 (10 items each).
4. Cross-reference ledger → check no contradictions.
5. SCS native review send-out + 1-week wait.
6. Burns audit send-out + 1-week wait.
7. Cross-cultural sensitivity sweep against Cultural Sensitivities Research.
8. UI hookup smoke + visual regression.
9. Almanac propagation tests.
10. `npm run ci:all` green.
11. PR description cites NARRATIVE_RESEARCH §3.3 + Soul Check + Voice Card + cultural review sign-offs.

## Acceptance criteria

- All targeted item categories at full lore coverage.
- Bilingual parity fence green (every EN lore has SCS overlay).
- Native SCS review + Burns audit signed off in `docs/C2_LORE_REVIEW.md`.
- ShopScene + Almanac + level-up + run-summary all render new lore correctly.
- No contradictions per cross-reference ledger.
- Soul Check + Voice Card pass on every new entry.
- `npm run ci:all` green.

## Anti-patterns to avoid

- **Don't write stat-sheet-flat lore.** "This sword does fire damage" is not lore; "The smith of Glen Brittle dipped it in dragon's breath" is. Implied history > description.
- **Don't break voice consistency.** Lore voice is its own register — quieter, slower, more historic. Not Hearth banter, not Edge cynicism. See Voice Card "lore" section if it exists; if not, document the choice.
- **Don't reference unestablished lore.** Cross-reference only items + people + places already in Almanac + variants + Scottish Research. Don't invent a new clan unless it gets a lore entry too.
- **Don't bypass cultural review.** Burns + Highland Clearances + religious sectarianism are sensitive. Memory: V2 Burns Canongate audit was an explicit gate — same expectation here.
- **Don't put copy in code mid-PR.** All copy lives in `i18n.ts` / `i18n.scs.ts`. PR description is for review, not draft text.

## Verification path

```
npm run lint
npm run build
npm test                # banter + i18n + lore unit tests
npm run test:e2e        # smoke covering ShopScene + Almanac
npm run preview         # eyeball lore rendering across UI surfaces
```

Plus:
- Native SCS review sign-off `docs/C2_LORE_REVIEW.md`.
- Burns audit sign-off in same doc.
- Cross-reference ledger clean.

## CLAUDE.md gotchas relevant here

- **i18n parity fence.** New EN lore in `ui.lore.*` (or wherever) needs SCS overlay. Bilingual parity check covers this.
- **Lazy-load SCS.** Don't import `i18n.scs.ts` eagerly; `ensureLocaleReady('scs')` only.
- **ShopScene hover** is already shipped UI — don't redesign it; just add data.

## Soul checks

- Voice Card: lore voice register documented + applied. If Voice Card has no explicit "lore" register, this pass adds one.
- `DESIGN_SOUL.md` Warmth Audit on every entry. Even Grave-leaning lore should not slip into bleak.
- `NARRATIVE_RESEARCH.md` §3.3 — Dark Souls / Hollow Knight pattern: implication > exposition.
- `CULTURAL_SENSITIVITIES_RESEARCH.md` — every clan reference, every Highland Clearance allusion, every religious wink — passes the respect bar.

## Risk + descope levers

If review cycles are slow:
- Ship EN lore first under a "review pending" footer per item; SCS lands in follow-up PR.
- Coordinate Burns audit with B1 Phase 5 Burns Night pool review — same reviewer, same week.

If authoring slow:
- Drop coverage target to weapons + relics + variants only (~80 items). Defer passives + runes + permanent upgrades to a Phase 5 follow-up.
