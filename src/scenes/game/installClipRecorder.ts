/**
 * installClipRecorder — Phase 5 Bucket 14 of the GameScene regrowth
 * audit. Pulls the 13-line capture-enabled bootstrap out of `create()`.
 *
 * The recorder is gated on the user setting (`captureEnabled`). When
 * the canvas isn't available (test fixtures) or `MediaRecorder` is
 * unsupported (older browsers), the recorder is left null so caller
 * sites that null-check it (`clipRecorder?.flush(...)`) silently no-op.
 *
 * Returns the constructed recorder OR null. Caller assigns the result
 * to its own field so `installRunEndShutdown` can dispose the audio
 * stream + recorder on scene teardown.
 */
import { ClipRecorder } from '@/utils/clipRecorder';
import { createRecordingAudioStream } from '@/systems/audioContext';

export interface InstallClipRecorderInputs {
  enabled: boolean;
  canvas: HTMLCanvasElement | null;
  fps?: number;
  durationSec?: number;
}

export function installClipRecorder(
  inputs: InstallClipRecorderInputs,
): ClipRecorder | null {
  if (!inputs.enabled) return null;
  const canvas = inputs.canvas;
  if (!canvas) return null;

  const recorder = new ClipRecorder(canvas, {
    fps: inputs.fps ?? 30,
    durationSec: inputs.durationSec ?? 15,
  });
  if (!recorder.isAvailable()) return null;

  const audioStream = createRecordingAudioStream();
  recorder.start(audioStream ?? undefined);
  return recorder;
}
