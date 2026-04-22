/**
 * Wildlife sprites — decorative ambient creatures.
 */
import Phaser from 'phaser';
import { bakeHare } from './hare';
import { bakeRedDeer } from './redDeer';
import { bakeBuzzard } from './buzzard';

export function bakeWildlife(scene: Phaser.Scene): void {
  bakeHare(scene);
  bakeRedDeer(scene);
  bakeBuzzard(scene);
}
