import type { TimeManager } from '../TimeManager';
import type { ReplayBridgeMode } from '../../scenes/game/replayBridgeInstall';

export const ASSIST_GAME_SPEED_TOKEN = 'ASSIST_GAME_SPEED';

export interface AssistGameSpeedTokenInput {
  speed: number;
  replayMode: ReplayBridgeMode;
}

function clampAssistGameSpeed(speed: number): number {
  if (!Number.isFinite(speed)) return 1;
  return Math.min(1, Math.max(0.5, speed));
}

/**
 * Wire hidden Assist Mode game-speed into the global TimeManager ladder.
 *
 * Replay record/playback deliberately force this token off: T1 replays
 * assume the fixed-step Arcade integrator runs at the normal scene time
 * scale, and Assist settings are already snapshotted for replay honesty.
 */
export function applyAssistGameSpeedToken(
  timeManager: Pick<TimeManager, 'request' | 'release'>,
  input: AssistGameSpeedTokenInput,
): void {
  const speed = clampAssistGameSpeed(input.speed);
  if (input.replayMode !== 'off' || speed >= 1) {
    timeManager.release(ASSIST_GAME_SPEED_TOKEN);
    return;
  }

  timeManager.request(ASSIST_GAME_SPEED_TOKEN, { timeScale: speed });
}
