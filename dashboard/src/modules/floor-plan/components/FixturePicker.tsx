/**
 * FixturePicker.tsx — Floor Plan Module
 *
 * Right-panel catalog shown when the "Place Fixture" tool is active.
 * Lists all fixture definitions grouped by category.
 * Clicking a fixture selects it as the pending fixture to place.
 * The selected fixture is highlighted.
 *
 * Also shows rotation controls so the user can orient the fixture
 * before clicking to place it.
 */

import { RotateCcw, RotateCw } from "lucide-react";
import type { FixtureDefinition, FixtureRotation } from "../types";
import { FIXTURE_CATALOG, CATALOG_CATEGORIES, CATEGORY_LABELS } from "../data/fixtureCatalog";

// ── Props ─────────────────────────────────────────────────────────────────────

interface FixturePickerProps {
  pendingDefId: string | null;
  pendingRotation: FixtureRotation;
  onPickDef: (defId: string) => void;
  onSetRotation: (rotation: FixtureRotation) => void;
}

// ── Rotation helpers ──────────────────────────────────────────────────────────

const ROTATIONS: FixtureRotation[] = [0, 90, 180, 270];

function rotateCW(r: FixtureRotation): FixtureRotation {
  const i = ROTATIONS.indexOf(r);
  return ROTATIONS[(i + 1) % 4];
}

function rotateCCW(r: FixtureRotation): FixtureRotation {
  const i = ROTATIONS.indexOf(r);
  return ROTATIONS[(i + 3) % 4];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FixturePicker({
  pendingDefId,
  pendingRotation,
  onPickDef,
  onSetRotation,
}: FixturePickerProps) {
  const pendingDef = pendingDefId
    ? FIXTURE_CATALOG.find((d) => d.id === pendingDefId)
    : null;

  return (
    <div className="w-56 shrink-0 bg-card border-l border-border/50 overflow-y-auto">
      <div className="p-4 flex flex-col gap-4">
        {/* ── Heading ──────────────────────────────────────────────── */}
        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Fixture Catalog
          </h2>
          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
            Pick a fixture, then click the floor to place it.
          </p>
        </div>

        {/* ── Rotation controls (visible once a def is selected) ────ーー */}
        {pendingDef && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Rotation
            </span>
            <div className="flex items-center gap-2">
              <button
                title="Rotate counter-clockwise"
                onClick={() => onSetRotation(rotateCCW(pendingRotation))}
                className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <span className="flex-1 text-center text-[12px] font-medium text-foreground">
                {pendingRotation}°
              </span>
              <button
                title="Rotate clockwise"
                onClick={() => onSetRotation(rotateCW(pendingRotation))}
                className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Catalog grouped by category ───────────────────────────── */}
        {CATALOG_CATEGORIES.map((cat) => {
          const defs = FIXTURE_CATALOG.filter((d) => d.category === cat);
          if (defs.length === 0) return null;
          return (
            <div key={cat} className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {CATEGORY_LABELS[cat]}
              </span>
              {defs.map((def) => (
                <FixtureRow
                  key={def.id}
                  def={def}
                  isSelected={def.id === pendingDefId}
                  onClick={() => onPickDef(def.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fixture row ───────────────────────────────────────────────────────────────

function FixtureRow({
  def,
  isSelected,
  onClick,
}: {
  def: FixtureDefinition;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-col items-start w-full px-2.5 py-2 rounded-md text-left transition-colors",
        isSelected
          ? "bg-primary/15 border border-primary/40 text-foreground"
          : "bg-muted/40 border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
      ].join(" ")}
    >
      <span className="text-[12px] font-medium leading-none">{def.name}</span>
      <span className="text-[10px] mt-0.5 leading-none">
        {def.widthFt} × {def.depthFt} ft
        {def.linearFootageFt != null && ` · ${def.linearFootageFt} LF`}
      </span>
    </button>
  );
}
