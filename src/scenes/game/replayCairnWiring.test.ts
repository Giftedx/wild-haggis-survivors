import { describe, expect, it, vi } from 'vitest';
import type { GameScene } from '../GameScene';
import type { ReplayBlobAny } from '../../replay/replayBlob';
import { createEmptyReplayBlobV3 } from '../../replay/replayBlobV3';
import type { FallenCairn } from '../../utils/save/fallenCairns';
import { installReplayPlayback } from './replayBridgeInstall';
import { buildCairnSystemHooks } from './buildCairnSystemHooks';

vi.mock('../CairnBoonPickerScene', () => ({
  CairnBoonPickerScene: { KEY: 'CairnBoonPicker' },
}));

const recordedCairns: FallenCairn[] = [
  {
    x: 120,
    y: 240,
    cause: 'midgie',
    variantKey: 'classic',
    timeSurvivedMs: 30_000,
    inheritedStat: 'damage',
    savedAt: 1_000,
  },
  {
    x: 360,
    y: 480,
    cause: 'tour_bus',
    variantKey: 'wild',
    timeSurvivedMs: 60_000,
    inheritedStat: 'speed',
    savedAt: 2_000,
  },
];

describe('replay cairn wiring', () => {
  it('keeps the recorded cairn snapshot after pendingReplay is consumed', () => {
    const liveCairns: FallenCairn[] = [{
      x: 999,
      y: 999,
      cause: 'live_save_only',
      variantKey: 'classic',
      timeSurvivedMs: 90_000,
      inheritedStat: 'critChance',
      savedAt: 3_000,
    }];
    const scene: {
      pendingReplay: ReplayBlobAny | null;
      metaSaveManager: { getFallenCairns: () => FallenCairn[] };
    } = {
      pendingReplay: createEmptyReplayBlobV3({
        build: 'whs-test',
        seed: 42,
        variantKey: 'classic',
        cairns: recordedCairns,
      }),
      metaSaveManager: { getFallenCairns: () => liveCairns },
    };

    const playback = installReplayPlayback({
      pendingReplay: scene.pendingReplay,
      resolvedMode: 'off',
    });
    if (playback.consumePending) scene.pendingReplay = null;

    const hooks = buildCairnSystemHooks(scene as unknown as GameScene, {
      resumeRun: null,
      replayCairns: playback.replayCairns,
    });

    expect(scene.pendingReplay).toBeNull();
    expect(hooks.getCairns()).toEqual(recordedCairns);
  });
});
