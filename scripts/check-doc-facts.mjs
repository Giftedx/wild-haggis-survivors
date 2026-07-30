#!/usr/bin/env node
/**
 * Live documentation fact scanner.
 *
 * PILOT POLICY: report-only, no exit 1 by default. The report shows
 * annotated mismatches and unannotated numeric candidates. A future
 * commit can wire --enforce into npm run ci after the live docs have
 * annotations.
 *
 * Usage:
 *   node scripts/check-doc-facts.mjs
 *   node scripts/check-doc-facts.mjs --enforce
 *   node scripts/check-doc-facts.mjs --root <fixture-directory>
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const FACTS_PATH = fileURLToPath(new URL('./repoFacts.json', import.meta.url));
const TOP_LEVEL_DOCS = ['README.md', 'CLAUDE.md', 'CONTRIBUTING.md', 'AGENTS.md'];
const ANNOTATION_RE = /<!--\s*fact:([A-Za-z0-9_.-]+)\s*-->/;
const NUMBER_FIRST_RE = /\b(\d+) (variants|weapons|biomes|hazards|relics|runes|events)\b/gi;
const LABEL_FIRST_RE = /\b(variants|weapons|biomes|hazards|relics|runes|events)\b\*{0,2}:\*{0,2}\s*(\d+)\b/gi;

const FACT_BY_NOUN = {
  variants: 'variants.count',
  weapons: 'weapons.total',
  biomes: 'biomes.count',
  hazards: 'hazards.count',
  relics: 'relics.count',
  runes: 'runes.count',
  events: 'seasonalEvents.count',
};

async function collectMarkdownFiles(root) {
  const files = [];

  for (const name of TOP_LEVEL_DOCS) {
    try {
      await readFile(join(root, name), 'utf8');
      files.push(join(root, name));
    } catch {
      // A fixture does not need every live top-level document.
    }
  }

  const docsRoot = join(root, 'docs');
  const pending = [docsRoot];
  while (pending.length > 0) {
    const directory = pending.pop();
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const path = join(directory, entry.name);
      const repoPath = relative(root, path).replaceAll('\\', '/');
      if (repoPath === 'docs/archive' || repoPath.startsWith('docs/archive/')) continue;
      if (repoPath === 'docs/research' || repoPath.startsWith('docs/research/')) continue;
      if (entry.isDirectory()) pending.push(path);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path);
    }
  }

  return files;
}

function findClaimNumber(line, sameLineAnnotation) {
  const claimText = sameLineAnnotation
    ? line.slice(sameLineAnnotation.index + sameLineAnnotation[0].length)
    : line;
  const numberMatch = claimText.match(/\b\d+\b/)
    ?? (sameLineAnnotation ? line.match(/\b\d+\b/) : null);
  return numberMatch ? Number(numberMatch[0]) : null;
}

function candidateMatches(line) {
  const candidates = [];
  for (const match of line.matchAll(NUMBER_FIRST_RE)) {
    candidates.push({ index: match.index, claimed: Number(match[1]), noun: match[2].toLowerCase() });
  }
  for (const match of line.matchAll(LABEL_FIRST_RE)) {
    candidates.push({ index: match.index, claimed: Number(match[2]), noun: match[1].toLowerCase() });
  }
  return candidates.sort((a, b) => a.index - b.index);
}

export async function scanDocs({ root = process.cwd(), facts }) {
  const findings = [];
  const summary = { matched: 0, mismatched: 0, unannotated: 0 };
  const resolvedRoot = resolve(root);
  const files = await collectMarkdownFiles(resolvedRoot);

  for (const path of files) {
    const file = relative(resolvedRoot, path).replaceAll('\\', '/');
    const lines = (await readFile(path, 'utf8')).split(/\r?\n/);
    let precedingAnnotation = null;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const sameLineAnnotation = line.match(ANNOTATION_RE);
      const annotation = sameLineAnnotation ?? precedingAnnotation;
      const claimed = annotation
        ? findClaimNumber(line, sameLineAnnotation)
        : null;

      if (annotation && claimed !== null) {
        const fact = annotation[1];
        const actual = facts[fact];
        if (claimed === actual) {
          summary.matched++;
        } else {
          summary.mismatched++;
          findings.push({
            status: 'MISMATCH',
            file,
            line: index + 1,
            fact,
            claimed,
            actual: Number.isFinite(actual) ? actual : null,
          });
        }
      } else if (!annotation) {
        for (const candidate of candidateMatches(line)) {
          const fact = FACT_BY_NOUN[candidate.noun];
          summary.unannotated++;
          findings.push({
            status: 'UNANNOTATED',
            file,
            line: index + 1,
            fact,
            claimed: candidate.claimed,
            actual: facts[fact],
            noun: candidate.noun,
          });
        }
      }

      precedingAnnotation = sameLineAnnotation && claimed === null ? sameLineAnnotation : null;
    }
  }

  return { findings, summary };
}

function report({ findings, summary }) {
  for (const finding of findings) {
    if (finding.status === 'MISMATCH') {
      console.log(
        `[doc-facts] MISMATCH ${finding.file}:${finding.line} ${finding.fact}: ` +
        `claimed ${finding.claimed}, actual ${finding.actual ?? 'unknown'}`,
      );
    } else {
      console.log(
        `[doc-facts] UNANNOTATED ${finding.file}:${finding.line}: ` +
        `${finding.claimed} ${finding.noun} (candidate ${finding.fact})`,
      );
    }
  }

  console.log(
    `[doc-facts] summary: ${summary.matched} matched / ` +
    `${summary.mismatched} mismatched / ${summary.unannotated} unannotated`,
  );
}

function parseArgs(args) {
  let root = process.cwd();
  let enforce = false;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--enforce') enforce = true;
    else if (arg === '--root') root = args[++index];
    else if (arg.startsWith('--root=')) root = arg.slice('--root='.length);
  }

  return { root, enforce };
}

export async function runCli(args = process.argv.slice(2)) {
  const { root, enforce } = parseArgs(args);
  const facts = JSON.parse(await readFile(FACTS_PATH, 'utf8'));
  const result = await scanDocs({ root, facts });
  report(result);

  if (enforce && result.findings.length > 0) {
    console.error(`[doc-facts] ENFORCE: ${result.findings.length} finding(s)`);
    return 1;
  }
  if (result.findings.length > 0) {
    console.log('[doc-facts] pilot mode: exit 0 regardless; pass --enforce to gate');
  }
  return 0;
}

if (resolve(process.argv[1] ?? '') === SCRIPT_PATH) {
  process.exitCode = await runCli();
}
