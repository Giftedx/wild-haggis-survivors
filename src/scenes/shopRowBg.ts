/**
 * Pure alternating-row background colour picker, shared by Shop and
 * MetaShop. The darker tone on odd rows gives a subtle zebra
 * striping that helps the eye track horizontally without shouting.
 */

export const SHOP_ROW_BG_EVEN = 0x1a1828;
export const SHOP_ROW_BG_ODD = 0x161422;

export function resolveShopRowBgColor(rowIndex: number): number {
  return rowIndex % 2 === 0 ? SHOP_ROW_BG_EVEN : SHOP_ROW_BG_ODD;
}
