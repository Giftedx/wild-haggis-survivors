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
  bakeFxEmberSpark,
  bakeFxHaarDriftWisp,
  bakeFxLambingMote,
  bakeFxHarvestSheaf,
  bakeFxStonehavenFireball,
} from './weather';
import { bakeWeaponFlourishes } from './weaponFlourishes';
import { bakeAtmosphereLayers } from './atmosphereLayers';
import { bakeEliteTelegraphs } from './eliteTelegraphs';
import { bakeHeartPulse } from './heartPulse';
import { bakeComboChevron } from './comboChevron';

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
  bakeFxEmberSpark(scene);
  bakeFxHaarDriftWisp(scene);
  bakeFxLambingMote(scene);
  bakeFxHarvestSheaf(scene);
  bakeFxStonehavenFireball(scene);
  bakeWeaponFlourishes(scene);
  bakeAtmosphereLayers(scene);
  bakeEliteTelegraphs(scene);
  bakeHeartPulse(scene);
  bakeComboChevron(scene);
}
