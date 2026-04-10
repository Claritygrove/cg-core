import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrendBadge({
  value,
  size = "sm",
}: {
  value: number | null;
  size?: "sm" | "xs";
}) {
  if (value == null) return <span className="text-muted-foreground/40 text-[11px]">—</span>;
  const pos = value >= 0;

  if (size === "xs") {
    return (
      <span className={cn("text-[11px] font-semibold tabular-nums", pos ? "text-emerald-400" : "text-rose-400")}>
        {value !== 0 ? (pos ? "+" : "−") : ""}{Math.abs(value).toFixed(1)}%
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold tabular-nums", pos ? "text-emerald-400" : "text-rose-400")}>
      {value > 0
        ? <TrendingUp className="h-3 w-3" />
        : value < 0
        ? <TrendingDown className="h-3 w-3" />
        : <Minus className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}
