import { describe, it, expect, vi } from 'vitest';
import { NodeWaveTracker } from './NodeWaveTracker';
import type { NodeWaveMember } from './NodeWaveTracker';

/**
 * Fake Enemy: holds a position and an `alive` flag plus the tag it was
 * stamped with. `isAliveForWave(tag)` returns true only while active AND
 * the tag still matches — models the Enemy.spawn() reuse reset.
 */
function fakeMember(
  x: number,
  y: number,
  stampedTag: string,
): NodeWaveMember & { x: number; y: number; kill(): void; restamp(tag: string | null): void } {
  let alive = true;
  let tag: string | null = stampedTag;
  return {
    get x() { return x; },
    get y() { return y; },
    isAliveForWave(checkTag: string) {
      return alive && tag === checkTag;
    },
    kill() { alive = false; },
    restamp(newTag: string | null) { tag = newTag; },
  };
}

describe('NodeWaveTracker', () => {
  it('does not fire onClear while any member is alive', () => {
    const tracker = new NodeWaveTracker();
    const onClear = vi.fn();
    const tag = tracker.register(0, 'enc_1', 'encounter', (t) => [
      fakeMember(10, 10, t),
      fakeMember(20, 20, t),
    ], onClear, { x: 5, y: 5 });

    expect(tag).toMatch(/^node-/);
    tracker.tick();
    tracker.tick();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('fires onClear once when all members die', () => {
    const tracker = new NodeWaveTracker();
    const onClear = vi.fn();
    const members = [] as ReturnType<typeof fakeMember>[];
    tracker.register(1, 'enc_a', 'encounter', (t) => {
      members.push(fakeMember(10, 10, t));
      members.push(fakeMember(20, 20, t));
      return members;
    }, onClear, { x: 5, y: 5 });

    members[0]!.kill();
    tracker.tick();
    expect(onClear).not.toHaveBeenCalled();

    members[1]!.kill();
    tracker.tick();
    expect(onClear).toHaveBeenCalledOnce();

    // Extra ticks after clear must not re-fire.
    tracker.tick();
    tracker.tick();
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('passes the last-known centroid to onClear (position captured from prior tick)', () => {
    const tracker = new NodeWaveTracker();
    const onClear = vi.fn();
    const members = [] as ReturnType<typeof fakeMember>[];
    tracker.register(2, 'elite_1', 'elite', (t) => {
      members.push(fakeMember(100, 200, t));
      return members;
    }, onClear, { x: 0, y: 0 });

    // Tick once while alive — lastKnownPos updates to member pos.
    tracker.tick();
    // Kill then tick — centroid of 0 alive → fire with previous value.
    members[0]!.kill();
    tracker.tick();
    expect(onClear).toHaveBeenCalledWith({ x: 100, y: 200 });
  });

  it('uses initial pos when all members dead before first tick', () => {
    const tracker = new NodeWaveTracker();
    const onClear = vi.fn();
    const members = [] as ReturnType<typeof fakeMember>[];
    tracker.register(3, 'elite_2', 'elite', (t) => {
      const m = fakeMember(100, 200, t);
      m.kill();
      members.push(m);
      return members;
    }, onClear, { x: 42, y: 84 });

    tracker.tick();
    expect(onClear).toHaveBeenCalledWith({ x: 42, y: 84 });
  });

  it('fires onClear immediately (no tick needed) when registered with zero members', () => {
    const tracker = new NodeWaveTracker();
    const onClear = vi.fn();
    tracker.register(4, 'enc_empty', 'encounter', () => [], onClear, { x: 7, y: 7 });

    expect(onClear).toHaveBeenCalledOnce();
    expect(onClear).toHaveBeenCalledWith({ x: 7, y: 7 });
  });

  it('tracks parallel waves independently', () => {
    const tracker = new NodeWaveTracker();
    const a = vi.fn();
    const b = vi.fn();
    const memsA = [] as ReturnType<typeof fakeMember>[];
    const memsB = [] as ReturnType<typeof fakeMember>[];
    tracker.register(0, 'enc_a', 'encounter', (t) => {
      memsA.push(fakeMember(10, 10, t));
      return memsA;
    }, a, { x: 0, y: 0 });
    tracker.register(1, 'enc_b', 'encounter', (t) => {
      memsB.push(fakeMember(20, 20, t));
      return memsB;
    }, b, { x: 0, y: 0 });

    memsA[0]!.kill();
    tracker.tick();
    expect(a).toHaveBeenCalledOnce();
    expect(b).not.toHaveBeenCalled();

    memsB[0]!.kill();
    tracker.tick();
    expect(b).toHaveBeenCalledOnce();
  });

  it('treats a member whose tag was overwritten (pool reuse) as dead', () => {
    const tracker = new NodeWaveTracker();
    const onClear = vi.fn();
    const members = [] as ReturnType<typeof fakeMember>[];
    tracker.register(0, 'enc_x', 'encounter', (t) => {
      members.push(fakeMember(10, 10, t));
      return members;
    }, onClear, { x: 0, y: 0 });

    // Simulate pool re-acquire for a different node: new tag stamped on same object.
    members[0]!.restamp('node-1-99');
    tracker.tick();
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('reset() clears pending waves so a new run starts fresh', () => {
    const tracker = new NodeWaveTracker();
    const onClear = vi.fn();
    tracker.register(0, 'enc', 'encounter', (t) => [fakeMember(10, 10, t)], onClear, { x: 0, y: 0 });
    expect(tracker.pendingCount()).toBe(1);
    tracker.reset();
    expect(tracker.pendingCount()).toBe(0);
    // After reset, killing the stale member no longer triggers.
    tracker.tick();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('register returns monotonically increasing tags per tracker', () => {
    const tracker = new NodeWaveTracker();
    const noop = () => {};
    const t1 = tracker.register(0, 'a', 'encounter', () => [], noop, { x: 0, y: 0 });
    const t2 = tracker.register(1, 'b', 'encounter', () => [], noop, { x: 0, y: 0 });
    const t3 = tracker.register(2, 'c', 'elite', () => [], noop, { x: 0, y: 0 });
    expect(t1).not.toBe(t2);
    expect(t2).not.toBe(t3);
    expect(new Set([t1, t2, t3]).size).toBe(3);
  });
});
