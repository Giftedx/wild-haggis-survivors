import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getPostDashGraceMs } from './playerDashAssist';

const BASE_POST_DASH_GRACE_MS = 80;

describe('post-dash assist grace', () => {
  it('keeps baseline grace when extended i-frames are off', () => {
    expect(getPostDashGraceMs(BASE_POST_DASH_GRACE_MS, false)).toBe(BASE_POST_DASH_GRACE_MS);
  });

  it('doubles post-dash grace when Assist Mode extended i-frames are on', () => {
    expect(getPostDashGraceMs(BASE_POST_DASH_GRACE_MS, true)).toBe(160);
  });

  it('wires the Player post-dash grace call site through the Assist Mode reader', () => {
    const playerSource = readFileSync(
      fileURLToPath(new URL('./Player.ts', import.meta.url)),
      'utf8',
    );

    expect(playerSource).toContain('isExtendedIFramesEnabled');
    expect(playerSource).toContain('getPostDashGraceMs(');
    expect(playerSource).toMatch(
      /getPostDashGraceMs\(\s*BALANCE\.player\.postDashGraceMs,\s*isExtendedIFramesEnabled\(\),\s*\)/,
    );
  });
});
