import * as Phaser from 'phaser';

/**
 * `wicon_whisky_lob` — hip flask lob icon.
 * A rounded hip flask mid-throw with a small arc trail to its upper-right.
 * Reads as "thrown bottle" at 32px — distinct from the passive ucard_whisky_flask.
 */
export function drawWhiskyLobIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Flask body — rounded oval, warm amber fill, dark outline.
  g.lineStyle(3, 0x2a1004, 1);
  g.fillStyle(0xe07010, 1);
  g.strokeEllipse(14, 20, 14, 16);
  g.fillEllipse(14, 20, 14, 16);

  // Whisky level inside flask — darker amber, lower half only.
  g.fillStyle(0xb85508, 0.75);
  g.fillEllipse(14, 23, 11, 7);

  // Shine on the flask body — small pale highlight.
  g.fillStyle(0xffe8a0, 0.65);
  g.fillEllipse(11, 16, 4, 3);

  // Neck — narrow cylinder connecting body to cork.
  g.lineStyle(2, 0x2a1004, 1);
  g.fillStyle(0xc86010, 1);
  g.fillRect(12, 11, 5, 5);
  g.strokeRect(12, 11, 5, 5);

  // Cork — dark brown oval at the top of the neck.
  g.lineStyle(1.5, 0x1a0c00, 1);
  g.fillStyle(0x6a3010, 1);
  g.fillEllipse(14.5, 10, 7, 4);
  g.strokeEllipse(14.5, 10, 7, 4);

  // Throw-arc trail — three small amber dots arcing toward upper-right,
  // suggesting the flask was just released.
  const dots = [
    { x: 20, y: 14, r: 2.0, a: 0.7 },
    { x: 24, y: 10, r: 1.5, a: 0.5 },
    { x: 27, y: 7,  r: 1.0, a: 0.3 },
  ];
  for (const d of dots) {
    g.fillStyle(0xe07010, d.a);
    g.fillCircle(d.x, d.y, d.r);
  }

  g.generateTexture('wicon_whisky_lob', s, s);
  g.destroy();
}
