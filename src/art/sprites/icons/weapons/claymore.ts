import * as Phaser from 'phaser';

export function drawClaymoreIcon(scene: Phaser.Scene): void {
  // Highland two-handed broadsword. The distinguishing trait that
  // separates a claymore from any other greatsword is the FORWARD-
  // CANTED quillons angling toward the tip with quatrefoil terminals
  // (four-petal clusters at each end of the crossguard). Wheel pommel,
  // leather + wire wrapped double-hand grip. Drawn vertically so the
  // blade dominates the HUD slot.
  const s = 32;
  const g = scene.add.graphics();

  // ── Blade outline — dark steel edge — wide diamond shape, point up ──
  g.fillStyle(0x1a2028, 1);
  g.fillTriangle(16, 2, 12, 18, 20, 18);
  // Main blade — cold steel mid-tone
  g.fillStyle(0x3a4a5a, 1);
  g.fillTriangle(16, 3, 13, 18, 19, 18);
  // Lighter face
  g.fillStyle(0x6a7e90, 1);
  g.fillTriangle(16, 4, 14, 18, 18, 18);
  // Central fuller (groove) — darker thin line running down the blade
  g.fillStyle(0x2a3848, 0.85);
  g.fillRect(16, 4, 0.5, 14);
  // Bright edge highlight on the leading (left) edge
  g.fillStyle(0xc8dae8, 0.85);
  g.fillRect(15, 6, 0.5, 10);
  g.fillStyle(0xe8f2fa, 0.7);
  g.fillRect(15, 6, 0.5, 5);
  // Blade tip highlight — catches the light
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(15.5, 3, 1, 2);

  // ── Crossguard — forward-canted quillons (the claymore tell).
  // Each quillon is a thick bar angling UP-and-OUT from the central
  // block toward the blade tip, ending in a quatrefoil cluster.
  // Built out of stacked parallel bars so the angle reads clearly
  // at sprite scale rather than getting smoothed into a horizontal. ──
  // Central iron block behind the quillons
  g.fillStyle(0x1a1006, 1);
  g.fillRect(13, 17, 6, 4);
  g.fillStyle(0x2a1e10, 1);
  g.fillRect(13, 17, 6, 1);

  // LEFT quillon — staircase of 1px rects stepping up-left so the
  // forward cant is unmistakable. Dark outline, then brown mid.
  g.fillStyle(0x1a1006, 1);
  g.fillRect(12, 19, 2, 2); // base at block
  g.fillRect(10, 18, 2, 2);
  g.fillRect(8, 17, 2, 2);
  g.fillRect(6, 16, 2, 2);
  g.fillRect(4, 15, 2, 2);
  g.fillStyle(0x4a3420, 1);
  g.fillRect(12, 19, 1, 1);
  g.fillRect(10, 18, 1, 1);
  g.fillRect(8, 17, 1, 1);
  g.fillRect(6, 16, 1, 1);
  g.fillRect(4, 15, 1, 1);
  g.fillStyle(0x7a5a30, 0.8);
  g.fillRect(12, 20, 1, 1);
  g.fillRect(10, 19, 1, 1);
  g.fillRect(8, 18, 1, 1);
  g.fillRect(6, 17, 1, 1);
  g.fillRect(4, 16, 1, 1);

  // RIGHT quillon — mirror staircase up-right.
  g.fillStyle(0x1a1006, 1);
  g.fillRect(18, 19, 2, 2);
  g.fillRect(20, 18, 2, 2);
  g.fillRect(22, 17, 2, 2);
  g.fillRect(24, 16, 2, 2);
  g.fillRect(26, 15, 2, 2);
  g.fillStyle(0x4a3420, 1);
  g.fillRect(19, 19, 1, 1);
  g.fillRect(21, 18, 1, 1);
  g.fillRect(23, 17, 1, 1);
  g.fillRect(25, 16, 1, 1);
  g.fillRect(27, 15, 1, 1);
  g.fillStyle(0x7a5a30, 0.8);
  g.fillRect(19, 20, 1, 1);
  g.fillRect(21, 19, 1, 1);
  g.fillRect(23, 18, 1, 1);
  g.fillRect(25, 17, 1, 1);
  g.fillRect(27, 16, 1, 1);

  // Quatrefoil terminals — four-petal cluster at each quillon tip.
  const drawQuatrefoil = (qx: number, qy: number) => {
    g.fillStyle(0x1a1006, 1);
    g.fillCircle(qx - 1, qy - 1, 1.4);
    g.fillCircle(qx + 1, qy - 1, 1.4);
    g.fillCircle(qx - 1, qy + 1, 1.4);
    g.fillCircle(qx + 1, qy + 1, 1.4);
    g.fillStyle(0x7a5628, 1);
    g.fillCircle(qx - 1, qy - 1, 0.9);
    g.fillCircle(qx + 1, qy - 1, 0.9);
    g.fillCircle(qx - 1, qy + 1, 0.9);
    g.fillCircle(qx + 1, qy + 1, 0.9);
    g.fillStyle(0xbb8a3a, 1);
    g.fillCircle(qx - 1.2, qy - 1.2, 0.5);
    g.fillCircle(qx + 0.8, qy - 1.2, 0.5);
    g.fillStyle(0xffcc55, 0.9);
    g.fillCircle(qx - 1.3, qy - 1.3, 0.2);
    g.fillCircle(qx + 0.7, qy - 1.3, 0.2);
  };
  drawQuatrefoil(4, 14);
  drawQuatrefoil(28, 14);

  // ── Grip — leather-wrapped double-hand hilt with copper wire
  // bands. Wider than before so it reads as "two-handed". ──
  g.fillStyle(0x1a1006, 1);
  g.fillRect(14, 21, 4, 7);
  g.fillStyle(0x3a2816, 1);
  g.fillRect(14, 21, 4, 7);
  g.fillStyle(0x5a3c1e, 1);
  g.fillRect(14, 21, 4, 1);
  // Copper wire bands — three thin rings across the grip
  g.fillStyle(0xaa6028, 1);
  g.fillRect(14, 22.5, 4, 0.5);
  g.fillRect(14, 24.5, 4, 0.5);
  g.fillRect(14, 26.5, 4, 0.5);
  g.fillStyle(0xcc8040, 0.8);
  g.fillRect(14, 22.5, 4, 0.2);
  g.fillRect(14, 24.5, 4, 0.2);
  g.fillRect(14, 26.5, 4, 0.2);
  // Vertical shadow on the right side of the grip
  g.fillStyle(0x1a0e00, 0.5);
  g.fillRect(17, 21, 1, 7);

  // ── Wheel pommel — disc-shaped with a small central boss.
  // Bronze with a warm highlight so it matches the quatrefoils. ──
  g.fillStyle(0x1a1006, 1);
  g.fillCircle(16, 29, 2.8);
  g.fillStyle(0x5a3c18, 1);
  g.fillCircle(16, 29, 2.3);
  g.fillStyle(0xaa7828, 1);
  g.fillCircle(16, 28.8, 1.8);
  g.fillStyle(0xddaa44, 1);
  g.fillCircle(15.6, 28.5, 0.9);
  g.fillStyle(0xffdd77, 0.8);
  g.fillCircle(15.4, 28.3, 0.4);
  // Small boss rivet at pommel centre
  g.fillStyle(0x2a1a08, 1);
  g.fillCircle(16, 29, 0.4);

  g.generateTexture('wicon_claymore', s, s);
  g.destroy();
}
