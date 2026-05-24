import { describe, expect, it } from 'vitest';
import { filterHaggisName, HAGGIS_NAME_MAX_LEN } from './filterHaggisName';

describe('filterHaggisName', () => {
  it('passes a clean name through unchanged', () => {
    expect(filterHaggisName('Angus of the Glen')).toBe('Angus of the Glen');
  });

  it('trims leading and trailing whitespace', () => {
    expect(filterHaggisName('  Moira  ')).toBe('Moira');
  });

  it(`caps at ${HAGGIS_NAME_MAX_LEN} characters`, () => {
    const long = 'A'.repeat(HAGGIS_NAME_MAX_LEN + 10);
    expect(filterHaggisName(long)).toHaveLength(HAGGIS_NAME_MAX_LEN);
  });

  it('returns empty string for blank input', () => {
    expect(filterHaggisName('')).toBe('');
    expect(filterHaggisName('   ')).toBe('');
  });

  it('returns empty string for blocked words', () => {
    expect(filterHaggisName('fuck')).toBe('');
    expect(filterHaggisName('What the shit')).toBe('');
    expect(filterHaggisName('cunt')).toBe('');
  });

  it('is case-insensitive for blocked words', () => {
    expect(filterHaggisName('Bastard')).toBe('');
    expect(filterHaggisName('WANKER')).toBe('');
  });

  it('preserves Unicode characters (Gaelic/Scots names)', () => {
    expect(filterHaggisName('Cìorstaidh')).toBe('Cìorstaidh');
    expect(filterHaggisName('Mòrag of the Glen')).toBe('Mòrag of the Glen');
  });

  it('trims before capping (no leading whitespace in result)', () => {
    const spaced = '  ' + 'B'.repeat(HAGGIS_NAME_MAX_LEN);
    const result = filterHaggisName(spaced);
    expect(result.startsWith(' ')).toBe(false);
  });
});
