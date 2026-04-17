import { describe, expect, it, vi } from 'vitest';
import { GameTickers, type GameTickerHooks } from './GameTickers';
import type { Player } from '../../entities/Player';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { BiomeId } from '../../data/biomes';
import Phaser from 'phaser';

/**
 * GameTickers is mostly Phaser-bound, but two pure-ish methods —
 * `tickLowHpCaption` and `tickBanter` — drive narrative beats off
 * pure player + scene state. They deserve unit coverage so the
 * one-shot caption arm/disarm and biome-change banter logic don't
 * silently regress.
 */

interface MockState {
  hp: number;
  maxHp: number;
  biomeId: BiomeId | null;
  variantKey: string;
  sceneNowMs: number;
}

function makeHarness(initial: Partial<MockState> = {}): {
  state: MockState;
  banter: { request: ReturnType<typeof vi.fn>; flush: ReturnType<typeof vi.fn> };
  caption: ReturnType<typeof vi.fn>;
  hooks: GameTickerHooks;
} {
  const state: MockState = {
    hp: 50,
    maxHp: 100,
    biomeId: null,
    variantKey: 'classic',
    sceneNowMs: 0,
    ...initial,
  };

  const banter = {
    request: vi.fn(),
    flush: vi.fn(),
  };

  const caption = vi.fn();

  const hooks: GameTickerHooks = {
    getPlayer: () => ({
      getHp: () => state.hp,
      getMaxHp: () => state.maxHp,
    }) as unknown as Player,
    getScene: () => ({ time: { now: state.sceneNowMs } }) as unknown as Phaser.Scene,
    getUiViewport: () => ({ x: 0, y: 0, width: 1024, height: 576 }),
    getBanter: () => banter as unknown as BanterSystem,
    getCurrentBiomeId: () => state.biomeId,
    getActiveVariantKey: () => state.variantKey,
    caption,
  };

  return { state, banter, caption, hooks };
}

describe('GameTickers.tickLowHpCaption', () => {
  it('fires the caption + banter request once when HP drops below 20%', () => {
    const { state, banter, caption, hooks } = makeHarness({ hp: 50 });
    const t = new GameTickers(hooks);

    t.tickLowHpCaption();
    expect(caption).not.toHaveBeenCalled();

    state.hp = 15; // 15% — under threshold
    t.tickLowHpCaption();
    expect(caption).toHaveBeenCalledOnce();
    expect(caption.mock.calls[0]?.[0]).toBe('low_hp');
    expect(banter.request).toHaveBeenCalledWith('low_hp', { tag: 'classic' });
  });

  it('does NOT re-fire while the player stays low HP', () => {
    const { state, caption, hooks } = makeHarness({ hp: 10 });
    const t = new GameTickers(hooks);

    t.tickLowHpCaption();
    expect(caption).toHaveBeenCalledOnce();

    state.hp = 5;
    t.tickLowHpCaption();
    state.hp = 12;
    t.tickLowHpCaption();
    expect(caption).toHaveBeenCalledOnce();
  });

  it('re-arms when HP recovers past 40% — fires recover banter', () => {
    const { state, banter, caption, hooks } = makeHarness({ hp: 10 });
    const t = new GameTickers(hooks);
    t.tickLowHpCaption();
    expect(caption).toHaveBeenCalledOnce();

    state.hp = 50; // 50% — re-arm threshold
    t.tickLowHpCaption();
    expect(banter.request).toHaveBeenCalledWith('recover', { tag: 'classic' });

    state.hp = 15; // back below — caption arms again
    t.tickLowHpCaption();
    expect(caption).toHaveBeenCalledTimes(2);
  });

  it('does not arm at exactly 40% (only > 40% re-arms)', () => {
    const { state, banter, hooks } = makeHarness({ hp: 10, maxHp: 100 });
    const t = new GameTickers(hooks);
    t.tickLowHpCaption();
    state.hp = 40; // 40% exactly — does NOT re-arm
    t.tickLowHpCaption();
    expect(banter.request).toHaveBeenCalledTimes(1); // only the low_hp call
  });

  it('does not fire when HP is 0 (death takes over)', () => {
    const { state, caption, hooks } = makeHarness({ hp: 0 });
    const t = new GameTickers(hooks);
    state.hp = 0;
    t.tickLowHpCaption();
    expect(caption).not.toHaveBeenCalled();
  });

  it('reset() returns the caption to its armed state', () => {
    const { state, caption, hooks } = makeHarness({ hp: 10 });
    const t = new GameTickers(hooks);
    t.tickLowHpCaption(); // disarms
    expect(caption).toHaveBeenCalledOnce();

    t.reset();
    state.hp = 10;
    t.tickLowHpCaption();
    expect(caption).toHaveBeenCalledTimes(2);
  });

  it('passes the active variant key as banter tag', () => {
    const { state, banter, hooks } = makeHarness({ hp: 10, variantKey: 'laird' });
    const t = new GameTickers(hooks);
    t.tickLowHpCaption();
    expect(banter.request).toHaveBeenCalledWith('low_hp', { tag: 'laird' });
  });
});

describe('GameTickers.tickBanter', () => {
  it('does nothing when banter is null', () => {
    const { hooks } = makeHarness();
    const tickerHooks = { ...hooks, getBanter: () => null };
    const t = new GameTickers(tickerHooks);
    expect(() => t.tickBanter()).not.toThrow();
  });

  it('does NOT fire biome_change on the very first observed biome', () => {
    const { state, banter, hooks } = makeHarness({ biomeId: 'bog' as BiomeId });
    const t = new GameTickers(hooks);
    t.tickBanter();
    expect(banter.request).not.toHaveBeenCalledWith('biome_change', expect.anything());
    state.biomeId = 'bog' as BiomeId;
    t.tickBanter();
    expect(banter.request).not.toHaveBeenCalledWith('biome_change', expect.anything());
  });

  it('fires biome_change when the biome changes (after the first observation)', () => {
    const { state, banter, hooks } = makeHarness({ biomeId: 'bog' as BiomeId });
    const t = new GameTickers(hooks);
    t.tickBanter(); // establishes 'bog' as the prior biome
    state.biomeId = 'pine' as BiomeId;
    t.tickBanter();
    expect(banter.request).toHaveBeenCalledWith('biome_change', { tag: 'pine' });
  });

  it('idle banter fires once a 90s gap elapses', () => {
    const { state, banter, hooks } = makeHarness({ sceneNowMs: 95_000 });
    const t = new GameTickers(hooks);
    t.tickBanter();
    expect(banter.request).toHaveBeenCalledWith('idle', { tag: 'classic' });

    state.sceneNowMs = 95_000 + 80_000;
    t.tickBanter();
    expect(banter.request.mock.calls.filter((c) => c[0] === 'idle')).toHaveLength(1);

    state.sceneNowMs = 95_000 + 100_000;
    t.tickBanter();
    expect(banter.request.mock.calls.filter((c) => c[0] === 'idle')).toHaveLength(2);
  });

  it('idle banter does not fire before the first 90s elapse', () => {
    const { state, banter, hooks } = makeHarness({ sceneNowMs: 0 });
    const t = new GameTickers(hooks);
    t.tickBanter();
    state.sceneNowMs = 60_000;
    t.tickBanter();
    expect(banter.request.mock.calls.filter((c) => c[0] === 'idle')).toHaveLength(0);
  });

  it('always flushes banter at end of tick', () => {
    const { banter, hooks } = makeHarness();
    const t = new GameTickers(hooks);
    t.tickBanter();
    expect(banter.flush).toHaveBeenCalledOnce();
  });

  it('reset() clears biome / banter timing', () => {
    const { state, banter, hooks } = makeHarness({ biomeId: 'bog' as BiomeId, sceneNowMs: 50_000 });
    const t = new GameTickers(hooks);
    t.tickBanter(); // establish bog + first idle
    t.reset();
    state.biomeId = 'pine' as BiomeId;
    t.tickBanter(); // first observation post-reset — pine, should NOT fire biome_change
    const biomeChangeCalls = banter.request.mock.calls.filter((c) => c[0] === 'biome_change');
    expect(biomeChangeCalls).toHaveLength(0);
  });
});
