import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getComboTimeoutMs } from './comboAssist';

describe('getComboTimeoutMs', () => {
  it('keeps the baseline combo window unchanged when Assist Mode extended combo is off', () => {
    expect(getComboTimeoutMs(1500, false)).toBe(1500);
  });

  it('doubles the combo window when Assist Mode extended combo is on', () => {
    expect(getComboTimeoutMs(1500, true)).toBe(3000);
  });
});

describe('JuiceSystem combo Assist Mode call site', () => {
  it('uses the Assist Mode combo helper and reader when resetting the combo timer', () => {
    const juiceSystemPath = fileURLToPath(new URL('./JuiceSystem.ts', import.meta.url));
    const source = readFileSync(juiceSystemPath, 'utf8');

    expect(source).toContain('getComboTimeoutMs(');
    expect(source).toContain('isExtendedComboWindowEnabled()');
    expect(source).not.toContain('this.comboTimer = this.COMBO_TIMEOUT_MS;');
  });
});
