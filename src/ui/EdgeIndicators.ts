import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import {
  insertionSortOffScreenByDist,
  isOnCameraViewport,
  projectThreatAngleToScreenEdge,
  type OffScreenScratch,
} from './edgeIndicatorMath';
import {
  resolveEdgeIndicatorStyle,
  EDGE_INDICATOR_BOSS_COLOR,
  EDGE_INDICATOR_REGULAR_COLOR,
} from './edgeIndicatorStyle';

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
  private readonly INDICATOR_SIZE = 9;
  private readonly DETECT_RANGE = 500; // Only show indicators for enemies this close
  /** Glow halos behind each indicator for visibility against busy backgrounds. */
  private glows: Phaser.GameObjects.Arc[] = [];

  /** Pre-allocated scratch buffer — avoids per-frame array allocation. */
  private offScreenBuf: OffScreenScratch[];
  private offScreenCount = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Pre-create glow halos (behind the indicators for readability)
    for (let i = 0; i < this.MAX_INDICATORS; i++) {
      const glow = scene.add.circle(0, 0, this.INDICATOR_SIZE + 3, EDGE_INDICATOR_REGULAR_COLOR, 0.15)
        .setScrollFactor(0).setDepth(39).setVisible(false);
      this.glows.push(glow);
    }
    // Pre-create indicator triangles
    for (let i = 0; i < this.MAX_INDICATORS; i++) {
      const tri = scene.add.triangle(0, 0, 0, -this.INDICATOR_SIZE,
        -this.INDICATOR_SIZE / 2, this.INDICATOR_SIZE / 2,
        this.INDICATOR_SIZE / 2, this.INDICATOR_SIZE / 2,
        EDGE_INDICATOR_REGULAR_COLOR, 0.8
      ).setScrollFactor(0).setDepth(40).setVisible(false);
      this.indicators.push(tri);
    }

    // Pre-allocate scratch buffer
    this.offScreenBuf = Array.from({ length: 50 }, () => ({
      x: 0, y: 0, dist: 0, boss: false, elite: false, eliteDisplayTint: EDGE_INDICATOR_BOSS_COLOR,
    }));
  }

  update(
    playerX: number, playerY: number,
    enemyGroup: Phaser.GameObjects.Group
  ): void {
    const cam = this.scene.cameras.main;
    const viewW = cam.width / cam.zoom;
    const viewH = cam.height / cam.zoom;
    // `setScrollFactor(0)` objects use the zoom-corrected coordinate space.
    // Using raw cam.width/cam.height for the projection math would push
    // indicators off-screen at any camera zoom != 1 (e.g. slow-mo juice),
    // since the "screen edge" the math anchors to would be wider than the
    // actual visible viewport.
    const screenW = viewW;
    const screenH = viewH;

    // Find off-screen enemies — write into pre-allocated buffer
    this.offScreenCount = 0;
    const enemies = enemyGroup.children.entries as Enemy[];
    const detectRangeSq = this.DETECT_RANGE * this.DETECT_RANGE;

    // Use actual camera viewport for off-screen check (handles camera clamping at world edges)
    const camLeft = cam.scrollX;
    const camRight = cam.scrollX + viewW;
    const camTop = cam.scrollY;
    const camBottom = cam.scrollY + viewH;

    for (let ei = 0; ei < enemies.length; ei++) {
      const enemy = enemies[ei];
      if (!enemy.active) continue;

      // Is it on-screen? Use camera viewport, not player-relative position
      if (isOnCameraViewport(enemy.x, enemy.y, camLeft, camRight, camTop, camBottom)) continue;

      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= detectRangeSq) {
        // Grow buffer if needed (rare — only if >50 off-screen enemies in range)
        if (this.offScreenCount >= this.offScreenBuf.length) {
          this.offScreenBuf.push({ x: 0, y: 0, dist: 0, boss: false, elite: false, eliteDisplayTint: EDGE_INDICATOR_BOSS_COLOR });
        }
        const entry = this.offScreenBuf[this.offScreenCount++];
        entry.x = dx;
        entry.y = dy;
        entry.dist = Math.sqrt(distSq);
        entry.boss = enemy.isBoss();
        entry.elite = enemy.isElite();
        entry.eliteDisplayTint = enemy.isElite()
          ? (enemy.getEliteAffixIndicatorTint() ?? EDGE_INDICATOR_BOSS_COLOR)
          : EDGE_INDICATOR_BOSS_COLOR;
      }
    }

    const buf = this.offScreenBuf;
    const count = this.offScreenCount;
    insertionSortOffScreenByDist(buf, count);

    const toShowCount = Math.min(count, this.MAX_INDICATORS);

    // Update indicator positions
    for (let i = 0; i < this.MAX_INDICATORS; i++) {
      const indicator = this.indicators[i];

      if (i >= toShowCount) {
        indicator.setVisible(false);
        continue;
      }

      const e = buf[i];
      const angle = Math.atan2(e.y, e.x);
      const { sx, sy } = projectThreatAngleToScreenEdge(angle, screenW, screenH, this.MARGIN);

      indicator.setPosition(sx, sy);
      indicator.setRotation(angle + Math.PI / 2);
      indicator.setVisible(true);

      // Glow halo follows the indicator
      const glow = this.glows[i];
      glow.setPosition(sx, sy);
      glow.setVisible(true);

      // Subtle pulse on all indicators (breathes with urgency).
      // Wall-clock phase — frame-rate-independent. The old `+= 0.016` per
      // frame × 4 multiplier = 3.84 rad/sec at 60fps; 0.004 rad/ms matches.
      const pulse = 0.9 + Math.sin(this.scene.time.now * 0.004 + i) * 0.15;

      // Color based on proximity + threat type: boss/elite = gold, regular = red
      const proximity = 1 - (e.dist / this.DETECT_RANGE);
      const alpha = 0.35 + proximity * 0.5;
      const kind = e.boss ? 'boss' : e.elite ? 'elite' : 'regular';
      const style = resolveEdgeIndicatorStyle(kind, e.eliteDisplayTint);
      indicator.setFillStyle(style.color, alpha);
      indicator.setScale(style.scaleMul * pulse);
      glow.setFillStyle(style.color, style.glowAlpha * proximity);
      glow.setRadius(this.INDICATOR_SIZE + style.glowRadiusOffset);
    }

    // Hide unused glows
    for (let i = toShowCount; i < this.MAX_INDICATORS; i++) {
      this.glows[i].setVisible(false);
    }
  }

  destroy(): void {
    for (const ind of this.indicators) ind.destroy();
    for (const glow of this.glows) glow.destroy();
    this.indicators = [];
    this.glows = [];
  }
}
