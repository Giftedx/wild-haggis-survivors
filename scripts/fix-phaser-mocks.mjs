#!/usr/bin/env node
// One-shot transform: each test's vi.mock('phaser', () => { ... return { default: {BODY} }; })
// becomes { ... const __m = {BODY}; return { default: __m, ...__m }; }
// so namespace imports (`import * as Phaser`) find named exports.
//
// Stricter than the first attempt — only matches `return {` followed
// (with just whitespace) by `default: {`, so nested class methods that
// happen to contain their own `return {` blocks aren't mistaken for the
// outer mock return. Idempotent: re-running on a fixed file is a no-op.

import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
let changed = 0;
let skipped = 0;
const errors = [];

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');

  // Find the mock factory.
  const mockStart = src.indexOf("vi.mock('phaser'");
  if (mockStart < 0) { skipped++; continue; }

  // Already transformed?
  if (src.includes('...__m')) { skipped++; continue; }

  // Strict pattern: `return {` followed by only whitespace then `default: {`.
  // The /m flag isn't enough because we want to span newlines explicitly.
  const re = /return\s*\{\s*default:\s*\{/g;
  re.lastIndex = mockStart;
  const match = re.exec(src);
  if (!match) { skipped++; continue; }

  // bodyStart points at the `{` opening the default's value.
  const bodyStart = match.index + match[0].length - 1;
  // Walk braces to find the matching close.
  let depth = 0;
  let bodyEnd = -1;
  for (let i = bodyStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) { bodyEnd = i; break; }
    }
  }
  if (bodyEnd < 0) { errors.push(`${file}: unmatched body braces`); continue; }

  const bodyText = src.slice(bodyStart, bodyEnd + 1);

  // After body close, skip whitespace + optional comma, expect outer `}` then `;`.
  let p = bodyEnd + 1;
  while (p < src.length && /[\s,]/.test(src[p])) p++;
  if (src[p] !== '}') { errors.push(`${file}: missing outer return close`); continue; }
  const returnCloseIdx = p;
  p++;
  while (p < src.length && /\s/.test(src[p])) p++;
  if (src[p] !== ';') { errors.push(`${file}: missing return semicolon`); continue; }
  const semiIdx = p;

  // Detect indent of `return {` for clean replacement layout.
  const returnIdx = match.index;
  let lineStart = returnIdx;
  while (lineStart > 0 && src[lineStart - 1] !== '\n') lineStart--;
  const indent = src.slice(lineStart, returnIdx);

  const replacement =
    `const __m = ${bodyText};\n${indent}return { default: __m, ...__m };`;

  src = src.slice(0, returnIdx) + replacement + src.slice(semiIdx + 1);
  fs.writeFileSync(file, src);
  changed++;
  console.log(`[fix] ${path.relative(process.cwd(), file)}`);
}

console.log(`\nchanged=${changed}, skipped=${skipped}`);
if (errors.length) {
  console.error('\nERRORS:');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
