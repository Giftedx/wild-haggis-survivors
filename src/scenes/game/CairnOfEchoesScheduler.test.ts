import { describe, expect, it, vi } from 'vitest';
import { CairnOfEchoesScheduler, type CairnOfEchoesSchedulerHooks } from './CairnOfEchoesScheduler';
import {
  CAIRN_RENDER_RADIUS_PX,
  CAIRN_TOUCH_RADIUS_PX,
  type FallenCairn,
} from '../../utils/save/fallenCairns';

function makeCairn(x: number, y: number, savedAt: number): FallenCairn {
  return {
    x, y,
    cause: 'enemy_contact',
    variantKey: 'classic',
    timeSurvivedMs: 60_000,
    inheritedStat: 'damage',
    savedAt,
  };
}

function buildHooks(overrides: Partial<CairnOfEchoesSchedulerHooks> = {}): CairnOfEchoesSchedulerHooks {
  return {
    getCairns: () => [],
    getRngSample: () => 0.5,
    isFirstDeathTouchEver: () => false,
    getOldDroverRevealedCount: () => 0,
    onWalkOver: vi.fn(),
    onSpriteCreate: vi.fn(),
    onSpriteDestroy: vi.fn(),
    ...overrides,
  };
}

describe('CairnOfEchoesScheduler', () => {
  it('creates sprites for cairns within render radius', () => {
    const cairn = makeCairn(100, 100, 1);
    const onSpriteCreate = vi.fn();
    const scheduler = new CairnOfEchoesScheduler(buildHooks({ getCairns: () => [cairn], onSpriteCreate }));
    scheduler.load();
    scheduler.tick(0, 100, 100);
    expect(onSpriteCreate).toHaveBeenCalledWith(cairn);
  });

  it('does not create sprites beyond render radius', () => {
    const cairn = makeCairn(10_000, 10_000, 1);
    const onSpriteCreate = vi.fn();
    const scheduler = new CairnOfEchoesScheduler(buildHooks({ getCairns: () => [cairn], onSpriteCreate }));
    scheduler.load();
    scheduler.tick(0, 0, 0);
    expect(onSpriteCreate).not.toHaveBeenCalled();
  });

  it('destroys sprites when player exits render radius', () => {
    const cairn = makeCairn(100, 100, 1);
    const onSpriteCreate = vi.fn();
    const onSpriteDestroy = vi.fn();
    const scheduler = new CairnOfEchoesScheduler(buildHooks({ getCairns: () => [cairn], onSpriteCreate, onSpriteDestroy }));
    scheduler.load();
    scheduler.tick(0, 100, 100);
    scheduler.tick(16, CAIRN_RENDER_RADIUS_PX + 200, CAIRN_RENDER_RADIUS_PX + 200);
    expect(onSpriteDestroy).toHaveBeenCalledWith(cairn);
  });

  it('fires walk-over once per cairn per run', () => {
    const cairn = makeCairn(100, 100, 1);
    const onWalkOver = vi.fn();
    const scheduler = new CairnOfEchoesScheduler(buildHooks({ getCairns: () => [cairn], onWalkOver }));
    scheduler.load();
    scheduler.tick(0, 100, 100);
    scheduler.tick(16, 100, 100);
    scheduler.tick(32, 100, 100);
    expect(onWalkOver).toHaveBeenCalledTimes(1);
  });

  it('walk-over payload includes whisper result', () => {
    const cairn = makeCairn(100, 100, 1);
    const onWalkOver = vi.fn();
    const scheduler = new CairnOfEchoesScheduler(buildHooks({ getCairns: () => [cairn], onWalkOver, getRngSample: () => 0.5 }));
    scheduler.load();
    scheduler.tick(0, 100, 100);
    expect(onWalkOver).toHaveBeenCalledWith(expect.objectContaining({
      cairn,
      whisper: expect.objectContaining({ kind: 'past_self' }),
    }));
  });

  it('outside touch radius does not fire walk-over', () => {
    const cairn = makeCairn(100, 100, 1);
    const onWalkOver = vi.fn();
    const scheduler = new CairnOfEchoesScheduler(buildHooks({ getCairns: () => [cairn], onWalkOver }));
    scheduler.load();
    scheduler.tick(0, 100 + CAIRN_TOUCH_RADIUS_PX + 5, 100);
    expect(onWalkOver).not.toHaveBeenCalled();
  });

  it('addCairn merges a fresh cairn mid-run (AncestralEcho handoff)', () => {
    const initial = makeCairn(100, 100, 1);
    const fresh = makeCairn(300, 300, 2);
    const onSpriteCreate = vi.fn();
    const scheduler = new CairnOfEchoesScheduler(buildHooks({ getCairns: () => [initial], onSpriteCreate }));
    scheduler.load();
    scheduler.addCairn(fresh);
    scheduler.tick(0, 300, 300);
    expect(onSpriteCreate).toHaveBeenCalledWith(fresh);
  });

  it('reset clears touched-this-run state', () => {
    const cairn = makeCairn(100, 100, 1);
    const onWalkOver = vi.fn();
    const scheduler = new CairnOfEchoesScheduler(buildHooks({ getCairns: () => [cairn], onWalkOver }));
    scheduler.load();
    scheduler.tick(0, 100, 100);
    scheduler.reset();
    scheduler.load();
    scheduler.tick(16, 100, 100);
    expect(onWalkOver).toHaveBeenCalledTimes(2);
  });

  it('getMinimapMarkers returns all loaded cairn coords', () => {
    const a = makeCairn(100, 100, 1);
    const b = makeCairn(500, 500, 2);
    const scheduler = new CairnOfEchoesScheduler(buildHooks({ getCairns: () => [a, b] }));
    scheduler.load();
    const markers = scheduler.getMinimapMarkers();
    expect(markers).toEqual([{ x: 100, y: 100 }, { x: 500, y: 500 }]);
  });
});
