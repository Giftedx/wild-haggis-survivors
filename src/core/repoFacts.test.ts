import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { REPO_FACTS } from './repoFacts';

const EXPECTED_KEYS = [
  'weapons.total',
  'weapons.evolved',
  'evolution.recipes',
  'evolution.burnsThreshold',
  'relics.count',
  'variants.count',
  'biomes.count',
  'hazards.count',
  'runes.count',
  'seasonalEvents.count',
  'save.schemaVersion',
] as const;

describe('REPO_FACTS', () => {
  it('exposes every supported fact as a positive finite number', () => {
    expect(Object.keys(REPO_FACTS)).toEqual(EXPECTED_KEYS);

    for (const value of Object.values(REPO_FACTS)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
    }
  });

  it('derives counts instead of transcribing numeric literals', () => {
    const source = readFileSync(
      fileURLToPath(new URL('./repoFacts.ts', import.meta.url)),
      'utf8',
    );
    const factLines = source
      .split(/\r?\n/)
      .filter((line) => /^\s*'[^']+':/.test(line));
    const pinnedKeys = new Set([
      'evolution.burnsThreshold',
      'save.schemaVersion',
    ]);

    expect(factLines).toHaveLength(EXPECTED_KEYS.length);

    for (const line of factLines) {
      const match = line.match(/^\s*'([^']+)':\s*(.*),$/);
      expect(match, `Malformed fact entry: ${line}`).not.toBeNull();
      if (match && !pinnedKeys.has(match[1])) {
        expect(match[2], `Numeric literal in derived fact: ${line}`)
          .not.toMatch(/\b\d+(?:\.\d+)?\b/);
      }
    }
  });

  it('is wired to the shipped weapon and biome rosters', () => {
    expect(REPO_FACTS['weapons.total']).toBe(36);
    expect(REPO_FACTS['biomes.count']).toBe(25);
  });
});
