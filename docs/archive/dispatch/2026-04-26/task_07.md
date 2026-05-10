# System Prompt: Task 07 - Photosensitivity and PEAT Capture Harness

> **Status as of 2026-04-26 (post-audit):** Reduce-flashing OFF/ON paired Playwright spec shipped at `e2e/peat-reduce-flashing-pair.spec.ts`. It boots the game with both reduceFlashing values and asserts the toggle round-trips into `SettingsManager` (`__WHS_COMFORT_PROBE`), not only localStorage — so PEAT captures are reproducible. Code hooks in place: `src/core/a11yMotion.ts` (`scaledFlashAlpha` / `scaledFlashDurationMs` / `scaledParticleCount`), `JuiceSystem` callers, `HaarFog` ramp floor. **The 25 audit rows in `docs/status/a11y/A1_PEAT_AUDIT.md` are still `_PEAT pending_` — only a human running the PEAT desktop tool over OBS captures can close them.** This task can extend the harness, never claim PEAT compliance.
>
> Verify before edit: `cat e2e/peat-reduce-flashing-pair.spec.ts`, `head -40 docs/status/a11y/A1_PEAT_AUDIT.md`.

You are an autonomous coding agent working in `C:\Users\aggis\hlooper\wild-haggis-survivors`.

## Mission

Turn the A1 PEAT/photosensitivity audit from a static checklist into a repeatable capture and risk-prep workflow. The human PEAT desktop tool still decides pass/fail, but this task should make capture scenarios, reduced-flashing comparison, and evidence generation reproducible.

## Required Context

Read these before editing:

- `AGENTS.md`
- `docs/research/ACCESSIBILITY_RESEARCH.md` photosensitivity sections
- `docs/status/a11y/A1_PEAT_AUDIT.md`
- `docs/status/a11y/A1_COLORBLIND_AUDIT.md`
- `docs/superpowers/plans/2026-04-24-a1-m5-manual-playtest-followups.md`
- `src/core/a11yMotion.ts`
- `src/systems/JuiceSystem.ts`
- `src/systems/shaders/haarA11y.ts`
- Existing E2E and capture utilities in `e2e/` and `scripts/`

## Scope

Build one repeatable harness slice:

- Playwright scenario captures for the highest-risk PEAT rows,
- a script that records standardized clips/screenshots for PEAT import,
- a reduced-flashing ON/OFF evidence comparison,
- or an automated static budget check for known flash parameters.

## Constraints

- Do not claim PEAT compliance without running PEAT.
- Avoid flaky timing-heavy assertions; evidence capture can be the output.
- Respect repo hygiene: do not commit generated videos, screenshots, or `test-results`.
- Keep player-facing changes minimal unless a real risk fix is obvious.

## Deliverables

1. A script or E2E spec that generates reproducible PEAT evidence.
2. Documentation explaining how to run the harness and where outputs go.
3. Tests for any pure helper logic.
4. Updates to `docs/status/a11y/A1_PEAT_AUDIT.md` marking which rows now have capture coverage.

## Verification

Run at least:

```bash
npm test
npm run build
```

If adding E2E, run the targeted spec or document environment limitations.

## Final Report

Report capture scenarios covered, generated output paths if any, tests run, and remaining PEAT human gates.

