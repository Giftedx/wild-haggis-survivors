import { createNoiseBuffer, DEFAULT_NOISE_SEED, DEFAULT_NOISE_SIZE } from './sharedNoise';

/**
 * Phaser TextureManager cache key for the shared noise texture. Every shader
 * that samples from a noise source (haar, dissolve, heat-shimmer) reads from
 * this single entry — one 256×256 RGBA texture, 64 KB of GPU memory,
 * shared across the entire shader pool.
 *
 * Keyed via the `shader:` namespace so it never collides with a game-authored
 * sprite key.
 */
export const NOISE_TEXTURE_KEY = 'shader:noise';

/**
 * Minimal TextureManager surface we depend on. Matches the subset of
 * `Phaser.Textures.TextureManager` used here — structural typing keeps this
 * module testable without a real Phaser.Game.
 */
export interface TextureManagerLike {
  exists(key: string): boolean;
  addCanvas(key: string, canvas: HTMLCanvasElement): unknown;
  remove(key: string): unknown;
}

/**
 * Factory for DOM-independent testing. At runtime this defaults to a real
 * `<canvas>` element via `document.createElement`; tests pass their own
 * factory so the module can be unit-tested under Vitest's node env.
 */
export type CanvasFactory = (
  width: number,
  height: number,
  pixels?: Uint8ClampedArray,
) => HTMLCanvasElement;

export interface UploadNoiseOptions {
  size?: number;
  seed?: number;
  canvasFactory?: CanvasFactory;
}

const defaultCanvasFactory: CanvasFactory = (width, height, pixels) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  if (pixels) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Copy into an explicitly ArrayBuffer-backed view — ImageData rejects
      // the generic ArrayBufferLike form (which would admit SharedArrayBuffer).
      const buffer = new Uint8ClampedArray(pixels);
      const img = new ImageData(buffer, width, height);
      ctx.putImageData(img, 0, 0);
    }
  }
  return canvas;
};

/**
 * Register the shared noise texture with Phaser's TextureManager. Phaser's
 * cache survives WebGL context loss by re-uploading cached entries on
 * `webglcontextrestored` — we rely on that rather than owning the restore
 * path manually.
 *
 * Re-uploads are idempotent: if the key already exists, the previous entry
 * is removed first so swap is clean (e.g. when a dev overrides the seed at
 * runtime).
 */
export function uploadNoiseTexture(
  textures: TextureManagerLike,
  { size = DEFAULT_NOISE_SIZE, seed = DEFAULT_NOISE_SEED, canvasFactory = defaultCanvasFactory }: UploadNoiseOptions = {},
): void {
  if (textures.exists(NOISE_TEXTURE_KEY)) {
    textures.remove(NOISE_TEXTURE_KEY);
  }
  const buffer = createNoiseBuffer(size, seed);
  const canvas = canvasFactory(buffer.width, buffer.height, buffer.data);
  textures.addCanvas(NOISE_TEXTURE_KEY, canvas);
}
