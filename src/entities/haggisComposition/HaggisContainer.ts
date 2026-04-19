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

/**
 * Per-variant body-shape y-offset for accessory anchoring. Positive values
 * push accessories DOWN on the screen; negative values push them UP. The
 * baseline is the classic haggis body (bodyW=44, bodyH=34, legBase=cy+11).
 *
 * Variants with a flatter or shorter body need accessories shifted upward
 * so they still read as "worn on the belt / head" rather than floating.
 * `iron_belly` is the only variant whose body geometry differs from the
 * baseline (54×28 instead of 44×34, legs at cy+9 instead of cy+11), which
 * lifts every body landmark by ~3 px. Accessories baked for the classic
 * baseline need the same lift when applied to an iron_belly.
 */
const VARIANT_ACCESSORY_OFFSET_Y: Readonly<Record<string, number>> = {
  iron_belly: -3,
  // every other variant uses the baseline (offset 0) — omit to keep the
  // table listing ONLY the exceptions.
};

/** Look up the y-offset for a variant. Unknown keys default to 0. */
export function getAccessoryOffsetY(variantKey: string | null): number {
  if (!variantKey) return 0;
  return VARIANT_ACCESSORY_OFFSET_Y[variantKey] ?? 0;
}

interface AccessorySpriteEntry {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly slot: HaggisLayerSlot;
}

export class HaggisContainer {
  private readonly accessorySprites: Map<string, AccessorySpriteEntry> = new Map();
  /** Cached per-variant offset, applied to every accessory sprite on sync. */
  private accessoryOffsetY = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly anchor: Phaser.GameObjects.Sprite, // the Player body sprite
    variantKey: string | null = null,
  ) {
    this.accessoryOffsetY = getAccessoryOffsetY(variantKey);
  }

  /**
   * Per-frame: move every accessory sprite to the anchor's current
   * position plus the variant-aware y offset, and copy rotation + scale.
   * Called from Player.update() after physics velocity application.
   */
  syncToAnchor(): void {
    const offsetY = this.accessoryOffsetY * this.anchor.scaleY;
    for (const { sprite } of this.accessorySprites.values()) {
      sprite.setPosition(this.anchor.x, this.anchor.y + offsetY);
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
