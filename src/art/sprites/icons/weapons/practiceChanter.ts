import * as Phaser from 'phaser';

/**
 * `wicon_practice_chanter` — melody pipe icon.
 * A practice chanter: a thin tube with finger holes and a reed at the top.
 * Reads as "pipe instrument" at 32px — distinct from the full bagpipes icon.
 */
export function drawPracticeChanterIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Pipe body — diagonal dark pipe, angled bottom-left to top-right.
  // Shadow outline first, then warm bone-ivory body.
  g.lineStyle(6, 0x1a1208, 1);
  g.beginPath();
  g.moveTo(8, 27);
  g.lineTo(24, 6);
  g.strokePath();

  g.lineStyle(4, 0xd4c090, 1);
  g.beginPath();
  g.moveTo(8, 27);
  g.lineTo(24, 6);
  g.strokePath();

  // Highlight stripe along the pipe body.
  g.lineStyle(1.2, 0xf8eed8, 0.75);
  g.beginPath();
  g.moveTo(7, 26);
  g.lineTo(23, 5);
  g.strokePath();

  // Reed / mouthpiece at top — small dark nub that reads as the reed cap.
  g.fillStyle(0x1a1208, 1);
  g.fillEllipse(24, 5, 7, 5);
  g.fillStyle(0x7a5030, 1);
  g.fillEllipse(24, 5, 5, 3.5);
  g.fillStyle(0xb08050, 0.8);
  g.fillEllipse(23.5, 4.5, 2.5, 1.5);

  // Finger holes — five small dark circles along the body.
  const holes = [
    { x: 20, y: 10 },
    { x: 18, y: 13 },
    { x: 16, y: 16 },
    { x: 14, y: 19 },
    { x: 12, y: 22 },
  ];
  for (const h of holes) {
    g.fillStyle(0x1a1208, 1);
    g.fillCircle(h.x, h.y, 1.8);
  }

  // Bell/foot — slightly wider end at the bottom.
  g.fillStyle(0x1a1208, 1);
  g.fillEllipse(8, 27, 8, 5);
  g.fillStyle(0xc8b878, 1);
  g.fillEllipse(8, 27, 6, 3.5);

  g.generateTexture('wicon_practice_chanter', s, s);
  g.destroy();
}
