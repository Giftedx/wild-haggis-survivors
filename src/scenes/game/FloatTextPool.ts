/**
 * FloatTextPool — 12-slot pool of Phaser text objects for high-frequency
 * combat/pickup feedback (armor-blocked, coin-collected, etc). Extracted
 * from GameScene where it was interleaved with transient-state reset.
 *
 * Pool size 12 is deliberately small — visual clutter past that is worse
 * than the dropped feedback. `acquire` returns null when exhausted;
 * callers tween then hide, which frees the slot for the next acquire.
 */
import Phaser from 'phaser';

const POOL_SIZE = 12;

export class FloatTextPool {
  private items: Phaser.GameObjects.Text[] = [];

  /**
   * Allocate (or re-allocate) the pool on the given scene. Destroys any
   * previous pool contents. Must be called from `create()` before any
   * gameplay code requests a text.
   */
  init(scene: Phaser.Scene): void {
    for (const ft of this.items) ft.destroy();
    this.items = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const ft = scene.add
        .text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000',
          strokeThickness: 3,
        })
        .setDepth(85)
        .setVisible(false);
      this.items.push(ft);
    }
  }

  /**
   * Claim the first invisible text object, or return null when the pool
   * is exhausted. Caller is responsible for tweening + hiding when done
   * to free the slot.
   */
  acquire(
    x: number,
    y: number,
    str: string,
    color: string,
    fontSize: string = '16px',
    depth: number = 85,
  ): Phaser.GameObjects.Text | null {
    const txt = this.items.find((t) => !t.visible);
    if (!txt) return null;
    txt.setText(str);
    txt.setPosition(x, y);
    txt.setVisible(true).setAlpha(1).setScale(1);
    txt.setColor(color);
    txt.setFontSize(fontSize);
    txt.setDepth(depth);
    return txt;
  }

  /** Destroy every text in the pool and clear the slot array. */
  destroyAll(): void {
    for (const ft of this.items) {
      try {
        ft.destroy();
      } catch {
        /* swallow — shutdown path is best-effort */
      }
    }
    this.items = [];
  }
}
