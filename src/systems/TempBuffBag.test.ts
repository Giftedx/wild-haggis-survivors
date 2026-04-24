import { describe, it, expect, vi } from 'vitest';
import { TempBuffBag } from './TempBuffBag';

describe('TempBuffBag', () => {
  it('invokes apply immediately and tracks an entry', () => {
    const bag = new TempBuffBag();
    const apply = vi.fn(() => vi.fn());
    bag.add('buff_damage', 5_000, apply);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(bag.activeCount()).toBe(1);
    expect(bag.has('buff_damage')).toBe(true);
  });

  it('reverts + removes the entry when the timer expires', () => {
    const bag = new TempBuffBag();
    const revert = vi.fn();
    bag.add('buff_speed', 1_000, () => revert);
    bag.tick(999);
    expect(revert).not.toHaveBeenCalled();
    expect(bag.activeCount()).toBe(1);
    bag.tick(1);
    expect(revert).toHaveBeenCalledTimes(1);
    expect(bag.activeCount()).toBe(0);
  });

  it('expires multiple entries in a single tick', () => {
    const bag = new TempBuffBag();
    const r1 = vi.fn();
    const r2 = vi.fn();
    const r3 = vi.fn();
    bag.add('a', 500, () => r1);
    bag.add('b', 1_000, () => r2);
    bag.add('c', 1_500, () => r3);
    bag.tick(1_000);
    expect(r1).toHaveBeenCalled();
    expect(r2).toHaveBeenCalled();
    expect(r3).not.toHaveBeenCalled();
    expect(bag.activeCount()).toBe(1);
    expect(bag.has('c')).toBe(true);
  });

  it('clamps durationMs to a minimum of 1 (no same-frame expire)', () => {
    const bag = new TempBuffBag();
    const revert = vi.fn();
    bag.add('k', 0, () => revert);
    bag.tick(0);
    expect(revert).not.toHaveBeenCalled();
    expect(bag.activeCount()).toBe(1);
  });

  it('tick(0) is a no-op (HIT_FREEZE / pause safety)', () => {
    const bag = new TempBuffBag();
    const revert = vi.fn();
    bag.add('k', 1_000, () => revert);
    bag.tick(0);
    bag.tick(-500);
    expect(revert).not.toHaveBeenCalled();
    expect(bag.activeCount()).toBe(1);
  });

  it('revertAll invokes every revert and empties the bag', () => {
    const bag = new TempBuffBag();
    const r1 = vi.fn();
    const r2 = vi.fn();
    bag.add('a', 10_000, () => r1);
    bag.add('b', 10_000, () => r2);
    bag.revertAll();
    expect(r1).toHaveBeenCalled();
    expect(r2).toHaveBeenCalled();
    expect(bag.activeCount()).toBe(0);
  });

  it('clear empties the bag WITHOUT calling revert (scene-restart path)', () => {
    const bag = new TempBuffBag();
    const r1 = vi.fn();
    const r2 = vi.fn();
    bag.add('a', 10_000, () => r1);
    bag.add('b', 10_000, () => r2);
    bag.clear();
    expect(r1).not.toHaveBeenCalled();
    expect(r2).not.toHaveBeenCalled();
    expect(bag.activeCount()).toBe(0);
  });

  it('snapshot returns a copy that cannot mutate internal state', () => {
    const bag = new TempBuffBag();
    bag.add('a', 1_000, () => () => undefined);
    const snap = bag.snapshot();
    expect(snap).toHaveLength(1);
    // Mutating the array returned by snapshot should not affect the bag.
    (snap as unknown as { push(e: unknown): void }).push({});
    expect(bag.activeCount()).toBe(1);
  });

  it('same key can stack multiple entries (each reverts independently)', () => {
    const bag = new TempBuffBag();
    const r1 = vi.fn();
    const r2 = vi.fn();
    bag.add('buff_damage', 1_000, () => r1);
    bag.add('buff_damage', 3_000, () => r2);
    expect(bag.activeCount()).toBe(2);
    bag.tick(1_000);
    expect(r1).toHaveBeenCalled();
    expect(r2).not.toHaveBeenCalled();
    expect(bag.activeCount()).toBe(1);
    bag.tick(2_000);
    expect(r2).toHaveBeenCalled();
    expect(bag.activeCount()).toBe(0);
  });
});
