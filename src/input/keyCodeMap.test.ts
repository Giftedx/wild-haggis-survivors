import { describe, it, expect } from 'vitest';
import { codeToPhaserKeyCode } from './keyCodeMap';

// Phaser's KeyCodes are stable ASCII / legacy keyCode integers. Encoding
// the expected ints here (rather than importing Phaser) keeps this test
// suite in node-env without the Phaser `window`-at-eval issue.

describe('codeToPhaserKeyCode', () => {
  it('maps letter codes to ASCII uppercase ints', () => {
    expect(codeToPhaserKeyCode('KeyA')).toBe(65);
    expect(codeToPhaserKeyCode('KeyW')).toBe(87);
    expect(codeToPhaserKeyCode('KeyZ')).toBe(90);
  });

  it('maps digit codes to their ASCII ints', () => {
    expect(codeToPhaserKeyCode('Digit0')).toBe(48);
    expect(codeToPhaserKeyCode('Digit7')).toBe(55);
    expect(codeToPhaserKeyCode('Digit9')).toBe(57);
  });

  it('maps numpad digits to 96..105', () => {
    expect(codeToPhaserKeyCode('Numpad0')).toBe(96);
    expect(codeToPhaserKeyCode('Numpad9')).toBe(105);
  });

  it('maps arrows, space, escape', () => {
    expect(codeToPhaserKeyCode('ArrowUp')).toBe(38);
    expect(codeToPhaserKeyCode('ArrowDown')).toBe(40);
    expect(codeToPhaserKeyCode('ArrowLeft')).toBe(37);
    expect(codeToPhaserKeyCode('ArrowRight')).toBe(39);
    expect(codeToPhaserKeyCode('Space')).toBe(32);
    expect(codeToPhaserKeyCode('Escape')).toBe(27);
  });

  it('maps modifier keys (left/right share a key code)', () => {
    expect(codeToPhaserKeyCode('ShiftLeft')).toBe(16);
    expect(codeToPhaserKeyCode('ShiftRight')).toBe(16);
    expect(codeToPhaserKeyCode('ControlLeft')).toBe(17);
    expect(codeToPhaserKeyCode('AltRight')).toBe(18);
  });

  it('maps function keys F1..F12 to 112..123', () => {
    expect(codeToPhaserKeyCode('F1')).toBe(112);
    expect(codeToPhaserKeyCode('F12')).toBe(123);
  });

  it('returns undefined for unknown codes', () => {
    expect(codeToPhaserKeyCode('Fn')).toBeUndefined();
    expect(codeToPhaserKeyCode('KeyAB')).toBeUndefined();
    expect(codeToPhaserKeyCode('Digit10')).toBeUndefined();
    expect(codeToPhaserKeyCode('')).toBeUndefined();
  });
});
