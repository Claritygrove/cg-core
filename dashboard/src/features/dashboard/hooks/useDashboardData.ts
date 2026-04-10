import { useQuery } from "@tanstack/react-query";
import type { StoresResponse } from "../types";

export function useDashboardData(activeRange: { start: string; end: string } | null) {
  const storesUrl = activeRange
    ? `/api/stores?startDate=${activeRange.start}&endDate=${activeRange.end}`
    : "/api/stores";

  return useQuery<StoresResponse>({
    queryKey: ["/api/stores", activeRange?.start ?? null, activeRange?.end ?? null],
    queryFn: () => fetch(storesUrl).then((r) => r.json()),
  });
}
