import { describe, expect, it } from 'vitest';
import { BOSSES } from '../data/enemies';

describe('BOSSES.cailleach_boss', () => {
  it('is registered as a boss', () => {
    const cailleach = BOSSES.find((b) => b.key === 'cailleach_boss');
    expect(cailleach).toBeDefined();
  });

  it('is marked manualSpawn so the time-based path skips it', () => {
    const cailleach = BOSSES.find((b) => b.key === 'cailleach_boss');
    expect(cailleach?.manualSpawn).toBe(true);
  });

  it('uses a negative spawnTimeSec sentinel', () => {
    const cailleach = BOSSES.find((b) => b.key === 'cailleach_boss');
    expect(cailleach?.spawnTimeSec).toBeLessThan(0);
  });

  it('uses the wail behaviour', () => {
    const cailleach = BOSSES.find((b) => b.key === 'cailleach_boss');
    expect(cailleach?.behaviorOverride).toBe('wail');
  });

  it('has Nicnevin-peer or harder stats (T2 boss)', () => {
    const cailleach = BOSSES.find((b) => b.key === 'cailleach_boss');
    expect(cailleach?.hp).toBeGreaterThanOrEqual(3200);
    expect(cailleach?.damage).toBeGreaterThanOrEqual(28);
  });
});
