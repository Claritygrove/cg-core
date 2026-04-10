/**
 * FloorPlanCanvas.tsx — Floor Plan Module
 *
 * SVG viewport for the floor plan editor.
 *
 * Layer rendering order (bottom → top):
 *   1. Base Layout  — walls, rooms
 *   2. Fixtures     — placed rack/table/etc instances
 *   3. Merchandising — subcategory color overlays  (Phase 5)
 *   4. Cameras      — placement icons + FOV cones  (Phase 6)
 *
 * Only the active layer group has pointerEvents="auto".
 * All other layers have pointerEvents="none" (visible but locked).
 *
 * Visibility rules:
 *   Layer 1 active: grid visible, base layout editable
 *   Layer 2 active: base layout locked, fixtures editable
 *   Layer 3 active: base + fixtures locked, merch editable, cameras hidden
 *   Layer 4 active: all locked, cameras editable
 */

import { useRef } from "react";
import type {
  StorePlan,
  BaseLayout,
  FixtureInstance,
  FixtureRotation,
  LayerId,
} from "../types";
import type { ActiveTool } from "../hooks/useEditorState";
import { useZoomPan } from "../hooks/useZoomPan";
import { GridOverlay } from "./GridOverlay";
import { BaseLayoutLayer } from "./layers/BaseLayoutLayer";
import { FixturesLayer } from "./layers/FixturesLayer";
import { FIXTURE_CATALOG } from "../data/fixtureCatalog";

// ── Props ─────────────────────────────────────────────────────────────────────

interface FloorPlanCanvasProps {
  plan: StorePlan;
  activeLayer: LayerId;
  activeTool: ActiveTool;
  selectedId: string | null;
  canEdit: boolean;
  // Layer 2 placement state
  pendingDefId: string | null;
  pendingRotation: FixtureRotation;
  onSelectElement: (id: string | null) => void;
  onBaseLayoutChange: (layout: BaseLayout) => void;
  onFixturesChange: (fixtures: FixtureInstance[]) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FloorPlanCanvas({
  plan,
  activeLayer,
  activeTool,
  selectedId,
  canEdit,
  pendingDefId,
  pendingRotation,
  onSelectElement,
  onBaseLayoutChange,
  onFixturesChange,
}: FloorPlanCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { transform, cursor, onPointerDown, onPointerMove, onPointerUp } =
    useZoomPan(svgRef);

  const { floorWidthFt, floorHeightFt } = plan.baseLayout;
  const { panX, panY, scale } = transform;

  const boundaryStroke = 2 / scale;
  const showCameras = activeLayer === 4;
  const showMerch = activeLayer >= 3;
  const showFixtures = activeLayer >= 2;

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      style={{ display: "block", cursor, background: "hsl(218 15% 7%)" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <g transform={`translate(${panX}, ${panY}) scale(${scale})`}>

        {/* Floor background */}
        <rect x={0} y={0} width={floorWidthFt} height={floorHeightFt} fill="hsl(218 15% 9%)" />

        {/* Grid — Layer 1 only */}
        {activeLayer === 1 && (
          <GridOverlay floorWidthFt={floorWidthFt} floorHeightFt={floorHeightFt} scale={scale} />
        )}

        {/* Floor boundary */}
        <rect
          x={0} y={0} width={floorWidthFt} height={floorHeightFt}
          fill="none" stroke="hsl(218 12% 45%)" strokeWidth={boundaryStroke}
        />

        {/* ── Layer 1: Base Layout ──────────────────────────────────────── */}
        <g pointerEvents={activeLayer === 1 ? "auto" : "none"}>
          <BaseLayoutLayer
            baseLayout={plan.baseLayout}
            activeTool={activeTool}
            selectedId={selectedId}
            svgRef={svgRef}
            transform={transform}
            canEdit={canEdit && activeLayer === 1}
            onLayoutChange={onBaseLayoutChange}
            onSelectElement={onSelectElement}
          />
        </g>

        {/* ── Layer 2: Fixtures ─────────────────────────────────────────── */}
        {showFixtures && (
          <g pointerEvents={activeLayer === 2 ? "auto" : "none"}>
            <FixturesLayer
              fixtures={plan.fixtures}
              catalog={FIXTURE_CATALOG}
              activeTool={activeTool}
              selectedId={selectedId}
              pendingDefId={pendingDefId}
              pendingRotation={pendingRotation}
              floorWidthFt={floorWidthFt}
              floorHeightFt={floorHeightFt}
              svgRef={svgRef}
              transform={transform}
              canEdit={canEdit && activeLayer === 2}
              onFixturesChange={onFixturesChange}
              onSelectElement={onSelectElement}
            />
          </g>
        )}

        {/* ── Layer 3: Merchandising ────────────────────────────────────── */}
        {showMerch && (
          <g pointerEvents={activeLayer === 3 ? "auto" : "none"}>
            {/* Phase 5 */}
          </g>
        )}

        {/* ── Layer 4: Cameras ──────────────────────────────────────────── */}
        {showCameras && (
          <g pointerEvents="auto">
            {/* Phase 6 */}
          </g>
        )}

      </g>
    </svg>
  );
}
