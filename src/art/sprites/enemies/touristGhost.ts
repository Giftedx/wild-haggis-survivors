export function bakeTouristGhost(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const w = 20, h = 26;

  // Rounded body — pale blue translucent ghost
  g.fillStyle(0xa8c8f0, 0.75);
  g.fillEllipse(w / 2, h * 0.42, w * 0.85, h * 0.75);
  // Wispy hem
  g.fillStyle(0xa8c8f0, 0.35);
  g.fillEllipse(w / 2, h * 0.78, w * 0.6, h * 0.32);
  // Eye spots
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(w * 0.34, h * 0.38, 2.5);
  g.fillCircle(w * 0.66, h * 0.38, 2.5);
  // Accessory — tiny floating camera shape
  g.fillStyle(0x7090b8, 0.7);
  g.fillRect(w * 0.62, h * 0.22, 5, 4);
  g.fillCircle(w * 0.645 + 2.5, h * 0.22 + 2, 1.5);

  g.generateTexture('enemy_tourist_ghost', w, h);
  g.destroy();
}
