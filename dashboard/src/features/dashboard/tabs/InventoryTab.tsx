import { motion } from "framer-motion";
import { Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TH } from "../components/TH";
import { INVENTORY_DATA } from "../utils/inventoryData";
import type { Store } from "../types";

const tm = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

function storeLabel(store: Store) {
  return store.type === "platos_closet" ? "Plato's Closet" : "Style Encore";
}

export function InventoryTab({ stores }: { stores: Store[] }) {
  return (
    <motion.div key="inventory" {...tm}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Archive className="h-3.5 w-3.5 text-primary" />
              Inventory — All Stores
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">Imported from Resale AI</span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/60">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.07em] font-semibold text-muted-foreground min-w-[140px]">Store</th>
                <TH>$ on Hand</TH>
                <TH>Qty on Hand</TH>
                <TH>Bins in Back Room</TH>
                <TH>Backroom Capacity</TH>
                <TH>Bins Offsite</TH>
                <TH>Total Bins</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {stores.map((store) => {
                const inv = INVENTORY_DATA[store.name];
                const totalBins = inv ? inv.binsBackroom + inv.binsOffsite : null;
                return (
                  <tr key={store.id} className="hover:bg-muted/15 transition-colors duration-100">
                    <td className="px-4 py-2.5">
                      <div className="text-[13px] font-semibold">{store.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{storeLabel(store)}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {inv ? formatCurrency(inv.dollarsOnHand) : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {inv ? inv.qtyOnHand.toLocaleString() : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {inv ? inv.binsBackroom : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {inv ? inv.backroomCapacity : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {inv ? inv.binsOffsite : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                      {totalBins != null ? totalBins : <span className="text-muted-foreground/40 font-normal">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-border/80 bg-muted/30">
              {(() => {
                const allInv = stores.map((s) => INVENTORY_DATA[s.name]).filter(Boolean);
                const totDollars  = allInv.reduce((a, i) => a + i.dollarsOnHand,   0);
                const totQty      = allInv.reduce((a, i) => a + i.qtyOnHand,       0);
                const totBackroom = allInv.reduce((a, i) => a + i.binsBackroom,    0);
                const totCapacity = allInv.reduce((a, i) => a + i.backroomCapacity, 0);
                const totOffsite  = allInv.reduce((a, i) => a + i.binsOffsite,     0);
                const totBins     = totBackroom + totOffsite;
                return (
                  <tr>
                    <td className="px-4 py-3 text-[12px] font-bold text-foreground tracking-wide">Eagle V Total</td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">{allInv.length ? formatCurrency(totDollars) : "—"}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">{allInv.length ? totQty.toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">{allInv.length ? totBackroom : "—"}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">{allInv.length ? totCapacity : "—"}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">{allInv.length ? totOffsite : "—"}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">{allInv.length ? totBins : "—"}</td>
                  </tr>
                );
              })()}
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
