import { describe, expect, it, vi } from 'vitest';
import { buildPauseMenuDomFocusActions } from './pauseMenuDomFocusActions';

function baseInput() {
  return {
    showWhiskyDram: false,
    whiskyDramLabel: 'Use dram',
    onWhiskyDram: vi.fn(),
    showFingalsHorn: false,
    fingalsHornLabel: 'Sound horn',
    onFingalsHorn: vi.fn(),
    resumeLabel: 'Resume',
    onResume: vi.fn(),
    sfxLabel: 'SFX: On',
    onToggleSfx: vi.fn(),
    musicLabel: 'Music: Off',
    onToggleMusic: vi.fn(),
    showSaveClip: false,
    saveClipLabel: 'Save clip',
    onSaveClip: vi.fn(),
    showSaveScreenshot: false,
    saveScreenshotLabel: 'Save screenshot',
    onSaveScreenshot: vi.fn(),
    quitLabel: 'End run',
    onQuit: vi.fn(),
  };
}

describe('buildPauseMenuDomFocusActions', () => {
  it('minimal panel: resume, audio toggles, quit', () => {
    const actions = buildPauseMenuDomFocusActions(baseInput());
    expect(actions.map((a) => a.id)).toEqual([
      'pause-resume',
      'pause-toggle-sfx',
      'pause-toggle-music',
      'pause-quit',
    ]);
  });

  it('prepends relic rows when enabled', () => {
    const actions = buildPauseMenuDomFocusActions({
      ...baseInput(),
      showWhiskyDram: true,
      showFingalsHorn: true,
    });
    expect(actions.map((a) => a.id)).toEqual([
      'pause-whisky-dram',
      'pause-fingals-horn',
      'pause-resume',
      'pause-toggle-sfx',
      'pause-toggle-music',
      'pause-quit',
    ]);
  });

  it('inserts capture rows before quit when enabled', () => {
    const actions = buildPauseMenuDomFocusActions({
      ...baseInput(),
      showSaveClip: true,
      showSaveScreenshot: true,
    });
    expect(actions.map((a) => a.id)).toEqual([
      'pause-resume',
      'pause-toggle-sfx',
      'pause-toggle-music',
      'pause-save-clip',
      'pause-save-screenshot',
      'pause-quit',
    ]);
  });

  it('wires onActivate to provided handlers', () => {
    const input = baseInput();
    const actions = buildPauseMenuDomFocusActions(input);
    actions[0]!.onActivate();
    actions[1]!.onActivate();
    actions[3]!.onActivate();
    expect(input.onResume).toHaveBeenCalledTimes(1);
    expect(input.onToggleSfx).toHaveBeenCalledTimes(1);
    expect(input.onQuit).toHaveBeenCalledTimes(1);
  });
});
