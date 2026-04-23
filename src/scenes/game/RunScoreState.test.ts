import { describe, expect, it, vi } from 'vitest';
import { RunScoreState } from './RunScoreState';

describe('RunScoreState', () => {
  describe('initial state', () => {
    it('starts with all counters at zero / false / null', () => {
      const s = new RunScoreState();
      expect(s.killCount).toBe(0);
      expect(s.bossKillCount).toBe(0);
      expect(s.bossGoldEarned).toBe(0);
      expect(s.coinGoldEarned).toBe(0);
      expect(s.firstKillSeen).toBe(false);
      expect(s.eliteChainCount).toBe(0);
      expect(s.eliteChainLastGameSec).toBeNull();
      expect(s.victoryPending).toBe(false);
      expect(s.victoryDelayGen).toBe(0);
    });
  });

  describe('mutators', () => {
    it('incrementKillCount bumps killCount by 1', () => {
      const s = new RunScoreState();
      s.incrementKillCount();
      s.incrementKillCount();
      expect(s.killCount).toBe(2);
    });

    it('incrementBossKillCount is independent of killCount', () => {
      const s = new RunScoreState();
      s.incrementBossKillCount();
      expect(s.bossKillCount).toBe(1);
      expect(s.killCount).toBe(0);
    });

    it('addCoinGold accumulates (can be negative for refunds)', () => {
      const s = new RunScoreState();
      s.addCoinGold(10);
      s.addCoinGold(5);
      s.addCoinGold(-3);
      expect(s.coinGoldEarned).toBe(12);
    });

    it('addBossGold accumulates independently from coin gold', () => {
      const s = new RunScoreState();
      s.addBossGold(50);
      s.addCoinGold(20);
      expect(s.bossGoldEarned).toBe(50);
      expect(s.coinGoldEarned).toBe(20);
    });

    it('markFirstKillSeen latches true (idempotent)', () => {
      const s = new RunScoreState();
      s.markFirstKillSeen();
      s.markFirstKillSeen();
      expect(s.firstKillSeen).toBe(true);
    });

    it('nextVictoryDelayGen advances and returns the new value', () => {
      const s = new RunScoreState();
      expect(s.nextVictoryDelayGen()).toBe(1);
      expect(s.nextVictoryDelayGen()).toBe(2);
      expect(s.victoryDelayGen).toBe(2);
    });
  });

  describe('direct field writes (for elite chain + victory flags)', () => {
    it('supports eliteChain* writes (handler owns the chain logic)', () => {
      const s = new RunScoreState();
      s.eliteChainCount = 2;
      s.eliteChainLastGameSec = 125.5;
      expect(s.eliteChainCount).toBe(2);
      expect(s.eliteChainLastGameSec).toBe(125.5);
    });

    it('supports victoryPending toggle', () => {
      const s = new RunScoreState();
      s.victoryPending = true;
      expect(s.victoryPending).toBe(true);
    });
  });

  describe('reset', () => {
    it('returns every field to its initial value', () => {
      const s = new RunScoreState();
      s.incrementKillCount();
      s.incrementBossKillCount();
      s.addCoinGold(100);
      s.addBossGold(200);
      s.markFirstKillSeen();
      s.eliteChainCount = 3;
      s.eliteChainLastGameSec = 42;
      s.victoryPending = true;
      s.nextVictoryDelayGen();

      s.reset();

      expect(s.killCount).toBe(0);
      expect(s.bossKillCount).toBe(0);
      expect(s.bossGoldEarned).toBe(0);
      expect(s.coinGoldEarned).toBe(0);
      expect(s.firstKillSeen).toBe(false);
      expect(s.eliteChainCount).toBe(0);
      expect(s.eliteChainLastGameSec).toBeNull();
      expect(s.victoryPending).toBe(false);
      expect(s.victoryDelayGen).toBe(0);
    });

    it('can be reset and reused — same instance behaves fresh', () => {
      const s = new RunScoreState();
      s.incrementKillCount();
      s.reset();
      s.incrementKillCount();
      expect(s.killCount).toBe(1);
    });
  });

  describe('RunScoreState.onKillsChanged', () => {
    it('fires after each incrementKillCount with the new kill total', () => {
      const rs = new RunScoreState();
      const spy = vi.fn();
      rs.onKillsChanged = spy;
      rs.incrementKillCount();
      rs.incrementKillCount();
      rs.incrementKillCount();
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.mock.calls.map((c) => c[0])).toEqual([1, 2, 3]);
    });

    it('is a noop when callback is undefined', () => {
      const rs = new RunScoreState();
      expect(() => rs.incrementKillCount()).not.toThrow();
      expect(rs.killCount).toBe(1);
    });

    it('reset() clears the counter but leaves the callback wired', () => {
      const rs = new RunScoreState();
      const spy = vi.fn();
      rs.onKillsChanged = spy;
      rs.incrementKillCount();
      rs.reset();
      expect(rs.killCount).toBe(0);
      rs.incrementKillCount();
      expect(spy).toHaveBeenLastCalledWith(1);
    });
  });
});
