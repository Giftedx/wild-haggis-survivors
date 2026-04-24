/**
 * Pure haar-fog shader helpers — GLSL source + state shape + uniform-apply
 * function. Separated from `HaarFogRenderNode.ts` so logic is unit-testable
 * under Vitest's node env (Phaser imports crash there).
 */

export const HAAR_FOG_SHADER_ID = 'HaarFog';

/**
 * GLSL ES 1.00 fragment shader. Samples `uMainSampler` (scene) and
 * `uMainSampler2` (shared noise texture); layers two noise samples drifting
 * at different scales + directions; mixes the tinted fog into the scene
 * proportional to `uFogDensity`.
 *
 * Uniform names follow Phaser 4 filter conventions:
 * - `uMainSampler` — input scene on texture unit 0
 * - `uMainSampler2` — noise texture on texture unit 1
 * - `uTime` — elapsed seconds; drives drift
 * - `uFogDensity` — 0..1; 0 hides the effect, 1 fully obscures
 * - `uFogColor` — RGB tint 0..1
 */
export const HAAR_FOG_FRAG = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform sampler2D uMainSampler2;
uniform float uTime;
uniform float uFogDensity;
uniform vec3 uFogColor;

varying vec2 outTexCoord;

void main() {
  vec2 uv = outTexCoord;

  float n1 = texture2D(uMainSampler2, uv * 0.5 + vec2(uTime * 0.02, 0.0)).r;
  float n2 = texture2D(uMainSampler2, uv * 0.3 + vec2(0.0, -uTime * 0.015)).r;
  float fog = clamp((n1 * 0.6 + n2 * 0.4) * uFogDensity, 0.0, 1.0);

  vec4 scene = texture2D(uMainSampler, uv);
  gl_FragColor = mix(scene, vec4(uFogColor, 1.0), fog);
}
`;

export interface HaarState {
  density: number;
  color: [number, number, number];
  time: number;
}

export const DEFAULT_HAAR_STATE: Readonly<HaarState> = Object.freeze({
  density: 0,
  color: [0.9, 0.9, 0.95] as [number, number, number],
  time: 0,
});

export function makeHaarState(overrides: Partial<HaarState> = {}): HaarState {
  const base: HaarState = {
    density: DEFAULT_HAAR_STATE.density,
    color: [
      DEFAULT_HAAR_STATE.color[0],
      DEFAULT_HAAR_STATE.color[1],
      DEFAULT_HAAR_STATE.color[2],
    ],
    time: DEFAULT_HAAR_STATE.time,
  };
  if (overrides.density !== undefined) base.density = overrides.density;
  if (overrides.color !== undefined) base.color = [overrides.color[0], overrides.color[1], overrides.color[2]];
  if (overrides.time !== undefined) base.time = overrides.time;
  return base;
}

export function clampHaarDensity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export type SetUniformFn = (name: string, value: number | number[]) => void;

export function applyHaarUniforms(state: HaarState, setUniform: SetUniformFn): void {
  setUniform('uTime', state.time);
  setUniform('uFogDensity', clampHaarDensity(state.density));
  setUniform('uFogColor', [state.color[0], state.color[1], state.color[2]]);
}
