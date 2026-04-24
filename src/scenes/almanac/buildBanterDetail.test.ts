import { describe, expect, it } from 'vitest';
import { createEmptyDiscoveryLog, recordBanterHeard } from '../../systems/DiscoveryLog';
import { buildBanterEntries } from './buildBanterEntries';
import { buildBanterDetail } from './buildBanterDetail';

function find(log = createEmptyDiscoveryLog(), context: string) {
  return buildBanterEntries(log).find((e) => e.context === context)!;
}

describe('buildBanterDetail', () => {
  it('returns zero heard + all unheard on an empty log', () => {
    const detail = buildBanterDetail(find(undefined, 'low_hp'));
    expect(detail.heardLines).toBe(0);
    expect(detail.heard).toEqual([]);
    expect(detail.unheard.length).toBe(detail.totalLines);
    expect(detail.unheard.every((u) => u.teaserText === '???')).toBe(true);
  });

  it('emits stable title/hint i18n keys per context', () => {
    const detail = buildBanterDetail(find(undefined, 'first_time'));
    expect(detail.titleKey).toBe('ui.almanac.banter_pool.first_time.label');
    expect(detail.hintKey).toBe('ui.almanac.banter_pool.first_time.hint');
    expect(detail.toneLabelKey).toBe('ui.almanac.banter_tone_hearth');
  });

  it('flags rare pools through the detail VM', () => {
    const rare = buildBanterDetail(find(undefined, 'burns_citation'));
    const not = buildBanterDetail(find(undefined, 'idle'));
    expect(rare.rare).toBe(true);
    expect(not.rare).toBe(false);
  });

  it('ships a sensible hint fallback so the panel reads before authored copy lands', () => {
    const detail = buildBanterDetail(find(undefined, 'low_hp'));
    expect(detail.hintFallback).toMatch(/low/i);
  });

  it('records heard lines with hear count + first-heard label', () => {
    let log = createEmptyDiscoveryLog();
    log = recordBanterHeard(log, 'ui.banter.low_hp.a', 'run-1', 1_700_000_000_000);
    log = recordBanterHeard(log, 'ui.banter.low_hp.a', 'run-1', 1_700_000_001_000);
    const detail = buildBanterDetail(find(log, 'low_hp'));
    const heard = detail.heard.find((h) => h.key === 'ui.banter.low_hp.a')!;
    expect(heard.hearCount).toBe(2);
    expect(heard.firstHeardText).toMatch(/First heard/);
    expect(detail.heardLines).toBe(1);
  });

  it('formats a human-readable progress string', () => {
    let log = createEmptyDiscoveryLog();
    log = recordBanterHeard(log, 'ui.banter.idle.a', 'run-1', 1);
    const idle = buildBanterDetail(find(log, 'idle'));
    expect(idle.progressText).toBe(`${idle.heardLines} of ${idle.totalLines}`);
  });
});
