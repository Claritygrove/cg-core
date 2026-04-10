/**
 * Toolbar.tsx — Floor Plan Module
 *
 * Left-side tool palette. Renders the appropriate tool buttons per active layer.
 *
 * Layer 1: Select · Draw Wall · Place Room
 * Layer 2: Select · Place Fixture
 *
 * Delete button is layer-agnostic — appears when something is selected.
 * Edit-only tools are disabled (not hidden) for non-admin users.
 */

import { MousePointer2, Pencil, Square, Package, Trash2 } from "lucide-react";
import type { LayerId } from "../types";
import type { ActiveTool } from "../hooks/useEditorState";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ToolbarProps {
  activeLayer: LayerId;
  activeTool: ActiveTool;
  selectedId: string | null;
  canEdit: boolean;
  onToolChange: (tool: ActiveTool) => void;
  onDelete: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Toolbar({
  activeLayer,
  activeTool,
  selectedId,
  canEdit,
  onToolChange,
  onDelete,
}: ToolbarProps) {
  const btn = (
    tool: ActiveTool,
    icon: React.ReactNode,
    label: string,
    disabled = false
  ) => (
    <button
      key={tool}
      title={label}
      disabled={disabled}
      onClick={() => !disabled && onToolChange(tool)}
      className={[
        "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
        activeTool === tool
          ? "bg-primary text-primary-foreground"
          : disabled
          ? "text-muted-foreground/30 cursor-not-allowed"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      ].join(" ")}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col gap-1 p-1.5 bg-card border-r border-border/50 shrink-0">

      {/* ── Layer 1 tools ──────────────────────────────────────────────── */}
      {activeLayer === 1 && (
        <>
          {btn("select",     <MousePointer2 className="h-4 w-4" />, "Select")}
          {btn("draw-wall",  <Pencil className="h-4 w-4" />,
            canEdit ? "Draw Wall" : "Draw Wall — admin only", !canEdit)}
          {btn("place-room", <Square className="h-4 w-4" />,
            canEdit ? "Place Room" : "Place Room — admin only", !canEdit)}
        </>
      )}

      {/* ── Layer 2 tools ──────────────────────────────────────────────── */}
      {activeLayer === 2 && (
        <>
          {btn("select",        <MousePointer2 className="h-4 w-4" />, "Select")}
          {btn("place-fixture", <Package className="h-4 w-4" />,
            canEdit ? "Place Fixture" : "Place Fixture — admin only", !canEdit)}
        </>
      )}

      {/* ── Separator ──────────────────────────────────────────────────── */}
      <div className="w-full h-px bg-border/50 my-0.5" />

      {/* ── Delete (all layers) ────────────────────────────────────────── */}
      <button
        title="Delete selected (Del)"
        disabled={!selectedId || !canEdit}
        onClick={onDelete}
        className={[
          "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
          selectedId && canEdit
            ? "text-destructive hover:bg-destructive/10"
            : "text-muted-foreground/30 cursor-not-allowed",
        ].join(" ")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
