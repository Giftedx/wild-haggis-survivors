import { describe, it, expect } from 'vitest';
import { formatKeyCode } from './keyCodeDisplay';

describe('formatKeyCode', () => {
  it('unwraps letter codes', () => {
    expect(formatKeyCode('KeyA')).toBe('A');
    expect(formatKeyCode('KeyZ')).toBe('Z');
  });

  it('unwraps digit codes', () => {
    expect(formatKeyCode('Digit0')).toBe('0');
    expect(formatKeyCode('Digit7')).toBe('7');
  });

  it('unwraps numpad codes', () => {
    expect(formatKeyCode('Numpad0')).toBe('Num 0');
    expect(formatKeyCode('Numpad9')).toBe('Num 9');
  });

  it('unwraps arrow codes', () => {
    expect(formatKeyCode('ArrowUp')).toBe('Up');
    expect(formatKeyCode('ArrowLeft')).toBe('Left');
  });

  it('renames Escape to Esc and keeps Space, Enter, Tab', () => {
    expect(formatKeyCode('Escape')).toBe('Esc');
    expect(formatKeyCode('Space')).toBe('Space');
    expect(formatKeyCode('Enter')).toBe('Enter');
    expect(formatKeyCode('Tab')).toBe('Tab');
  });

  it('labels modifier keys with side suffix', () => {
    expect(formatKeyCode('ShiftLeft')).toBe('Shift L');
    expect(formatKeyCode('ShiftRight')).toBe('Shift R');
    expect(formatKeyCode('ControlLeft')).toBe('Ctrl L');
    expect(formatKeyCode('AltRight')).toBe('Alt R');
    expect(formatKeyCode('MetaLeft')).toBe('Meta L');
  });

  it('falls through to raw code when unknown', () => {
    expect(formatKeyCode('Fn')).toBe('Fn');
    expect(formatKeyCode('F7')).toBe('F7');
  });
});
