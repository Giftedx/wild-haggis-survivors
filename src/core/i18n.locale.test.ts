import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  EN_STRINGS,
  LOCALES,
  getLocale,
  setLocale,
  t,
  type LocaleKey,
  type LocaleTree,
} from './i18n';
// Scots is code-split — import the overlay directly for structural tests
// that need the full tree (parity walks, non-empty assertion). Production
// fetches this chunk dynamically via `ensureLocaleReady('scs')`.
import { SCS_STRINGS } from './i18n.scs';

/**
 * Walk `source` and collect dot-path addresses whose leaves don't appear
 * as strings in `target`. Used by both parity guards — SCS→EN (no orphan
 * overlays) and EN→SCS scoped to `ui.banter.*` (Phase B completion).
 */
function collectMissingLeaves(
  source: LocaleTree,
  target: LocaleTree | undefined,
  basePath: string,
): string[] {
  const missing: string[] = [];
  const walk = (src: LocaleTree, tgt: LocaleTree | undefined, path: string) => {
    for (const [k, v] of Object.entries(src)) {
      const next = path ? `${path}.${k}` : k;
      const tChild = tgt && typeof tgt === 'object'
        ? (tgt as Record<string, unknown>)[k]
        : undefined;
      if (typeof v === 'string') {
        if (typeof tChild !== 'string') missing.push(next);
      } else if (v && typeof v === 'object') {
        walk(v as LocaleTree, tChild as LocaleTree | undefined, next);
      }
    }
  };
  walk(source, target, basePath);
  return missing;
}

/**
 * W18 locale scaffolding regressions. Scots is a partial overlay —
 * keys it doesn't define must fall back to English, not return the raw
 * key. English stays the reference locale.
 */
describe('W18 locale scaffolding', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE));

  it('defaults to en', () => {
    expect(getLocale()).toBe('en');
  });

  it('setLocale switches the active locale', () => {
    setLocale('scs');
    expect(getLocale()).toBe('scs');
    setLocale('en');
    expect(getLocale()).toBe('en');
  });

  it('ships Scots as a non-empty overlay (W18 Phase B content)', () => {
    expect(Object.keys(SCS_STRINGS).length).toBeGreaterThan(0);
    // Spot-check: a high-visibility key is overridden in Scots.
    setLocale('scs');
    expect(t('ui.menu.start_run')).toBe('GAUN');
    expect(t('ui.curseScene.title')).toBe('CURSE O\' THA MOOR');
    expect(t('ui.bossWarning.gordon')).toContain('mairchin');
  });

  it('scs overlay still falls back to English for keys it does not define', () => {
    setLocale('scs');
    // Pick a key the overlay does not currently translate (a passive name).
    const s = t('ui.passive.pause_short.sporran');
    expect(s).toBe('Sporran (+15% Luck)');
  });

  it('LOCALES exposes both keys', () => {
    expect(Object.keys(LOCALES).sort()).toEqual(['en', 'scs']);
  });

  it('scs locale falls back to English for undefined keys', () => {
    setLocale('scs');
    // A known en key that scs does not currently override.
    const s = t('ui.passive.hud_abbrev.sporran');
    expect(s).toBe('SPR');
    expect(s).not.toBe('ui.passive.hud_abbrev.sporran');
  });

  it('scs locale uses the overlay when a key is defined', () => {
    setLocale('scs');
    // ui.menu.start_run is defined in the Scots overlay (Phase B content).
    expect(t('ui.menu.start_run')).toBe('GAUN');
  });

  it('interpolation still works under scs', () => {
    setLocale('scs');
    // buy_kills happens to be the same template in both locales — the
    // contract under test is that {cost} interpolation still fires.
    const s = t('ui.common.buy_kills', { cost: 500 });
    expect(s).toBe('500 culls');
  });

  it('unknown key returns the key itself regardless of locale', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
    setLocale('scs');
    expect(t('does.not.exist')).toBe('does.not.exist');
  });

  it('LocaleKey type narrows to en | scs at compile time', () => {
    const keys: LocaleKey[] = ['en', 'scs'];
    expect(keys).toHaveLength(2);
  });

  /**
   * Catches the bossWarning / tutorial nesting bug class: every SCS leaf
   * key path must exist in EN, otherwise the Scots translation is dead
   * code (the call site reads a different path). Walks both trees in
   * parallel and reports any orphan keys present in scs but missing in en.
   */
  it('every SCS key path also exists in EN (no orphan overlays)', () => {
    expect(collectMissingLeaves(SCS_STRINGS, EN_STRINGS, '')).toEqual([]);
  });

  /**
   * W18 Phase B runtime spot-checks. Proves the full SCS banter tree
   * resolves end-to-end through `t()` — not just structural parity.
   * One leaf per sub-pool category so we catch any dot-path traversal
   * regression without blowing up the test count.
   */
  it('SCS banter per-boss / per-variant / per-weapon / per-curse / per-biome / per-home-biome resolve end-to-end', () => {
    setLocale('scs');
    // per-boss (edge): boss_warn.gordon — Limmy cold identity line.
    expect(t('ui.banter.boss_warn.gordon.a')).toBe('Heid chef\'s oot tha kitchen. Brace yersel.');
    // per-variant (edge): low_hp.wee_ghostie — veil fade tint.
    expect(t('ui.banter.low_hp.wee_ghostie.c')).toBe('A whisper\'s aw that\'s left. Braithe it in.');
    // per-weapon (hearth): weapon_evolve.claymore — steel cleave tint.
    expect(t('ui.banter.weapon_evolve.claymore.a')).toBe('Big sword energy. Tha moor approves.');
    // per-curse (hearth decision): curse_start.heavy_legs — treacle boots.
    expect(t('ui.banter.curse_start.heavy_legs.a')).toBe('Heavy legs, heavier purse. Ye askit fer it.');
    // per-variant (hearth warm): level_up.iron_belly — wall thickens.
    expect(t('ui.banter.level_up.iron_belly.a')).toBe('Anither layer tae tha wa.');
    // per-biome (hearth sensory): biome_change.heather — open sky.
    expect(t('ui.banter.biome_change.heather.a')).toBe('Heather\'s up — purple haze, open sky.');
    // per-home-biome (hearth kin): moor_moment.home_bog — peat discount.
    expect(t('ui.banter.moor_moment.home_bog.a')).toBe('Staundin in tha squelch — tha peat pays interest.');
  });

  /**
   * W18 Phase B completion guard — scoped to `ui.banter.*` only.
   *
   * Every EN banter leaf (generic + per-boss / per-variant / per-weapon /
   * per-biome / per-route sub-pool) must have a Scots translation.
   * Catches future additions (new boss, new weapon, new variant tag)
   * where EN content lands without a matching SCS entry — the Scots
   * player would fall back to EN tagged lines, defeating the overlay
   * for decision-moment copy (boss warnings, weapon evolution, curses).
   *
   * Out-of-scope for this guard: non-banter UI (kept narrow on purpose
   * so adding a new level-up card description doesn't force a locked-
   * step translation pass before merge — only the banter register is
   * under full-parity obligation).
   */
  it('every EN banter leaf has a Scots translation (W18 Phase B parity)', () => {
    const enBanter = (EN_STRINGS.ui as LocaleTree).banter as LocaleTree;
    const scsBanter = (SCS_STRINGS.ui as LocaleTree).banter as LocaleTree;
    expect(collectMissingLeaves(enBanter, scsBanter, 'ui.banter')).toEqual([]);
  });
});
