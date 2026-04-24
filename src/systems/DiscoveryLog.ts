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

/**
 * Hard cap on `banterHeard[*].hearCount` per spec §8 risk-mitigation —
 * keeps the save bounded for mature players. Beyond the cap the line
 * has clearly been heard; finer resolution isn't useful.
 */
export const BANTER_HEAR_COUNT_CAP = 1000;

/**
 * Record a beastie encounter. Seeds `firstSeenAt` on the first call for
 * this key and increments `seenCount` on every call. Returns a new log;
 * never mutates the input. Empty `beastieKey` is a no-op (same ref back).
 */
export function recordBeastieSeen(
  log: DiscoveryLog,
  beastieKey: string,
  runId: string,
  timestamp: number,
): DiscoveryLog {
  if (!beastieKey) return log;
  const prev = log.beastiesSeen[beastieKey];
  const entry: BeastieEntry = prev
    ? { ...prev, seenCount: prev.seenCount + 1 }
    : { firstSeenAt: { runId, timestamp }, seenCount: 1, killCount: 0 };
  return {
    ...log,
    beastiesSeen: { ...log.beastiesSeen, [beastieKey]: entry },
  };
}

/**
 * Increment `killCount` for a beastie. Requires a prior `recordBeastieSeen`
 * (you cannot kill what you haven't seen) — no-op same-ref otherwise so
 * defensive callers don't have to order-guarantee spawn-before-death.
 */
export function recordBeastieKilled(log: DiscoveryLog, beastieKey: string): DiscoveryLog {
  if (!beastieKey) return log;
  const prev = log.beastiesSeen[beastieKey];
  if (!prev) return log;
  return {
    ...log,
    beastiesSeen: {
      ...log.beastiesSeen,
      [beastieKey]: { ...prev, killCount: prev.killCount + 1 },
    },
  };
}

/**
 * Record a Moor Road route pick. Seeds `firstPickedAt` on first pick,
 * bumps `pickCount` thereafter.
 */
export function recordRoutePicked(
  log: DiscoveryLog,
  routeKey: string,
  runId: string,
  timestamp: number,
): DiscoveryLog {
  if (!routeKey) return log;
  const prev = log.routesVisited[routeKey];
  const entry: RouteEntry = prev
    ? { ...prev, pickCount: prev.pickCount + 1 }
    : { firstPickedAt: { runId, timestamp }, pickCount: 1 };
  return {
    ...log,
    routesVisited: { ...log.routesVisited, [routeKey]: entry },
  };
}

/**
 * Record an item acquisition (weapon / passive / relic / perm-upgrade).
 * Seeds `firstAcquiredAt`, increments `acquireCount`.
 */
export function recordItemAcquired(
  log: DiscoveryLog,
  findKey: string,
  runId: string,
  timestamp: number,
): DiscoveryLog {
  if (!findKey) return log;
  const prev = log.findsAcquired[findKey];
  const entry: FindEntry = prev
    ? { ...prev, acquireCount: prev.acquireCount + 1 }
    : { firstAcquiredAt: { runId, timestamp }, acquireCount: 1 };
  return {
    ...log,
    findsAcquired: { ...log.findsAcquired, [findKey]: entry },
  };
}

/**
 * Record a banter leaf firing. Seeds `firstHeardAt`, bumps `hearCount`
 * up to `BANTER_HEAR_COUNT_CAP`.
 */
export function recordBanterHeard(
  log: DiscoveryLog,
  leafKey: string,
  runId: string,
  timestamp: number,
): DiscoveryLog {
  if (!leafKey) return log;
  const prev = log.banterHeard[leafKey];
  const entry: BanterEntry = prev
    ? { ...prev, hearCount: Math.min(prev.hearCount + 1, BANTER_HEAR_COUNT_CAP) }
    : { firstHeardAt: { runId, timestamp }, hearCount: 1 };
  return {
    ...log,
    banterHeard: { ...log.banterHeard, [leafKey]: entry },
  };
}

/**
 * Serialise to a JSON-safe plain object. DiscoveryLog is already plain
 * data, so this is essentially identity — the function exists to name
 * the save-boundary contract and to mirror `discoveryLogFromJSON`.
 */
export function discoveryLogToJSON(log: DiscoveryLog): unknown {
  return {
    beastiesSeen: log.beastiesSeen,
    routesVisited: log.routesVisited,
    findsAcquired: log.findsAcquired,
    banterHeard: log.banterHeard,
    almanacVisits: log.almanacVisits,
  };
}

/**
 * Defensive coercion from persisted JSON back into a DiscoveryLog.
 * Drops malformed entries silently (same pattern as `coerceStringArray`
 * + `coerceRunHistoryEntry` in save.ts). Missing subsections default
 * to empty; non-object input returns an empty log.
 */
export function discoveryLogFromJSON(raw: unknown): DiscoveryLog {
  if (!isPlainRecord(raw)) return createEmptyDiscoveryLog();
  return {
    beastiesSeen: coerceBeastieMap(raw.beastiesSeen),
    routesVisited: coerceRouteMap(raw.routesVisited),
    findsAcquired: coerceFindMap(raw.findsAcquired),
    banterHeard: coerceBanterMap(raw.banterHeard),
    almanacVisits: coerceNonNegInt(raw.almanacVisits),
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function coerceNonNegInt(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function coerceFirstSeenAt(raw: unknown): FirstSeenAt | null {
  if (!isPlainRecord(raw)) return null;
  const runId = typeof raw.runId === 'string' ? raw.runId : null;
  const timestamp =
    typeof raw.timestamp === 'number' && Number.isFinite(raw.timestamp)
      ? Math.floor(raw.timestamp)
      : null;
  if (runId === null || timestamp === null) return null;
  return { runId, timestamp };
}

function coerceBeastieMap(raw: unknown): Record<string, BeastieEntry> {
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, BeastieEntry> = {};
  for (const [key, rawEntry] of Object.entries(raw)) {
    if (!key || !isPlainRecord(rawEntry)) continue;
    const firstSeenAt = coerceFirstSeenAt(rawEntry.firstSeenAt);
    if (!firstSeenAt) continue;
    if (typeof rawEntry.seenCount !== 'number' || typeof rawEntry.killCount !== 'number') continue;
    const seenCount = coerceNonNegInt(rawEntry.seenCount);
    const killCount = coerceNonNegInt(rawEntry.killCount);
    if (seenCount < 1) continue;
    out[key] = { firstSeenAt, seenCount, killCount };
  }
  return out;
}

function coerceRouteMap(raw: unknown): Record<string, RouteEntry> {
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, RouteEntry> = {};
  for (const [key, rawEntry] of Object.entries(raw)) {
    if (!key || !isPlainRecord(rawEntry)) continue;
    const firstPickedAt = coerceFirstSeenAt(rawEntry.firstPickedAt);
    if (!firstPickedAt) continue;
    const pickCount = coerceNonNegInt(rawEntry.pickCount);
    if (pickCount < 1) continue;
    out[key] = { firstPickedAt, pickCount };
  }
  return out;
}

function coerceFindMap(raw: unknown): Record<string, FindEntry> {
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, FindEntry> = {};
  for (const [key, rawEntry] of Object.entries(raw)) {
    if (!key || !isPlainRecord(rawEntry)) continue;
    const firstAcquiredAt = coerceFirstSeenAt(rawEntry.firstAcquiredAt);
    if (!firstAcquiredAt) continue;
    const acquireCount = coerceNonNegInt(rawEntry.acquireCount);
    if (acquireCount < 1) continue;
    out[key] = { firstAcquiredAt, acquireCount };
  }
  return out;
}

function coerceBanterMap(raw: unknown): Record<string, BanterEntry> {
  if (!isPlainRecord(raw)) return {};
  const out: Record<string, BanterEntry> = {};
  for (const [key, rawEntry] of Object.entries(raw)) {
    if (!key || !isPlainRecord(rawEntry)) continue;
    const firstHeardAt = coerceFirstSeenAt(rawEntry.firstHeardAt);
    if (!firstHeardAt) continue;
    const hearCount = coerceNonNegInt(rawEntry.hearCount);
    if (hearCount < 1) continue;
    out[key] = { firstHeardAt, hearCount: Math.min(hearCount, BANTER_HEAR_COUNT_CAP) };
  }
  return out;
}
