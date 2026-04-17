import { describe, it, expect } from 'vitest';
import {
  resolveHudCooldownBarStyle,
  HUD_COOLDOWN_READY,
  HUD_COOLDOWN_CHARGING,
} from './hudCooldownBarStyle';

describe('resolveHudCooldownBarStyle — ready vs charging', () => {
  it('ready returns the saturated green style', () => {
    expect(resolveHudCooldownBarStyle(true)).toBe(HUD_COOLDOWN_READY);
    expect(HUD_COOLDOWN_READY.fillColor).toBe(0x44cc44);
  });

  it('charging returns the cool blue style', () => {
    expect(resolveHudCooldownBarStyle(false)).toBe(HUD_COOLDOWN_CHARGING);
    expect(HUD_COOLDOWN_CHARGING.fillColor).toBe(0x005eb8);
  });

  it('ready is more opaque than charging (bigger visual push when weapon is live)', () => {
    expect(HUD_COOLDOWN_READY.alpha).toBeGreaterThan(HUD_COOLDOWN_CHARGING.alpha);
  });

  it('colours are distinct (no accidental dup)', () => {
    expect(HUD_COOLDOWN_READY.fillColor).not.toBe(HUD_COOLDOWN_CHARGING.fillColor);
  });
});
