import { beforeEach, describe, expect, it } from 'vitest';

import {
  buildRenderNodesConfig,
  clearShaderRegistry,
  getShader,
  listShaderIds,
  registerShader,
} from './ShaderRegistry';

class DummyNodeA {}
class DummyNodeB {}

describe('ShaderRegistry', () => {
  beforeEach(() => {
    clearShaderRegistry();
  });

  it('starts empty', () => {
    expect(listShaderIds()).toEqual([]);
    expect(getShader('HaarFog')).toBeUndefined();
  });

  it('registers and retrieves a render-node constructor by id', () => {
    registerShader('HaarFog', DummyNodeA);
    expect(getShader('HaarFog')).toBe(DummyNodeA);
    expect(listShaderIds()).toEqual(['HaarFog']);
  });

  it('supports multiple shaders', () => {
    registerShader('HaarFog', DummyNodeA);
    registerShader('PaletteSwap', DummyNodeB);
    expect(listShaderIds().sort()).toEqual(['HaarFog', 'PaletteSwap']);
    expect(getShader('PaletteSwap')).toBe(DummyNodeB);
  });

  it('throws on duplicate registration (safety net for copy-paste bugs)', () => {
    registerShader('HaarFog', DummyNodeA);
    expect(() => registerShader('HaarFog', DummyNodeB)).toThrow(/duplicate|already/i);
  });

  it('buildRenderNodesConfig shapes entries for Phaser game config', () => {
    registerShader('HaarFog', DummyNodeA);
    registerShader('PaletteSwap', DummyNodeB);
    const config = buildRenderNodesConfig();
    expect(config).toEqual({
      HaarFog: { key: 'HaarFog', function: DummyNodeA },
      PaletteSwap: { key: 'PaletteSwap', function: DummyNodeB },
    });
  });

  it('clearShaderRegistry removes everything (for test isolation)', () => {
    registerShader('HaarFog', DummyNodeA);
    clearShaderRegistry();
    expect(listShaderIds()).toEqual([]);
    expect(getShader('HaarFog')).toBeUndefined();
  });
});
