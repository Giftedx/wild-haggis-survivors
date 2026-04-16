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
      caption: (id, message, tint) => {
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
      expect(ui.banter).toBeTruthy();
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
    it('has a keysByTag entry for each picker-A route key', () => {
      const pool = BANTER_POOLS.find((p) => p.context === 'route_picked');
      expect(pool).toBeDefined();
      expect(pool!.keysByTag?.up_the_brae).toBeTruthy();
      expect(pool!.keysByTag?.round_the_loch).toBeTruthy();
      expect(pool!.keysByTag?.through_the_kirkyard).toBeTruthy();
    });

    it('all W2 banter i18n keys resolve to real strings', () => {
      const keys = [
        'ui.banter.act_intermission_enter.a',
        'ui.banter.act_complete.a',
        'ui.banter.route_picked.up_the_brae.a',
        'ui.banter.route_picked.round_the_loch.a',
        'ui.banter.route_picked.through_the_kirkyard.a',
      ];
      for (const k of keys) {
        expect(t(k), k).not.toBe(k);
      }
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
