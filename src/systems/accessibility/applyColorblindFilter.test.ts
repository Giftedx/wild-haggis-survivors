import { describe, it, expect } from 'vitest';
import {
  ensureColorblindSvgFilters,
  applyColorblindFilterToCanvas,
} from './applyColorblindFilter';

/**
 * Vitest is configured with `environment: 'node'`, so there's no real
 * DOM. These tests stub the minimum Document / Element surface the
 * module uses — `createElementNS`, `appendChild`, `setAttribute`,
 * `getElementById`, `ownerDocument`, and the `body` anchor.
 */

interface FakeElement {
  tagName: string;
  attrs: Map<string, string>;
  children: FakeElement[];
  id: string;
  style: { filter: string };
  setAttribute(k: string, v: string): void;
  getAttribute(k: string): string | null;
  appendChild(child: FakeElement): FakeElement;
  querySelectorAll(selector: string): FakeElement[];
  ownerDocument?: FakeDocument;
}

interface FakeDocument {
  body: FakeElement;
  createElementNS(ns: string, tag: string): FakeElement;
  getElementById(id: string): FakeElement | null;
}

function makeElement(tag: string, doc?: FakeDocument): FakeElement {
  const el: FakeElement = {
    tagName: tag,
    attrs: new Map(),
    children: [],
    id: '',
    style: { filter: '' },
    setAttribute(k, v) {
      this.attrs.set(k, v);
      if (k === 'id') this.id = v;
    },
    getAttribute(k) {
      return this.attrs.get(k) ?? null;
    },
    appendChild(child) {
      this.children.push(child);
      child.ownerDocument = doc;
      return child;
    },
    querySelectorAll(selector) {
      const out: FakeElement[] = [];
      const walk = (n: FakeElement) => {
        for (const c of n.children) {
          if (selector === 'filter' && c.tagName === 'filter') out.push(c);
          walk(c);
        }
      };
      walk(this);
      return out;
    },
    ownerDocument: doc,
  };
  return el;
}

function makeDocument(): FakeDocument {
  const doc: FakeDocument = {
    body: null as unknown as FakeElement,
    createElementNS(_ns, tag) {
      return makeElement(tag, doc);
    },
    getElementById(id) {
      const walk = (n: FakeElement): FakeElement | null => {
        for (const c of n.children) {
          if (c.id === id) return c;
          const found = walk(c);
          if (found) return found;
        }
        return null;
      };
      return walk(doc.body);
    },
  };
  doc.body = makeElement('body', doc);
  return doc;
}

describe('applyColorblindFilter (pure DOM contract)', () => {
  it('ensureColorblindSvgFilters injects one SVG with four feColorMatrix filters', () => {
    const doc = makeDocument() as unknown as Document;
    ensureColorblindSvgFilters(doc);
    const svg = doc.getElementById('whs-colorblind-svg') as unknown as FakeElement;
    expect(svg).toBeTruthy();
    const filters = svg.querySelectorAll('filter');
    expect(filters.length).toBe(4);
    const ids = filters.map((f) => f.id).sort();
    expect(ids).toEqual([
      'whs-cb-deuteranopia',
      'whs-cb-monochrome',
      'whs-cb-protanopia',
      'whs-cb-tritanopia',
    ]);
  });

  it('is idempotent — second call does not duplicate the SVG', () => {
    const doc = makeDocument() as unknown as Document;
    ensureColorblindSvgFilters(doc);
    ensureColorblindSvgFilters(doc);
    expect((doc as unknown as FakeDocument).body.children.length).toBe(1);
  });

  it('mode=off clears canvas.style.filter without touching the DOM', () => {
    const canvas = { style: { filter: 'blur(3px)' } } as unknown as HTMLCanvasElement;
    applyColorblindFilterToCanvas(canvas, 'off');
    expect(canvas.style.filter).toBe('');
  });

  it('non-off mode attaches the url(#…) reference after ensuring filters', () => {
    const doc = makeDocument() as unknown as Document;
    const canvas = {
      style: { filter: '' },
      ownerDocument: doc,
    } as unknown as HTMLCanvasElement;
    applyColorblindFilterToCanvas(canvas, 'deuteranopia');
    expect(canvas.style.filter).toBe('url(#whs-cb-deuteranopia)');
  });

  it('switching modes replaces the filter url without rebuilding the SVG', () => {
    const doc = makeDocument() as unknown as Document;
    const canvas = {
      style: { filter: '' },
      ownerDocument: doc,
    } as unknown as HTMLCanvasElement;
    applyColorblindFilterToCanvas(canvas, 'monochrome');
    applyColorblindFilterToCanvas(canvas, 'protanopia');
    expect(canvas.style.filter).toBe('url(#whs-cb-protanopia)');
    expect((doc as unknown as FakeDocument).body.children.length).toBe(1);
  });
});
