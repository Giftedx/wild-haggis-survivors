/**
 * Enemy sprite bakers — one file per enemy under this folder.
 *
 * Each `bake<Name>(scene)` is a pure function that grabs a throwaway
 * `scene.add.graphics()`, draws the enemy, calls `generateTexture` to
 * register the texture, then destroys the graphics object.
 *
 * `bakeEnemies(scene)` is the single entry point called from
 * `BootScene.generateAllTextures()`. Order matters for nothing beyond
 * historical call sequence — each texture key is unique, so the bake
 * order has no semantic effect.
 */

import * as Phaser from 'phaser';

import { bakeTourist } from './tourist';
import { bakeChef } from './chef';
import { bakeMidge } from './midge';
import { bakeHighlandCow } from './highlandCow';
import { bakeEagle } from './eagle';
import { bakeHaggisHunter } from './haggisHunter';
import { bakeAngryScotsman } from './angryScotsman';
import { bakeKelpie } from './kelpie';
import { bakeMidgieSwarm } from './midgieSwarm';
import { bakeBuckfastNed } from './buckfastNed';
import { bakeTrafficConeTotem } from './trafficConeTotem';
import { bakeEdinburghGhostGuide } from './edinburghGhostGuide';
import { bakeBarghest } from './barghest';
import { bakeCuSith } from './cuSith';
import { bakeKelpieFoal } from './kelpieFoal';
import { bakeBlueManOfMinch } from './blueManOfMinch';
import { bakeHaarWraith } from './haarWraith';
import { bakeGaleWraith } from './galeWraith';
import { bakeSeeliePiper } from './seeliePiper';
import { bakeUnseelieFiddler } from './unseelieFiddler';
import { bakeRedcap } from './redcap';
import { bakeCeilidhCaller } from './ceilidhCaller';
import { bakeTomeWraith } from './tomeWraith';
import { bakeDeanApparition } from './deanApparition';
import { bakeLedgerWraith } from './ledgerWraith';
import { bakeAuditorPriest } from './auditorPriest';
import { bakePiper } from './piper';
import { bakeSheep } from './sheep';
import { bakeGhost } from './ghost';
import { bakeNest } from './nest';
import { bakeDeepFryer } from './deepFryer';

/** Bake every enemy sprite. Called once from BootScene.generateAllTextures. */
export function bakeEnemies(scene: Phaser.Scene): void {
  bakeTourist(scene);
  bakeChef(scene);
  bakeMidge(scene);
  bakeHighlandCow(scene);
  bakeEagle(scene);
  bakeHaggisHunter(scene);
  bakeAngryScotsman(scene);
  bakeKelpie(scene);
  bakeMidgieSwarm(scene);
  bakeBuckfastNed(scene);
  bakeTrafficConeTotem(scene);
  bakeEdinburghGhostGuide(scene);
  bakeBarghest(scene);
  bakeCuSith(scene);
  bakeKelpieFoal(scene);
  bakeBlueManOfMinch(scene);
  bakeHaarWraith(scene);
  bakeGaleWraith(scene);
  bakeSeeliePiper(scene);
  bakeUnseelieFiddler(scene);
  bakeRedcap(scene);
  bakeCeilidhCaller(scene);
  bakeTomeWraith(scene);
  bakeDeanApparition(scene);
  bakeLedgerWraith(scene);
  bakeAuditorPriest(scene);
  // Older enemies + hazard deepFryer — appended after the first split
  // commit but still batched through the same entry point.
  bakePiper(scene);
  bakeSheep(scene);
  bakeGhost(scene);
  bakeNest(scene);
  bakeDeepFryer(scene);
}
