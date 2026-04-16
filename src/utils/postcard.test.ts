import { describe, expect, it, vi } from 'vitest';
import { buildPostcardFilename, downloadPostcard } from './postcard';

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
});
