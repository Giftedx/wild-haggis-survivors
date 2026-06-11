import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, setLocale } from '../../core/i18n';
import type { DeathCause } from '../../core/deathCauseClassifier';
import type { GameOverPayload } from '../gameOverPayload';
import {
  buildGameOverWeeTaleLine,
  buildWeeTaleContextFromPayload,
  resolveWeeTaleDisplayNames,
} from './gameOverWeeTaleLine';

function payload(overrides: Partial<GameOverPayload> = {}): GameOverPayload {
  return {
    mode: 'death',
    isVictory: false,
    summary: {
      timeSurvivedSec: 754,
      enemiesKilled: 42,
      goldEarned: 0,
      bossGold: 0,
      coinGold: 0,
    } as GameOverPayload['summary'],
    runResult: {} as GameOverPayload['runResult'],
    xpLevel: 1,
    bossKillCount: 0,
    ownedPassiveCount: 0,
    weaponCount: 1,
    evolvedCount: 0,
    buildSummary: '',
    variantLabel: 'Classic',
    variantKey: 'classic',
    weaponDamage: {},
    runSeed: 0x12345678,
    bossKilledKeys: [],
    biomesVisited: ['bog'],
    ...overrides,
  };
}

describe('game-over Wee Tale line composition', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE));

  it('builds the same tale for the same seed and payload context', () => {
    const run = payload({
      mode: 'victory',
      isVictory: true,
      runSeed: 0xdeadbeef,
      summary: { timeSurvivedSec: 1500 } as GameOverPayload['summary'],
      bossKilledKeys: ['gordon', 'tour_bus', 'taxman'],
      name: 'Cailleach Bheag',
      variantKey: 'cailleach',
      variantLabel: 'Cailleach',
    });

    expect(buildGameOverWeeTaleLine(run)).toEqual(buildGameOverWeeTaleLine({ ...run }));
  });

  it('threads salient GameOverPayload fields into the Wee Tale context', () => {
    const deathCause = { sourceKey: 'auld_reekie' } as DeathCause;
    const ctx = buildWeeTaleContextFromPayload(payload({
      deathCause,
      bossKilledKeys: ['gordon', 'auld_reekie'],
      biomesVisited: ['glasgow_close'],
      curseKey: 'heavy_legs',
      ironmoor: true,
      postBellSec: 90,
      name: 'Wee Archivist',
    }));

    expect(ctx.deathSourceKey).toBe('auld_reekie');
    expect(ctx.bossesKilled).toEqual(['gordon', 'auld_reekie']);
    expect(ctx.biomes).toEqual(['glasgow_close']);
    expect(ctx.curseKey).toBe('heavy_legs');
    expect(ctx.ironmoor).toBe(true);
    expect(ctx.postBellSec).toBe(90);
    expect(ctx.runName).toBe('Wee Archivist');
  });

  it('resolves raw enemy and variant keys before footer interpolation', () => {
    const params = resolveWeeTaleDisplayNames(
      { boss: 'auld_reekie', source: 'tour_bus', variant: 'cailleach', time: '12:34' },
      payload({ variantKey: 'cailleach', variantLabel: 'Cailleach' }),
    );

    expect(params.boss).toBe('The Auld Reekie Ghaist');
    expect(params.source).toBe('Tour Bus');
    expect(params.variant).toBe('Cailleach');
  });

  it('falls back to the variant definition when a legacy payload omits variantLabel', () => {
    const params = resolveWeeTaleDisplayNames(
      { variant: 'cailleach' },
      { ...payload({ variantKey: 'cailleach' }), variantLabel: undefined } as unknown as GameOverPayload,
    );

    expect(params.variant).toContain('The Cailleach');
    expect(params.variant).not.toBe('cailleach');
  });

  it('renders a salient boss tale as player-facing prose, not a raw key or i18n path', () => {
    const run = payload({
      deathCause: { sourceKey: 'auld_reekie' } as DeathCause,
      bossKilledKeys: ['auld_reekie'],
      postBellSec: 30,
      runSeed: 0,
      summary: { timeSurvivedSec: 1110 } as GameOverPayload['summary'],
    });

    const line = buildGameOverWeeTaleLine(run);

    expect(line).not.toBeNull();
    expect(line!.line).not.toContain('ui.weeTale');
    expect(line!.line).not.toContain('auld_reekie');
    expect(line!.line).not.toMatch(/\{(?:time|boss|source|variant|name)\}/);
  });

  it('uses the active locale while preserving the same deterministic template key', () => {
    const run = payload({
      runSeed: 0xcafebabe,
      name: 'Wee Test',
      summary: { timeSurvivedSec: 400 } as GameOverPayload['summary'],
    });

    setLocale('en');
    const en = buildGameOverWeeTaleLine(run);
    setLocale('scs');
    const scs = buildGameOverWeeTaleLine(run);

    expect(en).not.toBeNull();
    expect(scs).not.toBeNull();
    expect(scs!.i18nKey).toBe(en!.i18nKey);
    expect(scs!.line).not.toBe(en!.line);
    expect(scs!.line).not.toContain('ui.weeTale');
  });
});
