import { describe, expect, it } from 'vitest';
import { buildCaptureFilename } from './captureFilename';

describe('buildCaptureFilename', () => {
  it('builds a screenshot filename for a victory run', () => {
    const name = buildCaptureFilename('screenshot', {
      mode: 'victory',
      variantLabel: 'Classic Haggis',
      timeSurvivedSec: 754,
      dateYmd: '2026-04-22',
    });
    expect(name).toBe('whs_victory_classic-haggis_12m34s_2026-04-22.png');
  });

  it('builds a clip filename for a death run with a seed', () => {
    const name = buildCaptureFilename('clip', {
      mode: 'death',
      variantLabel: 'The Laird',
      timeSurvivedSec: 321,
      seedCode: 'AB12CD',
      dateYmd: '2026-04-22',
    });
    expect(name).toBe('whs_death_the-laird_05m21s_2026-04-22_AB12CD.webm');
  });

  it('omits variant slug when label is empty', () => {
    const name = buildCaptureFilename('screenshot', {
      mode: 'death',
      variantLabel: '',
      timeSurvivedSec: 0,
      dateYmd: '2026-04-22',
    });
    expect(name).toBe('whs_death_00m00s_2026-04-22.png');
  });

  it('strips path-hostile characters from variant label', () => {
    const name = buildCaptureFilename('screenshot', {
      mode: 'victory',
      variantLabel: 'Fancy / Haggis : Prime?',
      timeSurvivedSec: 61,
      dateYmd: '2026-04-22',
    });
    expect(name).toBe('whs_victory_fancy-haggis-prime_01m01s_2026-04-22.png');
  });
});
