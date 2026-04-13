import { describe, it, expect, vi } from 'vitest';
import { tryCameraShake } from './cameraShake';

function mockSettings(overrides: { screenShake?: boolean; motionScale?: number } = {}) {
  return {
    load: () => ({
      screenShake: overrides.screenShake ?? true,
      motionScale: overrides.motionScale ?? 1,
    }),
  } as any;
}

function mockCam() {
  return { shake: vi.fn() };
}

describe('tryCameraShake', () => {
  it('calls cam.shake with scaled intensity', () => {
    const cam = mockCam();
    tryCameraShake(cam, 100, 0.5, mockSettings());
    expect(cam.shake).toHaveBeenCalledWith(100, 0.5);
  });

  it('scales intensity by motionScale', () => {
    const cam = mockCam();
    tryCameraShake(cam, 100, 0.8, mockSettings({ motionScale: 0.5 }));
    expect(cam.shake).toHaveBeenCalledWith(100, 0.4);
  });

  it('skips when screenShake disabled', () => {
    const cam = mockCam();
    tryCameraShake(cam, 100, 0.5, mockSettings({ screenShake: false }));
    expect(cam.shake).not.toHaveBeenCalled();
  });

  it('skips when motionScale is 0', () => {
    const cam = mockCam();
    tryCameraShake(cam, 100, 0.5, mockSettings({ motionScale: 0 }));
    expect(cam.shake).not.toHaveBeenCalled();
  });

  it('skips when cam is null', () => {
    expect(() => tryCameraShake(null, 100, 0.5, mockSettings())).not.toThrow();
  });

  it('skips when cam is undefined', () => {
    expect(() => tryCameraShake(undefined, 100, 0.5, mockSettings())).not.toThrow();
  });

  it('duration not scaled by motionScale', () => {
    const cam = mockCam();
    tryCameraShake(cam, 200, 1, mockSettings({ motionScale: 0.3 }));
    expect(cam.shake).toHaveBeenCalledWith(200, 0.3);
  });
});
