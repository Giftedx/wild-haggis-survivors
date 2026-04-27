/**
 * Boss sprite bakers — the five unique boss encounters. Each lives in
 * its own file for the same reason as enemies/: one file per big
 * silhouette so edits don't thrash a shared 680-line blob.
 *
 * Order matches the `BossKey` enum in src/data/enemies.ts so the
 * `?export=sprites` PNG + asset-validator snapshot stay byte-stable.
 */

import * as Phaser from 'phaser';

import { bakeBossGordon } from './gordon';
import { bakeBossTourBus } from './tourBus';
import { bakeBossLaird } from './laird';
import { bakeBossHunterGeneral } from './hunterGeneral';
import { bakeBossTaxman } from './taxman';
import { bakeBossArenaProps } from './arenaProps';

/** Bake every boss sprite. Called once from BootScene.generateAllTextures. */
export function bakeBosses(scene: Phaser.Scene): void {
  bakeBossGordon(scene);
  bakeBossTourBus(scene);
  bakeBossLaird(scene);
  bakeBossHunterGeneral(scene);
  bakeBossTaxman(scene);
  bakeBossArenaProps(scene);
}
