/**
 * A1 M4 — format a caption event for the strip.
 *
 * The existing caption API (`GameScene.caption(id, message, tint)`)
 * takes a pre-formatted string. For non-speech events — music cues,
 * ambient SFX, directional warnings — consumers tend to want the same
 * decoration rules (square-bracket bracket tag for non-speech, an
 * arrow prefix when the event has a direction). This helper centralises
 * those rules so every system emits the same shape.
 *
 * Spoken / narrative captions (banter, boss taunts) stay as plain
 * strings — formatting those would be patronising.
 */

export type CaptionDirection = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';

export interface SfxCaptionEvent {
  type: 'sfx';
  /** Short human label ("pibroch swell", "bodhrán drop"). */
  label: string;
  /** Optional compass direction if the event has a spatial source. */
  direction?: CaptionDirection;
}

export interface MusicCaptionEvent {
  type: 'music';
  /** Short human label ("pibroch swell", "fiddle joins"). */
  label: string;
}

export interface SpeechCaptionEvent {
  type: 'speech';
  /** Speaker name prefixed as "Speaker: text". */
  speaker?: string;
  text: string;
}

export type CaptionEvent = SfxCaptionEvent | MusicCaptionEvent | SpeechCaptionEvent;

const ARROWS: Record<CaptionDirection, string> = {
  N: '↑',
  S: '↓',
  E: '→',
  W: '←',
  NE: '↗',
  NW: '↖',
  SE: '↘',
  SW: '↙',
};

export function formatCaption(event: CaptionEvent): string {
  switch (event.type) {
    case 'sfx': {
      const label = event.label.trim();
      const arrow = event.direction ? `${ARROWS[event.direction]} ` : '';
      return `[${arrow}${label}]`;
    }
    case 'music':
      return `♪ ${event.label.trim()}`;
    case 'speech':
      return event.speaker ? `${event.speaker}: ${event.text}` : event.text;
  }
}
