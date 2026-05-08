/**
 * W18 Phase B Scots overlay. English (Glesga register) is the reference;
 * Scots deepens regional vocabulary — `tae` for to, `wi` for with, `o`
 * for of, `oot/aboot/doon`, `ken` for know, `auld` for old, `nicht` for
 * night, `gaun` for going. Numbers + interpolation slots untouched.
 * Keys not present here fall back to English, so this overlay can grow
 * key-by-key without engine changes.
 *
 * Code-split out of the main app chunk by `i18n.ts::ensureLocaleReady`
 * via `import('./i18n.scs')`. English-only users (the default) never
 * download the Scots dictionary; selecting Scots in Settings fetches
 * this chunk on demand.
 */
export { SCS_STRINGS } from './i18n.scs/scsStrings';
