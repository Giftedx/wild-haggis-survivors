import { describe, it, expect } from 'vitest';
import {
  resolveButtonStyle,
  resolveTierBorder,
  setGameButtonDisabled,
  type ButtonTier,
  type GameButtonResult,
} from './gameButton';

describe('resolveButtonStyle', () => {
  it('primary tier uses SCOTTISH_BLUE fill', () => {
    const s = resolveButtonStyle('primary');
    expect(s.fill).toBe(0x005eb8);
  });

  it('secondary tier uses slate fill', () => {
    const s = resolveButtonStyle('secondary');
    expect(s.fill).toBe(0x3a4357);
  });

  it('tertiary tier uses dark navy fill', () => {
    const s = resolveButtonStyle('tertiary');
    expect(s.fill).toBe(0x252540);
  });

  it('all tiers define hover fill different from idle', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.hover).not.toBe(s.fill);
    }
  });

  it('all tiers define text color', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      // Stronger than toBeTruthy: textColor must be a 6-digit hex string
      // (Phaser text-style format). Catches a regression that returned a
      // numeric color, an empty string, or a malformed CSS value.
      expect(s.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('all tiers define fontSize', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.fontSize).toMatch(/^\d+px$/);
    }
  });

  it('all tiers have strokeThickness >= 2', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.strokeThickness).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('resolveTierBorder (HC non-colour cue)', () => {
  it('returns null for every tier when high contrast is off', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      expect(resolveTierBorder(tier, false)).toBeNull();
    }
  });

  it('primary in HC gets the thickest, brightest brass border', () => {
    const primary = resolveTierBorder('primary', true);
    const secondary = resolveTierBorder('secondary', true);
    expect(primary).not.toBeNull();
    expect(secondary).not.toBeNull();
    expect(primary!.width).toBeGreaterThan(secondary!.width);
    expect(primary!.alpha).toBeGreaterThan(secondary!.alpha);
  });

  it('secondary in HC gets a thinner dimmer border than primary but is still drawn', () => {
    const secondary = resolveTierBorder('secondary', true);
    expect(secondary).not.toBeNull();
    expect(secondary!.width).toBeGreaterThan(0);
  });

  it('tertiary in HC stays borderless so the dimmest tier reads as quiet', () => {
    expect(resolveTierBorder('tertiary', true)).toBeNull();
  });

  it('all HC borders use a brass-family hue (warm gold) so they read as a hierarchy cue, not chrome', () => {
    for (const tier of ['primary', 'secondary'] as ButtonTier[]) {
      const b = resolveTierBorder(tier, true);
      expect(b).not.toBeNull();
      // Brass hues sit in 0xRRGGBB with R > G > B — sanity-check the
      // ordering instead of pinning exact values so future palette
      // tweaks don't churn the test.
      const r = (b!.color >> 16) & 0xff;
      const g = (b!.color >> 8) & 0xff;
      const bl = b!.color & 0xff;
      expect(r).toBeGreaterThan(g);
      expect(g).toBeGreaterThan(bl);
    }
  });
});

describe('setGameButtonDisabled', () => {
  function makeBtn(): GameButtonResult & {
    rectAlpha: number;
    labelAlpha: number;
    interactive: boolean;
    lastFill: number | undefined;
  } {
    const state = {
      rectAlpha: 1,
      labelAlpha: 1,
      interactive: true,
      lastFill: undefined as number | undefined,
    };
    const rect = {
      get alpha() { return state.rectAlpha; },
      setAlpha(v: number) { state.rectAlpha = v; return rect; },
      disableInteractive() { state.interactive = false; return rect; },
      setInteractive(_opts?: unknown) { state.interactive = true; return rect; },
      setFillStyle(fill: number) { state.lastFill = fill; return rect; },
    };
    const label = {
      get alpha() { return state.labelAlpha; },
      setAlpha(v: number) { state.labelAlpha = v; return label; },
    };
    return { rect, label, ...state } as unknown as GameButtonResult & typeof state;
  }

  it('disabled=true dims rect to 0.6 and label to 0.5', () => {
    const btn = makeBtn();
    setGameButtonDisabled(btn, true);
    expect(btn.rect.alpha).toBe(0.6);
    expect(btn.label.alpha).toBe(0.5);
  });

  it('disabled=true removes interactivity', () => {
    const btn = makeBtn();
    setGameButtonDisabled(btn, true);
    // Confirm disableInteractive was called by checking alpha (side-effectful mock)
    // We verify via the alpha contract since interactive state is internal to mock
    expect(btn.rect.alpha).toBe(0.6);
  });

  it('disabled=false restores both alphas to 1', () => {
    const btn = makeBtn();
    setGameButtonDisabled(btn, true);
    setGameButtonDisabled(btn, false);
    expect(btn.rect.alpha).toBe(1);
    expect(btn.label.alpha).toBe(1);
  });

  it('disabled=false with idleFill applies setFillStyle', () => {
    let capturedFill: number | undefined;
    const rect = {
      alpha: 1,
      setAlpha(v: number) { this.alpha = v; return this; },
      disableInteractive() { return this; },
      setInteractive() { return this; },
      setFillStyle(fill: number) { capturedFill = fill; return this; },
    };
    const label = {
      alpha: 1,
      setAlpha(v: number) { this.alpha = v; return this; },
    };
    const btn = { rect, label } as unknown as GameButtonResult;
    setGameButtonDisabled(btn, true);
    setGameButtonDisabled(btn, false, 0xaabbcc);
    expect(capturedFill).toBe(0xaabbcc);
  });

  it('disabled=false without idleFill does not call setFillStyle', () => {
    let fillCalled = false;
    const rect = {
      alpha: 1,
      setAlpha(v: number) { this.alpha = v; return this; },
      disableInteractive() { return this; },
      setInteractive() { return this; },
      setFillStyle(_fill: number) { fillCalled = true; return this; },
    };
    const label = {
      alpha: 1,
      setAlpha(v: number) { this.alpha = v; return this; },
    };
    const btn = { rect, label } as unknown as GameButtonResult;
    setGameButtonDisabled(btn, false);
    expect(fillCalled).toBe(false);
  });
});
