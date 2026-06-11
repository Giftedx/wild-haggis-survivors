/**
 * Phase 5 Bucket 6 partial — wraps `installNodeMap` plus the
 * onNodeTrigger callback (50+ LOC of dispatch context bag) into a
 * single helper.
 *
 * Pre-extraction GameScene held three import surfaces just for this
 * one call site: `installNodeMap`, `dispatchNodeTrigger`,
 * `peekReplayChoiceFor`, `finalizeNodeVisit`. The helper rolls them
 * into one entry point so GameScene drops three imports + the inline
 * dispatch context + the early-out gates.
 *
 * The trigger listener registered by `installNodeMap` runs LATER (per-
 * frame on player ↔ node intersection), so all dispatch deps go
 * through lazy getters. Some refs (e.g. `nodePromptUI`) are written
 * BY this install via the setter callbacks — readers must re-resolve
 * via getters every fire.
 *
 * Determinism contract: install order is preserved one-for-one (UIs
 * constructed first, then trigger listener registered) — see
 * `nodeMapLifecycle.ts`. Lazy getters do not introduce a fresh RNG
 * branch.
 */
import type Phaser from 'phaser';
import type { NodeMapSystem } from '../../systems/NodeMapSystem';
import type { NodeWaveTracker } from '../../systems/nodeEvents/NodeWaveTracker';
import type { NodeMapUI } from '../../ui/NodeMapUI';
import type { NodePromptUI } from '../../ui/NodePromptUI';
import type { Player } from '../../entities/Player';
import type { RNG } from '../../utils/rng';
import type { RunScoreState } from './RunScoreState';
import type { RunModifiers } from '../../core/RunModifiers';
import type { TempBuffBag } from '../../systems/TempBuffBag';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { RelicSystem } from '../../systems/RelicSystem';
import type { RelicPickupSpawner } from '../../entities/RelicPickup';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { UpgradeCardsUI } from '../../ui/UpgradeCards';
import type { LevelUpFlow } from './LevelUpFlow';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { ReplayInput } from '../../replay/ReplayInput';
import type { ReplayRecorder } from '../../replay/ReplayRecorder';
import type { RunActState } from './RunActState';
import {
  installNodeMap,
  type NodeMapInstallRefs,
} from './nodeMapLifecycle';
import { dispatchNodeTrigger } from './nodeTriggerHandlers';
import { finalizeNodeVisit, peekReplayChoiceFor } from './nodeVisitFinalizer';

export interface InstallNodeMapDispatchOpts {
  scene: Phaser.Scene;
  nodeMapSystem: NodeMapSystem;
  nodeWaveTracker: NodeWaveTracker;
  setNodeMapUI: (ui: NodeMapUI | null) => void;
  setNodePromptUI: (ui: NodePromptUI | null) => void;

  // Dispatch deps — read at trigger-fire time.
  getPlayer(): Player;
  getRunRng(): RNG;
  getRunScore(): RunScoreState;
  getRunModifiers(): RunModifiers;
  getTempBuffBag(): TempBuffBag;
  getOwnedPassives(): string[];
  getSpawnSystem(): SpawnSystem;
  getRelicSystem(): RelicSystem;
  getRelicPickupSpawner(): RelicPickupSpawner | null;
  getWeaponSystem(): WeaponSystem;
  getXPSystem(): XPSystem | undefined;
  getUpgradeUI(): UpgradeCardsUI | null;
  getLevelUpFlow(): LevelUpFlow;
  getJuice(): JuiceSystem;
  getTimeManager(): TimeManager;
  getNodePromptUI(): NodePromptUI | null;

  // Replay + finalize closures.
  getReplayInput(): ReplayInput | null;
  getReplayRecorder(): ReplayRecorder | null;
  getRunActState(): RunActState;

  // Re-entrancy gate.
  getInteractivePromptIndex(): number;
  setInteractivePromptIndex(next: number): void;
}

export function installNodeMapDispatch(
  opts: InstallNodeMapDispatchOpts,
): NodeMapInstallRefs {
  return installNodeMap({
    scene: opts.scene,
    nodeMapSystem: opts.nodeMapSystem,
    nodeWaveTracker: opts.nodeWaveTracker,
    setNodeMapUI: opts.setNodeMapUI,
    setNodePromptUI: opts.setNodePromptUI,
    onNodeTrigger: (index, state) => {
      if (state.visited[index]) return false;
      // Block re-trigger while an interactive prompt is already resolving.
      if (opts.getInteractivePromptIndex() >= 0) return false;
      dispatchNodeTrigger(
        {
          player: opts.getPlayer(),
          runRng: opts.getRunRng(),
          runScore: opts.getRunScore(),
          runModifiers: opts.getRunModifiers(),
          tempBuffBag: opts.getTempBuffBag(),
          ownedPassives: opts.getOwnedPassives(),
          nodeWaveTracker: opts.nodeWaveTracker,
          spawnSystem: opts.getSpawnSystem(),
          relicSystem: opts.getRelicSystem(),
          relicPickupSpawner: opts.getRelicPickupSpawner(),
          weaponSystem: opts.getWeaponSystem(),
          xpSystem: opts.getXPSystem(),
          upgradeUI: opts.getUpgradeUI(),
          levelUpFlow: opts.getLevelUpFlow(),
          juice: opts.getJuice(),
          timeManager: opts.getTimeManager(),
          nodePromptUI: opts.getNodePromptUI(),
          peekReplayChoiceFor: (k) => peekReplayChoiceFor(opts.getReplayInput(), k),
          setInteractivePromptIndex: opts.setInteractivePromptIndex,
          finalizeNodeVisit: (i, k, c) => finalizeNodeVisit(
            {
              nodeMap: opts.nodeMapSystem,
              runActState: opts.getRunActState(),
              replayRecorder: opts.getReplayRecorder(),
              replayInput: opts.getReplayInput(),
              clock: opts.getSpawnSystem(),
            },
            i,
            k,
            c,
          ),
        },
        state.nodes[index],
        index,
        state,
      );
      return true;
    },
  });
}
