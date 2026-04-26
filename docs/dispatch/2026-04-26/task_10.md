# System Prompt: Task 10 - Current-Run Identity and Clarity Panel

> **Status as of 2026-04-26 (post-audit):** Pause-menu run identity is now well populated. `src/scenes/game/pauseStats.ts` (`buildPauseStatsLines`) emits — under per-field thresholds so a fresh run stays uncluttered — time, kills+level, loadout, run gold, DPS, damage, streak, **act 2+, route picks, relics, variant, runes**. Vitest covers each gate. `PauseMenu`, `HUD`, and `UpgradeCards` consume the helper. **Still open:** GameOver / Chronicle parity (routes/relics/act/runes/variant on the run-summary card), and the optional HUD compact chip with expandable details.
>
> Verify before edit: `cat src/scenes/game/pauseStats.ts`, `npm test -- src/scenes/game/pauseStats.test`.

You are an autonomous coding agent working in `C:\Users\aggis\hlooper\wild-haggis-survivors`.

## Mission

Give players a concise way to understand "what changed this run" without opening docs: variant, curse, act, route picks, relics, runes, and other run-defining modifiers. This is a clarity task, not a new progression system.

## Required Context

Read these before editing:

- `AGENTS.md`
- `docs/DESIGN_SOUL.md`
- `docs/VOICE_CARD.md`
- `docs/research/GAME_FEEL_RESEARCH.md` and `docs/research/NARRATIVE_RESEARCH.md` relevant sections on clarity and loop-native narrative
- `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` T402 and T403
- Existing UI: `src/scenes/game/PauseMenu.ts`, `src/scenes/game/pauseStats.ts`, `src/ui/HUD.ts`, `src/scenes/GameOverScene.ts`, `src/scenes/gameOverFormatting.ts`
- Data sources: variants, curses, routes, relics, runes, run act state, run score state

## Scope

Pick one primary surface:

- Pause menu run identity panel,
- HUD compact chip with expandable details,
- GameOver summary improvements,
- or Chronicle/GameOver run-summary parity.

Use existing data. Do not add a new scene.

## Constraints

- Keep text short and scannable.
- Avoid clutter during combat.
- Respect EN/SCS i18n parity for any new player-facing strings.
- Do not expose internal IDs.
- If a field is empty/default, omit it rather than showing noise.

## Deliverables

1. One improved run-identity surface.
2. Pure formatting/layout helper tests where possible.
3. i18n EN and SCS keys for new copy.
4. Optional E2E or screenshot smoke if the UI is visible.

## Verification

Run at least:

```bash
npm test
npm run build
```

Run targeted UI/i18n tests for touched surfaces.

## Final Report

Report the player-facing surface improved, fields included/omitted, tests run, and follow-up clarity opportunities.

