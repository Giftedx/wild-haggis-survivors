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

  it('create() phase 2 wires the token after replay mode is known', () => {
    // The run-start sequence (variant → replay bridge → assist token →
    // Player) lives in the `installPlayerAndRunStart` phase helper since
    // the GameScene facade decomposition. The ordering invariant the
    // assist token depends on — replay mode resolved BEFORE the token is
    // applied, token applied BEFORE the Player is constructed — is
    // asserted at the code's home.
    const source = readFileSync('src/scenes/game/installPlayerAndRunStart.ts', 'utf8');

    expect(source).toContain("import { getAssistModeGameSpeed } from '../../systems/accessibility/AssistMode';");
    expect(source).toContain("import { applyAssistGameSpeedToken } from '../../systems/accessibility/assistGameSpeed';");

    const replayInstallIndex = source.indexOf('installReplayPlayback({');
    const applyIndex = source.indexOf('applyAssistGameSpeedToken(scene.timeManager');
    const playerIndex = source.indexOf('scene.player = new Player(');

    expect(replayInstallIndex).toBeGreaterThan(-1);
    expect(applyIndex).toBeGreaterThan(replayInstallIndex);
    expect(playerIndex).toBeGreaterThan(applyIndex);
  });
});
