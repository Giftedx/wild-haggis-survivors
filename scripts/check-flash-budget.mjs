#!/usr/bin/env node
/**
 * Static flash-budget checker (Task 07 — A1 PEAT prep).
 *
 * Goal: stop a future change from silently bypassing the
 * `scaledFlashAlpha` / `scaledFlashDurationMs` ladder defined in
 * `src/core/a11yMotion.ts`. PEAT desktop runs over OBS captures still
 * decide pass/fail (see `docs/status/a11y/A1_PEAT_AUDIT.md`); this
 * checker just keeps the code surface stable between captures.
 *
 * Two invariants enforced:
 *
 *   1. The three full-screen flash methods on `JuiceSystem`
 *      (`flashWhite`, `flashRed`, `flashColored`) MUST route their
 *      alpha through `scaledFlashAlpha` and their tween duration
 *      through `scaledFlashDurationMs`. Today they do; the check
 *      catches a regression where someone inlines a raw 0.6 alpha or
 *      a raw `duration: 150`.
 *
 *   2. The set of files that own a full-screen flash overlay (a
 *      `flashRect`-class object covering ≥ 60% of the viewport with
 *      a high-alpha tween) is fixed at the allowlist below. A new
 *      file appearing in that list is a real PEAT-relevant change
 *      and must be reviewed before merge — the checker fails so the
 *      review can't be skipped by a tired reviewer.
 *
 * What this is NOT:
 *
 *   - Not a PEAT pass. It cannot grade flash rate, red-strobe risk,
 *     or 25%-screen-area thresholds. PEAT humans still decide.
 *   - Not a coverage check on every alpha tween — most are local
 *     particle pools that are off-screen tiny. The checker focuses
 *     on the canonical PEAT-failing pattern: a screen-sized
 *     rectangle pulsing at high alpha.
 *
 * Flags:
 *   --report-only   Print findings but always exit 0. Useful for
 *                   diagnostic runs or first wiring into CI.
 *   --verbose       Print the full match context for every finding.
 *
 * Wired into `npm run flash-budget` (standalone) and `npm run ci`
 * (steady-state false-positive rate is 0; folded in 2026-04-26
 * alongside the bundle-budget gate — see Task 09 dispatch).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const argv = new Set(process.argv.slice(2));
const REPORT_ONLY = argv.has('--report-only');
const VERBOSE = argv.has('--verbose');

/**
 * Files allowed to construct a full-screen overlay where alpha is
 * tweened (the canonical PEAT-failing surface shape). Each entry
 * names a `kind`:
 *   - 'flash'            — brightness pulse class. Must route
 *                          through `scaledFlashAlpha` /
 *                          `scaledFlashDurationMs`.
 *   - 'fade-transition'  — a one-shot scene fade-in/out. Allowed
 *                          to tween to alpha 1 because the colour
 *                          is dark (BG_DARK) — that's a dim ramp,
 *                          not a flash. Photosensitive failure
 *                          mode is *bright* pulses.
 *   - 'static-backdrop'  — file contains a constant-alpha
 *                          backdrop near other unrelated
 *                          high-alpha tweens that the
 *                          whole-file scan can't lexically
 *                          separate.
 *
 * Adding a `flash`-kind entry requires PEAT re-capture (see
 * `docs/status/a11y/A1_PEAT_AUDIT.md` re-audit cadence).
 */
const FLASH_OVERLAY_ALLOWLIST = new Map([
  // The single canonical full-screen flash surface. Routes all
  // three of flashWhite / flashRed / flashColored through the
  // a11yMotion ladder.
  ['src/systems/JuiceSystem.ts', { kind: 'flash' }],
  // Shared scene fade helper — `addSceneFadeIn` (alpha 1 → 0)
  // and `startSceneFadeOut` (alpha 0 → 1) on a BG_DARK rect.
  // Dark dim ramp, not a flash; >250ms duration, no strobe risk.
  ['src/scenes/sceneFade.ts', { kind: 'fade-transition' }],
  // BootScene Highland-dawn intro paints an opaque BG_DARK
  // backdrop (line ~161) and SEPARATELY tweens an unrelated
  // sky/mountain layer alpha — different rectangles, but our
  // whole-file scan can't tell. The dawn reveal is a slow
  // multi-second ramp on a dark indigo, not a flash.
  ['src/scenes/BootScene.ts', { kind: 'static-backdrop' }],
]);

/**
 * Pattern that flags a probable full-screen rectangle creation:
 *   scene.add.rectangle(<x>, <y>, <w>, <h>, color [, alpha])
 * where w and h reference layout viewport variables (`width`,
 * `height`, `cam.width`, `this.layoutWidth`, etc). Tuned to be
 * narrow — particle pools and HUD chrome (sized in pixels) do
 * not match.
 *
 * The companion check `tweensToHighAlpha` looks for an alpha
 * tween *up* to a value ≥ 0.4 on a same-file rectangle (the
 * canonical PEAT-failing "screen pulses bright" pattern). Static
 * dim backdrops — pause menu, scene-fade, modal underlay — are
 * one-shot opaque or transparent rectangles that never tween up
 * past the 0.4 threshold and so don't qualify as flash overlays
 * even though they cover the screen.
 */
const FULL_SCREEN_RECT_RE =
  /\.add\.rectangle\s*\(\s*[\w.\s/+*-]*?\bwidth\b[\w.\s/+*-]*?,\s*[\w.\s/+*-]*?\bheight\b[\w.\s/+*-]*?,\s*\b[\w.]*?(?:width|cam\.width)\b/;

/**
 * Detects an alpha tween that *raises* alpha above the 0.4 PEAT
 * cap. Matches `alpha: 0.6,` or `alpha: 1` or `alpha: 0.85` but
 * NOT `alpha: 0` (fade-out, safe) or `alpha: 0.3` (under cap).
 * Uses a tween-target check so a same-line `setAlpha(0.85)` on
 * an instant-paint backdrop doesn't qualify.
 */
const HIGH_ALPHA_TWEEN_RE =
  /tweens\.add\s*\(\s*\{[^}]*?\balpha\s*:\s*(?:0\.[5-9]\d*|1(?:\.0+)?|0?\.4[1-9]\d*)\b/;

/** Methods on JuiceSystem that must keep using the a11yMotion ladder. */
const FLASH_METHODS = ['flashWhite', 'flashRed', 'flashColored'];

/**
 * Walk a TS source string, find a method by name, return its body
 * (between the first `{` after the signature and the matching `}`).
 * Returns null if not found. Brace-balanced so nested blocks work.
 *
 * The signature regex requires a method *declaration* — either
 * `methodName(args): ReturnType {` or `methodName(args) {` at the
 * start of a line (modulo leading whitespace and `private`/`public`
 * modifiers). This rejects call sites like `this.flashColored(...)`
 * where a single-arg `(...)` happens to be followed by a `{` from
 * an `if (...) {` further down the same source.
 */
function extractMethodBody(src, methodName) {
  // Anchor: start-of-line, optional access modifier, then the method
  // name + paren list + optional return-type annotation + `{`.
  const reSig = new RegExp(
    `^\\s*(?:private\\s+|public\\s+|protected\\s+)?${methodName}\\s*\\([^)]*\\)\\s*(?::\\s*[\\w<>\\[\\]|& ]+\\s*)?\\{`,
    'm',
  );
  const m = src.match(reSig);
  if (!m) return null;
  const start = m.index + m[0].length - 1; // points at the `{`
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(start + 1, i);
    }
  }
  return null;
}

/**
 * Classify a JuiceSystem flash method body. Returns `null` on pass,
 * or a description of which invariant failed.
 */
function checkFlashMethod(methodName, body) {
  const callsAlphaScalar = /scaledFlashAlpha\s*\(/.test(body);
  const callsDurationScalar = /scaledFlashDurationMs\s*\(/.test(body);
  if (!callsAlphaScalar) {
    return `${methodName}: missing scaledFlashAlpha — alpha must be capped under reduceFlashing`;
  }
  if (!callsDurationScalar) {
    return `${methodName}: missing scaledFlashDurationMs — flash duration must be floored under reduceFlashing`;
  }
  // Bonus: a literal `alpha: <num>` on a tween line where the same
  // line/block doesn't reference scaledFlashAlpha would be a smell,
  // but tween fade-out targets are always `alpha: 0` and that's
  // safe. Skip.
  return null;
}

/**
 * Scan all .ts files under src/ for full-screen-rect creation
 * paired with a high-alpha tween (the PEAT-flagged pattern). Any
 * file matching BOTH that is NOT in the allowlist is a finding.
 *
 * The two-condition gate keeps static dim/fade backdrops out of
 * the report — those create a full-viewport rectangle but never
 * tween its alpha above the WCAG 0.4 cap, so they're not flash
 * overlays in the photosensitivity sense.
 */
async function scanForUnknownFlashOverlays() {
  const files = await collectTsFiles(join(ROOT, 'src'));
  const findings = [];
  for (const f of files) {
    const rel = f.replace(ROOT + '\\', '').replace(ROOT + '/', '').replace(/\\/g, '/');
    if (FLASH_OVERLAY_ALLOWLIST.has(rel)) continue;
    if (rel.endsWith('.test.ts')) continue;
    const src = await readFile(f, 'utf8');
    if (!FULL_SCREEN_RECT_RE.test(src)) continue;
    if (!HIGH_ALPHA_TWEEN_RE.test(src)) continue;
    const idx = src.search(FULL_SCREEN_RECT_RE);
    const lineNo = src.slice(0, idx).split('\n').length;
    findings.push({
      file: rel,
      line: lineNo,
      snippet: src.slice(idx, idx + 200).split('\n')[0].trim(),
    });
  }
  return findings;
}

/** Sanity check the allowlist itself — flash entries must use the ladder. */
async function checkAllowlistEntries() {
  const failures = [];
  for (const [rel, meta] of FLASH_OVERLAY_ALLOWLIST.entries()) {
    if (meta.kind !== 'flash') continue;
    const full = join(ROOT, rel.replace(/\//g, '\\'));
    let src;
    try {
      src = await readFile(full, 'utf8');
    } catch {
      failures.push(`${rel}: allowlist entry but file not readable`);
      continue;
    }
    if (!/scaledFlashAlpha\s*\(/.test(src)) {
      failures.push(`${rel}: allowlist kind='flash' but file does not import/use scaledFlashAlpha`);
    }
  }
  return failures;
}

async function collectTsFiles(dir) {
  const { readdir, stat } = await import('node:fs/promises');
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try {
      entries = await readdir(d);
    } catch {
      continue;
    }
    for (const name of entries) {
      const full = join(d, name);
      const st = await stat(full);
      if (st.isDirectory()) stack.push(full);
      else if (st.isFile() && full.endsWith('.ts')) out.push(full);
    }
  }
  return out;
}

async function main() {
  const failures = [];

  // Invariant 1 — JuiceSystem flash methods route through the ladder.
  const juicePath = join(ROOT, 'src', 'systems', 'JuiceSystem.ts');
  let juiceSrc;
  try {
    juiceSrc = await readFile(juicePath, 'utf8');
  } catch {
    console.error('[flash-budget] cannot read src/systems/JuiceSystem.ts — repo layout changed?');
    process.exit(1);
  }
  for (const name of FLASH_METHODS) {
    const body = extractMethodBody(juiceSrc, name);
    if (body === null) {
      failures.push(`${juicePath}: method ${name} not found (renamed or removed?)`);
      continue;
    }
    const fail = checkFlashMethod(name, body);
    if (fail) failures.push(`src/systems/JuiceSystem.ts: ${fail}`);
    else if (VERBOSE) console.log(`[flash-budget] OK  flash method ${name} routes through a11yMotion ladder`);
  }

  // Invariant 2 — flash-overlay allowlist.
  const overlayFindings = await scanForUnknownFlashOverlays();
  for (const f of overlayFindings) {
    failures.push(
      `${f.file}:${f.line}: full-screen rectangle outside allowlist — ` +
      `${f.snippet}\n  Resolution: route alpha through scaledFlashAlpha or add to FLASH_OVERLAY_ALLOWLIST after PEAT re-capture (see docs/status/a11y/A1_FLASH_BUDGET.md).`,
    );
  }

  // Invariant 2b — allowlist self-check: flash-kind entries must use the ladder.
  const allowlistFailures = await checkAllowlistEntries();
  for (const m of allowlistFailures) failures.push(m);

  if (VERBOSE) {
    const lines = [...FLASH_OVERLAY_ALLOWLIST.entries()]
      .map(([f, m]) => `  - ${f} (${m.kind})`)
      .join('\n');
    console.log(`[flash-budget] allowlist members:\n${lines}`);
    console.log(`[flash-budget] flash methods checked: ${FLASH_METHODS.join(', ')}`);
  }

  if (failures.length === 0) {
    console.log('[flash-budget] OK — flash methods + overlay allowlist clean');
    return;
  }

  const banner = REPORT_ONLY ? 'WOULD FAIL (--report-only suppresses exit code)' : 'FAILED';
  console.error(`[flash-budget] ${banner}:\n  ${failures.join('\n  ')}`);
  if (!REPORT_ONLY) process.exit(1);
}

main();
