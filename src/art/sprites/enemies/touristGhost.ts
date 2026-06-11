import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const TOURIST_GHOST_CANVAS_SIZE = 28;

export function drawTouristGhostBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const cx = TOURIST_GHOST_CANVAS_SIZE / 2 + (frame.bodyX ?? 0);
  const cy = TOURIST_GHOST_CANVAS_SIZE / 2 - 1 + (frame.breathY ?? 0);

  // Rounded body — pale blue translucent ghost (body centre at cx, cy)
  g.fillStyle(0xa8c8f0, 0.75);
  g.fillEllipse(cx, cy, 17, 19.5);
  // Wispy hem
  g.fillStyle(0xa8c8f0, 0.35);
  g.fillEllipse(cx, cy + 9, 12, 8.3);
  // Eye spots
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 3.2, cy - 1, 2.5);
  g.fillCircle(cx + 3.2, cy - 1, 2.5);
  // Accessory — tiny floating camera
  g.fillStyle(0x7090b8, 0.7);
  g.fillRect(cx + 2.4, cy - 5.2, 5, 4);
  g.fillCircle(cx + 5.4, cy - 3.2, 1.5);
}

export function bakeTouristGhost(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawTouristGhostBody(g);
  g.generateTexture('enemy_tourist_ghost', TOURIST_GHOST_CANVAS_SIZE, TOURIST_GHOST_CANVAS_SIZE);
  g.destroy();
}
