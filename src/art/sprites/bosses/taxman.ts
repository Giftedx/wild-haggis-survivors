/**
 * `boss_taxman` — final boss: pinstripe suit, briefcase, stamp of doom, gaunt clerical face. Inevitable end-state of any Scottish boss ladder.
 */

import Phaser from 'phaser';

export function bakeBossTaxman(scene: Phaser.Scene): void {
  const s = 80;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // === Pinstripe cloak (death meets the civil service) ===
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx, cy + 2, 32);
  g.fillStyle(0x0a0a0a, 1);
  g.fillCircle(cx, cy + 2, 30);
  g.fillStyle(0x141414, 1);
  g.fillCircle(cx, cy, 26);
  // Pinstripes (subtle gray on black — bespoke reaper)
  g.fillStyle(0x222222, 0.6);
  g.fillRect(cx - 18, cy - 6, 1, 36);
  g.fillRect(cx - 12, cy - 6, 1, 36);
  g.fillRect(cx - 6, cy - 6, 1, 36);
  g.fillRect(cx, cy - 6, 1, 36);
  g.fillRect(cx + 6, cy - 6, 1, 36);
  g.fillRect(cx + 12, cy - 6, 1, 36);
  g.fillRect(cx + 18, cy - 6, 1, 36);
  // Cloak folds (deeper black)
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 14, cy + 2, 2, 28);
  g.fillRect(cx - 4, cy + 2, 2, 28);
  g.fillRect(cx + 8, cy + 2, 2, 28);
  g.fillRect(cx + 18, cy + 2, 2, 28);

  // === Necktie (visible at collar — death is DRESSED for work) ===
  g.fillStyle(0x881111, 1);
  g.fillTriangle(cx - 2, cy - 6, cx + 2, cy - 6, cx, cy + 4);
  g.fillStyle(0xaa2222, 1);
  g.fillTriangle(cx - 1, cy - 5, cx + 1, cy - 5, cx, cy + 2);

  // === Hood (iconic — deep, dark) ===
  g.fillStyle(0x000000, 1);
  g.fillTriangle(cx - 18, cy - 6, cx, cy - 34, cx + 18, cy - 6);
  g.fillStyle(0x080808, 1);
  g.fillTriangle(cx - 16, cy - 6, cx, cy - 30, cx + 16, cy - 6);
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx, cy - 10, 20, 16);

  // === Skull face ===
  g.fillStyle(0x777766, 1);
  g.fillCircle(cx, cy - 6, 13);
  g.fillStyle(0xddddcc, 1);
  g.fillCircle(cx, cy - 6, 12);
  // Cheekbone definition
  g.fillStyle(0xccccbb, 1);
  g.fillCircle(cx - 6, cy - 4, 3);
  g.fillCircle(cx + 6, cy - 4, 3);

  // === Thin wire-rimmed spectacles (the civil servant look — perched on bone) ===
  g.lineStyle(0.8, 0x888888, 1); // thin wire — not thick frames
  g.strokeCircle(cx - 5, cy - 8, 3.5);
  g.strokeCircle(cx + 5, cy - 8, 3.5);
  // Bridge (thin wire connecting the lenses)
  g.lineStyle(0.6, 0x888888, 1);
  g.lineBetween(cx - 2, cy - 8, cx + 2, cy - 8);
  // Temple arms (thin, going behind where ears would be)
  g.lineBetween(cx - 8, cy - 8, cx - 12, cy - 6);
  g.lineBetween(cx + 8, cy - 8, cx + 12, cy - 6);
  // Wire glint (catches the light — sinister)
  g.fillStyle(0xcccccc, 0.4);
  g.fillCircle(cx - 7, cy - 9, 0.5);
  g.fillCircle(cx + 7, cy - 9, 0.5);

  // Glowing red eyes behind the spectacles (HMRC sees ALL)
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 5, cy - 8, 3);
  g.fillCircle(cx + 5, cy - 8, 3);
  g.fillStyle(0xff0000, 1);
  g.fillCircle(cx - 5, cy - 8, 2);
  g.fillCircle(cx + 5, cy - 8, 2);
  g.fillStyle(0xff6644, 1);
  g.fillCircle(cx - 5, cy - 8, 1);
  g.fillCircle(cx + 5, cy - 8, 1);
  // Red glow leaking through lenses
  g.fillStyle(0xff2200, 0.3);
  g.fillCircle(cx - 5, cy - 8, 4);
  g.fillCircle(cx + 5, cy - 8, 4);

  // Nose cavity
  g.fillStyle(0x000000, 1);
  g.fillTriangle(cx - 1, cy - 3, cx + 1, cy - 3, cx, cy + 1);
  // Jagged skull teeth (grinning — they've found a discrepancy)
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 6, cy + 2, 12, 4);
  g.fillStyle(0xddddcc, 1);
  g.fillRect(cx - 5, cy + 2, 1, 3);
  g.fillRect(cx - 3, cy + 2, 1, 4);
  g.fillRect(cx - 1, cy + 2, 1, 3);
  g.fillRect(cx + 1, cy + 2, 1, 4);
  g.fillRect(cx + 3, cy + 2, 1, 3);

  // === SCYTHE (the weapon that signs your P45) ===
  // Handle
  g.fillStyle(0x1a0a00, 1);
  g.fillRect(cx + 24, cy - 28, 3, 56);
  g.fillStyle(0x331a00, 1);
  g.fillRect(cx + 25, cy - 27, 1, 54);
  // Scythe blade
  g.fillStyle(0x444444, 1);
  g.fillTriangle(cx + 10, cy - 32, cx + 26, cy - 28, cx + 26, cy - 18);
  g.fillStyle(0xbbbbbb, 1);
  g.fillTriangle(cx + 12, cy - 30, cx + 25, cy - 27, cx + 25, cy - 20);
  g.fillStyle(0xeeeeee, 0.7);
  g.fillTriangle(cx + 12, cy - 30, cx + 23, cy - 28, cx + 13, cy - 28);

  // === Calculator hanging from scythe handle (the real weapon) ===
  g.fillStyle(0x222222, 1);
  g.fillRect(cx + 20, cy + 10, 6, 8);
  g.fillStyle(0x333333, 1);
  g.fillRect(cx + 21, cy + 11, 4, 6);
  // Screen (showing a big number — your tax bill)
  g.fillStyle(0x88ff88, 0.8);
  g.fillRect(cx + 21, cy + 11, 4, 2);
  // Buttons
  g.fillStyle(0x888888, 0.8);
  g.fillRect(cx + 21, cy + 14, 1, 1);
  g.fillRect(cx + 23, cy + 14, 1, 1);
  g.fillRect(cx + 21, cy + 16, 1, 1);
  g.fillRect(cx + 23, cy + 16, 1, 1);
  // String attaching to handle
  g.lineStyle(0.8, 0x444444, 0.7);
  g.lineBetween(cx + 23, cy + 10, cx + 25, cy + 8);

  g.generateTexture('boss_taxman', s, s);
  g.destroy();
}
