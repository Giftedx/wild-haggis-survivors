/**
 * Projectile sprites — the things the haggis throws at enemies.
 */

import * as Phaser from 'phaser';

import { bakeThistleProjectile } from './thistle';
import { bakeCaber } from './caber';
import { bakeHaggisBall } from './haggisBall';
import { bakeShintyBall } from './shintyBall';
import { bakeBeithirFang } from './beithirFang';

export function bakeProjectiles(scene: Phaser.Scene): void {
  bakeThistleProjectile(scene);
  bakeCaber(scene);
  bakeHaggisBall(scene);
  bakeShintyBall(scene);
  bakeBeithirFang(scene);
}
