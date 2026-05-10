/**
 * S1 Phase 2 follow-up — Chronicle UI render for sporran picks.
 *
 * Phase 2 (`e183bcb`) persisted `RunHistoryEntry.sporranPicks` and threaded
 * it through replay. ChronicleScene renders a small coloured-pip strip on
 * any history row that carries picks so the run's posture is visible
 * alongside the curse / ironmoor / seasonal badges.
 *
 * Pure resolver — no Phaser. Maps each picked card id to its kind +
 * accent colour, dropping unknown ids silently (a card renamed in a
 * future release shouldn't corrupt past history rows). Sister patterns:
 * `coerceRunHistoryEntry`'s relic filter, `chronicleAggregates`'s
 * variant-name lookup.
 */
import { ALL_SPORRAN_CARDS } from '../data/sporranCards';
import {
  SPORRAN_KIND_ACCENT,
  type SporranKindAccentKey,
} from './sporranTileLayout';
import type { SporranCardKind } from '../systems/sporranDeck';

export interface SporranPipDescriptor {
  readonly kind: SporranCardKind;
  /** Hex accent colour, sourced from `SPORRAN_KIND_ACCENT`. */
  readonly color: number;
  /** Original card id (preserved for tooltip / accessibility lookups). */
  readonly cardId: string;
  /** i18n key for the card's display name — caller resolves with `t()`. */
  readonly nameKey: string;
}

const cardKindById: ReadonlyMap<string, SporranCardKind> = new Map(
  ALL_SPORRAN_CARDS.map((c) => [c.id, c.kind]),
);

const cardNameKeyById: ReadonlyMap<string, string> = new Map(
  ALL_SPORRAN_CARDS.map((c) => [c.id, c.nameKey]),
);

/**
 * Resolve `pickedIds` to ordered pip descriptors. Unknown / non-string
 * entries are dropped; ordering is preserved so the curse/boon/quirk
 * sequence on the chronicle row matches the order the player kept the
 * cards in (Phase 1 sorted indices ascending → consistent left-to-right).
 *
 * Returns `[]` for absent / empty input — caller short-circuits the row
 * render without checking length.
 */
export function buildSporranPipsForChronicle(
  pickedIds: readonly string[] | undefined,
): SporranPipDescriptor[] {
  if (!Array.isArray(pickedIds) || pickedIds.length === 0) return [];
  const out: SporranPipDescriptor[] = [];
  for (const id of pickedIds) {
    if (typeof id !== 'string' || id.length === 0) continue;
    const kind = cardKindById.get(id);
    if (!kind) continue;
    const nameKey = cardNameKeyById.get(id) ?? '';
    out.push({
      kind,
      color: SPORRAN_KIND_ACCENT[kind as SporranKindAccentKey],
      cardId: id,
      nameKey,
    });
  }
  return out;
}
