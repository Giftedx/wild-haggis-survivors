import { describe, expect, it } from 'vitest';
import { buildCategoryOrder } from './spriteExportCategoryOrder';

describe('buildCategoryOrder', () => {
  it('appends unlisted haggis and accessory categories in alphabetical order', () => {
    const cats = new Set([
      'Other',
      'Haggis Frames — tufted',
      'Haggis Frames — classic',
      'Haggis Frames — cailleach',
      'Accessory Frames — z_new',
      'Accessory Frames — kilt',
      'Accessory Frames — a_new',
      'Atlas Frames — Other',
    ]);

    expect(buildCategoryOrder(cats)).toEqual([
      'Other',
      'Haggis Frames — classic',
      'Haggis Frames — cailleach',
      'Haggis Frames — tufted',
      'Accessory Frames — kilt',
      'Accessory Frames — a_new',
      'Accessory Frames — z_new',
      'Atlas Frames — Other',
    ]);
  });
});
