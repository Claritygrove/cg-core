import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, RefreshCw, Calendar,
  BarChart2, ShoppingBag,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoreVisitData {
  storeId: string;
  storeNum: string;
  dateRange: string;
  sales: number | null;
  salesLY: number | null;
  salesComp: string | null;
  avgTrx: number | null;
  avgTrxLY: number | null;
  avgTrxComp: string | null;
  avgItems: number | null;
  avgItemsLY: number | null;
  trxCount: number | null;
  trxCountLY: number | null;
  gmPct: string | null;
  gmPctLY: string | null;
  gmDol: number | null;
  buys: number | null;
  buysLY: number | null;
  buysComp: string | null;
  buyCount: number | null;
  buyCountLY: number | null;
  avgItemsPerBuy: number | null;
  unitCost: number | null;
  unitRetail: number | null;
}

interface KpiData {
  storeId: string;
  storeNum: string;
  asOfDate: string;
  currentInventoryCost: number | null;
  lyInventoryCost: number | null;
}

interface AvailableRanges {
  storeVisitRanges: { startDate: string; endDate: string; stores: string[] }[];
  kpiAvailable: boolean;
}

interface StoreVisitResponse {
  startDate: string;
  endDate: string;
  stores: StoreVisitData[];
}

interface KpiResponse {
  stores: KpiData[];
}

// ── Store names ───────────────────────────────────────────────────────────────

const STORE_NAMES: Record<string, string> = {
  "pc-80237": "PC Portage",
  "se-60039": "SE Portage",
  "pc-80185": "PC East Lansing",
  "pc-80634": "PC Jackson",
  "pc-80726": "PC Ann Arbor",
  "pc-80783": "PC Canton",
  "pc-80877": "PC Novi",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number | null, decimals = 0): string {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);
}

function fmtN(n: number | null, decimals = 0): string {
  if (n === null) return "—";
  return n.toFixed(decimals);
}

function fmtCount(n: number | null): string {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

function CompBadge({ comp }: { comp: string | null }) {
  if (!comp) return <span className="text-muted-foreground text-[11px]">—</span>;
  const val = parseFloat(comp.replace("%", ""));
  const pos = val >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        pos ? "text-emerald-400" : "text-rose-400"
      }`}
    >
      {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {comp}
    </span>
  );
}

function Metric({
  label,
  value,
  valueLabel,
  ly,
  lyLabel,
  comp,
}: {
  label: string;
  value: string;
  valueLabel?: string;
  ly?: string;
  lyLabel?: string;
  comp?: string | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
      {ly && (
        <span className="text-[10px] text-muted-foreground">
          LY: {ly}
        </span>
      )}
      {comp !== undefined && <CompBadge comp={comp ?? null} />}
    </div>
  );
}

// ── Store Visit Card ──────────────────────────────────────────────────────────

function StoreVisitCard({ d }: { d: StoreVisitData }) {
  const name = STORE_NAMES[d.storeId] ?? d.storeId;
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">{name}</h3>
          <p className="text-[10px] text-muted-foreground">{d.dateRange}</p>
        </div>
        <span className="text-[10px] bg-muted/60 border border-border/40 rounded-full px-2 py-0.5 text-muted-foreground">
          #{d.storeNum}
        </span>
      </div>

      {/* Sales grid */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> Sales
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Total Sales" value={fmt$(d.sales)} ly={fmt$(d.salesLY)} comp={d.salesComp} />
          <Metric label="Avg Ticket" value={fmt$(d.avgTrx, 2)} ly={fmt$(d.avgTrxLY, 2)} comp={d.avgTrxComp} />
          <Metric label="Items / Sale" value={fmtN(d.avgItems, 2)} ly={fmtN(d.avgItemsLY, 2)} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Metric label="Transactions" value={fmtCount(d.trxCount)} ly={fmtCount(d.trxCountLY)} />
          <Metric label="GM %" value={d.gmPct ?? "—"} ly={d.gmPctLY ?? undefined} />
          <Metric label="GM $" value={fmt$(d.gmDol)} />
        </div>
      </div>

      <div className="border-t border-border/30" />

      {/* Buys grid */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
          <ShoppingBag className="h-3 w-3" /> Buys
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Total Buys" value={fmt$(d.buys)} ly={fmt$(d.buysLY)} comp={d.buysComp} />
          <Metric label="Buy Count" value={fmtCount(d.buyCount)} ly={fmtCount(d.buyCountLY)} />
          <Metric label="Items / Buy" value={fmtN(d.avgItemsPerBuy, 1)} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Metric label="Avg Unit Cost" value={fmt$(d.unitCost, 2)} />
          <Metric label="Avg Unit Retail" value={fmt$(d.unitRetail, 2)} />
        </div>
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ d }: { d: KpiData }) {
  const name = STORE_NAMES[d.storeId] ?? d.storeId;
  const invComp =
    d.currentInventoryCost !== null && d.lyInventoryCost !== null && d.lyInventoryCost > 0
      ? (((d.currentInventoryCost - d.lyInventoryCost) / d.lyInventoryCost) * 100).toFixed(1) + "%"
      : null;

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">{name}</h3>
          <p className="text-[10px] text-muted-foreground">As of {d.asOfDate}</p>
        </div>
        <span className="text-[10px] bg-muted/60 border border-border/40 rounded-full px-2 py-0.5 text-muted-foreground">
          #{d.storeNum}
        </span>
      </div>
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Inventory (at cost)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Metric label="Current Cost" value={fmt$(d.currentInventoryCost)} comp={invComp} />
          <Metric label="Last Year Cost" value={fmt$(d.lyInventoryCost)} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type TabType = "store-visit" | "kpi";

export default function Reports() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabType>("store-visit");

  // Date range state
  const today = new Date().toISOString().split("T")[0]!;
  const firstOfMonth = today.slice(0, 8) + "01";
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);

  // Available ranges
  const { data: available } = useQuery<AvailableRanges>({
    queryKey: ["reports-available"],
    queryFn: () => fetch("/api/reports/available").then((r) => r.json()),
  });

  // Store visit data
  const svQuery = useQuery<StoreVisitResponse>({
    queryKey: ["report-sv", startDate, endDate],
    queryFn: () =>
      fetch(`/api/reports/store-visit?start=${startDate}&end=${endDate}`).then((r) => r.json()),
    enabled: tab === "store-visit",
  });

  // KPI data
  const kpiQuery = useQuery<KpiResponse>({
    queryKey: ["report-kpi"],
    queryFn: () => fetch("/api/reports/kpi").then((r) => r.json()),
    enabled: tab === "kpi",
  });

  // Pull status polling
  const { data: pullStatus } = useQuery<{ inProgress: boolean }>({
    queryKey: ["pull-status"],
    queryFn: () => fetch("/api/reports/pull-status").then((r) => r.json()),
    refetchInterval: 5000,
  });

  // Trigger pull
  const pullMutation = useMutation({
    mutationFn: (body: { type: string; start?: string; end?: string }) =>
      fetch("/api/reports/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pull-status"] });
    },
  });

  const isPulling = pullStatus?.inProgress || pullMutation.isPending;

  function triggerPull() {
    pullMutation.mutate({
      type: tab === "kpi" ? "kpi" : "store-visit",
      start: startDate,
      end: endDate,
    });
  }

  function loadRange(startDate: string, endDate: string) {
    setStartDate(startDate);
    setEndDate(endDate);
  }

  const svStores = svQuery.data?.stores ?? [];
  const kpiStores = kpiQuery.data?.stores ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Store visit summaries and KPI snapshots from Winmark
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-muted/50 rounded-lg p-0.5 border border-border/40 w-fit">
        {(["store-visit", "kpi"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-all ${
              tab === t
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "store-visit" ? (
              <span className="flex items-center gap-1.5"><BarChart2 className="h-3.5 w-3.5" />Store Visit</span>
            ) : (
              <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />KPI Snapshot</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex items-end gap-3 flex-wrap">
        {tab === "store-visit" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-[12px] bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-[12px] bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>

            {/* Quick selectors */}
            {available && available.storeVisitRanges.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Available Pulls</label>
                <div className="flex gap-1.5 flex-wrap">
                  {available.storeVisitRanges.slice(0, 5).map((r) => (
                    <button
                      key={`${r.startDate}|${r.endDate}`}
                      onClick={() => loadRange(r.startDate, r.endDate)}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium transition-colors ${
                        startDate === r.startDate && endDate === r.endDate
                          ? "bg-primary/15 border-primary/30 text-primary"
                          : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {r.startDate} → {r.endDate}
                      <span className="ml-1 text-[9px] opacity-60">({r.stores.length} stores)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col gap-1 ml-auto">
          {tab === "kpi" && (
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Latest KPI snapshot from daily pull
            </label>
          )}
          <button
            onClick={triggerPull}
            disabled={isPulling}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPulling ? "animate-spin" : ""}`} />
            {isPulling ? "Pulling data…" : "Pull Now"}
          </button>
          {isPulling && (
            <p className="text-[10px] text-muted-foreground text-right">
              This takes 2–5 min per store. Refresh the page when done.
            </p>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {tab === "store-visit" && (
        <>
          {svQuery.isLoading && (
            <div className="text-sm text-muted-foreground text-center py-12">Loading…</div>
          )}
          {!svQuery.isLoading && svStores.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                No store visit data found for {startDate} → {endDate}.
              </p>
              <p className="text-[12px] text-muted-foreground/70">
                Click <strong>Pull Now</strong> to fetch this date range from Winmark.
              </p>
            </div>
          )}
          {svStores.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {svStores
                .sort((a, b) => (a.storeId > b.storeId ? 1 : -1))
                .map((d) => (
                  <StoreVisitCard key={d.storeId} d={d} />
                ))}
            </div>
          )}
        </>
      )}

      {tab === "kpi" && (
        <>
          {kpiQuery.isLoading && (
            <div className="text-sm text-muted-foreground text-center py-12">Loading…</div>
          )}
          {!kpiQuery.isLoading && kpiStores.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <BarChart2 className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                No KPI data available yet.
              </p>
              <p className="text-[12px] text-muted-foreground/70">
                Click <strong>Pull Now</strong> to fetch today's KPI snapshot from Winmark.
              </p>
            </div>
          )}
          {kpiStores.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {kpiStores
                .sort((a, b) => (a.storeId > b.storeId ? 1 : -1))
                .map((d) => (
                  <KpiCard key={d.storeId} d={d} />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
