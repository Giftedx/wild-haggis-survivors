/**
 * Minimal input contract Player / GameScene consume.
 *
 * Live play is driven by `InputManager` (keyboard + gamepad + virtual
 * joystick). Replay playback is driven by `ReplayInput` (reads a recorded
 * `ReplayBlob`). Both implement this interface — Player accepts either
 * via DI so swapping is a one-line GameScene change.
 *
 * Methods mirror the read surface Player already used against the
 * concrete `InputManager`. `peekReplayFrame` is kept here so a future
 * "record while replaying" mode (ghost re-recording) doesn't need a
 * separate read path.
 */
export interface IInput {
  /** Normalized direction vector, length ≤ 1. Zero = no input. */
  getDirection(): { x: number; y: number };

  /**
   * Dash edge. Returns `true` at most once per tick — callers consume
   * the edge, subsequent polls in the same tick return `false`.
   */
  consumeDashPressed(): boolean;

  /** Menu-pause edge (gamepad Start / Options). Same once-per-tick semantic. */
  consumeMenuPausePressed(): boolean;

  /**
   * T1 replay — snapshot of this tick's input for the recorder.
   * Clears dash/menu edge flags on read so one tap per frame is cheap.
   */
  peekReplayFrame(): { dx: number; dy: number; dash: boolean; menu: boolean };

  /** Tear down any listeners / Phaser display objects owned by the source. */
  destroy(): void;
}
