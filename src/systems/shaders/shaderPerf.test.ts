import { describe, expect, it, vi } from 'vitest';

import { createPerfProbe } from './shaderPerf';

describe('createPerfProbe', () => {
  it('starts with zero samples and NaN-safe avg/max', () => {
    const probe = createPerfProbe();
    expect(probe.samples).toBe(0);
    expect(probe.avg()).toBe(0);
    expect(probe.max()).toBe(0);
  });

  it('records manual samples and computes avg + max', () => {
    const probe = createPerfProbe();
    probe.record(1);
    probe.record(3);
    probe.record(5);
    expect(probe.samples).toBe(3);
    expect(probe.avg()).toBeCloseTo(3, 5);
    expect(probe.max()).toBe(5);
  });

  it('measure() wraps a function and returns its result', () => {
    const probe = createPerfProbe();
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValueOnce(100).mockReturnValueOnce(100.42);
    const result = probe.measure(() => 'ok');
    expect(result).toBe('ok');
    expect(probe.samples).toBe(1);
    expect(probe.avg()).toBeCloseTo(0.42, 4);
    now.mockRestore();
  });

  it('caps the rolling window at windowSize (FIFO eviction)', () => {
    const probe = createPerfProbe(3);
    probe.record(10);
    probe.record(20);
    probe.record(30);
    probe.record(40); // evicts 10
    expect(probe.samples).toBe(3);
    expect(probe.avg()).toBeCloseTo((20 + 30 + 40) / 3, 5);
    expect(probe.max()).toBe(40);
  });

  it('reset clears samples', () => {
    const probe = createPerfProbe();
    probe.record(5);
    probe.reset();
    expect(probe.samples).toBe(0);
    expect(probe.avg()).toBe(0);
  });

  it('measure() still records when the wrapped fn throws', () => {
    const probe = createPerfProbe();
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValueOnce(50).mockReturnValueOnce(50.25);
    expect(() => probe.measure(() => { throw new Error('boom'); })).toThrow('boom');
    expect(probe.samples).toBe(1);
    expect(probe.avg()).toBeCloseTo(0.25, 4);
    now.mockRestore();
  });
});
