# A1 M4 — Assist Mode call-site map

> **Audit veto:** Assist Mode UI rows other than the invincibility toggle are **deliberately hidden** until each effect's call-site lands plus the replay-determinism pass clears. Do NOT flag missing UI as a bug — the persistence-without-UI shape is the design, documented here. Cited from [`docs/INDEX.md` §"For audit / review agents"](INDEX.md#for-audit--review-agents) as a top-level veto.

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
| `getAssistModeGameSpeed()` | `TimeManager` global timeScale (src/systems/accessibility/assistGameSpeed.ts, src/scenes/GameScene.ts) | **WIRED** | Applies a permanent `ASSIST_GAME_SPEED` token in TimeManager's lowest-wins ladder for normal non-replay runs only. Direct-save values are clamped to 0.5–1.0. Replay record/playback force the token off so T1 fixed-step replay determinism keeps its `timeScale = 1` baseline. |
| `isExtendedIFramesEnabled()` | Player post-dash grace expiry (src/entities/Player.ts) | **WIRED** | Doubles `BALANCE.player.postDashGraceMs` from 80ms to 160ms through `getPostDashGraceMs(...)` when the master Assist Mode toggle and sub-toggle are both on. Baseline remains unchanged for normal runs. |
| `isExtendedComboWindowEnabled()` | `JuiceSystem` combo-timer reset (src/systems/JuiceSystem.ts) | **WIRED** | Doubles combo window from 1500ms to 3000ms through `getComboTimeoutMs(...)` when the master Assist Mode toggle and sub-toggle are both on. Baseline remains unchanged for normal runs. |
| `isAssistModeEnabled()` (master, UI) | Settings → Accessibility tab | **HIDDEN** | All Assist Mode rows commented in `SettingsScene.create()` — controls remain hidden until balance + replay parity confirm full wiring. The persisted fields stay so existing player saves don't churn. |

## Decision: keep UI hidden

Per memory note (T122) and to avoid the trap of "settings exist but do
nothing", the Assist Mode UI stays hidden in this iteration. The
currently shipped sub-toggle wiring is deliberately narrow:

- `invincibility` gates enemy/hazard damage at deterministic damage call
  sites.
- `extendedIFrames` only doubles the bounded post-dash grace window.
- `extendedComboWindow` only doubles the bounded kill-combo timeout.
- No wired sub-toggle changes default/non-Assist behavior because all
  readers are master-gated and the master toggle is off by default.
- Both can be enabled via direct save-edit by sufficiently motivated
  testers (or via a future Settings unhide), and the wiring is then
  immediately functional with no further code change.

The game-speed sub-toggle is also wired, but intentionally only for normal
non-replay runs. Replay record/playback release the `ASSIST_GAME_SPEED` token
so the T1 fixed-step replay path keeps its `timeScale = 1` baseline; recorded
Assist settings remain snapshotted for honesty/mismatch checks, but playback
never depends on the live slider.

`extendedIFrames` now has a single bounded call site: post-dash grace is
doubled from the 80ms baseline to 160ms only when both Assist Mode and the
sub-toggle are enabled. `extendedComboWindow` likewise has a bounded call
site: kill-combo resets use a 3000ms timeout instead of the 1500ms baseline
only when both Assist Mode and that sub-toggle are enabled. The normal-run
baseline is unchanged, and the UI rows remain hidden with the rest of Assist
Mode until the broader unhide pass lands.

A future "A1 M4.5 — Assist Mode unhide" plan, gated on final balance
analyses, unhides the UI.

## Verification — assist wiring

Unit coverage:

- `src/systems/accessibility/assistGameSpeed.test.ts` covers normal-run
  token requests, replay record/playback token release, direct-save clamping,
  and statically guards the `GameScene` call site ordering.
- `src/scenes/game/PlayerHitResolver.test.ts` exercises the invincibility
  damage gate.
- `src/entities/playerDashAssist.test.ts` covers baseline vs doubled
  post-dash grace and statically guards the Player call site.
- `src/systems/comboAssist.test.ts` covers baseline vs doubled combo
  timeout and statically guards the `JuiceSystem` call site.
- `src/systems/JuiceSystem.test.ts` exercises kill-combo timer resets for
  the default 1500ms window and Assist Mode's 3000ms extended window.
- `e2e/assist-mode-invincibility.spec.ts` direct-edits the hidden setting in
  localStorage, boots a production-preview GameScene, and proves enemy contact
  damages with the master off but preserves HP with Assist invincibility on.

Manual invincibility smoke:

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
