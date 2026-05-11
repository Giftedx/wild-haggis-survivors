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
    });
    expect(text).toBe('Shared run · Classic · Heavy Legs');
  });

  it('renders the variant-only line for a clean shared run', () => {
    const text = formatSharedRunIdentityToast({
      seed: 1,
      variantKey: 'moor_runner',
      curseKey: null,
    });
    expect(text).toBe('Shared run · Moor Runner');
  });

  it('falls back to the classic variant label when handed a bogus key', () => {
    // The URL codec rejects bogus variants before this helper sees
    // them, but `getVariantByKey` is permissive — unknown keys
    // resolve to the default ("Classic"). The helper rides that
    // contract so a future stale-URL hit still produces a readable
    // toast instead of an empty-string banner.
    const text = formatSharedRunIdentityToast({
      seed: 1,
      // @ts-expect-error — deliberate
      variantKey: 'no_such_variant',
      curseKey: null,
    });
    expect(text).toBe('Shared run · Classic');
  });

  it('exports a warmth-tan color for the toast palette', () => {
    expect(SHARED_RUN_TOAST_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
