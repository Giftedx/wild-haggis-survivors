import { createRNG } from '@/utils/rng';

export const DEFAULT_NOISE_SIZE = 256;
export const DEFAULT_NOISE_SEED = 42;

export interface NoiseBuffer {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

function makeLattice(cells: number, rng: { next(): number }): Float32Array {
  const grid = new Float32Array(cells * cells);
  for (let i = 0; i < grid.length; i++) grid[i] = rng.next();
  return grid;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function sampleLattice(grid: Float32Array, cells: number, u: number, v: number): number {
  const x = u * cells;
  const y = v * cells;
  const x0 = Math.floor(x) % cells;
  const y0 = Math.floor(y) % cells;
  const x1 = (x0 + 1) % cells;
  const y1 = (y0 + 1) % cells;
  const fx = smoothstep(x - Math.floor(x));
  const fy = smoothstep(y - Math.floor(y));
  const v00 = grid[y0 * cells + x0];
  const v10 = grid[y0 * cells + x1];
  const v01 = grid[y1 * cells + x0];
  const v11 = grid[y1 * cells + x1];
  const top = v00 * (1 - fx) + v10 * fx;
  const bot = v01 * (1 - fx) + v11 * fx;
  return top * (1 - fy) + bot * fy;
}

export function createNoiseBuffer(
  size: number = DEFAULT_NOISE_SIZE,
  seed: number = DEFAULT_NOISE_SEED,
): NoiseBuffer {
  const rng = createRNG(seed);
  const coarse = makeLattice(16, rng);
  const fine = makeLattice(64, rng);
  const data = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const n = sampleLattice(coarse, 16, u, v) * 0.65
              + sampleLattice(fine,   64, u, v) * 0.35;
      const byte = Math.round(Math.max(0, Math.min(1, n)) * 255);
      const idx = (y * size + x) * 4;
      data[idx + 0] = byte;
      data[idx + 1] = byte;
      data[idx + 2] = byte;
      data[idx + 3] = 255;
    }
  }

  return { width: size, height: size, data };
}
