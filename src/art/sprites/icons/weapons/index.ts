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
  // Evolutions
  drawThistleStormIcon(scene);
  drawHighlandGamesIcon(scene);
  drawHaggisCannonIcon(scene);
  drawHighlandFlingIcon(scene);
  drawTheHaarIcon(scene);
  drawNessieUnleashedIcon(scene);
  drawShintyCamanIcon(scene);
  // Standalone + utility
  drawClaymoreIcon(scene);
  drawBagpipesUtilityIcon(scene);
  drawWilliamBladeIcon(scene);
}
