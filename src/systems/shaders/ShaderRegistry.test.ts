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

  it('buildRenderNodesConfig returns bare constructors (Phaser 4 RenderNodeManager reads entry[1] as the constructor — type def claims a {key, function} wrapper but runtime ignores it)', () => {
    registerShader('HaarFog', DummyNodeA);
    registerShader('PaletteSwap', DummyNodeB);
    const config = buildRenderNodesConfig();
    expect(config).toEqual({
      HaarFog: DummyNodeA,
      PaletteSwap: DummyNodeB,
    });
  });

  it('clearShaderRegistry removes everything (for test isolation)', () => {
    registerShader('HaarFog', DummyNodeA);
    clearShaderRegistry();
    expect(listShaderIds()).toEqual([]);
    expect(getShader('HaarFog')).toBeUndefined();
  });
});
