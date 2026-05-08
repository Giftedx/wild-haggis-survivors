/**
 * Lightweight i18n — dot-path keys, `{var}` interpolation, missing keys return the key string.
 * Future locales can replace `EN_STRINGS` or merge overrides.
 */

export type LocaleTree = { readonly [k: string]: string | LocaleTree };
import { EN_STRINGS } from './i18n/enStrings';
export { EN_STRINGS };

function getLeaf(tree: LocaleTree, key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = tree;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object' || !(p in (cur as object))) {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}


export type LocaleKey = 'en' | 'scs';
export const DEFAULT_LOCALE: LocaleKey = 'en';

let activeLocale: LocaleKey = DEFAULT_LOCALE;

/**
 * Scots is code-split — the Scots overlay lives in `./i18n.scs` and is
 * only fetched when the player selects it. Until the chunk resolves,
 * `LOCALES.scs` falls back to EN_STRINGS and `t()` renders in English.
 *
 * Callers that need deterministic Scots resolution (tests, boot paths
 * on a Scots-saved profile) should `await ensureLocaleReady('scs')`
 * before the first `t()` call.
 */
let scsOverlay: LocaleTree | null = null;
let scsLoadPromise: Promise<LocaleTree> | null = null;

/**
 * Preload a locale's overlay chunk. English is always resident (it IS
 * the reference tree). For Scots, triggers the dynamic `import('./i18n.scs')`
 * and resolves when the chunk is cached. Safe to call repeatedly — a
 * single in-flight promise is memoized.
 */
export function ensureLocaleReady(key: LocaleKey): Promise<void> {
  if (key !== 'scs') return Promise.resolve();
  if (scsOverlay) return Promise.resolve();
  if (!scsLoadPromise) {
    scsLoadPromise = import('./i18n.scs').then((m) => {
      scsOverlay = m.SCS_STRINGS;
      return scsOverlay;
    });
  }
  return scsLoadPromise.then(() => undefined);
}

/**
 * LOCALES exposes the active overlay map. `scs` is a getter so it always
 * reflects the current lazy-load state — before the chunk resolves it
 * returns EN_STRINGS (silent fallback); after, the loaded Scots tree.
 */
export const LOCALES: Readonly<Record<LocaleKey, LocaleTree>> = {
  en: EN_STRINGS,
  get scs(): LocaleTree {
    return scsOverlay ?? EN_STRINGS;
  },
} as Readonly<Record<LocaleKey, LocaleTree>>;

/**
 * Switch the active locale. Unknown keys fall back to English silently.
 * For Scots, kicks off the code-split chunk fetch in the background —
 * use `await ensureLocaleReady('scs')` first if you need the next `t()`
 * call to resolve against the Scots tree rather than fall back to EN.
 */
export function setLocale(key: LocaleKey): void {
  activeLocale = key;
  if (key === 'scs') void ensureLocaleReady('scs');
}

/** Read the active locale. */
export function getLocale(): LocaleKey {
  return activeLocale;
}

/**
 * Resolve a dot-path key against the active dictionary. Missing paths
 * fall back to the English tree, then to the key string itself. Keeps
 * partial-locale rollout safe: a Scots overlay only needs to define the
 * keys it's ready to ship — and until the Scots chunk loads, every key
 * falls back to EN.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  if (activeLocale !== DEFAULT_LOCALE) {
    const overlay = getLeaf(LOCALES[activeLocale], key);
    if (overlay !== undefined) return interpolate(overlay, vars);
  }
  const raw = getLeaf(EN_STRINGS, key);
  if (raw === undefined) return key;
  return interpolate(raw, vars);
}
