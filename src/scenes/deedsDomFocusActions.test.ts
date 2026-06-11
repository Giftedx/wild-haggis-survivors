import { describe, expect, it, vi } from 'vitest';
import { buildDeedsDomFocusActions } from './deedsDomFocusActions';
import type { DeedProgress } from '../ui/deedsProgress';

const sampleDeed = (id: DeedProgress['id'], status: DeedProgress['status']): DeedProgress => ({
  id,
  status,
  isBinary: false,
  current: 3,
  target: 10,
  ratio: 0.3,
});

describe('buildDeedsDomFocusActions', () => {
  it('lists visible deed cards then prev, next, back when page nav is visible', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onBack = vi.fn();
    const visible: DeedProgress[] = [sampleDeed('ach_kills_1000', 'in_progress')];
    const actions = buildDeedsDomFocusActions({
      visibleDeeds: visible,
      pageNavVisible: true,
      hasPrevPage: false,
      hasNextPage: true,
      onPrevPage: onPrev,
      onNextPage: onNext,
      onBack,
    });
    expect(actions.length).toBe(4);
    expect(actions[0]?.id).toBe('deed-ach_kills_1000');
    expect(actions[1]?.id).toBe('deeds-page-prev');
    expect(actions[2]?.id).toBe('deeds-page-next');
    expect(actions[3]?.id).toBe('deeds-back');
    expect(actions[1]?.disabled).toBe(true);
    expect(actions[2]?.disabled).not.toBe(true);
    actions[2]?.onActivate();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('omits prev/next when single-page catalogue', () => {
    const actions = buildDeedsDomFocusActions({
      visibleDeeds: [sampleDeed('ach_first_victory', 'locked')],
      pageNavVisible: false,
      hasPrevPage: false,
      hasNextPage: false,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    expect(actions.find((a) => a.id === 'deeds-page-prev')).toBeUndefined();
    expect(actions.find((a) => a.id === 'deeds-page-next')).toBeUndefined();
    expect(actions[actions.length - 1]?.id).toBe('deeds-back');
  });

  it('emits non-empty labels without raw i18n key leaks', () => {
    const actions = buildDeedsDomFocusActions({
      visibleDeeds: [sampleDeed('ach_survive_5m', 'unlocked')],
      pageNavVisible: true,
      hasPrevPage: true,
      hasNextPage: true,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    for (const action of actions) {
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.label.startsWith('achievement.')).toBe(false);
      expect(action.label.startsWith('ui.deeds.status_')).toBe(false);
      expect(action.label.startsWith('ui.')).toBe(false);
    }
  });
});
