/**
 * Moor Road node marker sprites. These appear in-world at generated
 * node positions so the path has a diegetic read beyond the HUD widget.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 44, 44);
  g.destroy();
}

function base(g: Phaser.GameObjects.Graphics, colour: number): void {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(22, 37, 28, 7);
  g.fillStyle(colour, 0.18);
  g.fillCircle(22, 22, 20);
  g.lineStyle(1.4, colour, 0.55);
  g.strokeCircle(22, 22, 17);
  g.fillStyle(0x0a0704, 1);
  g.fillCircle(22, 22, 12);
  g.fillStyle(colour, 1);
  g.fillCircle(22, 22, 10);
}

function standingStone(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, colour: number): void {
  g.fillStyle(0x080806, 1);
  g.fillRoundedRect(x - w / 2, y - h, w, h, 2);
  g.fillStyle(colour, 1);
  g.fillRoundedRect(x - w / 2 + 1, y - h + 1, w - 2, h - 2, 2);
  g.fillStyle(0xd8d0a0, 0.35);
  g.fillRect(x - w / 2 + 2, y - h + 2, 1.5, h - 4);
}

export function bakeNodeMarkers(scene: Phaser.Scene): void {
  bake(scene, 'node_marker_encounter', (g) => {
    base(g, 0xd56a3a);
    g.fillStyle(0xffd078, 1);
    g.fillTriangle(22, 10, 12, 28, 32, 28);
    g.fillStyle(0x5a1a10, 1);
    g.fillTriangle(22, 16, 17, 26, 27, 26);
  });

  bake(scene, 'node_marker_elite', (g) => {
    base(g, 0xe0b84a);
    g.fillStyle(0xffef8a, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillTriangle(
        22 + Math.cos(a) * 4,
        22 + Math.sin(a) * 4,
        22 + Math.cos(a - 0.18) * 13,
        22 + Math.sin(a - 0.18) * 13,
        22 + Math.cos(a + 0.18) * 13,
        22 + Math.sin(a + 0.18) * 13,
      );
    }
    g.fillStyle(0x3a2008, 1);
    g.fillCircle(22, 22, 5);
  });

  bake(scene, 'node_marker_rest', (g) => {
    base(g, 0x7bb06a);
    g.fillStyle(0x2d5a28, 1);
    g.fillRect(20, 14, 4, 16);
    g.fillStyle(0xb8e090, 1);
    g.fillEllipse(18, 17, 11, 7);
    g.fillEllipse(26, 18, 11, 7);
    g.fillEllipse(22, 13, 9, 6);
  });

  bake(scene, 'node_marker_hidden', (g) => {
    base(g, 0x8aa0b8);
    g.fillStyle(0xd8e8ef, 0.95);
    g.fillCircle(22, 22, 7);
    g.fillStyle(0x314050, 1);
    g.fillEllipse(22, 22, 9, 4);
    g.fillStyle(0x0a1018, 1);
    g.fillCircle(22, 22, 2.6);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(21, 21, 0.9);
  });

  bake(scene, 'node_marker_shrine', (g) => {
    base(g, 0xa887d8);
    standingStone(g, 22, 31, 13, 23, 0x746a86);
    g.fillStyle(0xdcc8ff, 1);
    g.fillCircle(22, 17, 2);
    g.lineStyle(1, 0xdcc8ff, 0.8);
    g.strokeCircle(22, 22, 5);
  });

  bake(scene, 'node_marker_trader', (g) => {
    base(g, 0xd4a860);
    g.fillStyle(0x2a1408, 1);
    g.fillRect(12, 16, 20, 14);
    g.fillStyle(0x7a3218, 1);
    g.fillRect(13, 17, 18, 12);
    g.fillStyle(0xf0d090, 1);
    g.fillRect(15, 14, 14, 5);
    g.fillStyle(0x2a1408, 1);
    g.fillRect(18, 21, 8, 8);
    g.fillStyle(0xffd760, 1);
    g.fillCircle(29, 13, 2.2);
  });

  bake(scene, 'node_marker_bargain', (g) => {
    base(g, 0xcc5870);
    g.fillStyle(0x201018, 1);
    g.fillCircle(22, 21, 9);
    g.fillStyle(0xffe080, 1);
    g.fillCircle(22, 21, 7);
    g.fillStyle(0x8a2040, 1);
    g.fillRect(18, 18, 8, 2);
    g.fillRect(20, 15, 4, 12);
    g.fillStyle(0xfff0b0, 0.85);
    g.fillCircle(20, 18, 1);
  });

  bake(scene, 'node_marker_pictish_stone', (g) => {
    base(g, 0x90a090);
    standingStone(g, 22, 33, 14, 25, 0x6a7468);
    g.lineStyle(1.2, 0xd8d0b0, 0.9);
    g.strokeCircle(22, 18, 4);
    g.beginPath();
    g.moveTo(17, 26);
    g.lineTo(27, 23);
    g.lineTo(18, 21);
    g.strokePath();
  });

  bake(scene, 'node_marker_clootie_tree', (g) => {
    base(g, 0x88a070);
    g.fillStyle(0x2a1708, 1);
    g.fillRect(20, 13, 4, 20);
    g.fillStyle(0x43602a, 1);
    g.fillEllipse(22, 15, 20, 11);
    g.fillStyle(0xf0d0d8, 1);
    g.fillRect(14, 18, 5, 3);
    g.fillStyle(0x9fd0e0, 1);
    g.fillRect(25, 17, 5, 3);
    g.fillStyle(0xd8d8c0, 1);
    g.fillRect(21, 21, 5, 3);
  });

  bake(scene, 'node_marker_fairy_ring', (g) => {
    base(g, 0xd890e0);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const x = 22 + Math.cos(a) * 9;
      const y = 22 + Math.sin(a) * 5;
      g.fillStyle(0xf8e0c0, 1);
      g.fillRect(x - 1, y, 2, 5);
      g.fillStyle(0xb84a50, 1);
      g.fillEllipse(x, y, 5, 3);
    }
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(22, 18, 1.2);
  });

  bake(scene, 'node_marker_rowan', (g) => {
    base(g, 0xa6b860);
    g.fillStyle(0x2a1608, 1);
    g.fillRect(20, 12, 4, 20);
    g.fillStyle(0x4d7528, 1);
    g.fillEllipse(18, 16, 13, 8);
    g.fillEllipse(27, 18, 12, 8);
    g.fillStyle(0xc82018, 1);
    for (const [x, y] of [[24, 19], [27, 21], [21, 20], [25, 23]]) g.fillCircle(x, y, 1.5);
  });

  bake(scene, 'node_marker_loch_votive', (g) => {
    base(g, 0x70b8d8);
    g.fillStyle(0x1a3040, 1);
    g.fillEllipse(22, 27, 22, 7);
    g.fillStyle(0x8fd0e8, 1);
    g.fillEllipse(22, 26, 18, 4);
    g.fillStyle(0xffd46a, 1);
    g.fillTriangle(22, 11, 18, 22, 26, 22);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(22, 14, 1.3);
  });
}
