/**
 * storeDefaults.ts — Floor Plan Module
 *
 * The canonical list of Eagle V stores for the floor plan tool,
 * and a factory for creating a blank StorePlan for any store.
 */

import type { StorePlan } from "../types";
import { SCHEMA_VERSION } from "../constants";

// ── Store list ────────────────────────────────────────────────────────────────

export interface StoreInfo {
  storeId: string;
  displayName: string;
  type: "platos_closet" | "style_encore";
}

export const FLOOR_PLAN_STORES: StoreInfo[] = [
  { storeId: "pc-80237", displayName: "PC Portage",      type: "platos_closet" },
  { storeId: "se-60039", displayName: "SE Portage",      type: "style_encore"  },
  { storeId: "pc-80185", displayName: "PC East Lansing", type: "platos_closet" },
  { storeId: "pc-80634", displayName: "PC Jackson",      type: "platos_closet" },
  { storeId: "pc-80726", displayName: "PC Ann Arbor",    type: "platos_closet" },
  { storeId: "pc-80783", displayName: "PC Canton",       type: "platos_closet" },
  { storeId: "pc-80877", displayName: "PC Novi",         type: "platos_closet" },
];

export const VALID_STORE_IDS = new Set(FLOOR_PLAN_STORES.map((s) => s.storeId));

// ── Default blank plan factory ────────────────────────────────────────────────

/**
 * Returns a blank StorePlan for a store that has no saved data yet.
 * The floor dimensions are placeholder values; admins set real dimensions
 * when drawing the base layout.
 */
export function createDefaultPlan(storeId: string, createdBy = "system"): StorePlan {
  return {
    storeId,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    updatedBy: createdBy,
    baseLayout: {
      floorWidthFt: 80,
      floorHeightFt: 50,
      walls: [],
      rooms: [],
    },
    fixtures: [],
    merchandising: {
      colorMode: "gender",
      assignments: [],
    },
    cameras: [],
  };
}
