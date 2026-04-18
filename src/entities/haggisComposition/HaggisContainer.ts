/**
 * Container for the compositional haggis. Owns the body sprite +
 * four optional accessory layer sprites (behind / body / front /
 * above). Each layer renders one accessory drawer's atlas at a time;
 * adding a second same-layer accessory needs the drawer author to
 * stack (rare).
 *
 * Phase 0: container scaffold + empty layer sprites. No accessories
 * wired yet — that's Task 14.
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

export class HaggisContainer {
  private readonly layers: Map<HaggisLayerSlot, Phaser.GameObjects.Sprite> = new Map();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly anchor: Phaser.GameObjects.Sprite, // the Player body sprite
  ) {
    for (const slot of ['behind', 'body', 'front', 'above'] as HaggisLayerSlot[]) {
      const sprite = this.scene.add.sprite(anchor.x, anchor.y, '');
      sprite.setVisible(false);
      sprite.setDepth(anchor.depth + HAGGIS_LAYER_DEPTHS[slot]);
      this.layers.set(slot, sprite);
    }
  }

  /**
   * Per-frame: move every layer to the anchor's current position and
   * copy its rotation. Called from Player.update() after physics
   * velocity application.
   */
  syncToAnchor(): void {
    for (const sprite of this.layers.values()) {
      sprite.setPosition(this.anchor.x, this.anchor.y);
      sprite.setRotation(this.anchor.rotation);
      sprite.setScale(this.anchor.scaleX, this.anchor.scaleY);
    }
  }

  /**
   * Assign an accessory to a layer slot. `textureKey` is the atlas
   * key the layer's sprite will bind to — AnimationController swaps
   * frames on the layer sprite.
   */
  equipLayer(slot: HaggisLayerSlot, textureKey: string): Phaser.GameObjects.Sprite {
    const sprite = this.layers.get(slot);
    if (!sprite) throw new Error(`HaggisContainer: unknown layer slot ${slot}`);
    sprite.setTexture(textureKey);
    sprite.setVisible(true);
    return sprite;
  }

  unequipLayer(slot: HaggisLayerSlot): void {
    const sprite = this.layers.get(slot);
    if (sprite) sprite.setVisible(false);
  }

  getLayerSprite(slot: HaggisLayerSlot): Phaser.GameObjects.Sprite | undefined {
    return this.layers.get(slot);
  }

  destroy(): void {
    for (const sprite of this.layers.values()) sprite.destroy();
    this.layers.clear();
  }
}
