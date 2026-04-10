import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TH } from "../components/TH";
import type { Store, DashboardTotals } from "../types";

const tm = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

function storeLabel(store: Store) {
  return store.type === "platos_closet" ? "Plato's Closet" : "Style Encore";
}

export function CustomersTab({ stores, totals }: { stores: Store[]; totals: DashboardTotals }) {
  return (
    <motion.div key="customers" {...tm}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-3.5 w-3.5 text-primary" />
              Customer Count — All Stores
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">Shoppers = buyers · Sellers = those selling to us</span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/60">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.07em] font-semibold text-muted-foreground min-w-[140px]">Store</th>
                <TH warn={!stores.some((s) => s.metrics?.weekTransactions != null)}>Shoppers</TH>
                <TH warn={!stores.some((s) => s.metrics?.weekSellerCount != null)}>Sellers</TH>
                <TH>Total</TH>
                <TH warn>First Time Sellers</TH>
                <TH warn>Five Star Signups</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {stores.map((store) => {
                const shoppers = store.metrics?.weekTransactions ?? null;
                const sellers  = store.metrics?.weekSellerCount  ?? null;
                const total    = shoppers != null || sellers != null ? (shoppers ?? 0) + (sellers ?? 0) : null;
                return (
                  <tr key={store.id} className="hover:bg-muted/15 transition-colors duration-100">
                    <td className="px-4 py-2.5">
                      <div className="text-[13px] font-semibold">{store.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{storeLabel(store)}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {shoppers != null ? shoppers.toLocaleString() : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {sellers != null ? sellers.toLocaleString() : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {total != null ? total.toLocaleString() : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground/40 text-[13px]">—</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground/40 text-[13px]">—</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-border/80 bg-muted/30">
              <tr>
                <td className="px-4 py-3 text-[12px] font-bold text-foreground tracking-wide">Eagle V Total</td>
                <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">{totals.transactions > 0 ? totals.transactions.toLocaleString() : "—"}</td>
                <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">{totals.sellerCount > 0 ? totals.sellerCount.toLocaleString() : "—"}</td>
                <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                  {(totals.transactions + totals.sellerCount) > 0
                    ? (totals.transactions + totals.sellerCount).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground/40 text-[13px]">—</td>
                <td className="px-4 py-3 text-right text-muted-foreground/40 text-[13px]">—</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
