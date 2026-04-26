import type { DomFocusAction } from '../ui/domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for SettingsScene.
 *
 * Pure helper that maps the heterogeneous SettingsScene row stack
 * (sliders, toggles, cycles, scene-launchers, back, reset) into the
 * `DomFocusAction[]` array consumed by `createDomFocusLayer`. Phaser-
 * free so unit tests can verify ordering, label folding, and activation
 * routing without booting a scene.
 *
 * Approach 1 (per-row mirror): each visible Settings row gets its own
 * DOM `<button>`. The DOM index lines up one-for-one with the scene's
 * `gpRows` index, so `setFocusedIndex(gpIdx)` is a direct mirror with
 * no remap.
 *
 * Row types:
 *  - slider — DOM activation calls `bump(+1)`, matching the gamepad
 *    "A" confirm path. Label folds the current value into the announce
 *    string ("Master volume — 80%"). Slider bumps on the canvas update
 *    the DOM action label live via `setActions(...)`.
 *  - toggle — DOM activation flips the value; label folds the current
 *    on/off state ("Screen shake — ON").
 *  - cycle — DOM activation advances to the next value; label folds
 *    the current value ("Banter — Natural", "Language — English (Glesga)").
 *  - launch — DOM activation opens the SettingsInput rebind sub-scene
 *    or runs the back/reset action.
 *
 * Section headers are NOT modeled as actions — they're decorative and
 * non-focusable in the canvas. A screen-reader user gets the per-row
 * label which contains enough context.
 */

export type SettingsDomActionKind = 'slider' | 'toggle' | 'cycle' | 'launch';

export interface SettingsDomActionInput {
  /** Stable id for the row, e.g. "master-volume", "screen-shake", "language". */
  readonly id: string;
  readonly kind: SettingsDomActionKind;
  /** Localised, plain-text row label, e.g. "Master volume". */
  readonly label: string;
  /**
   * Current value rendered to the right of the row, folded into the
   * accessible announce string. For sliders, "80%". For toggles, "ON".
   * For cycles, the current label ("Natural", "English (Glesga)").
   * For launch rows, leave empty.
   */
  readonly valueText?: string;
  /**
   * Routed by the layer when the user activates the action via DOM
   * click / Enter / Space. The scene wires this to the same callback
   * the canvas uses for confirm (slider plus / toggle flip / cycle
   * step / launch action).
   */
  onActivate(): void;
}

/**
 * Compose the accessible label for a single row. Slider / toggle /
 * cycle rows fold the current value with " — {value}" so a screen
 * reader announces both in one breath. Launch rows pass through
 * unchanged.
 */
export function composeSettingsRowLabel(input: SettingsDomActionInput): string {
  if (input.kind === 'launch' || !input.valueText) return input.label;
  return `${input.label} — ${input.valueText}`;
}

/**
 * Build the DOM focus action set for the SettingsScene panel. Order
 * matches the scene's `gpRows` array exactly so `setFocusedIndex(gpIdx)`
 * is a direct mirror. Action ids are stable (suffixed with kind) so
 * future tests can target a specific row by id without index drift.
 */
export function buildSettingsDomFocusActions(
  inputs: readonly SettingsDomActionInput[],
): DomFocusAction[] {
  return inputs.map((input) => ({
    id: `settings-${input.id}`,
    label: composeSettingsRowLabel(input),
    onActivate: () => input.onActivate(),
  }));
}
