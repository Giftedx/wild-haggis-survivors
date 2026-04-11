import Phaser from 'phaser';
import { GAME } from '../config';
import { Enemy } from '../entities/Enemy';
import { getCameraViewport } from './cameraViewport';

/**
 * Minimap — small corner radar showing player position, enemy clusters,
 * boss markers, and world bounds. Helps spatial awareness.
 */
export class Minimap {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private bg: Phaser.GameObjects.Rectangle;
  private readonly SIZE = 110;
  private readonly MARGIN = 12;
  private readonly DEPTH = 48; // just below HUD

  private getUiViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    const { x, y, width, height, zoom } = getCameraViewport(this.scene);
    return { x, y, width, height, zoom };
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { x: left, y: top, width, height } = this.getUiViewport();
    const x = Math.max(left + this.SIZE / 2, Math.min(left + width - this.SIZE / 2, left + width - this.MARGIN - this.SIZE / 2));
    const y = Math.max(top + this.SIZE / 2, Math.min(top + height - this.SIZE / 2, top + height - this.MARGIN - this.SIZE / 2));

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

  update(
    playerX: number,
    playerY: number,
    enemyGroup: Phaser.GameObjects.Group,
    chestMarkers: Array<{ x: number; y: number; golden?: boolean }> = []
  ): void {
    this.gfx.clear();

    const { x: left, y: top, width, height } = this.getUiViewport();
    const mapX = Math.max(left, Math.min(left + width - this.SIZE, left + width - this.MARGIN - this.SIZE));
    const mapY = Math.max(top, Math.min(top + height - this.SIZE, top + height - this.MARGIN - this.SIZE));
    this.bg.setPosition(mapX + this.SIZE / 2, mapY + this.SIZE / 2);
    const scaleX = this.SIZE / GAME.WORLD_WIDTH;
    const scaleY = this.SIZE / GAME.WORLD_HEIGHT;

    // Enemy dots (sample every 4th for performance)
    const enemies = enemyGroup.getChildren() as Enemy[];
    for (let i = 0; i < enemies.length; i += 4) {
      const e = enemies[i];
      if (!e.active) continue;
      // Clamp to minimap bounds so dots don't bleed outside the background rect
      const dx = Phaser.Math.Clamp(mapX + e.x * scaleX, mapX, mapX + this.SIZE);
      const dy = Phaser.Math.Clamp(mapY + e.y * scaleY, mapY, mapY + this.SIZE);

      if (e.isBoss()) {
        // Boss: red diamond shape
        this.gfx.fillStyle(0xff4444, 1);
        this.gfx.fillTriangle(dx, dy - 3, dx + 3, dy, dx, dy + 3);
        this.gfx.fillTriangle(dx, dy - 3, dx - 3, dy, dx, dy + 3);
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

    // Chest markers: subtle squares (gold for golden chests)
    for (const chest of chestMarkers) {
      const cx = Phaser.Math.Clamp(mapX + chest.x * scaleX, mapX, mapX + this.SIZE);
      const cy = Phaser.Math.Clamp(mapY + chest.y * scaleY, mapY, mapY + this.SIZE);
      this.gfx.fillStyle(0x000000, 0.9);
      this.gfx.fillRect(cx - 2.5, cy - 2.5, 5, 5);
      this.gfx.fillStyle(chest.golden ? 0xffcc44 : 0x66ccff, 1);
      this.gfx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
    }

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
