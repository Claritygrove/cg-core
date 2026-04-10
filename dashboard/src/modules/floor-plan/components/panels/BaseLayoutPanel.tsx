/**
 * BaseLayoutPanel.tsx — Floor Plan Module
 *
 * Right-side properties panel for Layer 1 (Base Layout).
 *
 * Three states:
 *   Nothing selected   → shows floor dimensions (read-only)
 *   Wall selected      → shows wall length (read-only) and thickness (editable)
 *   Room selected      → shows room type selector, label input, and dimensions
 *
 * All edits call onLayoutChange with the updated BaseLayout.
 */

import type { BaseLayout, WallSegment, RoomShape, RoomType } from "../../types";
import { distance } from "../../utils/geometry";

// ── Room type options ─────────────────────────────────────────────────────────

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "sales_floor",  label: "Sales Floor" },
  { value: "cash_wrap",    label: "Cash Wrap" },
  { value: "back_room",    label: "Back Room" },
  { value: "office",       label: "Office" },
  { value: "bathroom",     label: "Bathroom" },
  { value: "fitting_room", label: "Fitting Room" },
  { value: "custom",       label: "Custom" },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface BaseLayoutPanelProps {
  baseLayout: BaseLayout;
  selectedId: string | null;
  canEdit: boolean;
  onLayoutChange: (layout: BaseLayout) => void;
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function PanelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      {children}
    </div>
  );
}

function ReadValue({ value }: { value: string }) {
  return (
    <span className="text-[13px] text-foreground font-medium">{value}</span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BaseLayoutPanel({
  baseLayout,
  selectedId,
  canEdit,
  onLayoutChange,
}: BaseLayoutPanelProps) {
  const { walls, rooms, floorWidthFt, floorHeightFt } = baseLayout;

  const selectedWall = selectedId
    ? walls.find((w) => w.id === selectedId) ?? null
    : null;
  const selectedRoom = selectedId
    ? rooms.find((r) => r.id === selectedId) ?? null
    : null;

  // ── Wall thickness update ────────────────────────────────────────────────
  function handleWallThickness(wall: WallSegment, value: string) {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed <= 0) return;
    const updated: WallSegment = { ...wall, thicknessFt: parsed };
    onLayoutChange({
      ...baseLayout,
      walls: walls.map((w) => (w.id === wall.id ? updated : w)),
    });
  }

  // ── Room label update ────────────────────────────────────────────────────
  function handleRoomLabel(room: RoomShape, value: string) {
    const updated: RoomShape = { ...room, label: value };
    onLayoutChange({
      ...baseLayout,
      rooms: rooms.map((r) => (r.id === room.id ? updated : r)),
    });
  }

  // ── Room type update ─────────────────────────────────────────────────────
  function handleRoomType(room: RoomShape, value: RoomType) {
    const updated: RoomShape = { ...room, type: value };
    onLayoutChange({
      ...baseLayout,
      rooms: rooms.map((r) => (r.id === room.id ? updated : r)),
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-56 shrink-0 bg-card border-l border-border/50 overflow-y-auto">
      <div className="p-4 flex flex-col gap-5">

        {/* ── Panel heading ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {selectedWall
              ? "Wall"
              : selectedRoom
              ? "Room"
              : "Floor"}
          </h2>
        </div>

        {/* ── No selection — floor dimensions ──────────────────────── */}
        {!selectedWall && !selectedRoom && (
          <>
            <PanelRow label="Width">
              <ReadValue value={`${floorWidthFt} ft`} />
            </PanelRow>
            <PanelRow label="Depth">
              <ReadValue value={`${floorHeightFt} ft`} />
            </PanelRow>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Select a wall or room to view its properties.
            </p>
          </>
        )}

        {/* ── Wall selected ─────────────────────────────────────────── */}
        {selectedWall && (
          <>
            <PanelRow label="Length">
              <ReadValue
                value={`${distance(
                  { x: selectedWall.x1, y: selectedWall.y1 },
                  { x: selectedWall.x2, y: selectedWall.y2 }
                ).toFixed(1)} ft`}
              />
            </PanelRow>

            <PanelRow label="Thickness (ft)">
              {canEdit ? (
                <input
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  defaultValue={selectedWall.thicknessFt}
                  key={selectedWall.id} // reset when selection changes
                  onBlur={(e) => handleWallThickness(selectedWall, e.target.value)}
                  className="w-full px-2 py-1 rounded-md bg-muted text-[13px] text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <ReadValue value={`${selectedWall.thicknessFt} ft`} />
              )}
            </PanelRow>

            <PanelRow label="Start">
              <ReadValue
                value={`(${selectedWall.x1.toFixed(1)}, ${selectedWall.y1.toFixed(1)})`}
              />
            </PanelRow>
            <PanelRow label="End">
              <ReadValue
                value={`(${selectedWall.x2.toFixed(1)}, ${selectedWall.y2.toFixed(1)})`}
              />
            </PanelRow>
          </>
        )}

        {/* ── Room selected ─────────────────────────────────────────── */}
        {selectedRoom && (
          <>
            <PanelRow label="Type">
              {canEdit ? (
                <select
                  value={selectedRoom.type}
                  key={`type-${selectedRoom.id}`}
                  onChange={(e) =>
                    handleRoomType(selectedRoom, e.target.value as RoomType)
                  }
                  className="w-full px-2 py-1 rounded-md bg-muted text-[13px] text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ROOM_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>
                      {rt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <ReadValue
                  value={
                    ROOM_TYPES.find((rt) => rt.value === selectedRoom.type)
                      ?.label ?? selectedRoom.type
                  }
                />
              )}
            </PanelRow>

            <PanelRow label="Label">
              {canEdit ? (
                <input
                  type="text"
                  defaultValue={selectedRoom.label}
                  key={`label-${selectedRoom.id}`}
                  onBlur={(e) => handleRoomLabel(selectedRoom, e.target.value)}
                  className="w-full px-2 py-1 rounded-md bg-muted text-[13px] text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <ReadValue value={selectedRoom.label} />
              )}
            </PanelRow>

            <PanelRow label="Width">
              <ReadValue value={`${selectedRoom.widthFt.toFixed(1)} ft`} />
            </PanelRow>
            <PanelRow label="Depth">
              <ReadValue value={`${selectedRoom.heightFt.toFixed(1)} ft`} />
            </PanelRow>
            <PanelRow label="Position">
              <ReadValue
                value={`(${selectedRoom.x.toFixed(1)}, ${selectedRoom.y.toFixed(1)})`}
              />
            </PanelRow>
          </>
        )}

      </div>
    </div>
  );
}
