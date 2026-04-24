import { describe, expect, it } from 'vitest';

import { createEmptyDiscoveryLog } from './DiscoveryLog';

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
