import { describe, it, expect } from 'vitest';
import { resolveShopRowBgColor, SHOP_ROW_BG_EVEN, SHOP_ROW_BG_ODD } from './shopRowBg';

describe('resolveShopRowBgColor — alternating zebra stripe', () => {
  it('even rows (0, 2, 4) use the slightly lighter tone', () => {
    expect(resolveShopRowBgColor(0)).toBe(SHOP_ROW_BG_EVEN);
    expect(resolveShopRowBgColor(2)).toBe(SHOP_ROW_BG_EVEN);
    expect(resolveShopRowBgColor(10)).toBe(SHOP_ROW_BG_EVEN);
  });

  it('odd rows (1, 3, 5) use the slightly darker tone', () => {
    expect(resolveShopRowBgColor(1)).toBe(SHOP_ROW_BG_ODD);
    expect(resolveShopRowBgColor(3)).toBe(SHOP_ROW_BG_ODD);
    expect(resolveShopRowBgColor(7)).toBe(SHOP_ROW_BG_ODD);
  });

  it('even and odd colours are distinct', () => {
    expect(SHOP_ROW_BG_EVEN).not.toBe(SHOP_ROW_BG_ODD);
  });
});
