/**
 * FloorPlanPage.tsx — Floor Plan Module
 *
 * Page entry point. Manages:
 *   - Store selection
 *   - Working plan state + dirty tracking
 *   - Layer tabs
 *   - Per-layer toolbar, canvas, and right panel
 *   - Global Delete key handler
 *   - Save flow
 */

import { useState, useEffect, useCallback } from "react";
import { Map } from "lucide-react";
import { StoreSelector } from "./components/StoreSelector";
import { Toolbar } from "./components/Toolbar";
import { BaseLayoutPanel } from "./components/panels/BaseLayoutPanel";
import { FixturePicker } from "./components/FixturePicker";
import { FixturesPanel } from "./components/panels/FixturesPanel";
import { FloorPlanCanvas } from "./canvas/FloorPlanCanvas";
import { useFloorPlan, useSavePlan } from "./hooks/useFloorPlan";
import { useEditorState } from "./hooks/useEditorState";
import { FLOOR_PLAN_STORES } from "./data/storeDefaults";
import { FIXTURE_CATALOG } from "./data/fixtureCatalog";
import { useAuth } from "@/contexts/AuthContext";
import type { StorePlan, BaseLayout, FixtureInstance, FixtureRotation, LayerId } from "./types";

// ── Layer tab metadata ────────────────────────────────────────────────────────

const LAYERS: { id: LayerId; label: string; description: string }[] = [
  { id: 1, label: "Base Layout",   description: "Walls & rooms" },
  { id: 2, label: "Fixtures",      description: "Rack placement" },
  { id: 3, label: "Merchandising", description: "Category assignments" },
  { id: 4, label: "Cameras",       description: "Coverage mapping" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FloorPlanPage() {
  const [storeId, setStoreId] = useState(FLOOR_PLAN_STORES[0].storeId);
  const editor = useEditorState();
  const { data, isLoading, isError } = useFloorPlan(storeId);
  const savePlan = useSavePlan(storeId);
  const { user } = useAuth();

  // ── Working plan state ────────────────────────────────────────────────────
  const [workingPlan, setWorkingPlan] = useState<StorePlan | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (data?.plan) {
      setWorkingPlan(data.plan);
      setIsDirty(false);
    }
  }, [data?.plan]);

  // ── Layer 2 fixture placement state ──────────────────────────────────────
  const [pendingDefId, setPendingDefId] = useState<string | null>(null);
  const [pendingRotation, setPendingRotation] = useState<FixtureRotation>(0);

  // Pre-select first fixture def when entering place-fixture mode
  useEffect(() => {
    if (editor.activeTool === "place-fixture" && !pendingDefId) {
      setPendingDefId(FIXTURE_CATALOG[0]?.id ?? null);
    }
  }, [editor.activeTool, pendingDefId]);

  // ── Permissions ───────────────────────────────────────────────────────────
  const canEdit = user?.tier === "admin";

  // ── Store change ──────────────────────────────────────────────────────────
  function handleStoreChange(id: string) {
    setStoreId(id);
    editor.setActiveLayer(1);
    setWorkingPlan(null);
    setIsDirty(false);
  }

  // ── Plan mutation handlers ────────────────────────────────────────────────
  const handleBaseLayoutChange = useCallback((layout: BaseLayout) => {
    setWorkingPlan((prev) => prev ? { ...prev, baseLayout: layout } : null);
    setIsDirty(true);
  }, []);

  const handleFixturesChange = useCallback((fixtures: FixtureInstance[]) => {
    setWorkingPlan((prev) => prev ? { ...prev, fixtures } : null);
    setIsDirty(true);
  }, []);

  const handleFixtureRotate = useCallback(
    (instanceId: string, rotation: FixtureRotation) => {
      setWorkingPlan((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          fixtures: prev.fixtures.map((f) =>
            f.id === instanceId ? { ...f, rotation } : f
          ),
        };
      });
      setIsDirty(true);
    },
    []
  );

  function handleSave() {
    if (!workingPlan || !isDirty) return;
    savePlan.mutate(workingPlan, { onSuccess: () => setIsDirty(false) });
  }

  // ── Delete selected element ───────────────────────────────────────────────
  const handleDeleteSelected = useCallback(() => {
    if (!editor.selectedId || !workingPlan) return;
    const id = editor.selectedId;

    if (editor.activeLayer === 1) {
      const { walls, rooms } = workingPlan.baseLayout;
      const newWalls = walls.filter((w) => w.id !== id);
      const newRooms = rooms.filter((r) => r.id !== id);
      if (newWalls.length !== walls.length || newRooms.length !== rooms.length) {
        handleBaseLayoutChange({ ...workingPlan.baseLayout, walls: newWalls, rooms: newRooms });
        editor.setSelectedId(null);
      }
    } else if (editor.activeLayer === 2) {
      const newFixtures = workingPlan.fixtures.filter((f) => f.id !== id);
      if (newFixtures.length !== workingPlan.fixtures.length) {
        handleFixturesChange(newFixtures);
        editor.setSelectedId(null);
      }
    }
  }, [editor, workingPlan, handleBaseLayoutChange, handleFixturesChange]);

  // ── Global Delete / Backspace key ────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.key === "Delete" || e.key === "Backspace") && canEdit) {
        handleDeleteSelected();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canEdit, handleDeleteSelected]);

  // ── Derived: which right panel to show ───────────────────────────────────
  const showLayer1Panel = workingPlan && editor.activeLayer === 1;
  const showFixturePicker = workingPlan && editor.activeLayer === 2 && editor.activeTool === "place-fixture";
  const showFixturesPanel = workingPlan && editor.activeLayer === 2 && editor.activeTool === "select";

  const selectedFixtureInstance =
    workingPlan && editor.selectedId
      ? workingPlan.fixtures.find((f) => f.id === editor.selectedId) ?? null
      : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full -mx-6 -my-8 md:-mx-10 md:-my-10 lg:-mx-14">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border/50 bg-card shrink-0 flex-wrap">
        <Map className="h-4 w-4 text-primary shrink-0" />
        <h1 className="text-base font-bold tracking-tight">Floor Plan</h1>

        <div className="w-px h-4 bg-border/50" />

        <StoreSelector value={storeId} onChange={handleStoreChange} disabled={isLoading} />

        {isLoading && <span className="text-[11px] text-muted-foreground">Loading…</span>}
        {isError && <span className="text-[11px] text-destructive">Failed to load plan</span>}
        {workingPlan && !isLoading && !isDirty && (
          <span className="text-[11px] text-muted-foreground">
            Last saved {new Date(workingPlan.updatedAt).toLocaleDateString()}
          </span>
        )}
        {isDirty && <span className="text-[11px] text-amber-400">Unsaved changes</span>}

        <div className="flex-1" />

        <button
          onClick={handleSave}
          disabled={!isDirty || savePlan.isPending}
          className={[
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium transition-opacity",
            !isDirty || savePlan.isPending ? "opacity-40 cursor-not-allowed" : "opacity-100",
          ].join(" ")}
        >
          {savePlan.isPending ? "Saving…" : "Save"}
        </button>
      </div>

      {/* ── Layer tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 px-4 border-b border-border/50 bg-card shrink-0">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => editor.setActiveLayer(layer.id)}
            className={[
              "flex flex-col items-start px-4 py-2.5 text-left transition-colors border-b-2",
              editor.activeLayer === layer.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            ].join(" ")}
          >
            <span className="text-[12px] font-semibold leading-none">
              {layer.id}. {layer.label}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">
              {layer.description}
            </span>
          </button>
        ))}
      </div>

      {/* ── Editor area ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
              <span className="text-sm">Loading floor plan…</span>
            </div>
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-destructive">Could not load plan for this store.</p>
          </div>
        ) : workingPlan ? (
          <>
            {/* Toolbar — Layer 1 and 2 */}
            {(editor.activeLayer === 1 || editor.activeLayer === 2) && (
              <Toolbar
                activeLayer={editor.activeLayer}
                activeTool={editor.activeTool}
                selectedId={editor.selectedId}
                canEdit={canEdit}
                onToolChange={editor.setActiveTool}
                onDelete={handleDeleteSelected}
              />
            )}

            {/* Canvas */}
            <div className="flex-1 relative min-w-0">
              <FloorPlanCanvas
                plan={workingPlan}
                activeLayer={editor.activeLayer}
                activeTool={editor.activeTool}
                selectedId={editor.selectedId}
                canEdit={canEdit}
                pendingDefId={pendingDefId}
                pendingRotation={pendingRotation}
                onSelectElement={editor.setSelectedId}
                onBaseLayoutChange={handleBaseLayoutChange}
                onFixturesChange={handleFixturesChange}
              />
            </div>

            {/* Right panel */}
            {showLayer1Panel && (
              <BaseLayoutPanel
                baseLayout={workingPlan.baseLayout}
                selectedId={editor.selectedId}
                canEdit={canEdit}
                onLayoutChange={handleBaseLayoutChange}
              />
            )}
            {showFixturePicker && (
              <FixturePicker
                pendingDefId={pendingDefId}
                pendingRotation={pendingRotation}
                onPickDef={setPendingDefId}
                onSetRotation={setPendingRotation}
              />
            )}
            {showFixturesPanel && (
              <FixturesPanel
                selectedInstance={selectedFixtureInstance}
                catalog={FIXTURE_CATALOG}
                canEdit={canEdit}
                onRotate={handleFixtureRotate}
              />
            )}
          </>
        ) : null}
      </div>

    </div>
  );
}
