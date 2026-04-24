/**
 * FX sprites — ground shadows, weather particles, post-effect noise.
 * Shared by every entity so bake order is exported explicitly.
 */

import * as Phaser from 'phaser';

import { bakeEntityShadow } from './entityShadow';
import { bakeBossShadow } from './bossShadow';
import { bakeSnowflake } from './snowflake';
import { bakeFilmGrain } from './filmGrain';
import { bakeFiannaSpirit } from './fiannaSpirit';

export function bakeFx(scene: Phaser.Scene): void {
  bakeEntityShadow(scene);
  bakeBossShadow(scene);
  bakeSnowflake(scene);
  bakeFilmGrain(scene);
  bakeFiannaSpirit(scene);
}
