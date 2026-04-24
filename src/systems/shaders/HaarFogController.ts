import * as Phaser from 'phaser';

import { clampHaarDensity, HAAR_FOG_SHADER_ID, makeHaarState, type HaarState } from './haarFog';

/**
 * Per-camera haar fog controller. Holds the current density / colour / time
 * state that `HaarFogRenderNode.setupUniforms` reads each frame. The
 * controller references the render node by id (`'HaarFog'`); Phaser resolves
 * the id against the game-config `renderNodes` map at draw time.
 *
 * Apply via `camera.filters.internal.add(new HaarFogController(camera))`.
 */
export class HaarFogController extends Phaser.Filters.Controller {
  public state: HaarState;

  constructor(camera: Phaser.Cameras.Scene2D.Camera, initial?: Partial<HaarState>) {
    super(camera, HAAR_FOG_SHADER_ID);
    this.state = makeHaarState(initial);
  }

  setDensity(density: number): this {
    this.state.density = clampHaarDensity(density);
    return this;
  }

  setColor(r: number, g: number, b: number): this {
    this.state.color = [r, g, b];
    return this;
  }

  setTime(seconds: number): this {
    this.state.time = seconds;
    return this;
  }

  advanceTime(deltaSeconds: number): this {
    this.state.time += deltaSeconds;
    return this;
  }
}
