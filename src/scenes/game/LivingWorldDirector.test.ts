import { describe, it, expect } from 'vitest';
import {
  LivingWorldDirector,
  getMomentPresenceWeight,
  type LivingWorldSubsystem,
} from './LivingWorldDirector';
import type {
  LivingWorldMoment,
  LivingWorldRunContext,
} from './livingWorldTypes';

const SAMPLE_CTX: LivingWorldRunContext = {
  runSeed: 1234,
  variantKey: 'classic',
  curseKey: null,
  seasonalEventKey: null,
  biomeId: 'heather',
  hpFraction: 1,
  gameTimeSec: 0,
  reduceParticles: false,
  reduceFlashing: false,
};

function makeRecordingSubsystem(id: string) {
  const moments: LivingWorldMoment[] = [];
  const ticks: number[] = [];
  let destroyed = false;
  const sub: LivingWorldSubsystem = {
    id,
    update: (delta) => {
      ticks.push(delta);
    },
    onMoment: (moment) => {
      moments.push(moment);
    },
    destroy: () => {
      destroyed = true;
    },
  };
  return { sub, moments, ticks, isDestroyed: () => destroyed };
}

describe('LivingWorldDirector', () => {
  it('starts empty and has no last context', () => {
    const d = new LivingWorldDirector();
    expect(d.subsystemCount()).toBe(0);
    expect(d.getLastContext()).toBeNull();
    expect(d.momentCountForTesting).toBe(0);
  });

  it('registers a subsystem and ticks it on update', () => {
    const d = new LivingWorldDirector();
    const a = makeRecordingSubsystem('a');
    d.addSubsystem(a.sub);
    d.update(16.67, SAMPLE_CTX);
    expect(a.ticks).toEqual([16.67]);
    expect(d.getLastContext()).toBe(SAMPLE_CTX);
  });

  it('ignores duplicate subsystem registration', () => {
    const d = new LivingWorldDirector();
    const a = makeRecordingSubsystem('dup');
    d.addSubsystem(a.sub);
    // Second registration with the same id is silently ignored.
    d.addSubsystem(a.sub);
    expect(d.subsystemCount()).toBe(1);
  });

  it('fans moments out to every subsystem and listener', () => {
    const d = new LivingWorldDirector();
    const a = makeRecordingSubsystem('a');
    const b = makeRecordingSubsystem('b');
    d.addSubsystem(a.sub);
    d.addSubsystem(b.sub);

    const seen: LivingWorldMoment[] = [];
    const unsub = d.addListener((m) => seen.push(m));

    const moment: LivingWorldMoment = {
      kind: 'companion_called',
      companionKey: 'sheepdog',
      playerX: 0,
      playerY: 0,
    };
    d.notify(moment);

    expect(a.moments).toEqual([moment]);
    expect(b.moments).toEqual([moment]);
    expect(seen).toEqual([moment]);
    expect(d.momentCountForTesting).toBe(1);

    unsub();
    d.notify(moment);
    expect(seen).toHaveLength(1);
    expect(a.moments).toHaveLength(2);
  });

  it('passes the most recent run context into onMoment', () => {
    const d = new LivingWorldDirector();
    let receivedCtx: LivingWorldRunContext | null = null;
    d.addSubsystem({
      id: 'spy',
      onMoment: (_m, ctx) => {
        receivedCtx = ctx;
      },
    });
    const ctxA: LivingWorldRunContext = { ...SAMPLE_CTX, gameTimeSec: 1 };
    d.update(0, ctxA);
    d.notify({ kind: 'form_shifted', from: 'haggis', to: 'seal' });
    expect(receivedCtx).toBe(ctxA);
  });

  it('reset clears registries and last context', () => {
    const d = new LivingWorldDirector();
    const a = makeRecordingSubsystem('a');
    d.addSubsystem(a.sub);
    d.addListener(() => {});
    d.update(1, SAMPLE_CTX);
    d.notify({ kind: 'rhythm_aligned', bonusMultiplier: 1.15 });

    d.reset();

    expect(d.subsystemCount()).toBe(0);
    expect(d.getLastContext()).toBeNull();
    expect(d.momentCountForTesting).toBe(0);
    // Re-notify should be a no-op for the previously-registered subsystem.
    d.notify({ kind: 'rhythm_aligned', bonusMultiplier: 1.15 });
    expect(a.moments).toHaveLength(1);
  });

  it('destroy invokes subsystem destroy hooks and becomes a no-op', () => {
    const d = new LivingWorldDirector();
    const a = makeRecordingSubsystem('a');
    d.addSubsystem(a.sub);
    d.destroy();
    expect(a.isDestroyed()).toBe(true);
    d.destroy();
    expect(a.isDestroyed()).toBe(true);
    d.addSubsystem(a.sub);
    expect(d.subsystemCount()).toBe(0);
    d.notify({ kind: 'rhythm_aligned', bonusMultiplier: 1.15 });
    expect(d.momentCountForTesting).toBe(0);
  });

  it('listener registration during a notify does not blow up iteration', () => {
    const d = new LivingWorldDirector();
    const order: string[] = [];
    d.addListener(() => {
      order.push('first');
      d.addListener(() => order.push('late'));
    });
    d.notify({ kind: 'atmosphere_motif_active', motifKey: 'up_helly_aa' });
    expect(order).toEqual(['first']);
  });
});

describe('LivingWorldDirector.getPresence (music-bridge axis)', () => {
  it('starts at 0 with no subsystems and no moments', () => {
    const d = new LivingWorldDirector();
    expect(d.getPresence()).toBe(0);
  });

  it('clamps to [0, 1] even with overlapping pulses', () => {
    const d = new LivingWorldDirector();
    // 30 companion_called pulses (35% each → 10.5 raw) — must clamp.
    for (let i = 0; i < 30; i++) {
      d.notify({ kind: 'companion_called', companionKey: 'sheepdog', playerX: 0, playerY: 0 });
    }
    const p = d.getPresence();
    expect(p).toBeLessThanOrEqual(1);
    expect(p).toBeGreaterThan(0.5);
  });

  it('decays the moment accumulator with elapsed time', () => {
    const d = new LivingWorldDirector();
    d.notify({ kind: 'companion_called', companionKey: 'sheepdog', playerX: 0, playerY: 0 });
    const before = d.getPresence();
    // 30 seconds of decay (30000ms total, fed in chunks of 1000 because
    // the decay term clamps `delta/6000` to [0, 1] per call).
    for (let i = 0; i < 30; i++) {
      d.update(1000, SAMPLE_CTX);
    }
    const after = d.getPresence();
    expect(after).toBeLessThan(before);
  });

  it('includes a subsystem floor when at least one subsystem is registered', () => {
    const d = new LivingWorldDirector();
    expect(d.getPresence()).toBe(0);
    d.addSubsystem({ id: 'floor-test' });
    const p = d.getPresence();
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('reset returns presence to 0', () => {
    const d = new LivingWorldDirector();
    d.addSubsystem({ id: 'a' });
    d.notify({ kind: 'companion_called', companionKey: 'sheepdog', playerX: 0, playerY: 0 });
    expect(d.getPresence()).toBeGreaterThan(0);
    d.reset();
    expect(d.getPresence()).toBe(0);
  });

  it('per-moment weights are non-negative and within sanity bounds', () => {
    const weights = [
      getMomentPresenceWeight({ kind: 'companion_called', companionKey: 'sheepdog', playerX: 0, playerY: 0 }),
      getMomentPresenceWeight({ kind: 'companion_dismissed', companionKey: 'sheepdog' }),
      getMomentPresenceWeight({ kind: 'form_shifted', from: 'haggis', to: 'seal' }),
      getMomentPresenceWeight({ kind: 'rhythm_aligned', bonusMultiplier: 1.3 }),
      getMomentPresenceWeight({ kind: 'atmosphere_motif_active', motifKey: 'up_helly_aa' }),
    ];
    for (const w of weights) {
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(0.5);
    }
  });
});
