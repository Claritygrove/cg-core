/**
 * FixturesLayer.tsx — Floor Plan Module — Layer 2
 *
 * Renders placed fixture instances and handles:
 *   - Placement: click on empty canvas to drop a pending fixture def
 *   - Selection: click a fixture to select it (select tool)
 *   - Drag-to-move: pointer down → capture → move → up commits new position
 *   - Deselection: click on empty canvas background
 *
 * Coordinates are in world space (feet).
 * Rotation is applied around each fixture's center via SVG transform.
 *
 * Drag state is local (no prop drilling on every frame).
 * Only the final committed position triggers onFixturesChange.
 */

import { useState, useCallback } from "react";
import type {
  FixtureInstance,
  FixtureDefinition,
  FixtureRotation,
  Point,
  ViewTransform,
} from "../../types";
import type { ActiveTool } from "../../hooks/useEditorState";
import { useDrag } from "../../hooks/useDrag";
import { GRID_MINOR_FT, SNAP_NEIGHBOR_FT } from "../../constants";

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** Grid-snap a world-space position. */
function snapPos(p: Point): Point {
  return {
    x: Math.round(p.x / GRID_MINOR_FT) * GRID_MINOR_FT,
    y: Math.round(p.y / GRID_MINOR_FT) * GRID_MINOR_FT,
  };
}

/**
 * Return the visual (post-rotation) width and height of a fixture.
 * At 90° or 270°, width and depth are swapped.
 */
function visualDims(def: FixtureDefinition, rotation: FixtureRotation) {
  if (rotation === 90 || rotation === 270) {
    return { vw: def.depthFt, vh: def.widthFt };
  }
  return { vw: def.widthFt, vh: def.depthFt };
}

/**
 * Snap x to neighboring fixture edges (within SNAP_NEIGHBOR_FT).
 * Checks left and right edges of all other instances.
 */
function snapToNeighbors(
  x: number,
  y: number,
  def: FixtureDefinition,
  rotation: FixtureRotation,
  instances: FixtureInstance[],
  catalog: FixtureDefinition[],
  excludeId: string | null
): Point {
  let sx = x;
  let sy = y;
  let bestDx = SNAP_NEIGHBOR_FT;
  let bestDy = SNAP_NEIGHBOR_FT;

  const { vw, vh } = visualDims(def, rotation);

  for (const other of instances) {
    if (other.id === excludeId) continue;
    const otherDef = catalog.find((d) => d.id === other.fixtureDefId);
    if (!otherDef) continue;
    const { vw: ovw, vh: ovh } = visualDims(otherDef, other.rotation);

    // Snap right edge of dragged to left edge of neighbor
    const dx1 = Math.abs((x + vw) - other.x);
    if (dx1 < bestDx) { bestDx = dx1; sx = other.x - vw; }

    // Snap left edge of dragged to right edge of neighbor
    const dx2 = Math.abs(x - (other.x + ovw));
    if (dx2 < bestDx) { bestDx = dx2; sx = other.x + ovw; }

    // Snap bottom edge of dragged to top edge of neighbor
    const dy1 = Math.abs((y + vh) - other.y);
    if (dy1 < bestDy) { bestDy = dy1; sy = other.y - vh; }

    // Snap top edge of dragged to bottom edge of neighbor
    const dy2 = Math.abs(y - (other.y + ovh));
    if (dy2 < bestDy) { bestDy = dy2; sy = other.y + ovh; }
  }

  return { x: sx, y: sy };
}

// ── Drag state ────────────────────────────────────────────────────────────────

type DragState =
  | { type: "idle" }
  | {
      type: "dragging";
      instanceId: string;
      offsetX: number;  // pointer.x - instance.x at drag start (world ft)
      offsetY: number;
      liveX: number;    // current position during drag (world ft)
      liveY: number;
    };

// ── Props ─────────────────────────────────────────────────────────────────────

interface FixturesLayerProps {
  fixtures: FixtureInstance[];
  catalog: FixtureDefinition[];
  activeTool: ActiveTool;
  selectedId: string | null;
  pendingDefId: string | null;
  pendingRotation: FixtureRotation;
  floorWidthFt: number;
  floorHeightFt: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
  transform: ViewTransform;
  canEdit: boolean;
  onFixturesChange: (fixtures: FixtureInstance[]) => void;
  onSelectElement: (id: string | null) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FixturesLayer({
  fixtures,
  catalog,
  activeTool,
  selectedId,
  pendingDefId,
  pendingRotation,
  floorWidthFt,
  floorHeightFt,
  svgRef,
  transform,
  canEdit,
  onFixturesChange,
  onSelectElement,
}: FixturesLayerProps) {
  const scale = transform.scale;
  const { toWorld, startCapture } = useDrag(svgRef, transform);

  const [dragState, setDragState] = useState<DragState>({ type: "idle" });
  const [hoverPt, setHoverPt] = useState<Point | null>(null);

  // ── Scale-dependent sizes ─────────────────────────────────────────────────
  const selectionHalo = 3 / scale;
  const fixtureStroke = 1.5 / scale;
  const fontSize = 9 / scale;
  const labelPad = 2 / scale;

  // ── Background click: place or deselect ──────────────────────────────────
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (!canEdit || activeTool !== "place-fixture" || !pendingDefId) {
        onSelectElement(null);
        return;
      }
      const def = catalog.find((d) => d.id === pendingDefId);
      if (!def) return;

      const raw = toWorld(e);
      const snapped = snapPos(raw);
      const newInstance: FixtureInstance = {
        id: uid(),
        fixtureDefId: pendingDefId,
        x: snapped.x,
        y: snapped.y,
        rotation: pendingRotation,
      };
      onFixturesChange([...fixtures, newInstance]);
      onSelectElement(newInstance.id);
    },
    [activeTool, canEdit, catalog, fixtures, onFixturesChange, onSelectElement, pendingDefId, pendingRotation, toWorld]
  );

  // ── Background hover: track cursor for placement preview ─────────────────
  const handleBackgroundPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (activeTool === "place-fixture" && pendingDefId) {
        const raw = toWorld(e);
        setHoverPt(snapPos(raw));
      } else {
        setHoverPt(null);
      }

      if (dragState.type === "dragging") {
        const world = toWorld(e);
        const rawX = world.x - dragState.offsetX;
        const rawY = world.y - dragState.offsetY;
        const gridSnapped = snapPos({ x: rawX, y: rawY });
        const dragging = fixtures.find((f) => f.id === dragState.instanceId);
        const def = dragging ? catalog.find((d) => d.id === dragging.fixtureDefId) : null;
        let liveX = gridSnapped.x;
        let liveY = gridSnapped.y;
        if (def) {
          const neighborSnapped = snapToNeighbors(liveX, liveY, def, dragging!.rotation, fixtures, catalog, dragState.instanceId);
          liveX = neighborSnapped.x;
          liveY = neighborSnapped.y;
        }
        setDragState({ ...dragState, liveX, liveY });
      }
    },
    [activeTool, catalog, dragState, fixtures, pendingDefId, toWorld]
  );

  const handleBackgroundPointerLeave = useCallback(() => {
    setHoverPt(null);
  }, []);

  // ── Fixture pointer down: select + start drag ─────────────────────────────
  const handleFixturePointerDown = useCallback(
    (instance: FixtureInstance, e: React.PointerEvent) => {
      if (activeTool !== "select") return;
      e.stopPropagation();
      startCapture(e);
      onSelectElement(instance.id);
      const world = toWorld(e);
      setDragState({
        type: "dragging",
        instanceId: instance.id,
        offsetX: world.x - instance.x,
        offsetY: world.y - instance.y,
        liveX: instance.x,
        liveY: instance.y,
      });
    },
    [activeTool, onSelectElement, startCapture, toWorld]
  );

  // ── Fixture pointer up: commit position ───────────────────────────────────
  const handlePointerUp = useCallback(
    (_e: React.PointerEvent) => {
      if (dragState.type !== "dragging") return;
      const { instanceId, liveX, liveY } = dragState;
      onFixturesChange(
        fixtures.map((f) =>
          f.id === instanceId ? { ...f, x: liveX, y: liveY } : f
        )
      );
      setDragState({ type: "idle" });
    },
    [dragState, fixtures, onFixturesChange]
  );

  // ── Fixture click: select (no drag) ──────────────────────────────────────
  const handleFixtureClick = useCallback(
    (instanceId: string, e: React.MouseEvent) => {
      if (activeTool !== "select") return;
      e.stopPropagation();
      onSelectElement(selectedId === instanceId ? null : instanceId);
    },
    [activeTool, selectedId, onSelectElement]
  );

  // ── Resolve live position for rendering ───────────────────────────────────
  function livePos(instance: FixtureInstance): { x: number; y: number } {
    if (dragState.type === "dragging" && dragState.instanceId === instance.id) {
      return { x: dragState.liveX, y: dragState.liveY };
    }
    return { x: instance.x, y: instance.y };
  }

  // ── Render a single fixture shape ─────────────────────────────────────────
  function renderFixtureShape(
    def: FixtureDefinition,
    x: number,
    y: number,
    rotation: FixtureRotation,
    fill: string,
    stroke: string,
    opacity = 1
  ) {
    const cx = x + def.widthFt / 2;
    const cy = y + def.depthFt / 2;

    if (def.renderShape === "circle") {
      const r = Math.min(def.widthFt, def.depthFt) / 2;
      return (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={fixtureStroke}
          opacity={opacity}
        />
      );
    }

    return (
      <rect
        x={x}
        y={y}
        width={def.widthFt}
        height={def.depthFt}
        fill={fill}
        stroke={stroke}
        strokeWidth={fixtureStroke}
        rx={0.2 / scale}
        opacity={opacity}
        transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}
      />
    );
  }

  // ── Render fixture label ──────────────────────────────────────────────────
  function renderLabel(def: FixtureDefinition, x: number, y: number, rotation: FixtureRotation, color: string) {
    const cx = x + def.widthFt / 2;
    const cy = y + def.depthFt / 2;
    const shortName = def.name.split(" ")[0]; // first word only — keeps labels tidy
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill={color}
        fontFamily="system-ui, sans-serif"
        fontWeight="500"
        style={{ userSelect: "none", pointerEvents: "none" }}
        transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}
      >
        {shortName}
      </text>
    );
  }

  // ── Pending fixture placement preview ─────────────────────────────────────
  const pendingDef = pendingDefId ? catalog.find((d) => d.id === pendingDefId) : null;

  return (
    <g
      onPointerMove={handleBackgroundPointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handleBackgroundPointerLeave}
    >
      {/* Background hit target */}
      <rect
        x={0}
        y={0}
        width={floorWidthFt}
        height={floorHeightFt}
        fill="transparent"
        onClick={handleBackgroundClick}
        style={{
          cursor:
            activeTool === "place-fixture" && pendingDefId
              ? "crosshair"
              : "default",
        }}
      />

      {/* ── Placed fixtures ──────────────────────────────────────────────── */}
      {fixtures.map((instance) => {
        const def = catalog.find((d) => d.id === instance.fixtureDefId);
        if (!def) return null;

        const isSelected = instance.id === selectedId;
        const isDragging =
          dragState.type === "dragging" && dragState.instanceId === instance.id;
        const { x, y } = livePos(instance);
        const cx = x + def.widthFt / 2;
        const cy = y + def.depthFt / 2;
        const { vw, vh } = visualDims(def, instance.rotation);

        return (
          <g key={instance.id}>
            {/* Selection halo */}
            {isSelected && (
              <rect
                x={x - selectionHalo}
                y={y - selectionHalo}
                width={def.widthFt + selectionHalo * 2}
                height={def.depthFt + selectionHalo * 2}
                fill="none"
                stroke="hsl(217 91% 60%)"
                strokeWidth={selectionHalo}
                strokeOpacity={0.5}
                rx={selectionHalo}
                transform={instance.rotation !== 0 ? `rotate(${instance.rotation}, ${cx}, ${cy})` : undefined}
                style={{ pointerEvents: "none" }}
              />
            )}

            {/* Invisible wider hit target for easier clicking */}
            {def.renderShape === "circle" ? (
              <circle
                cx={cx}
                cy={cy}
                r={Math.min(def.widthFt, def.depthFt) / 2 + 4 / scale}
                fill="transparent"
                onPointerDown={(e) => handleFixturePointerDown(instance, e)}
                onClick={(e) => handleFixtureClick(instance.id, e)}
                style={{ cursor: activeTool === "select" ? (isSelected ? "move" : "pointer") : "default" }}
              />
            ) : (
              <rect
                x={x - 4 / scale}
                y={y - 4 / scale}
                width={def.widthFt + 8 / scale}
                height={def.depthFt + 8 / scale}
                fill="transparent"
                transform={instance.rotation !== 0 ? `rotate(${instance.rotation}, ${cx}, ${cy})` : undefined}
                onPointerDown={(e) => handleFixturePointerDown(instance, e)}
                onClick={(e) => handleFixtureClick(instance.id, e)}
                style={{ cursor: activeTool === "select" ? (isSelected ? "move" : "pointer") : "default" }}
              />
            )}

            {/* Visual shape */}
            {renderFixtureShape(
              def,
              x,
              y,
              instance.rotation,
              isSelected ? "hsl(217 30% 20%)" : "hsl(218 15% 17%)",
              isSelected ? "hsl(217 91% 60%)" : "hsl(218 12% 40%)",
              isDragging ? 0.7 : 1
            )}

            {/* Label */}
            {renderLabel(
              def,
              x,
              y,
              instance.rotation,
              isSelected ? "hsl(217 91% 80%)" : "hsl(218 12% 60%)"
            )}
          </g>
        );
      })}

      {/* ── Placement preview ─────────────────────────────────────────────── */}
      {pendingDef && hoverPt && (
        <g style={{ pointerEvents: "none" }}>
          {renderFixtureShape(
            pendingDef,
            hoverPt.x,
            hoverPt.y,
            pendingRotation,
            "hsl(217 91% 60% / 0.15)",
            "hsl(217 91% 65%)",
            0.8
          )}
        </g>
      )}
    </g>
  );
}
