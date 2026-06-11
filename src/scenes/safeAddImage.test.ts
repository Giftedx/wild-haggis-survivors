import { describe, expect, it, vi } from 'vitest';
import { safeAddImage, safeAddSprite } from './safeAddImage';

function makeScene(existingKeys: readonly string[]) {
  const set = new Set(existingKeys);
  const addImage = vi.fn((_x: number, _y: number, _k: string) => ({ kind: 'image' }));
  const addSprite = vi.fn((_x: number, _y: number, _k: string) => ({ kind: 'sprite' }));
  return {
    scene: {
      textures: { exists: (k: string) => set.has(k) },
      add: { image: addImage, sprite: addSprite },
    } as unknown as Parameters<typeof safeAddImage>[0],
    addImage,
    addSprite,
  };
}

describe('safeAddImage', () => {
  it('returns null when the texture key is unknown to the scene', () => {
    const { scene, addImage } = makeScene([]);
    const result = safeAddImage(scene, 10, 20, 'missing_key');
    expect(result).toBeNull();
    expect(addImage).not.toHaveBeenCalled();
  });

  it('delegates to scene.add.image when the texture exists', () => {
    const { scene, addImage } = makeScene(['known_key']);
    const result = safeAddImage(scene, 10, 20, 'known_key');
    expect(result).not.toBeNull();
    expect(addImage).toHaveBeenCalledWith(10, 20, 'known_key');
  });
});

describe('safeAddSprite', () => {
  it('returns null when the texture key is unknown to the scene', () => {
    const { scene, addSprite } = makeScene([]);
    const result = safeAddSprite(scene, 10, 20, 'missing_key');
    expect(result).toBeNull();
    expect(addSprite).not.toHaveBeenCalled();
  });

  it('delegates to scene.add.sprite when the texture exists', () => {
    const { scene, addSprite } = makeScene(['known_key']);
    const result = safeAddSprite(scene, 10, 20, 'known_key');
    expect(result).not.toBeNull();
    expect(addSprite).toHaveBeenCalledWith(10, 20, 'known_key');
  });
});
