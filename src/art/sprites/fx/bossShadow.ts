/**
 * `boss_shadow` — wider, deeper version of entity_shadow for boss
 * encounters. Boss sprites are 2× the size, so the shadow needs to
 * match to sell the weight.
 */

import * as Phaser from 'phaser';

export function bakeBossShadow(scene: Phaser.Scene): void {
  const s = 80;
  const g = scene.add.graphics();
  // Wide penumbra — boss casts a big presence
  g.fillStyle(0x0a1a0a, 0.18);
  g.fillEllipse(s / 2, s / 2, 74, 24);
  // Mid shadow
  g.fillStyle(0x081808, 0.33);
  g.fillEllipse(s / 2, s / 2, 58, 18);
  // Inner shadow
  g.fillStyle(0x061206, 0.48);
  g.fillEllipse(s / 2, s / 2, 42, 12);
  // Core contact — darkest point
  g.fillStyle(0x040e04, 0.58);
  g.fillEllipse(s / 2, s / 2, 26, 8);
  g.generateTexture('boss_shadow', s, s);
  g.destroy();
}
