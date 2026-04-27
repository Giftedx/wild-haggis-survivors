/**
 * Wildlife sprites — decorative ambient creatures.
 */
import * as Phaser from 'phaser';
import { bakeHare } from './hare';
import { bakeRedDeer } from './redDeer';
import { bakeBuzzard } from './buzzard';
import { bakeRedSquirrel } from './redSquirrel';
import { bakePineMarten } from './pineMarten';
import { bakeCapercaillie } from './capercaillie';
import { bakeOtter } from './otter';
import { bakePuffin } from './puffin';
import { bakeGoldenEagle } from './goldenEagle';
import { bakeScottishWildcat } from './scottishWildcat';

export function bakeWildlife(scene: Phaser.Scene): void {
  bakeHare(scene);
  bakeRedDeer(scene);
  bakeBuzzard(scene);
  bakeRedSquirrel(scene);
  bakePineMarten(scene);
  bakeCapercaillie(scene);
  bakeOtter(scene);
  bakePuffin(scene);
  bakeGoldenEagle(scene);
  bakeScottishWildcat(scene);
}
