import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class MockGO {
    visible = true;
    width = 0;
    setOrigin() { return this; }
    setScrollFactor() { return this; }
    setDepth() { return this; }
    setPosition() { return this; }
    setVisible(v: boolean) { this.visible = v; return this; }
    destroy() {}
  }

  class MockText extends MockGO {
    value = '';
    setText(t: string) { this.value = t; return this; }
  }

  class MockRect extends MockGO {}

  return {
    default: {
      GameObjects: { Text: MockText, Rectangle: MockRect },
    },
  };
});

import { DebugOverlay } from './DebugOverlay';

describe('DebugOverlay', () => {
  it('renders MAXED when enemy pool saturated', () => {
    const textObj: any = { value: '' };
    const scene: any = {
      scale: { width: 800, height: 600 },
      add: {
        rectangle: () => ({ setOrigin() { return this; }, setScrollFactor() { return this; }, setDepth() { return this; }, setPosition() { return this; }, setVisible() { return this; }, destroy() {} }),
        text: (_x: number, _y: number, _t: string) => ({
          setOrigin() { return this; },
          setScrollFactor() { return this; },
          setDepth() { return this; },
          setPosition() { return this; },
          setVisible() { return this; },
          setText(t: string) { textObj.value = t; return this; },
          destroy() {},
        }),
      },
    };

    const overlay = new DebugOverlay(scene, {
      spawnSystem: {
        getEnemyGroup: () => ({ getLength: () => 400 }),
        getActiveCount: () => 400,
        getSpawnTimerSec: () => 1,
        getSpawnIntervalSec: () => 0.3,
        getBurstSize: () => 15,
        getSpawnStallReason: () => 'POOL_SATURATED',
        isBossActive: () => false,
        getSpawnedBossCount: () => 1,
        getBossScheduledCount: () => 1,
      } as any,
      weaponSystem: {
        getProjectileGroup: () => ({ countActive: () => 3, getLength: () => 10 }),
      } as any,
      timeManager: {
        isGameplayPaused: () => false,
        getEffectiveTimeScale: () => 1,
        getActiveTokenKeys: () => ['SLOW_MO'],
      } as any,
    });

    overlay.setVisible(true);
    overlay.update(16);
    expect(textObj.value).toContain('MAXED');
    expect(textObj.value).toContain('Status: [POOL_SATURATED]');
  });
});

