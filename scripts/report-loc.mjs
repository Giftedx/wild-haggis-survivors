#!/usr/bin/env node
/**
 * LOC growth reporter (replaces the prior `locBudget.test.ts` ratchet).
 *
 * The original ratchet was a list of per-file ceilings asserted via vitest.
 * Across 2026-05-09 alone six ceilings were raised, multiple times each — the
 * "lower only, never raise silently" rule survived for 24 hours after the
 * Phase-7 restructure shipped. The audit at `docs/REVIEW.md` (C2) calls this
 * out: the gate fought the actual workflow on a single-author codebase and
 * became a logbook of permission slips.
 *
 * This script replaces it with two halves:
 *   1. **Reporting**: prints current LOC for the watched files alongside a
 *      soft baseline so growth is visible without blocking. CI surfaces the
 *      output but does not fail on it.
 *   2. **Single hard guardrail**: GameScene caps at HARD_CEILING_GAMESCENE
 *      lines. Past that, fail. Any other file grows freely; the report makes
 *      growth observable.
 *
 * Wired into `npm run ci` (alongside check-bundle-budget). Standalone:
 *   node scripts/report-loc.mjs              # reports + checks GameScene
 *   node scripts/report-loc.mjs --strict     # also fails on >25% growth
 *                                            # against the baseline below
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SRC_ROOT = join(process.cwd(), 'src');

/**
 * Baseline LOC per file as of 2026-05-10 (post-Phase-7 restructure +
 * 2026-05-09 mechanics sprint). The reporter compares current LOC to this
 * baseline and surfaces growth. NOT a ceiling — informational only — except
 * for GameScene (see HARD_CEILING_GAMESCENE).
 */
const BASELINE = {
  'core/i18n.ts': 111,
  'core/i18n.scs.ts': 15,
  'scenes/GameScene.ts': 1819,
  'data/banter.ts': 2682,
  'utils/save.ts': 91,
  'art/sprites/icons/cards.ts': 2,
  'art/sprites/icons/weapons.ts': 2,
  'entities/Enemy.ts': 1657,
  'art/sprites/croft/seasonalProps.ts': 2,
  'entities/Player.ts': 1847,
  'systems/JuiceSystem.ts': 1060,
  'scenes/SettingsScene.ts': 678,
  'systems/WeaponSystem.ts': 1670,
  'scenes/GameOverScene.ts': 293,
  'ui/HUD.ts': 1294,
  'systems/AudioSystem.ts': 1485,
  'art/sprites/decorations/biomeProps.ts': 2,
};

/**
 * Single hard guardrail: GameScene's growth is the most-watched signal in
 * the codebase. HARD_CEILING_GAMESCENE (2200) is ~21% above the 2026-05-10
 * BASELINE entry for `scenes/GameScene.ts` (1819). CI fails past 2200 — extract
 * a slice before bolting on more wiring. The discipline is "does the file
 * fit on one mental page?" not an arbitrary ceiling.
 */
const HARD_CEILING_GAMESCENE = 2200;

/** Soft alarm threshold for `--strict` mode: any file growing >25% from baseline. */
const STRICT_GROWTH_THRESHOLD = 0.25;

const args = process.argv.slice(2);
const strict = args.includes('--strict');

async function countLines(relPath) {
  const abs = join(SRC_ROOT, relPath);
  const text = await readFile(abs, 'utf-8');
  return text.split('\n').length;
}

let hardFailed = false;
let strictFailed = false;
const rows = [];

for (const [relPath, baseline] of Object.entries(BASELINE)) {
  const current = await countLines(relPath);
  const delta = current - baseline;
  const pct = baseline > 0 ? (delta / baseline) * 100 : 0;
  rows.push({ relPath, baseline, current, delta, pct });
}

rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

console.log('[report-loc] LOC growth vs 2026-05-10 baseline:');
console.log('');
console.log('  file                                              baseline   current   delta    pct');
console.log('  ------------------------------------------------  --------   -------   -----    -----');
for (const r of rows) {
  const sign = r.delta > 0 ? '+' : r.delta < 0 ? '' : ' ';
  const pctStr = r.delta === 0 ? '   ' : `${sign}${r.pct.toFixed(1)}%`;
  console.log(
    `  ${r.relPath.padEnd(48)}  ${String(r.baseline).padStart(8)}   ${String(r.current).padStart(7)}   ${sign}${String(Math.abs(r.delta)).padStart(4)}   ${pctStr}`,
  );
  if (strict && r.delta > 0 && r.pct > STRICT_GROWTH_THRESHOLD * 100) {
    strictFailed = true;
  }
}
console.log('');

const gameSceneRow = rows.find((r) => r.relPath === 'scenes/GameScene.ts');
if (gameSceneRow && gameSceneRow.current > HARD_CEILING_GAMESCENE) {
  console.error(
    `[report-loc] FAIL: scenes/GameScene.ts at ${gameSceneRow.current} lines exceeds hard ceiling ${HARD_CEILING_GAMESCENE}. Extract a slice before adding more.`,
  );
  hardFailed = true;
}

if (strict && strictFailed) {
  console.error(
    `[report-loc] FAIL (--strict): one or more files grew >${STRICT_GROWTH_THRESHOLD * 100}% from baseline.`,
  );
}

if (hardFailed || (strict && strictFailed)) {
  process.exit(1);
}

if (gameSceneRow) {
  const headroom = HARD_CEILING_GAMESCENE - gameSceneRow.current;
  console.log(
    `[report-loc] OK — GameScene at ${gameSceneRow.current}/${HARD_CEILING_GAMESCENE} (${headroom} lines headroom). Other files informational only.`,
  );
}
