/**
 * W27 Phase 2b — rolling WebM clip recorder.
 *
 * Always recording the last `durationSec` of canvas output into a fixed
 * ring buffer. `saveLast()` concatenates current buffer into a Blob and
 * triggers a download. Lightweight — buffer is ~3–6 MB resident, same
 * order as one Phaser texture atlas.
 */
export interface ClipRecorderOptions {
  fps?: number;
  durationSec?: number;
  timesliceMs?: number;
}

export type ClipExtension = 'webm' | 'mp4';

interface CodecOption {
  readonly mimeType: string;
  readonly extension: ClipExtension;
}

const CODEC_PRIORITY: readonly CodecOption[] = [
  { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
  { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
  { mimeType: 'video/webm', extension: 'webm' },
  // Safari 17+ exposes MediaRecorder with MP4 support rather than WebM.
  // Prefer WebM when present (Chromium/Firefox), but don't make Safari
  // look unsupported if it can record a playable MP4 container.
  { mimeType: 'video/mp4', extension: 'mp4' },
] as const;

export class ClipRecorder {
  private canvas: HTMLCanvasElement;
  private fps: number;
  private durationSec: number;
  private timesliceMs: number;
  private capacity: number;
  private buffer: Blob[] = [];
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private mimeType: string | null = null;
  private extension: ClipExtension | null = null;
  private running = false;
  private audioAttached = false;

  constructor(canvas: HTMLCanvasElement, opts: ClipRecorderOptions = {}) {
    this.canvas = canvas;
    this.fps = opts.fps ?? 30;
    this.durationSec = opts.durationSec ?? 15;
    this.timesliceMs = opts.timesliceMs ?? 500;
    this.capacity = Math.max(
      1,
      Math.ceil((this.durationSec * 1000) / this.timesliceMs),
    );
    const codec = this.pickCodec();
    this.mimeType = codec?.mimeType ?? null;
    this.extension = codec?.extension ?? null;
  }

  selectedMimeType(): string | null {
    return this.mimeType;
  }

  selectedExtension(): ClipExtension {
    return this.extension ?? 'webm';
  }

  isAvailable(): boolean {
    const hasMR = typeof (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder !== 'undefined';
    const hasStream = typeof (this.canvas as unknown as { captureStream?: unknown }).captureStream === 'function';
    return hasMR && hasStream && this.mimeType !== null;
  }

  start(audioStream?: MediaStream): void {
    if (this.running || !this.isAvailable() || !this.mimeType) return;
    try {
      const videoStream = (this.canvas as unknown as {
        captureStream: (fps?: number) => MediaStream;
      }).captureStream(this.fps);
      this.stream = videoStream;

      const streamWithAudio = audioStream
        ? new MediaStream([
            ...videoStream.getVideoTracks(),
            ...audioStream.getAudioTracks(),
          ])
        : videoStream;

      try {
        const recorder = new MediaRecorder(streamWithAudio, { mimeType: this.mimeType });
        this.recorder = recorder;
        this.audioAttached = audioStream != null && audioStream.getAudioTracks().length > 0;
        this.wireRecorder(recorder);
        recorder.start(this.timesliceMs);
        this.running = true;
        return;
      } catch {
        // Safari multi-track fallback — retry with canvas-only stream.
        if (audioStream) {
          const recorder = new MediaRecorder(videoStream, { mimeType: this.mimeType });
          this.recorder = recorder;
          this.audioAttached = false;
          this.wireRecorder(recorder);
          recorder.start(this.timesliceMs);
          this.running = true;
          return;
        }
        throw new Error('MediaRecorder construct failed');
      }
    } catch {
      this.running = false;
    }
  }

  hasAudio(): boolean {
    return this.audioAttached && this.running;
  }

  private wireRecorder(recorder: MediaRecorder): void {
    recorder.ondataavailable = (e: BlobEvent) => {
      if (!e.data || e.data.size === 0) return;
      this.buffer.push(e.data);
      if (this.buffer.length > this.capacity) {
        this.buffer.splice(0, this.buffer.length - this.capacity);
      }
    };
  }

  stop(): void {
    if (!this.running) return;
    try {
      this.recorder?.stop();
    } catch { /* already stopped */ }
    this.recorder = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.running = false;
    this.audioAttached = false;
    this.buffer = [];
  }

  bufferedChunkCount(): number {
    return this.buffer.length;
  }

  async saveLast(triggerDownload: (blob: Blob) => void): Promise<Blob | null> {
    if (this.buffer.length === 0) return null;
    const blob = new Blob(this.buffer, { type: this.mimeType ?? 'video/webm' });
    triggerDownload(blob);
    return blob;
  }

  /**
   * W82 highlight — non-destructive snapshot of the current buffer.
   *
   * Returns a `Blob` of the chunks currently in the rolling window, or
   * `null` if the recorder hasn't accumulated anything yet. The
   * underlying buffer is **not** drained, so the recorder keeps
   * rolling for future highlights (a subsequent boss kill still gets
   * its own clean snapshot of the moment that follows).
   *
   * Chunks captured at snapshot time stay readable even after the
   * live buffer rolls past them — the returned `Blob` holds its own
   * references, independent of any later `splice` on `this.buffer`.
   * Inherits the same multi-chunk WebM/MP4 layout assumption as
   * `saveLast()`: the first chunk in the buffer carries the
   * container header, so a snapshot taken before the rolling window
   * has overwritten that chunk produces a playable file.
   */
  snapshot(): Blob | null {
    if (this.buffer.length === 0) return null;
    return new Blob(this.buffer, { type: this.mimeType ?? 'video/webm' });
  }

  private pickCodec(): CodecOption | null {
    const MR = (globalThis as unknown as { MediaRecorder?: { isTypeSupported: (t: string) => boolean } }).MediaRecorder;
    if (!MR) return null;
    for (const codec of CODEC_PRIORITY) {
      if (MR.isTypeSupported(codec.mimeType)) return codec;
    }
    return null;
  }
}
