export type ViewMode = "sales" | "buys" | "sales-vs-buys" | "customers" | "inventory" | "labor";
export type PresetKey = "last-week" | "last-month" | "ytd" | "custom";

export interface StoreMetrics {
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
  weekLaborHours: number | null;        // WIW scheduled hours (projected)
  weekActualLaborHours: number | null;  // ADP actual hours (pending integration)
  weekLaborCostPercent: number | null;
  weekLoyaltyVisits: number | null;
}

export interface Store {
  id: string;
  name: string;
  type: string;
  location: string;
  metrics: StoreMetrics | null;
}

export interface ApiDateRange {
  start: string;
  end: string;
  label: string;
  dataSource: "files" | "qbo";
  isCustomRange: boolean;
}

export interface StoresResponse {
  stores: Store[];
  dateRange: ApiDateRange;
}

export interface DashboardTotals {
  sales: number;
  salesLY: number;
  buys: number;
  buysLY: number;
  hours: number;
  transactions: number;
  transactionsLY: number;
  sellerCount: number;
  sellerCountLY: number;
  projAnnualSales: number;
  buyItems: number;
  // Derived averages
  avgRetailAll: number;
  avgRetailAllLY: number;
  avgSellMargin: number;
  avgSellMarginLY: number;
  avgItemsPerSale: number | null;
  avgItemsPerBuy: number | null;
  avgBuyRetailPerUnit: number | null;
}
