import * as Phaser from 'phaser';
import { drawThistleShotIcon } from './thistleShot';
import { drawCaberTossIcon } from './caberToss';
import { drawHaggisHurlerIcon } from './haggisHurler';
import { drawBagpipeBlastIcon } from './bagpipeBlast';
import { drawScotchMistIcon } from './scotchMist';
import { drawNessieTentacleIcon } from './nessieTentacle';
import { drawThistleStormIcon } from './thistleStorm';
import { drawHighlandGamesIcon } from './highlandGames';
import { drawHaggisCannonIcon } from './haggisCannon';
import { drawHighlandFlingIcon } from './highlandFling';
import { drawTheHaarIcon } from './theHaar';
import { drawNessieUnleashedIcon } from './nessieUnleashed';
import { drawClaymoreIcon } from './claymore';
import { drawBagpipesUtilityIcon } from './bagpipesUtility';
import { drawWilliamBladeIcon } from './williamBlade';
import { drawShintyStickIcon } from './shintyStick';
import { drawShintyCamanIcon } from './shintyCaman';
import { drawSgianDubhIcon } from './sgianDubh';
import { drawSgianGealIcon } from './sgianGeal';
import { drawStagAntlerIcon } from './stagAntler';
import { drawMonarchChargeIcon } from './monarchCharge';
import { drawWaulkingMalletIcon } from './waulkingMallet';
import { drawPibrochHammerIcon } from './pibrochHammer';
import { drawDirkDanceIcon } from './dirkDance';
import { drawGranniesCurseIcon } from './granniesCurse';
import { drawWallaceSwordIcon } from './wallaceSword';
import { drawDirkFlurryIcon } from './dirkFlurry';
import { drawBansheeWailIcon } from './bansheeWail';
import { drawFreedomBladeIcon } from './freedomBlade';
import { drawPracticeChanterIcon } from './practiceChanter';
import { drawWhiskyLobIcon } from './whiskyLob';
import { drawBagpipeDroneIcon } from './bagpipeDrone';
import { drawCoastalStormIcon } from './coastalStorm';

/**
 * Bake every weapon-HUD icon. Called once from BootScene
 * generateAllTextures. Order matches BootScene's original call list.
 */
export function bakeWeaponIcons(scene: Phaser.Scene): void {
  // Base weapons
  drawThistleShotIcon(scene);
  drawCaberTossIcon(scene);
  drawHaggisHurlerIcon(scene);
  drawBagpipeBlastIcon(scene);
  drawScotchMistIcon(scene);
  drawNessieTentacleIcon(scene);
  drawShintyStickIcon(scene);
  drawSgianDubhIcon(scene);
  drawStagAntlerIcon(scene);
  drawWaulkingMalletIcon(scene);
  // Practice Chanter — Pibroch variant starter weapon.
  drawPracticeChanterIcon(scene);
  // Whisky Lob — zone-denial lob weapon.
  drawWhiskyLobIcon(scene);
  // Bagpipe Drone — continuous slow-aura utility.
  drawBagpipeDroneIcon(scene);
  // Coastal Storm — standalone mega-AoE.
  drawCoastalStormIcon(scene);
  // Highland Horrors base weapons.
  drawDirkDanceIcon(scene);
  drawGranniesCurseIcon(scene);
  drawWallaceSwordIcon(scene);
  // Evolutions
  drawThistleStormIcon(scene);
  drawHighlandGamesIcon(scene);
  drawHaggisCannonIcon(scene);
  drawHighlandFlingIcon(scene);
  drawTheHaarIcon(scene);
  drawNessieUnleashedIcon(scene);
  drawShintyCamanIcon(scene);
  drawSgianGealIcon(scene);
  drawMonarchChargeIcon(scene);
  drawPibrochHammerIcon(scene);
  // Highland Horrors evolutions.
  drawDirkFlurryIcon(scene);
  drawBansheeWailIcon(scene);
  drawFreedomBladeIcon(scene);
  // Standalone + utility
  drawClaymoreIcon(scene);
  drawBagpipesUtilityIcon(scene);
  drawWilliamBladeIcon(scene);
}
