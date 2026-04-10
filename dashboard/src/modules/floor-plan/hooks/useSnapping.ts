/**
 * useSnapping.ts — Floor Plan Module
 *
 * Returns a memoized snap function for use with useDrag.
 * The snap function is applied to every pointer position during drawing.
 *
 * Priority order:
 *   1. Wall endpoint snap — if any existing wall endpoint is within
 *      SNAP_ENDPOINT_FT, snap to the nearest one.
 *   2. Grid snap — fall back to the nearest 1-ft grid intersection.
 *
 * The snap function works entirely in world space (feet).
 * It never touches the DOM or depends on scale/zoom.
 */

import { useCallback } from "react";
import type { Point, WallSegment } from "../types";
import { SNAP_ENDPOINT_FT, GRID_MINOR_FT } from "../constants";
import { snapToGrid } from "../utils/coordinates";
import { distance } from "../utils/geometry";

// Re-export snapToGrid so callers can snap without a full useSnapping call
export { snapToGrid };

/**
 * @param walls   The current wall segments to collect snap targets from.
 *
 * Returns a stable `snap(p: Point): Point` function.
 * Recreated only when the wall list reference changes.
 */
export function useSnapping(walls: WallSegment[]) {
  const snap = useCallback(
    (p: Point): Point => {
      // Build endpoint list from all existing walls
      let closestDist = SNAP_ENDPOINT_FT;
      let closestPt: Point | null = null;

      for (const w of walls) {
        const endpoints: Point[] = [
          { x: w.x1, y: w.y1 },
          { x: w.x2, y: w.y2 },
        ];
        for (const ep of endpoints) {
          const d = distance(p, ep);
          if (d < closestDist) {
            closestDist = d;
            closestPt = ep;
          }
        }
      }

      if (closestPt) return closestPt;

      // Fall back to grid snap
      return {
        x: Math.round(p.x / GRID_MINOR_FT) * GRID_MINOR_FT,
        y: Math.round(p.y / GRID_MINOR_FT) * GRID_MINOR_FT,
      };
    },
    [walls] // recreated when walls array reference changes
  );

  return { snap };
}
