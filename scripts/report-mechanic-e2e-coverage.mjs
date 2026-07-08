#!/usr/bin/env node
/**
 * Input-wired mechanic → Playwright coverage inventory.
 *
 * This is intentionally a lightweight report, not another CI ratchet. It names
 * shipped mechanics whose value depends on live input/collision wiring, maps
 * them to the e2e specs that exercise that wiring, and calls out known gaps so
 * future mechanics do not disappear into helper-only unit coverage.
 *
 * Guardrail against false positives: entries are hand-curated and every entry
 * must include runtime source evidence outside `*.test.ts`. Pure helpers are
 * allowed as notes, but helper files alone do not make a mechanic part of this
 * inventory.
 *
 * Usage:
 *   node scripts/report-mechanic-e2e-coverage.mjs
 *   node scripts/report-mechanic-e2e-coverage.mjs --strict-gaps
 */
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const argv = new Set(process.argv.slice(2));
const STRICT_GAPS = argv.has('--strict-gaps');

const INVENTORY = [
  {
    name: 'Movement input (keyboard / d-pad / sticks)',
    category: 'baseline input',
    runtimeEvidence: [
      { file: 'src/utils/input.ts', token: 'getDirection(): { x: number; y: number }' },
      { file: 'src/entities/Player.ts', token: 'this.inputManager.getDirection()' },
    ],
    e2eSpecs: [
      { file: 'e2e/gamepad.spec.ts', tokens: ['d-pad right moves player'] },
      { file: 'e2e/mobile-smoke.spec.ts', tokens: ['pointerdown events'] },
    ],
    status: 'covered',
    note: 'Keyboard movement is exercised indirectly by gameplay boot/input specs; gamepad and touch have explicit runtime smokes.',
  },
  {
    name: 'Dash edge + rebound dash key',
    category: 'baseline input',
    runtimeEvidence: [
      { file: 'src/utils/input.ts', token: 'consumeDashPressed(): boolean' },
      { file: 'src/entities/Player.ts', token: 'private tryDash(): void' },
    ],
    e2eSpecs: [
      { file: 'e2e/input-remap.spec.ts', tokens: ['Dash rebound to Q fires tryDash'] },
      { file: 'e2e/gamepad.spec.ts', tokens: ['button 0 dashes'] },
      { file: 'e2e/mobile-smoke.spec.ts', tokens: ['dash zone (right half)', 'pointerdown events'] },
    ],
    status: 'covered',
    note: 'Covers keyboard rebinding, gamepad dash, and touch dispatch prerequisite; dash arithmetic remains unit-covered.',
  },
  {
    name: 'Drift Mastery consume (G)',
    category: 'skill-expression key',
    runtimeEvidence: [
      { file: 'src/entities/Player.ts', token: 'Drift Mastery (DESIGN_IDEAS §1)' },
      { file: 'src/entities/Player.ts', token: 'driftMasteryState' },
    ],
    e2eSpecs: [
      { file: 'e2e/drift-mastery.spec.ts', tokens: ['G consumes a banked Grip pip'] },
    ],
    status: 'covered',
    note: 'Spec seeds a pip then verifies the live G edge is consumed by Player.update.',
  },
  {
    name: 'Stance Toggle cycle (Q)',
    category: 'skill-expression key',
    runtimeEvidence: [
      { file: 'src/entities/Player.ts', token: 'Stance Toggle (DESIGN_IDEAS §1)' },
      { file: 'src/entities/Player.ts', token: 'cycleStance(prev)' },
    ],
    e2eSpecs: [
      { file: 'e2e/stance-toggle.spec.ts', tokens: ['Q cycles loose -> braced -> reeling -> loose'] },
    ],
    status: 'covered',
    note: 'Spec holds/releases Q across frames to catch edge debounce regressions.',
  },
  {
    name: 'Shinty Parry window (E)',
    category: 'skill-expression key',
    runtimeEvidence: [
      { file: 'src/entities/Player.ts', token: 'Shinty Parry (DESIGN_IDEAS §1)' },
      { file: 'src/entities/Player.ts', token: 'tickShintyParry' },
    ],
    e2eSpecs: [
      { file: 'e2e/shinty-parry.spec.ts', tokens: ['E opens the parry window'] },
    ],
    status: 'covered',
    note: 'Spec verifies idle → active → ready through the live key edge; projectile consume remains unit/overlap-covered.',
  },
  {
    name: 'Burn Leap double-tap movement gesture',
    category: 'movement gesture',
    runtimeEvidence: [
      { file: 'src/entities/Player.ts', token: 'Burn Leap (M8)' },
      { file: 'src/entities/Player.ts', token: 'evaluateBurnLeap' },
    ],
    e2eSpecs: [],
    status: 'gap',
    gap: 'No Playwright smoke currently drives a double-tap direction sequence and observes burn-leap active/boost state. Helper detection is unit-covered in src/entities/burnLeapInput.test.ts, but the live Player.update gesture path is not.',
  },
  {
    name: 'Cairn Stacking walkover collect / boon chain',
    category: 'world pickup',
    runtimeEvidence: [
      { file: 'src/scenes/game/installCairnSystems.ts', token: 'cairnStacking' },
      { file: 'src/data/banter.ts', token: 'Cairn Stacking (DESIGN_IDEAS §1)' },
    ],
    e2eSpecs: [
      { file: 'e2e/cairn-stack.spec.ts', tokens: ['first stone spawns after game-second 75'] },
    ],
    status: 'partial',
    gap: 'Existing e2e proves scheduler → spawn wiring only. The walkover collect and third-stone boon are helper/unit-covered but not e2e-friendly today because the spawned pickup positioning is not deterministic enough.',
  },
  {
    name: 'Clootie Rag Wager walk-through commit',
    category: 'world pickup',
    runtimeEvidence: [
      { file: 'src/scenes/game/clootieTree.ts', token: 'ClootieTree' },
      { file: 'src/data/banter.ts', token: 'Clootie Rag Wager (DESIGN_IDEAS §1)' },
    ],
    e2eSpecs: [
      { file: 'e2e/clootie-wager.spec.ts', tokens: ['tree spawns within the 4-9 minute window'] },
    ],
    status: 'partial',
    gap: 'Existing e2e proves timed tree spawn only. The walk-through HP cost + boon commit edge is unit-covered in clootieRagWager.test.ts but not exercised through Phaser overlap.',
  },
  {
    name: 'Reliquary / relic walkover pickup',
    category: 'world pickup',
    runtimeEvidence: [
      { file: 'src/entities/RelicPickup.ts', token: 'RelicPickup' },
      { file: 'src/systems/RelicSystem.ts', token: 'RelicSystem' },
    ],
    e2eSpecs: [
      { file: 'e2e/relic-pickup.spec.ts', tokens: ['spawn → walk over → slot filled'] },
    ],
    status: 'covered',
    note: 'Spec uses DEBUG spawn-at-player seam and waits for the real overlap to fill the relic slot.',
  },
  {
    name: 'Race the Beithir sting / cure loop',
    category: 'world encounter',
    runtimeEvidence: [
      { file: 'src/entities/raceTheBeithir.ts', token: 'RaceTheBeithirState' },
      { file: 'src/entities/Player.ts', token: 'RaceTheBeithirState' },
    ],
    e2eSpecs: [
      { file: 'e2e/race-the-beithir.spec.ts', tokens: ['spawns a beithir after game-second 660'] },
    ],
    status: 'partial',
    gap: 'Existing e2e proves encounter spawn only. The sting race window and cure-on-heal path are unit-covered but not driven through a live collision/heal sequence.',
  },
  {
    name: 'Pause / menu action inputs',
    category: 'UI input',
    runtimeEvidence: [
      { file: 'src/utils/input.ts', token: 'consumeMenuPausePressed(): boolean' },
      { file: 'src/scenes/GameScene.ts', token: 'toggleUiPause' },
    ],
    e2eSpecs: [
      { file: 'e2e/pause-dom-focus.spec.ts', tokens: ['mounts whs-pause-focus-layer'] },
      { file: 'e2e/gamepad.spec.ts', tokens: ['standard-mapping gamepad'] },
    ],
    status: 'covered',
    note: 'Pause overlay DOM focus is covered; gamepad spec covers the runtime pad plumbing that also feeds pause edges.',
  },
];

function relPath(path) {
  return path.replace(/\\/g, '/');
}

async function readRel(file) {
  return readFile(join(ROOT, file), 'utf8');
}

async function existsRel(file) {
  try {
    await access(join(ROOT, file));
    return true;
  } catch {
    return false;
  }
}

function statusLabel(status) {
  if (status === 'covered') return 'COVERED';
  if (status === 'partial') return 'PARTIAL';
  return 'GAP';
}

function printWrapped(prefix, text, width = 100) {
  const words = String(text).split(/\s+/).filter(Boolean);
  let line = prefix;
  for (const word of words) {
    if ((line + word).length > width) {
      console.log(line.trimEnd());
      line = `${' '.repeat(prefix.length)}${word} `;
    } else {
      line += `${word} `;
    }
  }
  if (line.trim()) console.log(line.trimEnd());
}

const failures = [];
const gapRows = [];
const specRows = new Set();

for (const entry of INVENTORY) {
  if (!entry.runtimeEvidence?.length) {
    failures.push(`${entry.name}: missing runtime source evidence`);
  }
  for (const evidence of entry.runtimeEvidence ?? []) {
    const file = relPath(evidence.file);
    if (file.endsWith('.test.ts')) {
      failures.push(`${entry.name}: runtime evidence must not be a test/helper-only proof (${file})`);
      continue;
    }
    if (!(await existsRel(file))) {
      failures.push(`${entry.name}: runtime evidence file missing: ${file}`);
      continue;
    }
    const src = await readRel(file);
    if (!src.includes(evidence.token)) {
      failures.push(`${entry.name}: runtime evidence token not found in ${file}: ${evidence.token}`);
    }
  }

  for (const spec of entry.e2eSpecs ?? []) {
    const file = relPath(spec.file);
    specRows.add(file);
    if (!(await existsRel(file))) {
      failures.push(`${entry.name}: e2e spec missing: ${file}`);
      continue;
    }
    const src = await readRel(file);
    for (const token of spec.tokens ?? []) {
      if (!src.includes(token)) {
        failures.push(`${entry.name}: e2e token not found in ${file}: ${token}`);
      }
    }
  }

  if ((entry.status === 'gap' || entry.status === 'partial') && !entry.gap) {
    failures.push(`${entry.name}: ${entry.status} entry must include a gap rationale`);
  }
  if (entry.status === 'gap' || entry.status === 'partial') {
    gapRows.push(entry);
  }
}

console.log('[mechanic-e2e-coverage] Input-wired mechanic inventory');
console.log('');
console.log(`  mechanics inventoried: ${INVENTORY.length}`);
console.log(`  unique e2e specs mapped: ${specRows.size}`);
console.log(`  gaps/partials highlighted: ${gapRows.length}`);
console.log('');

for (const entry of INVENTORY) {
  const specList = entry.e2eSpecs?.length
    ? entry.e2eSpecs.map((s) => relPath(s.file)).join(', ')
    : '—';
  console.log(`- [${statusLabel(entry.status)}] ${entry.name}`);
  console.log(`  category: ${entry.category}`);
  console.log(`  e2e: ${specList}`);
  if (entry.note) printWrapped('  note: ', entry.note);
  if (entry.gap) printWrapped('  gap:  ', entry.gap);
  console.log('');
}

if (failures.length > 0) {
  console.error('[mechanic-e2e-coverage] FAIL — stale inventory evidence:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

if (STRICT_GAPS && gapRows.length > 0) {
  console.error('[mechanic-e2e-coverage] FAIL (--strict-gaps) — uncovered/partial mechanics remain:');
  for (const row of gapRows) console.error(`  - ${row.name}`);
  process.exit(1);
}

console.log('[mechanic-e2e-coverage] OK — inventory evidence is fresh. Gaps are report-only unless --strict-gaps is passed.');
