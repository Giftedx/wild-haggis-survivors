import type { DomFocusAction } from '../../ui/domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for PauseMenu (in-run pause overlay).
 *
 * Pure helper: builds `DomFocusAction[]` for `createDomFocusLayer`. Caller
 * supplies resolved display strings (`t(...)` results) for labels so this
 * module stays Phaser-free and Vitest-friendly.
 *
 * Order matches the pause panel top-to-bottom: optional active-relic rows
 * (Whisky Dram, Fingal's Horn), Resume, SFX toggle, Music toggle, optional
 * Save clip / Save screenshot, Quit.
 */
export interface PauseMenuDomFocusInput {
  readonly showWhiskyDram: boolean;
  readonly whiskyDramLabel: string;
  readonly onWhiskyDram: () => void;
  readonly showFingalsHorn: boolean;
  readonly fingalsHornLabel: string;
  readonly onFingalsHorn: () => void;
  readonly resumeLabel: string;
  readonly onResume: () => void;
  readonly sfxLabel: string;
  readonly onToggleSfx: () => void;
  readonly musicLabel: string;
  readonly onToggleMusic: () => void;
  readonly showSaveClip: boolean;
  readonly saveClipLabel: string;
  readonly onSaveClip: () => void;
  readonly showSaveScreenshot: boolean;
  readonly saveScreenshotLabel: string;
  readonly onSaveScreenshot: () => void;
  readonly quitLabel: string;
  readonly onQuit: () => void;
}

export function buildPauseMenuDomFocusActions(input: PauseMenuDomFocusInput): DomFocusAction[] {
  const actions: DomFocusAction[] = [];
  if (input.showWhiskyDram) {
    actions.push({
      id: 'pause-whisky-dram',
      label: input.whiskyDramLabel,
      onActivate: input.onWhiskyDram,
    });
  }
  if (input.showFingalsHorn) {
    actions.push({
      id: 'pause-fingals-horn',
      label: input.fingalsHornLabel,
      onActivate: input.onFingalsHorn,
    });
  }
  actions.push(
    { id: 'pause-resume', label: input.resumeLabel, onActivate: input.onResume },
    { id: 'pause-toggle-sfx', label: input.sfxLabel, onActivate: input.onToggleSfx },
    { id: 'pause-toggle-music', label: input.musicLabel, onActivate: input.onToggleMusic },
  );
  if (input.showSaveClip) {
    actions.push({
      id: 'pause-save-clip',
      label: input.saveClipLabel,
      onActivate: input.onSaveClip,
    });
  }
  if (input.showSaveScreenshot) {
    actions.push({
      id: 'pause-save-screenshot',
      label: input.saveScreenshotLabel,
      onActivate: input.onSaveScreenshot,
    });
  }
  actions.push({
    id: 'pause-quit',
    label: input.quitLabel,
    onActivate: input.onQuit,
  });
  return actions;
}
