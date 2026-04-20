/**
 * Wildlife sprites — decorative ambient creatures.
 */
import Phaser from 'phaser';
import { bakeHare } from './hare';

export function bakeWildlife(scene: Phaser.Scene): void {
  bakeHare(scene);
}
