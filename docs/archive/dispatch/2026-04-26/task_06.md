# System Prompt: Task 06 - Cultural Review Gating and Reviewer Packet

> **Status as of 2026-04-26 (post-audit):** Reviewer packet shipped at `docs/status/cultural/CULTURAL_REVIEW_PACKET.md`. Machine-readable line manifest at `docs/status/cultural/CULTURAL_REVIEW_STATUS.json`. CI guard at `src/data/culturalReviewStatus.test.ts` fails if any gate is changed to `ship_release` without `status: approved` AND non-empty `reviewEvidence`. Four gates currently `blocked_until_review`: `doric_quinie_dialect`, `peerie_shetlander_dialect`, `burns_canongate_editorial`, `gaelic_cailleach_sensitivity`. C2 audit docs (`C2_DIALECT_REVIEW.md`, `C2_BURNS_PROVENANCE.md`, `C2_VOICE_AUDIT.md`, `BANTER_GAPS.md`) cross-link the packet as the single SOT for human review.
>
> **Do NOT change `releaseDecision` to `ship_release` without human review evidence.** Adding new gated lineKeys without their EN+SCS pair will fail the existing parity fence.
>
> Verify before edit: `npm test -- src/data/culturalReviewStatus.test.ts`.

You are an autonomous coding agent working in `C:\Users\aggis\hlooper\wild-haggis-survivors`.

## Mission

Make the remaining cultural review gates explicit, enforceable, and easy for a human reviewer to complete. Focus on Doric, Shetlandic, Gaelic fragments, Burns/Canongate sensitivity, and any Scottish-content ethics risks surfaced by the docs.

## Required Context

Read these before editing:

- `AGENTS.md`
- `docs/VOICE_CARD.md`
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md`
- `docs/research/SCOTTISH_RESEARCH.md`
- `docs/research/SCOTTISH_RESEARCH_DEEP.md`
- `docs/status/cultural/C2_DIALECT_REVIEW.md`
- `docs/status/cultural/C2_BURNS_PROVENANCE.md`
- `docs/status/cultural/C2_VOICE_AUDIT.md`
- `docs/status/banter/BANTER_GAPS.md`
- `docs/superpowers/plans/2026-04-24-v2-variants-followups.md`
- `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` T211

## Scope

Create an enforceable release-review packet. Good outcomes include:

- a single reviewer-facing packet with all lines needing human review,
- metadata for review status,
- tests that fail if known gated content is marked release-ready without review,
- or a clear feature gate for unreviewed variant/copy surfaces.

Do not rewrite dialect content yourself beyond mechanical organization unless the docs already authorize the exact change.

## Constraints

- Do not invent native-speaker approval.
- Do not flatten regional voice into generic Scots to avoid review unless the prompt evidence supports that product decision.
- Keep reviewer context respectful and specific.
- Avoid adding new culturally sensitive copy.

## Deliverables

1. A new or updated review packet under `docs/`, for example `docs/status/cultural/CULTURAL_REVIEW_PACKET.md`.
2. A machine-readable or testable review-status source if useful.
3. Tests or release-check documentation that prevents accidental ship of unreviewed gated content.
4. Updates to existing review docs so there is one clear source of truth.

## Verification

Run at least:

```bash
npm test
npm run build
```

If you add only docs and tests are not logically affected, still run the required project commands before final status.

## Final Report

Report what is gated, what can ship today, what requires which reviewer, tests run, and any unresolved cultural questions.

