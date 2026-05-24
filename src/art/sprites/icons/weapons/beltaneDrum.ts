import * as Phaser from 'phaser';

/**
 * `wicon_beltane_drum` — Beltane Drum evolution icon.
 * The bodhrán evolved: midsummer fire-drum with amber skin flushed
 * crimson and a ring of Beltane fire licking the hoop. Two concentric
 * rings suggest the double-pulse VFX: inner amber / outer crimson.
 */
export function drawBeltaneDrumIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Outer fire-glow halo — crimson-orange.
  g.fillStyle(0xc83010, 0.35);
  g.fillCircle(14, 15, 14);

  // Drum outer hoop — charred dark willow, fire-kissed.
  g.fillStyle(0x2a1008, 1);
  g.fillCircle(14, 15, 12);

  // Skin — hot amber-orange from Beltane heat.
  g.fillStyle(0xd85820, 1);
  g.fillCircle(14, 15, 10);

  // Brighter centre — fire focus.
  g.fillStyle(0xf07030, 0.70);
  g.fillCircle(14, 15, 6);

  // Skin grain lines — ember-white.
  g.lineStyle(0.8, 0xffa060, 0.40);
  g.lineBetween(8, 12, 20, 12);
  g.lineBetween(7, 15, 21, 15);
  g.lineBetween(8, 18, 20, 18);

  // Centre strike point.
  g.fillStyle(0xff8040, 0.85);
  g.fillCircle(14, 15, 2.5);

  // Fire sparks on hoop — three small dots.
  g.fillStyle(0xffd060, 1);
  g.fillCircle(6, 8, 1.4);
  g.fillCircle(22, 8, 1.4);
  g.fillCircle(14, 4, 1.4);

  // Tipper — bone-white (midsummer ritual).
  g.fillStyle(0xe8dcc8, 1);
  g.fillRect(22, 3, 3, 13);
  g.fillStyle(0xb0a890, 1);
  g.fillCircle(23, 3, 2);

  g.generateTexture('wicon_beltane_drum', s, s);
  g.destroy();
}
