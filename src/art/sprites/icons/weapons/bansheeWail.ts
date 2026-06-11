import * as Phaser from 'phaser';

/**
 * `wicon_banshee_wail` — a wailing spectral face wrapped in the
 * widow's shawl. Pale, mouth open in a long cry, dark wool draped
 * behind. Five faint purple wisps trail outward (the five hex-bolts).
 */
export function drawBansheeWailIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 15;

  // Drop shadow.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx, cy + 12, 16, 2.4);

  // Widow's shawl draped behind — dark hood shape.
  const WOOL_DARK = 0x2a1c20;
  const WOOL = 0x4a3038;
  g.fillStyle(WOOL_DARK, 1);
  g.fillEllipse(cx, cy, 16, 14);
  g.fillStyle(WOOL, 1);
  g.fillEllipse(cx, cy + 1, 13, 11);
  // Hood opening — paler oval revealing the face.
  g.fillStyle(0x1a0e12, 1);
  g.fillEllipse(cx, cy - 1, 10, 11);

  // Spectral face — pale grey-white, hollow eyes, wide open mouth.
  const SKIN = 0xd0c8c8;
  const SKIN_HI = 0xede8e0;
  g.fillStyle(SKIN, 1);
  g.fillEllipse(cx, cy - 1, 9, 10);
  // Cheek shadows.
  g.fillStyle(0x9a8c8c, 0.5);
  g.fillEllipse(cx - 3, cy + 1, 3, 4);
  g.fillEllipse(cx + 3, cy + 1, 3, 4);
  // Forehead highlight.
  g.fillStyle(SKIN_HI, 0.8);
  g.fillEllipse(cx, cy - 4, 6, 2);

  // Hollow eyes — two dark sockets.
  g.fillStyle(0x0a0a0e, 1);
  g.fillEllipse(cx - 2.2, cy - 2, 1.6, 2.4);
  g.fillEllipse(cx + 2.2, cy - 2, 1.6, 2.4);
  // Tiny pinpoint glints inside (so the eyes read as "watching" not "blank").
  g.fillStyle(0xa080c0, 0.8);
  g.fillRect(cx - 2.2, cy - 2.4, 0.6, 0.6);
  g.fillRect(cx + 2.2, cy - 2.4, 0.6, 0.6);

  // Wailing mouth — vertical oval, dark.
  g.fillStyle(0x0a0a0e, 1);
  g.fillEllipse(cx, cy + 3, 2.6, 4);
  g.fillStyle(0x3a1c1c, 1);
  g.fillEllipse(cx, cy + 3.2, 1.8, 3);

  // Five purple hex-wisps drifting out at five different angles.
  // (Sells the five-bolt mechanic at icon size.)
  const wispAngles = [
    -Math.PI * 0.75,
    -Math.PI * 0.4,
    -Math.PI * 0.05,
    Math.PI * 0.3,
    Math.PI * 0.65,
  ];
  for (const ang of wispAngles) {
    const r = 12;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    g.fillStyle(0x9050a0, 0.55);
    g.fillCircle(x, y, 1.4);
    g.fillStyle(0xc080d8, 0.8);
    g.fillRect(x - 0.3, y - 0.3, 0.6, 0.6);
  }

  g.generateTexture('wicon_banshee_wail', s, s);
  g.destroy();
}
