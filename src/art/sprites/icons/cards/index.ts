import * as Phaser from 'phaser';
import { VARIANT_KEYS } from '../../../../data/variants';
import { drawSporran } from './sporran';
import { drawWhiskyFlask } from './whiskyFlask';
import { drawKilt } from './kilt';
import { drawTamOShanter } from './tamOShanter';
import { drawIrnBru } from './irnBru';
import { drawLochWater } from './lochWater';
import { drawThistleCrown } from './thistleCrown';
import { drawHighlandShield } from './highlandShield';
import { drawTartanSash } from './tartanSash';
import { drawShintyBall } from './shintyBall';
import { drawWhetstone } from './whetstone';
import { drawStatHealth } from './statHealth';
import { drawStatSpeed } from './statSpeed';
import { drawStatPickup } from './statPickup';
import { drawStatDamage } from './statDamage';
import { drawStatDrift } from './statDrift';
import { drawStatDefense } from './statDefense';
import { drawStatUtility } from './statUtility';
import { drawStatCooldown } from './statCooldown';
import { drawStatKnockback } from './statKnockback';
import { drawRuneGlyph } from './runeGlyph';

/**
 * Bake every upgrade-card icon. Nine accessory cards + nine stat
 * cards = 18 textures total. Order matches BootScene's original call
 * sequence.
 */
export function bakeCardIcons(scene: Phaser.Scene): void {
  drawSporran(scene);
  drawWhiskyFlask(scene);
  // Kilt card icon baked per-variant so the card matches the active tartan.
  for (const vk of VARIANT_KEYS) {
    drawKilt(scene, vk);
  }
  drawTamOShanter(scene);
  drawIrnBru(scene);
  drawLochWater(scene);
  drawThistleCrown(scene);
  drawHighlandShield(scene);
  drawTartanSash(scene);
  drawShintyBall(scene);
  drawWhetstone(scene);
  drawStatHealth(scene);
  drawStatSpeed(scene);
  drawStatPickup(scene);
  drawStatDamage(scene);
  drawStatDrift(scene);
  drawStatDefense(scene);
  drawStatUtility(scene);
  drawStatCooldown(scene);
  drawStatKnockback(scene);
  drawRuneGlyph(scene);
}
