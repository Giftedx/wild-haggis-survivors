import type { ActionKey, GamepadBinding, KeyBinding } from '../core/actions';
import type { RebindSlot } from '../input/applyKeyRebind';
import type { DomFocusAction } from '../ui/domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for SettingsInputScene (keybind capture).
 *
 * Pure helper that maps the rebind row stack into the `DomFocusAction[]`
 * array consumed by `createDomFocusLayer`. Phaser-free so unit tests can
 * verify ordering, label folding, and capture-mode announcement
 * composition without booting a scene.
 *
 * Structural difference vs the four already-shipped adopters: this scene
 * has a *capture mode*. Clicking a slot enters "press a key for X" state,
 * then the next keydown writes the binding. The DOM mirror reflects this
 * by swapping its `actions` array to a single-action announcement during
 * capture, then restoring the full row stack on resolve / cancel. The
 * single capture-mode action is non-activating (the real keystroke
 * resolves it through Phaser's keyboard handler) — the action exists
 * purely so a screen reader has something to announce via the layer's
 * polite live region.
 *
 * Row layout per `ActionKey`:
 *   - keyboard primary slot
 *   - keyboard secondary slot
 *   - gamepad primary slot   (only if the action has a default pad binding)
 *   - gamepad secondary slot (only if the action has a default pad binding)
 *
 * Then two terminal rows:
 *   - Reset to defaults
 *   - Back
 *
 * Movement actions (moveUp / moveDown / moveLeft / moveRight) get only
 * keyboard slots — gamepad movement runs through the left stick / D-pad
 * (hardware-level axes), not buttons.
 */

export type CaptureKind = 'keyboard' | 'gamepad';

export interface SettingsInputActionLabels {
  /** Resolved action label, e.g. "Move up", "Dash". */
  readonly action: string;
  /** Resolved "Primary" / "Secondary" slot label. */
  readonly primary: string;
  readonly secondary: string;
  /** Resolved "keyboard" / "gamepad" descriptor for the announce string. */
  readonly keyboard: string;
  readonly gamepad: string;
  /** Resolved "unbound" sentinel for empty slots. */
  readonly unbound: string;
  /** Resolved gamepad button prefix (e.g. "Button" / "Pad"). */
  readonly gamepadPrefix: string;
  /** Resolved Reset chip label. */
  readonly reset: string;
  /** Resolved Back button label. */
  readonly back: string;
  /** Resolved capture prompts (one per kind). */
  readonly captureKeyboard: string;
  readonly captureGamepad: string;
}

export interface SettingsInputDomActionInput {
  /** Ordered action enum (matches `ACTION_KEYS`). */
  readonly actions: readonly ActionKey[];
  /** Current keyboard bindings keyed by action. */
  readonly keyBindings: Readonly<Record<ActionKey, KeyBinding>>;
  /** Current gamepad bindings keyed by action (sparse — movement actions absent). */
  readonly gamepadBindings: Readonly<Partial<Record<ActionKey, GamepadBinding>>>;
  /** Resolved labels for every action key + chrome string. */
  readonly labels: Readonly<Record<ActionKey, string>>;
  /** Resolved chrome strings (slot names, kind names, sentinels). */
  readonly chrome: SettingsInputActionLabels;
  /**
   * Format a raw `KeyboardEvent.code` for the accessible label, e.g.
   * `KeyW` → `W`. Injected so the helper stays Phaser-free and the test
   * can stub it.
   */
  formatKeyCode(code: string): string;
  /** Routed when the user activates a slot via DOM (enters capture mode). */
  onActivateSlot(action: ActionKey, slot: RebindSlot, kind: CaptureKind): void;
  /** Routed when the user activates the Reset chip via DOM. */
  onActivateReset(): void;
  /** Routed when the user activates the Back button via DOM. */
  onActivateBack(): void;
}

export interface SettingsInputCaptureContext {
  readonly action: ActionKey;
  readonly slot: RebindSlot;
  readonly kind: CaptureKind;
  /** Resolved labels mirror used by the helper to avoid an i18n dependency. */
  readonly chrome: Pick<
    SettingsInputActionLabels,
    'primary' | 'secondary' | 'keyboard' | 'gamepad' | 'captureKeyboard' | 'captureGamepad'
  >;
  /** Resolved action label (e.g. "Move up"). */
  readonly actionLabel: string;
}

/**
 * Stable id factory. The id encodes action + slot + kind so future tests
 * can target a specific row without index drift.
 */
export function settingsInputSlotId(
  action: ActionKey,
  slot: RebindSlot,
  kind: CaptureKind,
): string {
  // ActionKey is already kebab-friendly (camelCase, no separators we care
  // about). Slot + kind are simple ASCII.
  return `settings-input-${action}-${slot}-${kind}`;
}

/**
 * Compose the accessible label for a slot row. Folds action + slot + kind
 * + current binding (or "unbound") into a single screen-reader string,
 * e.g. `"Move up — primary keyboard — W"`,
 *      `"Dash — secondary gamepad — Button 0"`,
 *      `"Move up — primary keyboard — unbound"`.
 */
export function composeSlotLabel(
  input: SettingsInputDomActionInput,
  action: ActionKey,
  slot: RebindSlot,
  kind: CaptureKind,
): string {
  const { chrome, labels, keyBindings, gamepadBindings, formatKeyCode } = input;
  const actionLabel = labels[action];
  const slotLabel = slot === 'primary' ? chrome.primary : chrome.secondary;
  const kindLabel = kind === 'keyboard' ? chrome.keyboard : chrome.gamepad;

  let valueLabel: string;
  if (kind === 'keyboard') {
    const binding = keyBindings[action];
    const code = slot === 'primary' ? binding.primary : binding.secondary;
    valueLabel = code ? formatKeyCode(code) : chrome.unbound;
  } else {
    const binding = gamepadBindings[action];
    const button = binding
      ? slot === 'primary'
        ? binding.primary
        : binding.secondary
      : undefined;
    valueLabel = button != null
      ? `${chrome.gamepadPrefix} ${button}`
      : chrome.unbound;
  }

  return `${actionLabel} — ${slotLabel} ${kindLabel} — ${valueLabel}`;
}

/**
 * Compose the capture-mode prompt that goes into the DOM action label
 * during a live capture, e.g. `"Press a key for Move up primary keyboard.
 * Escape to cancel."` (or "press a button" for gamepad).
 *
 * The two prompt templates carry the trailing hint themselves; we only
 * splice in the row description. Localising the kind verb (key / button)
 * and the Escape hint stays in i18n.
 */
export function composeCaptureAnnouncement(ctx: SettingsInputCaptureContext): string {
  const slotLabel = ctx.slot === 'primary' ? ctx.chrome.primary : ctx.chrome.secondary;
  const kindLabel = ctx.kind === 'keyboard' ? ctx.chrome.keyboard : ctx.chrome.gamepad;
  const template = ctx.kind === 'keyboard'
    ? ctx.chrome.captureKeyboard
    : ctx.chrome.captureGamepad;
  // Templates contain `{row}` — caller-side i18n keys author them as e.g.
  // "Press a key for {row}. Escape to cancel." Helper substitutes the
  // composed row description here so a screen reader hears one breath.
  const row = `${ctx.actionLabel} ${slotLabel} ${kindLabel}`;
  return template.replace('{row}', row);
}

/**
 * Build the DOM focus action set for the SettingsInputScene rebind
 * panel. Order matches `ACTION_KEYS` × {primary, secondary} × {keyboard,
 * gamepad}, with gamepad slots skipped for actions that have no default
 * gamepad binding (movement). Trailing rows: Reset, Back.
 */
export function buildSettingsInputDomFocusActions(
  input: SettingsInputDomActionInput,
): DomFocusAction[] {
  const out: DomFocusAction[] = [];
  for (const action of input.actions) {
    out.push({
      id: settingsInputSlotId(action, 'primary', 'keyboard'),
      label: composeSlotLabel(input, action, 'primary', 'keyboard'),
      onActivate: () => input.onActivateSlot(action, 'primary', 'keyboard'),
    });
    out.push({
      id: settingsInputSlotId(action, 'secondary', 'keyboard'),
      label: composeSlotLabel(input, action, 'secondary', 'keyboard'),
      onActivate: () => input.onActivateSlot(action, 'secondary', 'keyboard'),
    });
    if (input.gamepadBindings[action]) {
      out.push({
        id: settingsInputSlotId(action, 'primary', 'gamepad'),
        label: composeSlotLabel(input, action, 'primary', 'gamepad'),
        onActivate: () => input.onActivateSlot(action, 'primary', 'gamepad'),
      });
      out.push({
        id: settingsInputSlotId(action, 'secondary', 'gamepad'),
        label: composeSlotLabel(input, action, 'secondary', 'gamepad'),
        onActivate: () => input.onActivateSlot(action, 'secondary', 'gamepad'),
      });
    }
  }
  out.push({
    id: 'settings-input-reset',
    label: input.chrome.reset,
    onActivate: () => input.onActivateReset(),
  });
  out.push({
    id: 'settings-input-back',
    label: input.chrome.back,
    onActivate: () => input.onActivateBack(),
  });
  return out;
}

/**
 * Single-action focus-layer payload used while a capture is live. The
 * action is non-activating (the real keystroke / button press resolves
 * the capture through Phaser's input handler); the layer's polite live
 * region announces the label so the screen-reader user hears the prompt.
 */
export function buildCaptureModeActions(
  ctx: SettingsInputCaptureContext,
): DomFocusAction[] {
  return [
    {
      id: 'settings-input-capture',
      label: composeCaptureAnnouncement(ctx),
      onActivate: () => undefined,
    },
  ];
}
