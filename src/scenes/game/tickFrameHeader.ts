/**
 * Pre-pause body of `GameScene.updateInner`.
 *
 * Every frame, the always-on bookkeeping at the top of the loop runs
 * regardless of pause state — replay playback advance, gamepad pause
 * edge, time-manager update, raw + scaled tickers, iframe + run-end
 * tickers, temp-buff bag, rune-system, node-wave tracker, autobattle
 * steering, and the dev stress-test sample. Only AFTER all of that
 * does the pause-gate kick in and short-circuit the world tick.
 *
 * This helper consolidates that orchestration. It returns a
 * discriminated result so the caller stays in charge of the early-
 * return policy:
 *
 *   - `replay-exhausted`: the recorded cursor ran out; caller should
 *     transition to the Chronicle scene and stop ticking.
 *   - `paused`: gameplay is paused (HIT_FREEZE, level-up, intermission,
 *     pause menu); caller should return without ticking the world.
 *   - `continue`: world tick should proceed; the computed `scaledDelta`
 *     is returned for downstream consumers.
 *
 * No Phaser imports — the helper does not start scenes itself; the
 * caller decides the dispatch when it sees `replay-exhausted`. Same
 * Option-A "policy at the caller" shape used by `tearDownNodeMap`
 * and `runEndShutdown`.
 *
 * Determinism contract: tick order is preserved one-for-one from the
 * pre-extraction body — replay advance fires BEFORE Player reads
 * input (Player reads come downstream in `tickWorldFrame` / direct
 * world block). `runeSystemController.tick` uses raw delta on purpose
 * (matches pre-extraction); ticking on `scaledDelta` would freeze the
 * rune transitions during slow-mo.
 */
import type { Player } from '../../entities/Player';
import type { TimeManager } from '../../systems/TimeManager';
import type { UpdateTickers } from '../../utils/UpdateTickers';
import type { DebugOverlay } from '../../ui/DebugOverlay';
import type { CaptionOverlay } from '../../systems/a11y/CaptionOverlay';
import type { IFrameController } from './IFrameController';
import type { RunEndTickers } from './RunEndTickers';
import type { TempBuffBag } from '../../systems/TempBuffBag';
import type { RuneSystemController } from './runeSystemController';
import type { NodeWaveTracker } from '../../systems/nodeEvents/NodeWaveTracker';
import type { XPSystem } from '../../systems/XPSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { ReplayInput } from '../../replay/ReplayInput';
import { tickReplayPlayback } from './replayBridgeInstall';
import { tickAutoBattleSteering } from './tickAutoBattleSteering';

export type TickFrameHeaderResult =
  /** Replay cursor exhausted — caller should transition to Chronicle. */
  | { kind: 'replay-exhausted' }
  /** Gameplay is paused — caller should return without ticking world. */
  | { kind: 'paused' }
  /** Continue with world tick; `scaledDelta` is the time slice to use
   *  for game-time systems (regen, AI, spawns, projectile TTLs). */
  | { kind: 'continue'; scaledDelta: number };

export interface TickFrameHeaderDeps {
  /** Live ref to the recorded-input driver during replay playback. Null
   *  on a fresh run. Read at tick time so resetTransientRunState
   *  can null the ref between runs. */
  getReplayInput: () => ReplayInput | null;
  /** Player ref — used only for the gamepad pause-edge consume call. */
  getPlayer: () => Player;
  timeManager: TimeManager;
  updateTickers: UpdateTickers;
  /** Constructed mid-`create()`; null until then. */
  getDebugOverlay: () => DebugOverlay | null;
  /** Constructed mid-`create()`; null until then. */
  getCaptionOverlay: () => CaptionOverlay | null;
  iFrameController: IFrameController;
  runEndTickers: RunEndTickers;
  tempBuffBag: TempBuffBag;
  /** Rebound on every `resetTransientRunState`; lazy getter avoids a
   *  stale snapshot pinned at install time. */
  getRuneSystemController: () => RuneSystemController;
  nodeWaveTracker: NodeWaveTracker;
  /** Autobattle steering needs live system refs. */
  getXPSystem: () => XPSystem;
  getSpawnSystem: () => SpawnSystem;
  /** Pause toggle on gamepad-edge — caller's `toggleUiPause`. */
  togglePause: () => void;
  /**
   * Post-bell endless accept — consumes the gamepad Start/Options edge
   * during the victory ceremony when RUN_END blocks the pause menu.
   */
  tryAcceptPostBellOffer?: (pauseMenuEdge: boolean) => boolean;
  /** Dev-only stress-test pulse. Caller wraps `tickStressTest(this)`
   *  so the helper avoids a `GameScene` import. No-op on prod paths. */
  runStressTest: () => void;
}

/**
 * Run the pre-pause header. See module docstring for the dispatch
 * contract; caller switches on the returned `kind`.
 */
export function tickFrameHeader(deps: TickFrameHeaderDeps, delta: number): TickFrameHeaderResult {
  // T1 replay playback — advance the recorded cursor each tick before
  // Player reads input. Pump in `replayBridgeInstall.ts`.
  if (tickReplayPlayback({ replayInput: deps.getReplayInput() }).exhausted) {
    return { kind: 'replay-exhausted' };
  }

  const pauseMenuEdge = deps.getPlayer().consumePauseMenuEdge();
  if (deps.tryAcceptPostBellOffer?.(pauseMenuEdge)) {
    // Offer consumed — world tick stays paused under RUN_END until the
    // victory ticker calls `finalizePostBellEntry`.
  } else if (pauseMenuEdge) {
    // Gamepad Start / Options — same pause stack as ESC / P (see `toggleUiPause` guards).
    deps.togglePause();
  }

  deps.timeManager.update(delta);

  // Raw tickers always advance (UI/run-end domain)
  deps.updateTickers.tickRaw(delta);
  deps.getDebugOverlay()?.update(delta);
  // Captions tick on raw delta so they keep fading during pause / run-end.
  deps.getCaptionOverlay()?.update(delta);

  // Scaled tickers freeze whenever gameplay is paused (including HIT_FREEZE which pauses physics
  // without mutating timeScale).
  const scaledDelta = deps.timeManager.isGameplayPaused()
    ? 0
    : delta * deps.timeManager.getEffectiveTimeScale();
  deps.updateTickers.tickScaled(scaledDelta);

  deps.iFrameController.tick(scaledDelta);
  deps.runEndTickers.tick(delta);

  // M1 F4 — shrine-granted timed buffs. Ticks on scaledDelta so pause
  // / HIT_FREEZE / slow-mo freeze the countdown the same way they
  // freeze XP collection and spawn timing; a paused buff at 12s
  // remaining stays at 12s until play resumes.
  deps.tempBuffBag.tick(scaledDelta);

  // U1 Task 14 — rune condition tick. Evaluate each active rune against
  // a fresh context built from live scene state; transitions fire
  // apply/remove on the shared runeBag which Player / WeaponSystem read.
  deps.getRuneSystemController().tick(delta);

  // M1 F1+F2 — poll pending encounter/elite waves every frame (raw
  // bookkeeping; must tick regardless of the pause early-return below
  // so a wave that resolved during a COUNTDOWN / pause window still
  // finalizes the node).
  deps.nodeWaveTracker.tick();

  tickAutoBattleSteering(deps.getPlayer(), deps.getXPSystem(), deps.getSpawnSystem());

  // Dev-only: top-up entity pools + sample FPS when stress test is active.
  deps.runStressTest();

  if (deps.timeManager.isGameplayPaused()) {
    return { kind: 'paused' };
  }

  return { kind: 'continue', scaledDelta };
}
