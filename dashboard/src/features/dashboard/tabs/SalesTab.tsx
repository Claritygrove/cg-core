import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MetricCell } from "../components/MetricCell";
import { TrendBadge } from "../components/TrendBadge";
import { TH } from "../components/TH";
import { fmt, yoy } from "../utils/formatters";
import type { Store, StoreMetrics, DashboardTotals } from "../types";

const tm = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

function storeLabel(store: Store) {
  return store.type === "platos_closet" ? "Plato's Closet" : "Style Encore";
}

function noData(stores: Store[], key: keyof StoreMetrics) {
  return !stores.some((s) => s.metrics?.[key] != null);
}

export function SalesTab({ stores, totals }: { stores: Store[]; totals: DashboardTotals }) {
  return (
    <motion.div key="sales" {...tm}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Sales — All Stores
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">TY · LY · % vs prior year</span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/60">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.07em] font-semibold text-muted-foreground min-w-[140px]">Store</th>
                <TH warn={noData(stores, "weekSales")}>Total Sales</TH>
                <TH warn={noData(stores, "weekTransactions")}>Shoppers</TH>
                <TH warn={noData(stores, "weekAvgRetail")}>Avg Retail</TH>
                <TH warn={noData(stores, "weekItemsPerSale")}>Items/Sale</TH>
                <TH warn={noData(stores, "weekSellMargin")}>Sell Margin</TH>
                <TH warn={noData(stores, "projAnnualSales")}>Proj Annual Sales</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {stores.map((store) => {
                const m = store.metrics;
                return (
                  <tr key={store.id} className="hover:bg-muted/15 transition-colors duration-100">
                    <td className="px-4 py-2.5">
                      <div className="text-[13px] font-semibold">{store.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{storeLabel(store)}</div>
                    </td>
                    <MetricCell value={m?.weekSales ?? null} valueLY={m?.weekSalesLY ?? null} format={fmt.currency} yoyVal={yoy(m?.weekSales ?? null, m?.weekSalesLY ?? null)} />
                    <MetricCell value={m?.weekTransactions ?? null} valueLY={m?.weekTransactionsLY ?? null} format={fmt.count} yoyVal={yoy(m?.weekTransactions ?? null, m?.weekTransactionsLY ?? null)} />
                    <MetricCell value={m?.weekAvgRetail ?? null} valueLY={m?.weekAvgRetailLY ?? null} format={fmt.currency} yoyVal={yoy(m?.weekAvgRetail ?? null, m?.weekAvgRetailLY ?? null)} />
                    <MetricCell value={m?.weekItemsPerSale ?? null} valueLY={m?.weekItemsPerSaleLY ?? null} format={fmt.decimal} yoyVal={yoy(m?.weekItemsPerSale ?? null, m?.weekItemsPerSaleLY ?? null)} />
                    <MetricCell value={m?.weekSellMargin ?? null} valueLY={m?.weekSellMarginLY ?? null} format={fmt.pct} yoyVal={yoy(m?.weekSellMargin ?? null, m?.weekSellMarginLY ?? null)} />
                    <MetricCell value={m?.projAnnualSales ?? null} format={fmt.currency} />
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-border/80 bg-muted/30">
              <tr>
                <td className="px-4 py-3 text-[12px] font-bold text-foreground tracking-wide">Eagle V Total</td>
                <td className="px-4 py-3 text-right align-top">
                  <div className="text-[13px] font-bold tabular-nums">{totals.sales > 0 ? formatCurrency(totals.sales) : "—"}</div>
                  {totals.salesLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{formatCurrency(totals.salesLY)}</div>}
                  <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(totals.sales || null, totals.salesLY || null)} size="xs" /></div>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <div className="text-[13px] font-bold tabular-nums">{totals.transactions > 0 ? totals.transactions.toLocaleString() : "—"}</div>
                  {totals.transactionsLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{totals.transactionsLY.toLocaleString()}</div>}
                  <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(totals.transactions || null, totals.transactionsLY || null)} size="xs" /></div>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <div className="text-[13px] font-bold tabular-nums">{totals.avgRetailAll > 0 ? formatCurrency(totals.avgRetailAll) : "—"}</div>
                  {totals.avgRetailAllLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{formatCurrency(totals.avgRetailAllLY)}</div>}
                  <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(totals.avgRetailAll || null, totals.avgRetailAllLY || null)} size="xs" /></div>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <div className="text-[13px] font-bold tabular-nums">{totals.avgItemsPerSale != null ? totals.avgItemsPerSale.toFixed(2) : "—"}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">avg</div>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <div className="text-[13px] font-bold tabular-nums">{totals.avgSellMargin > 0 ? fmt.pct(totals.avgSellMargin) : "—"}</div>
                  {totals.avgSellMarginLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{fmt.pct(totals.avgSellMarginLY)}</div>}
                  <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(totals.avgSellMargin || null, totals.avgSellMarginLY || null)} size="xs" /></div>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <div className="text-[13px] font-bold tabular-nums">{totals.projAnnualSales > 0 ? formatCurrency(totals.projAnnualSales) : "—"}</div>
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
