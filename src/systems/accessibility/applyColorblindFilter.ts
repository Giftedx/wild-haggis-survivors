import type { ColorblindMode } from '../../core/SettingsManager';
import { COLORBLIND_MATRICES, matrixToFeColorMatrixValues } from './colorblindMatrices';

/**
 * A1 M2 — apply the active `colorblindMode` to the game canvas via an
 * SVG `<feColorMatrix>` filter + `canvas.style.filter`.
 *
 * Why SVG + `style.filter` instead of a Phaser shader:
 *  - scene-agnostic (every scene uses the same canvas);
 *  - works under Canvas + WebGL renderers unchanged;
 *  - zero Phaser integration surface — setting the style rebuilds
 *    exactly the pixel pipeline the simulator / audit tool expects.
 *
 * The SVG filter definition lives in a single hidden `<svg>` element
 * appended to `document.body` on first use. Each mode reuses the same
 * `<filter>` node with its values attribute swapped — the canvas style
 * just changes which URL it references.
 */

const FILTER_CONTAINER_ID = 'whs-colorblind-svg';
const FILTER_IDS: Record<Exclude<ColorblindMode, 'off'>, string> = {
  protanopia: 'whs-cb-protanopia',
  deuteranopia: 'whs-cb-deuteranopia',
  tritanopia: 'whs-cb-tritanopia',
  monochrome: 'whs-cb-monochrome',
};

/** Insert the SVG filter definitions once per page. Idempotent. */
export function ensureColorblindSvgFilters(doc: Document = document): void {
  if (doc.getElementById(FILTER_CONTAINER_ID)) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = doc.createElementNS(svgNS, 'svg');
  svg.setAttribute('id', FILTER_CONTAINER_ID);
  svg.setAttribute('aria-hidden', 'true');
  // Keep the element off-layout but present in the DOM.
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;');

  for (const mode of Object.keys(FILTER_IDS) as (keyof typeof FILTER_IDS)[]) {
    const filter = doc.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', FILTER_IDS[mode]);
    const matrix = doc.createElementNS(svgNS, 'feColorMatrix');
    matrix.setAttribute('type', 'matrix');
    matrix.setAttribute('values', matrixToFeColorMatrixValues(COLORBLIND_MATRICES[mode]));
    filter.appendChild(matrix);
    svg.appendChild(filter);
  }

  doc.body.appendChild(svg);
}

/**
 * Mutate `canvas.style.filter` so every rendered frame routes through
 * the mode's LUT — or clears the style for `off`. Subsequent calls with
 * different modes replace cleanly; there's no flicker because the SVG
 * filter nodes all exist at page-init time.
 */
export function applyColorblindFilterToCanvas(
  canvas: HTMLCanvasElement,
  mode: ColorblindMode,
): void {
  if (mode === 'off') {
    canvas.style.filter = '';
    return;
  }
  ensureColorblindSvgFilters(canvas.ownerDocument ?? document);
  canvas.style.filter = `url(#${FILTER_IDS[mode]})`;
}
