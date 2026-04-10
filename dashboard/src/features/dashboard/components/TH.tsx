import { AlertTriangle } from "lucide-react";

export function TH({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-[0.07em] font-semibold text-muted-foreground whitespace-nowrap">
      <span className="inline-flex items-center justify-end gap-1.5">
        {children}
        {warn && <AlertTriangle className="h-2.5 w-2.5 text-amber-400/60" />}
      </span>
    </th>
  );
}
