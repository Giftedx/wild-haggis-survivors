import { describe, expect, it, afterEach } from 'vitest';
import { DEFAULT_LOCALE, setLocale, t } from '../core/i18n';
import { WEAPON_DEFS } from './weapons';
import { PERMANENT_UPGRADES } from './permanentUpgrades';
import { VARIANTS } from './variants';
import { RELICS } from './relics';
import { RUNES } from './runes';
import { EVOLUTION_RECIPES } from '../core/BalanceConfig';
import type { PassiveKey } from './upgrades';

/**
 * C2 — flavour presence + locale parity fence.
 *
 * Every weapon / evolution / passive / permanent-upgrade must carry a
 * Dark-Souls-style `.flavour` leaf in BOTH locales. A missing leaf is
 * either an authoring gap (EN omitted) or a translation gap (EN present,
 * SCS falls back to EN which defeats the Scots overlay for item lore).
 *
 * This guard replaces the softer "ui.banter.* only" parity fence for the
 * flavour register — lore lines need strict per-key parity to ship.
 */

const PASSIVE_KEYS: PassiveKey[] = [
  'sporran',
  'whisky_flask',
  'kilt',
  'tam_o_shanter',
  'irn_bru',
  'loch_water',
  'thistle_crown',
  'highland_shield',
  'tartan_sash',
  'shinty_ball',
];

function expectFlavour(key: string): void {
  const resolved = t(key);
  expect(resolved, `${key} must resolve to a non-dotpath string`).not.toBe(key);
  expect(resolved.length, `${key} flavour must be non-empty`).toBeGreaterThan(20);
}

describe('C2 — flavour leaves present in EN + SCS', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE));

  const cases: Array<{ scope: string; keys: string[] }> = [
    {
      scope: 'weapon',
      keys: Object.keys(WEAPON_DEFS).map((k) => `weapon.${k}.flavour`),
    },
    {
      scope: 'evolution',
      keys: EVOLUTION_RECIPES.map((r) => `evolution.${r.evolvedWeapon}.flavour`),
    },
    {
      scope: 'passive',
      keys: PASSIVE_KEYS.map((k) => `passive.${k}.flavour`),
    },
    {
      scope: 'permanentUpgrade',
      keys: PERMANENT_UPGRADES.map((u) => `permanentUpgrade.${u.key}.flavour`),
    },
    {
      // M2 — variants carry Dark-Souls-style `lore` alongside the existing
      // short `flavor` tagline. Separate leaf name so the variant panel's
      // tagline render keeps working untouched.
      scope: 'variant',
      keys: VARIANTS.map((v) => `variant.${v.key}.lore`),
    },
    {
      // R1 M4 — 18 relics carry `flavour`. SCS overlay shipped 2026-04-24.
      scope: 'relic',
      keys: Object.values(RELICS).map((r) => r.flavourKey),
    },
    {
      // U1 — 30 runes. EN-only at M1 ship; SCS overlays added by C2
      // Sub-task D (2026-04-26). Extending parity fence here so any
      // future rune addition fails CI without an SCS pair.
      scope: 'rune',
      keys: Object.values(RUNES).map((r) => r.flavourKey),
    },
  ];

  for (const { scope, keys } of cases) {
    it(`${scope}: every key has EN flavour`, () => {
      setLocale('en');
      for (const k of keys) expectFlavour(k);
    });

    it(`${scope}: every key has SCS flavour (no EN fallback)`, () => {
      setLocale('scs');
      for (const k of keys) expectFlavour(k);
    });
  }

  it('full catalogue: no dot-path leaks in either locale', () => {
    const all = cases.flatMap((c) => c.keys);
    for (const locale of ['en', 'scs'] as const) {
      setLocale(locale);
      for (const k of all) {
        const r = t(k);
        expect(r, `${locale}:${k}`).not.toBe(k);
      }
    }
  });
});
