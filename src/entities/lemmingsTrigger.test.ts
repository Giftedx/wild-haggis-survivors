import { describe, expect, it } from 'vitest';
import {
  LEMMINGS_BIOME_ID,
  LEMMINGS_IDLE_THRESHOLD_MS,
  createLemmingsTriggerState,
  hasOtherVariantSeenLemmings,
  hasVariantSeenLemmings,
  markVariantSeenLemmings,
  tickLemmingsTrigger,
  type LemmingsTriggerInput,
} from './lemmingsTrigger';

const STILL_IN_COASTAL: Omit<LemmingsTriggerInput, 'dtMs'> = {
  biomeId: LEMMINGS_BIOME_ID,
  playerStill: true,
  variantAlreadyFired: false,
};

describe('lemmingsTrigger — defaults', () => {
  it('starts at idleMs 0, fired false', () => {
    const s = createLemmingsTriggerState();
    expect(s.idleMs).toBe(0);
    expect(s.fired).toBe(false);
  });

  it('coastal biome id is the documented constant', () => {
    expect(LEMMINGS_BIOME_ID).toBe('coastal');
  });

  it('idle threshold is the documented 90 s', () => {
    expect(LEMMINGS_IDLE_THRESHOLD_MS).toBe(90_000);
  });
});

describe('lemmingsTrigger — gates', () => {
  it('wrong biome → idle stays 0, never accumulates', () => {
    let s = createLemmingsTriggerState();
    for (let i = 0; i < 100; i++) {
      const r = tickLemmingsTrigger(s, {
        dtMs: 1000,
        biomeId: 'pine',
        playerStill: true,
        variantAlreadyFired: false,
      });
      expect(r.triggeredEdge).toBe(false);
      expect(r.isAccumulating).toBe(false);
      s = r.state;
    }
    expect(s.idleMs).toBe(0);
    expect(s.fired).toBe(false);
  });

  it('null biome (run-start frame) treated as wrong biome', () => {
    const r = tickLemmingsTrigger(createLemmingsTriggerState(), {
      dtMs: 1000,
      biomeId: null,
      playerStill: true,
      variantAlreadyFired: false,
    });
    expect(r.state.idleMs).toBe(0);
    expect(r.isAccumulating).toBe(false);
  });

  it('player moving in coastal → idle stays 0', () => {
    let s = createLemmingsTriggerState();
    for (let i = 0; i < 100; i++) {
      const r = tickLemmingsTrigger(s, {
        ...STILL_IN_COASTAL,
        dtMs: 1000,
        playerStill: false,
      });
      expect(r.triggeredEdge).toBe(false);
      s = r.state;
    }
    expect(s.idleMs).toBe(0);
  });

  it('variantAlreadyFired locks the helper dormant regardless of biome/stillness', () => {
    let s = createLemmingsTriggerState();
    for (let i = 0; i < 200; i++) {
      const r = tickLemmingsTrigger(s, {
        ...STILL_IN_COASTAL,
        dtMs: 1000,
        variantAlreadyFired: true,
      });
      expect(r.triggeredEdge).toBe(false);
      expect(r.isAccumulating).toBe(false);
      expect(r.progress).toBe(0);
      s = r.state;
    }
    expect(s.idleMs).toBe(0);
    expect(s.fired).toBe(false);
  });
});

describe('lemmingsTrigger — accumulation', () => {
  it('right biome + still → idleMs accumulates dt by dt', () => {
    let s = createLemmingsTriggerState();
    for (let i = 0; i < 30; i++) {
      const r = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: 16 });
      expect(r.isAccumulating).toBe(true);
      s = r.state;
    }
    expect(s.idleMs).toBe(16 * 30);
    expect(s.fired).toBe(false);
  });

  it('progress fraction matches idleMs / threshold', () => {
    let s = createLemmingsTriggerState();
    s = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: LEMMINGS_IDLE_THRESHOLD_MS / 2 }).state;
    const r = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: 0 });
    // dt 0 → no change, but no reset either (still in coastal + still).
    expect(r.progress).toBeCloseTo(0.5, 5);
    expect(r.isAccumulating).toBe(true);
  });

  it('movement during accumulation resets to 0', () => {
    let s = createLemmingsTriggerState();
    s = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: 60_000 }).state;
    expect(s.idleMs).toBe(60_000);
    const r = tickLemmingsTrigger(s, {
      ...STILL_IN_COASTAL,
      dtMs: 16,
      playerStill: false,
    });
    expect(r.state.idleMs).toBe(0);
    expect(r.isAccumulating).toBe(false);
    expect(r.triggeredEdge).toBe(false);
  });

  it('biome change during accumulation resets to 0', () => {
    let s = createLemmingsTriggerState();
    s = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: 60_000 }).state;
    const r = tickLemmingsTrigger(s, {
      ...STILL_IN_COASTAL,
      dtMs: 16,
      biomeId: 'haar',
    });
    expect(r.state.idleMs).toBe(0);
    expect(r.state.fired).toBe(false);
  });

  it('paused frame (dtMs = 0) is a no-op — neither ticks nor resets', () => {
    let s = createLemmingsTriggerState();
    s = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: 30_000 }).state;
    const r = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: 0 });
    expect(r.state.idleMs).toBe(30_000);
  });

  it('negative dtMs is clamped (Phaser scene-reuse first-frame quirk)', () => {
    const s = createLemmingsTriggerState();
    const r = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: -50 });
    expect(r.state.idleMs).toBe(0);
  });
});

describe('lemmingsTrigger — fire edge', () => {
  it('crossing threshold fires triggeredEdge once + latches fired', () => {
    let s = createLemmingsTriggerState();
    let edges = 0;

    // Tick under threshold — no edge.
    for (let i = 0; i < 89; i++) {
      const r = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: 1000 });
      if (r.triggeredEdge) edges++;
      s = r.state;
    }
    expect(s.idleMs).toBe(89_000);
    expect(s.fired).toBe(false);
    expect(edges).toBe(0);

    // The 90th second crosses the threshold — edge fires.
    const fireFrame = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: 1000 });
    expect(fireFrame.triggeredEdge).toBe(true);
    expect(fireFrame.state.fired).toBe(true);
    expect(fireFrame.state.idleMs).toBe(LEMMINGS_IDLE_THRESHOLD_MS);
    expect(fireFrame.progress).toBe(1);
    s = fireFrame.state;

    // Subsequent ticks — fired latch is sticky, no further edges.
    for (let i = 0; i < 50; i++) {
      const r = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: 1000 });
      expect(r.triggeredEdge).toBe(false);
      expect(r.isAccumulating).toBe(false);
      s = r.state;
    }
  });

  it('big dtMs spike that overshoots the threshold still emits exactly one edge', () => {
    const s = createLemmingsTriggerState();
    const r = tickLemmingsTrigger(s, {
      ...STILL_IN_COASTAL,
      dtMs: LEMMINGS_IDLE_THRESHOLD_MS * 5,
    });
    expect(r.triggeredEdge).toBe(true);
    expect(r.state.fired).toBe(true);
    // idleMs clamps at the threshold even on overshoot — keeps progress
    // value bounded at 1 for downstream consumers.
    expect(r.state.idleMs).toBe(LEMMINGS_IDLE_THRESHOLD_MS);
  });

  it('post-trigger movement does not reset the fired latch', () => {
    let s = createLemmingsTriggerState();
    s = tickLemmingsTrigger(s, { ...STILL_IN_COASTAL, dtMs: LEMMINGS_IDLE_THRESHOLD_MS }).state;
    expect(s.fired).toBe(true);

    // Player walks away after the parade.
    const r = tickLemmingsTrigger(s, {
      ...STILL_IN_COASTAL,
      dtMs: 16,
      playerStill: false,
    });
    expect(r.state.fired).toBe(true);
    expect(r.triggeredEdge).toBe(false);
  });
});

describe('lemmingsTrigger — replay determinism', () => {
  it('identical input streams produce byte-identical state progression', () => {
    const inputs: LemmingsTriggerInput[] = [
      { ...STILL_IN_COASTAL, dtMs: 16 },
      { ...STILL_IN_COASTAL, dtMs: 16 },
      { ...STILL_IN_COASTAL, dtMs: 16, playerStill: false }, // reset
      { ...STILL_IN_COASTAL, dtMs: 1000 },
      { ...STILL_IN_COASTAL, dtMs: 1000, biomeId: 'pine' }, // reset
      { ...STILL_IN_COASTAL, dtMs: 50_000 },
      { ...STILL_IN_COASTAL, dtMs: 50_000 }, // crosses threshold
      { ...STILL_IN_COASTAL, dtMs: 16 },
    ];

    function run(): { idleMs: number; fired: boolean }[] {
      let s = createLemmingsTriggerState();
      const trace: { idleMs: number; fired: boolean }[] = [];
      for (const inp of inputs) {
        s = tickLemmingsTrigger(s, inp).state;
        trace.push({ idleMs: s.idleMs, fired: s.fired });
      }
      return trace;
    }

    const a = run();
    const b = run();
    expect(a).toEqual(b);
    // Sanity — the script is supposed to fire on the second 50 000 ms tick.
    expect(a[a.length - 2].fired).toBe(true);
  });
});

describe('lemmingsTrigger — save accessors', () => {
  it('hasVariantSeenLemmings returns false on empty array', () => {
    expect(hasVariantSeenLemmings([], 'classic')).toBe(false);
  });

  it('hasVariantSeenLemmings returns true when the key is present', () => {
    expect(hasVariantSeenLemmings(['classic', 'glaswegian'], 'classic')).toBe(true);
  });

  it('markVariantSeenLemmings appends the key when absent', () => {
    const next = markVariantSeenLemmings(['classic'], 'glaswegian');
    expect(next).toEqual(['classic', 'glaswegian']);
  });

  it('markVariantSeenLemmings is a no-op when the key is already present (returns same ref)', () => {
    const before = ['classic', 'glaswegian'];
    const next = markVariantSeenLemmings(before, 'classic');
    expect(next).toBe(before); // identity — no allocation when nothing changes
  });

  it('hasOtherVariantSeenLemmings is false on empty array (true first fire)', () => {
    expect(hasOtherVariantSeenLemmings([], 'classic')).toBe(false);
  });

  it('hasOtherVariantSeenLemmings ignores the current variant', () => {
    // Whether the caller reads before or after persisting this fire's
    // mark, the current variant's own entry never counts as "other".
    expect(hasOtherVariantSeenLemmings(['classic'], 'classic')).toBe(false);
  });

  it('hasOtherVariantSeenLemmings is true when a different variant fired first', () => {
    expect(hasOtherVariantSeenLemmings(['classic'], 'glaswegian')).toBe(true);
    expect(hasOtherVariantSeenLemmings(['classic', 'glaswegian'], 'glaswegian')).toBe(true);
  });
});
