#!/usr/bin/env node
/**
 * Post-build gzip budget gate (Task 9).
 * Run after `vite build`. Fails if primary JS chunks exceed documented ceilings.
 * Update MAX_GZIP_BYTES_* when intentional bundle growth ships.
 *
 * Flags (optional):
 *   --report-only   Print per-chunk sizes but always exit 0. Useful for CI
 *                   artifact summaries or quick "what's my headroom?" runs
 *                   without blocking the chain.
 *   --verbose       Add absolute and percentage headroom alongside each
 *                   chunk size. Diagnostic only — same exit semantics.
 *
 * Wired into `npm run ci` and `npm run ci:all` (see package.json). Standalone
 * shortcut: `npm run budget`. Documentation + baseline rationale live in
 * `docs/status/engine/BUNDLE_BUDGET.md`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST_ASSETS = join(process.cwd(), 'dist', 'assets');

/** Measured 2026-04-26 production build; slack for small drift without hiding regressions. */
const BUDGETS = [
  { re: /^vendor-phaser-.*\.js$/, label: 'vendor-phaser', maxGzipBytes: 390_000 },
  { re: /^index-.*\.js$/, label: 'index (app)', maxGzipBytes: 285_000 },
];

const argv = new Set(process.argv.slice(2));
const REPORT_ONLY = argv.has('--report-only');
const VERBOSE = argv.has('--verbose');

function fmtHeadroom(gz, max) {
  const slackBytes = max - gz;
  const slackPct = ((slackBytes / max) * 100).toFixed(1);
  const sign = slackBytes >= 0 ? '+' : '';
  return `headroom ${sign}${slackBytes} B (${sign}${slackPct}%)`;
}

async function main() {
  let files;
  try {
    files = await readdir(DIST_ASSETS);
  } catch {
    console.error('[bundle-budget] dist/assets missing — run `npm run build` first.');
    process.exit(1);
  }

  const jsFiles = files.filter((f) => f.endsWith('.js'));
  const failures = [];

  for (const { re, label, maxGzipBytes } of BUDGETS) {
    const matches = jsFiles.filter((f) => re.test(f)).sort();
    if (matches.length === 0) {
      failures.push(`${label}: no matching chunk in dist/assets (pattern ${re})`);
      continue;
    }
    if (matches.length > 1) {
      failures.push(`${label}: ambiguous — multiple chunks match ${re}: ${matches.join(', ')}`);
      continue;
    }
    const name = matches[0];
    const buf = await readFile(join(DIST_ASSETS, name));
    const gz = gzipSync(buf).length;
    const ok = gz <= maxGzipBytes;
    const headroom = VERBOSE ? `  ${fmtHeadroom(gz, maxGzipBytes)}` : '';
    console.log(
      `[bundle-budget] ${label} (${name}): gzip ${gz} B (max ${maxGzipBytes} B) ${ok ? 'OK' : 'FAIL'}${headroom}`,
    );
    if (!ok) failures.push(`${label}: gzip ${gz} > ${maxGzipBytes}`);
  }

  if (failures.length) {
    if (REPORT_ONLY) {
      console.warn(
        '[bundle-budget] WOULD FAIL (--report-only suppresses exit code):\n',
        failures.join('\n'),
      );
      return;
    }
    console.error('[bundle-budget] FAILED:\n', failures.join('\n'));
    process.exit(1);
  }
}

main();
