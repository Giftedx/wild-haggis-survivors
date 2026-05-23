/**
 * CairnStackingScheduler — DESIGN_IDEAS §1 "Cairn Stacking" mechanic.
 *
 * Three highland field-stones spawn over a run. Walking each one over
 * "stacks" it; the third stone fires the **Cairn's Blessing** — a full
 * heal plus an 8 s pickup-radius pulse that lets the haggis sweep up
 * the moor's accumulated XP gems and gold. The mechanic is non-shoot
 * tension: a small ceremony tucked between combat beats, paying off
 * three pilgrimage-marker pickups with a moment of warmth.
 *
 * Cadence:
 *   - First stone spawns at `FIRST_SPAWN_SEC` (75 s) — past the opening
 *     ramp, before the first elite cohort.
 *   - Subsequent gaps are `GAP_BASE_SEC` (90 s) + RNG jitter
 *     `[0, GAP_JITTER_SEC]` (60 s) — runs at typical pace see all three
 *     stones around the 5-minute mark.
 *   - Hard-stops after `STONE_CAP` (3) spawns — the boon fires with the
 *     third collect, and the scheduler is dormant for the rest of the run.
 *
 * Pure orchestration — no Phaser. The constructor takes hooks for the
 * three side-effects (spawn, heal, magnet, banter, captioning) so the
 * scheduler is testable without a Scene. `tick(runSec)` is the per-
 * second entry point; the spawned pickup's `onCollect` callback routes
 * through `onStoneCollected()` to advance the run-state machine.
 *
 * Replay determinism: the gap jitter draws from `getRunRng()` (seeded
 * `RNG`, not `Math.random`), matching the contract spelled out in
 * `CLAUDE.md` "New-system safety pattern checklist (b)" and
 * `feedback_test_runner_vs_tsc.md`. The spawn position itself goes
 * through `pickNearbyPosition` inside `PickupSpawner.spawnCairnStone`,
 * which uses `Math.random` — that's fine for visual placement (no
 * downstream gameplay state branches off the position). If a future
 * change makes the position load-bearing for replay state, the call
 * site must be threaded through `runRng` too.
 */
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { RNG } from '../../utils/rng';
import { t } from '../../core/i18n';
import { getCairnBoonById, pickCairnBoonOptions, type CairnBoonDef, type CairnBoonId } from './cairnStackingBoons';

export const CAIRN_STONE_CAP = 3;
export const CAIRN_FIRST_SPAWN_SEC = 75;
export const CAIRN_GAP_BASE_SEC = 90;
export const CAIRN_GAP_JITTER_SEC = 60;
export const CAIRN_BOON_MAGNET_FLAT_PX = 80;
export const CAIRN_BOON_MAGNET_DURATION_MS = 8000;

export interface CairnStackingSchedulerHooks {
  getRunRng(): RNG;
  getPlayer(): Player | undefined;
  getVictoryPending(): boolean;
  getJuice(): JuiceSystem;
  getBanter(): BanterSystem | null;
  spawnCairnStone(onCollect: () => void, onExpired?: () => void): void;
  caption(id: string, message: string, tint?: string, durationMs?: number): void;
  /**
   * Bump the lifetime Cairn's Blessing counter and return the pre-bump
   * value. Production wires this to `bumpCairnBlessing()` (v22 save
   * field). Pre-bump 0 routes the boon banter to the `boon_first`
   * sub-pool (pilgrim wonder beat); subsequent grants fall back to the
   * existing `boon` pool. Sister to clootie + beithir lifetime bumpers.
   */
  bumpCairnBlessing(): number;
  /**
   * Open the 3-card boon picker modal. The scheduler calls this when
   * the third stone is collected, passing three weighted-draw options
   * and a callback the modal invokes with the player's chosen boon ID.
   * Production wires this to `cairnBoonPickerModal.open(...)`.
   */
  openCairnBoonPicker(options: readonly CairnBoonDef[], onPick: (id: CairnBoonId) => void): void;
}

export class CairnStackingScheduler {
  private stoneCount = 0;
  private spawnedCount = 0;
  private nextSpawnAtSec = CAIRN_FIRST_SPAWN_SEC;
  private spawnPending = false;

  constructor(private readonly hooks: CairnStackingSchedulerHooks) {}

  /** Reset to run-start state. Called once per `create()` from `installRunBookkeeping`. */
  reset(): void {
    this.stoneCount = 0;
    this.spawnedCount = 0;
    this.nextSpawnAtSec = CAIRN_FIRST_SPAWN_SEC;
    this.spawnPending = false;
  }

  /**
   * On run resume from a paused/serialised save, push the next spawn
   * out so the resumed run doesn't immediately drop a stone in the
   * player's lap. Mirrors the `MoorMomentScheduler.pushAfterResume`
   * idiom.
   */
  pushAfterResume(gameTimeSec: number): void {
    this.nextSpawnAtSec = Math.max(this.nextSpawnAtSec, Math.floor(gameTimeSec) + 30);
  }

  /**
   * Per-second tick. Called from `runtimeTickHooks.tickSecondCounter`
   * after `moorMoments.tick`. No-ops once the cap is reached or while
   * a stone is already on the moor uncollected.
   */
  tick(runSec: number): void {
    if (this.hooks.getVictoryPending()) return;
    if (this.spawnedCount >= CAIRN_STONE_CAP) return;
    if (this.spawnPending) return;
    if (runSec < this.nextSpawnAtSec) return;
    const player = this.hooks.getPlayer();
    if (!player?.active) return;

    this.spawnPending = true;
    this.spawnedCount += 1;
    this.hooks.spawnCairnStone(
      () => this.onStoneCollected(),
      () => this.notifyStoneExpired(),
    );

    const gap =
      CAIRN_GAP_BASE_SEC + this.hooks.getRunRng().int(0, CAIRN_GAP_JITTER_SEC);
    this.nextSpawnAtSec = runSec + gap;
  }

  /**
   * Called by the spawned stone's overlap callback. Advances the stack
   * counter, fires per-stone toast + low-priority banter, and on the
   * third collect grants the Cairn's Blessing boon.
   *
   * Public for testability — the scheduler hands its bound reference
   * to `spawnCairnStone` as the `onCollect` callback, so most call
   * sites never see this directly.
   */
  onStoneCollected(): void {
    this.spawnPending = false;
    this.stoneCount = Math.min(this.stoneCount + 1, CAIRN_STONE_CAP);
    const player = this.hooks.getPlayer();
    if (!player) return;

    const reachedCap = this.stoneCount >= CAIRN_STONE_CAP;

    if (reachedCap) {
      this.hooks.getJuice().showMoorMomentBurst(player.x, player.y);
      this.hooks.getJuice().flashWhite(96);
      const options = pickCairnBoonOptions(this.hooks.getRunRng());
      this.hooks.openCairnBoonPicker(options, (id) => this._applyBoon(id, player));
    } else {
      this.hooks.getJuice().showToast(
        t('ui.cairn.stack_toast', { count: this.stoneCount, cap: CAIRN_STONE_CAP }),
        '#a8b4b8',
      );
      this.hooks.getBanter()?.request('cairn_moment', { tag: 'stack' });
    }
  }

  /**
   * Apply a chosen boon after the picker resolves. Separated from
   * `onStoneCollected` so the modal callback can invoke it once the
   * player dismisses the card, not during the overlap frame.
   */
  private _applyBoon(id: CairnBoonId, player: Player): void {
    getCairnBoonById(id).effect(player, this.hooks.getJuice());
    this.hooks.getJuice().showToast(t(`ui.cairn.boon.${id}.toast`), '#e8d8a8');
    this.hooks.caption('cairn_blessing', t(`ui.cairn.boon.${id}.name`), '#e8d8a8', 3600);
    const beforeCount = this.hooks.bumpCairnBlessing();
    const tag = beforeCount === 0 ? 'boon_first' : 'boon';
    this.hooks.getBanter()?.request('cairn_moment', { tag });
  }

  // ── Test surface ──────────────────────────────────────────────────────
  /** Stones the haggis has stacked this run. Capped at `CAIRN_STONE_CAP`. */
  getStoneCount(): number {
    return this.stoneCount;
  }

  /** Stones spawned (collected or expired). Capped at `CAIRN_STONE_CAP`. */
  getSpawnedCount(): number {
    return this.spawnedCount;
  }

  /** Run-second the next spawn check unblocks at. */
  getNextSpawnAtSec(): number {
    return this.nextSpawnAtSec;
  }

  /** True between spawn and collect/expire — scheduler holds back another spawn. */
  isSpawnPending(): boolean {
    return this.spawnPending;
  }

  /**
   * Cancel the spawn-pending flag. Called by GameScene when a stone
   * despawns uncollected (else the scheduler would deadlock waiting
   * on a collect that never comes).
   */
  notifyStoneExpired(): void {
    this.spawnPending = false;
  }
}
