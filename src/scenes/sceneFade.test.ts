import { describe, it, expect } from 'vitest';
import { SCENE_FADE_COLOR, SCENE_FADE_DEPTH } from './sceneFade';

describe('sceneFade constants', () => {
  it('fade colour is the shared dark navy (0x1a1a2e)', () => {
    expect(SCENE_FADE_COLOR).toBe(0x1a1a2e);
  });

  it('fade depth is 999 — above any scene-content depth', () => {
    expect(SCENE_FADE_DEPTH).toBe(999);
  });
});
