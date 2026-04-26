# A1 M4 — Assist Mode call-site map

> **Status:** Engineering map of Assist Mode readers and the gameplay
> sites where each effect must hook in. M6 already shipped the
> persisted settings + `AssistMode.ts` reader API. This doc documents
> the call-site decisions and the wiring that ships in this iteration.
>
> Triple-audit T122 / Opus MF3 noted: 7 Assist Mode toggles persist in
> save state but had ZERO call sites — UI hidden until effects landed,
> to avoid lying to players. This doc tracks each toggle through to
> the call site that gives it teeth.

## Reader API (shipped, M6)

`src/systems/accessibility/AssistMode.ts`:

```typescript
isAssistModeEnabled(): boolean
getAssistModeGameSpeed(): number          // 1.0 when master OFF
isExtendedIFramesEnabled(): boolean        // false when master OFF
isExtendedComboWindowEnabled(): boolean    // false when master OFF
isInvincibilityEnabled(): boolean          // false when master OFF
```

All sub-readers are gated on the master toggle — they return their
neutral value when `assistMode === false`, even if the sub-toggle's
own boolean is `true`. This means call sites do a single read; no
manual master-check.

## Call-site map

| Toggle | Call site | Status | Hook detail |
|--------|-----------|--------|-------------|
| `isInvincibilityEnabled()` | `PlayerHitResolver.handle` (src/scenes/game/PlayerHitResolver.ts:88) | **WIRED** in this iteration | Early-return before damage applied, just below the existing iframe / dash gate. No iframes burned, no death-cause logged, no tint flashed. |
| `isInvincibilityEnabled()` | `HazardZones.lava-tick` (src/scenes/game/HazardZones.ts:300) | **WIRED** in this iteration | Same as above — added to the existing invuln gate (`isIFrames || isDashInvincible || isHazardLeaping`). |
| `getAssistModeGameSpeed()` | `TimeManager` global timeScale | **NOT WIRED** | Wiring this requires a permanent token in TimeManager's lowest-wins ladder. The T1 deterministic-replay path assumes `timeScale = 1` baseline; gating the slider behind a non-replay flag keeps determinism intact. Deferred — track as `TODO: A1-M4-assist-speed`. |
| `isExtendedIFramesEnabled()` | `Player.startDash` post-dash grace (src/entities/Player.ts:419) | **NOT WIRED** | Doubles `BALANCE.player.postDashGraceMs` from 80ms to 160ms when on. Single multiply in the line that sets `postDashInvincibilityRemainingMs`. Deferred — needs balance pass to confirm 160ms doesn't break Ironmoor parity. |
| `isExtendedComboWindowEnabled()` | `JuiceSystem` combo-timer reset (src/systems/JuiceSystem.ts) | **NOT WIRED** | Doubles combo window from 1500ms to 3000ms. Deferred — combo balance interplay with combo-relics needs confirmation. |
| `isAssistModeEnabled()` (master, UI) | Settings → Accessibility tab | **HIDDEN** | All Assist Mode rows commented in `SettingsScene.create()` — controls remain hidden until balance + replay parity confirm full wiring. The persisted fields stay so existing player saves don't churn. |

## Decision: keep UI hidden

Per memory note (T122) and to avoid the trap of "settings exist but do
nothing", the Assist Mode UI stays hidden in this iteration. The
shipped wiring touches only the **invincibility** toggle, which is
the one toggle that:

- Has a single deterministic call site (the damage gate).
- Cannot break combat balance for non-Assist players (it's gated on
  the master toggle, which is itself off by default and hidden).
- Can be enabled via direct save-edit by sufficiently motivated
  testers (or via a future Settings unhide), and the wiring is then
  immediately functional with no further code change.

The other three sub-toggles (`gameSpeed`, `extendedIFrames`,
`extendedComboWindow`) need balance + telemetry passes to ensure they
don't break:
- T1 replay determinism (game-speed scales the physics integration).
- Ironmoor mode parity (extended iframes change kill-floor reachability).
- Relic synergy economy (extended combo windows shift combo-relic
  effectiveness).

A future "A1 M4.5 — Assist Mode unhide" plan, gated on those balance
analyses, ships the remaining wiring and unhides the UI.

## Verification — invincibility wiring

A unit test in `src/scenes/game/PlayerHitResolver.test.ts` exercises
the new gate. Manual smoke:

1. Open Settings → enable `assistMode + assistModeInvincibility` via
   localStorage edit:
   ```js
   const s = JSON.parse(localStorage.whs_game_settings || '{}');
   s.assistMode = true; s.assistModeInvincibility = true;
   localStorage.whs_game_settings = JSON.stringify(s);
   ```
2. Reload → start run. Walk into any enemy. HP does not drop.
3. Toggle off via the same path → enemy contact damages as normal.

## Cross-references

- `src/systems/accessibility/AssistMode.ts` — readers.
- `src/systems/accessibility/AssistMode.test.ts` — coverage.
- `src/scenes/game/PlayerHitResolver.ts` — primary call site.
- `src/scenes/game/HazardZones.ts` — hazard call site.
- `docs/superpowers/specs/2026-04-23-accessibility-foundation-design.md`
  §S6 — original spec.
- `docs/research/ACCESSIBILITY_RESEARCH.md` §5.4 — Celeste assist
  framing reference.
