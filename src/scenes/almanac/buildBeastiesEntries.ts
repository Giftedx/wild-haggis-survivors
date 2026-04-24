/**
 * C1 Highland Almanac — Book 1 (Beasties) view-model builder.
 *
 * Takes a DiscoveryLog + the enemy/boss registries and produces the
 * ordered entry list the renderer draws from. Pure — no Phaser, no
 * i18n, no save reads. `BeastiesBook.ts` adds the Phaser scaffolding
 * on top.
 *
 * Ordering: regulars first, sorted by `appearsAt` ascending (mirrors
 * the wave-timeline reveal order so the page reads as a timeline);
 * bosses last, sorted by their `spawnTimeSec`.
 */

import type { DiscoveryLog, FirstSeenAt } from '../../systems/DiscoveryLog';
import { BOSSES, ENEMY_TYPES, getEnemyDisplayName } from '../../data/enemies';

export interface BeastieEntryVM {
  readonly key: string;
  readonly displayName: string;
  readonly texture: string;
  readonly isBoss: boolean;
  /** In-world spawn time in seconds — used for ordering + "where found" copy. */
  readonly appearsAt: number;
  readonly seen: boolean;
  readonly killCount: number;
  readonly firstSeenAt: FirstSeenAt | null;
}

export function buildBeastiesEntries(log: DiscoveryLog): BeastieEntryVM[] {
  const out: BeastieEntryVM[] = [];

  const regulars = Object.values(ENEMY_TYPES).slice().sort((a, b) => a.appearsAt - b.appearsAt);
  for (const cfg of regulars) {
    const entry = log.beastiesSeen[cfg.key];
    out.push({
      key: cfg.key,
      displayName: getEnemyDisplayName(cfg.key),
      texture: cfg.texture,
      isBoss: false,
      appearsAt: cfg.appearsAt,
      seen: entry !== undefined,
      killCount: entry?.killCount ?? 0,
      firstSeenAt: entry?.firstSeenAt ?? null,
    });
  }

  const bosses = BOSSES.slice().sort((a, b) => a.spawnTimeSec - b.spawnTimeSec);
  for (const boss of bosses) {
    const entry = log.beastiesSeen[boss.key];
    out.push({
      key: boss.key,
      displayName: getEnemyDisplayName(boss.key),
      texture: boss.texture,
      isBoss: true,
      appearsAt: boss.spawnTimeSec,
      seen: entry !== undefined,
      killCount: entry?.killCount ?? 0,
      firstSeenAt: entry?.firstSeenAt ?? null,
    });
  }

  return out;
}

/**
 * Summary stats for the Beasties-tab subtitle ("N of M discovered").
 * Pure wrapper around the entry list so the header pill stays in sync
 * with the body grid.
 */
export function beastiesDiscoverySummary(entries: readonly BeastieEntryVM[]): {
  seen: number;
  total: number;
} {
  let seen = 0;
  for (const e of entries) if (e.seen) seen++;
  return { seen, total: entries.length };
}
