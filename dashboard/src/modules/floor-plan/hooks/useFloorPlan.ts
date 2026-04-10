/**
 * useFloorPlan.ts — Floor Plan Module
 *
 * React Query hooks for loading and saving floor plan data.
 *
 * Save behavior:
 *   useSavePlan()     → POST /api/floor-plans/:storeId  (overwrites working plan)
 *   usePublishVersion() → POST .../versions              (creates named snapshot)
 *   useSetVersionLive() → PATCH .../versions/:id         (marks wentLiveAt date)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  LoadPlanResponse,
  StorePlan,
  SavePlanResponse,
  PublishVersionResponse,
  SetVersionLiveResponse,
} from "../types";

// ── Query key factory ─────────────────────────────────────────────────────────

export const floorPlanKeys = {
  plan: (storeId: string) => ["floor-plan", storeId] as const,
};

// ── Load plan + version history ───────────────────────────────────────────────

export function useFloorPlan(storeId: string) {
  return useQuery<LoadPlanResponse>({
    queryKey: floorPlanKeys.plan(storeId),
    queryFn: () =>
      fetch(`/api/floor-plans/${storeId}`, { credentials: "include" }).then(
        (r) => {
          if (!r.ok) throw new Error(`Failed to load plan for ${storeId}`);
          return r.json() as Promise<LoadPlanResponse>;
        }
      ),
    enabled: !!storeId,
  });
}

// ── Save working plan ─────────────────────────────────────────────────────────

export function useSavePlan(storeId: string) {
  const qc = useQueryClient();
  return useMutation<SavePlanResponse, Error, StorePlan>({
    mutationFn: (plan: StorePlan) =>
      fetch(`/api/floor-plans/${storeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(plan),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to save plan");
        return r.json() as Promise<SavePlanResponse>;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: floorPlanKeys.plan(storeId) });
    },
  });
}

// ── Publish named version (snapshot) ─────────────────────────────────────────

export function usePublishVersion(storeId: string) {
  const qc = useQueryClient();
  return useMutation<PublishVersionResponse, Error, { name: string }>({
    mutationFn: ({ name }) =>
      fetch(`/api/floor-plans/${storeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to publish version");
        return r.json() as Promise<PublishVersionResponse>;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: floorPlanKeys.plan(storeId) });
    },
  });
}

// ── Mark a version as live ────────────────────────────────────────────────────

export function useSetVersionLive(storeId: string) {
  const qc = useQueryClient();
  return useMutation<
    SetVersionLiveResponse,
    Error,
    { versionId: string; wentLiveAt: string }
  >({
    mutationFn: ({ versionId, wentLiveAt }) =>
      fetch(`/api/floor-plans/${storeId}/versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wentLiveAt }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to set version live date");
        return r.json() as Promise<SetVersionLiveResponse>;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: floorPlanKeys.plan(storeId) });
    },
  });
}
