import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClipRecorder } from './clipRecorder';

interface MockRecorder extends EventTarget {
  state: 'inactive' | 'recording' | 'paused';
  start(ms?: number): void;
  stop(): void;
  ondataavailable: ((e: { data: Blob }) => void) | null;
}

function makeMockRecorder(): MockRecorder {
  const target = new EventTarget() as MockRecorder;
  target.state = 'inactive';
  target.ondataavailable = null;
  target.start = function (_ms?: number) {
    this.state = 'recording';
  };
  target.stop = function () {
    this.state = 'inactive';
  };
  return target;
}

function makeMockCanvas(): HTMLCanvasElement {
  return {
    captureStream: vi.fn(() => ({} as MediaStream)),
  } as unknown as HTMLCanvasElement;
}

function installMediaRecorderMock(): MockRecorder[] {
  const instances: MockRecorder[] = [];
  const MR = function (this: MockRecorder, _stream: MediaStream) {
    const r = makeMockRecorder();
    instances.push(r);
    return r;
  } as unknown as typeof MediaRecorder & { isTypeSupported: (t: string) => boolean };
  MR.isTypeSupported = (t: string) => t.includes('webm');
  vi.stubGlobal('MediaRecorder', MR);
  return instances;
}

describe('ClipRecorder', () => {
  beforeEach(() => {
    installMediaRecorderMock();
  });

  it('isAvailable true when MediaRecorder and captureStream both exist', () => {
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 15 });
    expect(rec.isAvailable()).toBe(true);
  });

  it('isAvailable false when MediaRecorder is missing', () => {
    vi.stubGlobal('MediaRecorder', undefined);
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 15 });
    expect(rec.isAvailable()).toBe(false);
  });

  it('ring buffer drops oldest chunks past the duration window', async () => {
    const instances = installMediaRecorderMock();
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 2, timesliceMs: 500 });
    rec.start();
    const mr = instances[0]!;
    // Capacity = durationSec * 1000 / timesliceMs = 4. Push 8 — expect only last 4 retained.
    for (let i = 0; i < 8; i++) {
      mr.ondataavailable?.({ data: new Blob([`chunk-${i}`], { type: 'video/webm' }) });
    }
    const blob = await rec.saveLast(() => {});
    expect(blob).not.toBeNull();
    expect(rec.bufferedChunkCount()).toBe(4);
  });

  it('saveLast returns null when buffer is empty', async () => {
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 2, timesliceMs: 500 });
    rec.start();
    const blob = await rec.saveLast(() => {});
    expect(blob).toBeNull();
  });

  it('codec fallback tries vp9 → vp8 → plain webm', () => {
    const calls: string[] = [];
    const MR = function (this: MockRecorder, _stream: MediaStream) {
      const r = makeMockRecorder();
      return r;
    } as unknown as typeof MediaRecorder & { isTypeSupported: (t: string) => boolean };
    MR.isTypeSupported = (t: string) => {
      calls.push(t);
      return t === 'video/webm';
    };
    vi.stubGlobal('MediaRecorder', MR);
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 2 });
    expect(rec.selectedMimeType()).toBe('video/webm');
    expect(calls).toContain('video/webm;codecs=vp9');
    expect(calls).toContain('video/webm;codecs=vp8');
    expect(calls).toContain('video/webm');
  });
});
