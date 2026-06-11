import { afterAll, describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  EN_STRINGS,
  ensureLocaleReady,
  setLocale,
  t,
  type LocaleTree,
} from './i18n';
import { SCS_STRINGS } from './i18n.scs';

/**
 * Literal-field token guard — catches the class of bug where a
 * translation template has a `{placeholder}` that the call site
 * doesn't pass. Walks every string in EN_STRINGS and SCS_STRINGS,
 * extracts placeholders, builds a sentinel object covering them,
 * calls `t(key, sentinel)`, and asserts the rendered output has no
 * remaining `{…}` tokens.
 *
 * Cheap replacement for the originally-scoped "headless Phaser
 * render with locale sentinels" test (which needs a harness we
 * don't have). This version catches the same regression class —
 * placeholder mismatches between templates and call sites — with
 * zero Phaser infrastructure.
 */

type KeyValue = [keyPath: string, template: string];

function flattenTree(tree: LocaleTree, prefix = ''): KeyValue[] {
  const out: KeyValue[] = [];
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.push([path, v]);
    else out.push(...flattenTree(v, path));
  }
  return out;
}

const PLACEHOLDER_RE = /\{([^}]+)\}/g;

function placeholderNames(template: string): string[] {
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = PLACEHOLDER_RE.exec(template)) !== null) {
    names.push(m[1]);
  }
  return names;
}

function sentinelFor(names: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const n of names) out[n] = `_${n}_`;
  return out;
}

describe('i18n literal-field guard', () => {
  const enFlat = flattenTree(EN_STRINGS);
  const scsFlat = flattenTree(SCS_STRINGS);

  afterAll(() => setLocale(DEFAULT_LOCALE));

  it('flattens a non-trivial set of keys (sanity)', () => {
    expect(enFlat.length).toBeGreaterThan(100);
  });

  it('every EN template renders clean when given a sentinel for its own placeholders', () => {
    setLocale('en');
    const offenders: Array<{ key: string; rendered: string }> = [];
    for (const [key, tpl] of enFlat) {
      const ph = placeholderNames(tpl);
      const rendered = t(key, sentinelFor(ph));
      if (/\{[^}]+\}/.test(rendered)) {
        offenders.push({ key, rendered });
      }
    }
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });

  it('every SCS template renders clean when given a sentinel for its own placeholders', async () => {
    await ensureLocaleReady('scs');
    setLocale('scs');
    const offenders: Array<{ key: string; rendered: string }> = [];
    for (const [key, tpl] of scsFlat) {
      const ph = placeholderNames(tpl);
      const rendered = t(key, sentinelFor(ph));
      if (/\{[^}]+\}/.test(rendered)) {
        offenders.push({ key, rendered });
      }
    }
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });

  /**
   * Cross-locale parity: for every EN key that also exists in the SCS
   * overlay, the SCS placeholder set must be a subset of the EN set.
   * Call sites pass EN-shaped vars, so any placeholder unique to SCS
   * will render as a literal `{foo}` token.
   */
  it('SCS placeholder sets are subsets of matching EN placeholder sets', () => {
    const enByKey = new Map(enFlat);
    const divergences: Array<{
      key: string;
      enPlaceholders: string[];
      scsPlaceholders: string[];
      missing: string[];
    }> = [];
    for (const [key, scsTpl] of scsFlat) {
      const enTpl = enByKey.get(key);
      if (enTpl === undefined) continue;
      const enPh = new Set(placeholderNames(enTpl));
      const scsPh = placeholderNames(scsTpl);
      const missing = scsPh.filter((p) => !enPh.has(p));
      if (missing.length > 0) {
        divergences.push({
          key,
          enPlaceholders: [...enPh],
          scsPlaceholders: scsPh,
          missing,
        });
      }
    }
    expect(divergences, JSON.stringify(divergences, null, 2)).toEqual([]);
  });
});
