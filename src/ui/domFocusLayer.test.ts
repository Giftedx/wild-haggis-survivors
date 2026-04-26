import { describe, expect, it } from 'vitest';
import {
  createDomFocusLayer,
  domFocusDirectionForKey,
  normalizeDomFocusIndex,
} from './domFocusLayer';

class TestEvent {
  defaultPrevented = false;
  propagationStopped = false;

  constructor(readonly key = '') {}

  preventDefault(): void {
    this.defaultPrevented = true;
  }

  stopPropagation(): void {
    this.propagationStopped = true;
  }
}

type TestListener = (event: TestEvent) => void;

class TestElement {
  id = '';
  textContent = '';
  readonly style: Record<string, string> = {};
  readonly attributes = new Map<string, string>();
  readonly children: TestElement[] = [];
  readonly listeners = new Map<string, TestListener[]>();
  parent: TestElement | null = null;
  disabled = false;
  tabIndex = 0;
  type = '';
  focusCalls = 0;

  constructor(readonly tagName: string) {}

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | undefined {
    return this.attributes.get(name);
  }

  appendChild(child: TestElement): TestElement {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  replaceChildren(...children: TestElement[]): void {
    for (const child of this.children) child.parent = null;
    this.children.length = 0;
    for (const child of children) this.appendChild(child);
  }

  remove(): void {
    if (!this.parent) return;
    const index = this.parent.children.indexOf(this);
    if (index >= 0) this.parent.children.splice(index, 1);
    this.parent = null;
  }

  addEventListener(type: string, listener: TestListener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type: string, event = new TestEvent()): TestEvent {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
    return event;
  }

  focus(): void {
    this.focusCalls += 1;
    this.dispatch('focus');
  }
}

class TestDocument {
  readonly body = new TestElement('body');

  createElement(tagName: string): TestElement {
    return new TestElement(tagName);
  }
}

function childButtons(root: TestElement): TestElement[] {
  return root.children.filter((child) => child.tagName === 'button');
}

function statusNode(root: TestElement): TestElement {
  const status = root.children.find((child) => child.getAttribute('role') === 'status');
  expect(status).toBeDefined();
  return status!;
}

describe('dom focus layer helpers', () => {
  it('normalizes focus to the requested enabled action or first enabled action', () => {
    const actions = [{ disabled: true }, {}, {}];
    expect(normalizeDomFocusIndex(actions, 2)).toBe(2);
    expect(normalizeDomFocusIndex(actions, 0)).toBe(1);
    expect(normalizeDomFocusIndex(actions, 99)).toBe(1);
    expect(normalizeDomFocusIndex([{ disabled: true }], 0)).toBe(-1);
  });

  it('maps arrow keys to focus direction only', () => {
    expect(domFocusDirectionForKey('ArrowLeft')).toBe(-1);
    expect(domFocusDirectionForKey('ArrowUp')).toBe(-1);
    expect(domFocusDirectionForKey('ArrowRight')).toBe(1);
    expect(domFocusDirectionForKey('ArrowDown')).toBe(1);
    expect(domFocusDirectionForKey('Tab')).toBeNull();
  });

  it('returns a safe no-op layer when no document is available', () => {
    const layer = createDomFocusLayer({
      id: 'missing-dom',
      label: 'Missing DOM',
      ownerDocument: null,
      actions: [],
    });

    expect(layer.root).toBeNull();
    expect(() => layer.setFocusedIndex(1)).not.toThrow();
    expect(() => layer.destroy()).not.toThrow();
  });

  it('creates a visually hidden labeled group with native buttons', () => {
    const doc = new TestDocument();
    const layer = createDomFocusLayer({
      id: 'game-over-actions',
      label: 'Run complete',
      description: 'Choose what happens next.',
      ownerDocument: doc as unknown as Document,
      actions: [
        { id: 'again', label: 'Play again', onActivate: () => undefined },
        { id: 'shop', label: 'Gold shop', disabled: true, onActivate: () => undefined },
      ],
    });

    const root = layer.root as unknown as TestElement;
    expect(doc.body.children).toEqual([root]);
    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('aria-label')).toBe('Run complete');
    expect(root.getAttribute('aria-describedby')).toBe('game-over-actions-description game-over-actions-status');
    expect(root.style.position).toBe('fixed');
    expect(root.style.clipPath).toBe('inset(50%)');

    const buttons = childButtons(root);
    expect(buttons.map((button) => button.textContent)).toEqual(['Play again', 'Gold shop']);
    expect(buttons[0].getAttribute('data-focus-id')).toBe('again');
    expect(buttons[1].disabled).toBe(true);
    expect(buttons[1].tabIndex).toBe(-1);
  });

  it('keeps DOM focus state and status synchronized with Phaser focus', () => {
    const doc = new TestDocument();
    const focused: number[] = [];
    const layer = createDomFocusLayer({
      id: 'focus-sync',
      label: 'Run complete',
      ownerDocument: doc as unknown as Document,
      initialFocusIndex: 0,
      onFocusIndexChange: (index) => focused.push(index),
      actions: [
        { id: 'again', label: 'Play again', onActivate: () => undefined },
        { id: 'shop', label: 'Gold shop', onActivate: () => undefined },
      ],
    });
    const root = layer.root as unknown as TestElement;
    const buttons = childButtons(root);

    layer.setFocusedIndex(1);
    expect(buttons[0].getAttribute('aria-current')).toBe('false');
    expect(buttons[1].getAttribute('aria-current')).toBe('true');
    expect(statusNode(root).textContent).toBe('Gold shop');

    buttons[0].focus();
    expect(focused).toEqual([0]);
    expect(buttons[0].getAttribute('aria-current')).toBe('true');
    expect(statusNode(root).textContent).toBe('Play again');
  });

  it('uses native button events for activation and arrow-key focus movement', () => {
    const doc = new TestDocument();
    const activated: string[] = [];
    const focused: number[] = [];
    const layer = createDomFocusLayer({
      id: 'button-events',
      label: 'Run complete',
      ownerDocument: doc as unknown as Document,
      initialFocusIndex: 0,
      onFocusIndexChange: (index) => focused.push(index),
      actions: [
        { id: 'again', label: 'Play again', onActivate: () => activated.push('again') },
        { id: 'disabled', label: 'Locked', disabled: true, onActivate: () => activated.push('disabled') },
        { id: 'croft', label: "Tae Gran's", onActivate: () => activated.push('croft') },
      ],
    });
    const root = layer.root as unknown as TestElement;
    const buttons = childButtons(root);

    const event = buttons[0].dispatch('keydown', new TestEvent('ArrowRight'));
    expect(event.defaultPrevented).toBe(true);
    expect(event.propagationStopped).toBe(true);
    expect(buttons[2].focusCalls).toBe(1);
    expect(focused).toEqual([2]);
    expect(statusNode(root).textContent).toBe("Tae Gran's");

    buttons[2].dispatch('click');
    buttons[1].dispatch('click');
    expect(activated).toEqual(['croft']);
  });

  it('removes the layer root on destroy', () => {
    const doc = new TestDocument();
    const layer = createDomFocusLayer({
      id: 'destroy-me',
      label: 'Run complete',
      ownerDocument: doc as unknown as Document,
      actions: [{ id: 'again', label: 'Play again', onActivate: () => undefined }],
    });

    expect(doc.body.children).toHaveLength(1);
    layer.destroy();
    expect(doc.body.children).toHaveLength(0);
  });
});
