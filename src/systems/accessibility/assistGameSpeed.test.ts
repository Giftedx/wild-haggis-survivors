import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { applyAssistGameSpeedToken, ASSIST_GAME_SPEED_TOKEN } from './assistGameSpeed';
import type { ReplayBridgeMode } from '../../scenes/game/replayBridgeInstall';

function makeTimeManager() {
  return {
    request: vi.fn(),
    release: vi.fn(),
  };
}

describe('assist game speed TimeManager token', () => {
  it('requests a permanent timeScale token only for non-replay slow speeds', () => {
    const tm = makeTimeManager();

    applyAssistGameSpeedToken(tm, { speed: 0.5, replayMode: 'off' });

    expect(tm.request).toHaveBeenCalledWith(ASSIST_GAME_SPEED_TOKEN, { timeScale: 0.5 });
    expect(tm.release).not.toHaveBeenCalled();
  });

  it('releases the token at neutral speed', () => {
    const tm = makeTimeManager();

    applyAssistGameSpeedToken(tm, { speed: 1, replayMode: 'off' });

    expect(tm.release).toHaveBeenCalledWith(ASSIST_GAME_SPEED_TOKEN);
    expect(tm.request).not.toHaveBeenCalled();
  });

  it.each(['record', 'playback'] satisfies ReplayBridgeMode[])('does not alter replay %s runs', (replayMode) => {
    const tm = makeTimeManager();

    applyAssistGameSpeedToken(tm, { speed: 0.5, replayMode });

    expect(tm.release).toHaveBeenCalledWith(ASSIST_GAME_SPEED_TOKEN);
    expect(tm.request).not.toHaveBeenCalled();
  });

  it('clamps malformed direct-save speeds to the supported range before requesting', () => {
    const low = makeTimeManager();
    applyAssistGameSpeedToken(low, { speed: 0.1, replayMode: 'off' });
    expect(low.request).toHaveBeenCalledWith(ASSIST_GAME_SPEED_TOKEN, { timeScale: 0.5 });

    const high = makeTimeManager();
    applyAssistGameSpeedToken(high, { speed: 42, replayMode: 'off' });
    expect(high.release).toHaveBeenCalledWith(ASSIST_GAME_SPEED_TOKEN);
    expect(high.request).not.toHaveBeenCalled();
  });

  it('GameScene wires the token after replay mode is known', () => {
    const source = readFileSync('src/scenes/GameScene.ts', 'utf8');

    expect(source).toContain("import { getAssistModeGameSpeed } from '../systems/accessibility/AssistMode';");
    expect(source).toContain("import { applyAssistGameSpeedToken } from '../systems/accessibility/assistGameSpeed';");

    const replayInstallIndex = source.indexOf('installReplayPlayback({');
    const applyIndex = source.indexOf('applyAssistGameSpeedToken(this.timeManager');
    const playerIndex = source.indexOf('this.player = new Player(');

    expect(replayInstallIndex).toBeGreaterThan(-1);
    expect(applyIndex).toBeGreaterThan(replayInstallIndex);
    expect(playerIndex).toBeGreaterThan(applyIndex);
  });
});
