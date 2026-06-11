import { t } from '../core/i18n';
import { ACHIEVEMENT_DEFS } from '../core/BalanceConfig';
import type { DeedProgress } from '../ui/deedsProgress';
import type { DomFocusAction } from '../ui/domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for DeedsScene (achievements grid).
 *
 * Pure helper for `createDomFocusLayer`. Phaser-free aside from `t()`.
 *
 * Action order matches `DeedsScene` `GamepadMenuNav` entry order: current
 * page deed cards (visual order), optional prev/next when multi-page, Back.
 * Cards are browse-only (no purchase / toggle) — `onActivate` is a no-op so
 * assistive-tech users can still traverse the full grid without side effects.
 */
export interface DeedsDomActionInput {
  readonly visibleDeeds: readonly DeedProgress[];
  readonly pageNavVisible: boolean;
  readonly hasPrevPage: boolean;
  readonly hasNextPage: boolean;
  readonly onPrevPage: () => void;
  readonly onNextPage: () => void;
  readonly onBack: () => void;
}

function deedStatusChip(deed: DeedProgress): string {
  if (deed.status === 'unlocked') return t('ui.deeds.status_unlocked');
  if (deed.status === 'in_progress') return t('ui.deeds.status_in_progress');
  return t('ui.deeds.status_locked');
}

export function buildDeedsDomFocusActions(input: DeedsDomActionInput): DomFocusAction[] {
  const actions: DomFocusAction[] = [];
  for (const deed of input.visibleDeeds) {
    const def = ACHIEVEMENT_DEFS[deed.id];
    const title = t(def.titleKey);
    const status = deedStatusChip(deed);
    actions.push({
      id: `deed-${deed.id}`,
      label: `${title} — ${status}`,
      onActivate: () => undefined,
    });
  }
  if (input.pageNavVisible) {
    actions.push({
      id: 'deeds-page-prev',
      label: t('ui.shop.prev'),
      disabled: !input.hasPrevPage,
      onActivate: () => {
        if (!input.hasPrevPage) return;
        input.onPrevPage();
      },
    });
    actions.push({
      id: 'deeds-page-next',
      label: t('ui.shop.next'),
      disabled: !input.hasNextPage,
      onActivate: () => {
        if (!input.hasNextPage) return;
        input.onNextPage();
      },
    });
  }
  actions.push({
    id: 'deeds-back',
    label: t('ui.deeds.back'),
    onActivate: () => input.onBack(),
  });
  return actions;
}
