import Phaser from 'phaser';

export type CameraViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
};

/**
 * Visible camera viewport for fixed `setScrollFactor(0)` UI coordinates.
 * Values are returned in world units (camera pixels divided by zoom).
 */
export function getCameraViewport(scene: Phaser.Scene): CameraViewport {
  const cam = scene.cameras?.main;
  const zoom = Math.max(0.001, cam?.zoom || 1);
  const camWidth = cam?.width || scene.scale.width;
  const camHeight = cam?.height || scene.scale.height;
  // Camera zoom is centered, so fixed UI coordinates need a positive origin
  // offset to match the visible viewport in world units.
  const zoomOffsetX = (camWidth - camWidth / zoom) * 0.5;
  const zoomOffsetY = (camHeight - camHeight / zoom) * 0.5;
  const baseWidth = camWidth;
  const baseHeight = camHeight;
  const baseX = 0;
  const baseY = 0;

  let insetLeft = 0;
  let insetTop = 0;
  let insetRight = 0;
  let insetBottom = 0;

  const canvas = scene.game?.canvas;
  if (
    canvas
    && typeof window !== 'undefined'
    && typeof canvas.getBoundingClientRect === 'function'
  ) {
    const rect = canvas.getBoundingClientRect();
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const leftPx = Math.max(0, -rect.left);
    const topPx = Math.max(0, -rect.top);
    const rightPx = Math.max(0, rect.right - vw);
    const bottomPx = Math.max(0, rect.bottom - vh);

    // Convert CSS pixel clipping into camera/game pixels.
    // Without this ratio, UI can be visible but still mis-centered when
    // the host scales the canvas.
    const scaleX = rect.width > 0 ? baseWidth / rect.width : 1;
    const scaleY = rect.height > 0 ? baseHeight / rect.height : 1;
    insetLeft = leftPx * scaleX;
    insetTop = topPx * scaleY;
    insetRight = rightPx * scaleX;
    insetBottom = bottomPx * scaleY;
  }

  const width = Math.max(1, baseWidth - insetLeft - insetRight);
  const height = Math.max(1, baseHeight - insetTop - insetBottom);

  // Guard against pathological inset math on embedded hosts or browser UI
  // transitions: if viewport collapses, fall back to uncropped camera space.
  if (width < Math.min(64, baseWidth * 0.25) || height < Math.min(64, baseHeight * 0.25)) {
    return {
      x: zoomOffsetX + baseX / zoom,
      y: zoomOffsetY + baseY / zoom,
      width: baseWidth / zoom,
      height: baseHeight / zoom,
      zoom,
    };
  }

  return {
    x: zoomOffsetX + (baseX + insetLeft) / zoom,
    y: zoomOffsetY + (baseY + insetTop) / zoom,
    width: width / zoom,
    height: height / zoom,
    zoom,
  };
}
