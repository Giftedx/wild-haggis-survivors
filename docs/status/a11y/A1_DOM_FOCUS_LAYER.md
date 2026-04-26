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
2. NodePromptUI, because it already has a compact keyboard/gamepad focus model.
3. Settings accessibility rows, but only after a row-level DOM strategy is chosen for sliders, toggles, and cycling chips.
