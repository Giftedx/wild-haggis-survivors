import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import {
  formatSharedRunIdentityToast,
  SHARED_RUN_TOAST_COLOR,
} from './sharedRunIdentityToast';

// Stub the i18n entries the formatter pulls from. The real strings ship
// in `src/core/i18n/ui.ts`; the helper only cares about the
// substitution shape so we can pin behaviour without dragging the full
// locale.
vi.mock('../../core/i18n', () => ({
  t: (key: string, vars?: Record<string, string>) => {
    if (key === 'ui.toast.shared_run_loaded') {
      return `Shared run · ${vars?.variant ?? '?'} · ${vars?.curse ?? '?'}`;
    }
    if (key === 'ui.toast.shared_run_loaded_clean') {
      return `Shared run · ${vars?.variant ?? '?'}`;
    }
    if (key === 'ui.toast.shared_run_challenge_victory') {
      return `Shared run · ${vars?.variant ?? '?'} · ${vars?.curse ?? '?'} · ${vars?.time ?? '?'} to beat`;
    }
    if (key === 'ui.toast.shared_run_challenge_death') {
      return `Shared run · ${vars?.variant ?? '?'} · ${vars?.curse ?? '?'} · ${vars?.time ?? '?'} to outlast`;
    }
    if (key === 'ui.toast.shared_run_challenge_victory_clean') {
      return `Shared run · ${vars?.variant ?? '?'} · ${vars?.time ?? '?'} to beat`;
    }
    if (key === 'ui.toast.shared_run_challenge_death_clean') {
      return `Shared run · ${vars?.variant ?? '?'} · ${vars?.time ?? '?'} to outlast`;
    }
    if (key === 'variant.classic.name') return 'Classic';
    if (key === 'variant.moor_runner.name') return 'Moor Runner';
    if (key === 'curse.heavy_legs.name') return 'Heavy Legs';
    return key;
  },
}));

describe('formatSharedRunIdentityToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the variant + curse line when a curse is present', () => {
    const text = formatSharedRunIdentityToast({
      seed: 1,
      variantKey: 'classic',
      curseKey: 'heavy_legs',
      challenge: null,
    });
    expect(text).toBe('Shared run · Classic · Heavy Legs');
  });

  it('renders the variant-only line for a clean shared run', () => {
    const text = formatSharedRunIdentityToast({
      seed: 1,
      variantKey: 'moor_runner',
      curseKey: null,
      challenge: null,
    });
    expect(text).toBe('Shared run · Moor Runner');
  });

  it('falls back to the classic variant label when handed a bogus key', () => {
    const text = formatSharedRunIdentityToast({
      seed: 1,
      // @ts-expect-error — deliberate
      variantKey: 'no_such_variant',
      curseKey: null,
      challenge: null,
    });
    expect(text).toBe('Shared run · Classic');
  });

  it('exports a warmth-tan color for the toast palette', () => {
    expect(SHARED_RUN_TOAST_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });

  describe('challenge variant (V2)', () => {
    it('renders a "{time} to beat" line for a victory challenge with curse', () => {
      const text = formatSharedRunIdentityToast({
        seed: 1,
        variantKey: 'classic',
        curseKey: 'heavy_legs',
        challenge: { outcome: 'victory', timeSurvivedSec: 754 },
      });
      // 754s = 12:34. The formatter delegates to formatClockTime so the
      // mm:ss representation matches the rest of the game.
      expect(text).toBe('Shared run · Classic · Heavy Legs · 12:34 to beat');
    });

    it('renders a "{time} to outlast" line for a death challenge with curse', () => {
      const text = formatSharedRunIdentityToast({
        seed: 1,
        variantKey: 'classic',
        curseKey: 'heavy_legs',
        challenge: { outcome: 'death', timeSurvivedSec: 553 },
      });
      // 553s = 9:13.
      expect(text).toBe('Shared run · Classic · Heavy Legs · 9:13 to outlast');
    });

    it('renders a clean-run victory challenge without the curse leaf', () => {
      const text = formatSharedRunIdentityToast({
        seed: 1,
        variantKey: 'moor_runner',
        curseKey: null,
        challenge: { outcome: 'victory', timeSurvivedSec: 1234 },
      });
      // 1234s = 20:34.
      expect(text).toBe('Shared run · Moor Runner · 20:34 to beat');
    });

    it('renders a clean-run death challenge without the curse leaf', () => {
      const text = formatSharedRunIdentityToast({
        seed: 1,
        variantKey: 'moor_runner',
        curseKey: null,
        challenge: { outcome: 'death', timeSurvivedSec: 65 },
      });
      // 65s = 1:05.
      expect(text).toBe('Shared run · Moor Runner · 1:05 to outlast');
    });
  });
});
