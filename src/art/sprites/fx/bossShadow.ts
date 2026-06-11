/**
 * `boss_shadow` — wider, deeper version of entity_shadow for boss
 * encounters. Boss sprites are 2× the size, so the shadow needs to
 * match to sell the weight.
 */

import * as Phaser from 'phaser';

export function bakeBossShadow(scene: Phaser.Scene): void {
  const s = 80;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  // ── OUTER RIPPLE RINGS — three wide low-alpha rings that sell
  // "boss weight" pressing the ground around the contact. ──
  g.lineStyle(1.5, 0x0a1a0a, 0.18);
  g.strokeEllipse(cx, cy, 78, 26);
  g.lineStyle(1.2, 0x0a1a0a, 0.13);
  g.strokeEllipse(cx, cy, 86, 30);
  g.lineStyle(1, 0x0a1a0a, 0.08);
  g.strokeEllipse(cx, cy, 92, 33);
  // Wide penumbra — boss casts a big presence
  g.fillStyle(0x0a1a0a, 0.18);
  g.fillEllipse(cx, cy, 74, 24);
  // Mid shadow
  g.fillStyle(0x081808, 0.33);
  g.fillEllipse(cx, cy, 58, 18);
  // Inner shadow
  g.fillStyle(0x061206, 0.48);
  g.fillEllipse(cx, cy, 42, 12);
  // Core contact — darkest point
  g.fillStyle(0x040e04, 0.58);
  g.fillEllipse(cx, cy, 26, 8);
  // ── HARD-EDGED GROUND-CONTACT SPOT — dense ellipse at the
  // centre, scaled up for boss footprint. ──
  g.fillStyle(0x020a02, 0.85);
  g.fillEllipse(cx, cy, 14, 4.4);
  g.fillStyle(0x000000, 0.7);
  g.fillEllipse(cx, cy, 8.4, 2.8);
  g.generateTexture('boss_shadow', s, s);
  g.destroy();
}
