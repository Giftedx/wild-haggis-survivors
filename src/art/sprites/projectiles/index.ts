/**
 * Projectile sprites — the things the haggis throws at enemies.
 */

import Phaser from 'phaser';

import { bakeThistleProjectile } from './thistle';
import { bakeCaber } from './caber';
import { bakeHaggisBall } from './haggisBall';

export function bakeProjectiles(scene: Phaser.Scene): void {
  bakeThistleProjectile(scene);
  bakeCaber(scene);
  bakeHaggisBall(scene);
}
