import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerHitResolver, type PlayerHitResolverHooks } from './PlayerHitResolver';

/**
 * Scene-free harness. Mocks every hook; the resolver should touch only
 * what's routed through them. Assertions target damage + armor math,
 * gate short-circuits, Thorns, death trigger, and death-cause tracking.
 */

function buildMocks(overrides: { damageTakenMult?: number } = {}) {
  const player = {
    x: 100,
    y: 200,
    scaleX: 1,
    getArmor: vi.fn(() => 0),
    getHp: vi.fn(() => 50),
    getMaxHp: vi.fn(() => 100),
    getThornsDamage: vi.fn(() => 0),
    takeDamage: vi.fn(() => false),
    isDashInvincible: vi.fn(() => false),
    setAlpha: vi.fn(),
    setTintFill: vi.fn(),
  };
  const juice = { flashRed: vi.fn() };
  const spawn = { getGameTimeSec: vi.fn(() => 12.5) };
  const timeManager = { isGameplayPaused: vi.fn(() => false) };
  const deathCauseTracker = { recordDamage: vi.fn() };
  const iFrames = {
    isActive: vi.fn(() => false),
    armHitTint: vi.fn(),
  };
  const floatTextPool = {
    acquire: vi.fn(() => ({ setVisible: vi.fn(), y: 0 })),
  };
  const runModifiers = {
    damageTakenMult: overrides.damageTakenMult ?? 1,
  };
  const camera = { shake: vi.fn() };
  const tweens = { add: vi.fn() };
  const settingsManager = {
    load: vi.fn(() => ({ screenShake: true, motionScale: 1 })),
  };
  const onAfterNonFatalHit = vi.fn();
  const armIFrames = vi.fn();
  const onPlayerKilled = vi.fn();

  let victoryPending = false;

  const hooks: PlayerHitResolverHooks = {
    getPlayer: () => player as never,
    getJuice: () => juice as never,
    getSpawnSystem: () => spawn as never,
    getTimeManager: () => timeManager as never,
    getDeathCauseTracker: () => deathCauseTracker as never,
    getIFrameController: () => iFrames as never,
    getFloatTextPool: () => floatTextPool as never,
    getRunModifiers: () => runModifiers as never,
    getCamera: () => camera as never,
    getTweens: () => tweens as never,
    getSettingsManager: () => settingsManager as never,
    isVictoryPending: () => victoryPending,
    onAfterNonFatalHit,
    armIFrames,
    onPlayerKilled,
  };

  return {
    hooks,
    player,
    juice,
    spawn,
    timeManager,
    deathCauseTracker,
    iFrames,
    floatTextPool,
    runModifiers,
    tweens,
    onAfterNonFatalHit,
    armIFrames,
    onPlayerKilled,
    setVictoryPending: (v: boolean) => {
      victoryPending = v;
    },
  };
}

function mockEnemy(
  overrides: {
    damage?: number;
    active?: boolean;
    key?: string;
    boss?: boolean;
    elite?: boolean;
  } = {},
) {
  return {
    active: overrides.active ?? true,
    getDamage: vi.fn(() => overrides.damage ?? 10),
    getEnemyKey: vi.fn(() => overrides.key ?? 'tourist'),
    isBoss: vi.fn(() => overrides.boss ?? false),
    isElite: vi.fn(() => overrides.elite ?? false),
    takeDamageWithKillEvents: vi.fn(),
  };
}

describe('PlayerHitResolver', () => {
  let m: ReturnType<typeof buildMocks>;
  let resolver: PlayerHitResolver;

  beforeEach(() => {
    m = buildMocks();
    resolver = new PlayerHitResolver(m.hooks);
  });

  describe('gate short-circuits', () => {
    it('skips when iFrames are active', () => {
      m.iFrames.isActive.mockReturnValue(true);
      resolver.handle(mockEnemy() as never);
      expect(m.player.takeDamage).not.toHaveBeenCalled();
    });

    it('skips when gameplay is paused', () => {
      m.timeManager.isGameplayPaused.mockReturnValue(true);
      resolver.handle(mockEnemy() as never);
      expect(m.player.takeDamage).not.toHaveBeenCalled();
    });

    it('skips when victory is pending', () => {
      m.setVictoryPending(true);
      resolver.handle(mockEnemy() as never);
      expect(m.player.takeDamage).not.toHaveBeenCalled();
    });

    it('skips when player is dash-invincible', () => {
      m.player.isDashInvincible.mockReturnValue(true);
      resolver.handle(mockEnemy() as never);
      expect(m.player.takeDamage).not.toHaveBeenCalled();
    });

    it('skips when enemy is inactive', () => {
      resolver.handle(mockEnemy({ active: false }) as never);
      expect(m.player.takeDamage).not.toHaveBeenCalled();
    });
  });

  describe('damage calculation', () => {
    it('applies raw damage when damageTakenMult is 1', () => {
      resolver.handle(mockEnemy({ damage: 10 }) as never);
      expect(m.player.takeDamage).toHaveBeenCalledWith(10);
    });

    it('scales damage by damageTakenMult (Thin Hide 1.25×)', () => {
      const x = buildMocks({ damageTakenMult: 1.25 });
      const r = new PlayerHitResolver(x.hooks);
      r.handle(mockEnemy({ damage: 10 }) as never);
      expect(x.player.takeDamage).toHaveBeenCalledWith(13); // round(10*1.25) = 13
    });

    it('rounds up to 1 damage minimum even with reducing mult', () => {
      const x = buildMocks({ damageTakenMult: 0.1 });
      const r = new PlayerHitResolver(x.hooks);
      r.handle(mockEnemy({ damage: 3 }) as never);
      expect(x.player.takeDamage).toHaveBeenCalledWith(1);
    });
  });

  describe('armor absorption text', () => {
    it('shows armor-blocked toast when armor > 0 and damage > 1', () => {
      m.player.getArmor.mockReturnValue(5);
      resolver.handle(mockEnemy({ damage: 10 }) as never);
      expect(m.floatTextPool.acquire).toHaveBeenCalled();
      expect(m.tweens.add).toHaveBeenCalled();
    });

    it('skips armor text when armor is 0', () => {
      resolver.handle(mockEnemy({ damage: 10 }) as never);
      expect(m.floatTextPool.acquire).not.toHaveBeenCalled();
    });

    it('skips armor text when damage is 1', () => {
      m.player.getArmor.mockReturnValue(5);
      resolver.handle(mockEnemy({ damage: 1 }) as never);
      expect(m.floatTextPool.acquire).not.toHaveBeenCalled();
    });

    it('caps absorbed amount at incomingDmg - 1 (never absorbs the full hit)', () => {
      m.player.getArmor.mockReturnValue(100);
      resolver.handle(mockEnemy({ damage: 5 }) as never);
      // Absorbed = min(100, 5-1) = 4.
      expect(m.floatTextPool.acquire).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.stringContaining('4'),
        expect.any(String),
        expect.any(String),
        expect.any(Number),
      );
    });
  });

  describe('thorns retaliation', () => {
    it('retaliates when player has Thorns and enemy is active', () => {
      m.player.getThornsDamage.mockReturnValue(7);
      const enemy = mockEnemy();
      resolver.handle(enemy as never);
      expect(enemy.takeDamageWithKillEvents).toHaveBeenCalledWith(7);
    });

    it('does not retaliate when Thorns is 0', () => {
      const enemy = mockEnemy();
      resolver.handle(enemy as never);
      expect(enemy.takeDamageWithKillEvents).not.toHaveBeenCalled();
    });
  });

  describe('death-cause tracking', () => {
    it('records damage with post-armor amount + source metadata', () => {
      m.player.getArmor.mockReturnValue(3);
      m.player.getHp.mockReturnValue(37);
      m.player.getMaxHp.mockReturnValue(100);
      resolver.handle(mockEnemy({ damage: 10, key: 'ghost', boss: false, elite: true }) as never);
      expect(m.deathCauseTracker.recordDamage).toHaveBeenCalledWith({
        gameTimeSec: 12.5,
        sourceKey: 'ghost',
        amount: 7, // 10 - 3 armor
        sourceIsBoss: false,
        sourceIsElite: true,
        sourceIsHazard: false,
        hpAfter: 37,
        maxHpAfter: 100,
      });
    });
  });

  describe('non-fatal hit side effects', () => {
    it('calls onAfterNonFatalHit with hpBefore', () => {
      m.player.getHp.mockReturnValueOnce(80); // hpBefore read
      m.player.getHp.mockReturnValueOnce(70); // post-damage for deathCauseTracker
      resolver.handle(mockEnemy({ damage: 10 }) as never);
      expect(m.onAfterNonFatalHit).toHaveBeenCalledWith(80);
    });

    it('arms iFrames and plays flashRed', () => {
      resolver.handle(mockEnemy() as never);
      expect(m.armIFrames).toHaveBeenCalledWith(500);
      expect(m.juice.flashRed).toHaveBeenCalledOnce();
    });

    it('does not call onPlayerKilled when hit is non-fatal', () => {
      resolver.handle(mockEnemy() as never);
      expect(m.onPlayerKilled).not.toHaveBeenCalled();
    });
  });

  describe('fatal hit', () => {
    it('calls onPlayerKilled when takeDamage returns true', () => {
      m.player.takeDamage.mockReturnValue(true);
      resolver.handle(mockEnemy({ damage: 999 }) as never);
      expect(m.onPlayerKilled).toHaveBeenCalledOnce();
    });

    it('does not call onAfterNonFatalHit on fatal hit', () => {
      m.player.takeDamage.mockReturnValue(true);
      resolver.handle(mockEnemy({ damage: 999 }) as never);
      expect(m.onAfterNonFatalHit).not.toHaveBeenCalled();
    });
  });
});
