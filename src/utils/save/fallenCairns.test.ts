import { describe, expect, it } from 'vitest';
import {
  recordFallenCairn,
  FALLEN_CAIRN_CAP,
  CAIRN_RENDER_RADIUS_PX,
  CAIRN_TOUCH_RADIUS_PX,
  CAIRN_INHERITED_BUFF_PCT,
  GRANDFATHER_WHISPER_CHANCE,
  type FallenCairn,
} from './fallenCairns';

function makeCairn(savedAt: number, x = 0, y = 0): FallenCairn {
  return {
    x,
    y,
    cause: 'enemy_contact',
    variantKey: 'classic',
    timeSurvivedMs: 60_000,
    inheritedStat: 'damage',
    savedAt,
  };
}

describe('recordFallenCairn', () => {
  it('appends to an empty list', () => {
    const result = recordFallenCairn([], makeCairn(1));
    expect(result).toHaveLength(1);
    expect(result[0].savedAt).toBe(1);
  });

  it('appends without rotation while under cap', () => {
    const existing: FallenCairn[] = Array.from({ length: 10 }, (_, i) => makeCairn(i + 1));
    const result = recordFallenCairn(existing, makeCairn(11));
    expect(result).toHaveLength(11);
    expect(result[0].savedAt).toBe(1);
    expect(result[10].savedAt).toBe(11);
  });

  it('FIFO rotates oldest out when at cap', () => {
    const existing: FallenCairn[] = Array.from({ length: FALLEN_CAIRN_CAP }, (_, i) => makeCairn(i + 1));
    const result = recordFallenCairn(existing, makeCairn(FALLEN_CAIRN_CAP + 1));
    expect(result).toHaveLength(FALLEN_CAIRN_CAP);
    expect(result[0].savedAt).toBe(2);
    expect(result[result.length - 1].savedAt).toBe(FALLEN_CAIRN_CAP + 1);
  });

  it('respects a custom cap', () => {
    const existing: FallenCairn[] = Array.from({ length: 5 }, (_, i) => makeCairn(i + 1));
    const result = recordFallenCairn(existing, makeCairn(6), 3);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.savedAt)).toEqual([4, 5, 6]);
  });

  it('does not mutate the input array', () => {
    const existing: FallenCairn[] = [makeCairn(1), makeCairn(2)];
    const before = [...existing];
    recordFallenCairn(existing, makeCairn(3));
    expect(existing).toEqual(before);
  });
});

describe('constants', () => {
  it('cap of 50', () => { expect(FALLEN_CAIRN_CAP).toBe(50); });
  it('render radius 600 px', () => { expect(CAIRN_RENDER_RADIUS_PX).toBe(600); });
  it('touch radius 42 px (matches AncestralEcho)', () => { expect(CAIRN_TOUCH_RADIUS_PX).toBe(42); });
  it('inherited buff 1%', () => { expect(CAIRN_INHERITED_BUFF_PCT).toBeCloseTo(0.01); });
  it('grandfather whisper chance 1%', () => { expect(GRANDFATHER_WHISPER_CHANCE).toBeCloseTo(0.01); });
});
