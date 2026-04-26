import {
  firstEnabledModalFocusIndex,
  moveModalFocusIndex,
  type ModalFocusEntry,
} from './modalFocus';

export interface DomFocusAction extends ModalFocusEntry {
  readonly id: string;
  readonly label: string;
  readonly onActivate: () => void;
  readonly onFocus?: () => void;
}

export interface DomFocusLayerOptions {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly role?: 'group' | 'dialog';
  readonly actions: readonly DomFocusAction[];
  readonly initialFocusIndex?: number;
  readonly ownerDocument?: Document | null;
  readonly parent?: HTMLElement | null;
  readonly onFocusIndexChange?: (index: number, action: DomFocusAction) => void;
}

export interface DomFocusLayer {
  readonly root: HTMLElement | null;
  setActions(actions: readonly DomFocusAction[]): void;
  setFocusedIndex(index: number): void;
  setStatus(status: string): void;
  destroy(): void;
}

const VISUALLY_HIDDEN_STYLE = {
  position: 'fixed',
  width: '1px',
  height: '1px',
  margin: '-1px',
  border: '0',
  padding: '0',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
} as const;

function resolveOwnerDocument(doc: Document | null | undefined): Document | null {
  if (doc !== undefined) return doc;
  if (typeof document === 'undefined') return null;
  return document;
}

export function normalizeDomFocusIndex(
  actions: readonly ModalFocusEntry[],
  requestedIndex: number,
): number {
  if (actions.length === 0) return -1;
  if (
    requestedIndex >= 0
    && requestedIndex < actions.length
    && actions[requestedIndex]?.disabled !== true
  ) {
    return requestedIndex;
  }
  return firstEnabledModalFocusIndex(actions);
}

export function domFocusDirectionForKey(key: string): -1 | 1 | null {
  if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
  if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
  return null;
}

export function createDomFocusLayer(options: DomFocusLayerOptions): DomFocusLayer {
  const ownerDocument = resolveOwnerDocument(options.ownerDocument);
  const parent = options.parent ?? ownerDocument?.body ?? null;
  if (!ownerDocument || !parent) {
    return {
      root: null,
      setActions: () => undefined,
      setFocusedIndex: () => undefined,
      setStatus: () => undefined,
      destroy: () => undefined,
    };
  }

  const root = ownerDocument.createElement('div');
  root.id = options.id;
  root.setAttribute('data-whs-dom-focus-layer', options.id);
  root.setAttribute('role', options.role ?? 'group');
  root.setAttribute('aria-label', options.label);
  Object.assign(root.style, VISUALLY_HIDDEN_STYLE);

  const description = ownerDocument.createElement('p');
  description.id = `${options.id}-description`;
  description.textContent = options.description ?? '';

  const status = ownerDocument.createElement('p');
  status.id = `${options.id}-status`;
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');

  root.setAttribute(
    'aria-describedby',
    options.description
      ? `${description.id} ${status.id}`
      : status.id,
  );

  let actions = [...options.actions];
  let focusedIndex = normalizeDomFocusIndex(
    actions,
    options.initialFocusIndex ?? 0,
  );
  let buttons: HTMLButtonElement[] = [];
  let destroyed = false;

  const syncStatus = () => {
    const action = actions[focusedIndex];
    status.textContent = action && !action.disabled ? action.label : '';
  };

  const syncButtonState = () => {
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]!;
      const action = actions[i];
      const isDisabled = action?.disabled === true;
      button.disabled = isDisabled;
      button.tabIndex = isDisabled ? -1 : 0;
      button.setAttribute('aria-current', i === focusedIndex ? 'true' : 'false');
    }
    syncStatus();
  };

  const notifyFocus = (index: number) => {
    const action = actions[index];
    if (!action || action.disabled) return;
    action.onFocus?.();
    options.onFocusIndexChange?.(index, action);
  };

  const focusButtonAt = (index: number) => {
    if (destroyed) return;
    const next = normalizeDomFocusIndex(actions, index);
    if (next === -1) return;
    buttons[next]?.focus();
  };

  const focusRelative = (direction: -1 | 1) => {
    const next = moveModalFocusIndex(actions, focusedIndex, direction);
    focusButtonAt(next);
  };

  const renderActions = () => {
    buttons = [];
    root.replaceChildren(description, status);

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]!;
      const button = ownerDocument.createElement('button');
      button.type = 'button';
      button.textContent = action.label;
      button.setAttribute('aria-label', action.label);
      button.setAttribute('data-focus-id', action.id);

      button.addEventListener('focus', () => {
        focusedIndex = normalizeDomFocusIndex(actions, i);
        syncButtonState();
        notifyFocus(focusedIndex);
      });

      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const current = actions[i];
        if (!current || current.disabled) return;
        current.onActivate();
      });

      button.addEventListener('keydown', (event) => {
        const direction = domFocusDirectionForKey(event.key);
        if (direction !== null) {
          event.preventDefault();
          event.stopPropagation();
          focusRelative(direction);
          return;
        }
        if (event.key === 'Tab' || event.key === 'Enter' || event.key === ' ') {
          event.stopPropagation();
        }
      });

      buttons.push(button);
      root.appendChild(button);
    }

    focusedIndex = normalizeDomFocusIndex(actions, focusedIndex);
    syncButtonState();
  };

  renderActions();
  parent.appendChild(root);

  return {
    root,
    setActions(nextActions: readonly DomFocusAction[]): void {
      if (destroyed) return;
      actions = [...nextActions];
      focusedIndex = normalizeDomFocusIndex(actions, focusedIndex);
      renderActions();
    },
    setFocusedIndex(index: number): void {
      if (destroyed) return;
      focusedIndex = normalizeDomFocusIndex(actions, index);
      syncButtonState();
    },
    setStatus(nextStatus: string): void {
      if (destroyed) return;
      status.textContent = nextStatus;
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      buttons = [];
      actions = [];
      root.remove();
    },
  };
}
