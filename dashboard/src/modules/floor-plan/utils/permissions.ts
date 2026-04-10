/**
 * permissions.ts — Floor Plan Module
 *
 * Layer-level edit permission checks based on user tier.
 *
 * Layer 1 (Base Layout)  — admin only
 * Layers 2–4             — admin, dm, store_manager
 *
 * These checks are enforced in the client UI (pointer-events, disabled tools).
 * The server enforces auth on all write routes via requireAuth.
 */

import type { UserTier } from "@/contexts/AuthContext";
import type { LayerId } from "../types";

/**
 * Returns true if the given user tier may edit the specified layer.
 */
export function canEditLayer(layer: LayerId, tier: UserTier): boolean {
  switch (layer) {
    case 1:
      return tier === "admin";
    case 2:
    case 3:
    case 4:
      return tier === "admin" || tier === "dm" || tier === "store_manager";
  }
}

/**
 * Returns true if the given tier may publish a named floor set version.
 */
export function canPublish(tier: UserTier): boolean {
  return tier === "admin" || tier === "dm" || tier === "store_manager";
}
