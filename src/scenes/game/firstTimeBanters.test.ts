import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DAILY_FIRST_CLEAR_EVENT_ID,
  fireDailyFirstClearBanter,
  fireFirstNewVariantUnlockBanter,
  fireRouteFirstBanter,
  routeFirstEventId,
  variantUnlockEventId,
} from './firstTimeBanters';

describe('firstTimeBanters event id builders', () => {
  it('variantUnlockEventId composes prefix + key + suffix', () => {
    expect(variantUnlockEventId('moor_runner')).toBe('variant_moor_runner_unlocked');
    expect(variantUnlockEventId('cailleach')).toBe('variant_cailleach_unlocked');
  });

  it('routeFirstEventId composes prefix + key + suffix', () => {
    expect(routeFirstEventId('up_the_brae')).toBe('route_up_the_brae_first');
  });

  it('DAILY_FIRST_CLEAR_EVENT_ID matches the banter pool sub-key', () => {
    expect(DAILY_FIRST_CLEAR_EVENT_ID).toBe('daily_first_clear');
  });
});

describe('fireFirstNewVariantUnlockBanter', () => {
  let claimed: Set<string>;
  let bump: (id: string) => boolean;
  let request: ReturnType<typeof vi.fn>;
  let banter: { request: typeof request };

  beforeEach(() => {
    claimed = new Set();
    bump = (id: string) => {
      if (claimed.has(id)) return false;
      claimed.add(id);
      return true;
    };
    request = vi.fn().mockReturnValue(true);
    banter = { request };
  });

  it('returns null + does not call banter when newlyUnlocked is empty', () => {
    const fired = fireFirstNewVariantUnlockBanter([], bump, banter);
    expect(fired).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it('fires banter once for a single newly-unlocked variant', () => {
    const fired = fireFirstNewVariantUnlockBanter(['moor_runner'], bump, banter);
    expect(fired).toBe('variant_moor_runner_unlocked');
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('first_time', {
      tag: 'variant_moor_runner_unlocked',
    });
  });

  it('bumps every id but requests banter only for the first claimed one', () => {
    // Three unlocks in a single run — rare but possible after a milestone clear.
    const fired = fireFirstNewVariantUnlockBanter(
      ['moor_runner', 'iron_belly', 'cailleach'],
      bump,
      banter,
    );
    expect(fired).toBe('variant_moor_runner_unlocked');
    expect(claimed.has('variant_moor_runner_unlocked')).toBe(true);
    expect(claimed.has('variant_iron_belly_unlocked')).toBe(true);
    expect(claimed.has('variant_cailleach_unlocked')).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('skips already-claimed ids when looking for the first banter target', () => {
    claimed.add('variant_moor_runner_unlocked'); // pre-claimed
    const fired = fireFirstNewVariantUnlockBanter(
      ['moor_runner', 'iron_belly'],
      bump,
      banter,
    );
    expect(fired).toBe('variant_iron_belly_unlocked');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('returns null when banter is absent (still records claims)', () => {
    const fired = fireFirstNewVariantUnlockBanter(['cailleach'], bump, null);
    expect(fired).toBeNull();
    expect(claimed.has('variant_cailleach_unlocked')).toBe(true);
  });
});

describe('fireDailyFirstClearBanter', () => {
  let claimed: Set<string>;
  let bump: (id: string) => boolean;
  let request: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    claimed = new Set();
    bump = (id) => (claimed.has(id) ? false : (claimed.add(id), true));
    request = vi.fn().mockReturnValue(true);
  });

  it('no-ops on a non-daily run', () => {
    const fired = fireDailyFirstClearBanter(false, bump, { request });
    expect(fired).toBe(false);
    expect(request).not.toHaveBeenCalled();
    expect(claimed.has(DAILY_FIRST_CLEAR_EVENT_ID)).toBe(false);
  });

  it('fires once when isDailyRun and not yet claimed', () => {
    expect(fireDailyFirstClearBanter(true, bump, { request })).toBe(true);
    expect(request).toHaveBeenCalledWith('first_time', { tag: 'daily_first_clear' });
  });

  it('does not refire after the bump has been claimed', () => {
    fireDailyFirstClearBanter(true, bump, { request });
    request.mockClear();
    expect(fireDailyFirstClearBanter(true, bump, { request })).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it('claims the bump even when banter is absent', () => {
    const fired = fireDailyFirstClearBanter(true, bump, null);
    expect(fired).toBe(true);
    expect(claimed.has(DAILY_FIRST_CLEAR_EVENT_ID)).toBe(true);
  });
});

describe('fireRouteFirstBanter', () => {
  let claimed: Set<string>;
  let bump: (id: string) => boolean;
  let request: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    claimed = new Set();
    bump = (id) => (claimed.has(id) ? false : (claimed.add(id), true));
    request = vi.fn().mockReturnValue(true);
  });

  it('fires once for a fresh route key', () => {
    const fired = fireRouteFirstBanter('up_the_brae', bump, { request });
    expect(fired).toBe(true);
    expect(request).toHaveBeenCalledWith('first_time', { tag: 'route_up_the_brae_first' });
  });

  it('no-ops on subsequent picks of the same route', () => {
    fireRouteFirstBanter('up_the_brae', bump, { request });
    request.mockClear();
    expect(fireRouteFirstBanter('up_the_brae', bump, { request })).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it('returns false on an empty route key', () => {
    expect(fireRouteFirstBanter('', bump, { request })).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it('claims even when banter is absent', () => {
    expect(fireRouteFirstBanter('round_the_loch', bump, null)).toBe(true);
    expect(claimed.has('route_round_the_loch_first')).toBe(true);
  });
});
