import { t } from '../core/i18n';
import type { DomFocusAction } from './domFocusLayer';
import type { NodePromptOption } from './NodePromptUI';

/**
 * T407 — DOM-visible focus mirror for the Moor Road NodePromptUI
 * (shrine / wee_trader / bargain interactive prompts).
 *
 * Pure helper that converts the caller's option list (+ optional "Leave"
 * skip) into `DomFocusAction[]` for `createDomFocusLayer`. Phaser-free so
 * unit tests can verify the action ordering, label folding, and disabled
 * passthrough without booting a scene.
 *
 * Label folding: a subLabel ("(40g)", "(-5 HP)", etc.) is concatenated
 * into the action label so screen-reader users hear the trade-off in one
 * announcement instead of relying on adjacent silent visual context.
 *
 * Disabled options stay in the action list (parity with the visible
 * Phaser button order) but carry `disabled: true` so the layer's tab
 * order skips them and the buttons render `aria-disabled` + `tabindex
 * = -1` via the layer's own bookkeeping.
 */
export interface NodePromptDomActionInput {
  /** Option list from the caller — ordered top-to-bottom in the panel. */
  readonly options: readonly NodePromptOption[];
  /**
   * When true, append a synthetic "Leave" action that resolves the prompt
   * with `null`. Mirrors the visible Phaser Leave button.
   */
  readonly allowSkip: boolean;
  /** Invoked on DOM activation of the option at the same index. */
  onActivateOption(index: number): void;
  /** Invoked on DOM activation of the synthetic Leave action. */
  onActivateLeave(): void;
}

/**
 * Build the DOM focus action set for a single NodePromptUI invocation.
 * The returned actions match the Phaser button order one-for-one (with
 * Leave appended last when `allowSkip`), so the scene can call
 * `setFocusedIndex(focusedIndex)` and the canonical Phaser index lines
 * up with the DOM index without remapping.
 */
export function buildNodePromptDomFocusActions(
  input: NodePromptDomActionInput,
): DomFocusAction[] {
  const actions: DomFocusAction[] = input.options.map((option, index) => ({
    id: `node-prompt-${option.key}`,
    label: composeOptionLabel(option),
    disabled: option.disabled === true,
    onActivate: () => input.onActivateOption(index),
  }));
  if (input.allowSkip) {
    actions.push({
      id: 'node-prompt-leave',
      label: t('nodes.ui.leave'),
      onActivate: () => input.onActivateLeave(),
    });
  }
  return actions;
}

/**
 * Fold the visible subLabel ("({price}g)", "(-{hp} HP)", "({price}g —
 * short)") into the accessible label so a screen reader announces price
 * + cost alongside the option name. Disabled options keep the same
 * concatenation — the disabled flag separately gates the tab order, but
 * the label still tells the user *why* an option exists ("Passive charm
 * — (40g — short)") so they don't have to guess what's locked.
 */
function composeOptionLabel(option: NodePromptOption): string {
  if (!option.subLabel) return option.label;
  return `${option.label} — ${option.subLabel}`;
}
