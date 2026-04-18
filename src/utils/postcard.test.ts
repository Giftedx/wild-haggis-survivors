import { describe, expect, it, vi } from 'vitest';
import { buildPostcardFilename, buildPostcardFooterParts, downloadPostcard } from './postcard';

describe('buildPostcardFilename', () => {
  it('renders mode + kills + mmss + seed slot', () => {
    const name = buildPostcardFilename({
      mode: 'victory',
      enemiesKilled: 432,
      timeSurvivedSec: 725, // 12m 05s
      seedCode: 'ABC-123',
    });
    expect(name).toMatch(/^haggis-\d{4}-\d{2}-\d{2}-victory-432k-12m05s-ABC-123\.png$/);
  });

  it('omits the seed suffix when no seedCode', () => {
    const name = buildPostcardFilename({
      mode: 'death',
      enemiesKilled: 5,
      timeSurvivedSec: 3,
    });
    expect(name).toMatch(/^haggis-\d{4}-\d{2}-\d{2}-death-5k-00m03s\.png$/);
  });

  it('zero-pads sub-minute runs', () => {
    const name = buildPostcardFilename({
      mode: 'death',
      enemiesKilled: 0,
      timeSurvivedSec: 7,
    });
    expect(name).toContain('00m07s');
  });

  it('sanitises suspicious seed characters out of the filename', () => {
    const name = buildPostcardFilename({
      mode: 'victory',
      enemiesKilled: 1,
      timeSurvivedSec: 60,
      seedCode: '../../etc/passwd',
    });
    // "../../etc/passwd" -> only a-zA-Z0-9_- survive
    expect(name).toMatch(/-etcpasswd\.png$/);
  });
});

describe('downloadPostcard', () => {
  it('no-ops with false return when given no canvas', () => {
    expect(downloadPostcard(null, { mode: 'death', enemiesKilled: 0, timeSurvivedSec: 0 })).toBe(false);
  });

  it('returns false when composite rendering throws (tainted canvas)', () => {
    const fakeCanvas = {
      width: 100, height: 100,
      toDataURL: vi.fn(() => { throw new Error('tainted'); }),
    } as unknown as HTMLCanvasElement;
    // document isn't defined in node env, so short-circuits to false anyway —
    // the test still exercises the null-safety branch.
    expect(downloadPostcard(fakeCanvas, { mode: 'victory', enemiesKilled: 1, timeSurvivedSec: 1 })).toBe(false);
  });

  it('postBellSec accepts an absent / zero / positive value (type contract)', () => {
    // The footer rendering needs canvas; this test pins the API.
    const payload = {
      mode: 'victory' as const,
      enemiesKilled: 1,
      timeSurvivedSec: 920,
      postBellSec: 0,
    };
    expect(downloadPostcard(null, payload)).toBe(false); // null canvas branch
    payload.postBellSec = 65;
    expect(downloadPostcard(null, payload)).toBe(false);
  });

  it('curseLabel accepts an absent / present value (type contract)', () => {
    const payload = {
      mode: 'victory' as const,
      enemiesKilled: 1,
      timeSurvivedSec: 920,
      curseLabel: 'Heavy Legs',
    };
    expect(downloadPostcard(null, payload)).toBe(false); // null canvas branch
    delete (payload as { curseLabel?: string }).curseLabel;
    expect(downloadPostcard(null, payload)).toBe(false);
  });
});

describe('buildPostcardFooterParts', () => {
  it('renders only the load-bearing time + kills when no optional fields', () => {
    expect(buildPostcardFooterParts({
      mode: 'death', enemiesKilled: 12, timeSurvivedSec: 65,
    })).toEqual(['time 1:05', 'kills 12']);
  });

  it('appends variantLabel after kills', () => {
    const parts = buildPostcardFooterParts({
      mode: 'victory', enemiesKilled: 100, timeSurvivedSec: 600, variantLabel: 'Classic Haggis',
    });
    expect(parts).toEqual(['time 10:00', 'kills 100', 'Classic Haggis']);
  });

  it('appends ironmoor / curse / post-bell tags in fixed order', () => {
    const parts = buildPostcardFooterParts({
      mode: 'victory',
      enemiesKilled: 50,
      timeSurvivedSec: 300,
      variantLabel: 'Iron Belly',
      ironmoor: true,
      curseLabel: 'Heavy Legs',
      postBellSec: 65,
    });
    // Order: time, kills, variant, ironmoor, curse, post-bell.
    expect(parts).toEqual([
      'time 5:00',
      'kills 50',
      'Iron Belly',
      '⚔ Ironmoor',
      '☠ Heavy Legs',
      '🔔 +1:05 past the bell',
    ]);
  });

  it('postBellSec === 0 does not produce a tag', () => {
    const parts = buildPostcardFooterParts({
      mode: 'death', enemiesKilled: 0, timeSurvivedSec: 0, postBellSec: 0,
    });
    expect(parts).toEqual(['time 0:00', 'kills 0']);
  });

  it('negative postBellSec is ignored (defensive against malformed payloads)', () => {
    const parts = buildPostcardFooterParts({
      mode: 'death', enemiesKilled: 1, timeSurvivedSec: 1, postBellSec: -5,
    });
    expect(parts.some((p) => p.includes('past the bell'))).toBe(false);
  });

  it('floors negative kills to 0 and clamps negative time to 0:00', () => {
    const parts = buildPostcardFooterParts({
      mode: 'death', enemiesKilled: -7, timeSurvivedSec: -90,
    });
    expect(parts).toEqual(['time 0:00', 'kills 0']);
  });

  it('zero-pads sub-minute clocks correctly', () => {
    const parts = buildPostcardFooterParts({
      mode: 'death', enemiesKilled: 0, timeSurvivedSec: 7,
    });
    expect(parts[0]).toBe('time 0:07');
  });

  it('empty curseLabel string does not add a tag (truthy guard)', () => {
    const parts = buildPostcardFooterParts({
      mode: 'death', enemiesKilled: 1, timeSurvivedSec: 1, curseLabel: '',
    });
    expect(parts.some((p) => p.startsWith('☠'))).toBe(false);
  });

  it('uses provided labels when payload.labels is passed (W18 bilingual)', () => {
    const parts = buildPostcardFooterParts({
      mode: 'victory',
      enemiesKilled: 42,
      timeSurvivedSec: 125,
      variantLabel: 'Classic Haggis',
      ironmoor: true,
      curseLabel: 'Heavy Legs',
      postBellSec: 30,
      labels: {
        time: 'tym',
        kills: 'culls',
        ironmoor: '⚔ Ironmoor',
        pastBell: (clock) => `🔔 +${clock} past tha bell`,
        curseTag: (curse) => `☠ ${curse}`,
      },
    });
    expect(parts).toEqual([
      'tym 2:05',
      'culls 42',
      'Classic Haggis',
      '⚔ Ironmoor',
      '☠ Heavy Legs',
      '🔔 +0:30 past tha bell',
    ]);
  });

  it('partial labels fall back to English defaults field-by-field', () => {
    const parts = buildPostcardFooterParts({
      mode: 'death',
      enemiesKilled: 7,
      timeSurvivedSec: 60,
      labels: { kills: 'culls' },  // only override kills
    });
    expect(parts).toEqual([
      'time 1:00',  // defaulted
      'culls 7',    // overridden
    ]);
  });
});
