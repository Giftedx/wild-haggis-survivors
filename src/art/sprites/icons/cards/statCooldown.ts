import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_stat_cooldown` — weapon cooldown-reduction stat icon.
 * Design pivot: old hourglass-between-posts read as "gears" or
 * "pressure clamp". New pitch — proper POCKET-WATCH CLOCK FACE
 * with visible hour/minute hands + 12 tick marks + crown stem +
 * ring loop on top. Universal "time/cooldown" icon that reads at
 * 32px without needing culture context.
 */
export function drawStatCooldown(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2238);
  const cx = 16, cy = 16;

  // Watch-loop ring on top (where the chain would attach)
  g.lineStyle(1.5, 0xd8a848, 1);
  g.strokeCircle(cx, cy - 14, 1.8);
  // Watch crown stem (between loop and body)
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 1, cy - 12, 2, 2);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 0.5, cy - 12, 1, 2);

  // Outer gold case ring
  g.fillStyle(0x8a6018, 1);
  g.fillCircle(cx, cy, 11.5);
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy, 10.5);
  g.fillStyle(0xfadc6a, 0.9);
  g.fillCircle(cx, cy - 0.5, 9.5);

  // Watch face — cream/ivory
  g.fillStyle(0xf4e8d0, 1);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0xfaf0dc, 1);
  g.fillCircle(cx, cy - 0.5, 8);

  // 12 TICK MARKS around the dial
  g.fillStyle(0x1a1008, 1);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 3 === 0;
    const r1 = 8;
    const r2 = isMajor ? 6.5 : 7.3;
    const sx1 = cx + Math.cos(a) * r1;
    const sy1 = cy + Math.sin(a) * r1;
    const sx2 = cx + Math.cos(a) * r2;
    const sy2 = cy + Math.sin(a) * r2;
    // Use a thick rect aligned along the radial line via perpendicular offset
    const perpX = -Math.sin(a) * (isMajor ? 1 : 0.5);
    const perpY = Math.cos(a) * (isMajor ? 1 : 0.5);
    g.fillTriangle(sx1 + perpX, sy1 + perpY, sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY);
    g.fillTriangle(sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY, sx2 - perpX, sy2 - perpY);
  }

  // HOUR HAND — thick, pointing up-right (10 o'clock-ish position)
  g.fillStyle(0x0a0a10, 1);
  // Hour hand as a thick triangle
  g.fillTriangle(cx, cy, cx - 4, cy - 3, cx - 0.7, cy);
  g.fillTriangle(cx, cy, cx - 0.7, cy, cx - 3, cy - 4);

  // MINUTE HAND — longer, thinner, pointing up
  g.fillStyle(0x0a0a10, 1);
  g.fillTriangle(cx, cy, cx - 0.5, cy - 7, cx + 0.5, cy - 7);

  // Centre pin (where the hands meet)
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy, 1.5);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx, cy, 0.8);

  // Glass sheen on the top-left for depth
  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(cx - 3, cy - 4, 4, 2);

  g.generateTexture('ucard_stat_cooldown', s, s);
  g.destroy();
}
