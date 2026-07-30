import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { REPO_FACTS } from '../src/core/repoFacts';
import { scanDocs } from './check-doc-facts.mjs';

const SCRIPT_PATH = fileURLToPath(new URL('./check-doc-facts.mjs', import.meta.url));
const FACTS_SNAPSHOT_PATH = fileURLToPath(new URL('./repoFacts.json', import.meta.url));
const FIXTURE_FACTS = { 'biomes.count': 25, 'hazards.count': 25 };
const fixtureRoots = [];

async function makeFixture(files) {
  const root = await mkdtemp(join(tmpdir(), 'check-doc-facts-'));
  fixtureRoots.push(root);

  for (const [relativePath, content] of Object.entries(files)) {
    const path = join(root, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf8');
  }

  return root;
}

afterEach(async () => {
  await Promise.all(fixtureRoots.splice(0).map((root) => rm(root, { recursive: true })));
});

describe('check-doc-facts', () => {
  it('reads a file snapshot of the live fact registry', async () => {
    await expect(`${JSON.stringify(REPO_FACTS, null, 2)}\n`)
      .toMatchFileSnapshot(FACTS_SNAPSHOT_PATH);
  });

  it('reports an annotated mismatch and accepts the true value', async () => {
    const badRoot = await makeFixture({
      'README.md': '<!-- fact:biomes.count --> 24 biomes\n',
    });
    const badResult = await scanDocs({ root: badRoot, facts: FIXTURE_FACTS });

    expect(badResult.findings).toEqual([
      expect.objectContaining({
        status: 'MISMATCH',
        claimed: 24,
        actual: 25,
      }),
    ]);

    const goodRoot = await makeFixture({
      'README.md': '<!-- fact:biomes.count --> 25 biomes\n',
    });
    const goodResult = await scanDocs({ root: goodRoot, facts: FIXTURE_FACTS });

    expect(goodResult.findings).toEqual([]);
    expect(goodResult.summary).toEqual({
      matched: 1,
      mismatched: 0,
      unannotated: 0,
    });

    const trailingAnnotationRoot = await makeFixture({
      'README.md': '25 biomes <!-- fact:biomes.count -->\n',
    });
    const trailingAnnotationResult = await scanDocs({
      root: trailingAnnotationRoot,
      facts: FIXTURE_FACTS,
    });

    expect(trailingAnnotationResult.findings).toEqual([]);
    expect(trailingAnnotationResult.summary.matched).toBe(1);
  });

  it('binds an annotation on the immediately preceding line to the first number', async () => {
    const root = await makeFixture({
      'README.md': [
        '<!-- fact:biomes.count -->',
        'The full roster contains 24 biomes and mentions 30 runes.',
      ].join('\n'),
    });

    const result = await scanDocs({ root, facts: FIXTURE_FACTS });

    expect(result.findings).toEqual([
      expect.objectContaining({ status: 'MISMATCH', claimed: 24, actual: 25 }),
    ]);
  });

  it('finds unannotated live-doc candidates and excludes archive and research', async () => {
    const root = await makeFixture({
      'README.md': 'The game has 28 variants.\n',
      'docs/PRD.md': '**Biomes:** 25. **Hazards:** 25.\n',
      'docs/archive/old.md': 'The game had 14 variants.\n',
      'docs/research/notes.md': 'The study compared 18 relics.\n',
    });

    const result = await scanDocs({ root, facts: FIXTURE_FACTS });

    expect(result.findings).toEqual([
      expect.objectContaining({ status: 'UNANNOTATED', file: 'README.md', claimed: 28 }),
      expect.objectContaining({ status: 'UNANNOTATED', file: 'docs/PRD.md', claimed: 25, noun: 'biomes' }),
      expect.objectContaining({ status: 'UNANNOTATED', file: 'docs/PRD.md', claimed: 25, noun: 'hazards' }),
    ]);
    expect(result.summary.unannotated).toBe(3);
  });

  it('exits 1 in enforce mode for a bad fixture', async () => {
    const root = await makeFixture({
      'README.md': '<!-- fact:biomes.count --> 24 biomes\n',
    });

    const result = spawnSync(process.execPath, [SCRIPT_PATH, '--root', root, '--enforce'], {
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('1 mismatched');
  });
});
