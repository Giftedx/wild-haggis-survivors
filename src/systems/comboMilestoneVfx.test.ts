import { describe, it, expect } from 'vitest';
import { resolveComboMilestoneVfx } from './comboMilestoneVfx';

describe('resolveComboMilestoneVfx — non-milestones', () => {
  it.each([1, 5, 10, 49, 99, 101, 199, 201, 500])('returns null for count %i', (count) => {
    expect(resolveComboMilestoneVfx(count)).toBeNull();
  });
});

describe('resolveComboMilestoneVfx — milestones', () => {
  it('combo 11 returns correct config', () => {
    const vfx = resolveComboMilestoneVfx(11);
    expect(vfx).not.toBeNull();
    expect(vfx!.pulseScale).toBe(1.3);
    expect(vfx!.flashColor).toBeNull();
    expect(vfx!.flashDurationMs).toBe(0);
    expect(vfx!.burstParticles).toBe(0);
  });

  it('combo 50 returns correct config', () => {
    const vfx = resolveComboMilestoneVfx(50);
    expect(vfx).not.toBeNull();
    expect(vfx!.pulseScale).toBe(1.5);
    expect(vfx!.flashColor).toBe(0xffe088);
    expect(vfx!.flashDurationMs).toBe(80);
    expect(vfx!.burstParticles).toBe(8);
  });

  it('combo 100 returns correct config', () => {
    const vfx = resolveComboMilestoneVfx(100);
    expect(vfx).not.toBeNull();
    expect(vfx!.pulseScale).toBe(1.8);
    expect(vfx!.flashColor).toBe(0xffd700);
    expect(vfx!.flashDurationMs).toBe(120);
    expect(vfx!.burstParticles).toBe(16);
  });

  it('combo 200 returns correct config', () => {
    const vfx = resolveComboMilestoneVfx(200);
    expect(vfx).not.toBeNull();
    expect(vfx!.pulseScale).toBe(2.0);
    expect(vfx!.flashColor).toBe(0xffd700);
    expect(vfx!.flashDurationMs).toBe(150);
    expect(vfx!.burstParticles).toBe(24);
  });

  it('pulse scales form a strict ascending sequence', () => {
    const scales = [11, 50, 100, 200].map((c) => resolveComboMilestoneVfx(c)!.pulseScale);
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeGreaterThan(scales[i - 1]);
    }
  });
});
