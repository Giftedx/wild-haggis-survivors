# Prompt #6 — B1 Banter Density Push, Phase 4 + 5 (~390 leaves)

## Goal

Complete the B1 banter density initiative by authoring + wiring the remaining ~390 EN+SCS bilingual banter leaves across the pools that Phase 1–3 didn't cover. Memory: Phase 1+2+3 shipped 2026-04-23 (324 leaves: enemy_ambient + first_time + boss/evo wiring). Phase 4 was gated on Cailleach Gaelic native review; Phase 5 was coupled with E1 Seasonal Events (which then shipped 2026-04-24, so Phase 5 is now unblocked from the framework side).

Estimated 2–3 weeks of authoring + wiring + bilingual review + parity-fence verification.

## Why this is #6

`docs/HUGE_INITIATIVES_MASTER_PLAN.md` and `docs/research/ROGUELITE_RESEARCH.md` §1.6 mark banter density as a Tier-S feature distinguishing high-warmth roguelites (Hades has 21k voiced lines). WHS targets a hand-authored 600+ bilingual leaves. Without Phases 4+5, voice coverage is patchy at exactly the moments players notice (seasonal events, Gran's commentary, Cailleach encounters, Burns Night).

## Source documents

1. `docs/superpowers/specs/2026-04-23-banter-density-push-design.md` — design spec, all five phases.
2. `docs/superpowers/plans/2026-04-23-banter-density-push.md` — execution plan.
3. `docs/BANTER_GAPS.md` — pool-by-pool gap census.
4. `docs/BANTER_AUTHORING.md` — recipes + tone register guide.
5. `docs/VOICE_CARD.md` — voice registers, Do/Don't.
6. `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` §3.1 (Cailleach + Gaelic), §11.2 (Burns).
7. `src/data/banter.ts` — current bank.
8. `src/core/i18n.ts` + `src/core/i18n.scs.ts` — locale loader.
9. `src/core/i18n.locale.test.ts` — bilingual parity fence (EN→SCS for `ui.banter.*`). Adding any banter leaf without an SCS overlay fails CI.

## Scope

### Phase 4 — Cailleach pool + remaining priority-starved triggers
Per memory: gated on Cailleach Gaelic native review. Ship steps:
1. Author **Cailleach pool** — 20 EN + 20 SCS leaves. Themes: winter approach, snow / hag-stone, "muileachan" frost, mortality bite. Voice register: Edge / Grave per Voice Card. Anti-pattern: avoid pastiche; lean on `CULTURAL_SENSITIVITIES_RESEARCH.md` §3.1 for respectful mythological framing.
2. **Gaelic review.** Send Cailleach pool to a Gaelic-fluent reviewer (Sabhal Mòr Ostaig contact list, or local Gàidhlig society). 1-week review cycle. Merge changes; record sign-off in `docs/B1_GAELIC_REVIEW.md`.
3. **Remaining priority-starved triggers** from `BANTER_GAPS.md`:
   - **Gran commentary** pool: 40 EN + 40 SCS. Wire to Croft hub + drove returns + first-thing-in-the-morning hub visit. Hearth register, never patronising.
   - **Death reflections** pool: +30 EN + 30 SCS. Wire to GameOver scene per cause-of-death classifier (`src/core/deathCauseClassifier.ts`). Voice register varies by cause: combat death = Edge bite, hazard death = drier observation, boss death = honour-the-fight tone.
   - **First-time** pool: +30 EN + 30 SCS for any newly-shipped systems since Phase 3 (relics, almanac, runes, croft, seasonal). Wire to first-trigger-only events.

### Phase 5 — Seasonal pools (now unblocked)
1. **Seasonal pool** infrastructure — already exists per E1 ship; B1 fills it.
2. Author **60 EN + 60 SCS** seasonal leaves spread across the 4 first-class events:
   - **Burns Night** (Jan 18 – Feb 1) — 20 EN + 20 SCS. Address-to-a-Haggis citation pool (already in spec). Cite `SCOTTISH_RESEARCH_DEEP.md` §11.2 + Burns canon.
   - **Beltane** (May 1 ± 7d) — 12 EN + 12 SCS. Spring fire + cattle blessing tone.
   - **Lughnasadh / Lammas** (Aug 1 ± 7d) — 12 EN + 12 SCS. Harvest + craft fairs.
   - **Samhain** (Oct 31 ± 3d) — 16 EN + 16 SCS. Boundary thinning + ancestor recognition. Coordinate with C1 Almanac discovery banter.
3. **Variant-specific banter overlays** for any of the 15 variants whose voice/persona intersects a season — Burns Wee Beastie obviously matches Burns Night, Cailleach matches Samhain, Gran always matches Hogmanay (if we add that as a fifth event).

### Phase 6 (stretch — only if 4+5 ship clean) — Banter triggers + dynamic re-roll
Memory note: `src/data/banter.ts:1199, 1278` flag deferred trigger wiring per "Task 6 pattern". If time allows, close those.

## Sub-tasks

1. Pull current banter snapshot + `BANTER_GAPS.md` cross-check.
2. Phase 4 Cailleach authoring (1–2 days).
3. Phase 4 Gaelic review send-out + 1-week wait + merge.
4. Phase 4 Gran commentary authoring (1 day).
5. Phase 4 Death reflections authoring (1 day).
6. Phase 4 First-time pool authoring (1 day).
7. Phase 4 wiring — `src/data/banter.ts` entries + trigger dispatchers.
8. Phase 5 Burns Night authoring (1 day).
9. Phase 5 Beltane / Lughnasadh / Samhain authoring (1 day).
10. Phase 5 wiring + seasonal-pool override resolver (already in E1 — confirm).
11. EN→SCS parity fence run + fixes.
12. SCS→EN one-way subset run + fixes.
13. `npm test` smoke (banter unit + i18n smoke).
14. Soul + Voice card pass per pool.
15. Cite Gaelic + Burns review in PR description.

## Acceptance criteria

- ~390 new leaves bilingual across pools per design spec breakdown.
- Cailleach pool Gaelic-reviewed; sign-off recorded.
- Burns Night pool Burns-Canongate audited (gate; mark deferred if reviewer unavailable but keep authored).
- Bilingual parity fence green (`src/core/i18n.locale.test.ts`).
- Banter unit tests cover each new pool's trigger.
- Soul Check passed per `DESIGN_SOUL.md` (warmth + voice + tone).
- Each pool's Voice Card register documented in `docs/B1_PHASE_4_5_REGISTER_NOTES.md`.
- `npm run ci:all` green.

## Anti-patterns to avoid

- **Never write SCS as a "Scottish accent" English.** SCS is Scots — distinct language. Lean on `i18n.scs.ts` precedent + `BANTER_AUTHORING.md` lexical guide.
- **Never write Gaelic without review.** Memory: Cailleach pool gated specifically because pastiche risk is high.
- **Don't bypass the parity fence.** Adding an EN leaf without SCS will fail CI on the EN→SCS test for `ui.banter.*`. This is the discipline mechanism — don't disable it.
- **Don't reuse banter across triggers.** Each leaf marked single-trigger by default. Pool overflow comes from authoring, not recycling.
- **Don't put non-banter copy in this PR.** UI strings, error messages, settings — those live elsewhere. Stay in pool.

## Verification path

```
npm run lint
npm run build
npm test                # banter + i18n locale parity tests
npm run test:e2e        # banter trigger smoke specs
```

Plus:
- Native Gaelic review sign-off `docs/B1_GAELIC_REVIEW.md`.
- Burns Canongate / Burns Suppers consultation note `docs/B1_BURNS_REVIEW.md`.
- Voice Card pass sample (3 random leaves per pool checked against Do/Don't).
- Soul Check 6 questions.

## CLAUDE.md gotchas relevant here

- **i18n SCS lazy-load.** SCS is code-split via `ensureLocaleReady('scs')`. Don't import it eagerly — English-only players never download Scots. Tests cover this.
- **Bilingual parity fence.** Two fences: SCS→EN one-way subset, EN→SCS scoped to `ui.banter.*`. Adding banter requires both. CI catches.
- **Banter pool sizing.** Each pool's draw cadence already tuned; adding 30 leaves to a pool that draws every 8 minutes = ~4 hours before any leaf repeats. Don't over-add to pools that draw infrequently.

## Soul checks

- Voice Card: every leaf graded — Hearth or Edge per pool intent. Cailleach predominantly Edge / Grave; Gran Hearth; first-time hybrid; death reflections varies per cause; seasonal Hearth.
- `DESIGN_SOUL.md` Warmth Audit — for each pool, sample 3 leaves and ensure they pass warmth criteria. Cold or sneering leaves should be rare and intentional.
- `CULTURAL_SENSITIVITIES_RESEARCH.md` §3.1 — Cailleach is sacred-adjacent in Highland tradition. Tone respect, never mockery.

## Risk + descope levers

If Gaelic reviewer slow:
- Ship Phase 5 + non-Cailleach Phase 4 first; hold Cailleach pool back as separate PR pending review.

If word counts drift:
- Pool size targets are minima not maxima. If Burns reviewer recommends additions, add. If Gran pool overflows because authoring is fast, ship more.
