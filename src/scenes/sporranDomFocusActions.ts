import { t } from '../core/i18n';
import { SPORRAN_PICK_COUNT, type SporranCard } from '../systems/sporranDeck';
import type { DomFocusAction } from '../ui/domFocusLayer';

/**
 * S1 Phase 1.5 — DOM-visible focus mirror for the Sporran draft scene.
 *
 * Pure helper that builds the `DomFocusAction[]` consumed by
 * `createDomFocusLayer`. Phaser-free so unit tests can verify label
 * resolution + state-aware toggling without booting a scene.
 *
 * Differences from `buildCurseDomFocusActions` worth keeping straight:
 * - Cards are *toggleable* (multi-select up to SPORRAN_PICK_COUNT),
 *   not single-pick. Each action's label flips between KEEP/DROP so
 *   assistive tech announces the current state.
 * - A trailing `Confirm` action carries the same disabled state as
 *   the visible button — `disabled: true` until picks are complete,
 *   then enabled. The label echoes the remaining-count when disabled.
 * - When the cap is hit (3 of 3), unpicked tiles flip to disabled
 *   so the screen-reader user hears "drop one first" semantics rather
 *   than tabbing to a button that does nothing.
 *
 * Action ordering is locked to `0..N-1 = cards`, `N = confirm`,
 * `N+1 = back` — SporranScene mirrors `focusedTileIndex` only into the
 * card range; the trailing confirm + back are reached by Tab.
 */
export interface SporranDomActionInput {
  readonly drawnHand: readonly SporranCard[];
  readonly pickedIndices: ReadonlySet<number>;
  onTogglePick(cardIndex: number): void;
  onConfirm(): void;
  onBack(): void;
}

export function buildSporranDomFocusActions(input: SporranDomActionInput): DomFocusAction[] {
  const { drawnHand, pickedIndices } = input;
  const remaining = SPORRAN_PICK_COUNT - pickedIndices.size;
  const atCap = remaining <= 0;

  const actions: DomFocusAction[] = drawnHand.map((card, idx) => {
    const picked = pickedIndices.has(idx);
    const verb = t(picked ? 'sporran.unpick_label' : 'sporran.pick_label');
    const kindLabel = t(`sporran.kind.${card.kind}`);
    const name = t(card.nameKey);
    const desc = t(card.descKey);
    return {
      id: `sporran-card-${idx}`,
      label: `${verb} ${name} — ${desc} (${kindLabel})`,
      // A picked card is always droppable; an unpicked card at the cap
      // can't be picked without dropping one first.
      disabled: !picked && atCap,
      onActivate: () => input.onTogglePick(idx),
    };
  });

  actions.push({
    id: 'sporran-confirm',
    label: atCap
      ? t('sporran.confirm')
      : t('sporran.confirm_disabled', { remaining }),
    disabled: !atCap,
    onActivate: () => input.onConfirm(),
  });

  actions.push({
    id: 'sporran-back',
    label: t('sporran.back'),
    onActivate: () => input.onBack(),
  });

  return actions;
}
