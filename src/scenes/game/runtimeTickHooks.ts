/**
 * Per-frame `updateInner` hooks — Phase 5 Bucket 5b/5c/5d of the
 * codebase restructure (audit: `docs/superpowers/specs/2026-04-30-
 * gamescene-regrowth-audit.md`).
 *
 * Each export here is one of the per-frame glue blocks that previously
 * lived inline in `GameScene.updateInner`. Hooks share the file so the
 * audit's named seam exists for future sub-bucket extracts (player
 * input + movement, spawn/damage/drift effects). Hooks themselves are
 * pure orchestration — no internal state, no timers, no event-bus
 * subscriptions. They read the inputs, mutate scene-owned state via
 * the supplied callbacks, and return.
 *
 * Determinism contract: any RNG-touching branch keeps the order it
 * had inline. None of these hooks introduce a fresh `Math.random()` —
 * `replayDeterminism.test.ts` is the regression for byte-accurate
 * playback.
 */
import type { Player } from '../../entities/Player';
import type { Enemy } from '../../entities/Enemy';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { RelicEffectDriver } from '../../systems/relics/RelicEffectDriver';
import type { RelicSlotUI } from '../../ui/RelicSlotUI';
import type { RelicPickupSpawner } from '../../entities/RelicPickup';
import type { EdgeIndicators } from '../../ui/EdgeIndicators';
import type { Minimap } from '../../ui/Minimap';
import type { ChestSpriteRegistry } from './ChestSpriteRegistry';
import type { MoorMomentScheduler } from './MoorMomentScheduler';
import type { CairnStackingScheduler } from './CairnStackingScheduler';
import type { Reliquary } from './reliquary';
import type { StandingStones } from './standingStones';
import type { BossHpTracker } from './BossHpTracker';
import type { GameTickers } from './GameTickers';
import type { GameMusicState } from '../../systems/music/ProceduralMusicEngine';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';
import { updateMusicStateScratch } from './updateMusicStateScratch';
import { BIOMES, type BiomeId } from '../../data/biomes';
import { STONE_SPAWN_SEC, STONE_WARN_SEC } from './standingStones';
import { computeMantlePulseStagger } from '../../entities/mantlePulse';
import { globalEventBus } from '../../core/GlobalEventBus';
import { t } from '../../core/i18n';

/**
 * Heather-mantle pulse — DESIGN_IDEAS §1. Tier-2-only stagger sweep
 * around the player. `tickMantlePulse` on Player owns the timer + radius
 * read; the callback applies pure-stagger knockback per enemy. Hazard
 * enemies short-circuit inside `applyKnockback` itself, so the predicate
 * doesn't need duplicating here.
 *
 * Caller passes `scaledDelta` so cinematic slow-mo slows the pulse
 * cadence in lockstep with everything else gameplay-timed.
 */
export function tickMantlePulse(
  player: Player,
  spawnSystem: SpawnSystem,
  scaledDelta: number,
): void {
  player.tickMantlePulse(scaledDelta, (cx, cy, radius) => {
    const enemies = spawnSystem.getEnemyGroup().getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const impulse = computeMantlePulseStagger(cx, cy, enemy.x, enemy.y, radius);
      if (impulse) enemy.applyKnockback(impulse.vx, impulse.vy);
    }
  });
}

export interface SecondTickHookContext {
  spawnSystem: SpawnSystem;
  juice: JuiceSystem;
  moorMoments: MoorMomentScheduler;
  cairnStacking: CairnStackingScheduler;
  getStandingStones: () => StandingStones | null;
  getReliquary: () => Reliquary | null;
  getReliquarySpawnSec: () => number;
  getStonesWarned: () => boolean;
  markStonesWarned: () => void;
  spawnStandingStones: () => void;
  spawnReliquary: () => void;
  caption: (id: string, msg: string, tint: string, dur: number) => void;
}

/**
 * Second-counter hook — fires once per integer second of game time.
 * Emits `GLOBAL_RUN_TIME_SEC`, ticks the moor scheduler, and crosses
 * the standing-stones / reliquary spawn boundaries.
 *
 * The `>=` boundary checks tolerate a lag spike or paused-then-resumed
 * counter that skips the exact tick — the once-only guards (stonesWarned,
 * standingStones, reliquary) prevent repeats.
 *
 * Returns the run-second the caller should record as
 * `lastEmittedRunSecond`. Returns the prior value unchanged when the
 * second hasn't advanced.
 */
export function tickSecondCounter(
  ctx: SecondTickHookContext,
  lastEmittedRunSecond: number,
): number {
  const runSec = Math.floor(ctx.spawnSystem.getGameTimeSec());
  if (runSec === lastEmittedRunSecond) return lastEmittedRunSecond;

  globalEventBus.emit('GLOBAL_RUN_TIME_SEC', {
    gameTimeSec: ctx.spawnSystem.getGameTimeSec(),
    wholeSecond: runSec,
  });
  ctx.moorMoments.tick(runSec);
  ctx.cairnStacking.tick(runSec);
  if (runSec >= STONE_WARN_SEC && !ctx.getStonesWarned() && !ctx.getStandingStones()) {
    ctx.markStonesWarned();
    ctx.juice.showToast(t('ui.standingStones.warn_toast'), '#ffe080');
    ctx.caption('standing_stones_warn', t('ui.standingStones.warn_caption'), '#ffe080', 3000);
  }
  if (runSec >= STONE_SPAWN_SEC && !ctx.getStandingStones()) {
    ctx.spawnStandingStones();
  }
  const reliqSec = ctx.getReliquarySpawnSec();
  if (reliqSec > 0 && runSec >= reliqSec && !ctx.getReliquary()) {
    ctx.spawnReliquary();
  }
  return runSec;
}

export interface RelicEffectFrameTickInputs {
  scaledDelta: number;
  player: Player;
  relicEffectDriver: RelicEffectDriver | null;
  relicSlotUI: RelicSlotUI | null;
}

/**
 * R1 per-frame relic tick — drives time-based effects and the
 * grans_teapot heal-after-unharmed counter. `scaledDelta` so timer-
 * based rare effects pause with the game rather than running off
 * wall-clock; the teapot driver caches fractional carry internally,
 * caller only applies the integer heal that comes back.
 */
export function tickRelicEffectFrame(inputs: RelicEffectFrameTickInputs): void {
  const { scaledDelta, player, relicEffectDriver, relicSlotUI } = inputs;
  relicEffectDriver?.updatePerFrame(scaledDelta);
  const teapotHeal = relicEffectDriver?.tickGransTeapotFrame(
    scaledDelta,
    player.getMaxHp(),
  ) ?? 0;
  if (teapotHeal > 0) player.heal(teapotHeal);
  relicSlotUI?.update();
}

export interface PresentationFrameInputs {
  /** Wall-clock delta (raw, not scaled) for music + tickers. */
  delta: number;
  player: Player;
  spawnSystem: SpawnSystem;
  juice: JuiceSystem;
  bossHpTracker: BossHpTracker;
  edgeIndicators: EdgeIndicators;
  minimap: Minimap;
  chestRegistry: ChestSpriteRegistry;
  gameTickers: GameTickers;
  /** Reused state object — the helper mutates it before each musicEngine.update. */
  musicStateScratch: GameMusicState;
  /** Live biome under the player (null mid-transition or pre-BiomeController). */
  biomeId: BiomeId | null;
  killCount: number;
  /** weaponCount + ownedPassives length — caller-computed to avoid pulling weaponSystem into the helper. */
  weaponAndPassiveCount: number;
  /** Driver may be null briefly during scene-restart between resetTransientRunState and create() reattaching. */
  relicEffectDriver: RelicEffectDriver | null;
  relicPickupSpawner: RelicPickupSpawner | null;
  /** Live reliquary marker (null when no reliquary spawned). */
  reliquaryMinimapMarker: ReturnType<Reliquary['getMinimapMarker']> | null;
}

/**
 * Per-frame presentation block — boss HP tracker, edge indicators,
 * minimap (with pictish_compass relic-pin overlay), music-state
 * compositor + musicEngine tick, and the dash + boundary HUD tickers.
 *
 * All work here is read-only on gameplay state; the only mutation is
 * `musicStateScratch` (reused buffer to avoid per-frame allocs) and
 * the various UI surfaces this hook drives. Caller ticks this AFTER
 * the gameplay-systems pass and BEFORE `updateRunHudFrame` so HUD
 * reads see the same frame's data.
 */
export function tickPresentationFrame(inputs: PresentationFrameInputs): void {
  const {
    delta,
    player,
    spawnSystem,
    juice,
    bossHpTracker,
    edgeIndicators,
    minimap,
    chestRegistry,
    gameTickers,
    musicStateScratch,
    biomeId,
    killCount,
    weaponAndPassiveCount,
    relicEffectDriver,
    relicPickupSpawner,
    reliquaryMinimapMarker,
  } = inputs;

  bossHpTracker.tick();
  edgeIndicators.update(player.x, player.y, spawnSystem.getEnemyGroup());

  // R1 M4.5 P2 — pictish_compass surfaces live relic pickup pins on
  // the minimap. Gated on isHolding so non-holders see no change.
  const relicPins =
    relicEffectDriver?.isHolding('pictish_compass') && relicPickupSpawner
      ? relicPickupSpawner.getActivePickupPositions()
      : [];
  minimap.update(
    player.x,
    player.y,
    spawnSystem.getEnemyGroup(),
    chestRegistry.getMarkers(),
    player.rotation,
    reliquaryMinimapMarker,
    relicPins,
  );

  updateMusicStateScratch(
    musicStateScratch,
    player,
    spawnSystem,
    juice,
    killCount,
    biomeId ? BIOMES[biomeId].moodTimbre : 0.45,
    weaponAndPassiveCount / 17,
  );
  musicEngine.update(delta, musicStateScratch);

  gameTickers.updateDashIndicator();
  gameTickers.updateBoundaryWarning();
}
