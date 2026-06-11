import { describe, expect, it, vi } from 'vitest';
import { AnimationController } from './AnimationController';

function makeSpriteStub() {
  return {
    setTexture: vi.fn(),
  };
}

describe('AnimationController', () => {
  it('starts in idle at frame 0', () => {
    const sprite = makeSpriteStub();
    const c = new AnimationController({
      sprite: sprite as unknown as Phaser.GameObjects.Sprite,
      subject: 'haggis',
      variant: 'classic',
    });
    expect(c.getState()).toBe('idle');
    expect(c.getFrame()).toBe(0);
  });

  it('tick advances frame over time and calls setTexture on boundary', () => {
    const sprite = makeSpriteStub();
    const c = new AnimationController({
      sprite: sprite as unknown as Phaser.GameObjects.Sprite,
      subject: 'haggis',
      variant: 'classic',
    });
    // idle at 2 fps = 500 ms/frame; one tick of 500 ms advances to frame 1
    c.tick(500, {
      velocityMag: 0,
      hurtEdge: false,
      attackEdge: false,
      celebrateEdge: false,
      hp: 100,
    });
    expect(c.getFrame()).toBe(1);
    expect(sprite.setTexture).toHaveBeenCalledWith('haggis_classic_idle_1');
  });

  it('transitions state and resets frame when signals fire', () => {
    const sprite = makeSpriteStub();
    const c = new AnimationController({
      sprite: sprite as unknown as Phaser.GameObjects.Sprite,
      subject: 'haggis',
      variant: 'classic',
    });
    c.tick(10, {
      velocityMag: 200,
      hurtEdge: false,
      attackEdge: false,
      celebrateEdge: false,
      hp: 100,
    });
    expect(c.getState()).toBe('walking');
    expect(c.getFrame()).toBe(0); // frame resets on state change
    expect(sprite.setTexture).toHaveBeenLastCalledWith('haggis_classic_walking_0');
  });

  it('does not call setTexture when state + frame are unchanged', () => {
    const sprite = makeSpriteStub();
    const c = new AnimationController({
      sprite: sprite as unknown as Phaser.GameObjects.Sprite,
      subject: 'haggis',
      variant: 'classic',
    });
    // Initial setTexture on construction = 1 call
    const initialCalls = sprite.setTexture.mock.calls.length;
    // Tick with too-small delta to advance; no state change
    c.tick(10, {
      velocityMag: 0,
      hurtEdge: false,
      attackEdge: false,
      celebrateEdge: false,
      hp: 100,
    });
    expect(sprite.setTexture.mock.calls.length).toBe(initialCalls);
  });
});
