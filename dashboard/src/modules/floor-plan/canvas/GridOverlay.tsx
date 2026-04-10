/**
 * GridOverlay.tsx — Floor Plan Module
 *
 * Renders 1-ft minor and 5-ft major grid lines over the floor boundary.
 * Visible on Layer 1 only.
 *
 * Lives inside the viewport transform group, so coordinates are in world space
 * (feet). The SVG pattern tiles naturally as the user zooms/pans.
 *
 * Stroke widths are computed as (target_px / scale) so that grid lines appear
 * at a consistent visual thickness regardless of zoom level.
 */

import { GRID_MINOR_FT, GRID_MAJOR_FT } from "../constants";

interface GridOverlayProps {
  floorWidthFt: number;
  floorHeightFt: number;
  /** Current pixels-per-foot scale — used to keep strokes at constant visual width. */
  scale: number;
}

export function GridOverlay({ floorWidthFt, floorHeightFt, scale }: GridOverlayProps) {
  // Target visual thickness in screen pixels, divided by scale to get world units.
  // This counteracts the parent transform's scaling on strokeWidth.
  const minorStroke = 0.5 / scale;  // 0.5px visual
  const majorStroke = 1.0 / scale;  // 1.0px visual

  return (
    <g>
      <defs>
        {/*
         * Minor grid: 1-ft tiles.
         * The path draws only the left and top edges of each tile so lines
         * don't double up where tiles meet.
         */}
        <pattern
          id="fp-grid-minor"
          x={0}
          y={0}
          width={GRID_MINOR_FT}
          height={GRID_MINOR_FT}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${GRID_MINOR_FT} 0 L 0 0 0 ${GRID_MINOR_FT}`}
            fill="none"
            stroke="hsl(218 12% 20%)"
            strokeWidth={minorStroke}
          />
        </pattern>

        {/*
         * Major grid: 5-ft tiles.
         * Fills with the minor grid first, then draws the major edges on top.
         */}
        <pattern
          id="fp-grid-major"
          x={0}
          y={0}
          width={GRID_MAJOR_FT}
          height={GRID_MAJOR_FT}
          patternUnits="userSpaceOnUse"
        >
          <rect width={GRID_MAJOR_FT} height={GRID_MAJOR_FT} fill="url(#fp-grid-minor)" />
          <path
            d={`M ${GRID_MAJOR_FT} 0 L 0 0 0 ${GRID_MAJOR_FT}`}
            fill="none"
            stroke="hsl(218 12% 27%)"
            strokeWidth={majorStroke}
          />
        </pattern>
      </defs>

      {/* Grid fill — covers the floor boundary area only */}
      <rect
        x={0}
        y={0}
        width={floorWidthFt}
        height={floorHeightFt}
        fill="url(#fp-grid-major)"
      />
    </g>
  );
}
