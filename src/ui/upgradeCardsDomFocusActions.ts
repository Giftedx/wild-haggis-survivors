import { t } from '../core/i18n';
import type { UpgradeCard } from '../data/upgrades';
import type { DomFocusAction } from './domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for `UpgradeCardsUI` (level-up picker).
 *
 * Pure helper for `createDomFocusLayer`. Phaser-free aside from `t()`.
 *
 * Action order: one button per offered card (left → right), optional
 * reroll last. `data-focus-id` pattern `levelup-card-{n}` matches hub
 * keyboard digit jump 1–n (same muscle-memory as other T407 menus).
 */
export interface UpgradeCardsDomActionInput {
  readonly cards: readonly UpgradeCard[];
  /** When true, appends a reroll action that calls `onReroll`. */
  readonly rerollVisible: boolean;
  /** Pre-resolved reroll label (`t('ui.upgradeCards.reroll', …)`). */
  readonly rerollLabel: string;
  readonly onPickIndex: (index: number) => void;
  readonly onReroll: (() => void) | null;
}

export function buildUpgradeCardsDomFocusActions(input: UpgradeCardsDomActionInput): DomFocusAction[] {
  const actions: DomFocusAction[] = input.cards.map((card, i) => {
    const rarity = t(`ui.common.rarity.${card.rarity}`);
    return {
      id: `levelup-card-${i}`,
      label: `${t(card.name)} — ${rarity}. ${t(card.description)}`,
      onActivate: () => input.onPickIndex(i),
    };
  });

  if (input.rerollVisible && input.onReroll) {
    const doReroll = input.onReroll;
    actions.push({
      id: 'levelup-reroll',
      label: input.rerollLabel,
      onActivate: () => doReroll(),
    });
  }

  return actions;
}
