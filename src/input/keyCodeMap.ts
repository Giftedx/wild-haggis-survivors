/**
 * A1 M3 — convert a `KeyboardEvent.code` string to Phaser's legacy
 * `KeyCodes` integer (which doubles as the deprecated but still
 * well-defined `KeyboardEvent.keyCode`).
 *
 * Implemented as a pure integer table (no Phaser import) so it runs
 * in the node-env vitest suite. Phaser's `KeyCodes` is just a constant
 * re-export of these values — if Phaser ever diverges, the mapping
 * test in the browser catches it.
 *
 * Covers the subset relevant to rebinding: letters, digits, arrows,
 * function keys, numpad, and the common control cluster. Returns
 * `undefined` for codes outside the covered set so the caller can
 * fall back to the default binding instead of accepting an unmappable
 * remap.
 */
export function codeToPhaserKeyCode(code: string): number | undefined {
  // Letters: `KeyA` → 65, `KeyZ` → 90.
  if (code.length === 4 && code.startsWith('Key')) {
    const letter = code.charCodeAt(3);
    if (letter >= 65 && letter <= 90) return letter;
  }

  // Digits: `Digit0` → 48, `Digit9` → 57.
  if (code.length === 6 && code.startsWith('Digit')) {
    const digit = code.charCodeAt(5);
    if (digit >= 48 && digit <= 57) return digit;
  }

  // Numpad: `Numpad0` → 96, `Numpad9` → 105.
  if (code.length === 7 && code.startsWith('Numpad')) {
    const n = code.charCodeAt(6) - 48;
    if (n >= 0 && n <= 9) return 96 + n;
  }

  // Function keys: `F1` → 112, `F12` → 123.
  if (code.startsWith('F') && code.length <= 3) {
    const n = Number(code.slice(1));
    if (Number.isFinite(n) && n >= 1 && n <= 12) return 111 + n;
  }

  return NAMED_CODES[code];
}

// Phaser.Input.Keyboard.KeyCodes exposes these as integer constants.
// They match the legacy `KeyboardEvent.keyCode` numbering, which is
// stable across every engine that ever shipped it.
const NAMED_CODES: Record<string, number> = {
  ArrowUp: 38,
  ArrowDown: 40,
  ArrowLeft: 37,
  ArrowRight: 39,
  Space: 32,
  Escape: 27,
  Enter: 13,
  Tab: 9,
  Backspace: 8,
  ShiftLeft: 16,
  ShiftRight: 16,
  ControlLeft: 17,
  ControlRight: 17,
  AltLeft: 18,
  AltRight: 18,
};
