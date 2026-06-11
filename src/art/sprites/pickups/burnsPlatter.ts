/**
 * `burns_platter` — Burns Night run-start pickup. Shares the visual
 * language of the Croft seasonal platter so the cross-scene callback
 * reads instantly: the table scene's centrepiece, now on the moor.
 *
 * Registered in `bakePickups()` so the texture is cached before any
 * run kicks off; only PickupSpawner spawns the sprite.
 */

import * as Phaser from 'phaser';
import {
  HAGGIS_PLATTER_PICKUP_SIZE,
  drawHaggisPlatterPickup,
} from './haggisPlatterPickup';

export const BURNS_PLATTER_TEXTURE_KEY = 'burns_platter';

export function bakeBurnsPlatter(scene: Phaser.Scene): void {
  const s = HAGGIS_PLATTER_PICKUP_SIZE;
  const g = scene.add.graphics();
  drawHaggisPlatterPickup(g, s / 2, s / 2);
  g.generateTexture(BURNS_PLATTER_TEXTURE_KEY, s, s);
  g.destroy();
}
