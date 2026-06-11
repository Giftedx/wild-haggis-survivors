import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EN_STRINGS } from './i18n/enStrings';
import { ACTION_KEYS } from './actions';
import { ELITE_AFFIXES } from '../data/eliteAffixes';
import { PERMANENT_UPGRADES } from '../data/permanentUpgrades';
import { STANCE_ORDER } from '../entities/stanceToggle';
import { COMPANION_KEYS_IN_ORDER } from '../entities/companions/companionTypes';

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

/**
 * Dynamic key families — `t(`prefix.${id}`)` callers the literal scan above
 * can't see. Each roster (data-derived where possible) must have every
 * member's templated key(s) present, or that member renders its raw key.
 * This is the dynamic sibling of the 2026-05-29 `ui.captions.*` fix: adding
 * a roster entry without its i18n leaf is the drift this guards.
 */
describe('i18n dynamic key families resolve', () => {
  const families: ReadonlyArray<{ name: string; keys: readonly string[] }> = [
    {
      name: 'inputRebind action labels (ui.inputRebind.action.*)',
      keys: ACTION_KEYS.map((a) => `ui.inputRebind.action.${a}`),
    },
    {
      name: 'elite affix name + blurb (ui.elite_affix.*)',
      keys: Object.keys(ELITE_AFFIXES).flatMap((id) => [
        `ui.elite_affix.${id}.name`,
        `ui.elite_affix.${id}.blurb`,
      ]),
    },
    {
      name: 'permanent upgrade flavour (permanentUpgrade.*.flavour)',
      keys: PERMANENT_UPGRADES.map((u) => `permanentUpgrade.${u.key}.flavour`),
    },
    {
      name: 'HUD stance labels (ui.hud.stance.*)',
      keys: STANCE_ORDER.map((s) => `ui.hud.stance.${s}`),
    },
    {
      name: 'HUD companion labels (ui.hud.companion.*)',
      keys: COMPANION_KEYS_IN_ORDER.map((k) => `ui.hud.companion.${k}`),
    },
    {
      name: 'sporran card kinds (sporran.kind.*)',
      keys: ['curse', 'boon', 'quirk'].map((k) => `sporran.kind.${k}`),
    },
    {
      name: 'upgrade card rarity labels (ui.common.rarity.*)',
      // Full Rarity union from data/upgrades.ts — every card rarity needs a
      // pill + screen-reader label, or the card renders its raw key.
      keys: ['common', 'uncommon', 'rare', 'legendary', 'rune', 'mythic'].map(
        (r) => `ui.common.rarity.${r}`,
      ),
    },
  ];

  for (const fam of families) {
    it(`${fam.name}`, () => {
      const missing = fam.keys.filter((k) => !resolves(k));
      expect(missing, `unresolved: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
