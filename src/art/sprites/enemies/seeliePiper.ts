import Phaser from 'phaser';

export function bakeSeeliePiper(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Fair-court glow.
  g.fillStyle(0xffe49a, 0.25);
  g.fillCircle(cx, cy, 14);
  g.fillStyle(0xffe49a, 0.12);
  g.fillCircle(cx, cy, 18);

  // Tiny body — sprite-sized fairy.
  g.fillStyle(0xb4955a, 1);
  g.fillEllipse(cx, cy + 2, 9, 11);
  g.fillStyle(0xdfc68a, 1);
  g.fillEllipse(cx, cy + 1, 7, 9);

  // Head.
  g.fillStyle(0xffd9a0, 1);
  g.fillCircle(cx, cy - 5, 3);

  // Eyes — bright gold pinpricks.
  g.fillStyle(0xff9628, 1);
  g.fillCircle(cx - 1, cy - 5, 0.6);
  g.fillCircle(cx + 1, cy - 5, 0.6);

  // Tiny pipe in hand — gold with pale tip.
  g.fillStyle(0xb4955a, 1);
  g.fillRect(cx + 3, cy - 2, 6, 1);
  g.fillStyle(0xffe49a, 1);
  g.fillRect(cx + 8, cy - 2, 1, 1);

  // Wings — iridescent, fanned out.
  g.fillStyle(0xffe49a, 0.6);
  g.fillEllipse(cx - 6, cy - 2, 6, 10);
  g.fillEllipse(cx + 6, cy - 2, 6, 10);
  // Wing highlights.
  g.fillStyle(0xffffff, 0.5);
  g.fillEllipse(cx - 6, cy - 3, 3, 5);
  g.fillEllipse(cx + 6, cy - 3, 3, 5);

  // Sparkle trail — three dots of different sizes.
  g.fillStyle(0xfff0c0, 0.9);
  g.fillCircle(cx - 10, cy + 5, 1);
  g.fillStyle(0xfff0c0, 0.6);
  g.fillCircle(cx - 13, cy + 2, 0.7);
  g.fillStyle(0xfff0c0, 0.35);
  g.fillCircle(cx - 15, cy + 6, 0.5);

  g.generateTexture('seelie_piper', s, s);
  g.destroy();
}

/**
 * Unseelie Fiddler — DESIGN_IDEAS section 3 Faerie #2. "Dark-court"
 * pair-mate. Orbits like seelie_piper but in violet-black palette
 * with cold-blue eye-glow; plays a small fiddle instead of pipes.
 */
