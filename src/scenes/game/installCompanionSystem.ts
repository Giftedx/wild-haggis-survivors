/**
 * Companion system install (Wild Living World).
 *
 * Extracted from GameScene.create() to keep the scene under the
 * 2200-LOC hard ceiling. Owns the CompanionSystem construction,
 * director attachment, and the deferred whistle-call on run start.
 *
 * The stale-callback guard (`getCurrentSystem() !== sys`) prevents
 * the whistle-call from firing if the scene restarted before the
 * 2400 ms timer elapsed and replaced this system with a new one.
 */
import * as Phaser from 'phaser';
import { CompanionSystem } from './CompanionSystem';
import { loadSave } from '../../utils/save';
import type { Player } from '../../entities/Player';
import type { LivingWorldDirector } from './LivingWorldDirector';

export interface InstallCompanionSystemDeps {
  readonly scene: Phaser.Scene;
  readonly getPlayer: () => Player;
  readonly director: LivingWorldDirector;
  readonly isReplayInput: boolean;
  readonly scheduleDelay: (ms: number, cb: () => void) => void;
  readonly getCurrentSystem: () => CompanionSystem | null;
}

export function installCompanionSystem(
  deps: InstallCompanionSystemDeps,
): CompanionSystem {
  const sys = new CompanionSystem({
    scene: deps.scene,
    getPlayer: deps.getPlayer,
  });
  sys.attachDirector(deps.director);

  if (!deps.isReplayInput) {
    const selected = loadSave().livingWorldUnlocks.selectedCompanion;
    if (selected) {
      deps.scheduleDelay(2400, () => {
        if (deps.getCurrentSystem() !== sys) return;
        sys.whistleCall(selected);
      });
    }
  }

  return sys;
}
