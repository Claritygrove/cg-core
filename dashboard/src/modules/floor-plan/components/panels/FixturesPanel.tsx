/**
 * FixturesPanel.tsx — Floor Plan Module
 *
 * Right-side properties panel for Layer 2 (Fixtures).
 * Shown when the select tool is active on Layer 2.
 *
 * Nothing selected → hint text
 * Fixture selected → name, dimensions, position, rotation controls, zone list
 */

import { RotateCcw, RotateCw } from "lucide-react";
import type { FixtureInstance, FixtureDefinition, FixtureRotation } from "../../types";

// ── Rotation helpers ──────────────────────────────────────────────────────────

const ROTATIONS: FixtureRotation[] = [0, 90, 180, 270];

function rotateCW(r: FixtureRotation): FixtureRotation {
  return ROTATIONS[(ROTATIONS.indexOf(r) + 1) % 4];
}
function rotateCCW(r: FixtureRotation): FixtureRotation {
  return ROTATIONS[(ROTATIONS.indexOf(r) + 3) % 4];
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function PanelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}

function ReadValue({ value }: { value: string }) {
  return <span className="text-[13px] text-foreground font-medium">{value}</span>;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface FixturesPanelProps {
  selectedInstance: FixtureInstance | null;
  catalog: FixtureDefinition[];
  canEdit: boolean;
  onRotate: (instanceId: string, rotation: FixtureRotation) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FixturesPanel({
  selectedInstance,
  catalog,
  canEdit,
  onRotate,
}: FixturesPanelProps) {
  const def = selectedInstance
    ? catalog.find((d) => d.id === selectedInstance.fixtureDefId) ?? null
    : null;

  return (
    <div className="w-56 shrink-0 bg-card border-l border-border/50 overflow-y-auto">
      <div className="p-4 flex flex-col gap-5">

        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {def ? "Fixture" : "Fixtures"}
          </h2>
        </div>

        {!def && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Select a fixture to view its properties.
            {canEdit && " Drag to reposition."}
          </p>
        )}

        {def && selectedInstance && (
          <>
            <PanelRow label="Type">
              <ReadValue value={def.name} />
            </PanelRow>

            <PanelRow label="Size">
              <ReadValue value={`${def.widthFt} × ${def.depthFt} ft`} />
            </PanelRow>

            {def.linearFootageFt != null && (
              <PanelRow label="Linear Footage">
                <ReadValue value={`${def.linearFootageFt} ft`} />
              </PanelRow>
            )}

            <PanelRow label="Position">
              <ReadValue
                value={`(${selectedInstance.x.toFixed(1)}, ${selectedInstance.y.toFixed(1)})`}
              />
            </PanelRow>

            <PanelRow label="Rotation">
              {canEdit ? (
                <div className="flex items-center gap-2">
                  <button
                    title="Rotate counter-clockwise"
                    onClick={() =>
                      onRotate(selectedInstance.id, rotateCCW(selectedInstance.rotation))
                    }
                    className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <span className="flex-1 text-center text-[12px] font-medium text-foreground">
                    {selectedInstance.rotation}°
                  </span>
                  <button
                    title="Rotate clockwise"
                    onClick={() =>
                      onRotate(selectedInstance.id, rotateCW(selectedInstance.rotation))
                    }
                    className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <ReadValue value={`${selectedInstance.rotation}°`} />
              )}
            </PanelRow>

            {def.zones.length > 1 && (
              <PanelRow label="Zones">
                <div className="flex flex-col gap-0.5">
                  {def.zones.map((z) => (
                    <span key={z.id} className="text-[11px] text-muted-foreground">
                      {z.label}
                      {z.linearFootageFt != null ? ` · ${z.linearFootageFt} LF` : ""}
                    </span>
                  ))}
                </div>
              </PanelRow>
            )}
          </>
        )}

      </div>
    </div>
  );
}
