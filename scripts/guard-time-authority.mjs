import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');

const allowedFiles = new Set([
  path.join(srcRoot, 'systems', 'TimeManager.ts'),
]);

const forbidden = [
  { re: /\.time\.timeScale\b/, label: 'direct timeScale access' },
  { re: /\.physics\.world\.(pause|resume)\s*\(/, label: 'direct physics pause/resume' },
  { re: /\.physics\.world\.isPaused\b/, label: 'direct physics pause state read' },
  { re: /\.physics\.(pause|resume)\s*\(/, label: 'direct physics pause/resume' },
];

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile()) yield p;
  }
}

const offenders = [];

for await (const filePath of walk(srcRoot)) {
  if (!filePath.endsWith('.ts')) continue;
  if (allowedFiles.has(filePath)) continue;

  const content = await readFile(filePath, 'utf8');
  for (const rule of forbidden) {
    const m = content.match(rule.re);
    if (m) {
      offenders.push({ filePath, rule: rule.label, match: m[0] });
      break;
    }
  }
}

if (offenders.length > 0) {
  console.error('Time authority guardrail failed. Forbidden Phaser time/physics APIs used outside TimeManager:');
  for (const o of offenders) {
    const rel = path.relative(repoRoot, o.filePath);
    console.error(`- ${rel}: ${o.rule} (matched: ${JSON.stringify(o.match)})`);
  }
  process.exit(1);
}

console.log('Time authority guardrail passed.');

