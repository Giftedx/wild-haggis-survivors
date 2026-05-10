# System Prompt: Task 04 - First-Run Drift Micro-Practice

> **Status as of 2026-04-26 (follow-up closure):** Pure helpers + scene integration BOTH shipped.
>
> **Helpers** at `src/systems/driftPractice.ts` (12s cap, 36px radius, 96px distance) — `shouldStartDriftPractice` / `resolveDriftPracticeStep` / `driftPracticeMarkerFor`. 10 tests in `driftPractice.test.ts` cover gate matrix, cap-inclusive timeout, radius-inclusive complete, skip priority over hit/timeout, full 100ms-poll walk, mid-window walk-into-marker completion.
>
> **Scene integration** in `src/systems/TutorialSystem.ts` — `scheduleDriftHintIfNeeded` now gates via `shouldStartDriftPractice`, calls `showDriftPractice` after 3s on the raw ticker. `showDriftPractice` spawns `drift-practice-banner` (viewport-anchored, depth 85, hidden under modals via `setAmbientBannersVisible`) and `drift-practice-marker` (world-space ring at `driftPracticeMarkerFor` offset, depth 55) — both `setName`'d so the e2e + reflow smokes can find them. Tick handler subscribes to `Phaser.Scenes.Events.UPDATE`, reads player↔marker distance + elapsed wall-clock, resolves outcome via `resolveDriftPracticeStep`, dismisses on any non-`continue` result. Skip handlers wire BOTH `document.keydown` (Enter / Space / Escape) AND `scene.input.pointerdown` (canvas tap) to set `skipRequested` — closes the touch-primary skip path follow-up. Persists `hasSeenDriftTutorial: true` on dismiss. `dispose()` cleans tickers, key handler, pointer handler, marker, banner — including in-flight tweens via the `dismissDriftBannerRef` retain pattern.
>
> **i18n** — `tutorial.drift_practice` shipped EN + SCS (Hearth register, mentions Enter / tap to skip).
>
> **Removed** — the old curved-arrow hint (`drawCurvedArrow`, `dismissDriftHint`, `driftArrow` field) since the marker-based practice replaces it. Single source of truth for the drift-teach moment.
>
> Verify: `grep -n driftPractice src/systems/TutorialSystem.ts`, `npm test -- src/systems/driftPractice.test.ts`, `npm run build`.

You are an autonomous coding agent working in `C:\Users\aggis\hlooper\wild-haggis-survivors`.

## Mission

Teach the signature haggis drift feel during the first playable run so new players understand that the slight turn/slide is intentional, not broken input. Ship a small, kind, skippable FTUE slice that does not slow returning players.

## Required Context

Read these before editing:

- `AGENTS.md`
- `docs/DESIGN_SOUL.md`, especially Warmth Audit and Great Moment Recipe
- `docs/VOICE_CARD.md`, especially Hearth register
- `docs/research/GAME_FEEL_RESEARCH.md` sections on game feel and teaching
- `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` T213 and T214
- `src/systems/TutorialSystem.ts`
- `src/entities/Player.ts`
- `src/scenes/GameScene.ts` relevant tutorial/startup hooks
- Existing tests for TutorialSystem, first-run Croft disclosure, and input

## Scope

Implement a 15-30 second maximum micro-practice or compact guided hint sequence. Examples:

- a simple target ring before full combat starts,
- a one-time drift hint with a visible path marker,
- or a short "curl around the marker" practice beat.

It must be skippable or non-blocking, and it must not replay for established players.

## Constraints

- Keep copy short and warm.
- Do not make a long tutorial scene.
- Do not break countdown, replay, seed determinism, or first-run progressive disclosure.
- Respect reduced motion and input method differences.
- If you add save/settings fields, use existing migration/coercion patterns.

## Deliverables

1. First-run-only drift teaching behavior.
2. Persistence so it does not repeat after completion or skip.
3. Tests for gating and completion logic.
4. E2E smoke if the behavior is visible in browser flow.
5. i18n keys in EN and SCS if player-facing copy is added.

## Verification

Run at least:

```bash
npm test
npm run build
```

Run targeted TutorialSystem/input tests and any new E2E if added.

## Final Report

Report the teaching flow, how it is gated, tests run, and any playtest questions left open.

