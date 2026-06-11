import { describe, expect, it } from 'vitest';

import {
  createEmptyDiscoveryLog,
  discoveryLogFromJSON,
  discoveryLogToJSON,
  recordBanterHeard,
  recordBeastieKilled,
  recordBeastieSeen,
  recordItemAcquired,
  recordRoutePicked,
  retroactiveSeedFromHistory,
  BANTER_HEAR_COUNT_CAP,
} from './DiscoveryLog';

describe('DiscoveryLog scaffold', () => {
  it('creates an empty log with all tracking sets empty and zero visits', () => {
    const log = createEmptyDiscoveryLog();

    expect(log.beastiesSeen).toEqual({});
    expect(log.routesVisited).toEqual({});
    expect(log.findsAcquired).toEqual({});
    expect(log.banterHeard).toEqual({});
    expect(log.almanacVisits).toBe(0);
  });

  it('returns a fresh object on every call (no shared mutable state)', () => {
    const a = createEmptyDiscoveryLog();
    const b = createEmptyDiscoveryLog();

    expect(a).not.toBe(b);
    expect(a.beastiesSeen).not.toBe(b.beastiesSeen);
  });
});

describe('DiscoveryLog.recordBeastieSeen', () => {
  it('seeds seenCount=1 + firstSeenAt on first encounter', () => {
    const log = recordBeastieSeen(createEmptyDiscoveryLog(), 'kelpie', 'run-42', 1700);

    expect(log.beastiesSeen.kelpie).toEqual({
      firstSeenAt: { runId: 'run-42', timestamp: 1700 },
      seenCount: 1,
      killCount: 0,
    });
  });

  it('increments seenCount on subsequent encounters without touching firstSeenAt', () => {
    let log = recordBeastieSeen(createEmptyDiscoveryLog(), 'kelpie', 'run-42', 1700);
    log = recordBeastieSeen(log, 'kelpie', 'run-43', 9999);
    log = recordBeastieSeen(log, 'kelpie', 'run-44', 12345);

    expect(log.beastiesSeen.kelpie.seenCount).toBe(3);
    expect(log.beastiesSeen.kelpie.firstSeenAt).toEqual({ runId: 'run-42', timestamp: 1700 });
  });

  it('tracks multiple beasties independently', () => {
    let log = recordBeastieSeen(createEmptyDiscoveryLog(), 'kelpie', 'run-42', 1700);
    log = recordBeastieSeen(log, 'midge', 'run-42', 1800);
    log = recordBeastieSeen(log, 'kelpie', 'run-43', 2000);

    expect(log.beastiesSeen.kelpie.seenCount).toBe(2);
    expect(log.beastiesSeen.midge.seenCount).toBe(1);
    expect(log.beastiesSeen.midge.firstSeenAt.runId).toBe('run-42');
  });

  it('never mutates the input log', () => {
    const empty = createEmptyDiscoveryLog();
    const next = recordBeastieSeen(empty, 'kelpie', 'run-1', 100);

    expect(empty.beastiesSeen).toEqual({});
    expect(next).not.toBe(empty);
  });

  it('ignores empty beastie keys (defensive — no-op returns same ref)', () => {
    const empty = createEmptyDiscoveryLog();
    const next = recordBeastieSeen(empty, '', 'run-1', 100);

    expect(next).toBe(empty);
  });
});

describe('DiscoveryLog.recordBeastieKilled', () => {
  it('requires a prior seen entry — kill on unseen beastie is a no-op', () => {
    const empty = createEmptyDiscoveryLog();
    const next = recordBeastieKilled(empty, 'kelpie');

    expect(next).toBe(empty);
  });

  it('increments killCount on a previously-seen beastie', () => {
    let log = recordBeastieSeen(createEmptyDiscoveryLog(), 'kelpie', 'run-1', 100);
    log = recordBeastieKilled(log, 'kelpie');
    log = recordBeastieKilled(log, 'kelpie');

    expect(log.beastiesSeen.kelpie.killCount).toBe(2);
    expect(log.beastiesSeen.kelpie.seenCount).toBe(1);
  });

  it('is a no-op on empty key', () => {
    const log = recordBeastieSeen(createEmptyDiscoveryLog(), 'kelpie', 'run-1', 100);
    const next = recordBeastieKilled(log, '');
    expect(next).toBe(log);
  });
});

describe('DiscoveryLog.recordRoutePicked', () => {
  it('seeds firstPickedAt + pickCount=1 on first pick', () => {
    const log = recordRoutePicked(createEmptyDiscoveryLog(), 'up_the_brae', 'run-1', 555);

    expect(log.routesVisited.up_the_brae).toEqual({
      firstPickedAt: { runId: 'run-1', timestamp: 555 },
      pickCount: 1,
    });
  });

  it('increments pickCount; firstPickedAt immutable', () => {
    let log = recordRoutePicked(createEmptyDiscoveryLog(), 'up_the_brae', 'run-1', 555);
    log = recordRoutePicked(log, 'up_the_brae', 'run-2', 999);

    expect(log.routesVisited.up_the_brae.pickCount).toBe(2);
    expect(log.routesVisited.up_the_brae.firstPickedAt.runId).toBe('run-1');
  });

  it('is a no-op on empty key', () => {
    const empty = createEmptyDiscoveryLog();
    expect(recordRoutePicked(empty, '', 'run-1', 1)).toBe(empty);
  });
});

describe('DiscoveryLog.recordItemAcquired', () => {
  it('seeds firstAcquiredAt + acquireCount=1', () => {
    const log = recordItemAcquired(createEmptyDiscoveryLog(), 'thistle_shot', 'run-1', 100);

    expect(log.findsAcquired.thistle_shot).toEqual({
      firstAcquiredAt: { runId: 'run-1', timestamp: 100 },
      acquireCount: 1,
    });
  });

  it('increments acquireCount; firstAcquiredAt immutable', () => {
    let log = recordItemAcquired(createEmptyDiscoveryLog(), 'thistle_shot', 'run-1', 100);
    log = recordItemAcquired(log, 'thistle_shot', 'run-2', 200);
    log = recordItemAcquired(log, 'thistle_shot', 'run-3', 300);

    expect(log.findsAcquired.thistle_shot.acquireCount).toBe(3);
    expect(log.findsAcquired.thistle_shot.firstAcquiredAt).toEqual({
      runId: 'run-1',
      timestamp: 100,
    });
  });

  it('is a no-op on empty key', () => {
    const empty = createEmptyDiscoveryLog();
    expect(recordItemAcquired(empty, '', 'run-1', 1)).toBe(empty);
  });
});

describe('DiscoveryLog.recordBanterHeard', () => {
  it('seeds firstHeardAt + hearCount=1', () => {
    const log = recordBanterHeard(
      createEmptyDiscoveryLog(),
      'ui.banter.gran_commentary.run_start.0',
      'run-1',
      500,
    );

    expect(log.banterHeard['ui.banter.gran_commentary.run_start.0']).toEqual({
      firstHeardAt: { runId: 'run-1', timestamp: 500 },
      hearCount: 1,
    });
  });

  it('caps hearCount at the configured max to keep save size bounded', () => {
    let log = createEmptyDiscoveryLog();
    const leafKey = 'ui.banter.haggis_ambient.0';
    for (let i = 0; i < BANTER_HEAR_COUNT_CAP + 100; i++) {
      log = recordBanterHeard(log, leafKey, 'run-1', 1);
    }
    expect(log.banterHeard[leafKey].hearCount).toBe(BANTER_HEAR_COUNT_CAP);
  });

  it('is a no-op on empty leaf key', () => {
    const empty = createEmptyDiscoveryLog();
    expect(recordBanterHeard(empty, '', 'run-1', 1)).toBe(empty);
  });
});

describe('DiscoveryLog serialisation', () => {
  it('round-trips an empty log through JSON', () => {
    const empty = createEmptyDiscoveryLog();
    const revived = discoveryLogFromJSON(JSON.parse(JSON.stringify(discoveryLogToJSON(empty))));
    expect(revived).toEqual(empty);
  });

  it('round-trips a populated log through JSON', () => {
    let log = createEmptyDiscoveryLog();
    log = recordBeastieSeen(log, 'kelpie', 'run-1', 100);
    log = recordBeastieKilled(log, 'kelpie');
    log = recordRoutePicked(log, 'up_the_brae', 'run-1', 150);
    log = recordItemAcquired(log, 'thistle_shot', 'run-1', 200);
    log = recordBanterHeard(log, 'ui.banter.gran.run_start.0', 'run-1', 250);

    const revived = discoveryLogFromJSON(JSON.parse(JSON.stringify(discoveryLogToJSON(log))));
    expect(revived).toEqual(log);
  });

  it('fromJSON on non-object returns an empty log', () => {
    expect(discoveryLogFromJSON(null)).toEqual(createEmptyDiscoveryLog());
    expect(discoveryLogFromJSON(undefined)).toEqual(createEmptyDiscoveryLog());
    expect(discoveryLogFromJSON('nope')).toEqual(createEmptyDiscoveryLog());
    expect(discoveryLogFromJSON([1, 2, 3])).toEqual(createEmptyDiscoveryLog());
  });

  it('fromJSON drops malformed beastie entries but keeps good ones', () => {
    const revived = discoveryLogFromJSON({
      beastiesSeen: {
        kelpie: { firstSeenAt: { runId: 'run-1', timestamp: 100 }, seenCount: 3, killCount: 2 },
        broken_no_seen: { firstSeenAt: { runId: 'run-1', timestamp: 1 } },
        broken_bad_first: { firstSeenAt: 'not an object', seenCount: 1, killCount: 0 },
        broken_neg_count: {
          firstSeenAt: { runId: 'run-1', timestamp: 1 },
          seenCount: -5,
          killCount: 0,
        },
      },
      routesVisited: {},
      findsAcquired: {},
      banterHeard: {},
      almanacVisits: 0,
    });
    expect(Object.keys(revived.beastiesSeen)).toEqual(['kelpie']);
    expect(revived.beastiesSeen.kelpie.seenCount).toBe(3);
  });

  it('fromJSON tolerates missing subsections and defaults them', () => {
    const revived = discoveryLogFromJSON({ almanacVisits: 7 });
    expect(revived.beastiesSeen).toEqual({});
    expect(revived.routesVisited).toEqual({});
    expect(revived.findsAcquired).toEqual({});
    expect(revived.banterHeard).toEqual({});
    expect(revived.almanacVisits).toBe(7);
  });

  it('fromJSON coerces non-integer almanacVisits to 0', () => {
    expect(discoveryLogFromJSON({ almanacVisits: 'seven' }).almanacVisits).toBe(0);
    expect(discoveryLogFromJSON({ almanacVisits: Number.NaN }).almanacVisits).toBe(0);
    expect(discoveryLogFromJSON({ almanacVisits: -3 }).almanacVisits).toBe(0);
  });

  it('fromJSON clamps banter hearCount to the cap on revive (defensive)', () => {
    const revived = discoveryLogFromJSON({
      banterHeard: {
        'leaf.a': {
          firstHeardAt: { runId: 'run-1', timestamp: 1 },
          hearCount: BANTER_HEAR_COUNT_CAP + 5000,
        },
      },
    });
    expect(revived.banterHeard['leaf.a'].hearCount).toBe(BANTER_HEAR_COUNT_CAP);
  });
});

describe('DiscoveryLog.retroactiveSeedFromHistory', () => {
  it('returns empty log on empty history', () => {
    expect(retroactiveSeedFromHistory([])).toEqual(createEmptyDiscoveryLog());
  });

  it('seeds routes + weapons from run history, sorted by timestamp', () => {
    const log = retroactiveSeedFromHistory([
      {
        timestamp: 2000,
        weaponKeys: ['thistle_shot', 'claymore'],
        routes: [{ routeKey: 'up_the_brae' }],
        runSeed: 42,
      },
      {
        timestamp: 1000,
        weaponKeys: ['thistle_shot'],
        routes: [{ routeKey: 'through_the_kirkyard' }, { routeKey: 'up_the_brae' }],
        runSeed: 7,
      },
    ]);

    expect(log.routesVisited.up_the_brae.pickCount).toBe(2);
    expect(log.routesVisited.up_the_brae.firstPickedAt).toEqual({
      runId: 'legacy:7',
      timestamp: 1000,
    });
    expect(log.routesVisited.through_the_kirkyard.pickCount).toBe(1);
    expect(log.findsAcquired.thistle_shot.acquireCount).toBe(2);
    expect(log.findsAcquired.claymore.acquireCount).toBe(1);
    expect(log.findsAcquired.thistle_shot.firstAcquiredAt.runId).toBe('legacy:7');
  });

  it('falls back to timestamp-based runId when runSeed is absent', () => {
    const log = retroactiveSeedFromHistory([
      {
        timestamp: 5555,
        weaponKeys: ['thistle_shot'],
        routes: [{ routeKey: 'up_the_brae' }],
      },
    ]);
    expect(log.findsAcquired.thistle_shot.firstAcquiredAt.runId).toBe('legacy:5555');
  });

  it('leaves beasties + banter empty (not reconstructible from history)', () => {
    const log = retroactiveSeedFromHistory([
      { timestamp: 1, weaponKeys: ['thistle_shot'], routes: [{ routeKey: 'up_the_brae' }] },
    ]);
    expect(log.beastiesSeen).toEqual({});
    expect(log.banterHeard).toEqual({});
    expect(log.almanacVisits).toBe(0);
  });

  it('tolerates missing routes / weapons fields', () => {
    const log = retroactiveSeedFromHistory([{ timestamp: 1, weaponKeys: [] }]);
    expect(log.routesVisited).toEqual({});
    expect(log.findsAcquired).toEqual({});
  });
});
