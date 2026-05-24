import { describe, it, expect } from 'vitest';
import {
  tickNuckelaveeRetreat,
  NUCKELAVEE_RETREAT_TRIGGER_PX,
  NUCKELAVEE_RETREAT_SPEED,
} from './nuckelaveeRetreat';

function makeBoss(x: number, y: number, hasBody = true) {
  const body = hasBody ? { velocity: { x: 99, y: 99 } } : null;
  return { x, y, body } as any;
}

describe('tickNuckelaveeRetreat', () => {
  it('no-ops when body is null', () => {
    const boss = makeBoss(0, 0, false);
    expect(() => tickNuckelaveeRetreat(boss, [{ x: 0, y: 0, r: 50 }])).not.toThrow();
  });

  it('does not change velocity when no patches within trigger radius', () => {
    const boss = makeBoss(0, 0);
    const far = NUCKELAVEE_RETREAT_TRIGGER_PX + 1;
    tickNuckelaveeRetreat(boss, [{ x: far, y: 0, r: 50 }]);
    expect(boss.body.velocity.x).toBe(99);
    expect(boss.body.velocity.y).toBe(99);
  });

  it('sets velocity away from patch when within trigger radius', () => {
    // Boss at (100, 0), patch at origin — boss should retreat +x
    const boss = makeBoss(100, 0);
    tickNuckelaveeRetreat(boss, [{ x: 0, y: 0, r: 50 }]);
    expect(boss.body.velocity.x).toBeCloseTo(NUCKELAVEE_RETREAT_SPEED);
    expect(boss.body.velocity.y).toBeCloseTo(0);
  });

  it('retreat speed magnitude equals NUCKELAVEE_RETREAT_SPEED', () => {
    const boss = makeBoss(80, 80);
    tickNuckelaveeRetreat(boss, [{ x: 0, y: 0, r: 50 }]);
    const mag = Math.hypot(boss.body.velocity.x, boss.body.velocity.y);
    expect(mag).toBeCloseTo(NUCKELAVEE_RETREAT_SPEED);
  });

  it('uses nearest patch when multiple are in range', () => {
    // Boss at (50, 0). Near patch at (0,0) dist=50; far patch at (40,0) dist=10 — 40,0 is nearer
    const boss = makeBoss(50, 0);
    tickNuckelaveeRetreat(boss, [
      { x: 0, y: 0, r: 50 },   // dist 50
      { x: 40, y: 0, r: 50 },  // dist 10 — nearest, retreat away from x=40 → +x
    ]);
    // Retreating from patch at x=40 means velocity.x is positive
    expect(boss.body.velocity.x).toBeGreaterThan(0);
  });

  it('ignores patches outside trigger radius even when closer than in-range patches', () => {
    const boss = makeBoss(0, 0);
    const outside = NUCKELAVEE_RETREAT_TRIGGER_PX + 5;
    tickNuckelaveeRetreat(boss, [{ x: outside, y: 0, r: 50 }]);
    expect(boss.body.velocity.x).toBe(99);
  });

  it('no-ops when patch list is empty', () => {
    const boss = makeBoss(0, 0);
    tickNuckelaveeRetreat(boss, []);
    expect(boss.body.velocity.x).toBe(99);
    expect(boss.body.velocity.y).toBe(99);
  });

  it('NUCKELAVEE_RETREAT_SPEED is faster than base chase speed (95)', () => {
    expect(NUCKELAVEE_RETREAT_SPEED).toBeGreaterThan(95);
  });

  it('NUCKELAVEE_RETREAT_TRIGGER_PX is a sensible design value (> 0, < 500)', () => {
    expect(NUCKELAVEE_RETREAT_TRIGGER_PX).toBeGreaterThan(0);
    expect(NUCKELAVEE_RETREAT_TRIGGER_PX).toBeLessThan(500);
  });
});
