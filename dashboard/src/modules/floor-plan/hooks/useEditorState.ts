/**
 * useEditorState.ts — Floor Plan Module
 *
 * Manages the editor's current interaction state:
 *   activeLayer  — which layer is being edited (1–4)
 *   activeTool   — which tool is selected within that layer
 *   selectedId   — the id of the currently selected element, or null
 *
 * Rules:
 *   - Switching layers resets the tool to "select" and clears the selection.
 *   - Tools are typed per-layer to prevent invalid combinations.
 */

import { useState } from "react";
import type { LayerId } from "../types";

// ── Tool types (scoped per layer) ─────────────────────────────────────────────

export type Layer1Tool = "select" | "draw-wall" | "place-room";
export type Layer2Tool = "select" | "place-fixture";
export type Layer3Tool = "select"; // clicking a fixture opens the assignment panel
export type Layer4Tool = "select" | "place-camera";

export type ActiveTool = Layer1Tool | Layer2Tool | Layer3Tool | Layer4Tool;

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_TOOL: ActiveTool = "select";

// ── State shape ───────────────────────────────────────────────────────────────

export interface EditorState {
  activeLayer: LayerId;
  activeTool: ActiveTool;
  selectedId: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEditorState() {
  const [activeLayer, setActiveLayerInternal] = useState<LayerId>(1);
  const [activeTool, setActiveTool] = useState<ActiveTool>(DEFAULT_TOOL);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /**
   * Switch to a different layer.
   * Resets activeTool to "select" and clears selectedId to avoid
   * carrying over stale state from the previous layer.
   */
  function setActiveLayer(layer: LayerId) {
    setActiveLayerInternal(layer);
    setActiveTool(DEFAULT_TOOL);
    setSelectedId(null);
  }

  return {
    activeLayer,
    activeTool,
    selectedId,
    setActiveLayer,
    setActiveTool,
    setSelectedId,
  };
}
