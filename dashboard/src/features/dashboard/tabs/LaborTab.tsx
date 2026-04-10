import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TH } from "../components/TH";
import { fmt } from "../utils/formatters";
import type { Store, DashboardTotals } from "../types";

const tm = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

function storeLabel(store: Store) {
  return store.type === "platos_closet" ? "Plato's Closet" : "Style Encore";
}

export function LaborTab({ stores, totals }: { stores: Store[]; totals: DashboardTotals }) {
  const noProjectedHours = !stores.some((s) => s.metrics?.weekLaborHours != null);
  const noSales          = !stores.some((s) => s.metrics?.weekSales != null);

  return (
    <motion.div key="labor" {...tm} className="space-y-3">
      {/* ADP pending notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/15 text-sm text-amber-300/90">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400/70" />
        <span className="text-[13px]">
          <strong className="font-semibold text-amber-300">Actual Labor Hours</strong> and{" "}
          <strong className="font-semibold text-amber-300">Labor % of Sales</strong> require ADP
          integration. Payroll data appears ~5 days after biweekly close.
        </span>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Labor — All Stores
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">Scheduled hrs from WIW · Actual hrs pending ADP</span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/60">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.07em] font-semibold text-muted-foreground min-w-[140px]">Store</th>
                <TH warn={noProjectedHours}>Proj Labor Hrs</TH>
                <TH warn>Actual Labor Hrs</TH>
                <TH warn={noSales || noProjectedHours}>Projected Sales/Hr</TH>
                <TH warn>Actual Sales/Hr</TH>
                <TH warn={!stores.some((s) => s.metrics?.weekLaborCostPercent != null)}>Labor % of Sales</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {stores.map((store) => {
                const m = store.metrics;
                const projSalesPerHour =
                  m?.weekSales && m?.weekLaborHours && m.weekLaborHours > 0
                    ? m.weekSales / m.weekLaborHours
                    : null;
                const actualSalesPerHour =
                  m?.weekSales && m?.weekActualLaborHours && m.weekActualLaborHours > 0
                    ? m.weekSales / m.weekActualLaborHours
                    : null;
                return (
                  <tr key={store.id} className="hover:bg-muted/15 transition-colors duration-100">
                    <td className="px-4 py-2.5">
                      <div className="text-[13px] font-semibold">{store.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{storeLabel(store)}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {m?.weekLaborHours != null
                        ? fmt.hours(m.weekLaborHours)
                        : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11px] text-muted-foreground/50">Pending ADP</td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {projSalesPerHour != null
                        ? formatCurrency(projSalesPerHour)
                        : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {actualSalesPerHour != null
                        ? formatCurrency(actualSalesPerHour)
                        : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11px] text-muted-foreground/50">Pending ADP</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-border/80 bg-muted/30">
              <tr>
                <td className="px-4 py-3 text-[12px] font-bold text-foreground tracking-wide">Eagle V Total</td>
                <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                  {totals.hours > 0 ? fmt.hours(totals.hours) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-[11px] text-muted-foreground/50">Pending ADP</td>
                <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                  {totals.hours > 0 && totals.sales > 0
                    ? formatCurrency(totals.sales / totals.hours)
                    : <span className="text-muted-foreground/40 font-normal">—</span>}
                </td>
                <td className="px-4 py-3 text-right text-[11px] text-muted-foreground/50">Pending ADP</td>
                <td className="px-4 py-3 text-right text-[11px] text-muted-foreground/50">Pending ADP</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
