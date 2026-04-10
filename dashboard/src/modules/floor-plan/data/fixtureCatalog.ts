/**
 * fixtureCatalog.ts — Floor Plan Module
 *
 * Built-in catalog of FixtureDefinition objects for Eagle V stores.
 * These are the standard Plato's Closet and Style Encore physical fixtures.
 *
 * linearFootageFt: total hanging capacity in feet (null for non-hanging fixtures).
 * zones: subdivisions that can each receive a merchandising assignment in Layer 3.
 * snapBehavior: hint for placement snapping (used in Phase 4+).
 * renderShape: "rect" for rectangular fixtures, "circle" for round racks/spinners.
 */

import type { FixtureDefinition } from "../types";

export const FIXTURE_CATALOG: FixtureDefinition[] = [
  // ── Round / Spinner ──────────────────────────────────────────────────────────
  {
    id: "round-rack",
    name: "Round Rack",
    category: "rack",
    widthFt: 4,
    depthFt: 4,
    linearFootageFt: 10,
    zones: [{ id: "main", label: "Main", linearFootageFt: 10 }],
    snapBehavior: "free",
    renderShape: "circle",
  },
  {
    id: "accessory-spinner",
    name: "Accessory Spinner",
    category: "display",
    widthFt: 2,
    depthFt: 2,
    linearFootageFt: null,
    zones: [{ id: "main", label: "Main", linearFootageFt: null }],
    snapBehavior: "free",
    renderShape: "circle",
  },

  // ── 4-Way ────────────────────────────────────────────────────────────────────
  {
    id: "four-way-rack",
    name: "4-Way Rack",
    category: "rack",
    widthFt: 4,
    depthFt: 4,
    linearFootageFt: 8,
    zones: [
      { id: "arm-n", label: "North Arm", linearFootageFt: 2 },
      { id: "arm-e", label: "East Arm",  linearFootageFt: 2 },
      { id: "arm-s", label: "South Arm", linearFootageFt: 2 },
      { id: "arm-w", label: "West Arm",  linearFootageFt: 2 },
    ],
    snapBehavior: "free",
    renderShape: "rect",
  },

  // ── Straight racks ───────────────────────────────────────────────────────────
  {
    id: "straight-rack-4",
    name: "Straight Rack (4 ft)",
    category: "rack",
    widthFt: 4,
    depthFt: 1.5,
    linearFootageFt: 4,
    zones: [{ id: "main", label: "Main", linearFootageFt: 4 }],
    snapBehavior: "wall",
    renderShape: "rect",
  },
  {
    id: "straight-rack-6",
    name: "Straight Rack (6 ft)",
    category: "rack",
    widthFt: 6,
    depthFt: 1.5,
    linearFootageFt: 6,
    zones: [{ id: "main", label: "Main", linearFootageFt: 6 }],
    snapBehavior: "wall",
    renderShape: "rect",
  },
  {
    id: "double-bar-rack",
    name: "Double Bar Rack (4 ft)",
    category: "rack",
    widthFt: 4,
    depthFt: 2,
    linearFootageFt: 8,
    zones: [
      { id: "top",    label: "Top Bar",    linearFootageFt: 4 },
      { id: "bottom", label: "Bottom Bar", linearFootageFt: 4 },
    ],
    snapBehavior: "free",
    renderShape: "rect",
  },

  // ── Gondolas ─────────────────────────────────────────────────────────────────
  {
    id: "gondola-4",
    name: "Gondola (4 ft)",
    category: "gondola",
    widthFt: 4,
    depthFt: 1,
    linearFootageFt: null,
    zones: [{ id: "main", label: "Main", linearFootageFt: null }],
    snapBehavior: "wall",
    renderShape: "rect",
  },
  {
    id: "gondola-8",
    name: "Gondola (8 ft)",
    category: "gondola",
    widthFt: 8,
    depthFt: 1,
    linearFootageFt: null,
    zones: [{ id: "main", label: "Main", linearFootageFt: null }],
    snapBehavior: "wall",
    renderShape: "rect",
  },

  // ── Tables ───────────────────────────────────────────────────────────────────
  {
    id: "display-table",
    name: "Display Table (5 ft)",
    category: "table",
    widthFt: 5,
    depthFt: 2.5,
    linearFootageFt: null,
    zones: [{ id: "top", label: "Top", linearFootageFt: null }],
    snapBehavior: "free",
    renderShape: "rect",
  },
  {
    id: "folding-table-6",
    name: "Folding Table (6 ft)",
    category: "table",
    widthFt: 6,
    depthFt: 2.5,
    linearFootageFt: null,
    zones: [{ id: "top", label: "Top", linearFootageFt: null }],
    snapBehavior: "free",
    renderShape: "rect",
  },

  // ── Specialty ────────────────────────────────────────────────────────────────
  {
    id: "shoe-wall-4",
    name: "Shoe Wall (4 ft)",
    category: "rack",
    widthFt: 4,
    depthFt: 1.5,
    linearFootageFt: null,
    zones: [{ id: "main", label: "Main", linearFootageFt: null }],
    snapBehavior: "wall",
    renderShape: "rect",
  },
  {
    id: "cash-wrap",
    name: "Cash Wrap",
    category: "display",
    widthFt: 6,
    depthFt: 3,
    linearFootageFt: null,
    zones: [{ id: "counter", label: "Counter", linearFootageFt: null }],
    snapBehavior: "wall",
    renderShape: "rect",
  },
  {
    id: "donation-bin",
    name: "Donation Bin",
    category: "bin",
    widthFt: 2,
    depthFt: 2,
    linearFootageFt: null,
    zones: [{ id: "main", label: "Main", linearFootageFt: null }],
    snapBehavior: "free",
    renderShape: "rect",
  },
];

/** Look up a fixture definition by id. */
export function getFixtureDef(id: string): FixtureDefinition | undefined {
  return FIXTURE_CATALOG.find((f) => f.id === id);
}

/** Category display labels for the picker UI. */
export const CATEGORY_LABELS: Record<string, string> = {
  rack:     "Racks",
  gondola:  "Gondolas",
  table:    "Tables",
  display:  "Displays",
  bin:      "Bins",
};

/** All distinct categories in catalog order. */
export const CATALOG_CATEGORIES = ["rack", "gondola", "table", "display", "bin"] as const;
