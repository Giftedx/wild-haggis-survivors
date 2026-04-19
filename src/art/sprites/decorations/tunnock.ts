/**
 * `deco_tunnock` — Tunnock's Teacake in its iconic red & silver striped
 * foil. Dome built pixel-row-by-pixel-row with stripe pattern, chocolate
 * base visible beneath, shiny foil specular highlights.
 */

import Phaser from 'phaser';

export function bakeTunnock(scene: Phaser.Scene): void {
  // 24×24 — Tunnock's Teacake in its iconic red & silver striped foil.
  // Drawn pixel-row by pixel-row for a clean dome with proper stripes.
  const s = 24;
  const g = scene.add.graphics();
  const cx = 12, cy = 13;
  const R = 9; // dome radius

  // Ground shadow
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(cx, cy + 8, 18, 4);

  // ── Flat chocolate base visible beneath the dome ──
  g.fillStyle(0x3a2210, 1);
  g.fillEllipse(cx, cy + 4, 18, 5);
  g.fillStyle(0x4a3220, 1);
  g.fillEllipse(cx, cy + 3, 16, 4);

  // ── Foil dome — draw row by row with angular stripe pattern ──
  // For each pixel row of the dome, compute its width from circle math,
  // then alternate red / silver based on angle from centre.
  for (let dy = -R; dy <= 0; dy++) {
    const halfW = Math.floor(Math.sqrt(R * R - dy * dy));
    const y = cy + dy;
    for (let dx = -halfW; dx <= halfW; dx++) {
      const x = cx + dx;
      // Compute angle from dome centre to decide stripe colour
      const angle = Math.atan2(dy, dx);
      // 5 stripes across the dome (alternating red/silver)
      const stripeIndex = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 10);
      const isRed = stripeIndex % 2 === 0;

      if (isRed) {
        // Red stripe — darker on right, brighter on left for 3D
        const shade = dx < 0 ? 0xdd1122 : 0xbb0e1c;
        g.fillStyle(shade, 1);
      } else {
        // Silver stripe — with shading
        const shade = dx < -2 ? 0xdddddd : dx < 2 ? 0xcccccc : 0xaaaaaa;
        g.fillStyle(shade, 1);
      }
      g.fillRect(x, y, 1, 1);
    }
  }

  // ── Foil dome outline — dark ring for crisp edge ──
  g.lineStyle(1, 0x555555, 0.8);
  g.beginPath();
  g.arc(cx, cy, R, Math.PI, 0, false);
  g.strokePath();

  // ── Shiny foil specular highlight — top-left of dome ──
  g.fillStyle(0xffffff, 0.6);
  g.fillEllipse(cx - 3, cy - 6, 5, 3);
  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(cx - 2, cy - 5, 3, 2);

  // ── Secondary highlight — smaller, lower-right ──
  g.fillStyle(0xffffff, 0.2);
  g.fillEllipse(cx + 3, cy - 2, 3, 2);

  // ── Foil crinkle lines — subtle dark marks for texture ──
  g.fillStyle(0x000000, 0.15);
  g.fillRect(cx + 2, cy - 3, 1, 2);
  g.fillRect(cx - 4, cy - 2, 1, 2);
  g.fillRect(cx + 5, cy - 1, 1, 1);

  g.generateTexture('deco_tunnock', s, s);
  g.destroy();
}
