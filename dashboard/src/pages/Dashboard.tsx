import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
  ChevronDown,
  AlertTriangle,
  Percent,
  PackageOpen,
  Archive,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "sales" | "buys" | "customers" | "labor" | "inventory";
type PresetKey = "this-week" | "last-week" | "mtd" | "custom";

interface StoreMetrics {
  weekSales: number | null;
  weekSalesLY: number | null;
  weekTransactions: number | null;
  weekTransactionsLY: number | null;
  weekAvgRetail: number | null;
  weekAvgRetailLY: number | null;
  weekItemsPerSale: number | null;
  weekItemsPerSaleLY: number | null;
  weekSellMargin: number | null;
  weekSellMarginLY: number | null;
  projAnnualSales: number | null;
  weekTotalBuys: number | null;
  weekTotalBuysLY: number | null;
  weekSellerCount: number | null;
  weekSellerCountLY: number | null;
  weekItemsPerBuy: number | null;
  weekItemsPerBuyLY: number | null;
  weekLaborHours: number | null;
  weekLaborCostPercent: number | null;
  weekLoyaltyVisits: number | null;
}

interface Store {
  id: string;
  name: string;
  type: string;
  location: string;
  metrics: StoreMetrics | null;
}

interface DateRange {
  start: string;
  end: string;
  label: string;
  dataSource: "files" | "qbo";
  isCustomRange: boolean;
}

interface StoresResponse {
  stores: Store[];
  dateRange: DateRange;
}

const fmt = {
  currency: (v: number | null | undefined) => formatCurrency(v),
  count:    (v: number | null | undefined) => v != null ? v.toLocaleString() : "—",
  decimal:  (v: number | null | undefined) => v != null ? v.toFixed(2) : "—",
  pct:      (v: number | null | undefined) => v != null ? `${v.toFixed(1)}%` : "—",
  hours:    (v: number | null | undefined) => v != null ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—",
};

function yoy(current: number | null, prior: number | null): number | null {
  if (current == null || prior == null || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

// Trend badge — table cells (xs): clean +/− prefix only. Standalone (sm): with icon.
function TrendBadge({ value, size = "sm" }: { value: number | null; size?: "sm" | "xs" }) {
  if (value == null) return <span className="text-muted-foreground/40 text-[11px]">—</span>;
  const pos = value >= 0;
  const neutral = value === 0;
  if (size === "xs") {
    return (
      <span className={cn("text-[11px] font-semibold tabular-nums", pos ? "text-emerald-400" : "text-rose-400")}>
        {neutral ? "" : pos ? "+" : "−"}{Math.abs(value).toFixed(1)}%
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold tabular-nums", pos ? "text-emerald-400" : "text-rose-400")}>
      {value > 0 ? <TrendingUp className="h-3 w-3" /> : value < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// Table cell: TY value, muted LY below, optional YOY badge
function MetricCell({
  value, valueLY, format, yoyVal,
}: {
  value: number | null;
  valueLY?: number | null;
  format: (v: number | null | undefined) => string;
  yoyVal?: number | null;
}) {
  return (
    <td className="px-4 py-2.5 text-right align-top">
      <div className="text-[13px] font-semibold text-foreground tabular-nums leading-snug">
        {value != null ? format(value) : <span className="text-muted-foreground/40 font-normal">—</span>}
      </div>
      {valueLY != null && (
        <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{format(valueLY)}</div>
      )}
      {yoyVal !== undefined && (
        <div className="mt-1.5 flex justify-end"><TrendBadge value={yoyVal ?? null} size="xs" /></div>
      )}
    </td>
  );
}

// Right-aligned table column header
function TH({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-[0.07em] font-semibold text-muted-foreground whitespace-nowrap">
      <span className="inline-flex items-center justify-end gap-1.5">
        {children}
        {warn && <AlertTriangle className="h-2.5 w-2.5 text-amber-400/60" />}
      </span>
    </th>
  );
}

// KPI summary card
function KpiCard({
  label, value, delta, icon: Icon, delay = 0,
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
  icon: React.ElementType;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
    >
      <Card className="group hover:border-primary/30 transition-colors duration-200">
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-none">{label}</p>
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <div className="text-[1.65rem] font-display font-bold tracking-tight tabular-nums leading-none text-foreground">
            {value}
          </div>
          {delta && <div className="mt-2.5">{delta}</div>}
        </div>
      </Card>
    </motion.div>
  );
}

function getPresetRange(preset: PresetKey): { start: string; end: string } | null {
  const today = new Date();
  const pad = (d: Date) => d.toISOString().split("T")[0]!;
  const daysFromMonday = (today.getDay() + 6) % 7;
  if (preset === "this-week") {
    const s = new Date(today); s.setDate(today.getDate() - daysFromMonday);
    return { start: pad(s), end: pad(today) };
  }
  if (preset === "last-week") {
    const s = new Date(today); s.setDate(today.getDate() - daysFromMonday - 7);
    const e = new Date(today); e.setDate(today.getDate() - daysFromMonday - 1);
    return { start: pad(s), end: pad(e) };
  }
  if (preset === "mtd") {
    return { start: pad(new Date(today.getFullYear(), today.getMonth(), 1)), end: pad(today) };
  }
  return null;
}

const PRESET_LABELS: Record<PresetKey, string> = {
  "this-week": "This Week",
  "last-week": "Last Week",
  "mtd":       "Month to Date",
  "custom":    "Custom Range",
};

// Static inventory data — manually maintained until an inventory integration is added
const INVENTORY_DATA: Record<string, { dollarsOnHand: number; qtyOnHand: number; binsBackroom: number; backroomCapacity: number; binsOffsite: number }> = {
  "PC Portage":      { dollarsOnHand: 285000, qtyOnHand: 18400, binsBackroom: 42, backroomCapacity: 60, binsOffsite: 15 },
  "SE Portage":      { dollarsOnHand: 142000, qtyOnHand:  9200, binsBackroom: 28, backroomCapacity: 40, binsOffsite:  8 },
  "PC East Lansing": { dollarsOnHand: 263000, qtyOnHand: 17100, binsBackroom: 38, backroomCapacity: 55, binsOffsite: 12 },
  "PC Jackson":      { dollarsOnHand: 198000, qtyOnHand: 12800, binsBackroom: 31, backroomCapacity: 45, binsOffsite:  6 },
  "PC Ann Arbor":    { dollarsOnHand: 312000, qtyOnHand: 20100, binsBackroom: 45, backroomCapacity: 65, binsOffsite: 18 },
  "PC Canton":       { dollarsOnHand: 275000, qtyOnHand: 17800, binsBackroom: 40, backroomCapacity: 58, binsOffsite: 14 },
  "PC Novi":         { dollarsOnHand: 291000, qtyOnHand: 18900, binsBackroom: 43, backroomCapacity: 60, binsOffsite: 16 },
};

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("sales");
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("this-week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeRange =
    selectedPreset === "custom"
      ? customStart && customEnd ? { start: customStart, end: customEnd } : null
      : getPresetRange(selectedPreset);

  const storesUrl = activeRange
    ? `/api/stores?startDate=${activeRange.start}&endDate=${activeRange.end}`
    : "/api/stores";

  const { data: response, isLoading } = useQuery<StoresResponse>({
    queryKey: ["/api/stores", activeRange?.start ?? null, activeRange?.end ?? null],
    queryFn: () => fetch(storesUrl).then((r) => r.json()),
  });

  const stores = response?.stores ?? [];
  const dateRange = response?.dateRange;

  const noData = (key: keyof StoreMetrics) => !stores.some((s) => s.metrics?.[key] != null);

  // ── Totals ───────────────────────────────────────────────────────────
  const totals = stores.reduce(
    (acc, s) => ({
      sales:             acc.sales             + (s.metrics?.weekSales          || 0),
      salesLY:           acc.salesLY           + (s.metrics?.weekSalesLY        || 0),
      buys:              acc.buys              + (s.metrics?.weekTotalBuys      || 0),
      buysLY:            acc.buysLY            + (s.metrics?.weekTotalBuysLY    || 0),
      hours:             acc.hours             + (s.metrics?.weekLaborHours     || 0),
      transactions:      acc.transactions      + (s.metrics?.weekTransactions   || 0),
      transactionsLY:    acc.transactionsLY    + (s.metrics?.weekTransactionsLY || 0),
      sellerCount:       acc.sellerCount       + (s.metrics?.weekSellerCount    || 0),
      sellerCountLY:     acc.sellerCountLY     + (s.metrics?.weekSellerCountLY  || 0),
      projAnnualSales:   acc.projAnnualSales   + (s.metrics?.projAnnualSales    || 0),
      // for avg retail/unit in buys
      buyItems: acc.buyItems + (
        (s.metrics?.weekSellerCount && s.metrics?.weekItemsPerBuy)
          ? s.metrics.weekSellerCount * s.metrics.weekItemsPerBuy : 0
      ),
    }),
    { sales: 0, salesLY: 0, buys: 0, buysLY: 0, hours: 0, transactions: 0, transactionsLY: 0, sellerCount: 0, sellerCountLY: 0, projAnnualSales: 0, buyItems: 0 }
  );

  // ── Derived averages ─────────────────────────────────────────────────
  const avgRetailAll   = totals.transactions > 0 ? totals.sales   / totals.transactions   : 0;
  const avgRetailAllLY = totals.transactionsLY > 0 ? totals.salesLY / totals.transactionsLY : 0;

  const storesWithMargin = stores.filter((s) => s.metrics?.weekSellMargin);
  const avgSellMargin = storesWithMargin.length
    ? storesWithMargin.reduce((a, s) => a + s.metrics!.weekSellMargin!, 0) / storesWithMargin.length : 0;

  const storesWithMarginLY = stores.filter((s) => s.metrics?.weekSellMarginLY);
  const avgSellMarginLY = storesWithMarginLY.length
    ? storesWithMarginLY.reduce((a, s) => a + s.metrics!.weekSellMarginLY!, 0) / storesWithMarginLY.length : 0;

  const storesWithIPS = stores.filter((s) => s.metrics?.weekItemsPerSale);
  const avgItemsPerSale = storesWithIPS.length
    ? storesWithIPS.reduce((a, s) => a + s.metrics!.weekItemsPerSale!, 0) / storesWithIPS.length : null;

  const storesWithIPB = stores.filter((s) => s.metrics?.weekItemsPerBuy);
  const avgItemsPerBuy = storesWithIPB.length
    ? storesWithIPB.reduce((a, s) => a + s.metrics!.weekItemsPerBuy!, 0) / storesWithIPB.length : null;

  const avgBuyRetailPerUnit = totals.buyItems > 0 && totals.buys > 0
    ? totals.buys / totals.buyItems : null;

  const storeLabel = (store: Store) =>
    store.type === "platos_closet" ? "Plato's Closet" : "Style Encore";

  const tm = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header + date picker */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Overview</h1>
        <div className="relative mt-3" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/70 bg-card hover:border-border hover:bg-muted/30 transition-all text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {selectedPreset === "custom" && customStart && customEnd
                ? `${customStart} – ${customEnd}`
                : dateRange?.label ?? PRESET_LABELS[selectedPreset]}
            </span>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <span className="text-muted-foreground text-xs">7 stores</span>
            <ChevronDown className={cn("h-3 w-3 text-muted-foreground ml-0.5 transition-transform", pickerOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {pickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-8 z-50 bg-card border border-border rounded-xl shadow-2xl shadow-black/30 p-3 w-64"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Date Range</p>
                <div className="space-y-0.5">
                  {(["this-week", "last-week", "mtd", "custom"] as PresetKey[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => { setSelectedPreset(p); if (p !== "custom") setPickerOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedPreset === p ? "bg-primary/15 text-primary font-semibold" : "text-foreground hover:bg-muted"
                      )}
                    >
                      {PRESET_LABELS[p]}
                    </button>
                  ))}
                </div>
                {selectedPreset === "custom" && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                      <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">End</label>
                      <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground" />
                    </div>
                    {customStart && customEnd && (
                      <button onClick={() => setPickerOpen(false)}
                        className="w-full mt-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">
                        Apply
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total Sales"
          value={totals.sales > 0 ? formatCurrency(totals.sales) : "—"}
          icon={BarChart3}
          delay={0}
          delta={(() => {
            const v = yoy(totals.sales || null, totals.salesLY || null);
            return v != null ? (
              <span className={cn("text-xs font-semibold tabular-nums", v >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {v >= 0 ? "▲" : "▼"} {Math.abs(v).toFixed(1)}% vs LY
              </span>
            ) : undefined;
          })()}
        />
        <KpiCard
          label="Total Buys"
          value={totals.buys > 0 ? formatCurrency(totals.buys) : "—"}
          icon={PackageOpen}
          delay={0.05}
          delta={(() => {
            const v = yoy(totals.buys || null, totals.buysLY || null);
            return v != null ? (
              <span className={cn("text-xs font-semibold tabular-nums", v >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {v >= 0 ? "▲" : "▼"} {Math.abs(v).toFixed(1)}% vs LY
              </span>
            ) : undefined;
          })()}
        />
        <KpiCard
          label="Avg Sell Margin"
          value={avgSellMargin > 0 ? `${avgSellMargin.toFixed(1)}%` : "—"}
          icon={Percent}
          delay={0.1}
          delta={(() => {
            const v = yoy(avgSellMargin || null, avgSellMarginLY || null);
            return v != null ? (
              <span className={cn("text-xs font-semibold tabular-nums", v >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {v >= 0 ? "▲" : "▼"} {Math.abs(v).toFixed(1)}% vs LY
              </span>
            ) : undefined;
          })()}
        />
        <KpiCard
          label="Avg Retail"
          value={avgRetailAll > 0 ? formatCurrency(avgRetailAll) : "—"}
          icon={BarChart3}
          delay={0.15}
          delta={(() => {
            const v = yoy(avgRetailAll || null, avgRetailAllLY || null);
            return v != null ? (
              <span className={cn("text-xs font-semibold tabular-nums", v >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {v >= 0 ? "▲" : "▼"} {Math.abs(v).toFixed(1)}% vs LY
              </span>
            ) : undefined;
          })()}
        />
        <KpiCard
          label="Proj Annual Sales"
          value={totals.projAnnualSales > 0 ? formatCurrency(totals.projAnnualSales) : "—"}
          icon={TrendingUp}
          delay={0.2}
          delta={<span className="text-[11px] text-muted-foreground">all stores · store visit report</span>}
        />
      </div>

      {/* View Toggle — segmented control */}
      <div className="inline-flex items-center bg-muted/50 rounded-xl p-1 border border-border/60 gap-0.5">
        {([
          { mode: "sales"     as ViewMode, label: "Sales",     icon: BarChart3   },
          { mode: "buys"      as ViewMode, label: "Buys",      icon: PackageOpen },
          { mode: "customers" as ViewMode, label: "Customers", icon: Users       },
          { mode: "labor"     as ViewMode, label: "Labor",     icon: Clock       },
          { mode: "inventory" as ViewMode, label: "Inventory",  icon: Archive     },
        ] as { mode: ViewMode; label: string; icon: React.ElementType }[]).map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              viewMode === mode
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── SALES ─────────────────────────────────────────────────── */}
        {viewMode === "sales" && (
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
                      <TH warn={noData("weekSales")}>Total Sales</TH>
                      <TH warn={noData("weekTransactions")}>Shoppers</TH>
                      <TH warn={noData("weekAvgRetail")}>Avg Retail</TH>
                      <TH warn={noData("weekItemsPerSale")}>Items/Sale</TH>
                      <TH warn={noData("weekSellMargin")}>Sell Margin</TH>
                      <TH warn={noData("projAnnualSales" as keyof StoreMetrics)}>Proj Annual Sales</TH>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {stores.map((store) => {
                      const m = store.metrics;
                      const salesYOY = yoy(m?.weekSales ?? null, m?.weekSalesLY ?? null);
                      return (
                        <tr key={store.id} className="hover:bg-muted/15 transition-colors duration-100">
                          <td className="px-4 py-2.5">
                            <div className="text-[13px] font-semibold">{store.name}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{storeLabel(store)}</div>
                          </td>
                          <MetricCell value={m?.weekSales ?? null} valueLY={m?.weekSalesLY ?? null} format={fmt.currency} yoyVal={salesYOY} />
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
                        <div className="text-[13px] font-bold tabular-nums">{avgRetailAll > 0 ? formatCurrency(avgRetailAll) : "—"}</div>
                        {avgRetailAllLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{formatCurrency(avgRetailAllLY)}</div>}
                        <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(avgRetailAll || null, avgRetailAllLY || null)} size="xs" /></div>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <div className="text-[13px] font-bold tabular-nums">{avgItemsPerSale != null ? avgItemsPerSale.toFixed(2) : "—"}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">avg</div>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <div className="text-[13px] font-bold tabular-nums">{avgSellMargin > 0 ? fmt.pct(avgSellMargin) : "—"}</div>
                        {avgSellMarginLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{fmt.pct(avgSellMarginLY)}</div>}
                        <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(avgSellMargin || null, avgSellMarginLY || null)} size="xs" /></div>
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
        )}

        {/* ── BUYS ──────────────────────────────────────────────────── */}
        {viewMode === "buys" && (
          <motion.div key="buys" {...tm}>
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <PackageOpen className="h-3.5 w-3.5 text-primary" />
                    Buys — All Stores
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground">TY · LY · % vs prior year</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border/60">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.07em] font-semibold text-muted-foreground min-w-[140px]">Store</th>
                      <TH warn={noData("weekTotalBuys")}>Total Buys</TH>
                      <TH warn={noData("weekSellerCount")}>Seller Count</TH>
                      <TH warn={noData("weekItemsPerBuy")}>Items/Buy</TH>
                      <TH warn={noData("weekTotalBuys")}>Retail/Unit</TH>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {stores.map((store) => {
                      const m = store.metrics;
                      const buyRetailPerUnit =
                        m?.weekTotalBuys && m?.weekSellerCount && m?.weekItemsPerBuy && m.weekSellerCount > 0 && m.weekItemsPerBuy > 0
                          ? m.weekTotalBuys / (m.weekSellerCount * m.weekItemsPerBuy) : null;
                      return (
                        <tr key={store.id} className="hover:bg-muted/15 transition-colors duration-100">
                          <td className="px-4 py-2.5">
                            <div className="text-[13px] font-semibold">{store.name}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{storeLabel(store)}</div>
                          </td>
                          <MetricCell value={m?.weekTotalBuys ?? null} valueLY={m?.weekTotalBuysLY ?? null} format={fmt.currency} yoyVal={yoy(m?.weekTotalBuys ?? null, m?.weekTotalBuysLY ?? null)} />
                          <MetricCell value={m?.weekSellerCount ?? null} valueLY={m?.weekSellerCountLY ?? null} format={fmt.count} yoyVal={yoy(m?.weekSellerCount ?? null, m?.weekSellerCountLY ?? null)} />
                          <MetricCell value={m?.weekItemsPerBuy ?? null} valueLY={m?.weekItemsPerBuyLY ?? null} format={fmt.decimal} yoyVal={yoy(m?.weekItemsPerBuy ?? null, m?.weekItemsPerBuyLY ?? null)} />
                          <MetricCell value={buyRetailPerUnit} format={fmt.currency} />
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-border/80 bg-muted/30">
                    <tr>
                      <td className="px-4 py-3 text-[12px] font-bold text-foreground tracking-wide">Eagle V Total</td>
                      <td className="px-4 py-3 text-right align-top">
                        <div className="text-[13px] font-bold tabular-nums">{totals.buys > 0 ? formatCurrency(totals.buys) : "—"}</div>
                        {totals.buysLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{formatCurrency(totals.buysLY)}</div>}
                        <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(totals.buys || null, totals.buysLY || null)} size="xs" /></div>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <div className="text-[13px] font-bold tabular-nums">{totals.sellerCount > 0 ? totals.sellerCount.toLocaleString() : "—"}</div>
                        {totals.sellerCountLY > 0 && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{totals.sellerCountLY.toLocaleString()}</div>}
                        <div className="mt-1.5 flex justify-end"><TrendBadge value={yoy(totals.sellerCount || null, totals.sellerCountLY || null)} size="xs" /></div>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <div className="text-[13px] font-bold tabular-nums">{avgItemsPerBuy != null ? avgItemsPerBuy.toFixed(2) : "—"}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">avg</div>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <div className="text-[13px] font-bold tabular-nums">{avgBuyRetailPerUnit != null ? formatCurrency(avgBuyRetailPerUnit) : "—"}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">avg</div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── CUSTOMERS ─────────────────────────────────────────────── */}
        {viewMode === "customers" && (
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
                      <TH warn={noData("weekTransactions")}>Shoppers</TH>
                      <TH warn={noData("weekSellerCount")}>Sellers</TH>
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
                          ? (totals.transactions + totals.sellerCount).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground/40 text-[13px]">—</td>
                      <td className="px-4 py-3 text-right text-muted-foreground/40 text-[13px]">—</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── LABOR ─────────────────────────────────────────────────── */}
        {viewMode === "labor" && (
          <motion.div key="labor" {...tm} className="space-y-3">
            {/* ADP pending notice */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/15 text-sm text-amber-300/90">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400/70" />
              <span className="text-[13px]">
                <strong className="font-semibold text-amber-300">Actual Labor Hours</strong> and <strong className="font-semibold text-amber-300">Labor % of Sales</strong> require ADP integration.
                Payroll data appears ~5 days after biweekly close.
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
                      <TH warn={noData("weekLaborHours")}>Proj Labor Hrs</TH>
                      <TH warn>Actual Labor Hrs</TH>
                      <TH warn={noData("weekSales") || noData("weekLaborHours")}>Sales $/hr</TH>
                      <TH warn={noData("weekLaborCostPercent")}>Labor % of Sales</TH>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {stores.map((store) => {
                      const m = store.metrics;
                      const salesPerHour =
                        m?.weekSales && m?.weekLaborHours && m.weekLaborHours > 0
                          ? m.weekSales / m.weekLaborHours : null;
                      return (
                        <tr key={store.id} className="hover:bg-muted/15 transition-colors duration-100">
                          <td className="px-4 py-2.5">
                            <div className="text-[13px] font-semibold">{store.name}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{storeLabel(store)}</div>
                          </td>
                          <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                            {m?.weekLaborHours != null ? fmt.hours(m.weekLaborHours) : <span className="text-muted-foreground/40 font-normal">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right text-[11px] text-muted-foreground/50">Pending ADP</td>
                          <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                            {salesPerHour != null ? formatCurrency(salesPerHour) : <span className="text-muted-foreground/40 font-normal">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right text-[11px] text-muted-foreground/50">Pending ADP</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-border/80 bg-muted/30">
                    <tr>
                      <td className="px-4 py-3 text-[12px] font-bold text-foreground tracking-wide">Eagle V Total</td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">{totals.hours > 0 ? fmt.hours(totals.hours) : "—"}</td>
                      <td className="px-4 py-3 text-right text-[11px] text-muted-foreground/50">Pending ADP</td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                        {totals.hours > 0 && totals.sales > 0
                          ? formatCurrency(totals.sales / totals.hours) : <span className="text-muted-foreground/40 font-normal">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-[11px] text-muted-foreground/50">Pending ADP</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── INVENTORY ──────────────────────────────────────────── */}
        {viewMode === "inventory" && (
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
                      const totDollars   = allInv.reduce((a, i) => a + i.dollarsOnHand,      0);
                      const totQty       = allInv.reduce((a, i) => a + i.qtyOnHand,          0);
                      const totBackroom  = allInv.reduce((a, i) => a + i.binsBackroom,        0);
                      const totCapacity  = allInv.reduce((a, i) => a + i.backroomCapacity,    0);
                      const totOffsite   = allInv.reduce((a, i) => a + i.binsOffsite,         0);
                      const totBins      = totBackroom + totOffsite;
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
        )}

      </AnimatePresence>
    </div>
  );
}
