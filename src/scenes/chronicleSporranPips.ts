/**
 * S1 Phase 2 follow-up — Chronicle UI render for sporran picks.
 *
 * Phase 2 (`e183bcb`) persisted `RunHistoryEntry.sporranPicks` and threaded
 * it through replay. ChronicleScene renders a small coloured-pip strip on
 * any history row that carries picks so the run's posture is visible
 * alongside the curse / ironmoor / seasonal badges.
 *
 * Pure resolver — no Phaser. Maps each picked card id to its kind +
 * accent colour. Unknown string IDs become a neutral fallback descriptor:
 * a card renamed in a future release should read as faded old ink, not
 * corrupt past history rows. Sister patterns: `coerceRunHistoryEntry`'s
 * relic filter, `chronicleAggregates`'s variant-name lookup.
 */
import { ALL_SPORRAN_CARDS } from '../data/sporranCards';
import {
  SPORRAN_KIND_ACCENT,
  type SporranKindAccentKey,
} from './sporranTileLayout';
import type { SporranCard, SporranCardKind } from '../systems/sporranDeck';

const MAX_CHRONICLE_SPORRAN_PICKS = 3;
const UNKNOWN_SPORRAN_COLOR = 0x8f97a6;
const SPORRAN_SUMMARY_PREFIX_KEY = 'ui.chronicle.sporran_summary_prefix';
const UNKNOWN_SPORRAN_NAME_KEY = 'sporran.chronicle.unknown_name';
const UNKNOWN_SPORRAN_EFFECT_KEY = 'sporran.chronicle.unknown_effect';

export interface SporranPipDescriptor {
  readonly kind: SporranCardKind;
  /** Hex accent colour, sourced from `SPORRAN_KIND_ACCENT`. */
  readonly color: number;
  /** Original card id (preserved for tooltip / accessibility lookups). */
  readonly cardId: string;
  /** i18n key for the card's display name — caller resolves with `t()`. */
  readonly nameKey: string;
  /** i18n key for the card's full card description. */
  readonly descKey: string;
  /** i18n key for the Chronicle's compact effect summary. */
  readonly effectKey: string;
  /** True when the card id no longer exists in the shipped pool. */
  readonly isFallback?: true;
}

export interface SporranChronicleSummary {
  readonly rowText: string;
  readonly tooltipText: string;
}

export type SporranTextResolver = (key: string) => string;

const cardById: ReadonlyMap<string, SporranCard> = new Map(
  ALL_SPORRAN_CARDS.map((c) => [c.id, c]),
);

const cardKindById: ReadonlyMap<string, SporranCardKind> = new Map(
  ALL_SPORRAN_CARDS.map((c) => [c.id, c.kind]),
);

const cardNameKeyById: ReadonlyMap<string, string> = new Map(
  ALL_SPORRAN_CARDS.map((c) => [c.id, c.nameKey]),
);

function chronicleEffectKeyFor(cardId: string): string {
  return `sporran.chronicle.effect.${cardId}`;
}

function fallbackPip(cardId: string): SporranPipDescriptor {
  return {
    kind: 'quirk',
    color: UNKNOWN_SPORRAN_COLOR,
    cardId,
    nameKey: UNKNOWN_SPORRAN_NAME_KEY,
    descKey: UNKNOWN_SPORRAN_EFFECT_KEY,
    effectKey: UNKNOWN_SPORRAN_EFFECT_KEY,
    isFallback: true,
  };
}

/**
 * Resolve `pickedIds` to ordered pip descriptors. Non-string / empty
 * entries are dropped; unknown string ids get a neutral fallback. Ordering
 * is preserved so the curse/boon/quirk sequence on the chronicle row
 * matches the order the player kept the cards in (Phase 1 sorted indices
 * ascending → consistent left-to-right).
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
    if (out.length >= MAX_CHRONICLE_SPORRAN_PICKS) break;
    if (typeof id !== 'string' || id.length === 0) continue;
    const card = cardById.get(id);
    if (!card) {
      out.push(fallbackPip(id));
      continue;
    }
    const kind = cardKindById.get(id) ?? card.kind;
    const nameKey = cardNameKeyById.get(id) ?? card.nameKey;
    out.push({
      kind,
      color: SPORRAN_KIND_ACCENT[kind as SporranKindAccentKey],
      cardId: id,
      nameKey,
      descKey: card.descKey,
      effectKey: chronicleEffectKeyFor(id),
    });
  }
  return out;
}

function resolveLeaf(resolve: SporranTextResolver, key: string, fallback: string): string {
  const value = resolve(key);
  return value && value !== key ? value : fallback;
}

function compactDescription(desc: string): string {
  const firstSentence = desc.split('.')[0]?.trim();
  return firstSentence && firstSentence.length > 0 ? firstSentence : desc.trim();
}

function resolveEffect(resolve: SporranTextResolver, pip: SporranPipDescriptor): string {
  const effect = resolve(pip.effectKey);
  if (effect && effect !== pip.effectKey) return effect;
  const desc = resolve(pip.descKey);
  if (desc && desc !== pip.descKey) return compactDescription(desc);
  return pip.isFallback ? 'ink faded' : pip.cardId;
}

/**
 * Build compact Chronicle copy for a run's Sporran picks. The row text is
 * short enough for accessibility labels and bounded hover copy; the tooltip
 * keeps each picked card on its own line so uiScale 1.4 can wrap cleanly.
 */
export function formatSporranPicksForChronicle(
  pickedIds: readonly string[] | undefined,
  resolve: SporranTextResolver,
): SporranChronicleSummary | null {
  const pips = buildSporranPipsForChronicle(pickedIds);
  if (pips.length === 0) return null;

  const prefix = resolveLeaf(resolve, SPORRAN_SUMMARY_PREFIX_KEY, 'Sporran');
  const entries = pips.map((pip) => {
    const name = resolveLeaf(resolve, pip.nameKey, pip.cardId);
    const effect = resolveEffect(resolve, pip);
    return { name, effect };
  });

  return {
    rowText: `${prefix}: ${entries.map((e) => `${e.name} (${e.effect})`).join(' · ')}`,
    tooltipText: [
      prefix,
      ...entries.map((e) => `${e.name} — ${e.effect}`),
    ].join('\n'),
  };
}
