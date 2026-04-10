/**
 * Conductor — reads game state, computes 4 mood axes, generates melody.
 *
 * Mood axes: intensity, danger, chaos, triumph.
 * Melody: constrained random walk with phrase contours over blended scales.
 */

export interface GameMusicState {
  hp: number;
  maxHp: number;
  gameTimeSec: number;
  enemyCount: number;
  comboCount: number;
  killCount: number;
  bossActive: boolean;
}

export interface MoodValues {
  intensity: number;
  danger: number;
  chaos: number;
  triumph: number;
}

const DORIAN = [
  220.0, 246.9, 261.6, 293.7, 329.6, 370.0, 392.0,
  440.0, 493.9, 523.3, 587.3, 659.3, 740.0, 784.0,
];
const AEOLIAN_6TH = 349.2;
const AEOLIAN_6TH_HI = 698.5;
const MIXO_3RD = 277.2;
const MIXO_3RD_HI = 554.4;

type Contour = 'ascending' | 'descending' | 'arch' | 'valley';

export class Conductor {
  intensity = 0;
  danger = 0;
  chaos = 0;
  triumph = 0;

  private killHistory: { time: number; count: number }[] = [];
  private lastRecordedKillCount = 0;

  private currentDegree = 0;
  private currentOctave = 0;
  private lastDirection = 1;
  private phraseNotesRemaining = 0;
  private phraseContour: Contour = 'arch';
  private phraseNoteIndex = 0;
  private phraseLength = 5;
  private inRest = false;

  private resolutionMode = false;

  updateMood(delta: number, state: GameMusicState): void {
    if (this.resolutionMode) return;

    const hpFrac = state.maxHp > 0 ? state.hp / state.maxHp : 1;

    const intensityTarget = Math.min(1,
      Math.min(1, state.gameTimeSec / 1200) * 0.7 +
      Math.min(1, state.enemyCount / 250) * 0.3
    );
    this.intensity = lerp(this.intensity, intensityTarget, delta * 0.001);

    if (hpFrac < 0.3) {
      const dangerTarget = (0.3 - hpFrac) / 0.3;
      this.danger = lerp(this.danger, dangerTarget, delta * 0.003);
    } else {
      this.danger = lerp(this.danger, 0, delta * 0.0008);
    }

    const chaosTarget = Math.min(1,
      Math.min(1, state.enemyCount / 300) * 0.6 +
      Math.min(1, state.comboCount / 20) * 0.4
    );
    this.chaos = lerp(this.chaos, chaosTarget, delta * 0.002);

    this.updateKillHistory(state.gameTimeSec, state.killCount);
    const killRate = this.getRecentKillRate();
    let triumphTarget = 0;
    if (state.comboCount > 8 && hpFrac > 0.5) {
      triumphTarget = Math.min(1, Math.max(0, (killRate - 3) / 10));
    }
    this.triumph = lerp(this.triumph, triumphTarget, delta * 0.002);
    this.triumph *= (1 - this.danger);
  }

  getMood(): MoodValues {
    return {
      intensity: this.intensity,
      danger: this.danger,
      chaos: this.chaos,
      triumph: this.triumph,
    };
  }

  nextNote(): { freq: number; velocity: number; intervalSec: number } | null {
    if (this.inRest) {
      this.inRest = false;
      this.startNewPhrase();
      if (Math.random() < 0.4) {
        this.currentDegree = 0;
      }
    }

    if (this.phraseNotesRemaining <= 0) {
      this.startNewPhrase();
    }

    if (this.resolutionMode) {
      if (this.currentDegree > 0) this.currentDegree--;
      else if (this.currentOctave > 0) { this.currentOctave = 0; this.currentDegree = 0; }
    } else {
      this.walkToNextDegree();
    }

    const freq = this.getFrequency(this.currentDegree, this.currentOctave);
    const velocity = this.computeVelocity();

    this.phraseNotesRemaining--;
    this.phraseNoteIndex++;

    // Note spacing: 2.2s at calm → 0.6s at peak intensity
    // The silence between notes IS the aesthetic — don't rush it
    let interval = 2.2 - this.intensity * 1.6;
    if (this.danger > 0.2) interval *= 1.0 + this.danger * 0.3;
    interval *= 0.8 + Math.random() * 0.4;

    if (this.phraseNotesRemaining <= 0 && !this.resolutionMode) {
      this.inRest = true;
      // Phrase rest: enough silence for the reverb tail to breathe
      interval += interval * 1.8;
    }

    return { freq, velocity, intervalSec: interval };
  }

  enterResolution(): void {
    this.resolutionMode = true;
    this.triumph = 1;
    this.danger = 0;
    this.chaos = 0;
    this.phraseNotesRemaining = this.currentDegree + this.currentOctave * 7 + 2;
    this.phraseNoteIndex = 0;
  }

  isResolutionComplete(): boolean {
    return this.resolutionMode
      && this.currentDegree === 0
      && this.currentOctave === 0
      && this.phraseNotesRemaining <= 0;
  }

  private startNewPhrase(): void {
    const r = Math.random();
    if (r < 0.30) this.phraseContour = 'ascending';
    else if (r < 0.55) this.phraseContour = 'descending';
    else if (r < 0.80) this.phraseContour = 'arch';
    else this.phraseContour = 'valley';

    this.phraseLength = 3 + Math.floor(Math.random() * 5);
    this.phraseNotesRemaining = this.phraseLength;
    this.phraseNoteIndex = 0;
  }

  private walkToNextDegree(): void {
    const progress = this.phraseLength > 1
      ? this.phraseNoteIndex / (this.phraseLength - 1)
      : 0.5;
    let dirBias = 0;
    switch (this.phraseContour) {
      case 'ascending': dirBias = 0.4; break;
      case 'descending': dirBias = -0.4; break;
      case 'arch': dirBias = progress < 0.5 ? 0.4 : -0.4; break;
      case 'valley': dirBias = progress < 0.5 ? -0.4 : 0.4; break;
    }

    dirBias -= this.danger * 0.2;
    dirBias += this.triumph * 0.15;

    const momentumBias = this.lastDirection * 0.1;
    const direction = (Math.random() < 0.5 + dirBias + momentumBias) ? 1 : -1;
    this.lastDirection = direction;

    const landingBoost = this.danger * 0.1 + (this.phraseNotesRemaining <= 1 ? 0.3 : 0);
    const r = Math.random();
    let step: number;
    if (r < 0.1 + landingBoost) {
      const stableDegrees = [0, 4];
      this.currentDegree = stableDegrees[Math.floor(Math.random() * stableDegrees.length)];
      return;
    } else if (r < 0.6) {
      step = 1;
    } else if (r < 0.85) {
      step = 2;
    } else {
      step = 3 + (this.triumph > 0.3 ? 1 : 0);
    }

    this.currentDegree += direction * step;

    if (this.currentDegree > 6) {
      if (this.currentOctave === 0) { this.currentOctave = 1; this.currentDegree -= 7; }
      else { this.currentDegree = 6; }
    } else if (this.currentDegree < 0) {
      if (this.currentOctave === 1) { this.currentOctave = 0; this.currentDegree += 7; }
      else { this.currentDegree = 0; }
    }

    const registerBias = -this.danger * 0.3 + this.triumph * 0.3;
    if (Math.random() < Math.abs(registerBias)) {
      this.currentOctave = registerBias > 0 ? 1 : 0;
    }
  }

  private getFrequency(degree: number, octave: number): number {
    const idx = octave * 7 + degree;
    const baseFreq = DORIAN[idx];

    if (degree === 5) {
      if (Math.random() < this.danger) {
        return octave === 0 ? AEOLIAN_6TH : AEOLIAN_6TH_HI;
      }
    }
    if (degree === 2) {
      if (Math.random() < this.triumph) {
        return octave === 0 ? MIXO_3RD : MIXO_3RD_HI;
      }
    }

    return baseFreq;
  }

  private computeVelocity(): number {
    // Gentle — like pressing keys softly. Audible but intimate.
    let vel = 0.25 + this.intensity * 0.15;
    if (this.danger > 0.2) vel *= 0.5 + (1 - this.danger) * 0.5;
    if (this.triumph > 0.2) vel *= 1.0 + this.triumph * 0.3;
    vel *= 0.85 + Math.random() * 0.3;
    return Math.min(0.8, Math.max(0.1, vel));
  }

  private updateKillHistory(gameTimeSec: number, killCount: number): void {
    // Only record when killCount changes to avoid 60fps array bloat
    if (killCount !== this.lastRecordedKillCount) {
      this.lastRecordedKillCount = killCount;
      this.killHistory.push({ time: gameTimeSec, count: killCount });
    }
    while (this.killHistory.length > 0 && this.killHistory[0].time < gameTimeSec - 10) {
      this.killHistory.shift();
    }
  }

  private getRecentKillRate(): number {
    if (this.killHistory.length < 2) return 0;
    const oldest = this.killHistory[0];
    const newest = this.killHistory[this.killHistory.length - 1];
    const timeDiff = newest.time - oldest.time;
    if (timeDiff < 1) return 0;
    return (newest.count - oldest.count) / timeDiff;
  }
}

function lerp(current: number, target: number, t: number): number {
  return current + (target - current) * Math.min(1, t);
}
