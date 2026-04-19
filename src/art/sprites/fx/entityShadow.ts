/**
 * `entity_shadow` — soft elliptical ground shadow used under every
 * regular enemy / pickup. Warm dark-green tint (not cold black) so
 * the shadow reads as grounded in the moor grass rather than pasted
 * on. Alphas stacked for penumbra → mid → core → warm centre.
 */

import Phaser from 'phaser';

export function bakeEntityShadow(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  // Outermost penumbra — barely visible, warm-tinted
  g.fillStyle(0x0a1a0a, 0.18);
  g.fillEllipse(s / 2, s / 2, 36, 12);
  // Mid shadow — green-tinted dark to blend with moor
  g.fillStyle(0x081808, 0.35);
  g.fillEllipse(s / 2, s / 2, 28, 9);
  // Core contact shadow — darkest, directly under the entity
  g.fillStyle(0x061206, 0.52);
  g.fillEllipse(s / 2, s / 2, 20, 6);
  // Warm centre dot (contact point catches ambient bounce light)
  g.fillStyle(0x0a1a0a, 0.6);
  g.fillEllipse(s / 2, s / 2, 12, 4);
  g.generateTexture('entity_shadow', s, s);
  g.destroy();
}
