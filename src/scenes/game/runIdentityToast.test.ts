import { describe, expect, it } from 'vitest';
import {
  RUN_IDENTITY_FLAVOR_MAX,
  formatRunIdentityToast,
  truncateRunIdentityFlavor,
} from './runIdentityToast';

describe('truncateRunIdentityFlavor', () => {
  it('returns short strings unchanged after trimming outer whitespace', () => {
    expect(truncateRunIdentityFlavor('  hello  ')).toBe('hello');
  });

  it('passes a string at exactly the cap through unchanged', () => {
    const s = 'a'.repeat(RUN_IDENTITY_FLAVOR_MAX);
    expect(truncateRunIdentityFlavor(s)).toBe(s);
  });

  it('truncates with a single ellipsis when over the cap', () => {
    const s = 'a'.repeat(RUN_IDENTITY_FLAVOR_MAX + 10);
    const out = truncateRunIdentityFlavor(s);
    expect(out.length).toBe(RUN_IDENTITY_FLAVOR_MAX);
    expect(out.endsWith('…')).toBe(true);
  });

  it('strips trailing whitespace before the ellipsis', () => {
    // Force a trailing-space scenario: pad with spaces just before the cap.
    const s = `${'word '.repeat(20)}rest`;
    const out = truncateRunIdentityFlavor(s, 11);
    // Original would slice to 'word word w', trimEnd then '…' → 'word word…' (no trailing space).
    expect(out).not.toMatch(/ …$/);
    expect(out.endsWith('…')).toBe(true);
  });

  it('honours an explicit maxLen', () => {
    expect(truncateRunIdentityFlavor('abcdefghij', 5)).toBe('abcd…');
  });
});

describe('formatRunIdentityToast', () => {
  it('renders just `{name}\\n{flavor}` on a fresh start', () => {
    const out = formatRunIdentityToast(false, 'Classic Haggis', 'A wee bit of flavor');
    expect(out).toBe('Classic Haggis\nA wee bit of flavor');
  });

  it('prefixes the name with the resume marker on a resumed run', () => {
    const out = formatRunIdentityToast(true, 'Classic Haggis', 'A wee bit of flavor');
    expect(out.startsWith('Trail picked back up —')).toBe(true);
    expect(out).toContain('Classic Haggis');
    expect(out).toContain('A wee bit of flavor');
  });

  it('truncates the flavor string before interpolating', () => {
    const flavor = 'really long flavour text that goes well past the cap '.repeat(3);
    const out = formatRunIdentityToast(false, 'X', flavor);
    expect(out).toContain('…');
    // The full untruncated tail must not appear in the rendered string.
    expect(out).not.toContain(flavor.trim());
  });
});
