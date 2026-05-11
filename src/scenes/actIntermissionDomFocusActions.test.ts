import { describe, expect, it, vi } from 'vitest';
import { buildActIntermissionDomFocusActions } from './actIntermissionDomFocusActions';
import { ROUTES_BY_SLOT } from '../data/routes';

describe('buildActIntermissionDomFocusActions', () => {
  it('emits one action per route with stable ids', () => {
    const routes = ROUTES_BY_SLOT.A;
    const actions = buildActIntermissionDomFocusActions({
      routes,
      onPickRoute: () => undefined,
    });
    expect(actions).toHaveLength(routes.length);
    for (let i = 0; i < routes.length; i++) {
      expect(actions[i]?.id).toBe(`act-intermission-${routes[i]!.key}`);
    }
  });

  it('routes onActivate to onPickRoute with the matching route', () => {
    const routes = ROUTES_BY_SLOT.A;
    const onPickRoute = vi.fn();
    const actions = buildActIntermissionDomFocusActions({ routes, onPickRoute });
    actions[0]?.onActivate();
    expect(onPickRoute).toHaveBeenCalledExactlyOnceWith(routes[0]);
  });

  it('labels resolve without raw routes. / ui.actIntermission key leaks', () => {
    const routes = ROUTES_BY_SLOT.B;
    const actions = buildActIntermissionDomFocusActions({
      routes,
      onPickRoute: () => undefined,
    });
    for (const a of actions) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.label.startsWith('routes.')).toBe(false);
      expect(a.label.startsWith('ui.actIntermission.')).toBe(false);
    }
  });
});
