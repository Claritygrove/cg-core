import { formatCurrency } from "@/lib/utils";

export const fmt = {
  currency: (v: number | null | undefined) => formatCurrency(v),
  count:    (v: number | null | undefined) => v != null ? v.toLocaleString() : "—",
  decimal:  (v: number | null | undefined) => v != null ? v.toFixed(2) : "—",
  pct:      (v: number | null | undefined) => v != null ? `${v.toFixed(1)}%` : "—",
  hours:    (v: number | null | undefined) =>
    v != null ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—",
};

export function yoy(current: number | null, prior: number | null): number | null {
  if (current == null || prior == null || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}
