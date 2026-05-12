import * as Phaser from 'phaser';

/**
 * `wicon_grannies_curse` — a bound hex-bundle. Three crooked twigs tied
 * together with a strip of mourning cloth, a wee bone-button at the
 * centre, and three faint purple wisps drifting off. Reads as folk
 * magic, not ceremonial witchcraft.
 */
export function drawGranniesCurseIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // Drop shadow under the bundle.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx, cy + 10, 14, 2);

  // ── Three crooked twigs — dark brown bound at centre, splaying
  // out at top and bottom. Each twig is a short line of pixels with
  // a slight crook to avoid the "tally mark" look.
  const TWIG_DARK = 0x2a1c10;
  const TWIG = 0x5a3820;
  const TWIG_HI = 0x8a5a30;
  const twigs: Array<[number, number]> = [
    [-Math.PI / 2 - 0.4, 9],
    [-Math.PI / 2, 10],
    [-Math.PI / 2 + 0.4, 9],
  ];
  for (const [ang, len] of twigs) {
    const tx = cx + Math.cos(ang) * len;
    const ty = cy + Math.sin(ang) * len;
    // Stem segment — outline + body.
    g.lineStyle(2.6, TWIG_DARK, 1);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(tx, ty);
    g.strokePath();
    g.lineStyle(1.6, TWIG, 1);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(tx, ty);
    g.strokePath();
    g.lineStyle(0.6, TWIG_HI, 0.8);
    g.beginPath();
    g.moveTo(cx + Math.cos(ang) * 1.5, cy + Math.sin(ang) * 1.5);
    g.lineTo(tx, ty);
    g.strokePath();
  }
  // Bottom roots — shorter mirror set.
  for (const [ang, len] of [[Math.PI / 2 - 0.3, 7], [Math.PI / 2 + 0.3, 7]] as Array<[number, number]>) {
    const tx = cx + Math.cos(ang) * len;
    const ty = cy + Math.sin(ang) * len;
    g.lineStyle(2.4, TWIG_DARK, 1);
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(tx, ty); g.strokePath();
    g.lineStyle(1.4, TWIG, 1);
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(tx, ty); g.strokePath();
  }

  // ── Mourning-cloth binding — dark purple wrap tied at the centre.
  g.fillStyle(0x1a0820, 1);
  g.fillRoundedRect(cx - 5, cy - 2, 10, 4, 1.4);
  g.fillStyle(0x3a1850, 1);
  g.fillRoundedRect(cx - 4.4, cy - 1.4, 8.8, 2.8, 1.1);
  g.fillStyle(0x5a3060, 0.9);
  g.fillRect(cx - 3.4, cy - 1, 6.8, 0.7);

  // ── Bone button at the knot — the curse's anchor.
  g.fillStyle(0xf0e8d0, 1);
  g.fillCircle(cx, cy, 1.5);
  g.fillStyle(0x8a7050, 0.9);
  g.fillCircle(cx, cy, 1.1);
  g.fillStyle(0xfff5e0, 0.9);
  g.fillCircle(cx - 0.4, cy - 0.4, 0.5);

  // ── Three purple hex-wisps drifting off — faint, asymmetric.
  g.fillStyle(0x9050a0, 0.65);
  g.fillCircle(cx - 7, cy - 8, 1.3);
  g.fillStyle(0xb070c0, 0.45);
  g.fillCircle(cx + 8, cy - 6, 1.0);
  g.fillStyle(0x7040a0, 0.55);
  g.fillCircle(cx + 6, cy + 6, 1.1);
  // A tiny spark inside each.
  g.fillStyle(0xe8a0ff, 0.85);
  g.fillRect(cx - 7, cy - 8, 0.4, 0.4);
  g.fillRect(cx + 8, cy - 6, 0.4, 0.4);

  g.generateTexture('wicon_grannies_curse', s, s);
  g.destroy();
}
