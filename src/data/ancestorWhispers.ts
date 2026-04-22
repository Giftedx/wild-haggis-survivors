export const WHISPER_KEYS: readonly string[] = [
  'ancestor.whisper.0',
  'ancestor.whisper.1',
  'ancestor.whisper.2',
  'ancestor.whisper.3',
  'ancestor.whisper.4',
  'ancestor.whisper.5',
  'ancestor.whisper.6',
  'ancestor.whisper.7',
  'ancestor.whisper.8',
  'ancestor.whisper.9',
  'ancestor.whisper.10',
  'ancestor.whisper.11',
  'ancestor.whisper.12',
  'ancestor.whisper.13',
  'ancestor.whisper.14',
] as const;

export interface AncestorHistoryLike {
  name: string;
  seed: string;
}

export interface AncestorPickInput {
  runHistory: readonly AncestorHistoryLike[];
  rngSample: number;
}

export interface AncestorPick {
  name: string;
  whisperKey: string;
}

const RECENT_WEIGHT = 2;
const RECENT_COUNT = 3;

export function pickAncestor(input: AncestorPickInput): AncestorPick | null {
  const hist = input.runHistory;
  if (hist.length === 0) return null;

  const weights: number[] = hist.map((_, i) =>
    i >= Math.max(0, hist.length - RECENT_COUNT) ? RECENT_WEIGHT : 1,
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const sample1 = input.rngSample;
  let acc = 0;
  let chosen = 0;
  const target = sample1 * totalWeight;
  for (let i = 0; i < hist.length; i++) {
    acc += weights[i]!;
    if (target < acc) {
      chosen = i;
      break;
    }
  }

  const sample2 = (input.rngSample * 31 + chosen * 17) % 1;
  const key =
    WHISPER_KEYS[Math.floor(Math.abs(sample2) * WHISPER_KEYS.length)]!;

  return { name: hist[chosen]!.name, whisperKey: key };
}
