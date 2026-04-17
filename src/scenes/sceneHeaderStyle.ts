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
