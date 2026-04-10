import { motion } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";
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

export function SalesVsBuysTab({ stores, totals }: { stores: Store[]; totals: DashboardTotals }) {
  return (
    <motion.div key="sales-vs-buys" {...tm}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
              Sales vs Buys — All Stores
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
                <TH warn={noData(stores, "weekTotalBuys")}>Total Buys</TH>
                <TH warn={noData(stores, "weekTransactions")}>Shoppers</TH>
                <TH warn={noData(stores, "weekSellerCount")}>Sellers</TH>
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
                    <MetricCell
                      value={m?.weekSales ?? null}
                      valueLY={m?.weekSalesLY ?? null}
                      format={fmt.currency}
                      yoyVal={yoy(m?.weekSales ?? null, m?.weekSalesLY ?? null)}
                    />
                    <MetricCell
                      value={m?.weekTotalBuys ?? null}
                      valueLY={m?.weekTotalBuysLY ?? null}
                      format={fmt.currency}
                      yoyVal={yoy(m?.weekTotalBuys ?? null, m?.weekTotalBuysLY ?? null)}
                    />
                    <MetricCell
                      value={m?.weekTransactions ?? null}
                      valueLY={m?.weekTransactionsLY ?? null}
                      format={fmt.count}
                      yoyVal={yoy(m?.weekTransactions ?? null, m?.weekTransactionsLY ?? null)}
                    />
                    <MetricCell
                      value={m?.weekSellerCount ?? null}
                      valueLY={m?.weekSellerCountLY ?? null}
                      format={fmt.count}
                      yoyVal={yoy(m?.weekSellerCount ?? null, m?.weekSellerCountLY ?? null)}
                    />
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
                  <div className="text-[13px] font-bold tabular-nums">{totals.buys > 0 ? formatCurrency(totals.buys) : "—"}</div>
                  {totals.buysLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{formatCurrency(totals.buysLY)}</div>}
                  <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(totals.buys || null, totals.buysLY || null)} size="xs" /></div>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <div className="text-[13px] font-bold tabular-nums">{totals.transactions > 0 ? totals.transactions.toLocaleString() : "—"}</div>
                  {totals.transactionsLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{totals.transactionsLY.toLocaleString()}</div>}
                  <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(totals.transactions || null, totals.transactionsLY || null)} size="xs" /></div>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <div className="text-[13px] font-bold tabular-nums">{totals.sellerCount > 0 ? totals.sellerCount.toLocaleString() : "—"}</div>
                  {totals.sellerCountLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{totals.sellerCountLY.toLocaleString()}</div>}
                  <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(totals.sellerCount || null, totals.sellerCountLY || null)} size="xs" /></div>
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
