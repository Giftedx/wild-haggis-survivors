import * as Phaser from 'phaser';

/**
 * `wicon_waulking_mallet` — rhythm-coupled aura weapon icon.
 * Broad oak mallet + golden beat rings. The mallet head is deliberately
 * chunky so it reads at 32px, while the two note-rings communicate the
 * "hit with the song" mechanic without implying an evolution.
 */
export function drawWaulkingMalletIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2;

  // Beat rings behind the tool — soft, non-flashy amber pulses.
  g.lineStyle(2.4, 0xd6a650, 0.42);
  g.strokeCircle(cx, cy, 13);
  g.lineStyle(1.4, 0xffe0a0, 0.62);
  g.strokeCircle(cx, cy, 9);

  // Handle shadow + core, angled down-left to up-right.
  g.lineStyle(5, 0x221408, 1);
  g.beginPath();
  g.moveTo(8, 25);
  g.lineTo(21, 10);
  g.strokePath();
  g.lineStyle(3, 0x7a4f22, 1);
  g.beginPath();
  g.moveTo(8, 25);
  g.lineTo(21, 10);
  g.strokePath();
  g.lineStyle(1, 0xe4b86a, 0.8);
  g.beginPath();
  g.moveTo(10, 23);
  g.lineTo(22, 9);
  g.strokePath();

  // Mallet head — dark outline then warm oak body. Slightly offset
  // blocks imply the diagonal angle without relying on canvas transforms.
  g.fillStyle(0x1a1008, 1);
  g.fillRoundedRect(15, 5, 16, 11, 3);
  g.fillStyle(0x8a6630, 1);
  g.fillRoundedRect(16, 6, 14, 9, 2.5);
  g.fillStyle(0xc89a52, 1);
  g.fillRect(18, 7, 10, 1.4);
  g.fillStyle(0x5f3e1d, 1);
  g.fillRect(17, 12, 12, 1.2);

  // Two tiny waulking-song notes.
  drawTinyNote(g, 8, 9);
  drawTinyNote(g, 25, 21);

  g.generateTexture('wicon_waulking_mallet', s, s);
  g.destroy();
}

function drawTinyNote(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(0xffe0a0, 1);
  g.fillEllipse(x, y + 4, 4, 3);
  g.fillRect(x + 1.5, y - 4, 1.5, 8);
  g.fillTriangle(x + 3, y - 4, x + 7, y - 2, x + 3, y);
}
