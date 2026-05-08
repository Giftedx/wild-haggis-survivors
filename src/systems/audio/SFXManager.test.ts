import { describe, expect, it } from 'vitest';
import { SFXManager, SFX_LIMITS } from './SFXManager';

describe('SFXManager', () => {
  it('allows at most xp_pickup maxConcurrent plays when time is frozen in the window', () => {
    const cfg = SFX_LIMITS.xp_pickup;
    const t = 0;
    const mgr = new SFXManager(() => t);
    let plays = 0;
    for (let i = 0; i < 20; i++) {
      mgr.tryPlay('xp_pickup', () => {
        plays++;
      });
    }
    expect(plays).toBe(cfg.maxConcurrent);
  });

  it('allows another play after the window advances', () => {
    let t = 0;
    const mgr = new SFXManager(() => t);
    const cfg = SFX_LIMITS.xp_pickup;
    let plays = 0;
    for (let i = 0; i < cfg.maxConcurrent; i++) {
      mgr.tryPlay('xp_pickup', () => {
        plays++;
      });
    }
    expect(plays).toBe(cfg.maxConcurrent);
    t += cfg.windowMs + 1;
    mgr.tryPlay('xp_pickup', () => {
      plays++;
    });
    expect(plays).toBe(cfg.maxConcurrent + 1);
  });

  it('pibroch_sting collapses bursts to a single chime per quarter-note window', () => {
    let t = 0;
    const mgr = new SFXManager(() => t);
    const cfg = SFX_LIMITS.pibroch_sting;
    expect(cfg.maxConcurrent).toBe(1);
    let plays = 0;
    // Burst of 30 aligned hits inside the same downbeat window.
    for (let i = 0; i < 30; i++) {
      mgr.tryPlay('pibroch_sting', () => { plays++; });
    }
    expect(plays).toBe(1);
    // Advance past the window — next aligned hit on a fresh downbeat
    // should chime again.
    t += cfg.windowMs + 1;
    mgr.tryPlay('pibroch_sting', () => { plays++; });
    expect(plays).toBe(2);
  });

  it('clear() resets gates', () => {
    const mgr = new SFXManager(() => 0);
    let plays = 0;
    for (let i = 0; i < SFX_LIMITS.hit.maxConcurrent; i++) {
      mgr.tryPlay('hit', () => {
        plays++;
      });
    }
    mgr.tryPlay('hit', () => {
      plays++;
    });
    expect(plays).toBe(SFX_LIMITS.hit.maxConcurrent);
    mgr.clear();
    mgr.tryPlay('hit', () => {
      plays++;
    });
    expect(plays).toBe(SFX_LIMITS.hit.maxConcurrent + 1);
  });
});
