import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EN_STRINGS } from './i18n/enStrings';

/**
 * Code→locale key-existence fence.
 *
 * `t()` returns the raw key string on a miss (i18n.ts:108), so a typo'd or
 * never-defined key renders the literal dot-path to the player (and into
 * the a11y CaptionOverlay). The SCS↔EN parity fence only checks the two
 * locales agree — it can't catch a key that exists in NEITHER because the
 * caller mistyped the path. This scans literal `t('a.b.c')` calls across
 * src and asserts each resolves against EN_STRINGS.
 *
 * Caught the 2026-05-29 `ui.captions.*` regression: nine call sites used a
 * bogus `ui.` prefix while the strings live at top-level `captions.*`, so
 * every accessibility caption rendered its raw key. Dynamic keys
 * (`t(`captions.${x}`)`) are out of scope — only literal keys are checked.
 */

const SRC_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

function resolves(key: string): boolean {
  const parts = key.split('.');
  let cur: unknown = EN_STRINGS;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object' || !(p in (cur as object))) return false;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string';
}

// Literal `t('a.b')`, `t("a.b")`, or `t(`a.b`)` (no interpolation). Only
// keys with at least one dot — single-segment matches are almost always a
// different `t(...)` (lerp param, etc.), not an i18n lookup.
const T_CALL = /(?<![\w.])t\(\s*['"`]([A-Za-z][\w]*(?:\.[\w]+)+)['"`]/g;

describe('i18n code→locale key existence', () => {
  it('every literal t() key referenced in src resolves in EN_STRINGS', () => {
    const files = walk(SRC_ROOT);
    const missing = new Map<string, string[]>(); // key -> files
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      let m: RegExpExecArray | null;
      T_CALL.lastIndex = 0;
      while ((m = T_CALL.exec(text)) !== null) {
        const key = m[1];
        if (resolves(key)) continue;
        const rel = file.slice(SRC_ROOT.length + 1).replace(/\\/g, '/');
        const list = missing.get(key) ?? [];
        if (!list.includes(rel)) list.push(rel);
        missing.set(key, list);
      }
    }
    const report = [...missing.entries()]
      .map(([k, files]) => `  ${k}  <- ${files.join(', ')}`)
      .join('\n');
    expect(missing.size, `Unresolved i18n keys (render raw to the player):\n${report}`).toBe(0);
  });
});
