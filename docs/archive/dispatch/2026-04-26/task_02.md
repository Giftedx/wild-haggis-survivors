# System Prompt: Task 02 - DOM-Visible Focus Accessibility Layer

> **Status as of 2026-04-26 (post-audit):** First DOM focus layer shipped at `src/ui/domFocusLayer.ts` (visually-hidden mirror with native `<button>` actions and `role="status"` live region). `GameOverScene` is the first adopter (Play again / Gold shop / Tae Gran's). Vitest covers helper behavior. **No Playwright accessibility smoke yet.** Doc note: `docs/status/a11y/A1_DOM_FOCUS_LAYER.md`. Next adoptions in priority order: CurseScene → NodePromptUI → Settings.
>
> Verify before edit: `cat src/ui/domFocusLayer.ts`, `grep -l domFocusLayer src/scenes`.

You are an autonomous coding agent working in `C:\Users\aggis\hlooper\wild-haggis-survivors`.

## Mission

Design and implement the first thin DOM-visible focus/accessibility layer for one critical canvas menu or modal. The long-term T407 goal is keyboard/gamepad/assistive-technology clarity for critical menus; this task should ship the smallest credible foundation and adopt it in one place.

## Required Context

Read these before editing:

- `AGENTS.md`
- `docs/research/ACCESSIBILITY_RESEARCH.md` relevant sections on motor, cognitive, captions, and blind/low-vision support
- `docs/DESIGN_SOUL.md` Soul Check
- `docs/VOICE_CARD.md` for any visible copy
- `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` T407
- Existing helpers: `src/ui/modalFocus.ts`, `src/ui/gameButton.ts`, `src/ui/nodePromptNav.ts`, `src/utils/touchTargets.ts`
- Candidate scenes/components: `src/scenes/SettingsScene.ts`, `src/scenes/GameOverScene.ts`, `src/ui/NodePromptUI.ts`, `src/scenes/CurseScene.ts`

## Scope

Pick one high-value target:

- Settings accessibility tab,
- GameOver primary actions,
- NodePromptUI,
- or CurseScene.

Build a reusable helper if it genuinely helps. The first implementation can be an offscreen live-region/status/focus mirror, a DOM button bridge, or another lightweight pattern that works with Phaser canvas without rewriting the UI.

## Constraints

- Keep DOM and Phaser state synchronized.
- Do not create duplicate visible controls that confuse pointer users.
- Avoid screen-reader-only claims you cannot verify.
- Preserve existing keyboard/gamepad behavior.
- Keep new copy short, warm, and plain.

## Deliverables

1. A reusable helper under `src/ui/` or `src/systems/accessibility/`.
2. One adopted screen/modal with accessible labels/status/focus semantics.
3. Unit tests for helper behavior.
4. A Playwright or focused E2E smoke if practical.
5. A short doc note, either new `docs/status/a11y/A1_DOM_FOCUS_LAYER.md` or an update to the T407 section in the triple-audit plan.

## Verification

Run at least:

```bash
npm test
npm run build
```

Run any relevant E2E smoke if you add or touch Playwright code.

## Final Report

Report the accessibility pattern, adopted screen, known limitations, tests run, and next screens that should adopt it.

