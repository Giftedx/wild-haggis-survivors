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
import { bakeBossEachUisge } from './eachUisge';
import { bakeBossNicnevin } from './nicnevin';
import { bakeBossTourBus } from './tourBus';
import { bakeBossLaird } from './laird';
import { bakeBossHunterGeneral } from './hunterGeneral';
import { bakeBossTaxman } from './taxman';
import { bakeBossCailleach } from './cailleachBoss';
import { bakeBossNuckelavee } from './nuckelavee';
import { bakeBossEarlBeardie } from './earl_beardie';
import { bakeBossArenaProps } from './arenaProps';

/** Bake every boss sprite. Called once from BootScene.generateAllTextures. */
export function bakeBosses(scene: Phaser.Scene): void {
  bakeBossGordon(scene);
  // N1 Tier-2 mythos: Each-uisge slots between Gordon (5:00) and Tour Bus (10:00).
  bakeBossEachUisge(scene);
  bakeBossTourBus(scene);
  // N1 Tier-2 mythos: Nicnevin slots at 12:30 between Tour Bus (10:00) and the Laird (15:00).
  bakeBossNicnevin(scene);
  bakeBossLaird(scene);
  // Orcadian mythos: Nuckelavee slots at 17:00 between the Laird (15:00) and Hunter General (20:00).
  bakeBossNuckelavee(scene);
  bakeBossHunterGeneral(scene);
  // Glamis ghost: Earl Beardie slots at 22:30 between Hunter General (20:00) and Taxman (25:00).
  bakeBossEarlBeardie(scene);
  bakeBossTaxman(scene);
  // V2 — Cailleach Gauntlet boss; manual-spawn only (no auto-time slot).
  bakeBossCailleach(scene);
  bakeBossArenaProps(scene);
}
