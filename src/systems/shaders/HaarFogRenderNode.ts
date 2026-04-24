import * as Phaser from 'phaser';

import { applyHaarUniforms, HAAR_FOG_FRAG, HAAR_FOG_SHADER_ID, makeHaarState, type HaarState } from './haarFog';
import { NOISE_TEXTURE_KEY } from './shaders/uploadNoise';

/**
 * GPU-side haar fog shader. Subclasses Phaser 4's `BaseFilterShader` and
 * ships the fragment source + uniform-setup hooks; all state (density,
 * colour, elapsed time) lives on the controller and is read from there at
 * `setupUniforms` / `setupTextures` time.
 *
 * Registered by `registerAllShaders()` via the central `ShaderRegistry`; Phaser
 * instantiates this class once per game from the `renderNodes` config map.
 */
export class HaarFogRenderNode extends (Phaser.Renderer.WebGL.RenderNodes
  .BaseFilterShader as new (
  name: string,
  manager: Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager,
  fragmentShaderKey?: string,
  fragmentShaderSource?: string,
) => Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader) {
  constructor(manager: Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager) {
    super(HAAR_FOG_SHADER_ID, manager, undefined, HAAR_FOG_FRAG);
  }

  /**
   * Bind the shared noise texture to slot 1 (`uMainSampler2`). Slot 0 is the
   * scene input and is wired by Phaser automatically.
   *
   * Noise lives in the `shader:noise` TextureManager entry uploaded at scene
   * boot (see `uploadNoiseTexture`). If the entry is missing we leave slot 1
   * as whatever Phaser defaults to — the haar will render solid tint until the
   * texture lands.
   */
  setupTextures(
    _controller: Phaser.Filters.Controller,
    textures: Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper[],
    _drawingContext: Phaser.Renderer.WebGL.DrawingContext,
  ): void {
    const game = (this.manager as unknown as { game?: Phaser.Game })?.game;
    const noise = game?.textures?.get(NOISE_TEXTURE_KEY);
    const glTex = noise?.source?.[0]?.glTexture;
    if (glTex) {
      textures[1] = glTex as Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper;
    }
  }

  setupUniforms(
    controller: Phaser.Filters.Controller,
    _drawingContext: Phaser.Renderer.WebGL.DrawingContext,
  ): void {
    const state = readControllerState(controller);
    const setUniform = (this as unknown as { setUniform: (name: string, value: number | number[]) => void }).setUniform;
    applyHaarUniforms(state, setUniform);
  }
}

function readControllerState(controller: Phaser.Filters.Controller): HaarState {
  const anyController = controller as unknown as { state?: HaarState };
  return anyController.state ?? makeHaarState();
}
