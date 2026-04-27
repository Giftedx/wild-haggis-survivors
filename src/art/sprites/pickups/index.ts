/**
 * Pickup sprites — collectibles that drop from enemies or sit in the
 * world: XP gems, health orbs, treasure chests, and the rare
 * reliquary relic altar.
 */

import * as Phaser from 'phaser';

import { bakeXpGem } from './xpGem';
import { bakeChest } from './chest';
import { bakeHealthOrb } from './healthOrb';
import { bakeReliquary } from './reliquary';
import { bakeBurnsPlatter } from './burnsPlatter';
import { bakePickupVariants } from './variants';

export function bakePickups(scene: Phaser.Scene): void {
  bakeXpGem(scene);
  bakeChest(scene);
  bakeHealthOrb(scene);
  bakeReliquary(scene);
  bakeBurnsPlatter(scene);
  bakePickupVariants(scene);
}
