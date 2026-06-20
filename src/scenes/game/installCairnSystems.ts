/**
 * Cairn systems install (CairnStackingScheduler + CairnOfEchoesScheduler).
 *
 * Extracted from GameScene.create() to keep the scene under the
 * 2200-LOC hard ceiling. Both schedulers are pure-orchestration,
 * hook-driven, and constructed here together because they share the
 * same logical phase in the run-start sequence (after pickupSpawner).
 *
 * Sister to installCailleachGauntlet — callers store the returned
 * schedulers on their own fields and tick them per-frame.
 *
 * Spec: docs/archive/superpowers/specs/2026-05-22-moor-remembers-v2-design.md.
 */
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { RNG } from '../../utils/rng';
import type { FallenCairn } from '../../utils/save/fallenCairns';
import type { WhisperResult } from './cairnOfEchoesWhisper';
import type { CairnBoonDef, CairnBoonId } from './cairnStackingBoons';
import {
  CairnStackingScheduler,
} from './CairnStackingScheduler';
import { CairnOfEchoesScheduler } from './CairnOfEchoesScheduler';
import { bumpCairnBlessing, loadSave } from '../../utils/save';

export interface InstallCairnSystemsDeps {
  // CairnStackingScheduler hooks
  readonly getRng: () => RNG;
  readonly getPlayer: () => Player | undefined;
  readonly getVictoryPending: () => boolean;
  readonly getJuice: () => JuiceSystem;
  readonly getBanter: () => BanterSystem | null;
  readonly spawnCairnStone: (onCollect: () => void, onExpired?: () => void) => void;
  readonly caption: (id: string, msg: string, tint?: string, dur?: number) => void;
  readonly openCairnBoonPicker: (
    options: readonly CairnBoonDef[],
    onPick: (id: CairnBoonId) => void,
  ) => void;
  /** Snapshot from a mid-run resume save, or null for a fresh run. */
  readonly cairnResume: {
    stoneCount: number;
    spawnedCount: number;
    nextSpawnAtSec?: number;
  } | null;
  // CairnOfEchoesScheduler hooks
  readonly getCairns: () => readonly FallenCairn[];
  readonly getRngSample: () => number;
  readonly getOldDroverRevealedCount: () => number;
  readonly onWalkOver: (payload: { cairn: FallenCairn; whisper: WhisperResult }) => void;
  readonly onSpriteCreate: (cairn: FallenCairn) => void;
  readonly onSpriteDestroy: (cairn: FallenCairn) => void;
}

export interface InstallCairnSystemsResult {
  readonly cairnStacking: CairnStackingScheduler;
  readonly cairnOfEchoesScheduler: CairnOfEchoesScheduler;
}

export function installCairnSystems(
  deps: InstallCairnSystemsDeps,
): InstallCairnSystemsResult {
  const cairnStacking = new CairnStackingScheduler({
    getRunRng: deps.getRng,
    getPlayer: deps.getPlayer,
    getVictoryPending: deps.getVictoryPending,
    getJuice: deps.getJuice,
    getBanter: deps.getBanter,
    spawnCairnStone: deps.spawnCairnStone,
    caption: deps.caption,
    bumpCairnBlessing: () => bumpCairnBlessing(),
    openCairnBoonPicker: deps.openCairnBoonPicker,
  });
  cairnStacking.reset();
  if (deps.cairnResume) {
    cairnStacking.restoreFromSnapshot(deps.cairnResume);
  }

  const cairnOfEchoesScheduler = new CairnOfEchoesScheduler({
    getCairns: deps.getCairns,
    getRngSample: deps.getRngSample,
    isFirstDeathTouchEver: () => (loadSave().ancestralEchoesTouched ?? 0) === 0,
    getOldDroverRevealedCount: deps.getOldDroverRevealedCount,
    onWalkOver: deps.onWalkOver,
    onSpriteCreate: deps.onSpriteCreate,
    onSpriteDestroy: deps.onSpriteDestroy,
  });
  cairnOfEchoesScheduler.reset();
  cairnOfEchoesScheduler.load();

  return { cairnStacking, cairnOfEchoesScheduler };
}
