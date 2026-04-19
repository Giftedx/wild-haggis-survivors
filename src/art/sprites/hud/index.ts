/**
 * HUD sprites — shield icon + dash charge pips. Small, readable at any
 * UI scale, crisp at gameplay font sizes.
 */

import Phaser from 'phaser';

import { bakeShield } from './shield';
import { bakeDashPips } from './dashPips';

export function bakeHud(scene: Phaser.Scene): void {
  bakeShield(scene);
  bakeDashPips(scene);
}
