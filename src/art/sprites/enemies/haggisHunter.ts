/**
 * `haggis_hunter` — obsessive rural man in a waxed Barbour + Harris
 * Tweed flat cap, Swarovski binoculars round the neck, and a big
 * haggis-net on a pole raised over the shoulder. The joke enemy that
 * takes catching wild haggis as seriously as field sports.
 */

import Phaser from 'phaser';

export function bakeHaggisHunter(scene: Phaser.Scene): void {
  const s = 48;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // === Green wellies (proper mucky ones) ===
  g.fillStyle(0x1a3a1a, 1);
  g.fillRect(cx - 8, cy + 10, 6, 10);
  g.fillRect(cx + 2, cy + 10, 6, 10);
  g.fillStyle(0x2a5522, 1);
  g.fillRect(cx - 7, cy + 11, 4, 8);
  g.fillRect(cx + 3, cy + 11, 4, 8);
  g.fillStyle(0x554422, 0.7);
  g.fillCircle(cx - 6, cy + 18, 1.5);
  g.fillCircle(cx + 5, cy + 17, 1);
  g.fillCircle(cx - 4, cy + 16, 0.8);

  // === Wax Barbour jacket (the £300 uniform of the rural obsessive) ===
  g.fillStyle(0x1a2a11, 1);
  g.fillRect(cx - 12, cy - 6, 24, 18);
  g.fillStyle(0x2d4a22, 1);
  g.fillRect(cx - 11, cy - 5, 22, 16);
  // Wax sheen (oiled cotton catches light — subtle left highlight)
  g.fillStyle(0x3a5a2a, 0.5);
  g.fillRect(cx - 10, cy - 4, 8, 4);
  // Corduroy collar (brown, popped against the wind)
  g.fillStyle(0x664422, 1);
  g.fillRect(cx - 8, cy - 7, 16, 2);
  g.fillStyle(0x775533, 1);
  g.fillRect(cx - 7, cy - 7, 14, 1);
  // Deep pockets (handwarmer and game pockets)
  g.fillStyle(0x1a3311, 1);
  g.fillRect(cx - 10, cy + 2, 8, 4);
  g.fillRect(cx + 2, cy + 2, 8, 4);
  // Brass popper buttons
  g.fillStyle(0x886633, 1);
  g.fillCircle(cx - 6, cy + 3, 0.8);
  g.fillCircle(cx + 6, cy + 3, 0.8);
  g.fillStyle(0xaa8844, 0.6);
  g.fillCircle(cx - 6, cy + 3, 0.4);
  g.fillCircle(cx + 6, cy + 3, 0.4);
  // Rain beading on wax jacket (the whole point of the wax!)
  g.fillStyle(0xaaddee, 0.4);
  g.fillCircle(cx - 8, cy - 2, 0.7);
  g.fillCircle(cx + 5, cy + 1, 0.6);
  g.fillCircle(cx - 3, cy + 5, 0.6);
  g.fillCircle(cx + 8, cy - 3, 0.5);
  // Thermos flask peeking from inside pocket (green, tartan)
  g.fillStyle(0x225522, 1);
  g.fillRect(cx - 10, cy - 1, 3, 4);
  g.fillStyle(0x337733, 1);
  g.fillRect(cx - 10, cy, 3, 2);
  // Tartan band on thermos
  g.fillStyle(0xcc3322, 0.6);
  g.fillRect(cx - 10, cy + 1, 3, 1);

  // === Binoculars around neck (Swarovski — he takes this seriously) ===
  g.fillStyle(0x0a0a0a, 1);
  g.fillCircle(cx - 3, cy - 1, 2.5);
  g.fillCircle(cx + 3, cy - 1, 2.5);
  g.fillStyle(0x222222, 1);
  g.fillCircle(cx - 3, cy - 1, 2);
  g.fillCircle(cx + 3, cy - 1, 2);
  // Bridge connecting barrels
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 1, cy - 2, 2, 1);
  // Lens glass (blue-coated, glinting)
  g.fillStyle(0x88ccff, 0.7);
  g.fillCircle(cx - 3, cy - 2, 0.8);
  g.fillCircle(cx + 3, cy - 2, 0.8);
  // Neckstrap
  g.lineStyle(1, 0x333322, 0.8);
  g.lineBetween(cx - 3, cy - 3, cx - 4, cy - 6);
  g.lineBetween(cx + 3, cy - 3, cx + 4, cy - 6);

  // === Head (weather-beaten, wind-burned, deeply determined) ===
  g.fillStyle(0x885533, 1);
  g.fillCircle(cx, cy - 12, 8);
  g.fillStyle(0xddaa77, 1);
  g.fillCircle(cx, cy - 12, 7);
  // Wind-burned cheeks (raw red from years on the moor)
  g.fillStyle(0xcc7755, 0.5);
  g.fillCircle(cx - 4, cy - 10, 2.5);
  g.fillCircle(cx + 4, cy - 10, 2.5);
  // Crow's feet wrinkles (squinting into the wind for decades)
  g.lineStyle(0.6, 0xaa7744, 0.5);
  g.lineBetween(cx - 7, cy - 13, cx - 8, cy - 14);
  g.lineBetween(cx - 7, cy - 12, cx - 8, cy - 12);
  g.lineBetween(cx + 7, cy - 13, cx + 8, cy - 14);
  g.lineBetween(cx + 7, cy - 12, cx + 8, cy - 12);
  // Narrowed determined eyes (scanning for haggis)
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 5, cy - 13, 3, 1.5);
  g.fillRect(cx + 2, cy - 13, 3, 1.5);
  // Furrowed brow (concentration)
  g.lineStyle(0.8, 0xaa7744, 0.6);
  g.lineBetween(cx - 6, cy - 14, cx - 3, cy - 15);
  g.lineBetween(cx + 6, cy - 14, cx + 3, cy - 15);
  // Ruddy nose (gin blossoms — cold weather + whisky)
  g.fillStyle(0xdd8866, 0.4);
  g.fillCircle(cx, cy - 10, 1.5);
  // Stubbled jaw (hasn't been home in days — obsessive)
  g.fillStyle(0x887766, 0.25);
  g.fillRect(cx - 4, cy - 9, 8, 3);
  // Set jaw (thin-lipped determination)
  g.fillStyle(0x554433, 0.7);
  g.fillRect(cx - 3, cy - 8, 6, 1);

  // === Flat cap (proper Harris Tweed) ===
  g.fillStyle(0x3a3322, 1);
  g.fillRect(cx - 10, cy - 20, 20, 6);
  g.fillStyle(0x5a5533, 1);
  g.fillRect(cx - 9, cy - 19, 18, 4);
  // Tweed fleck pattern (tiny dots of colour in the weave)
  g.fillStyle(0x4a4422, 0.7);
  g.fillCircle(cx - 5, cy - 18, 0.5);
  g.fillCircle(cx + 2, cy - 17, 0.5);
  g.fillCircle(cx + 6, cy - 18, 0.5);
  g.fillStyle(0x665544, 0.4);
  g.fillCircle(cx - 2, cy - 18, 0.5);
  g.fillCircle(cx + 4, cy - 17, 0.5);
  // Peak (stiff, forward-pointing)
  g.fillStyle(0x3a3322, 1);
  g.fillRect(cx - 12, cy - 15, 14, 2);
  g.fillStyle(0x4a4433, 0.7);
  g.fillRect(cx - 11, cy - 15, 12, 1);
  // Rain bead on peak
  g.fillStyle(0xaaddee, 0.35);
  g.fillCircle(cx - 8, cy - 15, 0.5);

  // === Big haggis net on a pole ===
  g.fillStyle(0x664411, 1);
  g.fillRect(cx + 13, cy - 14, 2, 22);
  g.lineStyle(2, 0x333322, 1);
  g.strokeCircle(cx + 19, cy - 16, 7);
  g.lineStyle(1, 0x998866, 0.8);
  g.strokeCircle(cx + 19, cy - 16, 6);
  g.lineStyle(0.8, 0x998866, 0.5);
  g.lineBetween(cx + 13, cy - 16, cx + 25, cy - 16);
  g.lineBetween(cx + 19, cy - 22, cx + 19, cy - 10);
  g.lineBetween(cx + 14, cy - 20, cx + 24, cy - 12);
  g.lineBetween(cx + 14, cy - 12, cx + 24, cy - 20);

  g.generateTexture('haggis_hunter', s, s);
  g.destroy();
}

