import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SAVE_SCHEMA_VERSION } from './save/schema';

describe('README.md', () => {
  it('documents the correct SAVE_SCHEMA_VERSION', () => {
    const readmePath = path.resolve(__dirname, '../../README.md');
    const readme = fs.readFileSync(readmePath, 'utf8');
    const expectedStr = `schema v${SAVE_SCHEMA_VERSION}`;
    const whsSaveLine = readme.split('\n').find(line => line.includes('whs_save'));
    expect(whsSaveLine).toContain(expectedStr);
  });
});
