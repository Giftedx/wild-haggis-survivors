import { describe, expect, it, vi } from 'vitest';
import { installTreasureChestTimer } from './installTreasureChestTimer';

function buildMocks(overrides: { paused?: boolean; golden?: boolean } = {}) {
  const spawnGoldenChest = vi.fn();
  const spawnTreasure = vi.fn();
  const enqueuePendingChest = vi.fn();
  let registeredCb: (() => void) | null = null;
  const updateTickers = {
    addInterval: vi.fn((_clock: string, _interval: number, cb: () => void) => {
      registeredCb = cb;
    }),
  };
  const hooks = {
    getRunRng: () => ({ bool: vi.fn(() => overrides.golden ?? false) }) as never,
    getTimeManager: () =>
      ({ isGameplayPaused: vi.fn(() => overrides.paused ?? false) }) as never,
    getPickupSpawner: () =>
      ({ spawnGoldenChest, spawnTreasure }) as never,
    enqueuePendingChest,
  };
  return {
    updateTickers,
    hooks,
    spawnGoldenChest,
    spawnTreasure,
    enqueuePendingChest,
    fireTimer: () => registeredCb?.(),
  };
}

describe('installTreasureChestTimer', () => {
  it('registers a 45-second scaled interval', () => {
    const m = buildMocks();
    installTreasureChestTimer(m.updateTickers as never, m.hooks);
    expect(m.updateTickers.addInterval).toHaveBeenCalledWith('scaled', 45_000, expect.any(Function));
  });

  it('spawns a treasure chest when not golden + not paused', () => {
    const m = buildMocks({ golden: false, paused: false });
    installTreasureChestTimer(m.updateTickers as never, m.hooks);
    m.fireTimer();
    expect(m.spawnTreasure).toHaveBeenCalledOnce();
    expect(m.spawnGoldenChest).not.toHaveBeenCalled();
  });

  it('spawns a golden chest when the dice roll golden', () => {
    const m = buildMocks({ golden: true, paused: false });
    installTreasureChestTimer(m.updateTickers as never, m.hooks);
    m.fireTimer();
    expect(m.spawnGoldenChest).toHaveBeenCalledOnce();
    expect(m.spawnTreasure).not.toHaveBeenCalled();
  });

  it('queues the chest when the game is paused (drain on resume)', () => {
    const m = buildMocks({ golden: true, paused: true });
    installTreasureChestTimer(m.updateTickers as never, m.hooks);
    m.fireTimer();
    expect(m.enqueuePendingChest).toHaveBeenCalledWith({ golden: true });
    expect(m.spawnGoldenChest).not.toHaveBeenCalled();
  });

  it('preserves the golden flag through the pause queue', () => {
    const m = buildMocks({ golden: false, paused: true });
    installTreasureChestTimer(m.updateTickers as never, m.hooks);
    m.fireTimer();
    expect(m.enqueuePendingChest).toHaveBeenCalledWith({ golden: false });
  });
});
