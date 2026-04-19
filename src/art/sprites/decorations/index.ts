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

import Phaser from 'phaser';

import { bakeThistle } from './thistle';
import { bakeRocks } from './rocks';
import { bakeHeather } from './heather';
import { bakeGlasgowKite } from './glasgowKite';
import { bakeTrafficCone } from './trafficCone';
import { bakeTunnock } from './tunnock';
import { bakeAbandonedPint } from './abandonedPint';

export function bakeDecorations(scene: Phaser.Scene): void {
  bakeThistle(scene);
  bakeRocks(scene); // bakes deco_rock + deco_rock_2 + deco_rock_3
  bakeHeather(scene);
  bakeGlasgowKite(scene);
  bakeTrafficCone(scene);
  bakeTunnock(scene);
  bakeAbandonedPint(scene);
}
