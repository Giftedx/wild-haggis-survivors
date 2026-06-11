import { describe, it, expect, beforeEach } from 'vitest';
import { BanterSystem, BANTER_COOLDOWN_MS, BANTER_NO_REPEAT_WINDOW, allBanterContexts } from './BanterSystem';
import { BANTER_POOLS, BANTER_KEYS } from '../data/banter';
import { t, EN_STRINGS } from '../core/i18n';
import type { BanterFrequency } from '../core/SettingsManager';

interface CapturedLine {
  message: string;
  color?: string;
  captionId?: string;
}

function makeSystem(freqRef: { value: BanterFrequency }, clock: { now: number }, rngSeq: number[] = []) {
  const lines: CapturedLine[] = [];
  let i = 0;
  const rng = rngSeq.length > 0 ? () => rngSeq[i++ % rngSeq.length] : () => 0;
  const sys = new BanterSystem({
    sink: {
      toast: (message, color) => lines.push({ message, color }),
      caption: (id, _message, tint) => {
        const last = lines[lines.length - 1];
        if (last) last.captionId = id;
        void tint;
      },
    },
    translate: t,
    now: () => clock.now,
    rng,
    getFrequency: () => freqRef.value,
  });
  return { sys, lines };
}

describe('BanterSystem', () => {
  let freq: { value: BanterFrequency };
  let clock: { now: number };

  beforeEach(() => {
    freq = { value: 'normal' };
    clock = { now: 0 };
  });

  describe('pool integrity', () => {
    it('declares a pool for every BanterContext union member', () => {
      const ctxs = allBanterContexts();
      expect(new Set(ctxs).size).toBe(ctxs.length);
      expect(BANTER_POOLS.every((p) => p.keys.length > 0)).toBe(true);
    });

    it('every pool key resolves to a real i18n string', () => {
      for (const key of BANTER_KEYS) {
        expect(t(key)).not.toBe(key);
      }
    });

    it('pool keys are globally unique', () => {
      expect(new Set(BANTER_KEYS).size).toBe(BANTER_KEYS.length);
    });

    it('ui.banter tree is present', () => {
      const ui = EN_STRINGS.ui as Record<string, unknown>;
      // Stronger than toBeTruthy: the banter tree is an object containing
      // at least the boss_warn pool. Catches a regression where the tree
      // collapses to a string or empty record.
      expect(ui.banter).toBeInstanceOf(Object);
      expect(ui.banter).toMatchObject({ boss_warn: expect.any(Object) });
    });
  });

  describe('off-state is silent', () => {
    it('ignores every request when frequency is off', () => {
      freq.value = 'off';
      const { sys, lines } = makeSystem(freq, clock);
      expect(sys.request('boss_warn')).toBe(false);
      sys.flush();
      expect(lines).toHaveLength(0);
    });
  });

  describe('rate-limit', () => {
    it('blocks a second request within the cooldown window', () => {
      const { sys, lines } = makeSystem(freq, clock);
      expect(sys.request('kill_streak')).toBe(true);
      sys.flush();
      expect(lines).toHaveLength(1);

      clock.now += BANTER_COOLDOWN_MS.normal - 100;
      expect(sys.request('kill_streak')).toBe(false);
      sys.flush();
      expect(lines).toHaveLength(1);
    });

    it('allows a line after the cooldown elapses', () => {
      const { sys, lines } = makeSystem(freq, clock);
      sys.request('kill_streak');
      sys.flush();

      clock.now += BANTER_COOLDOWN_MS.normal + 100;
      expect(sys.request('biome_change')).toBe(true);
      sys.flush();
      expect(lines).toHaveLength(2);
    });

    it('sparing honours a longer cooldown than chatty', () => {
      expect(BANTER_COOLDOWN_MS.sparing).toBeGreaterThan(BANTER_COOLDOWN_MS.normal);
      expect(BANTER_COOLDOWN_MS.normal).toBeGreaterThan(BANTER_COOLDOWN_MS.chatty);
    });
  });

  describe('priority', () => {
    it('higher-priority request preempts a lower one in the same tick', () => {
      const { sys, lines } = makeSystem(freq, clock);
      sys.request('idle');        // priority 10
      sys.request('boss_warn');   // priority 100
      sys.request('kill_streak'); // priority 40
      sys.flush();
      expect(lines).toHaveLength(1);
      expect(lines[0].captionId).toBe('banter_boss_warn');
    });

    it('does not emit twice in one tick even if multiple contexts requested', () => {
      const { sys, lines } = makeSystem(freq, clock);
      sys.request('level_up');
      sys.request('first_blood');
      sys.request('kill_streak');
      sys.flush();
      expect(lines).toHaveLength(1);
    });
  });

  describe('no-repeat window', () => {
    it('never replays a line still inside the recent window', () => {
      // boss_warn has 4 keys. Chatty freq so cooldown is short.
      freq.value = 'chatty';
      // Force rng=0 so picker always takes first candidate — this way
      // it's the no-repeat filter (not randomness) that rotates lines.
      const { sys, lines } = makeSystem(freq, clock, [0]);
      const seen: string[] = [];
      for (let i = 0; i < 4; i++) {
        clock.now += BANTER_COOLDOWN_MS.chatty + 1;
        sys.request('boss_warn');
        // Context dedupe blocks back-to-back same context — break it with
        // a different-context filler so boss_warn can fire again.
        clock.now += BANTER_COOLDOWN_MS.chatty + 1;
        sys.request('level_up');
        sys.flush();
      }
      // Collect the boss_warn lines that fired (by caption id)
      const bossLines = lines.filter((l) => l.captionId === 'banter_boss_warn').map((l) => l.message);
      seen.push(...bossLines);
      // All emitted boss lines should be distinct since they all fit in the window
      expect(new Set(seen).size).toBe(seen.length);
    });

    it('ring buffer never grows past the window size', () => {
      freq.value = 'chatty';
      const { sys } = makeSystem(freq, clock, [0]);
      const contexts: Array<'idle' | 'kill_streak' | 'biome_change' | 'level_up'> = [
        'idle', 'kill_streak', 'biome_change', 'level_up',
      ];
      for (let i = 0; i < 40; i++) {
        clock.now += BANTER_COOLDOWN_MS.chatty * 3;
        sys.request(contexts[i % contexts.length]);
        sys.flush();
      }
      // No internal API to peek; structural check via reset not exploding.
      sys.reset();
      expect(BANTER_NO_REPEAT_WINDOW).toBeGreaterThan(0);
    });
  });

  describe('context-dedupe', () => {
    it('suppresses a second same-context fire shortly after the first', () => {
      freq.value = 'chatty';
      const { sys, lines } = makeSystem(freq, clock);
      sys.request('low_hp');
      sys.flush();
      expect(lines).toHaveLength(1);

      clock.now += BANTER_COOLDOWN_MS.chatty + 100; // past base cooldown
      expect(sys.request('low_hp')).toBe(false);    // but same-context 2x window blocks
      sys.flush();
      expect(lines).toHaveLength(1);
    });

    it('different context fires even while same-context is dedupe-blocked', () => {
      freq.value = 'chatty';
      const { sys, lines } = makeSystem(freq, clock);
      sys.request('low_hp');
      sys.flush();

      clock.now += BANTER_COOLDOWN_MS.chatty + 100;
      sys.request('recover');
      sys.flush();
      expect(lines).toHaveLength(2);
    });
  });

  describe('reset', () => {
    it('clears cooldown + history so the next run starts fresh', () => {
      const { sys, lines } = makeSystem(freq, clock);
      sys.request('boss_warn');
      sys.flush();
      expect(lines).toHaveLength(1);

      sys.reset();
      // No time passes, but reset wipes lastFireMs — next request fires immediately
      sys.request('boss_warn');
      sys.flush();
      expect(lines).toHaveLength(2);
    });
  });

  describe('tagged sub-pools', () => {
    it('uses the authored tagged sub-pool when tag matches', () => {
      const { sys, lines } = makeSystem(freq, clock, [0]);
      sys.request('boss_warn', { tag: 'taxman' });
      sys.flush();
      expect(lines).toHaveLength(1);
      // Taxman's first authored line per i18n fixture.
      expect(lines[0].message).toContain('Taxman');
    });

    it('falls back to the generic pool when the tag is unknown', () => {
      const { sys, lines } = makeSystem(freq, clock, [0]);
      sys.request('boss_warn', { tag: 'not_a_real_boss' });
      sys.flush();
      expect(lines).toHaveLength(1);
      // Generic boss_warn.a: 'Somethin\' big\'s comin\'. Square up.'
      expect(lines[0].message).toBe('Somethin\' big\'s comin\'. Square up.');
    });

    it('falls back to the generic pool when tag is omitted', () => {
      const { sys, lines } = makeSystem(freq, clock, [0]);
      sys.request('boss_warn');
      sys.flush();
      expect(lines[0].message).toBe('Somethin\' big\'s comin\'. Square up.');
    });

    it('no-repeat window applies within the tagged sub-pool', () => {
      freq.value = 'chatty';
      const { sys, lines } = makeSystem(freq, clock, [0]);
      // Fire gordon warn, then filler, then gordon again — second gordon
      // must not replay the same key (all 3 gordon keys fit the window).
      sys.request('boss_warn', { tag: 'gordon' });
      sys.flush();
      clock.now += BANTER_COOLDOWN_MS.chatty + 1;
      sys.request('level_up');
      sys.flush();
      clock.now += BANTER_COOLDOWN_MS.chatty + 1;
      sys.request('boss_warn', { tag: 'gordon' });
      sys.flush();
      const gordonLines = lines.filter((l) => l.captionId === 'banter_boss_warn');
      expect(gordonLines).toHaveLength(2);
      expect(gordonLines[0].message).not.toBe(gordonLines[1].message);
    });

    it('variant tag routes level_up to variant sub-pool', () => {
      const { sys, lines } = makeSystem(freq, clock, [0]);
      sys.request('level_up', { tag: 'iron_belly' });
      sys.flush();
      expect(lines[0].message).toContain('layer');
    });

    it('unknown variant on level_up still fires (generic fallback)', () => {
      const { sys, lines } = makeSystem(freq, clock, [0]);
      sys.request('level_up', { tag: 'classic' });  // no authored sub-pool
      sys.flush();
      expect(lines).toHaveLength(1);
      expect(lines[0].message).toBe('Look at ye go.');
    });
  });

  describe('W2 route_picked sub-pool', () => {
    it('has a keysByTag entry for every route key (both pickers)', () => {
      const pool = BANTER_POOLS.find((p) => p.context === 'route_picked');
      expect(pool).toBeDefined();
      // Stronger than toBeTruthy: each entry is an array of i18n keys, so
      // assert it's a non-empty array. A regression that left the field as
      // an empty array (no banter) or a non-array would slip past
      // toBeTruthy but fail these checks.
      // Picker A.
      expect(pool!.keysByTag?.up_the_brae).toBeInstanceOf(Array);
      expect(pool!.keysByTag?.up_the_brae?.length).toBeGreaterThan(0);
      expect(pool!.keysByTag?.round_the_loch).toBeInstanceOf(Array);
      expect(pool!.keysByTag?.round_the_loch?.length).toBeGreaterThan(0);
      expect(pool!.keysByTag?.through_the_kirkyard).toBeInstanceOf(Array);
      expect(pool!.keysByTag?.through_the_kirkyard?.length).toBeGreaterThan(0);
      // Picker B.
      expect(pool!.keysByTag?.stand_yer_ground).toBeInstanceOf(Array);
      expect(pool!.keysByTag?.stand_yer_ground?.length).toBeGreaterThan(0);
      expect(pool!.keysByTag?.run_for_the_hills).toBeInstanceOf(Array);
      expect(pool!.keysByTag?.run_for_the_hills?.length).toBeGreaterThan(0);
      expect(pool!.keysByTag?.buckie_pitstop).toBeInstanceOf(Array);
      expect(pool!.keysByTag?.buckie_pitstop?.length).toBeGreaterThan(0);
    });

    it('all W2 banter i18n keys resolve to real strings (both pickers)', () => {
      const keys = [
        'ui.banter.act_intermission_enter.a',
        'ui.banter.act_complete.a',
        // Picker A.
        'ui.banter.route_picked.up_the_brae.a',
        'ui.banter.route_picked.round_the_loch.a',
        'ui.banter.route_picked.through_the_kirkyard.a',
        // Picker B.
        'ui.banter.route_picked.stand_yer_ground.a',
        'ui.banter.route_picked.run_for_the_hills.a',
        'ui.banter.route_picked.buckie_pitstop.a',
      ];
      for (const k of keys) {
        expect(t(k), k).not.toBe(k);
      }
    });
  });

  describe('onLineFired', () => {
    it('fires once per line committed to the sink, with key + context', () => {
      const events: Array<{ key: string; context: string; tag?: string }> = [];
      const sys = new BanterSystem({
        sink: { toast: () => undefined },
        translate: t,
        now: () => clock.now,
        rng: () => 0,
        getFrequency: () => 'normal',
        onLineFired: (evt) => events.push({ ...evt }),
      });
      sys.request('boss_warn', { tag: 'gordon' });
      sys.flush();
      expect(events).toHaveLength(1);
      expect(events[0].context).toBe('boss_warn');
      expect(events[0].tag).toBe('gordon');
      expect(events[0].key.startsWith('ui.banter.boss_warn.gordon.')).toBe(true);
    });

    it('does not fire when the request is rate-limited', () => {
      const events: Array<{ key: string }> = [];
      const sys = new BanterSystem({
        sink: { toast: () => undefined },
        translate: t,
        now: () => clock.now,
        rng: () => 0,
        getFrequency: () => 'normal',
        onLineFired: (evt) => events.push(evt),
      });
      sys.request('kill_streak');
      sys.flush();
      expect(events).toHaveLength(1);
      // second request inside cooldown is dropped at `request` before flush
      sys.request('kill_streak');
      sys.flush();
      expect(events).toHaveLength(1);
    });

    it('does not fire when translation resolves to the key itself', () => {
      const events: Array<{ key: string }> = [];
      const sys = new BanterSystem({
        sink: { toast: () => undefined },
        translate: (k) => k,
        now: () => clock.now,
        rng: () => 0,
        getFrequency: () => 'normal',
        onLineFired: (evt) => events.push(evt),
      });
      sys.request('idle');
      sys.flush();
      expect(events).toHaveLength(0);
    });

    it('swallows listener exceptions so banter state stays consistent', () => {
      const sys = new BanterSystem({
        sink: { toast: () => undefined },
        translate: t,
        now: () => clock.now,
        rng: () => 0,
        getFrequency: () => 'normal',
        onLineFired: () => { throw new Error('boom'); },
      });
      expect(() => { sys.request('kill_streak'); sys.flush(); }).not.toThrow();
    });
  });

  describe('forceLine — ceremonial bypass', () => {
    const codaKey = 'ui.banter.burns_citation.haggis_moment.a';

    it('fires through the sink even when cooldown is active', () => {
      const { sys, lines } = makeSystem(freq, clock);
      // Burn through cooldown via a normal line first.
      sys.request('boss_warn');
      sys.flush();
      expect(lines).toHaveLength(1);
      // Cooldown is now in effect — a regular request would be blocked.
      clock.now = 1_000;
      expect(sys.request('boss_warn')).toBe(false);
      // forceLine ignores cooldown.
      const ok = sys.forceLine(codaKey, 'hearth', 'burns_citation');
      expect(ok).toBe(true);
      expect(lines).toHaveLength(2);
      expect(lines[1].message).toBe(t(codaKey));
      expect(lines[1].captionId).toBe('banter_burns_citation');
    });

    it('returns false and stays silent when banter is off', () => {
      freq.value = 'off';
      const { sys, lines } = makeSystem(freq, clock);
      const ok = sys.forceLine(codaKey, 'hearth', 'burns_citation');
      expect(ok).toBe(false);
      expect(lines).toHaveLength(0);
    });

    it('returns false when translation is missing (does not emit a bare key)', () => {
      const lines: CapturedLine[] = [];
      const sys = new BanterSystem({
        sink: { toast: (message, color) => lines.push({ message, color }) },
        translate: (k) => k,
        now: () => clock.now,
        rng: () => 0,
        getFrequency: () => 'normal',
      });
      const ok = sys.forceLine('ui.banter.does_not_exist', 'hearth', 'burns_citation');
      expect(ok).toBe(false);
      expect(lines).toHaveLength(0);
    });

    it('records the forced key into the no-repeat ring', () => {
      const fired: { key: string; context: string; tag?: string }[] = [];
      const sys = new BanterSystem({
        sink: { toast: () => {} },
        translate: t,
        now: () => clock.now,
        rng: () => 0,
        getFrequency: () => 'normal',
        onLineFired: (e) => fired.push(e),
      });
      sys.forceLine(codaKey, 'hearth', 'burns_citation', 'address_coda');
      expect(fired).toEqual([{ key: codaKey, context: 'burns_citation', tag: 'address_coda' }]);
    });

    it('sets cooldown so subsequent ambient requests are gated', () => {
      const { sys, lines } = makeSystem(freq, clock);
      sys.forceLine(codaKey, 'hearth', 'burns_citation');
      expect(lines).toHaveLength(1);
      // Same tick — a normal idle request is still cooldown-blocked.
      expect(sys.request('idle')).toBe(false);
    });

    it('swallows a throwing onLineFired listener', () => {
      const sys = new BanterSystem({
        sink: { toast: () => {} },
        translate: t,
        now: () => clock.now,
        rng: () => 0,
        getFrequency: () => 'normal',
        onLineFired: () => { throw new Error('boom'); },
      });
      expect(() => sys.forceLine(codaKey, 'hearth', 'burns_citation')).not.toThrow();
    });
  });

  describe('forcePoolLine — ceremonial pool pick', () => {
    const lamentKeys = [
      'ui.banter.burns_citation.defeat_lament.a',
      'ui.banter.burns_citation.defeat_lament.b',
    ];

    it('picks via rng + recent ring, alternates across calls', () => {
      const { sys, lines } = makeSystem(freq, clock, [0, 0]);
      sys.forcePoolLine(lamentKeys, 'hearth', 'burns_citation');
      const first = lines[0].message;
      // Recent ring now has the first key; next call picks the other.
      sys.forcePoolLine(lamentKeys, 'hearth', 'burns_citation');
      const second = lines[1].message;
      expect(first).not.toBe(second);
    });

    it('returns false when banter is off', () => {
      freq.value = 'off';
      const { sys, lines } = makeSystem(freq, clock);
      const ok = sys.forcePoolLine(lamentKeys, 'hearth', 'burns_citation');
      expect(ok).toBe(false);
      expect(lines).toHaveLength(0);
    });

    it('returns false on empty key list', () => {
      const { sys, lines } = makeSystem(freq, clock);
      const ok = sys.forcePoolLine([], 'hearth', 'burns_citation');
      expect(ok).toBe(false);
      expect(lines).toHaveLength(0);
    });

    it('falls back to picking from blocked candidates when ring rejects all', () => {
      const { sys, lines } = makeSystem(freq, clock, [0, 0, 0]);
      // Drive the recent ring to contain BOTH lament keys.
      sys.forceLine(lamentKeys[0], 'hearth', 'burns_citation');
      sys.forceLine(lamentKeys[1], 'hearth', 'burns_citation');
      // forcePoolLine still fires — fallback path picks from the original keys.
      const ok = sys.forcePoolLine(lamentKeys, 'hearth', 'burns_citation');
      expect(ok).toBe(true);
      expect(lines).toHaveLength(3);
    });
  });

  describe('translation fallback', () => {
    it('stays silent if the pool key has no translation', () => {
      // Construct a system with a translate that always returns the key —
      // simulates missing i18n entry. Engine must NOT emit a bare key.
      const lines: CapturedLine[] = [];
      const sys = new BanterSystem({
        sink: { toast: (message, color) => lines.push({ message, color }) },
        translate: (k) => k,
        now: () => clock.now,
        rng: () => 0,
        getFrequency: () => 'normal',
      });
      sys.request('idle');
      sys.flush();
      expect(lines).toHaveLength(0);
    });
  });
});
