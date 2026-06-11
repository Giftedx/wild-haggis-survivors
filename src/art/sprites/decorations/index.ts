/**
 * Decoration sprites — environmental dressing for the moor. Thistles,
 * rocks, heather, Glasgow litter. All are static world props with no
 * gameplay behaviour.
 *
 * Bake order doesn't matter for display-list z-sort here (all are
 * placed by the world-dressing system at runtime with explicit depth),
 * but we keep it deterministic so ?export=sprites produces a stable
 * PNG byte-for-byte across runs.
 */

import * as Phaser from 'phaser';

import { bakeThistle } from './thistle';
import { bakeRocks } from './rocks';
import { bakeHeather } from './heather';
import { bakeGlasgowKite } from './glasgowKite';
import { bakeTrafficCone } from './trafficCone';
import { bakeTunnock } from './tunnock';
import { bakeAbandonedPint } from './abandonedPint';
import { bakeBiomeProps } from './biomeProps';
import {
  bakeChippySign,
  bakeBusStopPole,
  bakeNewsprint,
  bakeCloseDoor,
  bakeScaffoldPost,
} from './urbanProps';
import {
  bakeHazardPeatPit,
  bakeHazardFallingSlate,
  bakeHazardBurnWater,
  bakeHazardLooseScree,
  bakeHazardTidalWrack,
  bakeHazardSlickCobble,
  bakeHazardRimePatch,
  bakeHazardWindShear,
  bakeHazardHighlandMist,
  bakeHazardMoltenSlag,
  bakeHazardInkPool,
  bakeHazardSummitGust,
  bakeHazardBuckfastPool,
  bakeHazardBasaltCrack,
  bakeHazardStoneRing,
  bakeHazardRootTrip,
  bakeHazardCobbleGap,
  bakeHazardFallenPine,
  bakeHazardStandingSlab,
  bakeHazardCorryMaelstrom,
  bakeHazardShetlandSquall,
  bakeHazardFairyMist,
  bakeHazardKelpStrand,
  bakeHazardFirePillar,
} from './biomeHazards';
import {
  bakeAutumnLeafScatter,
  bakeSpringShoot,
  bakeThawPuddle,
  bakeWinterSnowcap,
  bakeSummerBarley,
} from './seasonalMoor';
import { bakeStoryProps } from './storyProps';
import { bakeCairn } from './cairn';
import { bakeSheepSkull } from './sheepSkull';
import { bakeAntlerShed } from './antlerShed';
import { bakeEngineerTurret } from './engineerTurret';
import { bakeTuftedPup } from './tuftedPup';

export function bakeDecorations(scene: Phaser.Scene): void {
  bakeThistle(scene);
  bakeRocks(scene); // bakes deco_rock + deco_rock_2 + deco_rock_3
  bakeHeather(scene);
  bakeGlasgowKite(scene);
  bakeTrafficCone(scene);
  bakeTunnock(scene);
  bakeAbandonedPint(scene);
  bakeBiomeProps(scene);
  bakeChippySign(scene);
  bakeBusStopPole(scene);
  bakeNewsprint(scene);
  bakeCloseDoor(scene);
  bakeScaffoldPost(scene);
  bakeHazardPeatPit(scene);
  bakeHazardFallingSlate(scene);
  bakeHazardBurnWater(scene);
  bakeHazardLooseScree(scene);
  bakeHazardTidalWrack(scene);
  bakeHazardSlickCobble(scene);
  bakeHazardRimePatch(scene);
  bakeHazardWindShear(scene);
  bakeHazardHighlandMist(scene);
  bakeHazardMoltenSlag(scene);
  bakeHazardInkPool(scene);
  // Ben Nevis Summit hazard.
  bakeHazardSummitGust(scene);
  // Glasgow Close hazard.
  bakeHazardBuckfastPool(scene);
  // Fingal's Cave hazard.
  bakeHazardBasaltCrack(scene);
  // Callanish Standing Stones hazard.
  bakeHazardStoneRing(scene);
  // Trossachs Forest hazard.
  bakeHazardRootTrip(scene);
  // Edinburgh Old Town hazard.
  bakeHazardCobbleGap(scene);
  // Cairngorm Woods hazard.
  bakeHazardFallenPine(scene);
  // Orkney Neolithic hazard.
  bakeHazardStandingSlab(scene);
  // B9 biome hazards (Corryvreckan, Shetland Voe, Skye Fairy Pool).
  bakeHazardCorryMaelstrom(scene);
  bakeHazardShetlandSquall(scene);
  bakeHazardFairyMist(scene);
  // Hebridean Shore hazard.
  bakeHazardKelpStrand(scene);
  // Calton Hill (Beltane Fire Festival) hazard.
  bakeHazardFirePillar(scene);
  bakeAutumnLeafScatter(scene);
  bakeSpringShoot(scene);
  bakeThawPuddle(scene);
  bakeWinterSnowcap(scene);
  bakeSummerBarley(scene);
  bakeStoryProps(scene);
  bakeCairn(scene);
  bakeSheepSkull(scene);
  bakeAntlerShed(scene);
  bakeEngineerTurret(scene);
  bakeTuftedPup(scene);
}
