/**
 * Container for the compositional haggis. Owns per-accessory sprites
 * keyed by id, each parked at one of four render-depth slots relative
 * to the body (behind / body / front / above). Multiple accessories
 * can share a depth slot; they z-sort deterministically by insertion
 * order inside Phaser's display list.
 *
 * The body sprite stays the Phaser Sprite the Player class extends;
 * this container is a sibling that owns accessory children. Player
 * continues to be the physics + collision entity; this container is
 * purely visual.
 */

export type HaggisLayerSlot = 'behind' | 'body' | 'front' | 'above';

export const HAGGIS_LAYER_DEPTHS: Readonly<Record<HaggisLayerSlot, number>> = {
  behind: -1,
  body: 0,
  front: 1,
  above: 2,
};

interface AccessorySpriteEntry {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly slot: HaggisLayerSlot;
}

export class HaggisContainer {
  private readonly accessorySprites: Map<string, AccessorySpriteEntry> = new Map();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly anchor: Phaser.GameObjects.Sprite, // the Player body sprite
  ) {}

  /**
   * Per-frame: move every accessory sprite to the anchor's current
   * position and copy its rotation. Called from Player.update() after
   * physics velocity application.
   */
  syncToAnchor(): void {
    for (const { sprite } of this.accessorySprites.values()) {
      sprite.setPosition(this.anchor.x, this.anchor.y);
      sprite.setRotation(this.anchor.rotation);
      sprite.setScale(this.anchor.scaleX, this.anchor.scaleY);
    }
  }

  /**
   * Create (or reuse) a sprite for `accessoryId` parked at the given
   * depth slot. Binds the initial texture so it renders on frame 0.
   * Returning the sprite lets AnimationController swap frames per tick.
   */
  equipLayer(
    accessoryId: string,
    slot: HaggisLayerSlot,
    textureKey: string,
  ): Phaser.GameObjects.Sprite {
    const existing = this.accessorySprites.get(accessoryId);
    if (existing) {
      existing.sprite.setTexture(textureKey);
      existing.sprite.setOrigin(0.5, 0.5);
      existing.sprite.setVisible(true);
      return existing.sprite;
    }
    const sprite = this.scene.add.sprite(this.anchor.x, this.anchor.y, textureKey);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDepth(this.anchor.depth + HAGGIS_LAYER_DEPTHS[slot]);
    this.accessorySprites.set(accessoryId, { sprite, slot });
    return sprite;
  }

  unequipLayer(accessoryId: string): void {
    const entry = this.accessorySprites.get(accessoryId);
    if (!entry) return;
    entry.sprite.destroy();
    this.accessorySprites.delete(accessoryId);
  }

  getAccessorySprite(accessoryId: string): Phaser.GameObjects.Sprite | undefined {
    return this.accessorySprites.get(accessoryId)?.sprite;
  }

  destroy(): void {
    for (const { sprite } of this.accessorySprites.values()) sprite.destroy();
    this.accessorySprites.clear();
  }
}
