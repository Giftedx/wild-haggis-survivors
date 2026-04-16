/**
 * installTreasureChestTimer — schedules the 45s chest spawn interval.
 * 20% chance of a golden chest (gold reward instead of heal); seeded
 * so a given run always rolls the same chest type at the same moment.
 *
 * While the game is paused, chests are queued in `pendingChests` to
 * avoid drop-during-pause weirdness; the scene drains them when play
 * resumes.
 */
import type { UpdateTickers } from '../../utils/UpdateTickers';
import type { TimeManager } from '../../systems/TimeManager';
import type { RNG } from '../../utils/rng';
import type { PickupSpawner } from './PickupSpawner';

export interface TreasureChestTimerHooks {
  getRunRng(): RNG;
  getTimeManager(): TimeManager;
  getPickupSpawner(): PickupSpawner;
  enqueuePendingChest(chest: { golden: boolean }): void;
}

/** Interval between chest spawn attempts (ms). Scaled by timeScale — pauses with physics. */
const CHEST_SPAWN_INTERVAL_MS = 45_000;
/** Chance a spawned chest is golden (gold reward instead of heal). */
const GOLDEN_CHEST_PROBABILITY = 0.2;

export function installTreasureChestTimer(
  updateTickers: UpdateTickers,
  hooks: TreasureChestTimerHooks,
): void {
  updateTickers.addInterval('scaled', CHEST_SPAWN_INTERVAL_MS, () => {
    const golden = hooks.getRunRng().bool(GOLDEN_CHEST_PROBABILITY);
    if (hooks.getTimeManager().isGameplayPaused()) {
      hooks.enqueuePendingChest({ golden });
    } else if (golden) {
      hooks.getPickupSpawner().spawnGoldenChest();
    } else {
      hooks.getPickupSpawner().spawnTreasure();
    }
  });
}
