/**
 * coordinates.ts — Floor Plan Module
 *
 * World ↔ screen coordinate transforms.
 *
 * The coordinate system:
 *   World space  — feet, origin at top-left of the store floor
 *   Screen space — SVG pixels, origin at top-left of the SVG element
 *
 * Transform equations:
 *   screenX = worldX * scale + panX
 *   screenY = worldY * scale + panY
 *
 *   worldX = (screenX - panX) / scale
 *   worldY = (screenY - panY) / scale
 *
 * These functions are pure — they do not read DOM state except where a
 * SVGSVGElement is explicitly passed in.
 */

import type { Point, ViewTransform } from "../types";
import { GRID_MINOR_FT } from "../constants";

// ── DOM → SVG local ───────────────────────────────────────────────────────────

/**
 * Convert DOM client coordinates to SVG-element-local pixel coordinates.
 * Removes the SVG element's position on the page.
 */
function clientToSvgLocal(
  clientX: number,
  clientY: number,
  svgEl: SVGSVGElement
): { x: number; y: number } {
  const rect = svgEl.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

// ── Client → world ────────────────────────────────────────────────────────────

/**
 * Convert DOM client coordinates (e.g., from a pointer event) to
 * world coordinates (feet), given the current viewport transform.
 */
export function clientToWorld(
  clientX: number,
  clientY: number,
  svgEl: SVGSVGElement,
  transform: ViewTransform
): Point {
  const local = clientToSvgLocal(clientX, clientY, svgEl);
  return {
    x: (local.x - transform.panX) / transform.scale,
    y: (local.y - transform.panY) / transform.scale,
  };
}

// ── World → SVG pixels ────────────────────────────────────────────────────────

/**
 * Convert a world-space point (feet) to SVG pixel coordinates.
 * Useful for positioning overlay UI elements (e.g., measurement labels).
 */
export function worldToSvg(point: Point, transform: ViewTransform): Point {
  return {
    x: point.x * transform.scale + transform.panX,
    y: point.y * transform.scale + transform.panY,
  };
}

// ── Grid snapping ─────────────────────────────────────────────────────────────

/**
 * Snap a world-space point to the nearest grid intersection.
 *
 * @param point   World-space coordinates (feet).
 * @param gridFt  Grid resolution in feet. Defaults to GRID_MINOR_FT (1 ft).
 */
export function snapToGrid(point: Point, gridFt = GRID_MINOR_FT): Point {
  return {
    x: Math.round(point.x / gridFt) * gridFt,
    y: Math.round(point.y / gridFt) * gridFt,
  };
}

// ── Scale helpers ─────────────────────────────────────────────────────────────

/**
 * Convert a screen pixel distance to a world distance (feet).
 * Useful for computing snap thresholds in world units from a fixed pixel radius.
 *
 * @param px        Distance in screen pixels.
 * @param scale     Current pixels-per-foot scale.
 */
export function pixelsToFeet(px: number, scale: number): number {
  return px / scale;
}
