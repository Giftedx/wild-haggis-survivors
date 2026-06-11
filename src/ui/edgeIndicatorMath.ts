/**
 * Pure geometry for EdgeIndicators — unit-tested without a Phaser scene.
 */

export interface OffScreenScratch {
  x: number;
  y: number;
  dist: number;
  boss: boolean;
  elite: boolean;
  /** Used when `elite` — affix hue or default elite gold (EDGE_INDICATOR_BOSS_COLOR). */
  eliteDisplayTint: number;
}

/** Inclusive camera bounds (Phaser world space). */
export function isOnCameraViewport(
  ex: number,
  ey: number,
  camLeft: number,
  camRight: number,
  camTop: number,
  camBottom: number,
): boolean {
  return ex >= camLeft && ex <= camRight && ey >= camTop && ey <= camBottom;
}

/**
 * Maps a world direction angle (radians, atan2(dy, dx) from player to threat)
 * to a point on the inner screen rectangle (before UI scale), in the same
 * coordinate space EdgeIndicators uses for `setPosition` (origin at center).
 */
export function projectThreatAngleToScreenEdge(
  angle: number,
  screenW: number,
  screenH: number,
  margin: number,
): { sx: number; sy: number } {
  const halfSW = screenW / 2 - margin;
  const halfSH = screenH / 2 - margin;

  if (Math.abs(Math.cos(angle)) > 0.001) {
    const edgeX = Math.sign(Math.cos(angle)) * halfSW;
    const edgeY = edgeX * Math.tan(angle);
    if (Math.abs(edgeY) <= halfSH) {
      return {
        sx: screenW / 2 + edgeX,
        sy: screenH / 2 + edgeY,
      };
    }
    const edgeY2 = Math.sign(Math.sin(angle)) * halfSH;
    return {
      sx: screenW / 2 + edgeY2 / Math.tan(angle),
      sy: screenH / 2 + edgeY2,
    };
  }

  return {
    sx: screenW / 2,
    sy: Math.sin(angle) > 0 ? screenH - margin : margin,
  };
}

/** In-place insertion sort on the first `count` elements by `.dist` ascending. */
export function insertionSortOffScreenByDist(buf: OffScreenScratch[], count: number): void {
  for (let i = 1; i < count; i++) {
    const key = buf[i];
    const keyDist = key.dist;
    let j = i - 1;
    while (j >= 0 && buf[j].dist > keyDist) {
      buf[j + 1] = buf[j];
      j--;
    }
    buf[j + 1] = key;
  }
}
