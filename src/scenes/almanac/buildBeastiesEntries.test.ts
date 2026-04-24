import { describe, expect, it } from 'vitest';
import { createEmptyDiscoveryLog, recordBeastieSeen, recordBeastieKilled } from '../../systems/DiscoveryLog';
import { buildBeastiesEntries } from './buildBeastiesEntries';
import { ENEMY_TYPES, BOSSES } from '../../data/enemies';

describe('buildBeastiesEntries', () => {
  it('yields one entry per enemy type + boss', () => {
    const entries = buildBeastiesEntries(createEmptyDiscoveryLog());
    const expectedCount = Object.keys(ENEMY_TYPES).length + BOSSES.length;
    expect(entries.length).toBe(expectedCount);
  });

  it('orders regulars by appearsAt (ascending) then bosses by spawn time', () => {
    const entries = buildBeastiesEntries(createEmptyDiscoveryLog());
    const regulars = entries.filter((e) => !e.isBoss);
    const bosses = entries.filter((e) => e.isBoss);
    expect(entries.slice(0, regulars.length).every((e) => !e.isBoss)).toBe(true);
    expect(entries.slice(regulars.length).every((e) => e.isBoss)).toBe(true);

    for (let i = 1; i < regulars.length; i++) {
      expect(regulars[i].appearsAt).toBeGreaterThanOrEqual(regulars[i - 1].appearsAt);
    }
    for (let i = 1; i < bosses.length; i++) {
      expect(bosses[i].appearsAt).toBeGreaterThanOrEqual(bosses[i - 1].appearsAt);
    }
  });

  it('marks an unseen beastie with seen=false, killCount=0, empty firstSeen', () => {
    const entries = buildBeastiesEntries(createEmptyDiscoveryLog());
    const tourist = entries.find((e) => e.key === 'tourist')!;
    expect(tourist.seen).toBe(false);
    expect(tourist.killCount).toBe(0);
    expect(tourist.firstSeenAt).toBeNull();
    expect(tourist.displayName).toBe('Tourist'); // resolved from key for layout; silhouette masks it in Task 9
  });

  it('reads seen + kill counts off a populated DiscoveryLog', () => {
    let log = createEmptyDiscoveryLog();
    log = recordBeastieSeen(log, 'tourist', 'run-1', 123);
    log = recordBeastieKilled(log, 'tourist');
    log = recordBeastieKilled(log, 'tourist');
    const tourist = buildBeastiesEntries(log).find((e) => e.key === 'tourist')!;
    expect(tourist.seen).toBe(true);
    expect(tourist.killCount).toBe(2);
    expect(tourist.firstSeenAt).toEqual({ runId: 'run-1', timestamp: 123 });
  });

  it('flags bosses with isBoss=true and resolves their display name', () => {
    const entries = buildBeastiesEntries(createEmptyDiscoveryLog());
    const gordon = entries.find((e) => e.key === 'gordon')!;
    expect(gordon.isBoss).toBe(true);
    expect(gordon.displayName).toBe('Gordon the Chef');
  });

  it('exposes texture keys so the book renderer can draw sprites', () => {
    const entries = buildBeastiesEntries(createEmptyDiscoveryLog());
    const tourist = entries.find((e) => e.key === 'tourist')!;
    const gordon = entries.find((e) => e.key === 'gordon')!;
    expect(tourist.texture).toBe('tourist');
    expect(gordon.texture).toBe('boss_gordon');
  });
});
