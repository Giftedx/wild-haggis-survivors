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
import { bakeTelegraphFx } from './telegraphs';
import {
  bakeFxTrailThistle,
  bakeFxTrailCaber,
  bakeFxTrailHaggis,
} from './projectileTrails';
import {
  bakeFxEnemyBurstSmall,
  bakeFxEnemyBurstMedium,
  bakeFxEnemyBurstLarge,
} from './deathBursts';
import {
  bakeFxRainDrop,
  bakeFxDrizzle,
  bakeFxSunShaft,
  bakeFxAuroraBand,
} from './weather';

export function bakeFx(scene: Phaser.Scene): void {
  bakeEntityShadow(scene);
  bakeBossShadow(scene);
  bakeSnowflake(scene);
  bakeFilmGrain(scene);
  bakeFiannaSpirit(scene);
  bakeTelegraphFx(scene);
  bakeFxTrailThistle(scene);
  bakeFxTrailCaber(scene);
  bakeFxTrailHaggis(scene);
  bakeFxEnemyBurstSmall(scene);
  bakeFxEnemyBurstMedium(scene);
  bakeFxEnemyBurstLarge(scene);
  bakeFxRainDrop(scene);
  bakeFxDrizzle(scene);
  bakeFxSunShaft(scene);
  bakeFxAuroraBand(scene);
}
