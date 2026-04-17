import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { copyTextToClipboard } from './clipboard';

interface G {
  navigator?: unknown;
  document?: unknown;
}
const g = globalThis as unknown as G;

function setGlobal(key: 'navigator' | 'document', value: unknown): void {
  Object.defineProperty(g, key, { value, writable: true, configurable: true });
}

let savedNav: unknown;
let savedDoc: unknown;

beforeEach(() => {
  savedNav = g.navigator;
  savedDoc = g.document;
});

afterEach(() => {
  setGlobal('navigator', savedNav);
  setGlobal('document', savedDoc);
});

describe('copyTextToClipboard — modern clipboard API', () => {
  it('returns true and calls writeText when navigator.clipboard is available', () => {
    const writes: string[] = [];
    setGlobal('navigator', {
      clipboard: {
        writeText: (s: string) => {
          writes.push(s);
          return Promise.resolve();
        },
      },
    });
    setGlobal('document', undefined);
    expect(copyTextToClipboard('hello')).toBe(true);
    expect(writes).toEqual(['hello']);
  });

  it('returns true even when writeText rejects (async denial swallowed)', () => {
    setGlobal('navigator', {
      clipboard: {
        writeText: () => Promise.reject(new Error('denied')),
      },
    });
    expect(copyTextToClipboard('xyz')).toBe(true);
  });
});

describe('copyTextToClipboard — legacy textarea fallback', () => {
  it('falls back to textarea+execCommand when clipboard API is missing', () => {
    const created: Array<{ tag: string; value: string; selected: boolean }> = [];
    const appended: unknown[] = [];
    const removed: unknown[] = [];
    let commandCalled = '';
    setGlobal('navigator', {});
    setGlobal('document', {
      createElement: (tag: string) => {
        const entry = { tag, value: '', selected: false, style: {} as Record<string, string> };
        created.push(entry);
        return {
          get value() { return entry.value; },
          set value(v: string) { entry.value = v; },
          style: entry.style,
          select() { entry.selected = true; },
        };
      },
      body: {
        appendChild: (el: unknown) => { appended.push(el); },
        removeChild: (el: unknown) => { removed.push(el); },
      },
      execCommand: (cmd: string) => { commandCalled = cmd; return true; },
    });
    expect(copyTextToClipboard('abc')).toBe(true);
    expect(created).toHaveLength(1);
    expect(created[0].tag).toBe('textarea');
    expect(created[0].value).toBe('abc');
    expect(created[0].selected).toBe(true);
    expect(commandCalled).toBe('copy');
    expect(appended.length).toBe(1);
    expect(removed.length).toBe(1);
  });

  it('returns the execCommand result (false when the browser refuses)', () => {
    setGlobal('navigator', {});
    setGlobal('document', {
      createElement: () => ({
        value: '', style: {}, select() { /* noop */ },
      }),
      body: { appendChild: () => {}, removeChild: () => {} },
      execCommand: () => false,
    });
    expect(copyTextToClipboard('abc')).toBe(false);
  });

  it('returns false when no document is available (node-env / no DOM)', () => {
    setGlobal('navigator', {});
    setGlobal('document', undefined);
    expect(copyTextToClipboard('abc')).toBe(false);
  });

  it('returns false when the textarea path throws unexpectedly', () => {
    setGlobal('navigator', {});
    setGlobal('document', {
      createElement: () => { throw new Error('DOM broken'); },
      body: { appendChild: () => {}, removeChild: () => {} },
      execCommand: () => true,
    });
    expect(copyTextToClipboard('abc')).toBe(false);
  });
});
