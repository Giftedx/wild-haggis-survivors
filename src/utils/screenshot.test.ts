import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveScreenshot } from './screenshot';

describe('saveScreenshot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves true and triggers a download when toBlob succeeds', async () => {
    const blob = new Blob(['fake-png-bytes'], { type: 'image/png' });
    const canvas = {
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(blob)),
    } as unknown as HTMLCanvasElement;

    const click = vi.fn();
    const anchor = { href: '', download: '', click, style: {} } as unknown as HTMLAnchorElement;
    const mockDocument = {
      createElement: vi.fn(() => anchor),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };
    vi.stubGlobal('document', mockDocument);

    const createObjectURL = vi.fn(() => 'blob:fake');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    const ok = await saveScreenshot(canvas, 'my-run.png');

    expect(ok).toBe(true);
    expect(canvas.toBlob).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe('my-run.png');
    expect(anchor.href).toBe('blob:fake');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it('resolves false when toBlob returns null', async () => {
    const canvas = {
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(null)),
    } as unknown as HTMLCanvasElement;

    const ok = await saveScreenshot(canvas, 'my-run.png');

    expect(ok).toBe(false);
  });
});
