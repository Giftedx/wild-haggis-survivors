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

describe('amber header wash constants', () => {
  it('colour is the warm whisky gold', async () => {
    const { AMBER_HEADER_WASH_COLOR } = await import('./sceneFade');
    expect(AMBER_HEADER_WASH_COLOR).toBe(0xd4a017);
  });

  it('default alpha is louder than quiet alpha (Chronicle / Deeds vs Shop)', async () => {
    const {
      AMBER_HEADER_WASH_ALPHA_DEFAULT,
      AMBER_HEADER_WASH_ALPHA_QUIET,
    } = await import('./sceneFade');
    expect(AMBER_HEADER_WASH_ALPHA_DEFAULT).toBeGreaterThan(AMBER_HEADER_WASH_ALPHA_QUIET);
  });
});
