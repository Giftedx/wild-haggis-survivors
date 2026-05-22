import * as Phaser from 'phaser';
import { GAME } from '../config';
import { getSettingsManager } from '../core/SettingsManager';
import { Enemy } from '../entities/Enemy';
import { BIOMES } from '../data/biomes';
import type { BiomeManager } from '../systems/BiomeManager';
import { getCameraViewport } from './cameraViewport';
import {
  resolveMinimapPalette,
  resolveMinimapEdgeWarn,
  MINIMAP_BOSS_FILL,
  MINIMAP_ELITE_RING_FILL,
  MINIMAP_ELITE_INNER_FALLBACK,
  MINIMAP_ENEMY_FILL,
  MINIMAP_ENEMY_ALPHA,
  MINIMAP_PLAYER_FILL,
  MINIMAP_CHEST_OUTLINE,
  MINIMAP_CHEST_OUTLINE_ALPHA,
  MINIMAP_CHEST_GOLDEN,
  MINIMAP_CHEST_NORMAL,
  MINIMAP_CLOOTIE_OUTER,
  MINIMAP_CLOOTIE_INNER,
  MINIMAP_VIEWPORT_STROKE,
  MINIMAP_VIEWPORT_ALPHA,
  MINIMAP_WARN_STROKE,
} from './minimapPalette';

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
  /**
   * Phase B Biomes — when set, the minimap fills each grid cell with the
   * biome tint at low alpha before drawing dots. Refreshed on reseed by
   * calling setBiomeManager again from GameScene.
   */
  private biomeManager: BiomeManager | null = null;
  /**
   * The Moor Remembers — dim slate pixels at every loaded Cairn-of-Echoes
   * coord. Assigned per-frame from `CairnOfEchoesScheduler.getMinimapMarkers()`
   * by the runtime tick hook; defaults to empty so a scene without the
   * scheduler renders nothing. Visual cue is intentionally muted so cairns
   * read as ambient (one-pixel marker, 0.4 alpha) and do not compete with
   * the boss / elite / pickup vocabulary above.
   */
  cairnMarkers: ReadonlyArray<{ x: number; y: number }> = [];

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
    const palette = resolveMinimapPalette(highContrastUi);
    this.bg = scene.add.rectangle(x, y, this.SIZE, this.SIZE, 0x000000, palette.bgAlpha)
      .setStrokeStyle(2, palette.borderColor, 1)
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
    playerRotation: number = 0,
    /** Optional amber pin for the Reliquary pickup — null when the relic is
     *  collected, unspawned, or the mode doesn't use it. */
    reliquaryMarker: { x: number; y: number } | null = null,
    /** R1 M4.5 P2 — optional per-Relic pickup pins, rendered only when the
     *  pictish_compass relic is held. Empty array when not held. */
    relicMarkers: Array<{ x: number; y: number; colour: number }> = [],
    /** Optional sage pin for the Clootie Tree landmark — null when wagered,
     *  unspawned, or the mode doesn't use it. Sister to reliquaryMarker. */
    clootieMarker: { x: number; y: number } | null = null,
  ): void {
    this.gfx.clear();

    const { x: left, y: top, width, height } = this.getUiViewport();
    const mapX = Math.max(left, Math.min(left + width - this.SIZE, left + width - this.MARGIN - this.SIZE));
    const mapY = Math.max(top, Math.min(top + height - this.SIZE, top + height - this.MARGIN - this.SIZE));
    this.bg.setPosition(mapX + this.SIZE / 2, mapY + this.SIZE / 2);
    const scaleX = this.SIZE / GAME.WORLD_WIDTH;
    const scaleY = this.SIZE / GAME.WORLD_HEIGHT;

    // Phase B Biomes — tint each grid cell with the biome colour at low
    // alpha so the player can read the world's regions at a glance.
    // Drawn before everything else so dots sit on top.
    if (this.biomeManager) {
      const res = this.biomeManager.getGridResolution();
      const cellW = this.SIZE / res;
      const cellH = this.SIZE / res;
      this.biomeManager.forEachCell((gx, gy, biome) => {
        const tint = BIOMES[biome].tint;
        this.gfx.fillStyle(tint, 0.35);
        this.gfx.fillRect(mapX + gx * cellW, mapY + gy * cellH, cellW + 0.5, cellH + 0.5);
      });
    }

    // Cairn-of-Echoes (The Moor Remembers spec 2026-05-22) — dim slate
    // pixels at every past-self death coord. Drawn below the enemy /
    // boss / chest vocabulary so they read as moor ambience and never
    // compete for the player's attention with combat-critical markers.
    if (this.cairnMarkers.length > 0) {
      this.gfx.fillStyle(0x3a4148, 0.4);
      for (const m of this.cairnMarkers) {
        const mx = Phaser.Math.Clamp(mapX + m.x * scaleX, mapX, mapX + this.SIZE);
        const my = Phaser.Math.Clamp(mapY + m.y * scaleY, mapY, mapY + this.SIZE);
        this.gfx.fillRect(mx, my, 1, 1);
      }
    }

    // Enemy dots — render every active enemy. Previous implementation
    // sampled every 4th active enemy via `activeIdx & 3`, but the active
    // index shifts each frame as enemies (de)activate, so which enemies
    // rendered flickered frame-to-frame — visible as minimap jitter.
    // 400-enemy cap × a handful of draw calls is well inside the frame
    // budget; no perf reason to skip any now.
    const enemies = enemyGroup.getChildren() as Enemy[];
    for (let i = 0, len = enemies.length; i < len; i++) {
      const e = enemies[i];
      if (!e.active) continue;
      // Clamp to minimap bounds so dots don't bleed outside the background rect
      const dx = Phaser.Math.Clamp(mapX + e.x * scaleX, mapX, mapX + this.SIZE);
      const dy = Phaser.Math.Clamp(mapY + e.y * scaleY, mapY, mapY + this.SIZE);

      if (e.isBoss()) {
        // Boss: larger red diamond — the player needs to find this fast.
        this.gfx.fillStyle(MINIMAP_BOSS_FILL, 1);
        this.gfx.fillTriangle(dx, dy - 5, dx + 4, dy, dx, dy + 5);
        this.gfx.fillTriangle(dx, dy - 5, dx - 4, dy, dx, dy + 5);
      } else if (e.isElite()) {
        // Elite: inner fill uses affix hue when present, else classic gold.
        const affixTint = e.getEliteAffixIndicatorTint();
        const inner = affixTint ?? MINIMAP_ELITE_INNER_FALLBACK;
        this.gfx.fillStyle(MINIMAP_ELITE_RING_FILL, 0.6);
        this.gfx.fillCircle(dx, dy, 3);
        this.gfx.fillStyle(inner, 1);
        this.gfx.fillCircle(dx, dy, 2.2);
      } else {
        // Regular: dim red dot, slightly bigger.
        this.gfx.fillStyle(MINIMAP_ENEMY_FILL, MINIMAP_ENEMY_ALPHA);
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
    this.gfx.fillStyle(MINIMAP_PLAYER_FILL, 1);
    this.gfx.fillTriangle(tri.ax, tri.ay, tri.bx, tri.by, tri.cx, tri.cy);

    // Chest markers: subtle squares (gold for golden chests). Same as before.
    for (const chest of chestMarkers) {
      const cx = Phaser.Math.Clamp(mapX + chest.x * scaleX, mapX, mapX + this.SIZE);
      const cy = Phaser.Math.Clamp(mapY + chest.y * scaleY, mapY, mapY + this.SIZE);
      this.gfx.fillStyle(MINIMAP_CHEST_OUTLINE, MINIMAP_CHEST_OUTLINE_ALPHA);
      this.gfx.fillRect(cx - 3, cy - 3, 6, 6);
      this.gfx.fillStyle(chest.golden ? MINIMAP_CHEST_GOLDEN : MINIMAP_CHEST_NORMAL, 1);
      this.gfx.fillRect(cx - 2, cy - 2, 4, 4);
    }

    // Reliquary pin — amber diamond, larger than chest squares so it
    // reads as a distinct "rare curio" cue. Off-path spawns otherwise
    // risk never being discovered.
    if (reliquaryMarker) {
      const rx = Phaser.Math.Clamp(mapX + reliquaryMarker.x * scaleX, mapX, mapX + this.SIZE);
      const ry = Phaser.Math.Clamp(mapY + reliquaryMarker.y * scaleY, mapY, mapY + this.SIZE);
      this.gfx.fillStyle(0x000000, 0.6);
      this.gfx.fillTriangle(rx, ry - 5, rx + 4, ry, rx, ry + 5);
      this.gfx.fillTriangle(rx, ry - 5, rx - 4, ry, rx, ry + 5);
      this.gfx.fillStyle(0xffb060, 1);
      this.gfx.fillTriangle(rx, ry - 4, rx + 3, ry, rx, ry + 4);
      this.gfx.fillTriangle(rx, ry - 4, rx - 3, ry, rx, ry + 4);
    }

    // Clootie tree pin — sage diamond with cream rag inner. Sister to
    // the amber Reliquary diamond above; same shape vocabulary, distinct
    // hue so a run that spawns both reads two cool/warm cues at a glance.
    if (clootieMarker) {
      const cx = Phaser.Math.Clamp(mapX + clootieMarker.x * scaleX, mapX, mapX + this.SIZE);
      const cy = Phaser.Math.Clamp(mapY + clootieMarker.y * scaleY, mapY, mapY + this.SIZE);
      this.gfx.fillStyle(0x000000, 0.6);
      this.gfx.fillTriangle(cx, cy - 5, cx + 4, cy, cx, cy + 5);
      this.gfx.fillTriangle(cx, cy - 5, cx - 4, cy, cx, cy + 5);
      this.gfx.fillStyle(MINIMAP_CLOOTIE_OUTER, 1);
      this.gfx.fillTriangle(cx, cy - 4, cx + 3, cy, cx, cy + 4);
      this.gfx.fillTriangle(cx, cy - 4, cx - 3, cy, cx, cy + 4);
      this.gfx.fillStyle(MINIMAP_CLOOTIE_INNER, 1);
      this.gfx.fillCircle(cx, cy, 1.4);
    }

    // Relic pickup pins — coloured diamonds, one per live pickup. Only
    // rendered when the caller passes a non-empty array (i.e. the
    // pictish_compass relic is held).
    for (const pin of relicMarkers) {
      const px2 = Phaser.Math.Clamp(mapX + pin.x * scaleX, mapX, mapX + this.SIZE);
      const py2 = Phaser.Math.Clamp(mapY + pin.y * scaleY, mapY, mapY + this.SIZE);
      this.gfx.fillStyle(0x000000, 0.6);
      this.gfx.fillTriangle(px2, py2 - 4, px2 + 3, py2, px2, py2 + 4);
      this.gfx.fillTriangle(px2, py2 - 4, px2 - 3, py2, px2, py2 + 4);
      this.gfx.fillStyle(pin.colour, 1);
      this.gfx.fillTriangle(px2, py2 - 3, px2 + 2, py2, px2, py2 + 3);
      this.gfx.fillTriangle(px2, py2 - 3, px2 - 2, py2, px2, py2 + 3);
    }

    // Camera viewport outline.
    const cam = this.scene.cameras.main;
    const viewW = (cam.width / cam.zoom) * scaleX;
    const viewH = (cam.height / cam.zoom) * scaleY;
    const camLeft = mapX + cam.scrollX * scaleX;
    const camTop = mapY + cam.scrollY * scaleY;
    this.gfx.lineStyle(1, MINIMAP_VIEWPORT_STROKE, MINIMAP_VIEWPORT_ALPHA);
    this.gfx.strokeRect(camLeft, camTop, viewW, viewH);

    // Warning edge — the player is near a world boundary. Draws a thin
    // red inset rectangle on the minimap telling the player "you're up
    // against the soft wall".
    const warn = resolveMinimapEdgeWarn(playerX, playerY, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);
    if (warn.active) {
      this.gfx.lineStyle(2, MINIMAP_WARN_STROKE, warn.alpha);
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

  /**
   * Phase B Biomes — register / refresh the BiomeManager used by the
   * tint pass. Call once from GameScene after BiomeController constructs;
   * call again after a post-bell reseed so the new layout takes effect.
   * Pass null to disable the tint (test scenes / minimap variants).
   */
  setBiomeManager(mgr: BiomeManager | null): void {
    this.biomeManager = mgr;
  }

  destroy(): void {
    this.bg.destroy();
    this.gfx.destroy();
  }
}
