import type Phaser from 'phaser';

/**
 * Destroys every game object in the array and resets the array length
 * to zero so the same buffer can be reused. Pulled out of ShopScene +
 * MetaShopScene's identical private `clearElements` so the shape is
 * one definition rather than two near-copies.
 */
export function clearGameObjects(elements: Phaser.GameObjects.GameObject[]): void {
  for (const el of elements) el.destroy();
  elements.length = 0;
}
