import { describe, expect, it, vi } from 'vitest';

import { createNoiseBuffer } from './sharedNoise';
import { NOISE_TEXTURE_KEY, uploadNoiseTexture } from './uploadNoise';

type StoredCanvas = { width: number; height: number; pixels: Uint8ClampedArray };

function makeFakeTextureManager() {
  const stored = new Map<string, StoredCanvas>();
  const exists = vi.fn((key: string) => stored.has(key));
  const addCanvas = vi.fn((key: string, canvas: { width: number; height: number; pixels?: Uint8ClampedArray }) => {
    stored.set(key, {
      width: canvas.width,
      height: canvas.height,
      pixels: canvas.pixels ?? new Uint8ClampedArray(canvas.width * canvas.height * 4),
    });
  });
  const remove = vi.fn((key: string) => { stored.delete(key); });
  return { stored, exists, addCanvas, remove };
}

function makeFakeCanvasFactory() {
  return (width: number, height: number, pixels?: Uint8ClampedArray) => ({
    width,
    height,
    pixels,
  } as unknown as HTMLCanvasElement);
}

describe('uploadNoiseTexture', () => {
  it('exports a stable, collision-resistant NOISE_TEXTURE_KEY', () => {
    expect(NOISE_TEXTURE_KEY).toBe('shader:noise');
  });

  it('calls textures.addCanvas with a size×size canvas and registers it under NOISE_TEXTURE_KEY', () => {
    const textures = makeFakeTextureManager();
    const factory = makeFakeCanvasFactory();
    uploadNoiseTexture(textures, { size: 32, seed: 7, canvasFactory: factory });
    expect(textures.addCanvas).toHaveBeenCalledTimes(1);
    const [key, canvas] = textures.addCanvas.mock.calls[0] as [string, { width: number; height: number }];
    expect(key).toBe(NOISE_TEXTURE_KEY);
    expect(canvas.width).toBe(32);
    expect(canvas.height).toBe(32);
  });

  it('is idempotent — re-uploads replace the prior entry without throwing', () => {
    const textures = makeFakeTextureManager();
    const factory = makeFakeCanvasFactory();
    uploadNoiseTexture(textures, { size: 16, seed: 1, canvasFactory: factory });
    // Pretend it still exists on second call.
    uploadNoiseTexture(textures, { size: 16, seed: 1, canvasFactory: factory });
    expect(textures.remove).toHaveBeenCalledWith(NOISE_TEXTURE_KEY);
    expect(textures.addCanvas).toHaveBeenCalledTimes(2);
  });

  it('writes the same bytes the sharedNoise factory produces for a given seed', () => {
    const size = 16;
    const seed = 99;
    const captured: Uint8ClampedArray[] = [];
    const factory = (w: number, h: number, pixels?: Uint8ClampedArray) => {
      if (pixels) captured.push(pixels);
      return { width: w, height: h } as unknown as HTMLCanvasElement;
    };
    const textures = makeFakeTextureManager();
    uploadNoiseTexture(textures, { size, seed, canvasFactory: factory });
    const expected = createNoiseBuffer(size, seed).data;
    expect(captured.length).toBe(1);
    expect(captured[0]).toEqual(expected);
  });
});
