import * as Phaser from 'phaser';

/**
 * `wicon_steam_engine` — Steam Engine weapon icon.
 * A Victorian boiler drum with a pressure gauge, riveted bands, and
 * a burst of steam venting from the release valve. Reads as
 * "industrial/pressure" at 32px.
 */
export function drawSteamEngineIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Boiler drum body — horizontal cylinder, pewter-grey.
  g.fillStyle(0x2a2a2a, 1);
  g.fillRoundedRect(3, 11, 22, 12, 4);
  g.fillStyle(0x5a5a5a, 1);
  g.fillRoundedRect(4, 12, 20, 10, 3);
  // Highlight top edge.
  g.fillStyle(0x8a8a8a, 0.5);
  g.fillRect(6, 12, 16, 2);

  // Rivet bands — two vertical copper-rivet lines.
  g.lineStyle(1, 0xb87820, 0.9);
  g.lineBetween(10, 11, 10, 23);
  g.lineBetween(17, 11, 17, 23);
  // Small rivet dots on the bands.
  g.fillStyle(0xd4901c, 1);
  g.fillCircle(10, 13, 1.2);
  g.fillCircle(10, 21, 1.2);
  g.fillCircle(17, 13, 1.2);
  g.fillCircle(17, 21, 1.2);

  // End cap — dark circle on the right side.
  g.fillStyle(0x3a3a3a, 1);
  g.fillCircle(25, 17, 5);
  g.fillStyle(0x6a6a6a, 1);
  g.fillCircle(25, 17, 3.5);
  // Centre bolt.
  g.fillStyle(0xb87820, 1);
  g.fillCircle(25, 17, 1.2);

  // Pressure valve on top — small nozzle + stem.
  g.fillStyle(0x4a4a4a, 1);
  g.fillRect(12, 7, 4, 5);
  g.fillStyle(0x7a7a7a, 1);
  g.fillRect(13, 8, 2, 4);
  // Valve cap.
  g.fillStyle(0xb87820, 1);
  g.fillRoundedRect(11, 6, 6, 3, 1.5);

  // Steam burst — three short white-grey streaks radiating up-right.
  g.lineStyle(1.5, 0xd0d0d0, 0.70);
  g.lineBetween(14, 6, 12, 2);
  g.lineStyle(1.2, 0xd8d8d8, 0.50);
  g.lineBetween(15, 5, 18, 2);
  g.lineStyle(1.0, 0xc0c0c0, 0.40);
  g.lineBetween(13, 5, 9, 1);

  g.generateTexture('wicon_steam_engine', s, s);
  g.destroy();
}
