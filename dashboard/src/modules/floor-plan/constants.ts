/**
 * constants.ts — Floor Plan Module
 *
 * True shared constants only. Fixed values used across the module.
 * Do not add UI defaults, feature flags, or one-off config here.
 */

/** Default render scale at 100% zoom: pixels per foot. */
export const DEFAULT_SCALE_PX_PER_FT = 12;

/** Minor grid line interval (feet). Visible on Layer 1 only. */
export const GRID_MINOR_FT = 1;

/** Major grid line interval (feet). Must be a multiple of GRID_MINOR_FT. */
export const GRID_MAJOR_FT = 5;

/** Wall endpoint snap radius (feet). Scale-independent. */
export const SNAP_ENDPOINT_FT = 1.0;

/** Fixture-to-wall magnetic snap distance (feet). */
export const SNAP_WALL_FT = 0.5;

/** Fixture-to-neighboring-fixture snap distance (feet). */
export const SNAP_NEIGHBOR_FT = 0.5;

/** Default wall thickness when drawing new walls (feet). */
export const DEFAULT_WALL_THICKNESS_FT = 0.5;

/** Plan file schema version. Increment when making breaking schema changes. */
export const SCHEMA_VERSION = 1 as const;
