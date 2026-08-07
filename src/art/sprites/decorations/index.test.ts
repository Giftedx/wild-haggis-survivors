import { describe, expect, it } from 'vitest';
import { HAZARDS } from '../../../data/hazards';
import { bakeDecorations } from './index';

describe('bakeDecorations', () => {
  it('bakes every hazard texture in the hazard roster', () => {
    const generatedTextures = new Set<string>();
    const graphics: Record<string, unknown> = new Proxy(
      {},
      {
        get: (_target, property) =>
          property === 'generateTexture'
            ? (key: string) => generatedTextures.add(key)
            : () => graphics,
      }
    );
    const scene = {
      add: { graphics: () => graphics },
    } as unknown as Parameters<typeof bakeDecorations>[0];

    bakeDecorations(scene);

    const missingTextures = Object.values(HAZARDS)
      .map((hazard) => hazard.texture)
      .filter((texture) => !generatedTextures.has(texture));
    expect(missingTextures).toEqual([]);
  });
});
