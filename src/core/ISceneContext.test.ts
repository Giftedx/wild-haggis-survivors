/**
 * Source-guard for the ISceneContext narrative + cadence surface.
 *
 * Five methods (`requestBanter`, `caption`, `getTutorialSystem`,
 * `getCeilidhChainPeriod`, `getSecondsPastBell`) used to be marked
 * optional with the rationale "unit-test scenes can omit them" — but
 * a sweep shows zero test files construct a partial ISceneContext
 * mock, so the `?.` defensive coding at the call sites was guarding
 * against a possibility that doesn't exist while silently hiding
 * rename / signature drift (a renamed method would simply stop
 * firing with no compile error). This test locks the tightened
 * contract: any future drift back to `methodName?(...)` fails CI
 * loudly.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ISceneContextSrc = readFileSync(
  resolve(__dirname, 'ISceneContext.ts'),
  'utf8',
);

describe('ISceneContext required-method guard', () => {
  // Optional-method syntax is `name?:` for properties or `name?(` for
  // methods. The pattern below matches both forms so a future edit
  // back to either flavour fails CI.
  const REQUIRED = [
    'requestBanter',
    'caption',
    'getTutorialSystem',
    'getCeilidhChainPeriod',
    'getSecondsPastBell',
  ] as const;

  for (const method of REQUIRED) {
    it(`${method} is declared as a required method (no ?: / ?( syntax)`, () => {
      const optionalProperty = new RegExp(`\\b${method}\\?\\s*:`);
      const optionalMethod = new RegExp(`\\b${method}\\?\\s*\\(`);
      expect(ISceneContextSrc).not.toMatch(optionalProperty);
      expect(ISceneContextSrc).not.toMatch(optionalMethod);
      // Sanity: the method is still declared somewhere.
      const declared = new RegExp(`\\b${method}\\s*\\(`);
      expect(ISceneContextSrc).toMatch(declared);
    });
  }
});
