import { describe, expect, it } from 'vitest';
import { BOSSES } from '../data/enemies';
import { buildBossHighlightSlug, buildCaptureFilename } from './captureFilename';

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

  it('uses an explicit clip extension when the recorder chooses a non-WebM container', () => {
    const payload = {
      mode: 'death' as const,
      variantLabel: 'Peerie Shetlander',
      timeSurvivedSec: 122,
      dateYmd: '2026-05-11',
      clipExtension: 'mp4' as const,
    };
    const name = buildCaptureFilename('clip', payload);
    expect(name).toBe('whs_death_peerie-shetlander_02m02s_2026-05-11.mp4');
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

  it('builds a highlight filename with the boss slug', () => {
    const name = buildCaptureFilename('highlight', {
      mode: 'victory',
      variantLabel: 'Classic Haggis',
      timeSurvivedSec: 754,
      dateYmd: '2026-05-11',
      seedCode: 'AB12CD',
      bossKey: 'taxman',
    });
    expect(name).toBe('whs_highlight_classic-haggis_taxman_12m34s_2026-05-11_AB12CD.webm');
  });

  it('honours an mp4 clip extension on a highlight filename', () => {
    const name = buildCaptureFilename('highlight', {
      mode: 'death',
      variantLabel: 'Peerie Shetlander',
      timeSurvivedSec: 122,
      dateYmd: '2026-05-11',
      bossKey: 'gordon',
      clipExtension: 'mp4',
    });
    expect(name).toBe('whs_highlight_peerie-shetlander_gordon_02m02s_2026-05-11.mp4');
  });

  it('omits the boss slot when bossKey is missing', () => {
    const name = buildCaptureFilename('highlight', {
      mode: 'death',
      variantLabel: 'Classic Haggis',
      timeSurvivedSec: 60,
      dateYmd: '2026-05-11',
    });
    expect(name).toBe('whs_highlight_classic-haggis_01m00s_2026-05-11.webm');
  });

  it('uses a stable non-generic slug for every shipped boss highlight', () => {
    for (const boss of BOSSES) {
      const slug = buildBossHighlightSlug(boss.key);
      expect(slug, `slug for ${boss.key}`).toBeTruthy();
      expect(slug, `slug for ${boss.key}`).not.toBe('boss');
      expect(slug, `slug for ${boss.key}`).not.toContain('_');
    }
  });

  it('uses a generic boss slug for unknown highlight boss keys', () => {
    const name = buildCaptureFilename('highlight', {
      mode: 'death',
      variantLabel: 'Classic Haggis',
      timeSurvivedSec: 60,
      dateYmd: '2026-05-11',
      bossKey: 'future_internal_boss',
    });
    expect(name).toBe('whs_highlight_classic-haggis_boss_01m00s_2026-05-11.webm');
  });
});
