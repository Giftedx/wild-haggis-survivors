# OPEN_QUESTIONS.md

Stakeholder decisions blocking work. Each entry: what's blocked, what we know, what decision is needed, where to record the answer once made.

> **2026-05-08 audit baseline.** Questions surfaced during the doc-restructure pass. Not all are urgent; the **Priority** column says which need answers before what.

---

## Open questions

### Q1 — Status-tracker placement convention

**Blocks:** future status-tracker authoring (low-stakes; status quo works).

**Context:** `docs/INDEX.md` originally promised every domain tracker under `docs/status/<domain>/`. In practice, ~6 trackers cited from code/tests stayed at `docs/<NAME>.md` (e.g. `A1_PEAT_AUDIT.md`, `MOBILE_DEVICE_TEST_MATRIX.md`). The 2026-05-08 audit codified the split in [`DOC_CONVENTIONS.md`](DOC_CONVENTIONS.md) §"Status trackers": code-cited at root; doc-only at `status/<domain>/`.

**Decision needed:** confirm the split rule, or commit to fully migrating to `status/<domain>/` (which means updating the ~22 files that reference doc-root paths — see audit summary).

**Recommendation:** keep the split. Migration ROI is low; the rule is now documented.

**Priority:** Low. Leave unless the split causes confusion.

---

### Q2 — `.ralph/` retention

**Blocks:** repo cleanup hygiene.

**Context:** `.ralph/` holds the ralph-loop plugin's working brief, frozen at loop 92 (2026-04-14). Project moved to superpowers + dispatch workflows; ralph hasn't been re-run. Files still loaded by the ralph plugin if invoked.

**Decision needed:** Keep `.ralph/` (status quo)? Move to `archive/` (clean root)? Delete entirely (commit to never running ralph)?

**Recommendation:** keep, with the "frozen" notice now added to `AGENT.md` and `strategy.md`. Cost of keeping is low; deleting risks breaking ralph plugin invocation if you ever want it back.

**Priority:** Low.

---

### ~~Q3~~ — `fix_plan.md` at root

**Resolved 2026-05-08:** deleted per the recommendation. Every item was checked off; full content remains in git history. `.ralph/fix_plan.md` stayed in place (frozen with the rest of `.ralph/`). No other doc referenced the file.

**Original context:** `fix_plan.md` at repo root had all 6 P1/P2 items checked off; there's also an older `.ralph/fix_plan.md`. Recommendation was delete — done.

---

### ~~Q4~~ — P3 cloud-save backend selection

**Resolved 2026-05-09 (architectural):** Lead-dev ratification — **Cloudflare Workers + D1 + magic-link via Resend**. ADR-0006 renamed `.draft.md` → `.md`, Status flipped to Accepted. Decision matrix evaluated 6 options against 10 constraints; D1 won every distinguishing cell. The `cloudflare/` Worker scaffold + `server/worker/` handler tests stand. Remaining humans-in-the-loop work (privacy-policy text at `/privacy.html`, GDPR controller legal name + UK address, Resend account creation + Cloudflare D1 provision) is non-architectural and stays in P3's blocked-on-human stub. P3 NOT picked as next flagship — see Q2 below.

**Original context preserved:** Worker + D1 backend prototype shipped 2026-04-27 via top-10 batch. Conflict-resolution UX spec drafted at `docs/superpowers/specs/2026-04-26-cloud-save-conflict-ux-design.md`. ADR-0006 was draft; decision matrix at `docs/P3_BACKEND_DECISION_MATRIX.md`.

---

### Q5 — Native-speaker review for Doric / Shetlandic / Gaelic

**Blocks:** V2 Variants ship-quality bar (variants live but voice not native-reviewed). C2 Lore native review on 8 Gaelic banter leaves. Cross-cuts B5 Phase 3 Edinburgh rune.

**Context:** Variants pack (V2) shipped 2026-04-24 with author-only voice. C2 Lore truth-up 2026-04-26. Reviewer-facing entry at `docs/status/cultural/CULTURAL_REVIEW_PACKET.md`. Three review briefs:
- `docs/C2_DIALECT_REVIEW.md` — Doric + Shetlandic
- `docs/C2_BURNS_PROVENANCE.md` — Burns Kinsley + Canongate
- 8 Gaelic banter leaves (per B1 Phase 4 followup memory)

**Decision needed:** Engage native-speaker reviewers (Doric, Shetlandic, Burns Canongate, Gaelic). Logistics + budget. Not Claude's call.

**Priority:** Medium-high — required before public ship; not blocking dev work today.

---

### Q6 — A1 PEAT audit (human-gated)

**Blocks:** A1 Accessibility foundation closing M1.

**Context:** A1 M2–M6 shipped 2026-04-24. M1 PEAT photosensitivity audit cannot be automated — it needs the PEAT desktop tool with a human reviewer. Audit doc + 25-row matrix at `docs/A1_PEAT_AUDIT.md`. Followup checklist at `docs/superpowers/plans/2026-04-24-a1-m5-manual-playtest-followups.md` (F1–F4).

**Decision needed:** Schedule the PEAT pass. Possibly engage a third-party a11y auditor.

**Priority:** Medium — blocks A1 closeout and any "Steam accessibility tag" claim.

---

### Q7 — Mobile device test matrix (W95)

**Blocks:** W95 Thumb-zone mobile rework progressing past Phase 0.

**Context:** Phase 0 mobile safe-area shipped 2026-04-22. Test matrix at `docs/MOBILE_DEVICE_TEST_MATRIX.md` lists 12 device rows (T203 charter). Hardware not yet sourced.

**Decision needed:** Source devices (loan, BrowserStack subscription, or scope down to a smaller representative matrix).

**Priority:** Low until W95 is the next picked flagship.

---

### ~~Q8~~ — Next flagship slot (currently empty)

**Resolved 2026-05-09:** Lead-dev decision — **declare polish / content phase**. No flagship picked. Rationale:
- A1 PEAT (Q6), native cultural review (Q5), W95 mobile-device matrix (Q7), and P3 humans-in-the-loop legal text are all gated on real human action that the solo dev cannot self-execute.
- Today's mechanics ship sprint (12 features) shows momentum is in mechanics + content density, not flagship-tier infrastructure.
- Codebase restructure shipped Phases 0–7 on the same day; the ≤1200 GameScene facade target is explicitly out-of-scope and would require disproportionate refactor to pass.
- A flagship without a clear non-goals + kill criterion is an idea, not a flagship (per `HUGE_INITIATIVES_MASTER_PLAN.md` rule of thumb).

**Re-open trigger:** any of (a) Q4 humans-in-the-loop work clears + decision to ship cloud saves, (b) Q5/Q6 native review or PEAT delivers + opens an A1 closeout flagship slot, (c) external stakeholder ask raises a new flagship candidate, (d) the polish phase starts feeling like drift rather than productive maintenance.

**Original context preserved:** Of the 2026-04-23 cohort (10 flagships), all shipped by 2026-04-26 (with A1 partial — M1 PEAT human-gated). Master plan rule is "one flagship at a time"; remaining candidates: W71 full rig (Phase 1 partial), W95 mobile (gated by Q7), W27 Phase 2 (cross-cuts capture work), P3 cloud (architectural ratified Q4; legal/ops humans-in-the-loop remain).

---

### Q9 — Public ship decision (timeline + venue)

**Blocks:** prioritisation between polish and net-new content.

**Context:** Project is in steady-state for solo-dev. Cloudflare Pages live build at `wild-haggis-survivors.pages.dev`. Memory `reference_deploy_cloudflare` notes manual `wrangler` deploys. No GitHub remote integration set up.

**Decision needed:** Steam? itch.io? Browser-only? Native bundle? Date target?

**Priority:** Low — but informs Q5 (review urgency), Q6 (PEAT urgency), Q7 (mobile urgency), Q8 (flagship choice).

---

## How to close a question

When the user provides an answer:

1. Update the matching entry to `### ~~Q<n>~~ — <title>` (strikethrough).
2. Add a `**Resolved YYYY-MM-DD:**` block with the answer.
3. If the answer requires code/doc work, file the work as a charter under `docs/dispatch/YYYY-MM-DD/` or as a row in [HUGE_INITIATIVES_MASTER_PLAN.md](HUGE_INITIATIVES_MASTER_PLAN.md).
4. If the answer ratifies an ADR, flip the ADR Status from Proposed/DRAFT to Accepted.

When new questions surface, append to this file. Don't delete closed questions for at least one quarter — they're useful as decision history.
