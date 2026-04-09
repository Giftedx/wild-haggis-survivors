import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';

/**
 * EdgeIndicators — small arrows at screen edges showing direction
 * of off-screen enemies. Only shows indicators for enemies within
 * a certain range, and caps the total number to avoid clutter.
 */
export class EdgeIndicators {
  private scene: Phaser.Scene;
  private indicators: Phaser.GameObjects.Triangle[] = [];
  private readonly MAX_INDICATORS = 12;
  private readonly MARGIN = 20;
  private readonly INDICATOR_SIZE = 8;
  private readonly DETECT_RANGE = 500; // Only show indicators for enemies this close

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Pre-create indicator triangles
    for (let i = 0; i < this.MAX_INDICATORS; i++) {
      const tri = scene.add.triangle(0, 0, 0, -this.INDICATOR_SIZE,
        -this.INDICATOR_SIZE / 2, this.INDICATOR_SIZE / 2,
        this.INDICATOR_SIZE / 2, this.INDICATOR_SIZE / 2,
        0xff4444, 0.7
      ).setScrollFactor(0).setDepth(40).setVisible(false);
      this.indicators.push(tri);
    }
  }

  update(
    playerX: number, playerY: number,
    enemyGroup: Phaser.GameObjects.Group
  ): void {
    const cam = this.scene.cameras.main;
    const viewW = cam.width / cam.zoom;
    const viewH = cam.height / cam.zoom;
    const halfW = viewW / 2;
    const halfH = viewH / 2;
    const screenW = cam.width;
    const screenH = cam.height;

    // Find off-screen enemies sorted by distance
    const offScreen: { x: number; y: number; dist: number }[] = [];
    const enemies = enemyGroup.getChildren() as Enemy[];

    // Use actual camera viewport for off-screen check (handles camera clamping at world edges)
    const camLeft = cam.scrollX;
    const camRight = cam.scrollX + viewW;
    const camTop = cam.scrollY;
    const camBottom = cam.scrollY + viewH;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      // Is it on-screen? Use camera viewport, not player-relative position
      if (enemy.x >= camLeft && enemy.x <= camRight &&
          enemy.y >= camTop && enemy.y <= camBottom) continue;

      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= this.DETECT_RANGE) {
        offScreen.push({ x: dx, y: dy, dist });
      }
    }

    // Sort by distance and take closest
    offScreen.sort((a, b) => a.dist - b.dist);
    const toShow = offScreen.slice(0, this.MAX_INDICATORS);

    // Update indicator positions
    for (let i = 0; i < this.MAX_INDICATORS; i++) {
      const indicator = this.indicators[i];

      if (i >= toShow.length) {
        indicator.setVisible(false);
        continue;
      }

      const e = toShow[i];
      const angle = Math.atan2(e.y, e.x);

      // Project onto screen edge
      const margin = this.MARGIN;
      let sx: number, sy: number;

      // Find intersection with screen rectangle
      const halfSW = screenW / 2 - margin;
      const halfSH = screenH / 2 - margin;

      // Check right/left edge
      if (Math.abs(Math.cos(angle)) > 0.001) {
        const edgeX = Math.sign(Math.cos(angle)) * halfSW;
        const edgeY = edgeX * Math.tan(angle);
        if (Math.abs(edgeY) <= halfSH) {
          sx = screenW / 2 + edgeX;
          sy = screenH / 2 + edgeY;
        } else {
          // Top/bottom edge
          const edgeY2 = Math.sign(Math.sin(angle)) * halfSH;
          sx = screenW / 2 + edgeY2 / Math.tan(angle);
          sy = screenH / 2 + edgeY2;
        }
      } else {
        sx = screenW / 2;
        sy = Math.sin(angle) > 0 ? screenH - margin : margin;
      }

      indicator.setPosition(sx, sy);
      indicator.setRotation(angle + Math.PI / 2);
      indicator.setVisible(true);

      // Color based on proximity — closer = more red
      const t = 1 - (e.dist / this.DETECT_RANGE);
      const alpha = 0.3 + t * 0.5;
      indicator.setAlpha(alpha);
    }
  }

  destroy(): void {
    for (const ind of this.indicators) ind.destroy();
    this.indicators = [];
  }
}
