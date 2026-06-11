/**
 * T402 — run-identity radiator label resolvers.
 *
 * Three pure functions that turn run-time state into i18n-resolved
 * display labels: route picker history → route names; held relics →
 * relic names; owned runes → rune names. The pause menu and the Game
 * Over panel both render the same lines from the same data, so the
 * resolvers live here and are called from both call sites.
 *
 * All three drop entries that are missing/unresolvable (forwards-compat
 * for retired ids; no leaking 'runes.missing.name' placeholders).
 *
 * Pure — no Phaser, no scene access. Inputs are the raw collections;
 * `t()` resolves the i18n key at call time.
 */
import { getRoute } from '../../data/routes';
import type { RoutePick } from '../../data/routes';
import type { RelicSlot } from '../../systems/RelicSystem';
import type { RelicSystem } from '../../systems/RelicSystem';
import { RUNES } from '../../data/runes';
import { t } from '../../core/i18n';

/** W2 Moor Road — picker history → labelKey → t(). Routes whose
 *  labelKey throws (e.g. retired ids) drop silently. */
export function resolveRouteLabels(history: readonly RoutePick[]): string[] {
  return history
    .map((p): string | null => {
      try { return t(getRoute(p.routeKey).labelKey); } catch { return null; }
    })
    .filter((s): s is string => typeof s === 'string');
}

/** R1 — sporran slots → nameKey → t(). Empty-slot defs drop silently. */
export function resolveRelicLabels(relicSystem: RelicSystem | null): string[] {
  const slots: readonly RelicSlot[] = relicSystem?.getSlots() ?? [];
  return slots
    .map((s) => s.def?.nameKey)
    .filter((k): k is string => typeof k === 'string')
    .map((k) => t(k));
}

/** U1 — owned rune ids → RUNES[id].nameKey → t(). Unknown ids drop. */
export function resolveRuneLabels(ownedRuneIds: readonly string[]): string[] {
  return ownedRuneIds
    .map((id) => RUNES[id]?.nameKey)
    .filter((k): k is string => typeof k === 'string')
    .map((k) => t(k));
}
