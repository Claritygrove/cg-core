/**
 * BaseLayoutLayer.tsx — Floor Plan Module — Layer 1
 *
 * Renders and edits the fixed physical structure of a store:
 *   - Wall segments (drawn with click-click chaining)
 *   - Room shapes (drawn with click-drag)
 *   - Labels on rooms
 *   - Selection highlights
 *   - Snap endpoint indicators (when draw-wall tool is active)
 *   - Live measurement preview (while drawing)
 *
 * Drawing state machine (local to this component):
 *   idle           → user is in select mode, or draw mode hasn't started
 *   drawing-wall   → first click placed; tracking mouse for preview line
 *   drawing-room   → pointer held down; tracking drag for preview rect
 *
 * This layer owns:
 *   - The drawing state machine
 *   - The Escape key handler (cancels current draw)
 *
 * FloorPlanPage owns:
 *   - The Delete key handler (removes selected element from plan)
 *
 * All coordinates are in world space (feet).
 * Scale is passed in to compute constant-visual-size elements (text, indicators).
 */

import { useState, useEffect, useCallback } from "react";
import type {
  BaseLayout,
  WallSegment,
  RoomShape,
  RoomType,
  Point,
  ViewTransform,
} from "../../types";
import type { ActiveTool } from "../../hooks/useEditorState";
import { useDrag } from "../../hooks/useDrag";
import { useSnapping } from "../../hooks/useSnapping";
import { WallMeasurementLabel, RoomMeasurementLabel } from "../MeasurementLabel";
import { DEFAULT_WALL_THICKNESS_FT } from "../../constants";
import { distance } from "../../utils/geometry";

// ── Constants ─────────────────────────────────────────────────────────────────

const SNAP_INDICATOR_R_PX = 5;  // visual radius of endpoint snap dots
const MIN_ROOM_FT = 1;           // minimum room dimension to commit
const MIN_WALL_FT = 0.1;         // minimum wall length to commit

// ── Room type default labels ──────────────────────────────────────────────────

const ROOM_DEFAULT_LABEL: Record<RoomType, string> = {
  sales_floor:  "Sales Floor",
  cash_wrap:    "Cash Wrap",
  back_room:    "Back Room",
  office:       "Office",
  bathroom:     "Bathroom",
  fitting_room: "Fitting Room",
  custom:       "Room",
};

// ── Tiny unique ID helper ─────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ── Drawing state ─────────────────────────────────────────────────────────────

type DrawMode =
  | { type: "idle" }
  | { type: "drawing-wall"; start: Point; preview: Point }
  | { type: "drawing-room"; start: Point; current: Point };

// ── Props ─────────────────────────────────────────────────────────────────────

interface BaseLayoutLayerProps {
  baseLayout: BaseLayout;
  activeTool: ActiveTool;
  selectedId: string | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
  transform: ViewTransform;
  canEdit: boolean;
  onLayoutChange: (layout: BaseLayout) => void;
  onSelectElement: (id: string | null) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BaseLayoutLayer({
  baseLayout,
  activeTool,
  selectedId,
  svgRef,
  transform,
  canEdit,
  onLayoutChange,
  onSelectElement,
}: BaseLayoutLayerProps) {
  const { walls, rooms, floorWidthFt, floorHeightFt } = baseLayout;
  const scale = transform.scale;

  // ── Drawing state ──────────────────────────────────────────────────────────
  const [drawMode, setDrawMode] = useState<DrawMode>({ type: "idle" });

  // ── Snapping & coordinate conversion ──────────────────────────────────────
  const { snap } = useSnapping(walls);
  const { toWorld, startCapture } = useDrag(svgRef, transform, snap);

  // ── Scale-dependent sizes (constant visual weight at any zoom) ─────────────
  const wallStroke = (w: WallSegment) => w.thicknessFt;
  const selectionHalo = 3 / scale;    // 3px selection glow
  const snapIndicatorR = SNAP_INDICATOR_R_PX / scale;
  const roomFontSize = 11 / scale;
  const roomStroke = 1.5 / scale;
  const previewStroke = 1.5 / scale;
  const dashLen = 6 / scale;

  // ── Reset draw mode when tool changes ─────────────────────────────────────
  useEffect(() => {
    if (activeTool !== "draw-wall" && activeTool !== "place-room") {
      setDrawMode({ type: "idle" });
    }
  }, [activeTool]);

  // ── Escape key: cancel current draw ───────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (drawMode.type !== "idle") {
        setDrawMode({ type: "idle" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawMode.type]);

  // ── Wall endpoint positions (for snap indicators) ──────────────────────────
  const allEndpoints: Point[] = walls.flatMap((w) => [
    { x: w.x1, y: w.y1 },
    { x: w.x2, y: w.y2 },
  ]);

  // ── Event handlers ─────────────────────────────────────────────────────────

  // Background click — drawing and deselection
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      const worldPt = toWorld(e);

      if (activeTool === "select") {
        onSelectElement(null);
        return;
      }

      if (!canEdit) return;

      if (activeTool === "draw-wall") {
        if (drawMode.type === "idle") {
          // First click: start a new wall chain
          setDrawMode({ type: "drawing-wall", start: worldPt, preview: worldPt });
        } else if (drawMode.type === "drawing-wall") {
          // Second click: commit this segment, chain to next
          if (distance(drawMode.start, worldPt) < MIN_WALL_FT) return;
          const newWall: WallSegment = {
            id: uid(),
            x1: drawMode.start.x,
            y1: drawMode.start.y,
            x2: worldPt.x,
            y2: worldPt.y,
            thicknessFt: DEFAULT_WALL_THICKNESS_FT,
          };
          onLayoutChange({ ...baseLayout, walls: [...walls, newWall] });
          // Chain: the endpoint becomes the start of the next wall
          setDrawMode({ type: "drawing-wall", start: worldPt, preview: worldPt });
        }
      }
    },
    [activeTool, canEdit, drawMode, toWorld, walls, baseLayout, onLayoutChange, onSelectElement]
  );

  // Background pointer down — room drawing (drag to create)
  const handleBackgroundPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (!canEdit || activeTool !== "place-room") return;
      startCapture(e);
      const worldPt = toWorld(e);
      setDrawMode({ type: "drawing-room", start: worldPt, current: worldPt });
    },
    [canEdit, activeTool, toWorld, startCapture]
  );

  // Background pointer move — update preview for both tools
  const handleBackgroundPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (drawMode.type === "drawing-wall") {
        setDrawMode({ ...drawMode, preview: toWorld(e) });
      } else if (drawMode.type === "drawing-room") {
        setDrawMode({ ...drawMode, current: toWorld(e) });
      }
    },
    [drawMode, toWorld]
  );

  // Background pointer up — commit room
  const handleBackgroundPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (drawMode.type !== "drawing-room") return;
      const { start, current } = drawMode;
      const w = Math.abs(current.x - start.x);
      const h = Math.abs(current.y - start.y);
      if (w >= MIN_ROOM_FT && h >= MIN_ROOM_FT) {
        const newRoom: RoomShape = {
          id: uid(),
          type: "custom",
          label: ROOM_DEFAULT_LABEL.custom,
          x: Math.min(start.x, current.x),
          y: Math.min(start.y, current.y),
          widthFt: w,
          heightFt: h,
        };
        const updatedLayout = { ...baseLayout, rooms: [...rooms, newRoom] };
        onLayoutChange(updatedLayout);
        onSelectElement(newRoom.id); // auto-select so panel opens
      }
      setDrawMode({ type: "idle" });
    },
    [drawMode, baseLayout, rooms, onLayoutChange, onSelectElement]
  );

  // Wall click — select
  const handleWallClick = useCallback(
    (wallId: string, e: React.MouseEvent) => {
      if (activeTool !== "select") return;
      e.stopPropagation();
      onSelectElement(selectedId === wallId ? null : wallId);
    },
    [activeTool, selectedId, onSelectElement]
  );

  // Room click — select
  const handleRoomClick = useCallback(
    (roomId: string, e: React.MouseEvent) => {
      if (activeTool !== "select") return;
      e.stopPropagation();
      onSelectElement(selectedId === roomId ? null : roomId);
    },
    [activeTool, selectedId, onSelectElement]
  );

  // ── Preview geometry ───────────────────────────────────────────────────────
  let previewWall: { x1: number; y1: number; x2: number; y2: number } | null = null;
  let previewRoom: { x: number; y: number; w: number; h: number } | null = null;

  if (drawMode.type === "drawing-wall") {
    previewWall = {
      x1: drawMode.start.x,
      y1: drawMode.start.y,
      x2: drawMode.preview.x,
      y2: drawMode.preview.y,
    };
  }
  if (drawMode.type === "drawing-room") {
    const { start, current } = drawMode;
    previewRoom = {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      w: Math.abs(current.x - start.x),
      h: Math.abs(current.y - start.y),
    };
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <g>
      {/*
       * Background hit target — covers the entire floor.
       * Receives clicks on empty space for drawing and deselection.
       * fill="transparent" makes it clickable without visual change.
       */}
      <rect
        x={0}
        y={0}
        width={floorWidthFt}
        height={floorHeightFt}
        fill="transparent"
        onClick={handleBackgroundClick}
        onPointerDown={handleBackgroundPointerDown}
        onPointerMove={handleBackgroundPointerMove}
        onPointerUp={handleBackgroundPointerUp}
        style={{
          cursor:
            activeTool === "draw-wall" || activeTool === "place-room"
              ? "crosshair"
              : "default",
        }}
      />

      {/* ── Room shapes (rendered below walls) ─────────────────────────── */}
      {rooms.map((room) => {
        const isSelected = room.id === selectedId;
        return (
          <g key={room.id}>
            {isSelected && (
              <rect
                x={room.x - selectionHalo}
                y={room.y - selectionHalo}
                width={room.widthFt + selectionHalo * 2}
                height={room.heightFt + selectionHalo * 2}
                fill="none"
                stroke="hsl(217 91% 60%)"
                strokeWidth={selectionHalo}
                strokeOpacity={0.5}
                rx={selectionHalo}
                style={{ pointerEvents: "none" }}
              />
            )}
            <rect
              x={room.x}
              y={room.y}
              width={room.widthFt}
              height={room.heightFt}
              fill="hsl(218 15% 13%)"
              stroke={isSelected ? "hsl(217 91% 60%)" : "hsl(218 12% 35%)"}
              strokeWidth={roomStroke}
              rx={1 / scale}
              onClick={(e) => handleRoomClick(room.id, e)}
              style={{ cursor: activeTool === "select" ? "pointer" : "default" }}
            />
            <text
              x={room.x + room.widthFt / 2}
              y={room.y + room.heightFt / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={roomFontSize}
              fill={isSelected ? "hsl(217 91% 80%)" : "hsl(218 12% 60%)"}
              fontFamily="system-ui, sans-serif"
              fontWeight="500"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {room.label}
            </text>
          </g>
        );
      })}

      {/* ── Wall segments ───────────────────────────────────────────────── */}
      {walls.map((wall) => {
        const isSelected = wall.id === selectedId;
        return (
          <g key={wall.id}>
            {/* Selection halo (wider invisible stroke for easier clicking) */}
            <line
              x1={wall.x1} y1={wall.y1}
              x2={wall.x2} y2={wall.y2}
              stroke="transparent"
              strokeWidth={Math.max(wallStroke(wall), 8 / scale)}
              onClick={(e) => handleWallClick(wall.id, e)}
              style={{ cursor: activeTool === "select" ? "pointer" : "default" }}
            />
            {/* Selection highlight */}
            {isSelected && (
              <line
                x1={wall.x1} y1={wall.y1}
                x2={wall.x2} y2={wall.y2}
                stroke="hsl(217 91% 60%)"
                strokeWidth={wallStroke(wall) + selectionHalo * 2}
                strokeOpacity={0.4}
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
            )}
            {/* Wall body */}
            <line
              x1={wall.x1} y1={wall.y1}
              x2={wall.x2} y2={wall.y2}
              stroke={isSelected ? "hsl(217 91% 65%)" : "hsl(218 12% 55%)"}
              strokeWidth={wallStroke(wall)}
              strokeLinecap="round"
              style={{ pointerEvents: "none" }}
            />
          </g>
        );
      })}

      {/* ── Wall endpoint snap indicators ────────────────────────────────── */}
      {activeTool === "draw-wall" && canEdit && allEndpoints.map((ep, i) => (
        <circle
          key={i}
          cx={ep.x}
          cy={ep.y}
          r={snapIndicatorR}
          fill="hsl(217 91% 60%)"
          fillOpacity={0.5}
          stroke="hsl(217 91% 75%)"
          strokeWidth={1 / scale}
          style={{ pointerEvents: "none" }}
        />
      ))}

      {/* ── Wall draw preview ─────────────────────────────────────────────── */}
      {previewWall && (
        <g style={{ pointerEvents: "none" }}>
          {/* Start point dot */}
          <circle
            cx={previewWall.x1} cy={previewWall.y1}
            r={snapIndicatorR}
            fill="hsl(217 91% 60%)"
          />
          {/* Preview line */}
          <line
            x1={previewWall.x1} y1={previewWall.y1}
            x2={previewWall.x2} y2={previewWall.y2}
            stroke="hsl(217 91% 65%)"
            strokeWidth={previewStroke}
            strokeDasharray={`${dashLen} ${dashLen * 0.6}`}
            strokeLinecap="round"
          />
          {/* End point dot */}
          <circle
            cx={previewWall.x2} cy={previewWall.y2}
            r={snapIndicatorR}
            fill="hsl(217 91% 60%)"
          />
          {/* Measurement label */}
          <WallMeasurementLabel
            start={{ x: previewWall.x1, y: previewWall.y1 }}
            end={{ x: previewWall.x2, y: previewWall.y2 }}
            scale={scale}
          />
        </g>
      )}

      {/* ── Room draw preview ─────────────────────────────────────────────── */}
      {previewRoom && previewRoom.w > 0 && previewRoom.h > 0 && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={previewRoom.x}
            y={previewRoom.y}
            width={previewRoom.w}
            height={previewRoom.h}
            fill="hsl(217 91% 60% / 0.08)"
            stroke="hsl(217 91% 65%)"
            strokeWidth={previewStroke}
            strokeDasharray={`${dashLen} ${dashLen * 0.6}`}
          />
          <RoomMeasurementLabel
            x={previewRoom.x}
            y={previewRoom.y}
            widthFt={previewRoom.w}
            heightFt={previewRoom.h}
            scale={scale}
          />
        </g>
      )}
    </g>
  );
}
