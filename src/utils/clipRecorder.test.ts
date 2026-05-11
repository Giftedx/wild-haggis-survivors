import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClipRecorder } from './clipRecorder';

interface MockRecorder extends EventTarget {
  state: 'inactive' | 'recording' | 'paused';
  start(ms?: number): void;
  stop(): void;
  ondataavailable: ((e: { data: Blob }) => void) | null;
}

interface MockMediaStream {
  getVideoTracks(): MediaStreamTrack[];
  getAudioTracks(): MediaStreamTrack[];
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
    captureStream: vi.fn(() => makeMockMediaStream()),
  } as unknown as HTMLCanvasElement;
}

function makeMockMediaStream(hasAudio = false): MediaStream & MockMediaStream {
  return {
    getVideoTracks: () => [{ enabled: true } as unknown as MediaStreamTrack],
    getAudioTracks: () => (hasAudio ? [{ enabled: true } as unknown as MediaStreamTrack] : []),
  } as unknown as MediaStream & MockMediaStream;
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
  vi.stubGlobal('MediaStream', makeMockMediaStream as unknown as typeof MediaStream);
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

  it('falls back to mp4 when WebM is not supported', () => {
    const calls: string[] = [];
    const MR = function (this: MockRecorder, _stream: MediaStream) {
      return makeMockRecorder();
    } as unknown as typeof MediaRecorder & { isTypeSupported: (t: string) => boolean };
    MR.isTypeSupported = (t: string) => {
      calls.push(t);
      return t === 'video/mp4';
    };
    vi.stubGlobal('MediaRecorder', MR);

    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 2 });

    expect(rec.selectedMimeType()).toBe('video/mp4');
    expect(rec.selectedExtension()).toBe('mp4');
    expect(calls).toContain('video/webm;codecs=vp9');
    expect(calls).toContain('video/webm;codecs=vp8');
    expect(calls).toContain('video/webm');
    expect(calls).toContain('video/mp4');
  });
});

describe('ClipRecorder audio support', () => {
  beforeEach(() => {
    installMediaRecorderMock();
  });

  it('hasAudio returns false before start()', () => {
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { durationSec: 2 });
    expect(rec.hasAudio()).toBe(false);
  });

  it('hasAudio returns true when started with an audio stream', () => {
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { durationSec: 2 });
    const audioStream = makeMockMediaStream(true) as unknown as MediaStream;
    rec.start(audioStream);
    expect(rec.hasAudio()).toBe(true);
  });

  it('hasAudio returns false when started without audio stream', () => {
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { durationSec: 2 });
    rec.start();
    expect(rec.hasAudio()).toBe(false);
  });

  it('falls back to canvas-only stream when combined-stream recorder throws', () => {
    let calls = 0;
    const MR = function (this: MockRecorder, _stream: MediaStream) {
      calls++;
      if (calls === 1) {
        throw new Error('Safari multi-track not supported');
      }
      return makeMockRecorder();
    } as unknown as typeof MediaRecorder & { isTypeSupported: (t: string) => boolean };
    MR.isTypeSupported = (t: string) => t.includes('webm');
    vi.stubGlobal('MediaRecorder', MR);
    vi.stubGlobal('MediaStream', makeMockMediaStream as unknown as typeof MediaStream);

    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { durationSec: 2 });
    const audioStream = makeMockMediaStream(true) as unknown as MediaStream;
    rec.start(audioStream);

    expect(calls).toBe(2);
    expect(rec.hasAudio()).toBe(false);
  });
});

describe('ClipRecorder.snapshot (W82 highlight)', () => {
  beforeEach(() => {
    installMediaRecorderMock();
  });

  it('returns null when the buffer is empty', () => {
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { durationSec: 2 });
    rec.start();
    expect(rec.snapshot()).toBeNull();
  });

  it('returns a Blob of the current buffer without draining it', () => {
    const instances = installMediaRecorderMock();
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { durationSec: 2, timesliceMs: 500 });
    rec.start();
    const mr = instances[0]!;
    for (let i = 0; i < 3; i++) {
      mr.ondataavailable?.({ data: new Blob([`chunk-${i}`], { type: 'video/webm' }) });
    }

    const before = rec.bufferedChunkCount();
    const snap = rec.snapshot();
    expect(snap).toBeInstanceOf(Blob);
    expect(snap!.size).toBeGreaterThan(0);
    // Buffer is not drained — the recorder keeps rolling for future
    // highlights (a subsequent boss kill still gets its own snapshot).
    expect(rec.bufferedChunkCount()).toBe(before);
  });

  it('snapshot survives future rolling — chunks captured at snapshot time stay readable', async () => {
    const instances = installMediaRecorderMock();
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { durationSec: 2, timesliceMs: 500 });
    rec.start();
    const mr = instances[0]!;
    // Push 4 chunks (the full buffer capacity), snapshot, then push 4
    // more so the original chunks roll out of the live buffer.
    for (let i = 0; i < 4; i++) {
      mr.ondataavailable?.({ data: new Blob([`early-${i}`], { type: 'video/webm' }) });
    }
    const snap = rec.snapshot();
    expect(snap).not.toBeNull();
    const snapSize = snap!.size;

    for (let i = 0; i < 4; i++) {
      mr.ondataavailable?.({ data: new Blob([`late-${i}`], { type: 'video/webm' }) });
    }
    // The held snapshot still has its original payload — the Blob
    // copy is independent of any subsequent buffer mutation.
    expect(snap!.size).toBe(snapSize);

    // A fresh snapshot reflects the new buffer content (different
    // bytes, different size since the chunks differ).
    const freshSnap = rec.snapshot();
    expect(freshSnap).not.toBeNull();
    expect(freshSnap!.size).toBeGreaterThan(0);
  });

  it('snapshot Blob honours the chosen mime type (webm)', async () => {
    const instances = installMediaRecorderMock();
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { durationSec: 2 });
    rec.start();
    const mr = instances[0]!;
    mr.ondataavailable?.({ data: new Blob(['x'], { type: 'video/webm' }) });
    const snap = rec.snapshot();
    expect(snap!.type).toContain('webm');
  });
});
