# System Prompt: Task 03 - Assist Mode Runtime Wiring and Unhide Decision

> **Status as of 2026-04-26 (post-audit):** Wired effects in working tree: invincibility (`PlayerHitResolver` + `HazardZones`), extended post-dash iframes (`Player`), extended combo window (`JuiceSystem`). Settings exposes a single `Off → Timing → Invincible` preset row at `src/scenes/settingsAssistMode.ts` — only fully-wired effects are user-visible; hidden `assistModeGameSpeed` is reset to 1 on cycle. Replay-blob snapshot helper at `src/replay/assistReplaySnapshot.ts` captures assist + comfort fields into v2/v3 blobs. **Game speed remains intentionally hidden** (replay determinism + timeScale ladder still TBD). Doc: `docs/status/a11y/A1_ASSIST_MODE_CALLSITES.md` is current.
>
> Verify before edit: `grep -rn isInvincibilityEnabled src/`, `cat src/scenes/settingsAssistMode.ts`.

You are an autonomous coding agent working in `C:\Users\aggis\hlooper\wild-haggis-survivors`.

## Mission

Advance Assist Mode from scaffold toward a truthful player-facing feature. Either wire a complete, testable subset and expose only that subset, or strengthen the hidden-gate so no player can enable non-functional accessibility promises.

## Required Context

Read these before editing:

- `AGENTS.md`
- `docs/research/ACCESSIBILITY_RESEARCH.md` sections on Assist Mode and motor accessibility
- `docs/status/a11y/A1_ASSIST_MODE_CALLSITES.md`
- `docs/superpowers/specs/2026-04-23-accessibility-foundation-design.md` S6
- `docs/superpowers/plans/2026-04-23-accessibility-foundation.md` M6
- `src/systems/accessibility/AssistMode.ts`
- `src/core/SettingsManager.ts`
- `src/scenes/SettingsScene.ts`
- Existing damage and timing call sites: `src/scenes/game/PlayerHitResolver.ts`, `src/scenes/game/HazardZones.ts`, `src/entities/Player.ts`, `src/systems/JuiceSystem.ts`, `src/systems/TimeManager.ts`

## Scope

Prioritize the safest runtime subset:

- invincibility is already partially wired; verify and close gaps,
- extended post-dash iframes,
- extended combo window,
- optional game speed only if it can be implemented without breaking replay determinism.

Do not expose a setting until its runtime effect is covered by tests. If game speed is too risky, keep that row hidden and document why.

## Constraints

- Never frame Assist as "easy mode" or "cheat mode."
- Replay playback must not be made non-deterministic.
- Ironmoor and achievements must have a clear policy if Assist affects them; document the policy if you touch it.
- Do not silently change default difficulty.

## Deliverables

1. Runtime wiring for at least one new Assist sub-effect beyond current invincibility, or a stricter hidden-gate with tests.
2. Settings UI exposure only for fully functional effects, if any.
3. Unit tests for each wired effect.
4. `docs/status/a11y/A1_ASSIST_MODE_CALLSITES.md` updated with current status.

## Verification

Run at least:

```bash
npm test
npm run build
```

If Settings UI changes, run or add a relevant settings smoke test.

## Final Report

Report which Assist effects are functional, which remain hidden, tests run, and any policy implications for replay, Ironmoor, achievements, or balance.

