import * as Phaser from 'phaser';

/**
 * `wicon_bodhran` — Bodhrán Celtic frame drum weapon icon.
 * A circular goatskin drum with a bent-willow hoop and a tipper (beater).
 * Warm amber skin, dark willow hoop, leather cross-brace on the reverse.
 * Reads as "percussion/rhythm" at 32px.
 */
export function drawBodhranIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Drum outer hoop — dark bent willow.
  g.fillStyle(0x3a2210, 1);
  g.fillCircle(14, 15, 12);

  // Goatskin drum head — warm amber tan.
  g.fillStyle(0xc8904a, 1);
  g.fillCircle(14, 15, 10);

  // Skin texture — subtle grain lines.
  g.lineStyle(0.8, 0xd4a060, 0.40);
  g.lineBetween(8, 12, 20, 12);
  g.lineBetween(7, 15, 21, 15);
  g.lineBetween(8, 18, 20, 18);

  // Centre dimple — where the tipper lands.
  g.fillStyle(0xb07838, 0.70);
  g.fillCircle(14, 15, 2.5);

  // Hoop edge highlight — light rim suggestion.
  g.lineStyle(1, 0x6a3c18, 0.80);
  g.strokeCircle(14, 15, 10.5);

  // Tipper / beater — a short leather-tipped stick, angled top-right.
  g.fillStyle(0x5a3818, 1);
  g.fillRect(22, 3, 3, 13);
  // Tipper tip — rounded leather nub.
  g.fillStyle(0x2a1a08, 1);
  g.fillCircle(23, 3, 2);

  g.generateTexture('wicon_bodhran', s, s);
  g.destroy();
}
