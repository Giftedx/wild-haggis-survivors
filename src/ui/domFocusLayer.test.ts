import { describe, expect, it } from 'vitest';
import {
  createDomFocusLayer,
  domFocusDirectionForKey,
  normalizeDomFocusIndex,
  wrapLabeledDomFocusActions,
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
  ownerDoc: TestDocument | null = null;

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
    if (this.ownerDoc) this.ownerDoc.activeElement = this;
    this.dispatch('focus');
  }
}

class TestDocument {
  readonly body: TestElement;
  activeElement: TestElement | null = null;

  constructor() {
    this.body = new TestElement('body');
    this.body.ownerDoc = this;
  }

  createElement(tagName: string): TestElement {
    const el = new TestElement(tagName);
    el.ownerDoc = this;
    return el;
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

  it('restores DOM focus to matching action.id across setActions rebuild', () => {
    const doc = new TestDocument();
    const layer = createDomFocusLayer({
      id: 'focus-restore',
      label: 'Sporran picker',
      ownerDocument: doc as unknown as Document,
      actions: [
        { id: 'card_a', label: 'Card A', onActivate: () => undefined },
        { id: 'card_b', label: 'Card B', onActivate: () => undefined },
        { id: 'confirm', label: 'Confirm', disabled: true, onActivate: () => undefined },
      ],
    });
    const root = layer.root as unknown as TestElement;
    const before = childButtons(root);

    before[1].focus();
    expect(doc.activeElement).toBe(before[1]);

    layer.setActions([
      { id: 'card_a', label: 'KEEP Card A', onActivate: () => undefined },
      { id: 'card_b', label: 'KEEP Card B', onActivate: () => undefined },
      { id: 'confirm', label: 'Confirm picks', onActivate: () => undefined },
    ]);

    const after = childButtons(root);
    expect(after).not.toBe(before);
    expect(after[1].textContent).toBe('KEEP Card B');
    expect(doc.activeElement).toBe(after[1]);
    expect(after[1].focusCalls).toBe(1);
    expect(after[1].getAttribute('aria-current')).toBe('true');
  });

  it('falls back to first enabled when previously focused action is now disabled', () => {
    const doc = new TestDocument();
    const layer = createDomFocusLayer({
      id: 'focus-disable-fallback',
      label: 'Sporran picker',
      ownerDocument: doc as unknown as Document,
      actions: [
        { id: 'card_a', label: 'Card A', onActivate: () => undefined },
        { id: 'card_b', label: 'Card B', onActivate: () => undefined },
        { id: 'card_c', label: 'Card C', onActivate: () => undefined },
      ],
    });
    const root = layer.root as unknown as TestElement;
    const before = childButtons(root);
    before[2].focus();
    expect(doc.activeElement).toBe(before[2]);

    layer.setActions([
      { id: 'card_a', label: 'Card A', onActivate: () => undefined },
      { id: 'card_b', label: 'Card B', onActivate: () => undefined },
      { id: 'card_c', label: 'Card C', disabled: true, onActivate: () => undefined },
    ]);

    const after = childButtons(root);
    expect(doc.activeElement).not.toBe(after[2]);
    expect(after[2].focusCalls).toBe(0);
  });

  it('falls back when previously focused action is removed entirely', () => {
    const doc = new TestDocument();
    const layer = createDomFocusLayer({
      id: 'focus-removed-fallback',
      label: 'Sporran picker',
      ownerDocument: doc as unknown as Document,
      actions: [
        { id: 'card_a', label: 'Card A', onActivate: () => undefined },
        { id: 'card_b', label: 'Card B', onActivate: () => undefined },
      ],
    });
    const root = layer.root as unknown as TestElement;
    const before = childButtons(root);
    before[1].focus();
    expect(doc.activeElement).toBe(before[1]);

    layer.setActions([
      { id: 'card_a', label: 'Card A', onActivate: () => undefined },
    ]);

    const after = childButtons(root);
    expect(after.length).toBe(1);
    expect(after[0].focusCalls).toBe(0);
  });

  it('does not steal focus from outside the layer on setActions', () => {
    const doc = new TestDocument();
    const layer = createDomFocusLayer({
      id: 'focus-no-steal',
      label: 'Sporran picker',
      ownerDocument: doc as unknown as Document,
      actions: [
        { id: 'card_a', label: 'Card A', onActivate: () => undefined },
      ],
    });
    const root = layer.root as unknown as TestElement;

    const outsideButton = doc.createElement('button');
    outsideButton.setAttribute('data-focus-id', 'card_a');
    doc.body.appendChild(outsideButton);
    outsideButton.focus();
    expect(doc.activeElement).toBe(outsideButton);

    layer.setActions([
      { id: 'card_a', label: 'Card A renamed', onActivate: () => undefined },
    ]);

    const after = childButtons(root);
    expect(doc.activeElement).toBe(outsideButton);
    expect(after[0].focusCalls).toBe(0);
  });

  it('reorders focus follow-through when actions list reorders', () => {
    const doc = new TestDocument();
    const layer = createDomFocusLayer({
      id: 'focus-reorder',
      label: 'Sporran picker',
      ownerDocument: doc as unknown as Document,
      actions: [
        { id: 'card_a', label: 'Card A', onActivate: () => undefined },
        { id: 'card_b', label: 'Card B', onActivate: () => undefined },
        { id: 'card_c', label: 'Card C', onActivate: () => undefined },
      ],
    });
    const root = layer.root as unknown as TestElement;
    const before = childButtons(root);
    before[0].focus();

    layer.setActions([
      { id: 'card_c', label: 'Card C', onActivate: () => undefined },
      { id: 'card_a', label: 'Card A', onActivate: () => undefined },
      { id: 'card_b', label: 'Card B', onActivate: () => undefined },
    ]);

    const after = childButtons(root);
    expect(doc.activeElement).toBe(after[1]);
    expect(after[1].getAttribute('data-focus-id')).toBe('card_a');
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

  it('wrapLabeledDomFocusActions maps rows to DomFocusAction shape', () => {
    let calls = 0;
    const wrapped = wrapLabeledDomFocusActions([
      { id: 'row-a', label: 'Row A', onActivate: () => { calls += 1; } },
    ]);
    expect(wrapped).toHaveLength(1);
    expect(wrapped[0].id).toBe('row-a');
    expect(wrapped[0].label).toBe('Row A');
    wrapped[0].onActivate();
    expect(calls).toBe(1);
  });
});
