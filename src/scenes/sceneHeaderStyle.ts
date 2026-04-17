/**
 * Shared text style factory for the big bold scene title ("The Herd
 * Chronicle", "Deeds", "Curse Picker"…). All three wear the same
 * coat: monospace, bold, thick black stroke. Only fontSize + colour
 * vary per scene, and those are fed as arguments.
 */

export interface SceneHeaderTextStyle {
  fontFamily: 'monospace';
  fontSize: string;
  color: string;
  fontStyle: 'bold';
  stroke: '#000';
  strokeThickness: 4;
}

export function sceneHeaderTextStyle(
  fontSize: string,
  color: string,
): SceneHeaderTextStyle {
  return {
    fontFamily: 'monospace',
    fontSize,
    color,
    fontStyle: 'bold',
    stroke: '#000',
    strokeThickness: 4,
  };
}

/**
 * Sibling style for the small italic mood / progress subtitle that
 * sits just under each scene title (Chronicle's mood line, Deeds'
 * "earned/total" line). Same font, italic, centred, word-wrapped to
 * `width - 60`.
 */
export interface SceneSubtitleTextStyle {
  fontFamily: 'monospace';
  fontSize: '13px';
  color: string;
  fontStyle: 'italic';
  align: 'center';
  wordWrap: { width: number };
}

export function sceneSubtitleTextStyle(
  color: string,
  sceneWidth: number,
): SceneSubtitleTextStyle {
  return {
    fontFamily: 'monospace',
    fontSize: '13px',
    color,
    fontStyle: 'italic',
    align: 'center',
    wordWrap: { width: sceneWidth - 60 },
  };
}
