/**
 * MeasurementLabel.tsx — Floor Plan Module
 *
 * SVG text label showing a dimension while drawing.
 * Rendered in world space (inside the transform group), so its position
 * is in feet. Font size is computed to appear at a constant pixel size
 * at any zoom level.
 *
 * For a wall: shows "12.5 ft" at the midpoint of the preview line.
 * For a room: shows "10 × 8 ft" near the bottom-right of the preview rect.
 *
 * The label text appears against the dark canvas background.
 * A subtle backing rect improves readability without being distracting.
 */

import type { Point } from "../types";
import { distance } from "../utils/geometry";

const LABEL_PX = 11;       // target visual font size in screen pixels
const PAD_PX = 3;          // background rect padding in screen pixels
const OFFSET_PX = 16;      // label offset from midpoint in screen pixels

interface WallLabelProps {
  start: Point;
  end: Point;
  scale: number; // pixels per foot — used to compute world-unit sizes
}

interface RoomLabelProps {
  x: number;
  y: number;
  widthFt: number;
  heightFt: number;
  scale: number;
}

// ── Wall measurement label ────────────────────────────────────────────────────

export function WallMeasurementLabel({ start, end, scale }: WallLabelProps) {
  const len = distance(start, end);
  if (len < 0.1) return null;

  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;

  const fontSize = LABEL_PX / scale;
  const pad = PAD_PX / scale;
  const offsetY = -OFFSET_PX / scale; // offset above the midpoint

  const text = `${len.toFixed(1)} ft`;
  // Approximate text width: 6px per character at LABEL_PX font size
  const approxTextW = (text.length * 6) / scale;
  const approxTextH = LABEL_PX / scale;

  return (
    <g>
      {/* Backing rect for readability */}
      <rect
        x={mx - approxTextW / 2 - pad}
        y={my + offsetY - approxTextH / 2 - pad}
        width={approxTextW + pad * 2}
        height={approxTextH + pad * 2}
        rx={2 / scale}
        fill="hsl(218 15% 12%)"
        fillOpacity={0.85}
      />
      <text
        x={mx}
        y={my + offsetY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill="hsl(217 91% 70%)"
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        style={{ userSelect: "none", pointerEvents: "none" }}
      >
        {text}
      </text>
    </g>
  );
}

// ── Room measurement label ────────────────────────────────────────────────────

export function RoomMeasurementLabel({ x, y, widthFt, heightFt, scale }: RoomLabelProps) {
  if (widthFt < 0.5 || heightFt < 0.5) return null;

  // Position near the center of the preview rect
  const cx = x + widthFt / 2;
  const cy = y + heightFt / 2;

  const fontSize = LABEL_PX / scale;
  const pad = PAD_PX / scale;

  const text = `${widthFt.toFixed(0)} × ${heightFt.toFixed(0)} ft`;
  const approxTextW = (text.length * 6) / scale;
  const approxTextH = LABEL_PX / scale;

  return (
    <g>
      <rect
        x={cx - approxTextW / 2 - pad}
        y={cy - approxTextH / 2 - pad}
        width={approxTextW + pad * 2}
        height={approxTextH + pad * 2}
        rx={2 / scale}
        fill="hsl(218 15% 12%)"
        fillOpacity={0.85}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill="hsl(217 91% 70%)"
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        style={{ userSelect: "none", pointerEvents: "none" }}
      >
        {text}
      </text>
    </g>
  );
}
