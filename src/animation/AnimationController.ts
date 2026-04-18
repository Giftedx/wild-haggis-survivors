/**
 * Per-entity animation state + frame-index owner.
 *
 * Reads game signals via `tick(scaledDelta, signals)`. Evaluates state
 * transitions through the pure `animationStates` FSM. Advances frame
 * index through the pure `frameClock`. Calls `sprite.setTexture(key)`
 * on state or frame change — that's the only Phaser coupling in the
 * hot path.
 *
 * Replay determinism: all inputs are pure data (signals + scaledDelta);
 * controller state is a pure function of its history.
 */

import type { AnimationState, AnimationSignals } from './animationStates';
import { evaluateAnimationState } from './animationStates';
import { advanceFrameClock } from './frameClock';
import { atlasKey } from './textureAtlas';

export interface AnimationControllerInit {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly subject: string;
  readonly variant: string | null;
}

export class AnimationController {
  private state: AnimationState = 'idle';
  private frameIndex = 0;
  private accMs = 0;

  constructor(private readonly init: AnimationControllerInit) {
    // Bind initial texture so the sprite has something to render on frame 0.
    this.applyTexture();
  }

  getState(): AnimationState {
    return this.state;
  }

  getFrame(): number {
    return this.frameIndex;
  }

  tick(scaledDelta: number, signals: AnimationSignals): void {
    const nextState = evaluateAnimationState(this.state, signals);
    if (nextState !== this.state) {
      this.state = nextState;
      this.frameIndex = 0;
      this.accMs = 0;
      this.applyTexture();
      return;
    }
    const advanced = advanceFrameClock({
      accMs: this.accMs,
      frameIndex: this.frameIndex,
      state: this.state,
      scaledDelta,
    });
    this.accMs = advanced.accMs;
    if (advanced.frameIndex !== this.frameIndex) {
      this.frameIndex = advanced.frameIndex;
      this.applyTexture();
    }
  }

  private applyTexture(): void {
    const key = atlasKey(
      this.init.subject,
      this.init.variant,
      this.state,
      this.frameIndex,
    );
    this.init.sprite.setTexture(key);
  }
}
