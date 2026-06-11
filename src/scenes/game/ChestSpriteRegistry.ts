/**
 * ChestSpriteRegistry — small registry of active chest sprites used by
 * the minimap (treasure + golden markers). Lifts the trio of
 * track/untrack/getActiveMarkers helpers + the backing array off
 * GameScene.
 *
 * Marker retrieval also prunes inactive sprites so the minimap doesn't
 * keep rendering chests that have already been collected.
 */
import type Phaser from 'phaser';

interface ChestEntry {
  sprite: Phaser.GameObjects.Sprite;
  golden: boolean;
}

export interface ChestMarker {
  x: number;
  y: number;
  golden?: boolean;
}

export class ChestSpriteRegistry {
  private entries: ChestEntry[] = [];

  /** Clear the registry between runs. */
  reset(): void {
    this.entries = [];
  }

  /** Add a chest sprite to the registry. */
  track(sprite: Phaser.GameObjects.Sprite, golden: boolean): void {
    this.entries.push({ sprite, golden });
  }

  /** Remove a chest sprite from the registry (by reference). */
  untrack(sprite: Phaser.GameObjects.Sprite): void {
    this.entries = this.entries.filter((entry) => entry.sprite !== sprite);
  }

  /**
   * Return minimap-shaped markers for still-active chests. Prunes
   * inactive entries as a side effect — cheap lazy cleanup.
   */
  getMarkers(): ChestMarker[] {
    this.entries = this.entries.filter((entry) => entry.sprite.active);
    return this.entries.map((entry) => ({
      x: entry.sprite.x,
      y: entry.sprite.y,
      golden: entry.golden,
    }));
  }

  /** For shutdown teardown — iterate and let scene destroy each sprite. */
  forEachSprite(fn: (sprite: Phaser.GameObjects.Sprite) => void): void {
    for (const entry of this.entries) fn(entry.sprite);
  }
}
