import { describe, expect, it } from 'vitest';

import { createEmptyDiscoveryLog, recordBeastieSeen } from './DiscoveryLog';

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
