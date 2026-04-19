/**
 * FX sprites — ground shadows, weather particles, post-effect noise.
 * Shared by every entity so bake order is exported explicitly.
 */

import Phaser from 'phaser';

import { bakeEntityShadow } from './entityShadow';
import { bakeBossShadow } from './bossShadow';
import { bakeSnowflake } from './snowflake';
import { bakeFilmGrain } from './filmGrain';

export function bakeFx(scene: Phaser.Scene): void {
  bakeEntityShadow(scene);
  bakeBossShadow(scene);
  bakeSnowflake(scene);
  bakeFilmGrain(scene);
}
