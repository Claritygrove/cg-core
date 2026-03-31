import { Router } from "express";
import { getTokens, refreshIfNeeded } from "./tokenStore.js";
import { QuickBooksClient } from "./qboClient.js";
import { readInputFiles } from "./fileReader.js";

const router = Router();

const STORES = [
  { id: "pc-80237", name: "PC Portage",      type: "platos_closet", location: "6414 S. Westnedge Ave, Portage, MI",      externalId: "80237" },
  { id: "se-60039", name: "SE Portage",      type: "style_encore",  location: "6410 S. Westnedge Ave, Portage, MI",      externalId: "60039" },
  { id: "pc-80185", name: "PC East Lansing", type: "platos_closet", location: "2825 E Grand River Ave, East Lansing, MI", externalId: "80185" },
  { id: "pc-80634", name: "PC Jackson",      type: "platos_closet", location: "1190 N West Ave, Jackson, MI",             externalId: "80634" },
  { id: "pc-80726", name: "PC Ann Arbor",    type: "platos_closet", location: "860 Eisenhower Pkwy, Ann Arbor, MI",       externalId: "80726" },
  { id: "pc-80783", name: "PC Canton",       type: "platos_closet", location: "44720 Ford Rd, Canton, MI",                externalId: "80783" },
  { id: "pc-80877", name: "PC Novi",         type: "platos_closet", location: "43626 West Oaks Dr, Novi, MI",             externalId: "80877" },
];

function getWeekRange() {
  const now = new Date();
  // Monday-based weeks: getDay() returns 0=Sun, 1=Mon … so offset by (day + 6) % 7
  const daysFromMonday = (now.getDay() + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysFromMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const endDate = now.toISOString().split("T")[0]!;
  const startDate = startOfWeek.toISOString().split("T")[0]!;
  return { startDate, endDate };
}

function formatDateRangeLabel(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return `${fmt.format(s)} – ${fmt.format(e)}`;
}

router.get("/debug/qbo-columns", async (_req, res) => {
  let tokens = await getTokens();
  if (!tokens) { res.json({ error: "Not connected" }); return; }
  try {
    tokens = await refreshIfNeeded(tokens);
    const client = new QuickBooksClient(tokens.accessToken, tokens.realmId);
    const { startDate, endDate } = getWeekRange();
    const raw = await (client as any).request(
      `/reports/ProfitAndLossByClass?start_date=${startDate}&end_date=${endDate}&accounting_method=Accrual`
    );
    const cols = raw.Columns?.Column?.map((c: any) => c.ColTitle) ?? [];
    res.json({ startDate, endDate, columns: cols });
  } catch (e) {
    res.json({ error: e instanceof Error ? e.message : String(e) });
  }
});

router.get("/stores", async (req, res) => {
  const queryStart = typeof req.query.startDate === "string" ? req.query.startDate : null;
  const queryEnd   = typeof req.query.endDate   === "string" ? req.query.endDate   : null;
  const defaultRange = getWeekRange();
  const startDate = queryStart ?? defaultRange.startDate;
  const endDate   = queryEnd   ?? defaultRange.endDate;
  const isCustomRange = queryStart !== null || queryEnd !== null;

  let tokens = await getTokens();

  // No QBO connection — read from 01-inputs/ files
  if (!tokens) {
    const fileData = await readInputFiles();
    const anyLabel = [...fileData.values()].find((d) => d.weekLabel)?.weekLabel;
    const stores = STORES.map((s) => {
      const d = fileData.get(s.id);
      return {
        ...s,
        metrics: d ? {
          weekSales: d.weekSales ?? null,
          weekSalesLY: d.weekSalesLY ?? null,
          weekTransactions: d.weekTransactions ?? null,
          weekTransactionsLY: d.weekTransactionsLY ?? null,
          weekAvgRetail: d.weekAvgRetail ?? null,
          weekAvgRetailLY: d.weekAvgRetailLY ?? null,
          weekItemsPerSale: d.weekItemsPerSale ?? null,
          weekItemsPerSaleLY: d.weekItemsPerSaleLY ?? null,
          weekSellMargin: d.weekSellMargin ?? null,
          weekSellMarginLY: d.weekSellMarginLY ?? null,
          projAnnualSales: d.projAnnualSales ?? null,
          weekTotalBuys: d.weekTotalBuys ?? null,
          weekTotalBuysLY: d.weekTotalBuysLY ?? null,
          weekSellerCount: d.weekSellerCount ?? null,
          weekSellerCountLY: d.weekSellerCountLY ?? null,
          weekItemsPerBuy: d.weekItemsPerBuy ?? null,
          weekItemsPerBuyLY: d.weekItemsPerBuyLY ?? null,
          weekLaborHours: d.scheduledHours ?? null,
          weekLaborCostPercent: null,
          weekLoyaltyVisits: null,
        } : null,
      };
    });
    res.json({
      stores,
      dateRange: {
        start: startDate,
        end: endDate,
        label: anyLabel ?? formatDateRangeLabel(startDate, endDate),
        dataSource: "files" as const,
        isCustomRange,
      },
    });
    return;
  }

  try {
    tokens = await refreshIfNeeded(tokens);
    const client = new QuickBooksClient(tokens.accessToken, tokens.realmId);
    const result = await client.getStoreMetrics(startDate, endDate);

    const metricsByExternalId = new Map(
      result.stores.map((s) => [s.storeExternalId, s])
    );

    const stores = STORES.map((store) => {
      const m = metricsByExternalId.get(store.externalId);
      return {
        ...store,
        metrics: m
          ? {
              // QBO currently feeds expenses only — sales come from Winmark CSV
              weekSales: null,
              weekSalesLY: null,
              weekLaborHours: null,
              weekLaborCostPercent: null,
              weekLoyaltyVisits: null,
              weekTransactions: null,
              weekTransactionsLY: null,
            }
          : null,
      };
    });

    res.json({
      stores,
      dateRange: {
        start: startDate,
        end: endDate,
        label: formatDateRangeLabel(startDate, endDate),
        dataSource: "qbo" as const,
        isCustomRange,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "QBO sync failed";
    console.error("QBO fetch error — falling back to files:", msg);

    // QBO auth/network failure: fall back to CSV/XLSX files so data still shows
    const fileData = await readInputFiles();
    const anyLabel = [...fileData.values()].find((d) => d.weekLabel)?.weekLabel;
    const stores = STORES.map((s) => {
      const d = fileData.get(s.id);
      return {
        ...s,
        metrics: d ? {
          weekSales: d.weekSales ?? null,
          weekSalesLY: d.weekSalesLY ?? null,
          weekTransactions: d.weekTransactions ?? null,
          weekTransactionsLY: d.weekTransactionsLY ?? null,
          weekAvgRetail: d.weekAvgRetail ?? null,
          weekAvgRetailLY: d.weekAvgRetailLY ?? null,
          weekItemsPerSale: d.weekItemsPerSale ?? null,
          weekItemsPerSaleLY: d.weekItemsPerSaleLY ?? null,
          weekSellMargin: d.weekSellMargin ?? null,
          weekSellMarginLY: d.weekSellMarginLY ?? null,
          projAnnualSales: d.projAnnualSales ?? null,
          weekTotalBuys: d.weekTotalBuys ?? null,
          weekTotalBuysLY: d.weekTotalBuysLY ?? null,
          weekSellerCount: d.weekSellerCount ?? null,
          weekSellerCountLY: d.weekSellerCountLY ?? null,
          weekItemsPerBuy: d.weekItemsPerBuy ?? null,
          weekItemsPerBuyLY: d.weekItemsPerBuyLY ?? null,
          weekLaborHours: d.scheduledHours ?? null,
          weekLaborCostPercent: null,
          weekLoyaltyVisits: null,
        } : null,
      };
    });
    res.json({
      stores,
      dateRange: {
        start: startDate,
        end: endDate,
        label: anyLabel ?? formatDateRangeLabel(startDate, endDate),
        dataSource: "files" as const,
        isCustomRange,
      },
    });
  }
});

export default router;
