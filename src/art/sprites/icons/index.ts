/**
 * HUD + upgrade-card icons. Weapon icons live in one consolidated
 * file because they share a tight 32×32 budget and a consistent
 * transparent-background style. Card icons (coming next) may follow
 * the same pattern.
 */

import Phaser from 'phaser';

import { bakeWeaponIcons } from './weapons';

export function bakeIcons(scene: Phaser.Scene): void {
  bakeWeaponIcons(scene);
  // Card icons (passive + stat) still inline in BootScene; next commit
  // will add bakeCardIcons(scene) here.
}
