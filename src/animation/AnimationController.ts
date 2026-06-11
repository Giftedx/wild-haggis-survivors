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
import { advanceFrameClock, getFrameCountForState } from './frameClock';
import { atlasKey } from './textureAtlas';

/**
 * Non-loop one-shot states that must play through before giving up the
 * frame clock to lower-priority transitions (walking/idle).
 */
const ONE_SHOT_STATES: ReadonlySet<AnimationState> = new Set([
  'attacking',
  'hurt',
  'celebrating',
  'dying',
]);

/**
 * Can `proposed` interrupt a live one-shot `current`? Only higher-priority
 * one-shots qualify: dying always wins; hurt interrupts attacking (but not
 * vice-versa). Lower-priority proposals (walking, idle, celebrating) have
 * to wait the one-shot out.
 */
function canInterruptOneShot(
  current: AnimationState,
  proposed: AnimationState,
): boolean {
  if (proposed === current) return false;
  if (proposed === 'dying') return true;
  if (current === 'attacking' && proposed === 'hurt') return true;
  return false;
}

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
    const proposed = evaluateAnimationState(this.state, signals);
    // Gate: a live one-shot plays through unless a higher-priority one-shot
    // forces the interrupt. Otherwise walking/idle would cut a 167 ms attack
    // lunge to a single frame every time the player moves while firing.
    const oneShotLive =
      ONE_SHOT_STATES.has(this.state) &&
      this.frameIndex < getFrameCountForState(this.state) - 1;
    const nextState =
      oneShotLive && !canInterruptOneShot(this.state, proposed)
        ? this.state
        : proposed;

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
