/**
 * A1 M3 — human-readable label for a `KeyboardEvent.code`.
 *
 * `ArrowUp` → `Up`, `KeyW` → `W`, `Space` → `Space`, `Escape` → `Esc`,
 * `ShiftLeft` → `Shift L`. Covers every rebindable key in the default
 * layout; unknown codes fall through to the raw code so the UI never
 * shows an empty string.
 */
export function formatKeyCode(code: string): string {
  if (code.length === 4 && code.startsWith('Key')) return code.slice(3);
  if (code.length === 6 && code.startsWith('Digit')) return code.slice(5);
  if (code.length === 7 && code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  if (code.startsWith('Arrow')) return code.slice(5);
  if (code.endsWith('Left')) {
    const base = code.slice(0, -4);
    if (NAMED_SIMPLE[base] || isCapitalizedWord(base)) return `${NAMED_SIMPLE[base] ?? base} L`;
  }
  if (code.endsWith('Right')) {
    const base = code.slice(0, -5);
    if (NAMED_SIMPLE[base] || isCapitalizedWord(base)) return `${NAMED_SIMPLE[base] ?? base} R`;
  }
  return NAMED_SIMPLE[code] ?? code;
}

function isCapitalizedWord(s: string): boolean {
  return /^[A-Z][a-z]+$/.test(s);
}

const NAMED_SIMPLE: Record<string, string> = {
  Space: 'Space',
  Escape: 'Esc',
  Enter: 'Enter',
  Tab: 'Tab',
  Backspace: 'Back',
  Shift: 'Shift',
  Control: 'Ctrl',
  Alt: 'Alt',
  Meta: 'Meta',
};
