import { describe, expect, it, vi } from 'vitest';
import {
  ACTION_KEYS,
  DEFAULT_GAMEPAD_BINDINGS,
  DEFAULT_KEYBINDINGS,
  type ActionKey,
  type GamepadBinding,
  type KeyBinding,
} from '../core/actions';
import {
  buildCaptureModeActions,
  buildSettingsInputDomFocusActions,
  composeCaptureAnnouncement,
  composeSlotLabel,
  settingsInputSlotId,
  type SettingsInputActionLabels,
  type SettingsInputDomActionInput,
} from './settingsInputDomFocusActions';

const CHROME: SettingsInputActionLabels = {
  action: 'Action',
  primary: 'primary',
  secondary: 'secondary',
  keyboard: 'keyboard',
  gamepad: 'gamepad',
  unbound: 'unbound',
  gamepadPrefix: 'Button',
  reset: 'Reset to defaults',
  back: 'BACK',
  captureKeyboard: 'Press a key for {row}. Escape to cancel.',
  captureGamepad: 'Press a button for {row}. Escape to cancel.',
};

const LABELS: Record<ActionKey, string> = {
  moveUp: 'Move up',
  moveDown: 'Move down',
  moveLeft: 'Move left',
  moveRight: 'Move right',
  dash: 'Dash',
  pause: 'Pause',
  stanceToggle: 'Stance cycle',
  shintyParry: 'Shinty parry',
  whiskyBreath: 'Whisky Breath',
  driftMastery: 'Drift Mastery',
};

const FORMAT_KEY_CODE = (code: string): string => {
  if (code.length === 4 && code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Arrow')) return code.slice(5);
  if (code === 'Space') return 'Space';
  if (code === 'Escape') return 'Esc';
  return code;
};

function buildBaseInput(overrides: {
  keyBindings?: Partial<Record<ActionKey, KeyBinding>>;
  gamepadBindings?: Partial<Record<ActionKey, GamepadBinding>>;
} = {}): SettingsInputDomActionInput {
  const keyBindings = { ...structuredClone(DEFAULT_KEYBINDINGS), ...(overrides.keyBindings ?? {}) };
  const gamepadBindings = {
    ...structuredClone(DEFAULT_GAMEPAD_BINDINGS),
    ...(overrides.gamepadBindings ?? {}),
  };
  return {
    actions: ACTION_KEYS,
    keyBindings,
    gamepadBindings,
    labels: LABELS,
    chrome: CHROME,
    formatKeyCode: FORMAT_KEY_CODE,
    onActivateSlot: () => undefined,
    onActivateReset: () => undefined,
    onActivateBack: () => undefined,
  };
}

describe('settingsInputSlotId', () => {
  it('encodes action + slot + kind into a stable id', () => {
    expect(settingsInputSlotId('moveUp', 'primary', 'keyboard'))
      .toBe('settings-input-moveUp-primary-keyboard');
    expect(settingsInputSlotId('dash', 'secondary', 'gamepad'))
      .toBe('settings-input-dash-secondary-gamepad');
  });
});

describe('composeSlotLabel', () => {
  it('folds action + primary keyboard binding into a single label', () => {
    const input = buildBaseInput();
    expect(composeSlotLabel(input, 'moveUp', 'primary', 'keyboard'))
      .toBe('Move up — primary keyboard — Up');
  });

  it('folds action + secondary keyboard binding into a single label', () => {
    const input = buildBaseInput();
    expect(composeSlotLabel(input, 'moveUp', 'secondary', 'keyboard'))
      .toBe('Move up — secondary keyboard — W');
  });

  it('renders unbound when the keyboard slot is empty', () => {
    const input = buildBaseInput({
      keyBindings: { dash: { primary: 'Space' } },
    });
    expect(composeSlotLabel(input, 'dash', 'secondary', 'keyboard'))
      .toBe('Dash — secondary keyboard — unbound');
  });

  it('folds gamepad button index into the label with the configured prefix', () => {
    const input = buildBaseInput();
    expect(composeSlotLabel(input, 'dash', 'primary', 'gamepad'))
      .toBe('Dash — primary gamepad — Button 0');
    expect(composeSlotLabel(input, 'dash', 'secondary', 'gamepad'))
      .toBe('Dash — secondary gamepad — Button 7');
  });

  it('renders unbound when the gamepad slot is empty', () => {
    const input = buildBaseInput({
      gamepadBindings: { pause: { primary: 9 } },
    });
    expect(composeSlotLabel(input, 'pause', 'secondary', 'gamepad'))
      .toBe('Pause — secondary gamepad — unbound');
  });

  it('renders unbound when the action has no gamepad binding at all', () => {
    const input = buildBaseInput();
    // moveUp has no default gamepad binding — both slots should announce
    // as unbound rather than throw.
    expect(composeSlotLabel(input, 'moveUp', 'primary', 'gamepad'))
      .toBe('Move up — primary gamepad — unbound');
    expect(composeSlotLabel(input, 'moveUp', 'secondary', 'gamepad'))
      .toBe('Move up — secondary gamepad — unbound');
  });
});

describe('composeCaptureAnnouncement', () => {
  it('substitutes the row description into the keyboard prompt template', () => {
    expect(
      composeCaptureAnnouncement({
        action: 'moveUp',
        slot: 'primary',
        kind: 'keyboard',
        actionLabel: 'Move up',
        chrome: CHROME,
      }),
    ).toBe('Press a key for Move up primary keyboard. Escape to cancel.');
  });

  it('substitutes the row description into the gamepad prompt template', () => {
    expect(
      composeCaptureAnnouncement({
        action: 'dash',
        slot: 'secondary',
        kind: 'gamepad',
        actionLabel: 'Dash',
        chrome: CHROME,
      }),
    ).toBe('Press a button for Dash secondary gamepad. Escape to cancel.');
  });
});

describe('buildSettingsInputDomFocusActions', () => {
  it('emits two keyboard slots per action plus terminal Reset + Back', () => {
    const input = buildBaseInput();
    const actions = buildSettingsInputDomFocusActions(input);
    // 10 actions × 2 keyboard slots = 20; dash + pause add 2 gamepad slots
    // each = 4; plus reset + back = 26 total.
    expect(actions).toHaveLength(20 + 4 + 2);
  });

  it('orders rows as ACTION_KEYS × {primary, secondary} × {keyboard, gamepad}', () => {
    const input = buildBaseInput();
    const actions = buildSettingsInputDomFocusActions(input);
    const ids = actions.map((a) => a.id);
    expect(ids).toEqual([
      'settings-input-moveUp-primary-keyboard',
      'settings-input-moveUp-secondary-keyboard',
      'settings-input-moveDown-primary-keyboard',
      'settings-input-moveDown-secondary-keyboard',
      'settings-input-moveLeft-primary-keyboard',
      'settings-input-moveLeft-secondary-keyboard',
      'settings-input-moveRight-primary-keyboard',
      'settings-input-moveRight-secondary-keyboard',
      'settings-input-dash-primary-keyboard',
      'settings-input-dash-secondary-keyboard',
      'settings-input-dash-primary-gamepad',
      'settings-input-dash-secondary-gamepad',
      'settings-input-pause-primary-keyboard',
      'settings-input-pause-secondary-keyboard',
      'settings-input-pause-primary-gamepad',
      'settings-input-pause-secondary-gamepad',
      'settings-input-stanceToggle-primary-keyboard',
      'settings-input-stanceToggle-secondary-keyboard',
      'settings-input-shintyParry-primary-keyboard',
      'settings-input-shintyParry-secondary-keyboard',
      'settings-input-whiskyBreath-primary-keyboard',
      'settings-input-whiskyBreath-secondary-keyboard',
      'settings-input-driftMastery-primary-keyboard',
      'settings-input-driftMastery-secondary-keyboard',
      'settings-input-reset',
      'settings-input-back',
    ]);
  });

  it('skips gamepad slots for actions without a default gamepad binding', () => {
    const input = buildBaseInput();
    const actions = buildSettingsInputDomFocusActions(input);
    const ids = actions.map((a) => a.id);
    // Movement keys have no default gamepad binding — no gamepad rows
    // should appear for any of them.
    for (const action of ['moveUp', 'moveDown', 'moveLeft', 'moveRight'] as const) {
      expect(ids).not.toContain(`settings-input-${action}-primary-gamepad`);
      expect(ids).not.toContain(`settings-input-${action}-secondary-gamepad`);
    }
  });

  it('emits the configured Reset + Back labels on the trailing rows', () => {
    const input = buildBaseInput();
    const actions = buildSettingsInputDomFocusActions(input);
    expect(actions[actions.length - 2]?.id).toBe('settings-input-reset');
    expect(actions[actions.length - 2]?.label).toBe('Reset to defaults');
    expect(actions[actions.length - 1]?.id).toBe('settings-input-back');
    expect(actions[actions.length - 1]?.label).toBe('BACK');
  });

  it('routes slot activation to onActivateSlot with the matching tuple', () => {
    const onActivateSlot = vi.fn();
    const input = { ...buildBaseInput(), onActivateSlot };
    const actions = buildSettingsInputDomFocusActions(input);
    const target = actions.find(
      (a) => a.id === 'settings-input-dash-primary-gamepad',
    );
    expect(target).toBeDefined();
    target!.onActivate();
    expect(onActivateSlot).toHaveBeenCalledOnce();
    expect(onActivateSlot).toHaveBeenCalledWith('dash', 'primary', 'gamepad');
  });

  it('routes Reset + Back activation to their dedicated callbacks', () => {
    const onActivateReset = vi.fn();
    const onActivateBack = vi.fn();
    const input = { ...buildBaseInput(), onActivateReset, onActivateBack };
    const actions = buildSettingsInputDomFocusActions(input);
    actions[actions.length - 2]!.onActivate();
    actions[actions.length - 1]!.onActivate();
    expect(onActivateReset).toHaveBeenCalledOnce();
    expect(onActivateBack).toHaveBeenCalledOnce();
  });

  it('renders unbound slots without throwing and preserves row count', () => {
    const input = buildBaseInput({
      keyBindings: {
        moveUp: { primary: '' },
      } as unknown as Partial<Record<ActionKey, KeyBinding>>,
    });
    const actions = buildSettingsInputDomFocusActions(input);
    const moveUpPrimary = actions.find(
      (a) => a.id === 'settings-input-moveUp-primary-keyboard',
    );
    expect(moveUpPrimary?.label).toBe('Move up — primary keyboard — unbound');
    // Row count unchanged regardless of binding emptiness.
    expect(actions).toHaveLength(20 + 4 + 2);
  });
});

describe('buildCaptureModeActions', () => {
  it('returns a single capture-mode action with the composed announcement', () => {
    const actions = buildCaptureModeActions({
      action: 'moveUp',
      slot: 'primary',
      kind: 'keyboard',
      actionLabel: 'Move up',
      chrome: CHROME,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0]!.id).toBe('settings-input-capture');
    expect(actions[0]!.label).toBe(
      'Press a key for Move up primary keyboard. Escape to cancel.',
    );
  });

  it('capture-mode action onActivate is a noop (real input resolves capture)', () => {
    const actions = buildCaptureModeActions({
      action: 'pause',
      slot: 'secondary',
      kind: 'gamepad',
      actionLabel: 'Pause',
      chrome: CHROME,
    });
    // Spec contract: activation must not throw and must not mutate any
    // shared state — the actual capture resolver lives on the scene's
    // keyboard / gamepad handlers.
    expect(() => actions[0]!.onActivate()).not.toThrow();
  });
});
