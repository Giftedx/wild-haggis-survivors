import { describe, expect, it, vi } from 'vitest';
import { buildGameOverDomFocusActions } from './gameOverDomFocusActions';

describe('buildGameOverDomFocusActions', () => {
  it('emits exactly three actions — play again, gold shop, tae gran', () => {
    const actions = buildGameOverDomFocusActions({
      onPlayAgain: () => undefined,
      onGoldShop: () => undefined,
      onTaeGran: () => undefined,
    });
    expect(actions).toHaveLength(3);
  });

  it('orders actions left-to-right matching the visible Phaser button row', () => {
    const actions = buildGameOverDomFocusActions({
      onPlayAgain: () => undefined,
      onGoldShop: () => undefined,
      onTaeGran: () => undefined,
    });
    expect(actions[0]?.id).toBe('gameover-play-again');
    expect(actions[1]?.id).toBe('gameover-gold-shop');
    expect(actions[2]?.id).toBe('gameover-tae-gran');
  });

  it('routes the play-again action to onPlayAgain', () => {
    const onPlayAgain = vi.fn();
    const actions = buildGameOverDomFocusActions({
      onPlayAgain,
      onGoldShop: () => undefined,
      onTaeGran: () => undefined,
    });
    actions[0]!.onActivate();
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });

  it('routes the gold-shop action to onGoldShop', () => {
    const onGoldShop = vi.fn();
    const actions = buildGameOverDomFocusActions({
      onPlayAgain: () => undefined,
      onGoldShop,
      onTaeGran: () => undefined,
    });
    actions[1]!.onActivate();
    expect(onGoldShop).toHaveBeenCalledOnce();
  });

  it('marks the gold-shop action disabled and mirrors the locked visible label when shop access is unavailable', () => {
    const onGoldShop = vi.fn();
    const actions = buildGameOverDomFocusActions({
      onPlayAgain: () => undefined,
      onGoldShop,
      shopLocked: true,
      onTaeGran: () => undefined,
    });

    expect(actions[1]?.id).toBe('gameover-gold-shop');
    expect(actions[1]?.label).toBe('NAE SHOP');
    expect(actions[1]?.disabled).toBe(true);
    expect(actions[1]?.label.startsWith('ui.gameOver')).toBe(false);
  });

  it('routes the tae-gran action to onTaeGran', () => {
    const onTaeGran = vi.fn();
    const actions = buildGameOverDomFocusActions({
      onPlayAgain: () => undefined,
      onGoldShop: () => undefined,
      onTaeGran,
    });
    actions[2]!.onActivate();
    expect(onTaeGran).toHaveBeenCalledOnce();
  });

  it('emits non-empty resolved labels — keys must not leak through to assistive tech', () => {
    const actions = buildGameOverDomFocusActions({
      onPlayAgain: () => undefined,
      onGoldShop: () => undefined,
      onTaeGran: () => undefined,
    });
    for (const action of actions) {
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.label.startsWith('ui.gameOver')).toBe(false);
    }
  });

  it('actions are independent — activating one does not invoke the others', () => {
    const onPlayAgain = vi.fn();
    const onGoldShop = vi.fn();
    const onTaeGran = vi.fn();
    const actions = buildGameOverDomFocusActions({
      onPlayAgain,
      onGoldShop,
      onTaeGran,
    });
    actions[1]!.onActivate();
    expect(onPlayAgain).not.toHaveBeenCalled();
    expect(onGoldShop).toHaveBeenCalledOnce();
    expect(onTaeGran).not.toHaveBeenCalled();
  });

  it('keeps play-again and tae-gran enabled when the shop is locked', () => {
    const actions = buildGameOverDomFocusActions({
      onPlayAgain: () => undefined,
      onGoldShop: () => undefined,
      shopLocked: true,
      onTaeGran: () => undefined,
    });

    expect(actions.map((action) => action.disabled === true)).toEqual([false, true, false]);
  });
});
