import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnemyKillHandler, type EnemyKillHandlerHooks } from './EnemyKillHandler';
import { RunScoreState } from './RunScoreState';
import { BALANCE } from '../../core/BalanceConfig';

/**
 * R3a: counters live on RunScoreState, passed through a single
 * `getRunScore` hook. Each test creates a fresh score object so
 * mutations stay isolated.
 */

type HookMocks = {
  hooks: EnemyKillHandlerHooks;
  score: RunScoreState;
  juice: {
    showToast: ReturnType<typeof vi.fn>;
    flashWhite: ReturnType<typeof vi.fn>;
    showKillBurst: ReturnType<typeof vi.fn>;
    hitFreeze: ReturnType<typeof vi.fn>;
    bossDeathSpectacle: ReturnType<typeof vi.fn>;
    midRunBossDeathSpectacle: ReturnType<typeof vi.fn>;
    slowMotion: ReturnType<typeof vi.fn>;
    getComboCount: ReturnType<typeof vi.fn>;
  };
  xp: { spawnGem: ReturnType<typeof vi.fn> };
  spawn: {
    noteKillPressure: ReturnType<typeof vi.fn>;
    getEnemyGroup: ReturnType<typeof vi.fn>;
    getGameTimeSec: ReturnType<typeof vi.fn>;
  };
  player: {
    getXpMultiplier: ReturnType<typeof vi.fn>;
    getLifesteal: ReturnType<typeof vi.fn>;
    heal: ReturnType<typeof vi.fn>;
    getBossHealFrac: ReturnType<typeof vi.fn>;
    getMaxHp: ReturnType<typeof vi.fn>;
  };
  banter: { request: ReturnType<typeof vi.fn> } | null;
  pickup: {
    spawnHealthOrb: ReturnType<typeof vi.fn>;
    spawnGoldCoin: ReturnType<typeof vi.fn>;
  };
  tickers: { addOnce: ReturnType<typeof vi.fn> };
  sfx: { tryPlay: ReturnType<typeof vi.fn> };
  rng: { bool: ReturnType<typeof vi.fn>; int: ReturnType<typeof vi.fn> };
  triggerVictory: ReturnType<typeof vi.fn>;
  onActComplete: ReturnType<typeof vi.fn>;
  onBottleBreak: ReturnType<typeof vi.fn>;
  onTotemFall: ReturnType<typeof vi.fn>;
  onHaarDispel: ReturnType<typeof vi.fn>;
  setEnemies: (es: unknown[]) => void;
};

function buildHooks(overrides: { withBanter?: boolean } = {}): HookMocks {
  const score = new RunScoreState();
  let enemies: unknown[] = [];

  const juice = {
    showToast: vi.fn(),
    flashWhite: vi.fn(),
    showKillBurst: vi.fn(),
    hitFreeze: vi.fn(),
    bossDeathSpectacle: vi.fn(),
    midRunBossDeathSpectacle: vi.fn(),
    slowMotion: vi.fn(),
    getComboCount: vi.fn(() => 0),
  };

  const xp = { spawnGem: vi.fn() };

  const spawn = {
    noteKillPressure: vi.fn(),
    getEnemyGroup: vi.fn(() => ({ children: { entries: enemies } })),
    getGameTimeSec: vi.fn(() => 0),
  };

  const player = {
    getXpMultiplier: vi.fn(() => 1),
    getLifesteal: vi.fn(() => 0),
    heal: vi.fn(),
    getBossHealFrac: vi.fn(() => 0),
    getMaxHp: vi.fn(() => 100),
  };

  const banter = overrides.withBanter !== false ? { request: vi.fn() } : null;

  const pickup = {
    spawnHealthOrb: vi.fn(),
    spawnGoldCoin: vi.fn(),
  };

  const tickers = { addOnce: vi.fn() };
  const sfx = { tryPlay: vi.fn() };
  const rng = {
    bool: vi.fn(() => false),
    int: vi.fn((lo: number, _hi: number) => lo),
  };
  const triggerVictory = vi.fn();
  const onActComplete = vi.fn<(act: 1 | 2) => void>();
  const onBottleBreak = vi.fn<(x: number, y: number) => void>();
  const onTotemFall = vi.fn<(x: number, y: number) => void>();
  const onHaarDispel = vi.fn<(x: number, y: number) => void>();

  const hooks: EnemyKillHandlerHooks = {
    getPlayer: () => player as never,
    getJuice: () => juice as never,
    getXPSystem: () => xp as never,
    getSpawnSystem: () => spawn as never,
    getBanter: () => banter as never,
    getPickupSpawner: () => pickup as never,
    getUpdateTickers: () => tickers as never,
    getSFXManager: () => sfx as never,
    getRunRng: () => rng as never,
    getActiveVariantKey: () => 'classic',
    getRunScore: () => score,
    triggerVictory,
    onActComplete,
    onBottleBreak,
    onTotemFall,
    onHaarDispel,
  };

  return {
    hooks,
    score,
    juice,
    xp,
    spawn,
    player,
    banter,
    pickup,
    tickers,
    sfx,
    rng,
    triggerVictory,
    onActComplete,
    onBottleBreak,
    onTotemFall,
    onHaarDispel,
    setEnemies: (es) => {
      enemies = es;
    },
  };
}

describe('EnemyKillHandler', () => {
  let m: HookMocks;
  let handler: EnemyKillHandler;

  beforeEach(() => {
    m = buildHooks();
    handler = new EnemyKillHandler(m.hooks);
  });

  describe('regular kill cascade', () => {
    it('spawns XP gem, increments kill count, fires kill burst + hit freeze', () => {
      handler.handle(100, 200, 5, 'tourist', false, false);

      expect(m.score.killCount).toBe(1);
      expect(m.xp.spawnGem).toHaveBeenCalledWith(100, 200, 5);
      expect(m.juice.showKillBurst).toHaveBeenCalledWith(100, 200, 0xcc2020);
      expect(m.juice.hitFreeze).toHaveBeenCalledOnce();
      expect(m.spawn.noteKillPressure).toHaveBeenCalledOnce();
    });

    it('scales XP gem by combo bonus, capped at +50%', () => {
      m.juice.getComboCount.mockReturnValue(100); // would be 100%, but capped to 50%
      m.player.getXpMultiplier.mockReturnValue(2);
      handler.handle(0, 0, 10, 'tourist', false);
      // xpValue=10, mult=2, cap=1.5 → 10*2*1.5 = 30
      expect(m.xp.spawnGem).toHaveBeenCalledWith(0, 0, 30);
    });

    it('plays kill sting via SFXManager for non-volatile elites', () => {
      handler.handle(0, 0, 5, 'tourist', false, false, null);
      expect(m.sfx.tryPlay).toHaveBeenCalledWith('kill', expect.any(Function));
    });

    it('skips kill sting when eliteAffixId is volatile', () => {
      handler.handle(0, 0, 5, 'tourist', false, true, 'volatile');
      expect(m.sfx.tryPlay).not.toHaveBeenCalled();
    });

    it('heals by lifesteal amount on kill', () => {
      m.player.getLifesteal.mockReturnValue(3);
      handler.handle(0, 0, 5, 'tourist', false);
      expect(m.player.heal).toHaveBeenCalledWith(3);
    });

    it('does not call heal when lifesteal is 0', () => {
      handler.handle(0, 0, 5, 'tourist', false);
      expect(m.player.heal).not.toHaveBeenCalled();
    });
  });

  describe('first-blood banter', () => {
    it('fires first_blood banter on the first kill only', () => {
      handler.handle(0, 0, 5, 'tourist', false);
      handler.handle(0, 0, 5, 'tourist', false);
      expect(m.banter!.request).toHaveBeenCalledTimes(1);
      expect(m.banter!.request).toHaveBeenCalledWith('first_blood', { tag: 'classic' });
    });

    it('tolerates a null banter system', () => {
      const bare = buildHooks({ withBanter: false });
      const h = new EnemyKillHandler(bare.hooks);
      expect(() => h.handle(0, 0, 5, 'tourist', false)).not.toThrow();
      expect(bare.score.firstKillSeen).toBe(true);
    });
  });

  describe('combo-milestone banter', () => {
    it.each([
      [20, true],
      [75, true],
      [150, true],
      [19, false],
      [21, false],
      [100, false],
    ])('at combo %i fires kill_streak: %s', (combo, shouldFire) => {
      m.score.firstKillSeen = true; // isolate from first_blood
      m.juice.getComboCount.mockReturnValue(combo);
      handler.handle(0, 0, 5, 'tourist', false);
      if (shouldFire) {
        expect(m.banter!.request).toHaveBeenCalledWith('kill_streak', { tag: 'classic' });
      } else {
        expect(m.banter!.request).not.toHaveBeenCalled();
      }
    });
  });

  describe('elite chain', () => {
    it('second elite within window grants eliteChainGoldSecond', () => {
      handler.handle(0, 0, 5, 'ghost', false, true); // #1
      expect(m.score.eliteChainCount).toBe(1);
      expect(m.score.coinGoldEarned).toBe(0);

      handler.handle(0, 0, 5, 'ghost', false, true); // #2
      expect(m.score.eliteChainCount).toBe(2);
      expect(m.score.coinGoldEarned).toBe(BALANCE.enemy.eliteChainGoldSecond);
    });

    it('third elite grants eliteChainGoldTriple, flashes, and resets chain', () => {
      handler.handle(0, 0, 5, 'ghost', false, true);
      handler.handle(0, 0, 5, 'ghost', false, true);
      m.juice.flashWhite.mockClear();
      handler.handle(0, 0, 5, 'ghost', false, true); // #3
      expect(m.score.coinGoldEarned).toBe(
        BALANCE.enemy.eliteChainGoldSecond + BALANCE.enemy.eliteChainGoldTriple,
      );
      expect(m.juice.flashWhite).toHaveBeenCalledWith(100);
      expect(m.score.eliteChainCount).toBe(0);
      expect(m.score.eliteChainLastGameSec).toBeNull();
    });

    it('resets to 1 when elapsed exceeds chain window', () => {
      m.spawn.getGameTimeSec.mockReturnValueOnce(0);
      handler.handle(0, 0, 5, 'ghost', false, true);
      m.spawn.getGameTimeSec.mockReturnValueOnce(BALANCE.enemy.eliteChainWindowSec + 10);
      handler.handle(0, 0, 5, 'ghost', false, true);
      expect(m.score.eliteChainCount).toBe(1);
      expect(m.score.coinGoldEarned).toBe(0); // no bonus at count=1
    });

    it('does not engage elite chain for bosses', () => {
      handler.handle(0, 0, 100, 'taxman', true, true);
      expect(m.score.eliteChainCount).toBe(0);
    });
  });

  describe('kill milestones', () => {
    it('awards gold reward + flashWhite + playLevelUp at kill 100', () => {
      m.score.killCount = 99;
      m.score.firstKillSeen = true;
      handler.handle(0, 0, 5, 'tourist', false);
      // goldReward = floor(100/50) = 2
      expect(m.score.coinGoldEarned).toBe(2);
      expect(m.juice.flashWhite).toHaveBeenCalledWith(150);
    });

    it('does nothing special at kill 101', () => {
      m.score.killCount = 100;
      m.score.firstKillSeen = true;
      handler.handle(0, 0, 5, 'tourist', false);
      expect(m.score.coinGoldEarned).toBe(0);
      expect(m.juice.flashWhite).not.toHaveBeenCalled();
    });

    it.each([250, 500, 1000, 2500, 5000])('fires at kill %i', (threshold) => {
      m.score.killCount = threshold - 1;
      m.score.firstKillSeen = true;
      handler.handle(0, 0, 5, 'tourist', false);
      expect(m.score.coinGoldEarned).toBe(Math.floor(threshold / 50));
    });
  });

  describe('death ripple', () => {
    function mockEnemy(x: number, y: number, active = true, mass = 1) {
      return {
        x,
        y,
        active,
        body: { mass },
        applyKnockback: vi.fn(),
      };
    }

    it('pushes nearby enemies within the ripple radius', () => {
      const close = mockEnemy(10, 0); // dist 10 < 50
      const far = mockEnemy(200, 0); // dist 200 > 50
      m.setEnemies([close, far]);
      handler.handle(0, 0, 5, 'tourist', false);
      expect(close.applyKnockback).toHaveBeenCalled();
      expect(far.applyKnockback).not.toHaveBeenCalled();
    });

    it('caps ripple at 6 targets', () => {
      const enemies = Array.from({ length: 10 }, (_, i) => mockEnemy(i + 1, 0));
      m.setEnemies(enemies);
      handler.handle(0, 0, 5, 'tourist', false);
      const pushed = enemies.filter((e) => e.applyKnockback.mock.calls.length > 0).length;
      expect(pushed).toBe(6);
    });

    it('skips inactive enemies', () => {
      const inactive = mockEnemy(10, 0, false);
      m.setEnemies([inactive]);
      handler.handle(0, 0, 5, 'tourist', false);
      expect(inactive.applyKnockback).not.toHaveBeenCalled();
    });

    it('skips enemies at exactly the kill point (distSq === 0)', () => {
      const overlap = mockEnemy(0, 0);
      m.setEnemies([overlap]);
      handler.handle(0, 0, 5, 'tourist', false);
      expect(overlap.applyKnockback).not.toHaveBeenCalled();
    });
  });

  describe('pickup drops', () => {
    it('non-boss kill: no drops when rng.bool returns false', () => {
      m.rng.bool.mockReturnValue(false);
      handler.handle(0, 0, 5, 'tourist', false);
      expect(m.pickup.spawnHealthOrb).not.toHaveBeenCalled();
      expect(m.pickup.spawnGoldCoin).not.toHaveBeenCalled();
    });

    it('non-boss health orb drops 5 HP when rng permits', () => {
      m.rng.bool.mockReturnValueOnce(true).mockReturnValueOnce(false);
      handler.handle(42, 99, 5, 'tourist', false);
      expect(m.pickup.spawnHealthOrb).toHaveBeenCalledWith(42, 99, 5);
    });

    it('boss kill always drops 25 HP orb and coins', () => {
      m.score.firstKillSeen = true;
      // Boss gold chance is 1.0, but the handler still routes through rng.bool
      // for uniform RNG accounting — must return true for coin to drop.
      m.rng.bool.mockReturnValue(true);
      handler.handle(10, 20, 100, 'taxman', true);
      expect(m.pickup.spawnHealthOrb).toHaveBeenCalledWith(10, 20, 25);
      expect(m.pickup.spawnGoldCoin).toHaveBeenCalledWith(10, 20, 5); // rng.int returns lo=5
    });

    it('elite non-boss uses 10% gold chance', () => {
      // First rng.bool call is the health orb (5%). Second is gold (10% elite).
      m.rng.bool
        .mockImplementationOnce((p: number) => p === 0.05 && false) // health miss
        .mockImplementationOnce((p: number) => p === 0.1); // gold hit
      handler.handle(0, 0, 5, 'ghost', false, true);
      expect(m.pickup.spawnGoldCoin).toHaveBeenCalled();
    });
  });

  describe('boss kill cascade', () => {
    beforeEach(() => {
      m.score.firstKillSeen = true;
    });

    it('increments boss kill count, plays mid-run spectacle, slow-motion', () => {
      handler.handle(0, 0, 100, 'gordon', true);
      expect(m.score.bossKillCount).toBe(1);
      expect(m.juice.midRunBossDeathSpectacle).toHaveBeenCalledWith(0, 0);
      expect(m.juice.bossDeathSpectacle).not.toHaveBeenCalled();
      expect(m.juice.slowMotion).toHaveBeenCalledOnce();
    });

    it('taxman uses full bossDeathSpectacle, not midRunBossDeathSpectacle', () => {
      m.score.firstKillSeen = true;
      handler.handle(0, 0, 200, 'taxman', true);
      expect(m.juice.bossDeathSpectacle).toHaveBeenCalledWith(0, 0);
      expect(m.juice.midRunBossDeathSpectacle).not.toHaveBeenCalled();
    });

    it('adds bossGold = ceil(xpValue * 2)', () => {
      handler.handle(0, 0, 75, 'gordon', true);
      expect(m.score.bossGoldEarned).toBe(150);
    });

    it('fires boss_down banter with bossKey as tag', () => {
      handler.handle(0, 0, 100, 'gordon', true);
      expect(m.banter!.request).toHaveBeenCalledWith('boss_down', { tag: 'gordon' });
    });

    it('applies Trophy Hunter heal when bossHealFrac > 0', () => {
      m.player.getBossHealFrac.mockReturnValue(0.5);
      m.player.getMaxHp.mockReturnValue(100);
      handler.handle(0, 0, 100, 'gordon', true);
      expect(m.player.heal).toHaveBeenCalledWith(50);
    });

    it('skips Trophy Hunter heal when frac is 0', () => {
      handler.handle(0, 0, 100, 'gordon', true);
      expect(m.player.heal).not.toHaveBeenCalled();
    });
  });

  describe('taxman victory', () => {
    it('sets victory pending, arms delayed trigger, and fires it', () => {
      m.score.firstKillSeen = true;
      handler.handle(0, 0, 200, 'taxman', true);
      expect(m.score.victoryPending).toBe(true);
      expect(m.tickers.addOnce).toHaveBeenCalledWith('raw', 1500, expect.any(Function));

      // Invoke the deferred callback — should trigger victory.
      const [, , cb] = m.tickers.addOnce.mock.calls[0];
      cb();
      expect(m.triggerVictory).toHaveBeenCalledOnce();
    });

    it('deferred callback no-ops when generation has advanced', () => {
      m.score.firstKillSeen = true;
      handler.handle(0, 0, 200, 'taxman', true);
      const [, , cb] = m.tickers.addOnce.mock.calls[0];
      m.score.victoryDelayGen += 1; // simulate scene restart bumping the generation
      cb();
      expect(m.triggerVictory).not.toHaveBeenCalled();
    });

    it('non-taxman boss does not trigger victory', () => {
      m.score.firstKillSeen = true;
      handler.handle(0, 0, 100, 'gordon', true);
      expect(m.score.victoryPending).toBe(false);
      expect(m.tickers.addOnce).not.toHaveBeenCalled();
    });
  });

  describe('W2 act dispatch', () => {
    beforeEach(() => {
      m.score.firstKillSeen = true;
    });

    it('calls onActComplete(1) after killing gordon', () => {
      handler.handle(0, 0, 75, 'gordon', true);
      expect(m.onActComplete).toHaveBeenCalledExactlyOnceWith(1);
    });

    it('calls onActComplete(2) after killing tour_bus', () => {
      handler.handle(0, 0, 100, 'tour_bus', true);
      expect(m.onActComplete).toHaveBeenCalledExactlyOnceWith(2);
    });

    it('does NOT call onActComplete after killing taxman (victory path)', () => {
      handler.handle(0, 0, 200, 'taxman', true);
      expect(m.onActComplete).not.toHaveBeenCalled();
    });

    it('does NOT call onActComplete for non-boss kills', () => {
      handler.handle(0, 0, 5, 'tourist', false);
      expect(m.onActComplete).not.toHaveBeenCalled();
    });
  });

  describe('Buckfast Ned bottle break', () => {
    it('calls onBottleBreak with kill coordinates when buckfast_ned dies', () => {
      handler.handle(123, 456, 4, 'buckfast_ned', false);
      expect(m.onBottleBreak).toHaveBeenCalledExactlyOnceWith(123, 456);
    });

    it('does NOT call onBottleBreak for other enemy kills', () => {
      handler.handle(10, 20, 5, 'tourist', false);
      handler.handle(30, 40, 5, 'angry_scotsman', false);
      handler.handle(50, 60, 75, 'gordon', true);
      expect(m.onBottleBreak).not.toHaveBeenCalled();
    });

    it('fires even for elite buckfast_ned (slick still spawns)', () => {
      handler.handle(7, 8, 4, 'buckfast_ned', false, true, null);
      expect(m.onBottleBreak).toHaveBeenCalledExactlyOnceWith(7, 8);
    });
  });

  describe('Traffic Cone Totem collapse', () => {
    it('calls onTotemFall with kill coordinates when traffic_cone_totem dies', () => {
      handler.handle(500, 300, 6, 'traffic_cone_totem', false);
      expect(m.onTotemFall).toHaveBeenCalledExactlyOnceWith(500, 300);
    });

    it('does NOT call onTotemFall for buckfast_ned or unrelated kills', () => {
      handler.handle(10, 20, 4, 'buckfast_ned', false);
      handler.handle(30, 40, 5, 'tourist', false);
      expect(m.onTotemFall).not.toHaveBeenCalled();
    });

    it('totem and ned hooks fire independently when both enemies die in sequence', () => {
      handler.handle(10, 10, 4, 'buckfast_ned', false);
      handler.handle(20, 20, 6, 'traffic_cone_totem', false);
      expect(m.onBottleBreak).toHaveBeenCalledExactlyOnceWith(10, 10);
      expect(m.onTotemFall).toHaveBeenCalledExactlyOnceWith(20, 20);
    });
  });

  describe('Haar Wraith dispel', () => {
    it('calls onHaarDispel with kill coordinates when haar_wraith dies', () => {
      handler.handle(200, 300, 4, 'haar_wraith', false);
      expect(m.onHaarDispel).toHaveBeenCalledExactlyOnceWith(200, 300);
    });

    it('does NOT call onHaarDispel for other enemy kills', () => {
      handler.handle(10, 20, 4, 'buckfast_ned', false);
      handler.handle(30, 40, 6, 'traffic_cone_totem', false);
      handler.handle(50, 60, 5, 'tourist', false);
      expect(m.onHaarDispel).not.toHaveBeenCalled();
    });

    it('slick / totem / fog hooks each fire on their own enemy in sequence', () => {
      handler.handle(10, 10, 4, 'buckfast_ned', false);
      handler.handle(20, 20, 6, 'traffic_cone_totem', false);
      handler.handle(30, 30, 4, 'haar_wraith', false);
      expect(m.onBottleBreak).toHaveBeenCalledExactlyOnceWith(10, 10);
      expect(m.onTotemFall).toHaveBeenCalledExactlyOnceWith(20, 20);
      expect(m.onHaarDispel).toHaveBeenCalledExactlyOnceWith(30, 30);
    });
  });
});
