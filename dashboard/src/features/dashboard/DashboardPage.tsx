import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import {
  BarChart3, PackageOpen, Percent, TrendingUp,
  Users, Clock, Archive, ArrowLeftRight,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useDashboardData } from "./hooks/useDashboardData";
import { useDateRange } from "./hooks/useDateRange";
import { KpiCard } from "./components/KpiCard";
import { DateRangePicker } from "./components/DateRangePicker";
import { TrendBadge } from "./components/TrendBadge";
import { SalesTab } from "./tabs/SalesTab";
import { BuysTab } from "./tabs/BuysTab";
import { SalesVsBuysTab } from "./tabs/SalesVsBuysTab";
import { CustomersTab } from "./tabs/CustomersTab";
import { LaborTab } from "./tabs/LaborTab";
import { InventoryTab } from "./tabs/InventoryTab";
import { yoy } from "./utils/formatters";
import type { ViewMode, DashboardTotals } from "./types";

const TABS: { mode: ViewMode; label: string; icon: React.ElementType }[] = [
  { mode: "sales",         label: "Sales",         icon: BarChart3      },
  { mode: "buys",          label: "Buys",           icon: PackageOpen    },
  { mode: "sales-vs-buys", label: "Sales vs Buys",  icon: ArrowLeftRight },
  { mode: "customers",     label: "Customers",      icon: Users          },
  { mode: "inventory",     label: "Inventory",      icon: Archive        },
  { mode: "labor",         label: "Labor",          icon: Clock          },
];

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("sales");

  const {
    selectedPreset, setSelectedPreset,
    customStart, customEnd,
    setCustomStart, setCustomEnd,
    activeRange,
  } = useDateRange();

  const { data: response, isLoading } = useDashboardData(activeRange);
  const stores    = response?.stores   ?? [];
  const dateRange = response?.dateRange;

  const totals = useMemo<DashboardTotals>(() => {
    const raw = stores.reduce(
      (acc, s) => ({
        sales:           acc.sales           + (s.metrics?.weekSales          ?? 0),
        salesLY:         acc.salesLY         + (s.metrics?.weekSalesLY        ?? 0),
        buys:            acc.buys            + (s.metrics?.weekTotalBuys      ?? 0),
        buysLY:          acc.buysLY          + (s.metrics?.weekTotalBuysLY    ?? 0),
        hours:           acc.hours           + (s.metrics?.weekLaborHours     ?? 0),
        transactions:    acc.transactions    + (s.metrics?.weekTransactions   ?? 0),
        transactionsLY:  acc.transactionsLY  + (s.metrics?.weekTransactionsLY ?? 0),
        sellerCount:     acc.sellerCount     + (s.metrics?.weekSellerCount    ?? 0),
        sellerCountLY:   acc.sellerCountLY   + (s.metrics?.weekSellerCountLY  ?? 0),
        projAnnualSales: acc.projAnnualSales + (s.metrics?.projAnnualSales    ?? 0),
        buyItems:        acc.buyItems + (
          s.metrics?.weekSellerCount && s.metrics?.weekItemsPerBuy
            ? s.metrics.weekSellerCount * s.metrics.weekItemsPerBuy
            : 0
        ),
      }),
      { sales: 0, salesLY: 0, buys: 0, buysLY: 0, hours: 0, transactions: 0,
        transactionsLY: 0, sellerCount: 0, sellerCountLY: 0, projAnnualSales: 0, buyItems: 0 }
    );

    const avgRetailAll    = raw.transactions   > 0 ? raw.sales   / raw.transactions   : 0;
    const avgRetailAllLY  = raw.transactionsLY > 0 ? raw.salesLY / raw.transactionsLY : 0;

    const storesWithMargin   = stores.filter((s) => s.metrics?.weekSellMargin);
    const storesWithMarginLY = stores.filter((s) => s.metrics?.weekSellMarginLY);
    const avgSellMargin   = storesWithMargin.length
      ? storesWithMargin.reduce((a, s) => a + s.metrics!.weekSellMargin!, 0) / storesWithMargin.length : 0;
    const avgSellMarginLY = storesWithMarginLY.length
      ? storesWithMarginLY.reduce((a, s) => a + s.metrics!.weekSellMarginLY!, 0) / storesWithMarginLY.length : 0;

    const storesWithIPS = stores.filter((s) => s.metrics?.weekItemsPerSale);
    const avgItemsPerSale = storesWithIPS.length
      ? storesWithIPS.reduce((a, s) => a + s.metrics!.weekItemsPerSale!, 0) / storesWithIPS.length
      : null;

    const storesWithIPB = stores.filter((s) => s.metrics?.weekItemsPerBuy);
    const avgItemsPerBuy = storesWithIPB.length
      ? storesWithIPB.reduce((a, s) => a + s.metrics!.weekItemsPerBuy!, 0) / storesWithIPB.length
      : null;

    const avgBuyRetailPerUnit = raw.buyItems > 0 && raw.buys > 0
      ? raw.buys / raw.buyItems
      : null;

    return {
      ...raw,
      avgRetailAll,
      avgRetailAllLY,
      avgSellMargin,
      avgSellMarginLY,
      avgItemsPerSale,
      avgItemsPerBuy,
      avgBuyRetailPerUnit,
    };
  }, [stores]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const deltaBadge = (val: number | null) =>
    val != null ? (
      <span className={cn("text-xs font-semibold tabular-nums", val >= 0 ? "text-emerald-400" : "text-rose-400")}>
        {val >= 0 ? "▲" : "▼"} {Math.abs(val).toFixed(1)}% vs LY
      </span>
    ) : undefined;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header + date picker */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Overview</h1>
        <div className="mt-3">
          <DateRangePicker
            selectedPreset={selectedPreset}
            customStart={customStart}
            customEnd={customEnd}
            activeRange={activeRange}
            dateRangeLabel={dateRange?.label}
            onPresetChange={setSelectedPreset}
            onCustomApply={(start, end) => {
              setCustomStart(start);
              setCustomEnd(end);
            }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total Sales"
          value={totals.sales > 0 ? formatCurrency(totals.sales) : "—"}
          icon={BarChart3}
          delay={0}
          delta={deltaBadge(yoy(totals.sales || null, totals.salesLY || null))}
        />
        <KpiCard
          label="Total Buys"
          value={totals.buys > 0 ? formatCurrency(totals.buys) : "—"}
          icon={PackageOpen}
          delay={0.05}
          delta={deltaBadge(yoy(totals.buys || null, totals.buysLY || null))}
        />
        <KpiCard
          label="Avg Sell Margin"
          value={totals.avgSellMargin > 0 ? `${totals.avgSellMargin.toFixed(1)}%` : "—"}
          icon={Percent}
          delay={0.1}
          delta={deltaBadge(yoy(totals.avgSellMargin || null, totals.avgSellMarginLY || null))}
        />
        <KpiCard
          label="Avg Retail"
          value={totals.avgRetailAll > 0 ? formatCurrency(totals.avgRetailAll) : "—"}
          icon={BarChart3}
          delay={0.15}
          delta={deltaBadge(yoy(totals.avgRetailAll || null, totals.avgRetailAllLY || null))}
        />
        <KpiCard
          label="Proj Annual Sales"
          value={totals.projAnnualSales > 0 ? formatCurrency(totals.projAnnualSales) : "—"}
          icon={TrendingUp}
          delay={0.2}
          delta={<span className="text-[11px] text-muted-foreground">all stores · store visit report</span>}
        />
      </div>

      {/* Tab bar */}
      <div className="inline-flex items-center bg-muted/50 rounded-xl p-1 border border-border/60 gap-0.5 flex-wrap">
        {TABS.map(({ mode, label, icon: Icon }) => (
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

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {viewMode === "sales"         && <SalesTab       stores={stores} totals={totals} />}
        {viewMode === "buys"          && <BuysTab        stores={stores} totals={totals} />}
        {viewMode === "sales-vs-buys" && <SalesVsBuysTab stores={stores} totals={totals} />}
        {viewMode === "customers"     && <CustomersTab   stores={stores} totals={totals} />}
        {viewMode === "inventory"     && <InventoryTab   stores={stores} />}
        {viewMode === "labor"         && <LaborTab       stores={stores} totals={totals} />}
      </AnimatePresence>

    </div>
  );
}
