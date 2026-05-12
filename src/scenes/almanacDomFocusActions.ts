import { t } from '../core/i18n';
import type { AlmanacTabKey } from './almanac/tabNavigation';
import type { DomFocusAction } from '../ui/domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for AlmanacScene (Highland Almanac).
 *
 * Pure helper for `createDomFocusLayer`. Phaser-free aside from `t()`.
 *
 * Action order matches `AlmanacScene` `GamepadMenuNav` entry order: tab row
 * (Beasties → Banter), then the browse/expand proxy for the active book
 * body, then Back.
 */
export interface AlmanacDomActionInput {
  readonly tabs: readonly { readonly key: AlmanacTabKey; readonly label: string }[];
  readonly bookPanelLabel: string;
  readonly onSelectTab: (key: AlmanacTabKey) => void;
  readonly onBookPanel: () => void;
  readonly onBack: () => void;
}

export function buildAlmanacDomFocusActions(input: AlmanacDomActionInput): DomFocusAction[] {
  const actions: DomFocusAction[] = [];
  for (const tab of input.tabs) {
    actions.push({
      id: `almanac-tab-${tab.key}`,
      label: tab.label,
      onActivate: () => input.onSelectTab(tab.key),
    });
  }
  actions.push({
    id: 'almanac-book-panel',
    label: input.bookPanelLabel,
    onActivate: () => input.onBookPanel(),
  });
  actions.push({
    id: 'almanac-back',
    label: t('ui.almanac.back'),
    onActivate: () => input.onBack(),
  });
  return actions;
}
