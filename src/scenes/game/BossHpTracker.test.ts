import { describe, expect, it, vi } from 'vitest';
import { BossHpTracker, type BossHpTrackerHooks } from './BossHpTracker';

function mockEnemy(opts: { boss?: boolean; active?: boolean; hpFrac?: number; key?: string } = {}) {
  return {
    active: opts.active ?? true,
    isBoss: vi.fn(() => opts.boss ?? false),
    getHpFraction: vi.fn(() => opts.hpFrac ?? 1),
    getEnemyKey: vi.fn(() => opts.key ?? 'tourist'),
  };
}

function buildHooks(enemies: ReturnType<typeof mockEnemy>[]) {
  const updateBossBar = vi.fn();
  const hooks: BossHpTrackerHooks = {
    getSpawnSystem: () =>
      ({
        getEnemyGroup: () => ({ children: { entries: enemies }, getChildren: () => enemies }),
      }) as never,
    updateBossBar,
  };
  return { hooks, updateBossBar };
}

describe('BossHpTracker', () => {
  it('clears the boss bar when no bosses are active', () => {
    const { hooks, updateBossBar } = buildHooks([mockEnemy({ boss: false })]);
    const tracker = new BossHpTracker(hooks);
    tracker.tick();
    expect(updateBossBar).toHaveBeenLastCalledWith(null);
  });

  it('caches a single active boss and reports HP fraction', () => {
    const boss = mockEnemy({ boss: true, hpFrac: 0.7, key: 'gordon' });
    const { hooks, updateBossBar } = buildHooks([boss]);
    const tracker = new BossHpTracker(hooks);
    tracker.tick();
    expect(updateBossBar).toHaveBeenCalledWith(
      expect.objectContaining({ hpFraction: 0.7 }),
    );
  });

  it('selects the lowest-HP boss when multiple overlap (drama winner)', () => {
    const healthy = mockEnemy({ boss: true, hpFrac: 0.9, key: 'gordon' });
    const dying = mockEnemy({ boss: true, hpFrac: 0.2, key: 'taxman' });
    const { hooks, updateBossBar } = buildHooks([healthy, dying]);
    const tracker = new BossHpTracker(hooks);
    tracker.tick();
    expect(updateBossBar).toHaveBeenCalledWith(
      expect.objectContaining({ hpFraction: 0.2 }),
    );
  });

  it('does not rescan while the cached boss remains active', () => {
    const boss = mockEnemy({ boss: true, hpFrac: 0.5, key: 'gordon' });
    const { hooks } = buildHooks([boss]);
    const tracker = new BossHpTracker(hooks);
    tracker.tick();
    boss.isBoss.mockClear();
    tracker.tick();
    // getHpFraction may be read again (for the bar), but isBoss() scan is gated.
    expect(boss.isBoss).toHaveBeenCalledTimes(1); // single gate check only
  });

  it('rescans after the cached boss becomes inactive', () => {
    const boss = mockEnemy({ boss: true, hpFrac: 0.5, key: 'gordon' });
    const { hooks, updateBossBar } = buildHooks([boss]);
    const tracker = new BossHpTracker(hooks);
    tracker.tick();
    boss.active = false;
    tracker.tick();
    expect(updateBossBar).toHaveBeenLastCalledWith(null);
  });

  it('reset clears cached boss so next tick rescans', () => {
    const boss = mockEnemy({ boss: true, hpFrac: 0.5 });
    const { hooks } = buildHooks([boss]);
    const tracker = new BossHpTracker(hooks);
    tracker.tick();
    tracker.reset();
    boss.isBoss.mockClear();
    tracker.tick();
    // After reset, must rescan — isBoss called at least once (during scan).
    expect(boss.isBoss.mock.calls.length).toBeGreaterThan(0);
  });
});
