/**
 * Variant companion install (Engineer turret + Tufted pup).
 *
 * Extracted from GameScene.create() to keep the scene under the
 * 2200-LOC hard ceiling. Each companion is only constructed when the
 * active variant's modifier flag is set; all other variants get nulls.
 *
 * Sister to installCailleachGauntlet — pure hook-driven, returns
 * sprites so the scene can destroy them on the next run restart.
 */
import * as Phaser from 'phaser';
import { EngineerTurretSystem } from './EngineerTurretSystem';
import { TuftedFamiliarSystem } from './TuftedFamiliarSystem';

export interface InstallVariantCompanionsDeps {
  readonly scene: Phaser.Scene;
  readonly hasEngineerTurret: boolean;
  readonly hasTuftedFamiliar: boolean;
  readonly spawnPx: number;
  readonly spawnPy: number;
  readonly getIsVictoryPending: () => boolean;
  readonly getPlayerPosition: () => { x: number; y: number };
  readonly fireTurretShot: (fromX: number, fromY: number, damageMul: number) => void;
}

export interface InstallVariantCompanionsResult {
  readonly engineerTurretSystem: EngineerTurretSystem | null;
  readonly engineerTurretSprite: Phaser.GameObjects.Image | null;
  readonly tuftedFamiliarSystem: TuftedFamiliarSystem | null;
  readonly tuftedPupSprite: Phaser.GameObjects.Image | null;
}

export function installVariantCompanions(
  deps: InstallVariantCompanionsDeps,
): InstallVariantCompanionsResult {
  const { scene, spawnPx, spawnPy } = deps;

  let engineerTurretSystem: EngineerTurretSystem | null = null;
  let engineerTurretSprite: Phaser.GameObjects.Image | null = null;

  if (deps.hasEngineerTurret) {
    engineerTurretSystem = new EngineerTurretSystem({
      getIsVictoryPending: deps.getIsVictoryPending,
      fireTurretShot: deps.fireTurretShot,
      spawnTurretSprite: (x, y) => {
        if (!scene.textures.exists('engineer_turret')) return;
        engineerTurretSprite = scene.add.image(x, y, 'engineer_turret');
        engineerTurretSprite.setDepth(1);
      },
    });
    engineerTurretSystem.place(spawnPx + 80, spawnPy);
  }

  let tuftedFamiliarSystem: TuftedFamiliarSystem | null = null;
  let tuftedPupSprite: Phaser.GameObjects.Image | null = null;

  if (deps.hasTuftedFamiliar) {
    tuftedFamiliarSystem = new TuftedFamiliarSystem({
      getIsVictoryPending: deps.getIsVictoryPending,
      getPlayerPosition: deps.getPlayerPosition,
      firePupShot: deps.fireTurretShot,
      movePupSprite: (x, y) => {
        tuftedPupSprite?.setPosition(x, y);
      },
      spawnPupSprite: (x, y) => {
        if (!scene.textures.exists('tufted_pup')) return;
        tuftedPupSprite = scene.add.image(x, y, 'tufted_pup');
        tuftedPupSprite.setDepth(1);
      },
    });
    tuftedFamiliarSystem.place(spawnPx - 50, spawnPy);
  }

  return { engineerTurretSystem, engineerTurretSprite, tuftedFamiliarSystem, tuftedPupSprite };
}
