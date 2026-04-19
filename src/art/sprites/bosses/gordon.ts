import Phaser from 'phaser';

export function bakeBossGordon(scene: Phaser.Scene): void {
  const s = 80;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // === Body (chef whites, splattered, IMPOSING) ===
  g.fillStyle(0x777777, 1);
  g.fillCircle(cx, cy, 32);
  g.fillStyle(0xddddcc, 1);
  g.fillCircle(cx, cy, 30);
  g.fillStyle(0xeeeedd, 1);
  g.fillCircle(cx - 3, cy - 3, 24);
  // Grease stains on whites
  g.fillStyle(0xccbb88, 0.4);
  g.fillCircle(cx - 10, cy + 8, 3);
  g.fillCircle(cx + 8, cy + 12, 2.5);
  g.fillCircle(cx - 4, cy + 14, 2);
  // Double-breasted buttons
  g.fillStyle(0x222222, 1);
  g.fillCircle(cx - 5, cy + 4, 1.8);
  g.fillCircle(cx - 5, cy + 10, 1.8);
  g.fillCircle(cx + 5, cy + 4, 1.8);
  g.fillCircle(cx + 5, cy + 10, 1.8);

  // === Face (PURPLE with rage — this man has ascended beyond anger) ===
  g.fillStyle(0x883355, 1);
  g.fillCircle(cx, cy - 6, 14);
  g.fillStyle(0xcc6688, 1); // purple-red rage face
  g.fillCircle(cx, cy - 6, 13);
  // Flushed to absolute beetroot
  g.fillStyle(0xdd5566, 0.4);
  g.fillCircle(cx, cy - 5, 10);
  // FOREHEAD FURROWS — THE Ramsay signature (3-4 deep horizontal lines)
  g.lineStyle(1.2, 0x994466, 0.8);
  g.lineBetween(cx - 8, cy - 18, cx + 8, cy - 18);
  g.lineBetween(cx - 9, cy - 16, cx + 9, cy - 16);
  g.lineBetween(cx - 8, cy - 14, cx + 8, cy - 14);
  g.lineStyle(0.8, 0x884455, 0.5);
  g.lineBetween(cx - 7, cy - 17, cx + 7, cy - 17);
  // Forehead veins too (visible through the furrows)
  g.lineStyle(0.8, 0xaa3344, 0.5);
  g.lineBetween(cx - 5, cy - 19, cx - 7, cy - 16);
  g.lineBetween(cx + 4, cy - 19, cx + 6, cy - 16);

  // Furious eyebrows (THICKER, MORE ANGRY)
  g.fillStyle(0x331100, 1);
  g.fillTriangle(cx - 12, cy - 14, cx - 2, cy - 11, cx - 2, cy - 15);
  g.fillTriangle(cx + 12, cy - 14, cx + 2, cy - 11, cx + 2, cy - 15);
  // Bloodshot eyes
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 6, cy - 9, 3.5);
  g.fillCircle(cx + 6, cy - 9, 3.5);
  // Bloodshot veins in eyes
  g.lineStyle(0.5, 0xff4444, 0.6);
  g.lineBetween(cx - 8, cy - 10, cx - 6, cy - 9);
  g.lineBetween(cx + 8, cy - 10, cx + 6, cy - 9);
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 6, cy - 9, 2);
  g.fillCircle(cx + 6, cy - 9, 2);
  // Rage-dilated pupils
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 6, cy - 9, 1);
  g.fillCircle(cx + 6, cy - 9, 1);

  // MASSIVE open yelling mouth (IT'S RAAAAW)
  g.fillStyle(0x111111, 1);
  g.fillEllipse(cx, cy - 1, 12, 8);
  g.fillStyle(0xcc1111, 1);
  g.fillEllipse(cx, cy, 10, 6);
  // Teeth (top and bottom)
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 4, cy - 3, 2, 2);
  g.fillRect(cx, cy - 3, 2, 2);
  g.fillRect(cx - 3, cy + 2, 2, 2);
  g.fillRect(cx + 1, cy + 2, 2, 2);
  // Uvula
  g.fillStyle(0xff6666, 1);
  g.fillCircle(cx, cy + 1, 1);

  // === GIANT chef hat (askew from screaming) ===
  g.fillStyle(0xbbbbbb, 1);
  g.fillRect(cx - 13, cy - 28, 28, 6);
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(cx - 12, cy - 27, 26, 5);
  // Puffy top (tilted slightly — he's been screaming so hard his hat shifted).
  // Center puff y=-35 (was -36 — radius-9 circle there clipped at y=-1).
  g.fillStyle(0xbbbbbb, 1);
  g.fillCircle(cx - 9, cy - 33, 8);
  g.fillCircle(cx + 1, cy - 35, 9);
  g.fillCircle(cx + 11, cy - 34, 8);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx - 9, cy - 33, 7);
  g.fillCircle(cx + 1, cy - 35, 8);
  g.fillCircle(cx + 11, cy - 34, 7);

  // === Cleaver in right hand ===
  g.fillStyle(0x221100, 1);
  g.fillRect(cx + 24, cy + 6, 4, 10);
  g.fillStyle(0x888888, 1);
  g.fillRect(cx + 21, cy - 6, 10, 14);
  g.fillStyle(0xdddddd, 1);
  g.fillRect(cx + 22, cy - 5, 8, 12);
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(cx + 23, cy - 4, 2, 10);

  // === Battered fish in left hand (chippy meets fine dining) ===
  g.fillStyle(0xaa7711, 1);
  g.fillEllipse(cx - 26, cy + 4, 10, 16);
  g.fillStyle(0xcc9922, 1);
  g.fillEllipse(cx - 26, cy + 4, 8, 14);
  // Batter texture
  g.fillStyle(0xddaa33, 0.6);
  g.fillCircle(cx - 27, cy + 1, 1);
  g.fillCircle(cx - 25, cy + 6, 1);

  g.generateTexture('boss_gordon', s, s);
  g.destroy();
}

