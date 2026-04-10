/**
 * types.ts — Floor Plan Module
 *
 * Single source of truth for every TypeScript type used in this module.
 * All positions and dimensions are stored in real-world feet.
 * Pixels only exist at render time and are never persisted.
 */

// ── Shared primitives ─────────────────────────────────────────────────────────

export interface Point {
  x: number; // feet
  y: number; // feet
}

/** Which editing layer is currently active (1–4). */
export type LayerId = 1 | 2 | 3 | 4;

/**
 * The current viewport transform.
 * panX/panY are in SVG pixels. scale is pixels-per-foot.
 * All stored plan data remains in feet — this type only lives in render state.
 */
export interface ViewTransform {
  panX: number;   // SVG pixels
  panY: number;   // SVG pixels
  scale: number;  // pixels per foot
}

// ── Root document ─────────────────────────────────────────────────────────────

export interface StorePlan {
  storeId: string;
  schemaVersion: 1;
  updatedAt: string;  // ISO timestamp
  updatedBy: string;  // userId
  baseLayout: BaseLayout;
  fixtures: FixtureInstance[];
  merchandising: MerchandisingPlan;
  cameras: CameraInstance[];
}

// ── Layer 1: Base Layout ──────────────────────────────────────────────────────

export interface BaseLayout {
  floorWidthFt: number;
  floorHeightFt: number;
  walls: WallSegment[];
  rooms: RoomShape[];
}

export interface WallSegment {
  id: string;
  x1: number;          // start point, feet
  y1: number;
  x2: number;          // end point, feet
  y2: number;
  thicknessFt: number;
}

export type RoomType =
  | "sales_floor"
  | "cash_wrap"
  | "back_room"
  | "office"
  | "bathroom"
  | "fitting_room"
  | "custom";

export interface RoomShape {
  id: string;
  type: RoomType;
  label: string;     // user-editable display name
  x: number;        // top-left corner, feet
  y: number;
  widthFt: number;
  heightFt: number;
}

// ── Layer 2: Fixtures ─────────────────────────────────────────────────────────

export type FixtureRotation = 0 | 90 | 180 | 270;
export type FixtureCategory = "rack" | "table" | "display" | "gondola" | "bin";
export type SnapBehavior = "wall" | "fixture" | "free";
export type RenderShape = "circle" | "rect";

export interface ZoneDefinition {
  id: string;
  label: string;              // e.g., "Front", "Back", "Level 1", "Level 2"
  linearFootageFt: number | null;
}

export interface FixtureDefinition {
  id: string;
  name: string;
  category: FixtureCategory;
  widthFt: number;
  depthFt: number;            // depth in natural (0°) orientation
  linearFootageFt: number | null;
  zones: ZoneDefinition[];    // one-to-many merchandisable sections
  snapBehavior: SnapBehavior;
  renderShape: RenderShape;
}

export interface FixtureInstance {
  id: string;
  fixtureDefId: string;  // references FixtureDefinition.id — never duplicates it
  x: number;             // top-left of bounding box, feet
  y: number;
  rotation: FixtureRotation;
}

// ── Layer 3: Merchandising ────────────────────────────────────────────────────

export type MerchandisingColorMode = "gender" | "season" | "subcategory";

export interface MerchandisingAssignment {
  fixtureInstanceId: string;
  zoneId: string;            // references ZoneDefinition.id on the fixture's definition
  subcategoryId: string | null;
}

export interface MerchandisingPlan {
  colorMode: MerchandisingColorMode;
  assignments: MerchandisingAssignment[];
}

// ── Layer 4: Cameras ──────────────────────────────────────────────────────────

export type CameraType = "standard" | "zoom";

export interface CameraInstance {
  id: string;
  type: CameraType;
  name: string;                  // user-entered — never auto-generated
  identifier: string | null;     // optional label or number
  mountingHeightFt: number | null;
  x: number;                     // position, feet
  y: number;
  directionDeg: number;          // 0 = east, increases clockwise; range 0–359
  fovDeg: number;                // cone spread in degrees (e.g., 90 for wide-angle)
  rangeFt: number;               // coverage range in feet
}

// ── Versioning / Publishing ───────────────────────────────────────────────────
//
// Saving edits  → updates the working plan in place (POST /api/floor-plans/:storeId)
// Publishing    → creates a named snapshot (POST /api/floor-plans/:storeId/versions)
// Marking live  → sets wentLiveAt on a version (PATCH /api/floor-plans/:storeId/versions/:id)

export interface FloorPlanVersion {
  id: string;
  storeId: string;
  name: string;               // user-named, e.g., "Spring 2026 Floor Set"
  publishedAt: string;        // ISO timestamp of when it was published
  publishedBy: string;        // userId
  wentLiveAt: string | null;  // set when the floor set actually went live in store
  plan: StorePlan;            // full snapshot of the plan at publish time
}

// ── Persisted file shape  (data/floor-plans/{storeId}.json) ───────────────────

export interface StorePlanFile {
  plan: StorePlan;
  versions: FloorPlanVersion[];
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface LoadPlanResponse {
  plan: StorePlan;
  versions: FloorPlanVersion[];
}

export interface SavePlanResponse {
  ok: true;
  plan: StorePlan;
}

export interface PublishVersionResponse {
  ok: true;
  version: FloorPlanVersion;
}

export interface SetVersionLiveResponse {
  ok: true;
  version: FloorPlanVersion;
}
