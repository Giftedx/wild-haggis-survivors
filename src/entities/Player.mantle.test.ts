import { describe, expect, it, vi } from 'vitest';
import type { MantleTier } from '../animation/mantleTier';

function makeFakeSprite() {
  const state = { texture: 'mantle_classic_1', alpha: 0, visible: false };
  return {
    state,
    setTexture: vi.fn((key: string) => { state.texture = key; return undefined; }),
    setAlpha: vi.fn((a: number) => { state.alpha = a; return undefined; }),
    setVisible: vi.fn((v: boolean) => { state.visible = v; return undefined; }),
    setPosition: vi.fn(),
    setScale: vi.fn(),
    setDepth: vi.fn(),
    destroy: vi.fn(),
    scaleX: 1,
    scaleY: 1,
  };
}

function makeFakeTweens() {
  const calls: Array<Record<string, unknown>> = [];
  return {
    calls,
    add: vi.fn((cfg: Record<string, unknown>) => {
      calls.push(cfg);
      const alphaCfg = cfg.alpha as { to?: number } | number | undefined;
      const target = cfg.targets as { setAlpha: (a: number) => void };
      if (typeof alphaCfg === 'number') target.setAlpha(alphaCfg);
      else if (alphaCfg && typeof alphaCfg === 'object' && 'to' in alphaCfg) target.setAlpha(alphaCfg.to ?? 0);
      return {};
    }),
  };
}

import { applyMantleTier } from './Player.mantle';

describe('applyMantleTier', () => {
  it('tier 0 hides the overlay without tween', () => {
    const sprite = makeFakeSprite();
    const tweens = makeFakeTweens();
    applyMantleTier({
      overlay: sprite as unknown as Phaser.GameObjects.Sprite,
      tweens: tweens as unknown as Phaser.Tweens.TweenManager,
      variantKey: 'classic',
      nextTier: 0 as MantleTier,
      instant: false,
    });
    expect(sprite.setVisible).toHaveBeenLastCalledWith(false);
    expect(sprite.setAlpha).toHaveBeenLastCalledWith(0);
    expect(tweens.add).not.toHaveBeenCalled();
  });

  it('tier 1 with instant=true sets alpha directly and swaps texture', () => {
    const sprite = makeFakeSprite();
    const tweens = makeFakeTweens();
    applyMantleTier({
      overlay: sprite as unknown as Phaser.GameObjects.Sprite,
      tweens: tweens as unknown as Phaser.Tweens.TweenManager,
      variantKey: 'classic',
      nextTier: 1 as MantleTier,
      instant: true,
    });
    expect(sprite.setTexture).toHaveBeenCalledWith('mantle_classic_1');
    expect(sprite.setVisible).toHaveBeenLastCalledWith(true);
    expect(sprite.setAlpha).toHaveBeenLastCalledWith(1);
    expect(tweens.add).not.toHaveBeenCalled();
  });

  it('tier 2 with instant=false kicks a 300ms alpha tween', () => {
    const sprite = makeFakeSprite();
    const tweens = makeFakeTweens();
    applyMantleTier({
      overlay: sprite as unknown as Phaser.GameObjects.Sprite,
      tweens: tweens as unknown as Phaser.Tweens.TweenManager,
      variantKey: 'iron_belly',
      nextTier: 2 as MantleTier,
      instant: false,
    });
    expect(sprite.setTexture).toHaveBeenCalledWith('mantle_iron_belly_2');
    expect(sprite.setVisible).toHaveBeenLastCalledWith(true);
    expect(tweens.add).toHaveBeenCalledOnce();
    const cfg = tweens.calls[0];
    expect(cfg.duration).toBe(300);
  });
});
