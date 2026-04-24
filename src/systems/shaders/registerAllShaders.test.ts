import { beforeEach, describe, expect, it } from 'vitest';

import { buildRenderNodesConfig, clearShaderRegistry, listShaderIds } from './ShaderRegistry';
import { registerAllShaders } from './registerAllShaders';

describe('registerAllShaders', () => {
  beforeEach(() => {
    clearShaderRegistry();
  });

  it('runs without throwing', () => {
    expect(() => registerAllShaders()).not.toThrow();
  });

  it('is idempotent across the clearShaderRegistry reset (no hidden module state)', () => {
    registerAllShaders();
    const firstIds = listShaderIds().slice().sort();
    clearShaderRegistry();
    registerAllShaders();
    const secondIds = listShaderIds().slice().sort();
    expect(secondIds).toEqual(firstIds);
  });

  it('produces a render-nodes config shape Phaser can consume', () => {
    registerAllShaders();
    const config = buildRenderNodesConfig();
    for (const id of Object.keys(config)) {
      expect(config[id].key).toBe(id);
      expect(typeof config[id].function).toBe('function');
    }
  });
});
