import { describe, expect, it, vi } from 'vitest';
import { restoreHeldRelics } from './SavedStateHydrator';
import { RELICS, type RelicDef } from '../../data/relics';

/**
 * SavedStateHydrator: pure restore helpers used by the resume path.
 * Tests cover the contract that used to live as a private method on
 * GameScene — duplicates skipped, unknown keys ignored, optional
 * effect-driver reset.
 */
describe('restoreHeldRelics', () => {
  function makeRelicSystemStub() {
    const reset = vi.fn();
    const add = vi.fn((_def: RelicDef) => true);
    return { reset, add };
  }

  function makeDriverStub() {
    const reset = vi.fn();
    return { reset };
  }

  it('resets the relic system + driver before re-adding', () => {
    const sys = makeRelicSystemStub();
    const driver = makeDriverStub();
    restoreHeldRelics(sys, driver, []);
    expect(sys.reset).toHaveBeenCalledTimes(1);
    expect(driver.reset).toHaveBeenCalledTimes(1);
  });

  it('adds each known relic exactly once', () => {
    const sys = makeRelicSystemStub();
    const driver = makeDriverStub();
    const knownKeys = Object.keys(RELICS).slice(0, 2);
    restoreHeldRelics(sys, driver, knownKeys);
    expect(sys.add).toHaveBeenCalledTimes(2);
    const passed = sys.add.mock.calls.map((c) => c[0].key);
    expect(passed).toEqual(knownKeys);
  });

  it('skips duplicate keys in the input list', () => {
    const sys = makeRelicSystemStub();
    const driver = makeDriverStub();
    const knownKey = Object.keys(RELICS)[0]!;
    restoreHeldRelics(sys, driver, [knownKey, knownKey, knownKey]);
    expect(sys.add).toHaveBeenCalledTimes(1);
  });

  it('silently skips unknown keys', () => {
    const sys = makeRelicSystemStub();
    const driver = makeDriverStub();
    restoreHeldRelics(sys, driver, ['definitely_not_a_relic', 'also_fake']);
    expect(sys.add).not.toHaveBeenCalled();
  });

  it('no-ops when relicSystem is null (early failure path)', () => {
    const driver = makeDriverStub();
    expect(() => restoreHeldRelics(null, driver, ['x'])).not.toThrow();
    expect(driver.reset).not.toHaveBeenCalled();
  });

  it('tolerates a missing effect-driver (still resets + adds)', () => {
    const sys = makeRelicSystemStub();
    const knownKey = Object.keys(RELICS)[0]!;
    restoreHeldRelics(sys, null, [knownKey]);
    expect(sys.reset).toHaveBeenCalledTimes(1);
    expect(sys.add).toHaveBeenCalledTimes(1);
  });

  it('only marks `seen` for keys the system actually accepted', () => {
    const sys = {
      reset: vi.fn(),
      // First add() rejects (capacity), second add() succeeds — duplicate
      // key on the third call should still attempt re-add since the prior
      // attempt was rejected (matches the original method's behaviour).
      add: vi
        .fn<(def: RelicDef) => boolean>()
        .mockReturnValueOnce(false)
        .mockReturnValue(true),
    };
    const driver = makeDriverStub();
    const k = Object.keys(RELICS)[0]!;
    restoreHeldRelics(sys, driver, [k, k, k]);
    expect(sys.add).toHaveBeenCalledTimes(2);
  });
});
