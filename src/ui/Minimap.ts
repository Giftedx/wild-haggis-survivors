import Phaser from 'phaser';
import { GAME } from '../config';
import { getSettingsManager } from '../core/SettingsManager';
import { Enemy } from '../entities/Enemy';
import { getCameraViewport } from './cameraViewport';

/**
 * Minimap — small corner radar showing player position, enemy clusters,
 * boss markers, and world bounds. Helps spatial awareness.
 *
 * Phase 6 Tier B redesign:
 *  - Default size bumped 110 → 150, then scaled by uiScale.
 *  - Player marker is a rotating triangle (pointing where the haggis
 *    is moving) instead of a dot, so direction reads at a glance.
 *  - Elite and boss dots made larger and bolder.
 *  - Darker background + thicker border for contrast against bright
 *    gameplay tiles.
 *  - Red edge glow when the player is near a world boundary.
 */
export class Minimap {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private bg: Phaser.GameObjects.Rectangle;
  private readonly SIZE: number;
  private readonly MARGIN = 12;
  private readonly DEPTH = 48; // just below HUD

  private getUiViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    const { x, y, width, height, zoom } = getCameraViewport(this.scene);
    return { x, y, width, height, zoom };
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { uiScale, highContrastUi } = getSettingsManager().load();
    // 150px baseline scaled by uiScale (so a player on uiScale 1.4 gets
    // a 210px minimap, and uiScale 0.8 gets 120px).
    this.SIZE = Math.round(150 * uiScale);

    const { x: left, y: top, width, height } = this.getUiViewport();
    const x = Math.max(left + this.SIZE / 2, Math.min(left + width - this.SIZE / 2, left + width - this.MARGIN - this.SIZE / 2));
    const y = Math.max(top + this.SIZE / 2, Math.min(top + height - this.SIZE / 2, top + height - this.MARGIN - this.SIZE / 2));

    // Darker background + stronger border so the minimap stays readable
    // over bright terrain (grass, heather, lava).
    const bgAlpha = highContrastUi ? 0.7 : 0.55;
    const borderColor = highContrastUi ? 0x8fb4ff : 0x6a7390;
    this.bg = scene.add.rectangle(x, y, this.SIZE, this.SIZE, 0x000000, bgAlpha)
      .setStrokeStyle(2, borderColor, 1)
      .setScrollFactor(0)
      .setDepth(this.DEPTH);

    // Graphics layer for dots + player triangle + warning edge
    this.gfx = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(this.DEPTH + 1);
  }

  update(
    playerX: number,
    playerY: number,
    enemyGroup: Phaser.GameObjects.Group,
    chestMarkers: Array<{ x: number; y: number; golden?: boolean }> = [],
    playerRotation: number = 0
  ): void {
    this.gfx.clear();

    const { x: left, y: top, width, height } = this.getUiViewport();
    const mapX = Math.max(left, Math.min(left + width - this.SIZE, left + width - this.MARGIN - this.SIZE));
    const mapY = Math.max(top, Math.min(top + height - this.SIZE, top + height - this.MARGIN - this.SIZE));
    this.bg.setPosition(mapX + this.SIZE / 2, mapY + this.SIZE / 2);
    const scaleX = this.SIZE / GAME.WORLD_WIDTH;
    const scaleY = this.SIZE / GAME.WORLD_HEIGHT;

    // Enemy dots — render every 4th ACTIVE enemy so we don't waste
    // iterations on inactive pool entries and get spatially unbiased sampling.
    const enemies = enemyGroup.children.entries as Enemy[];
    let activeIdx = 0;
    for (let i = 0, len = enemies.length; i < len; i++) {
      const e = enemies[i];
      if (!e.active) continue;
      if ((activeIdx++ & 3) !== 0) continue; // every 4th active enemy
      // Clamp to minimap bounds so dots don't bleed outside the background rect
      const dx = Phaser.Math.Clamp(mapX + e.x * scaleX, mapX, mapX + this.SIZE);
      const dy = Phaser.Math.Clamp(mapY + e.y * scaleY, mapY, mapY + this.SIZE);

      if (e.isBoss()) {
        // Boss: larger red diamond — the player needs to find this fast.
        this.gfx.fillStyle(0xdd4444, 1);
        this.gfx.fillTriangle(dx, dy - 5, dx + 4, dy, dx, dy + 5);
        this.gfx.fillTriangle(dx, dy - 5, dx - 4, dy, dx, dy + 5);
      } else if (e.isElite()) {
        // Elite: bolder gold dot with a subtle outline ring for threat emphasis.
        this.gfx.fillStyle(0x332200, 0.6);
        this.gfx.fillCircle(dx, dy, 3);
        this.gfx.fillStyle(0xffdd44, 1);
        this.gfx.fillCircle(dx, dy, 2.2);
      } else {
        // Regular: dim red dot, slightly bigger.
        this.gfx.fillStyle(0xcc4444, 0.55);
        this.gfx.fillCircle(dx, dy, 1.4);
      }
    }

    // Player: bright green triangle pointing the way the haggis faces.
    // The player sprite in this game is oriented so that `rotation = 0`
    // means "facing right" in Phaser's convention, rotated to +PI/2 for
    // "facing down" etc. Drawing the triangle in local space first then
    // rotating around the player dot keeps it precise.
    // Clamp inside the minimap so the triangle doesn't bleed outside the
    // background rect when the player reaches the soft world boundary.
    const px = Phaser.Math.Clamp(mapX + playerX * scaleX, mapX + 4, mapX + this.SIZE - 4);
    const py = Phaser.Math.Clamp(mapY + playerY * scaleY, mapY + 4, mapY + this.SIZE - 4);
    const tri = this.triangleForRotation(px, py, 4.5, playerRotation);
    this.gfx.fillStyle(0x44dd44, 1);
    this.gfx.fillTriangle(tri.ax, tri.ay, tri.bx, tri.by, tri.cx, tri.cy);

    // Chest markers: subtle squares (gold for golden chests). Same as before.
    for (const chest of chestMarkers) {
      const cx = Phaser.Math.Clamp(mapX + chest.x * scaleX, mapX, mapX + this.SIZE);
      const cy = Phaser.Math.Clamp(mapY + chest.y * scaleY, mapY, mapY + this.SIZE);
      this.gfx.fillStyle(0x000000, 0.9);
      this.gfx.fillRect(cx - 3, cy - 3, 6, 6);
      this.gfx.fillStyle(chest.golden ? 0xffcc44 : 0x66ccff, 1);
      this.gfx.fillRect(cx - 2, cy - 2, 4, 4);
    }

    // Camera viewport outline.
    const cam = this.scene.cameras.main;
    const viewW = (cam.width / cam.zoom) * scaleX;
    const viewH = (cam.height / cam.zoom) * scaleY;
    const camLeft = mapX + cam.scrollX * scaleX;
    const camTop = mapY + cam.scrollY * scaleY;
    this.gfx.lineStyle(1, 0xffffff, 0.3);
    this.gfx.strokeRect(camLeft, camTop, viewW, viewH);

    // Warning edge — the player is near a world boundary. Draws a thin
    // red inset rectangle on the minimap telling the player "you're up
    // against the soft wall".
    const boundaryMargin = 200;
    const distToEdge = Math.min(
      playerX, playerY,
      GAME.WORLD_WIDTH - playerX,
      GAME.WORLD_HEIGHT - playerY
    );
    if (distToEdge < boundaryMargin) {
      const warnAlpha = 0.25 + 0.5 * (1 - distToEdge / boundaryMargin);
      this.gfx.lineStyle(2, 0xff4444, warnAlpha);
      this.gfx.strokeRect(mapX + 1, mapY + 1, this.SIZE - 2, this.SIZE - 2);
    }
  }

  /**
   * Compute the three vertices of an isoceles triangle rotated around
   * (cx, cy), pointing in the direction of `rotation`. Player sprite
   * rotation in the game is `atan2(vy, vx) + PI/2`, so subtract PI/2
   * to get the actual heading vector. Tip at `size`, base at -size.
   */
  private triangleForRotation(cx: number, cy: number, size: number, rotation: number):
    { ax: number; ay: number; bx: number; by: number; cx: number; cy: number }
  {
    // Convert player-sprite rotation to heading angle.
    const heading = rotation - Math.PI / 2;
    const ca = Math.cos(heading);
    const sa = Math.sin(heading);
    // Tip (forward)
    const ax = cx + ca * size;
    const ay = cy + sa * size;
    // Two base points (backward + side)
    const bx = cx + ca * -size * 0.6 + sa * size * 0.7;
    const by = cy + sa * -size * 0.6 - ca * size * 0.7;
    const cx2 = cx + ca * -size * 0.6 + sa * -size * 0.7;
    const cy2 = cy + sa * -size * 0.6 - ca * -size * 0.7;
    return { ax, ay, bx, by, cx: cx2, cy: cy2 };
  }

  destroy(): void {
    this.bg.destroy();
    this.gfx.destroy();
  }
}
