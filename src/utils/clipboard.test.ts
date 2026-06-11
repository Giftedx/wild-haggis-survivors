import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { copyTextToClipboard, copyImageToClipboard, copyCanvasToClipboard } from './clipboard';

interface G {
  navigator?: unknown;
  document?: unknown;
  ClipboardItem?: unknown;
}
const g = globalThis as unknown as G;

function setGlobal(key: 'navigator' | 'document' | 'ClipboardItem', value: unknown): void {
  Object.defineProperty(g, key, { value, writable: true, configurable: true });
}

let savedNav: unknown;
let savedDoc: unknown;
let savedClipboardItem: unknown;

beforeEach(() => {
  savedNav = g.navigator;
  savedDoc = g.document;
  savedClipboardItem = g.ClipboardItem;
});

afterEach(() => {
  setGlobal('navigator', savedNav);
  setGlobal('document', savedDoc);
  setGlobal('ClipboardItem', savedClipboardItem);
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

describe('copyImageToClipboard', () => {
  it('returns true and calls clipboard.write with a ClipboardItem when API is available', async () => {
    const writes: unknown[][] = [];
    const constructed: Array<Record<string, Blob>> = [];
    setGlobal('ClipboardItem', class {
      constructor(record: Record<string, Blob>) {
        constructed.push(record);
      }
    });
    setGlobal('navigator', {
      clipboard: {
        write: (items: unknown[]) => {
          writes.push(items);
          return Promise.resolve();
        },
      },
    });
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
    expect(await copyImageToClipboard(blob)).toBe(true);
    expect(writes).toHaveLength(1);
    expect(constructed).toHaveLength(1);
    expect(constructed[0]['image/png']).toBe(blob);
  });

  it('returns false when ClipboardItem is missing', async () => {
    setGlobal('ClipboardItem', undefined);
    setGlobal('navigator', {
      clipboard: { write: () => Promise.resolve() },
    });
    const blob = new Blob([], { type: 'image/png' });
    expect(await copyImageToClipboard(blob)).toBe(false);
  });

  it('returns false when navigator.clipboard.write is missing', async () => {
    setGlobal('ClipboardItem', class { constructor(_: Record<string, Blob>) { /* noop */ } });
    setGlobal('navigator', { clipboard: {} });
    const blob = new Blob([], { type: 'image/png' });
    expect(await copyImageToClipboard(blob)).toBe(false);
  });

  it('returns false when clipboard.write rejects (e.g. iframe permission denial)', async () => {
    setGlobal('ClipboardItem', class { constructor(_: Record<string, Blob>) { /* noop */ } });
    setGlobal('navigator', {
      clipboard: {
        write: () => Promise.reject(new Error('NotAllowedError')),
      },
    });
    const blob = new Blob([], { type: 'image/png' });
    expect(await copyImageToClipboard(blob)).toBe(false);
  });

  it('falls back to image/png when blob.type is empty string', async () => {
    const constructed: Array<Record<string, Blob>> = [];
    setGlobal('ClipboardItem', class {
      constructor(record: Record<string, Blob>) {
        constructed.push(record);
      }
    });
    setGlobal('navigator', {
      clipboard: { write: () => Promise.resolve() },
    });
    const blob = new Blob([new Uint8Array([1])], { type: '' });
    expect(await copyImageToClipboard(blob)).toBe(true);
    expect(Object.keys(constructed[0])).toEqual(['image/png']);
  });
});

describe('copyCanvasToClipboard', () => {
  it('resolves true when toBlob succeeds and clipboard write succeeds', async () => {
    const blob = new Blob([new Uint8Array([1])], { type: 'image/png' });
    setGlobal('ClipboardItem', class { constructor(_: Record<string, Blob>) { /* noop */ } });
    setGlobal('navigator', {
      clipboard: { write: () => Promise.resolve() },
    });
    const canvas = {
      toBlob: (cb: (b: Blob | null) => void) => cb(blob),
    } as unknown as HTMLCanvasElement;
    expect(await copyCanvasToClipboard(canvas)).toBe(true);
  });

  it('resolves false when toBlob returns null', async () => {
    setGlobal('ClipboardItem', class { constructor(_: Record<string, Blob>) { /* noop */ } });
    setGlobal('navigator', {
      clipboard: { write: () => Promise.resolve() },
    });
    const canvas = {
      toBlob: (cb: (b: Blob | null) => void) => cb(null),
    } as unknown as HTMLCanvasElement;
    expect(await copyCanvasToClipboard(canvas)).toBe(false);
  });

  it('resolves false when toBlob throws', async () => {
    const canvas = {
      toBlob: () => { throw new Error('canvas-tainted'); },
    } as unknown as HTMLCanvasElement;
    expect(await copyCanvasToClipboard(canvas)).toBe(false);
  });
});
