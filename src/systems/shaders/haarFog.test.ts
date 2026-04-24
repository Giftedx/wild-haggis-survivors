import { describe, expect, it, vi } from 'vitest';

import {
  applyHaarUniforms,
  clampHaarDensity,
  DEFAULT_HAAR_STATE,
  HAAR_FOG_FRAG,
  HAAR_FOG_SHADER_ID,
  makeHaarState,
} from './haarFog';

describe('haarFog pure module', () => {
  it('exports HAAR_FOG_SHADER_ID as "HaarFog"', () => {
    expect(HAAR_FOG_SHADER_ID).toBe('HaarFog');
  });

  it('exports a non-empty GLSL fragment shader source', () => {
    expect(HAAR_FOG_FRAG.length).toBeGreaterThan(100);
    // Shader must declare the uniforms setupUniforms writes to + the main + noise samplers.
    expect(HAAR_FOG_FRAG).toMatch(/uniform\s+float\s+uTime\b/);
    expect(HAAR_FOG_FRAG).toMatch(/uniform\s+float\s+uFogDensity\b/);
    expect(HAAR_FOG_FRAG).toMatch(/uniform\s+vec3\s+uFogColor\b/);
    expect(HAAR_FOG_FRAG).toMatch(/uniform\s+sampler2D\s+uMainSampler\b/);
    expect(HAAR_FOG_FRAG).toMatch(/uniform\s+sampler2D\s+uMainSampler2\b/);
    expect(HAAR_FOG_FRAG).toMatch(/varying\s+vec2\s+outTexCoord\b/);
    expect(HAAR_FOG_FRAG).toMatch(/gl_FragColor\s*=/);
  });

  it('DEFAULT_HAAR_STATE matches spec — density 0, pale off-white-blue, time 0', () => {
    expect(DEFAULT_HAAR_STATE).toEqual({
      density: 0,
      color: [0.9, 0.9, 0.95],
      time: 0,
    });
  });

  it('makeHaarState clones the default so mutation does not leak across instances', () => {
    const a = makeHaarState();
    const b = makeHaarState();
    a.color[0] = 0.1;
    expect(b.color[0]).toBe(0.9);
    expect(DEFAULT_HAAR_STATE.color[0]).toBe(0.9);
  });

  it('makeHaarState accepts overrides', () => {
    const s = makeHaarState({ density: 0.5, color: [0.3, 0.4, 0.5] });
    expect(s.density).toBe(0.5);
    expect(s.color).toEqual([0.3, 0.4, 0.5]);
    expect(s.time).toBe(0);
  });

  it('clampHaarDensity clamps to [0, 1] and rejects NaN', () => {
    expect(clampHaarDensity(-0.5)).toBe(0);
    expect(clampHaarDensity(0)).toBe(0);
    expect(clampHaarDensity(0.42)).toBeCloseTo(0.42);
    expect(clampHaarDensity(1)).toBe(1);
    expect(clampHaarDensity(1.5)).toBe(1);
    expect(clampHaarDensity(Number.NaN)).toBe(0);
  });

  it('applyHaarUniforms sends uTime, uFogDensity and uFogColor to setUniform', () => {
    const state = makeHaarState({ density: 0.4, color: [0.2, 0.3, 0.4], time: 12.5 });
    const setUniform = vi.fn();
    applyHaarUniforms(state, setUniform);
    const calls = setUniform.mock.calls.map((c) => [c[0], c[1]] as [string, unknown]);
    expect(calls).toEqual(
      expect.arrayContaining([
        ['uTime', 12.5],
        ['uFogDensity', 0.4],
        ['uFogColor', [0.2, 0.3, 0.4]],
      ]),
    );
    // Exactly three uniforms — we do not leak junk calls.
    expect(setUniform.mock.calls.length).toBe(3);
  });

  it('applyHaarUniforms clamps density defensively before sending to the GPU', () => {
    const state = makeHaarState({ density: 1.8 });
    const setUniform = vi.fn();
    applyHaarUniforms(state, setUniform);
    const densityCall = setUniform.mock.calls.find((c) => c[0] === 'uFogDensity');
    expect(densityCall?.[1]).toBe(1);
  });
});
