import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const { settingsLoadMock } = vi.hoisted(() => ({
  settingsLoadMock: vi.fn(() => ({ telemetryOptIn: true })),
}));

vi.mock('./SettingsManager', () => ({
  getSettingsManager: () => ({ load: settingsLoadMock }),
}));

import { AnalyticsManager, type IAnalyticsProvider, resetAnalyticsManagerForTests } from './AnalyticsManager';
import { globalEventBus } from './GlobalEventBus';

describe('AnalyticsManager', () => {
  let provider: IAnalyticsProvider;
  let mgr: AnalyticsManager;

  beforeEach(() => {
    resetAnalyticsManagerForTests();
    settingsLoadMock.mockReturnValue({ telemetryOptIn: true });
    provider = {
      logEvent: vi.fn(),
      triggerGameplayStart: vi.fn(),
      triggerGameplayStop: vi.fn(),
    };
    mgr = new AnalyticsManager(provider);
    mgr.ensureBusHandlersStarted();
  });

  afterEach(() => {
    mgr.stopBusHandlers();
  });

  it('forwards boss kills from the global bus with enemy metadata', () => {
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'taxman',
      xpValue: 200,
      wasBoss: true,
      wasElite: false,
    });
    expect(provider.logEvent).toHaveBeenCalledWith(
      'boss_kill',
      expect.objectContaining({
        enemyKey: 'taxman',
        wasElite: false,
        xpValue: 200,
      })
    );
  });

  it('ignores non-boss kills on the global bus', () => {
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'tourist',
      xpValue: 1,
      wasBoss: false,
      wasElite: false,
    });
    expect(provider.logEvent).not.toHaveBeenCalled();
  });

  it('logs elite_affix_kill when an affixed elite dies and telemetry opt-in is on', () => {
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'tourist',
      xpValue: 30,
      wasBoss: false,
      wasElite: true,
      eliteAffixId: 'volatile',
    });
    expect(provider.logEvent).toHaveBeenCalledWith(
      'elite_affix_kill',
      { eliteAffixId: 'volatile', enemyKey: 'tourist' },
    );
  });

  it('skips elite_affix_kill when telemetry opt-in is off', () => {
    settingsLoadMock.mockReturnValue({ telemetryOptIn: false });
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'chef',
      xpValue: 20,
      wasBoss: false,
      wasElite: true,
      eliteAffixId: 'swift',
    });
    expect(provider.logEvent).not.toHaveBeenCalled();
  });

  it('logs run_end when GLOBAL_RUN_ENDED fires and telemetry opt-in is on', () => {
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death',
      gameTimeSec: 120,
      enemiesKilled: 400,
    });
    expect(provider.logEvent).toHaveBeenCalledWith(
      'run_end',
      expect.objectContaining({
        outcome: 'death',
        gameTimeSec: 120,
        enemiesKilled: 400,
      })
    );
  });

  it('logs tutorial_completed when TUTORIAL_COMPLETED fires', () => {
    globalEventBus.emit('TUTORIAL_COMPLETED', {});
    expect(provider.logEvent).toHaveBeenCalledWith('tutorial_completed', {});
  });

  it('pairs gameplayStart and gameplayStop across a session', () => {
    mgr.beginGameplaySession({ variantKey: 'classic' });
    expect(provider.triggerGameplayStart).toHaveBeenCalledTimes(1);
    expect(provider.logEvent).toHaveBeenCalledWith('run_start', { variantKey: 'classic' });
    mgr.endGameplaySession();
    expect(provider.triggerGameplayStop).toHaveBeenCalledTimes(1);
  });

  it('skips run_start and run_end when telemetry opt-in is off', () => {
    settingsLoadMock.mockReturnValue({ telemetryOptIn: false });
    mgr.beginGameplaySession({ variantKey: 'classic' });
    expect(provider.triggerGameplayStart).toHaveBeenCalledTimes(1);

    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory',
      gameTimeSec: 60,
      enemiesKilled: 10,
    });
    expect(provider.logEvent).not.toHaveBeenCalled();
  });

  it('still logs boss_kill when telemetry opt-in is off', () => {
    settingsLoadMock.mockReturnValue({ telemetryOptIn: false });
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'taxman',
      xpValue: 200,
      wasBoss: true,
      wasElite: false,
    });
    expect(provider.logEvent).toHaveBeenCalledWith(
      'boss_kill',
      expect.objectContaining({
        enemyKey: 'taxman',
        wasElite: false,
        xpValue: 200,
      }),
    );
  });

  it('still logs tutorial_completed when telemetry opt-in is off', () => {
    settingsLoadMock.mockReturnValue({ telemetryOptIn: false });
    globalEventBus.emit('TUTORIAL_COMPLETED', {});
    expect(provider.logEvent).toHaveBeenCalledWith('tutorial_completed', {});
  });
});
