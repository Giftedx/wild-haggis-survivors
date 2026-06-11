import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const spritesRoot = path.join(repoRoot, 'src', 'art', 'sprites');

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && p.endsWith('.ts')) out.push(p);
  }
  return out;
}

// Capture: g.generateTexture('key', ...) or graphics.generateTexture("key", ...)
const GEN_TEX_RE = /\.generateTexture\(\s*(['"`])([^'"`]+)\1\s*,/g;

function expandKnownTemplates(key, fileRel) {
  // We only expand cases we can prove are fixed-range in-source.
  // Currently only `hare.ts` uses template-string keys.
  if (key === 'hare_idle_${i}' && fileRel.endsWith('src/art/sprites/wildlife/hare.ts')) {
    return ['hare_idle_0', 'hare_idle_1'];
  }
  if (key === 'hare_hop_${i}' && fileRel.endsWith('src/art/sprites/wildlife/hare.ts')) {
    return ['hare_hop_0', 'hare_hop_1', 'hare_hop_2', 'hare_hop_3'];
  }
  return null;
}

const files = walk(spritesRoot);
const keys = new Map(); // key -> { file, count }

for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  const fileRel = path.relative(repoRoot, file).replaceAll('\\', '/');
  let m;
  while ((m = GEN_TEX_RE.exec(txt)) !== null) {
    const rawKey = m[2];
    const expanded = expandKnownTemplates(rawKey, fileRel) ?? [rawKey];
    for (const key of expanded) {
      const prev = keys.get(key);
      if (prev) prev.count++;
      else keys.set(key, { file: fileRel, count: 1 });
    }
  }
}

const sorted = [...keys.entries()].sort((a, b) => a[0].localeCompare(b[0]));
console.log(JSON.stringify({
  spritesRoot: path.relative(repoRoot, spritesRoot).replaceAll('\\', '/'),
  fileCount: files.length,
  keyCount: sorted.length,
  keys: sorted.map(([key, meta]) => ({ key, ...meta })),
}, null, 2));

