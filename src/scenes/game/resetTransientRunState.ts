/**
 * Phase 5 follow-up — body of `GameScene.resetTransientRunState`.
 *
 * Phaser reuses the scene instance on `scene.start('Game')`, so field
 * initialisers only fire at construction. Anything mutated mid-run
 * leaks into the next run unless explicitly wiped at the top of
 * `create()`. This helper consolidates that wipe in one Phaser-import-
 * free coordinator so the scene constructor stays focused on the wire-
 * up sequence.
 *
 * Why setter-based deps (Option A, mirroring `nodeMapLifecycle.ts`):
 *   - The helper writes ~25 fields on the scene; passing GameScene
 *     directly couples the helper to the class. Setters keep the
 *     write surface explicit and Phaser-import-free.
 *   - Sub-system refs (`runScore`, `tempBuffBag`, …) are passed as
 *     direct refs because the helper only invokes their `.reset()` /
 *     `.clear()` methods — no rebinding needed.
 *   - Nullable destroy-and-null pairs (fades, standingStones, …) take
 *     both the live ref (for `.destroy()`) AND a setter (for the
 *     null assignment). Mirrors `tearDownNodeMap`'s shape.
 *
 * Determinism contract: `runRng` is set BEFORE `chooseReliquarySpawnSec`
 * is called, so the spawn-second draw uses the new run's RNG —
 * identical to the pre-extraction order.
 *
 * Why the `relicOrchestrator` create-or-reset stays at the call site:
 * construction needs `this` (Phaser scene) + 7 hooks. Folding that
 * into the helper would balloon the dep bag without payoff. Caller
 * runs the orchestrator block right after this helper returns.
 */
import type { ReplayInput } from '../../replay/ReplayInput';
import type { RoutePick } from '../../data/routes';
import type { TickerHandle } from '../../utils/UpdateTickers';
import type { IFrameController } from './IFrameController';
import type { PauseMenu } from './PauseMenu';
import type { RunScoreState } from './RunScoreState';
import type { TempBuffBag } from '../../systems/TempBuffBag';
import type { RunActState } from './RunActState';
import type { NodeMapSystem } from '../../systems/NodeMapSystem';
import type { NodeWaveTracker } from '../../systems/nodeEvents/NodeWaveTracker';
import type { NodeMarkerSystem } from '../../systems/NodeMarkerSystem';
import type { NodeMapUI } from '../../ui/NodeMapUI';
import type { NodePromptUI } from '../../ui/NodePromptUI';
import type { UpdateTickers } from '../../utils/UpdateTickers';
import type { RunEndTickers } from './RunEndTickers';
import type { HazardZones } from './HazardZones';
import type { ChestSpriteRegistry } from './ChestSpriteRegistry';
import type { RunStatsTracker } from '../../systems/RunStatsTracker';
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { GameTickers } from './GameTickers';
import { SubscriptionBag } from '../../utils/SubscriptionBag';
import type { GameMusicState } from '../../systems/music/ProceduralMusicEngine';
import type { MoorMomentsState } from './moorMoments';
import { resetReplayBridge } from './replayBridgeInstall';
import { tearDownNodeMap } from './nodeMapLifecycle';
import { chooseReliquarySpawnSec } from './reliquary';
import { chooseClootieSpawnSec } from '../../entities/clootieRagWager';
import type { ClootieTree } from './clootieTree';
import type { StandingStones } from './standingStones';
import type { Reliquary } from './reliquary';
import type { AncestralEcho } from './ancestralEcho';
import type { RelicSlotUI } from '../../ui/RelicSlotUI';
import { createRNG, randomSeed, type RNG as RngType } from '../../utils/rng';
import { clearGrudgeLedger, type GrudgeLedgerState } from '../../entities/grudgeLedger';

/** Anything destroyable — narrowed so the helper avoids a Phaser import
 *  for the run-end fade rectangles. */
interface Destroyable {
  destroy(): void;
}

export interface ResetTransientRunStateDeps {
  // ── live refs (in) ────────────────────────────────────────────────
  replayInput: ReplayInput | null;
  iFrameController: IFrameController;
  pauseMenu: PauseMenu | null;
  runScore: RunScoreState;
  tempBuffBag: TempBuffBag;
  runActState: RunActState;
  nodeMapSystem: NodeMapSystem;
  nodeWaveTracker: NodeWaveTracker;
  nodeMapUI: NodeMapUI | null;
  nodePromptUI: NodePromptUI | null;
  nodeMarkerSystem: NodeMarkerSystem;
  pendingRunSeed: number | null;
  updateTickers: UpdateTickers;
  runEndTickers: RunEndTickers;
  victoryFade: Destroyable | null;
  deathFade: Destroyable | null;
  hazardZones: HazardZones | null;
  chestRegistry: ChestSpriteRegistry;
  announcedEvolutionReady: Set<string>;
  runStatsTracker: RunStatsTracker;
  deathCauseTracker: DeathCauseTracker;
  gameTickers: GameTickers | null;
  musicStateScratch: GameMusicState;
  moorMomentsState: MoorMomentsState;
  standingStones: StandingStones | null;
  reliquary: Reliquary | null;
  clootieTree: ClootieTree | null;
  ancestralEcho: AncestralEcho | null;
  relicSlotUI: RelicSlotUI | null;
  /** Taxman Grudge Ledger — cleared in-place between runs so the weapon
   *  listener's captured ref stays live. */
  grudgeLedger: GrudgeLedgerState;

  // ── setters (out) ─────────────────────────────────────────────────
  setReplayInput: (v: ReplayInput | null) => void;
  setPendingReplayRoutes: (v: RoutePick[]) => void;
  setPauseMenu: (v: PauseMenu | null) => void;
  setNodeMapUI: (v: NodeMapUI | null) => void;
  setNodePromptUI: (v: NodePromptUI | null) => void;
  setSuppressNextNodeMapRoll: (v: boolean) => void;
  setInteractivePromptIndex: (v: number) => void;
  setChestDurationBonusMs: (v: number) => void;
  setRunRng: (v: RngType) => void;
  setPendingRunSeed: (v: number | null) => void;
  setReliquarySpawnSec: (v: number) => void;
  setClootieSpawnSec: (v: number) => void;
  setPendingChests: (v: Array<{ golden: boolean }>) => void;
  setPickupDespawnHandles: (v: TickerHandle[]) => void;
  setVictoryFade: (v: null) => void;
  setDeathFade: (v: null) => void;
  setLastEmittedRunSecond: (v: number) => void;
  setSubs: (v: SubscriptionBag) => void;
  setRunName: (v: string) => void;
  setBurnsPlatterSpawned: (v: boolean) => void;
  setBurnsPlatterPickedUpAtMs: (v: number | null) => void;
  setStandingStones: (v: StandingStones | null) => void;
  setStonesWarned: (v: boolean) => void;
  setReliquary: (v: Reliquary | null) => void;
  setClootieTree: (v: ClootieTree | null) => void;
  setAncestralEcho: (v: AncestralEcho | null) => void;
  setRelicSlotUI: (v: RelicSlotUI | null) => void;
  setXpOverflowGoldBatch: (v: number) => void;
}

/**
 * Wipe per-run transient state at the top of every `create()`. Order
 * is preserved one-for-one from the pre-extraction body — see git
 * blame on the original `GameScene.resetTransientRunState` block.
 */
export function resetTransientRunState(deps: ResetTransientRunStateDeps): void {
  // T1 replay — drop the previous run's playback driver. Slice in `replayBridgeInstall.ts`.
  const replayResult = resetReplayBridge({ replayInput: deps.replayInput });
  deps.setReplayInput(replayResult.replayInput);
  deps.setPendingReplayRoutes(replayResult.pendingReplayRoutes);

  deps.iFrameController.reset();
  deps.pauseMenu?.close();
  deps.setPauseMenu(null);
  deps.runScore.reset();
  deps.tempBuffBag.clear();
  deps.runActState.reset();
  deps.setSuppressNextNodeMapRoll(false);

  // T401 slice 7 — node-map teardown (Option A: bare, no try/catch).
  // Thrown destroys surface during dev as a partial-init signal.
  tearDownNodeMap({
    nodeMapSystem: deps.nodeMapSystem,
    nodeWaveTracker: deps.nodeWaveTracker,
    nodeMapUI: deps.nodeMapUI,
    nodePromptUI: deps.nodePromptUI,
    setNodeMapUI: deps.setNodeMapUI,
    setNodePromptUI: deps.setNodePromptUI,
  });
  deps.nodeMarkerSystem.destroy();
  deps.setInteractivePromptIndex(-1);
  deps.setChestDurationBonusMs(0);

  const runSeed = deps.pendingRunSeed ?? randomSeed();
  const runRng = createRNG(runSeed);
  deps.setRunRng(runRng);
  deps.setPendingRunSeed(null);
  // Reliquary spawn moment rolled once per run so the same seed always
  // places the relic at the same second (daily runs + replay reproduce).
  deps.setReliquarySpawnSec(chooseReliquarySpawnSec(runRng));
  // Clootie tree spawn moment — rolled adjacent to the reliquary roll
  // so RNG-stream order is fixed, replays reproduce. The two roll
  // independently from the same `runRng`, so the order is part of the
  // replay contract — NEVER reorder them.
  deps.setClootieSpawnSec(chooseClootieSpawnSec(runRng));
  deps.setPendingChests([]);
  deps.setPickupDespawnHandles([]);
  deps.updateTickers.clear();
  deps.runEndTickers.reset();
  deps.victoryFade?.destroy();
  deps.setVictoryFade(null);
  deps.deathFade?.destroy();
  deps.setDeathFade(null);
  deps.hazardZones?.reset();
  deps.setLastEmittedRunSecond(-1);
  deps.chestRegistry.reset();
  deps.announcedEvolutionReady.clear();
  deps.runStatsTracker.reset();
  deps.deathCauseTracker.reset(0);
  deps.gameTickers?.reset();
  deps.setSubs(new SubscriptionBag());
  deps.musicStateScratch.hp = 0;
  deps.musicStateScratch.maxHp = 0;
  deps.musicStateScratch.gameTimeSec = 0;
  deps.musicStateScratch.enemyCount = 0;
  deps.musicStateScratch.comboCount = 0;
  deps.musicStateScratch.killCount = 0;
  deps.moorMomentsState.mercyLuckGranted = false;
  deps.setRunName('');
  // E1 M2 T10 — wipe Burns platter state so a recycled scene instance
  // never claims it already spawned/collected across runs.
  deps.setBurnsPlatterSpawned(false);
  deps.setBurnsPlatterPickedUpAtMs(null);
  deps.standingStones?.destroy();
  deps.setStandingStones(null);
  deps.setStonesWarned(false);
  deps.reliquary?.destroy();
  deps.setReliquary(null);
  deps.clootieTree?.destroy();
  deps.setClootieTree(null);
  deps.ancestralEcho?.destroy();
  deps.setAncestralEcho(null);
  deps.relicSlotUI?.destroy();
  deps.setRelicSlotUI(null);
  deps.musicStateScratch.bossActive = false;
  deps.musicStateScratch.biomeTimbre = 0.45;
  deps.setXpOverflowGoldBatch(0);
  clearGrudgeLedger(deps.grudgeLedger);
}
