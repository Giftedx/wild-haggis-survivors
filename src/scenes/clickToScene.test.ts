import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clickToScene } from './clickToScene';
import { audio } from '../systems/AudioSystem';

describe('clickToScene', () => {
  beforeEach(() => {
    vi.spyOn(audio, 'playClick').mockImplementation(() => {});
  });

  it('returns a fresh handler each call (no cross-binding)', () => {
    const sceneA = { scene: { start: vi.fn() } };
    const sceneB = { scene: { start: vi.fn() } };
    const a = clickToScene(sceneA as any, 'X');
    const b = clickToScene(sceneB as any, 'Y');
    expect(a).not.toBe(b);
  });

  it('plays the click SFX before starting the scene', () => {
    const start = vi.fn();
    const order: string[] = [];
    (audio.playClick as ReturnType<typeof vi.fn>).mockImplementation(() => order.push('click'));
    start.mockImplementation(() => order.push('start'));
    const handler = clickToScene({ scene: { start } } as any, 'MainMenu');
    handler();
    expect(order).toEqual(['click', 'start']);
  });

  it('passes the supplied scene key to scene.start', () => {
    const start = vi.fn();
    const handler = clickToScene({ scene: { start } } as any, 'Chronicle');
    handler();
    expect(start).toHaveBeenCalledWith('Chronicle');
  });
});
