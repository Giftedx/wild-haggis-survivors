import { t } from '../core/i18n';
import type { RouteDef } from '../data/routes';
import type { DomFocusAction } from '../ui/domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for ActIntermissionScene (Moor Road routes).
 *
 * Pure helper for `createDomFocusLayer`. Phaser-free aside from `t()`.
 *
 * `data-focus-id` uses `act-intermission-{routeKey}` so contract tests stay
 * stable across slot ordering. Labels include the 1-based shortcut digit to
 * align with the on-card badge + keyboard row.
 */
export interface ActIntermissionDomActionInput {
  readonly routes: readonly RouteDef[];
  readonly onPickRoute: (route: RouteDef) => void;
}

export function buildActIntermissionDomFocusActions(
  input: ActIntermissionDomActionInput,
): DomFocusAction[] {
  return input.routes.map((route, i) => ({
    id: `act-intermission-${route.key}`,
    label: `${t(route.labelKey)} — ${t(route.descKey)} (${i + 1})`,
    onActivate: () => input.onPickRoute(route),
  }));
}
