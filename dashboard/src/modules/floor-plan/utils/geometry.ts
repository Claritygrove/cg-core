/**
 * geometry.ts — Floor Plan Module
 *
 * Pure geometric primitives for world-space (feet) calculations.
 * No DOM access, no rendering concerns. All inputs and outputs are in feet.
 *
 * Used by: snapping logic, hit testing, wall drawing, FOV calculations.
 */

import type { Point } from "../types";

// ── Distance ──────────────────────────────────────────────────────────────────

/** Euclidean distance between two world-space points (feet). */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Shortest distance from point P to line segment A→B (feet).
 * Returns the perpendicular distance if the foot of perpendicular falls
 * within the segment, otherwise the distance to the nearer endpoint.
 */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  // Degenerate segment (zero length) — treat as point
  if (lenSq === 0) return distance(p, a);

  // t = projection of AP onto AB, clamped to [0, 1]
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const closest: Point = { x: a.x + t * dx, y: a.y + t * dy };
  return distance(p, closest);
}

// ── Bounding box ──────────────────────────────────────────────────────────────

/** Clamp a world-space point within an axis-aligned bounding box. */
export function clampPoint(
  p: Point,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): Point {
  return {
    x: Math.max(minX, Math.min(maxX, p.x)),
    y: Math.max(minY, Math.min(maxY, p.y)),
  };
}

/**
 * Test whether a world-space point lies inside an axis-aligned rectangle.
 * Rectangle is defined by its top-left corner (rx, ry) and dimensions (rw, rh).
 */
export function rectContainsPoint(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  p: Point
): boolean {
  return p.x >= rx && p.x <= rx + rw && p.y >= ry && p.y <= ry + rh;
}

/**
 * Test whether two axis-aligned rectangles overlap.
 */
export function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ── Line segments ─────────────────────────────────────────────────────────────

/**
 * Test whether two line segments (A1→A2) and (B1→B2) properly intersect.
 * Uses the cross-product orientation method.
 * Does not count T-intersections (endpoint touching).
 */
export function segmentsIntersect(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): boolean {
  function cross(o: Point, u: Point, v: Point): number {
    return (u.x - o.x) * (v.y - o.y) - (u.y - o.y) * (v.x - o.x);
  }
  const d1 = cross(b1, b2, a1);
  const d2 = cross(b1, b2, a2);
  const d3 = cross(a1, a2, b1);
  const d4 = cross(a1, a2, b2);
  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

/**
 * Find the intersection point of two infinite lines defined by segments A1→A2
 * and B1→B2. Returns null if lines are parallel or coincident.
 * Used for wall endpoint snapping to extended lines.
 */
export function lineIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): Point | null {
  const dax = a2.x - a1.x;
  const day = a2.y - a1.y;
  const dbx = b2.x - b1.x;
  const dby = b2.y - b1.y;
  const denom = dax * dby - day * dbx;
  if (Math.abs(denom) < 1e-10) return null; // parallel

  const dx = b1.x - a1.x;
  const dy = b1.y - a1.y;
  const t = (dx * dby - dy * dbx) / denom;
  return { x: a1.x + t * dax, y: a1.y + t * day };
}

// ── Angles ────────────────────────────────────────────────────────────────────

/**
 * Normalize an angle in degrees to the range [0, 360).
 */
export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}
