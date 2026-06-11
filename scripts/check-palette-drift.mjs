#!/usr/bin/env node
/**
 * Palette drift scanner — pilot for Soul-axis automation.
 *
 * The Art Style Bible (`docs/ART_STYLE_BIBLE.md`) names five tonal
 * palettes (Hearth / Wild / Fey / Grave / Wild Comedy). The runtime
 * source of truth for hex anchors is `src/art/palettes.ts` whose
 * header reads:
 *
 *   "No stray hex constants in drawer code — pull from here or
 *    extend this module."
 *
 * That rule is enforced today only by author discipline — there is
 * no CI gate. This scanner walks `src/art/sprites/**` looking for
 * hex literals (`0x[0-9a-fA-F]{3,6}`) and reports hexes that are
 * NOT in the curated PALETTE set, so an artist can see drift at a
 * glance.
 *
 * PILOT POLICY: report-only, no exit 1. The point is to surface the
 * shape of the drift. Once the report is reviewed and either (a) the
 * strays land in palettes.ts, (b) the allow-list grows, or (c) the
 * sprites get rewritten to use anchors, then a future commit can
 * flip --enforce mode on and wire it into npm run ci.
 *
 * Usage:
 *   node scripts/check-palette-drift.mjs            # report
 *   node scripts/check-palette-drift.mjs --top=20   # top-20 strays
 *   node scripts/check-palette-drift.mjs --files    # group by file
 *   node scripts/check-palette-drift.mjs --enforce  # exit 1 on strays
 *                                                     (future CI gate)
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(HERE, '..');
const SCAN_DIR = join(ROOT, 'src', 'art', 'sprites');
const PALETTE_FILE = join(ROOT, 'src', 'art', 'palettes.ts');

const argv = new Set(process.argv.slice(2));
const ENFORCE = argv.has('--enforce');
const GROUP_BY_FILE = argv.has('--files');
const TOP_ARG = [...argv].find((a) => a.startsWith('--top='));
const TOP = TOP_ARG ? Number(TOP_ARG.split('=')[1]) || 0 : 50;

// Universal hexes that are always allowed. Pure black / white / common
// SVG-like base palette anchors that show up in every drawer for
// silhouette + highlight reads.
const UNIVERSAL_ALLOWED = new Set([
  '0x000000', '0xffffff',
  '0xfff', '0x000',
  '0xff', '0x00', // single-byte tints used in alpha math contexts
]);

// Documented in ART_STYLE_BIBLE.md but not yet in palettes.ts. Keep
// this list short; growing it indefinitely defeats the gate. Entries
// here are cited (filename:line) so future curators know provenance.
const ART_BIBLE_ALLOWED = new Set([
  '0xff9030', // sodium amber streetlights — Wild Comedy palette, ART_STYLE_BIBLE.md:89
]);

async function* walk(dir) {
  for (const entry of await readdir(dir)) {
    const path = join(dir, entry);
    const s = await stat(path);
    if (s.isDirectory()) {
      yield* walk(path);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      yield path;
    }
  }
}

async function loadPaletteAnchors() {
  const src = await readFile(PALETTE_FILE, 'utf8');
  const hexes = new Set();
  for (const m of src.matchAll(/0x[0-9a-fA-F]{6}/g)) {
    hexes.add(m[0].toLowerCase());
  }
  return hexes;
}

async function scan() {
  const allowed = await loadPaletteAnchors();
  for (const h of UNIVERSAL_ALLOWED) allowed.add(h);
  for (const h of ART_BIBLE_ALLOWED) allowed.add(h);

  const stray = new Map(); // hex -> { count, files: Set<string> }
  let scannedFiles = 0;

  for await (const path of walk(SCAN_DIR)) {
    scannedFiles++;
    const src = await readFile(path, 'utf8');
    const rel = relative(ROOT, path).replaceAll('\\', '/');
    for (const m of src.matchAll(/0x[0-9a-fA-F]{3,6}\b/g)) {
      const hex = m[0].toLowerCase();
      if (allowed.has(hex)) continue;
      if (!stray.has(hex)) stray.set(hex, { count: 0, files: new Set() });
      const e = stray.get(hex);
      e.count++;
      e.files.add(rel);
    }
  }

  return { allowed, stray, scannedFiles };
}

function report({ allowed, stray, scannedFiles }) {
  const totalStrays = [...stray.values()].reduce((s, e) => s + e.count, 0);
  console.log(`[palette-drift] scanned ${scannedFiles} sprite files; allow-list ${allowed.size} hexes`);
  console.log(`[palette-drift] found ${stray.size} unique stray hexes (${totalStrays} occurrences)`);

  if (stray.size === 0) {
    console.log('[palette-drift] OK — all hexes resolve to palettes.ts or the allow-lists');
    return 0;
  }

  if (GROUP_BY_FILE) {
    const byFile = new Map();
    for (const [hex, { count, files }] of stray) {
      for (const f of files) {
        if (!byFile.has(f)) byFile.set(f, new Map());
        byFile.get(f).set(hex, (byFile.get(f).get(hex) ?? 0) + count);
      }
    }
    const fileEntries = [...byFile.entries()].sort((a, b) => b[1].size - a[1].size);
    for (const [file, hexes] of fileEntries.slice(0, TOP)) {
      console.log(`  ${file}  (${hexes.size} unique stray)`);
      for (const [hex, n] of [...hexes.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`    ${hex}  ×${n}`);
      }
    }
  } else {
    const sorted = [...stray.entries()].sort((a, b) => b[1].count - a[1].count);
    console.log('[palette-drift] top stray hexes (descending occurrences):');
    for (const [hex, { count, files }] of sorted.slice(0, TOP)) {
      const fileList = [...files].slice(0, 3).join(', ');
      const more = files.size > 3 ? ` +${files.size - 3} more` : '';
      console.log(`  ${hex}  ×${count}  (${fileList}${more})`);
    }
  }

  if (ENFORCE) {
    console.error(`[palette-drift] ENFORCE — exiting non-zero on ${stray.size} stray hexes`);
    return 1;
  }
  console.log('[palette-drift] (pilot mode — exit 0 regardless; pass --enforce to gate)');
  return 0;
}

const result = await scan();
process.exit(report(result));
