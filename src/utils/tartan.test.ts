import { describe, expect, it } from 'vitest';
import {
  buildTartanProfile,
  pickTopWeaponKey,
  renderTartan,
  resolveTartanProfile,
  type TartanProfile,
} from './tartan';

describe('pickTopWeaponKey', () => {
  it('returns the weapon with the highest damage', () => {
    expect(pickTopWeaponKey({ thistle_shot: 100, claymore: 250, bagpipes: 50 }))
      .toBe('claymore');
  });

  it('ignores zero / non-finite damage entries', () => {
    expect(pickTopWeaponKey({ thistle_shot: 0, claymore: NaN, bagpipes: 10 }))
      .toBe('bagpipes');
  });

  it('returns undefined for empty record', () => {
    expect(pickTopWeaponKey({})).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(pickTopWeaponKey(undefined)).toBeUndefined();
  });

  it('returns undefined when every entry is <= 0', () => {
    expect(pickTopWeaponKey({ a: 0, b: -5 })).toBeUndefined();
  });

  it('deterministic — same input gives same key on re-run', () => {
    const dmg = { a: 100, b: 200, c: 150 };
    expect(pickTopWeaponKey(dmg)).toBe(pickTopWeaponKey(dmg));
    expect(pickTopWeaponKey(dmg)).toBe('b');
  });
});

describe('buildTartanProfile', () => {
  it('default signature (no variant, no weapon) still returns a valid palette', () => {
    const p = buildTartanProfile({ victory: false });
    expect(typeof p.base).toBe('string');
    expect(typeof p.primary).toBe('string');
    expect(typeof p.secondary).toBe('string');
    expect(typeof p.accent).toBe('string');
    // Death accent is the muted slate.
    expect(p.accent).toBe('#8a93a8');
  });

  it('maps each shipped variant to a distinct base + primary colour pair', () => {
    const variants = ['classic', 'iron_belly', 'moor_runner', 'glen_forager',
      'surefoot', 'pipe_breath', 'laird', 'wee_ghostie', 'glaswegian'];
    const seen = new Set<string>();
    for (const v of variants) {
      const p = buildTartanProfile({ variantKey: v, victory: true });
      const key = `${p.base}|${p.primary}`;
      expect(seen.has(key), `variant ${v} shares a palette with an earlier variant`).toBe(false);
      seen.add(key);
    }
  });

  it('unknown variant key falls back to the neutral palette', () => {
    const p = buildTartanProfile({ variantKey: 'does_not_exist', victory: true });
    expect(p.base).toBe('#2a2420');
    expect(p.primary).toBe('#8a5a3a');
  });

  it('top weapon selects the matching accent colour', () => {
    expect(buildTartanProfile({ topWeaponKey: 'claymore', victory: true }).secondary)
      .toBe('#7a8fa8');
    expect(buildTartanProfile({ topWeaponKey: 'scotch_mist', victory: true }).secondary)
      .toBe('#a9b0b8');
    expect(buildTartanProfile({ topWeaponKey: 'nessie_tentacle', victory: true }).secondary)
      .toBe('#2f7a7a');
  });

  it('unknown weapon key falls back to the neutral secondary', () => {
    const p = buildTartanProfile({ topWeaponKey: 'made_up_weapon', victory: true });
    expect(p.secondary).toBe('#a8c068');
  });

  it('accent priority: cursed beats ironmoor / post-bell / victory / death', () => {
    const p = buildTartanProfile({
      victory: true, ironmoor: true, cursed: true, postBell: true,
    });
    expect(p.accent).toBe('#1a1a20');
  });

  it('accent priority: ironmoor beats post-bell / victory / death', () => {
    const p = buildTartanProfile({
      victory: true, ironmoor: true, postBell: true, cursed: false,
    });
    expect(p.accent).toBe('#e8e8ec');
  });

  it('accent priority: post-bell beats victory / death', () => {
    const p = buildTartanProfile({ victory: true, postBell: true });
    expect(p.accent).toBe('#ffb347');
  });

  it('victory without mod tags uses the warm gold accent', () => {
    const p = buildTartanProfile({ victory: true });
    expect(p.accent).toBe('#f7d27a');
  });

  it('death without mod tags uses the muted slate accent', () => {
    const p = buildTartanProfile({ victory: false });
    expect(p.accent).toBe('#8a93a8');
  });

  it('deterministic — same signature always returns an equal profile', () => {
    const sig = { variantKey: 'laird', topWeaponKey: 'claymore', victory: true, ironmoor: true };
    expect(buildTartanProfile(sig)).toEqual(buildTartanProfile(sig));
  });
});

describe('resolveTartanProfile', () => {
  it('plain death → procedural (no authored match), authoredId absent', () => {
    const r = resolveTartanProfile({ victory: false });
    expect(r.authoredId).toBeUndefined();
    expect(r.profile).toEqual(buildTartanProfile({ victory: false }));
  });

  it('plain victory → procedural (no authored match), variant fingerprint preserved', () => {
    const sig = { variantKey: 'laird', topWeaponKey: 'claymore', victory: true };
    const r = resolveTartanProfile(sig);
    expect(r.authoredId).toBeUndefined();
    expect(r.profile).toEqual(buildTartanProfile(sig));
  });

  it('Ironmoor victory → ironmoor_crown authored profile', () => {
    const r = resolveTartanProfile({ victory: true, ironmoor: true });
    expect(r.authoredId).toBe('ironmoor_crown');
    expect(r.profile.base).toBe('#12141a');
  });

  it('cursed victory → cursed_triumph authored profile', () => {
    const r = resolveTartanProfile({ victory: true, cursed: true });
    expect(r.authoredId).toBe('cursed_triumph');
  });

  it('post-Bell victory → taxman_reckoning authored profile', () => {
    const r = resolveTartanProfile({ victory: true, postBell: true });
    expect(r.authoredId).toBe('taxman_reckoning');
  });

  it('authored preset ignores variant + top weapon (authored is curated)', () => {
    const a = resolveTartanProfile({
      victory: true, ironmoor: true, variantKey: 'laird', topWeaponKey: 'claymore',
    });
    const b = resolveTartanProfile({
      victory: true, ironmoor: true, variantKey: 'classic', topWeaponKey: 'thistle_shot',
    });
    expect(a.profile).toEqual(b.profile);
  });

  it('deterministic — same signature returns equal result on re-run', () => {
    const sig = { victory: true, cursed: true, variantKey: 'moor_runner' };
    expect(resolveTartanProfile(sig)).toEqual(resolveTartanProfile(sig));
  });
});

describe('renderTartan', () => {
  // Minimal 2D context fake — records calls so we can assert behaviour
  // without a real canvas (tests run under node-env).
  interface FakeCall { fn: string; args: unknown[]; }
  function fakeCtx() {
    const calls: FakeCall[] = [];
    const ctx = {
      globalAlpha: 1,
      fillStyle: '',
      save() { calls.push({ fn: 'save', args: [] }); },
      restore() { calls.push({ fn: 'restore', args: [] }); },
      fillRect(x: number, y: number, w: number, h: number) {
        calls.push({ fn: 'fillRect', args: [x, y, w, h, (ctx as unknown as { fillStyle: string }).fillStyle, (ctx as unknown as { globalAlpha: number }).globalAlpha] });
      },
    };
    return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
  }

  const profile: TartanProfile = {
    base: '#111111', primary: '#222222', secondary: '#333333', accent: '#444444',
  };

  it('fills the base rect first', () => {
    const { ctx, calls } = fakeCtx();
    renderTartan(ctx, 5, 10, 60, 60, profile);
    const firstFill = calls.find((c) => c.fn === 'fillRect');
    expect(firstFill?.args.slice(0, 4)).toEqual([5, 10, 60, 60]);
    expect(firstFill?.args[4]).toBe('#111111');
  });

  it('wraps drawing in save / restore so caller alpha survives', () => {
    const { ctx, calls } = fakeCtx();
    renderTartan(ctx, 0, 0, 60, 60, profile);
    expect(calls[0].fn).toBe('save');
    expect(calls[calls.length - 1].fn).toBe('restore');
  });

  it('restores globalAlpha to its prior value', () => {
    const { ctx } = fakeCtx();
    (ctx as unknown as { globalAlpha: number }).globalAlpha = 0.7;
    renderTartan(ctx, 0, 0, 60, 60, profile);
    expect((ctx as unknown as { globalAlpha: number }).globalAlpha).toBe(0.7);
  });

  it('draws weft stripes at reduced alpha (blends warp + weft)', () => {
    const { ctx, calls } = fakeCtx();
    renderTartan(ctx, 0, 0, 60, 60, profile);
    const alphas = calls
      .filter((c) => c.fn === 'fillRect')
      .map((c) => c.args[5])
      .filter((a) => typeof a === 'number');
    // At least one fill at reduced alpha (weft pass).
    expect(alphas.some((a) => (a as number) < 1)).toBe(true);
    // At least one fill at full alpha (warp pass + base).
    expect(alphas.some((a) => (a as number) === 1)).toBe(true);
  });
});
