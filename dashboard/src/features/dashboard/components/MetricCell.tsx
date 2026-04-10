import { TrendBadge } from "./TrendBadge";

export function MetricCell({
  value,
  valueLY,
  format,
  yoyVal,
}: {
  value: number | null;
  valueLY?: number | null;
  format: (v: number | null | undefined) => string;
  yoyVal?: number | null;
}) {
  return (
    <td className="px-4 py-2.5 text-right align-top">
      <div className="text-[13px] font-semibold text-foreground tabular-nums leading-snug">
        {value != null
          ? format(value)
          : <span className="text-muted-foreground/40 font-normal">—</span>}
      </div>
      {valueLY != null && (
        <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{format(valueLY)}</div>
      )}
      {yoyVal !== undefined && (
        <div className="mt-1.5 flex justify-end">
          <TrendBadge value={yoyVal ?? null} size="xs" />
        </div>
      )}
    </td>
  );
}
