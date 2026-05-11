/**
 * Croft visitors — NPCs that drop into the hub between runs to make
 * the cottage feel inhabited beyond Gran. Postie + neighbour-wifie +
 * weans + standing sheepdog + a returning haggis pal. Warmth-only
 * register: these characters say "you're not alone" without speaking.
 */

import * as Phaser from 'phaser';

import { bakePostieTextures } from './postie';
import { bakeNeighbourTextures } from './neighbour';
import { bakeWeansTexture } from './weans';
import { bakeSheepdogStandingTextures } from './sheepdogStanding';
import { bakeStoatStandingTextures } from './stoatStanding';
import { bakeReturningPalTexture } from './returningPal';

export function bakeCroftVisitors(scene: Phaser.Scene): void {
  bakePostieTextures(scene);
  bakeNeighbourTextures(scene);
  bakeWeansTexture(scene);
  bakeSheepdogStandingTextures(scene);
  bakeStoatStandingTextures(scene);
  bakeReturningPalTexture(scene);
}
