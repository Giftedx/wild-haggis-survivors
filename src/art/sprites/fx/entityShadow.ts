/**
 * `entity_shadow` — soft elliptical ground shadow used under every
 * regular enemy / pickup. Warm dark-green tint (not cold black) so
 * the shadow reads as grounded in the moor grass rather than pasted
 * on. Alphas stacked for penumbra → mid → core → warm centre.
 */

import * as Phaser from 'phaser';

export function bakeEntityShadow(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  // ── 1px-out feathering — outermost wisp, blends into ground. ──
  g.fillStyle(0x0a1a0a, 0.10);
  g.fillEllipse(cx, cy, 38, 13.5);
  // Outermost penumbra — barely visible, warm-tinted
  g.fillStyle(0x0a1a0a, 0.18);
  g.fillEllipse(cx, cy, 36, 12);
  // Mid shadow — green-tinted dark to blend with moor
  g.fillStyle(0x081808, 0.35);
  g.fillEllipse(cx, cy, 28, 9);
  // Core contact shadow — darkest, directly under the entity
  g.fillStyle(0x061206, 0.52);
  g.fillEllipse(cx, cy, 20, 6);
  // Warm penumbra ring (inner-edge feathering 1px in)
  g.fillStyle(0x0a1a0a, 0.6);
  g.fillEllipse(cx, cy, 12, 4);
  // ── HARD-EDGED GROUND-CONTACT SPOT — small, dense ellipse at
  // the centre that gives entities a clear "this is where it
  // touches the ground" anchor. ──
  g.fillStyle(0x020a02, 0.85);
  g.fillEllipse(cx, cy, 7, 2.2);
  g.fillStyle(0x000000, 0.7);
  g.fillEllipse(cx, cy, 4.2, 1.4);
  g.generateTexture('entity_shadow', s, s);
  g.destroy();
}
