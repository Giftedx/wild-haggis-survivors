/**
 * Shared text style factory for the big bold scene title ("The Herd
 * Chronicle", "Deeds", "Curse Picker"...). Delegates to the
 * typography scale system so all scene headers share a single source
 * of truth for font family, weight, and stroke.
 */
import { textStyle, type GameTextStyle } from '../ui/typography';

export type SceneHeaderTextStyle = GameTextStyle;
export type SceneSubtitleTextStyle = GameTextStyle;

export function sceneHeaderTextStyle(
  color: string,
): SceneHeaderTextStyle {
  return textStyle('title', { color });
}

/**
 * Sibling style for the small italic mood / progress subtitle that
 * sits just under each scene title (Chronicle's mood line, Deeds'
 * "earned/total" line). Same font, italic, centred, word-wrapped to
 * `width - 60`.
 */
export function sceneSubtitleTextStyle(
  color: string,
  sceneWidth: number,
): SceneSubtitleTextStyle {
  return textStyle('subtitle', { color, align: 'center', wordWrap: { width: sceneWidth - 60 } });
}
