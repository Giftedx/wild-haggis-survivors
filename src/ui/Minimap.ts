import Phaser from 'phaser';
import { GAME, COLORS } from '../config';
import { Enemy } from '../entities/Enemy';

/**
 * Minimap — small corner radar showing player position, enemy clusters,
 * boss markers, and world bounds. Helps spatial awareness.
 */
export class Minimap {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private bg: Phaser.GameObjects.Rectangle;
  private readonly SIZE = 90;
  private readonly MARGIN = 10;
  private readonly DEPTH = 48; // just below HUD

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const x = width - this.MARGIN - this.SIZE / 2;
    const y = height - this.MARGIN - this.SIZE / 2 - 12; // above XP bar

    // Background
    this.bg = scene.add.rectangle(x, y, this.SIZE, this.SIZE, 0x000000, 0.4)
      .setStrokeStyle(1, 0x444444)
      .setScrollFactor(0)
      .setDepth(this.DEPTH);

    // Graphics layer for dots
    this.gfx = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(this.DEPTH + 1);
  }

  update(playerX: number, playerY: number, enemyGroup: Phaser.GameObjects.Group): void {
    this.gfx.clear();

    const { width, height } = this.scene.scale;
    const mapX = width - this.MARGIN - this.SIZE;
    const mapY = height - this.MARGIN - this.SIZE - 12;
    const scaleX = this.SIZE / GAME.WORLD_WIDTH;
    const scaleY = this.SIZE / GAME.WORLD_HEIGHT;

    // Enemy dots (sample every 4th for performance)
    const enemies = enemyGroup.getChildren() as Enemy[];
    for (let i = 0; i < enemies.length; i += 4) {
      const e = enemies[i];
      if (!e.active) continue;
      const dx = mapX + e.x * scaleX;
      const dy = mapY + e.y * scaleY;

      if (e.isBoss()) {
        // Boss: larger red diamond
        this.gfx.fillStyle(0xff4444, 1);
        this.gfx.fillRect(dx - 2, dy - 2, 4, 4);
      } else if (e.isElite()) {
        // Elite: gold dot
        this.gfx.fillStyle(0xffdd44, 0.9);
        this.gfx.fillCircle(dx, dy, 1.5);
      } else {
        // Regular: dim red dot
        this.gfx.fillStyle(0xcc4444, 0.5);
        this.gfx.fillCircle(dx, dy, 1);
      }
    }

    // Player: bright green dot
    const px = mapX + playerX * scaleX;
    const py = mapY + playerY * scaleY;
    this.gfx.fillStyle(0x44ff44, 1);
    this.gfx.fillCircle(px, py, 2.5);

    // Camera viewport outline
    const cam = this.scene.cameras.main;
    const viewW = (cam.width / cam.zoom) * scaleX;
    const viewH = (cam.height / cam.zoom) * scaleY;
    const camLeft = mapX + cam.scrollX * scaleX;
    const camTop = mapY + cam.scrollY * scaleY;
    this.gfx.lineStyle(1, 0xffffff, 0.25);
    this.gfx.strokeRect(camLeft, camTop, viewW, viewH);
  }

  destroy(): void {
    this.bg.destroy();
    this.gfx.destroy();
  }
}
