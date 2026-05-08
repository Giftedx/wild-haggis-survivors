import * as Phaser from 'phaser';
import { bakeBog } from './bog';
import { bakeLoch } from './loch';
import { bakePine } from './pine';
import { bakeHeather } from './heather';
import { bakeCoastal } from './coastal';
import { bakeHaar } from './haar';
import { bakeFrost } from './frost';

/**
 * Bake every biome decoration prop. Called once from BootScene
 * generateAllTextures. Order matches the original bakeBiomeProps
 * sequence (bog → loch → pine → heather → coastal → haar → frost).
 */
export function bakeBiomeProps(scene: Phaser.Scene): void {
  bakeBog(scene);
  bakeLoch(scene);
  bakePine(scene);
  bakeHeather(scene);
  bakeCoastal(scene);
  bakeHaar(scene);
  bakeFrost(scene);
}
