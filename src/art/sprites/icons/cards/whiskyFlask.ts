import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_whisky_flask` — hip flask pickup icon. Design pivot (v2):
 * old icon had tartan label too thin + amber porthole too small to
 * read as "Scottish whisky" at 32px. New pitch — classic hip-flask
 * silhouette with a BIG AMBER WINDOW occupying the lower 2/3 of
 * the body (glass-panel flask showing the golden contents), tartan
 * label band across the SHOULDER (Royal Stewart red + green + gold),
 * and a bright gold whisky meniscus line. The amber glow is now
 * the dominant colour tell — "this is whisky, not a generic flask".
 */
export function drawWhiskyFlask(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x332211);
  const cx = 16, cy = 16;

  // ── Screw cap on top — tapered brass flask cap. ──
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 3, cy - 12, 6, 3);
  g.fillStyle(0x5a3818, 1);
  g.fillRect(cx - 3, cy - 12, 6, 2);
  g.fillStyle(0x8a6028, 1);
  g.fillRect(cx - 2.5, cy - 12, 5, 0.6);
  // Cap ridges
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 3, cy - 11, 6, 0.4);
  g.fillRect(cx - 3, cy - 10.3, 6, 0.4);

  // ── Flask neck — narrow column between cap and body. ──
  g.fillStyle(0x2a2a32, 1);
  g.fillRect(cx - 2, cy - 9, 4, 3);
  g.fillStyle(0x6a6a72, 1);
  g.fillRect(cx - 2, cy - 9, 4, 1);

  // ── FLASK BODY — classic kidney-bean hip-flask curve. Pewter
  // outer shell acts as a frame around the amber window. ──
  g.fillStyle(0x0a0a12, 1);
  g.fillRoundedRect(cx - 9, cy - 6, 18, 18, 5);
  g.fillStyle(0x5a5a68, 1);
  g.fillRoundedRect(cx - 8, cy - 5, 16, 16, 4);

  // ── BIG AMBER WHISKY WINDOW — occupies the lower 2/3 of the
  // flask. Glass panel showing the golden contents. This is the
  // dominant silhouette tell — the icon reads "whisky" at a glance. ──
  g.fillStyle(0x3a1a04, 1);
  g.fillRoundedRect(cx - 6, cy - 2, 12, 11, 2);
  g.fillStyle(0xa06818, 1);
  g.fillRoundedRect(cx - 5.5, cy - 1.5, 11, 10, 1.8);
  g.fillStyle(0xd88a28, 1);
  g.fillRoundedRect(cx - 5.5, cy - 1.5, 11, 7, 1.8);
  g.fillStyle(0xf8b040, 1);
  g.fillRoundedRect(cx - 5.5, cy - 1.5, 11, 3.5, 1.8);
  // Bright amber highlight — sells the glow
  g.fillStyle(0xffd878, 0.92);
  g.fillRect(cx - 4, cy, 3, 6);
  g.fillStyle(0xfff0c0, 0.9);
  g.fillRect(cx - 4, cy, 1.5, 6);
  // Whisky meniscus — gold surface line
  g.fillStyle(0xfff0c0, 0.85);
  g.fillRect(cx - 5, cy - 1, 10, 0.6);

  // ── TARTAN LABEL BAND — wraps across the SHOULDER of the flask
  // above the amber window. Royal Stewart red + dark green + gold. ──
  g.fillStyle(0x0a0000, 1);
  g.fillRect(cx - 9, cy - 6, 18, 3);
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx - 9, cy - 5.5, 18, 2.5);
  // Dark green crossbar
  g.fillStyle(0x0a3018, 0.9);
  g.fillRect(cx - 9, cy - 4.6, 18, 0.8);
  // Gold vertical stripes
  g.fillStyle(0xdaaa40, 1);
  g.fillRect(cx - 6, cy - 5.5, 0.6, 2.5);
  g.fillRect(cx + 1, cy - 5.5, 0.6, 2.5);
  g.fillRect(cx + 5, cy - 5.5, 0.6, 2.5);
  // Cream highlight line
  g.fillStyle(0xf0e8c8, 0.7);
  g.fillRect(cx - 8, cy - 5.3, 16, 0.3);

  // ── Pewter sheen highlight on the left edge of the flask. ──
  g.fillStyle(0xbabac8, 0.8);
  g.fillRect(cx - 7, cy - 3, 0.8, 14);
  g.fillStyle(0xdcdce8, 0.85);
  g.fillRect(cx - 7.5, cy - 3, 0.4, 14);

  // ── Small chain linking cap to body. ──
  g.lineStyle(0.7, 0x6a6a72, 1);
  g.lineBetween(cx + 3, cy - 11, cx + 7, cy - 6);

  g.generateTexture('ucard_whisky_flask', s, s);
  g.destroy();
}
