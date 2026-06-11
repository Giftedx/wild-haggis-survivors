/**
 * Relic pick-rate histogram — pure aggregation for the T29 playtest
 * loop (R1 M4.5 P6). Consumes the meta save's run history and returns
 * "how often each Relic appeared" + "how often it showed up out of
 * runs where any relic drop was eligible".
 *
 * The M4 T25 data pass guarantees each RunHistoryEntry's `relics`
 * field is `RelicKey[]` or absent; we treat absent as "no data"
 * (pre-R1 entries, or runs where the sporran stayed empty). Kill-
 * criteria thresholds (<5% / >70%) live in the plan, not here —
 * this file just gives playtesters the raw signal.
 */
import type { RelicKey } from '../../data/relics';
import { RELIC_KEYS } from '../../data/relics';
import type { RunHistoryEntry } from '../../utils/save';

export interface RelicHistogramRow {
  readonly relicKey: RelicKey;
  readonly pickCount: number;
  readonly pickRate: number;
}

export interface RelicHistogramSummary {
  /** Number of runs considered (runs that could have dropped a Relic). */
  readonly sampleRuns: number;
  /** Number of runs where at least one Relic was held at run-end. */
  readonly runsWithAnyRelic: number;
  /** One row per authored Relic; sorted by pickCount desc. */
  readonly rows: readonly RelicHistogramRow[];
}

export function computeRelicHistogram(
  history: readonly RunHistoryEntry[],
): RelicHistogramSummary {
  const counts = new Map<RelicKey, number>();
  for (const key of RELIC_KEYS) counts.set(key, 0);

  let sampleRuns = 0;
  let runsWithAnyRelic = 0;

  for (const entry of history) {
    // Pre-R1 entries lack `relics` entirely — skip so they don't dilute
    // the denominator with runs that physically couldn't drop Relics.
    if (!entry.relics) continue;
    sampleRuns++;
    const relics = entry.relics;
    if (relics.length > 0) runsWithAnyRelic++;
    // Dedupe within a single run — a relic held at run-end counts once.
    const seen = new Set<RelicKey>();
    for (const key of relics) {
      if (seen.has(key)) continue;
      seen.add(key);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const rows: RelicHistogramRow[] = [];
  for (const key of RELIC_KEYS) {
    const pickCount = counts.get(key) ?? 0;
    rows.push({
      relicKey: key,
      pickCount,
      pickRate: sampleRuns > 0 ? pickCount / sampleRuns : 0,
    });
  }
  rows.sort((a, b) => b.pickCount - a.pickCount);

  return { sampleRuns, runsWithAnyRelic, rows };
}

/**
 * Human-readable one-liner per row for the Chronicle dev pane.
 * e.g. "sporran_of_holding — 18/42 (43%)".
 */
export function formatRelicHistogramRow(
  row: RelicHistogramRow,
  sampleRuns: number,
): string {
  const pct = sampleRuns > 0 ? Math.round(row.pickRate * 100) : 0;
  return `${row.relicKey} — ${row.pickCount}/${sampleRuns} (${pct}%)`;
}
