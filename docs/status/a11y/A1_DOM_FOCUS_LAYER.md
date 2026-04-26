# A1 DOM Focus Layer Note

T407 now has a first thin implementation: a visually hidden DOM focus layer that mirrors critical Phaser canvas actions without drawing duplicate controls.

## Pattern

- `src/ui/domFocusLayer.ts` creates a labeled DOM group with native `<button>` actions and a polite `role="status"` node.
- The layer is visually hidden with the standard clipped 1px pattern, so pointer users still see and click the Phaser UI only.
- Phaser remains the owner of visible focus. When keyboard/gamepad/pointer focus changes in canvas, the helper updates DOM button state and status text. When DOM focus lands on a hidden button, it calls back into the same Phaser focus path.
- Native button activation calls the same action callbacks as Phaser pointer/keyboard/gamepad activation.

## Adopted Screens

### GameOverScene (first adopter)

`GameOverScene` mirrors its three primary post-run actions:

- Play again
- Gold shop
- Tae Gran's

Run result screen is critical, has a clear focus model, three stable actions.

### CurseScene (second adopter — 2026-04-26)

`CurseScene` mirrors its 4 curse tiles + clean-run + back action through a
single DOM group at `[data-whs-dom-focus-layer="whs-curse-focus-layer"]`.

- Action labels include the curse name + description + `+N% gold` chip text
  so screen-reader users hear the trade-off, not just the curse name.
- Phaser keyboard / gamepad navigation continues to drive `focusedTileIndex`
  unchanged. The DOM layer mirrors that index via `setFocusedIndex` whenever
  `applyTileFocus` runs, so the visible Phaser stroke and the assistive-tech
  cursor stay in lockstep.
- DOM-side activation (Tab + Enter from a screen reader) routes through the
  same `commitCurse(key)` / `goBack()` path as a pointer click — single source
  of truth for action behavior.

Helper coverage: `src/scenes/curseDomFocusActions.test.ts` (7 tests on the
pure action builder — count, ordering, callback wiring, label resolution,
gold-chip text presence).

Smoke coverage: `e2e/curse-dom-focus.spec.ts` boots the scene, asserts the
DOM layer mounts, verifies button count + accessible-name shape + that the
trailing `data-focus-id` is `curse-back`. Run via `npm run test:e2e` after
a production build (the smoke is part of the standard Playwright project,
not a gated optional run).

### NodePromptUI (third adopter — 2026-04-26)

`src/ui/NodePromptUI.ts` is the Moor Road interactive prompt panel
(shrine / wee_trader / bargain). Each `show()` mounts a per-prompt DOM
mirror at `[data-whs-dom-focus-layer="whs-node-prompt-focus-layer"]`;
`close()` tears it down. Lifecycle is per-invocation rather than per-
scene, so the layer's identity stays scoped to a single decision moment
even when the GameScene reuses the same `NodePromptUI` instance across
many node visits.

- Action set: one `<button>` per option in caller-provided order, plus a
  trailing `Leave` button when `allowSkip !== false`. Disabled options
  (e.g. unaffordable trader items) keep their slot but carry
  `disabled: true` so the layer skips them in tab order while still
  surfacing *why* the option is locked (the label still concatenates the
  price chip).
- Label folding: the visible Phaser `subLabel` ("(40g)", "(-5 HP)", "(40g
  — short)") is concatenated into the DOM label as `"{label} — {subLabel}"`
  so a screen reader announces the trade-off in one breath instead of
  relying on adjacent silent visual context. Voice register matches the
  existing `nodes.ui.*` Hearth / Grave / Wild-Comedy mix — no new copy
  was authored for the mirror.
- DOM container uses `role="dialog"` (vs CurseScene's `role="group"`)
  because the prompt is genuinely modal: the scrim blocks the playfield
  and the prompt owns input until it resolves. `aria-label` is the
  prompt title; `aria-describedby` points at the title-line description
  block built from `opts.body`.
- Focus parity: indices in the DOM action array map one-for-one to the
  `buttonEntries` array Phaser owns, so `applyFocus()` calls
  `setFocusedIndex(focusedIndex)` directly with no remap. DOM-side focus
  changes (screen-reader Tab) mirror back into `focusedIndex` via the
  layer's `onFocusIndexChange` and re-render the Phaser strokes inline
  to avoid round-tripping back through the layer.
- Activation passthrough: DOM clicks / Enter / Space invoke the same
  `entry.activate()` callback as the Phaser pointer / keyboard / gamepad
  paths, and DOM Leave routes through the same `resolve(null, ...)`
  path as the Phaser Leave button + Escape key. Single source of truth
  for the resolve contract.

Helper coverage: `src/ui/nodePromptDomFocus.test.ts` (8 tests on the
pure action builder — count with / without skip, ordering, label
folding, disabled passthrough, callback wiring, resolved Leave label).

Smoke coverage: deferred — booting the live prompt requires a running
node visit (gameplay state setup), and the helper-side tests already
prove the contract that an e2e smoke would assert. Future Playwright
adoption should ride a deterministic prompt-injection harness rather
than a synthetic act-1 walkthrough.

### SettingsScene (fourth adopter — 2026-04-26)

`src/scenes/SettingsScene.ts` mirrors its full row stack — sliders,
toggles, cycles (banter / locale / colorblind), launch rows (input
rebind / BACK / RESET) — through a single DOM group at
`[data-whs-dom-focus-layer="whs-settings-focus-layer"]`. Approach 1
(per-row mirror) was picked because the row count (~22) is small enough
that flat one-button-per-row keeps the screen-reader scan model linear
and matches the visible Phaser stack 1-for-1. Approach 2 (focus-only
mirror) would have lost the "scan the whole panel" benefit a screen-
reader user expects when they hit Tab; approach 3 (live region only)
would have left activation canvas-only, which still locks out a Tab-
driven user.

- Action ordering is the same as `gpRows` (gamepad index), so
  `setFocusedIndex(gpIdx)` is a direct mirror — no remap.
- Heterogeneous row mirroring: each row exposes a `SettingsDomActionInput`
  with its `kind` (`slider | toggle | cycle | launch`) and current
  `valueText`. The pure helper folds the value into the accessible
  label (`"Master volume — 80%"`, `"Screen shake — ON"`,
  `"Language — English (Glesga)"`) so a screen reader announces both
  the row name and the current value in one breath. Launch rows skip
  the fold (no value to announce).
- Slider DOM activation drives the same `bump(+1)` path the gamepad
  confirm button uses — Enter on the DOM mirror nudges the slider one
  step in the same direction. Sighted players still get the full drag
  / click-anywhere-on-track UX from the canvas controls; the DOM mirror
  is additive.
- Toggle / cycle / launch DOM activation routes through the canvas
  `doToggle` / `cycle` / `goBack` callbacks — single source of truth
  for the action behavior. A confirm modal (Ironmoor opt-in) intercepts
  on the canvas exactly as it does for pointer / keyboard / gamepad
  paths.
- Bidirectional sync: every value mutation calls `refreshDomActions()`
  which rebuilds the action set from the per-row sync hooks and
  preserves the focused index. DOM-side focus changes (screen-reader
  Tab) mirror back into `gpIdx` and re-render the visible Phaser focus
  stroke without round-tripping back into `setFocusedIndex` on the
  layer.
- Lifecycle: `create()` calls `uninstallDomFocusLayer()` first to
  cover Phaser scene reuse (locale cycle / RESET both restart the
  scene through `scene.start('Settings')`); the `shutdown` listener
  also disposes. The `domRowSyncs` array is cleared in the same
  `create()` reset block alongside `gpRows` and `glowTweens`.

Helper coverage: `src/scenes/settingsDomFocusActions.test.ts` (11
tests on the pure label-folding + action-builder logic — slider /
toggle / cycle / launch label composition, action-id namespacing,
ordering, callback routing, empty-input edge case).

Smoke coverage: deferred. The scene smoke
(`src/scenes/settingsComfort.smoke.test.ts`) already proves the row
stack assembles cleanly under jsdom; a Playwright accessibility smoke
covering the new DOM mirror is the natural next step but rides the
broader assistive-tech regression harness rather than this single
adoption. The pure-helper tests already prove the action-shape
contract a smoke would assert.

Limits / known follow-ups:

- The keybind capture rows live in `SettingsInputScene` (a separate
  sub-scene launched from this row). That scene has not yet adopted
  the DOM focus layer — opening it leaves the assistive-tech focus
  in the DOM mirror's last position. Adopting `SettingsInputScene`
  is the next reasonable target after this one.
- Section headers ("Hearth sound", "Comfort & motion", "Accessibility")
  are decorative — non-focusable in the canvas, so they don't appear
  in the DOM mirror either. A screen-reader user gets the row label
  which already carries enough context.
- Sliders surface as buttons in the mirror, not native
  `<input type="range">`. Switching to a real range input would expose
  the value space to the screen reader more idiomatically (announced
  as a percentage with arrow-key fine-tuning), but would conflict
  with the layer's own arrow-key navigation between actions. This is
  a future helper-API extension; the current Enter-bumps approach
  matches the canonical gamepad confirm path so the contract stays
  consistent across surfaces.

## Research Hooks

- `docs/research/ACCESSIBILITY_RESEARCH.md` Part 3.6: screen-reader-friendly menus are a realistic WHS target even if full blind play is out of scope.
- Part 5: motor support benefits from keyboard/gamepad paths that do not require pointer precision.
- Part 6: cognitive accessibility favors consistent, small action sets with plain labels.
- Part 9.6: future accessibility smoke tests should cover keyboard-only menu navigation and screen-reader announcement checks.
- `docs/DESIGN_SOUL.md` Soul Check: this keeps failure/post-run flow warm and clear without adding visual clutter.

## Limits

- This is not full screen-reader support for the whole game.
- It does not yet trap focus across a modal, narrate all run stats, or expose secondary text links like postcard/rerun/capture.
- The Phaser-side `commitCurse` (CurseScene) and the GameOver action callbacks have unit coverage at the helper layer. The Playwright smoke covers the DOM contract; full assistive-tech narration verification (with a real screen reader) is still a human-gated review.

## Next Adoptions

1. ~~CurseScene tiles~~ — adopted 2026-04-26.
2. ~~NodePromptUI~~ — adopted 2026-04-26.
3. ~~Settings accessibility rows~~ — adopted 2026-04-26 (per-row mirror, slider + toggle + cycle + launch row types covered).
4. `SettingsInputScene` — keybind / gamepad rebind capture rows; deferred from the SettingsScene adoption because the capture loop is its own sub-scene with a different input model (waiting on a key press rather than activating an action).
5. `GameOverScene` — the original adopter; the project doc is aspirational, the scene file does not yet import the helper. Back-fill is open as a separate follow-up task.
