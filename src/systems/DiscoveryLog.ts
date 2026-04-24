/**
 * C1 Highland Almanac — DiscoveryLog pure state module.
 *
 * Tracks what the player has encountered across runs: beasties seen + killed,
 * routes picked, finds acquired, banter heard. Feeds the four-book Almanac
 * per `docs/superpowers/specs/2026-04-23-highland-almanac-design.md §3`.
 *
 * Pure data — no Phaser, no localStorage. Save integration lives in
 * `src/utils/save.ts` (schema bump + migration + retroactive seed).
 */

export interface FirstSeenAt {
  readonly runId: string;
  readonly timestamp: number;
}

export interface BeastieEntry {
  readonly firstSeenAt: FirstSeenAt;
  readonly killCount: number;
  readonly seenCount: number;
}

export interface RouteEntry {
  readonly firstPickedAt: FirstSeenAt;
  readonly pickCount: number;
}

export interface FindEntry {
  readonly firstAcquiredAt: FirstSeenAt;
  readonly acquireCount: number;
}

export interface BanterEntry {
  readonly firstHeardAt: FirstSeenAt;
  readonly hearCount: number;
}

export interface DiscoveryLog {
  readonly beastiesSeen: Readonly<Record<string, BeastieEntry>>;
  readonly routesVisited: Readonly<Record<string, RouteEntry>>;
  readonly findsAcquired: Readonly<Record<string, FindEntry>>;
  readonly banterHeard: Readonly<Record<string, BanterEntry>>;
  readonly almanacVisits: number;
}

export function createEmptyDiscoveryLog(): DiscoveryLog {
  return {
    beastiesSeen: {},
    routesVisited: {},
    findsAcquired: {},
    banterHeard: {},
    almanacVisits: 0,
  };
}
