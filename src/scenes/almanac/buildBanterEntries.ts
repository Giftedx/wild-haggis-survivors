/**
 * C1 Highland Almanac — Book 4 (Banter) view-model builder.
 *
 * Aggregates every `BanterPool` declared in `src/data/banter.ts` into a
 * discovery-log-aware VM. Each pool lists its declared lines (generic
 * + every sub-pool keyed by tag) and marks which ones have been heard,
 * hear counts, first-heard stamps. Pure — no Phaser, no i18n, no save
 * reads. `BanterBook.ts` adds Phaser scaffolding on top.
 *
 * Ordering: pools by priority descending, then context alphabetically
 * as a tiebreaker. The page reads "loudest moments first" — boss_warn
 * / low_hp / first_time sit above idle commentary.
 */

import type { DiscoveryLog, FirstSeenAt } from '../../systems/DiscoveryLog';
import { BANTER_POOLS, type BanterContext, type BanterPool, type BanterTone } from '../../data/banter';

export interface BanterLineVM {
  readonly key: string;
  /** `null` = generic pool line; otherwise the sub-pool tag (boss id, variant, etc.). */
  readonly tag: string | null;
  readonly heard: boolean;
  readonly hearCount: number;
  readonly firstHeardAt: FirstSeenAt | null;
}

export interface BanterPoolEntryVM {
  /** Key used by `AlmanacScene` expand state — equals the pool context. */
  readonly key: string;
  readonly context: BanterContext;
  readonly tone: BanterTone;
  readonly priority: number;
  readonly rare: boolean;
  readonly totalLines: number;
  readonly heardLines: number;
  readonly lines: readonly BanterLineVM[];
}

export function buildBanterEntries(log: DiscoveryLog): BanterPoolEntryVM[] {
  return BANTER_POOLS
    .map((pool) => toEntry(pool, log))
    .sort((a, b) => b.priority - a.priority || a.context.localeCompare(b.context));
}

function toEntry(pool: BanterPool, log: DiscoveryLog): BanterPoolEntryVM {
  const lines: BanterLineVM[] = [];
  for (const key of pool.keys) lines.push(toLine(key, null, log));
  if (pool.keysByTag) {
    for (const [tag, keys] of Object.entries(pool.keysByTag)) {
      for (const key of keys) lines.push(toLine(key, tag, log));
    }
  }
  let heardLines = 0;
  for (const l of lines) if (l.heard) heardLines++;
  return {
    key: pool.context,
    context: pool.context,
    tone: pool.tone,
    priority: pool.priority,
    rare: pool.rare === true,
    totalLines: lines.length,
    heardLines,
    lines,
  };
}

function toLine(key: string, tag: string | null, log: DiscoveryLog): BanterLineVM {
  const entry = log.banterHeard[key];
  return {
    key,
    tag,
    heard: entry !== undefined,
    hearCount: entry?.hearCount ?? 0,
    firstHeardAt: entry?.firstHeardAt ?? null,
  };
}

/**
 * Summary stats for the Banter-tab header pill ("X of Y lines heard,
 * N of M pools discovered"). Pure wrapper so the pill stays in sync
 * with the body list.
 */
export function banterDiscoverySummary(entries: readonly BanterPoolEntryVM[]): {
  heardLines: number;
  totalLines: number;
  poolsDiscovered: number;
  poolsTotal: number;
} {
  let heardLines = 0;
  let totalLines = 0;
  let poolsDiscovered = 0;
  for (const e of entries) {
    heardLines += e.heardLines;
    totalLines += e.totalLines;
    if (e.heardLines > 0) poolsDiscovered++;
  }
  return { heardLines, totalLines, poolsDiscovered, poolsTotal: entries.length };
}
